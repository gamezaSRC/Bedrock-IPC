import { system, ScriptEventSource, ScriptEventCommandMessageAfterEvent } from '@minecraft/server';
import * as PROTO from '../../proto/index';
import { PacketEncoder } from '../encoding/PacketEncoder';
import { HeaderSerializer, type HeaderData } from '../encoding/Header';
import { HeaderCodec } from '../encoding/HeaderCodec';
import { EndpointManager } from '../EndpointManager';
import type { Serializer } from '../../proto/Serializer';

/**
 * Fragment buffer entry
 */
interface FragmentEntry {
  size: number;
  fragments: string[];
  received: Set<number>;
}

/**
 * Listener callback type
 */
export type MessageCallback<T> = (value: T) => Generator<void, void> | void;

/**
 * Handles incoming message reception and defragmentation
 */
export class MessageListener {
  private endpointManager: EndpointManager;
  private initialized: boolean = false;

  /**
   * Creates a new MessageListener
   * @param endpointManager - Endpoint manager instance
   */
  constructor(endpointManager: EndpointManager) {
    this.endpointManager = endpointManager;
  }

  /**
   * Initializes the listener
   */
  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    system.afterEvents.scriptEventReceive.subscribe((event) => {
      system.runJob(this.handleEvent(event));
    });
  }

  /**
   * Handles incoming script events
   * @param event - Script event
   */
  private *handleEvent(event: ScriptEventCommandMessageAfterEvent): Generator<void, void> {
    if (event.sourceType !== ScriptEventSource.Server) return;
    const [encodedEndpoint, encodedHeader] = event.id.split(':');
    const endpointBuffer = yield* HeaderCodec.decodeFromHex(encodedEndpoint);
    const endpoint = yield* PROTO.String.deserialize(endpointBuffer);
    const listeners = this.endpointManager.getListeners(endpoint);
    if (!listeners || listeners.length === 0) return;
    const headerBuffer = yield* HeaderCodec.decodeFromHex(encodedHeader);
    const header = (yield* HeaderSerializer.deserialize(headerBuffer)) as HeaderData;
    const errors: Error[] = [];
    for (const listener of listeners) {
      try {
        yield* listener(header, event.message);
      } catch (e) {
        console.error('Listener error:', e);
        errors.push(e as Error);
      }
    }
    if (errors.length > 0) {
      console.error('Total errors:', errors.length);
      errors.forEach((err, i) => console.error(`Error ${i}:`, err));
    }
  }

  /**
   * Registers a listener for an endpoint with message reassembly
   * @param endpoint - Endpoint identifier
   * @param deserializer - Deserializer for the message
   * @param callback - Generator callback to invoke with deserialized message
   * @returns Unsubscribe function
   */
  listen<T>(
    endpoint: string,
    deserializer: Serializer<T>,
    callback: MessageCallback<T>
  ): () => void {
    const fragmentBuffer = new Map<string, FragmentEntry>();

    const listener = function* (header: HeaderData, fragment: string): Generator<void, void> {
      let entry = fragmentBuffer.get(header.guid);
      if (!entry) {
        entry = { size: -1, fragments: [], received: new Set() };
        fragmentBuffer.set(header.guid, entry);
      }
      if (header.isFinal) {
        entry.size = header.index + 1;
      }
      entry.fragments[header.index] = fragment;
      entry.received.add(header.index);
      if (entry.size !== -1 && entry.received.size === entry.size) {
        try {
          const fragmentsCopy: string[] = [];
          for (let i = 0; i < entry.size; i++) {
            if (!entry.fragments[i]) {
              throw new Error(`Missing fragment at index ${i}`);
            }
            fragmentsCopy.push(entry.fragments[i]);
          }
          const dataBuffer = yield* PacketEncoder.decode(fragmentsCopy);
          fragmentBuffer.delete(header.guid);
          const value = yield* deserializer.deserialize(dataBuffer);
          const callbackResult = callback(value);
          if (callbackResult && typeof (callbackResult as Generator).next === 'function') {
            yield* callbackResult as Generator<void, void>;
          }
        } catch (decodeErr) {
          console.error('Decode/deserialize error:', decodeErr);
          console.error('Stack trace:', (decodeErr as Error).stack);
          throw decodeErr;
        }
      }
    };

    return this.endpointManager.register(endpoint, listener as (header: unknown, fragment: string) => Generator<void, void>);
  }

  /**
   * Closes the listener and cleans up
   */
  close(): void {
    this.endpointManager.clearAll();
  }
}
