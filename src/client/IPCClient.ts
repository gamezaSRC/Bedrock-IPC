import { system } from '@minecraft/server';
import { EndpointManager } from '../net/EndpointManager';
import { MessageEmitter } from '../net/messages/MessageEmitter';
import { MessageListener, type MessageCallback } from '../net/messages/MessageListener';
import type { Serializer } from '../proto/Serializer';

/**
 * High-level IPC communication interface
 * Follows Facade pattern to simplify complex network operations
 */
export class IPCClient {
  private endpointManager: EndpointManager;
  private messageEmitter: MessageEmitter;
  private messageListener: MessageListener;

  /**
   * Creates a new IPCClient instance
   */
  constructor() {
    this.endpointManager = new EndpointManager();
    this.messageEmitter = new MessageEmitter();
    this.messageListener = new MessageListener(this.endpointManager);
    this.messageListener.initialize();
  }

  /**
   * Sends a message to all listeners on a channel
   * @param channel - Channel identifier
   * @param serializer - Serializer for the message
   * @param value - Value to send
   */
  send<T>(channel: string, serializer: Serializer<T>, value: T): void {
    system.runJob(this.messageEmitter.emit(`ipc:${channel}:send`, serializer, value));
  }

  /**
   * Sends a request and waits for a response asynchronously
   * @param channel - Channel identifier
   * @param serializer - Serializer for the request
   * @param value - Value to send
   * @param deserializer - Deserializer for the response
   * @returns Promise resolving to the response
   */
  invoke<TReq, TRes>(
    channel: string,
    serializer: Serializer<TReq>,
    value: TReq,
    deserializer: Serializer<TRes>
  ): Promise<TRes> {
    system.runJob(this.messageEmitter.emit(`ipc:${channel}:invoke`, serializer, value));

    return new Promise((resolve) => {
      const terminate = this.messageListener.listen(
        `ipc:${channel}:handle`,
        deserializer,
        function* (response: TRes) {
          resolve(response);
          terminate();
        }
      );
    });
  }

  /**
   * Listens to all messages on a channel
   * @param channel - Channel identifier
   * @param deserializer - Deserializer for the message
   * @param listener - Callback function (can be generator or normal)
   * @returns Unsubscribe function
   */
  on<T>(
    channel: string,
    deserializer: Serializer<T>,
    listener: (value: T) => Generator<void, void> | void
  ): () => void {
    return this.messageListener.listen(
      `ipc:${channel}:send`,
      deserializer,
      function* (value: T) {
        const result = listener(value);
        if (result && typeof result !== 'string' && !globalThis.Array.isArray(result) && typeof (result as Generator)[Symbol.iterator] === 'function') {
          yield* result as Generator<void, void>;
        }
      }
    );
  }

  /**
   * Listens to ONE message on a channel, then auto-unsubscribes
   * @param channel - Channel identifier
   * @param deserializer - Deserializer for the message
   * @param listener - Callback function (can be generator or normal)
   * @returns Unsubscribe function
   */
  once<T>(
    channel: string,
    deserializer: Serializer<T>,
    listener: (value: T) => Generator<void, void> | void
  ): () => void {
    const terminate = this.messageListener.listen(
      `ipc:${channel}:send`,
      deserializer,
      function* (value: T) {
        const result = listener(value);
        if (result && typeof result !== 'string' && !globalThis.Array.isArray(result) && typeof (result as Generator)[Symbol.iterator] === 'function') {
          yield* result as Generator<void, void>;
        }
        terminate();
      }
    );
    return terminate;
  }

  /**
   * Registers a handler to respond to invoke requests
   * @param channel - Channel identifier
   * @param deserializer - Deserializer for the request
   * @param serializer - Serializer for the response
   * @param handler - Handler callback that returns response (can be generator or normal)
   * @returns Unsubscribe function
   */
  handle<TReq, TRes>(
    channel: string,
    deserializer: Serializer<TReq>,
    serializer: Serializer<TRes>,
    handler: (request: TReq) => TRes | Generator<void, TRes>
  ): () => void {
    const emitter = this.messageEmitter;

    return this.messageListener.listen(
      `ipc:${channel}:invoke`,
      deserializer,
      function* (request: TReq) {
        const result = handler(request);
        const response = (result && typeof result !== 'string' && !globalThis.Array.isArray(result) && typeof (result as Generator)[Symbol.iterator] === 'function')
          ? yield* (result as Generator<void, TRes>)
          : result as TRes;
        yield* emitter.emit(`ipc:${channel}:handle`, serializer, response);
      }
    );
  }

  /**
   * Closes the IPC client and cleans up resources
   */
  close(): void {
    this.messageListener.close();
    this.endpointManager.clearAll();
  }
}
