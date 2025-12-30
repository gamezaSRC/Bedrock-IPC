import { EndpointManager } from './net/EndpointManager';
import { MessageEmitter } from './net/messages/MessageEmitter';
import { MessageListener } from './net/messages/MessageListener';
import { PacketEncoder } from './net/encoding/PacketEncoder';
import type { ByteBuffer } from './proto/ByteBuffer';
import type { Serializer } from './proto/Serializer';

/**
 * NET class - Low-level network access
 * @description Use this for direct endpoint control (bypasses channel abstraction)
 */
export class NET {
  /**
   * Maximum fragment size for network messages (2048 bytes)
   */
  static readonly FRAG_MAX: number = PacketEncoder.MAX_FRAGMENT_SIZE;

  /** Endpoint manager instance */
  private static endpointManager: EndpointManager = new EndpointManager();

  /** Message emitter instance */
  private static emitter: MessageEmitter = new MessageEmitter();

  /** Message listener instance */
  private static listener: MessageListener | null = null;

  /**
   * Sends a message to a specific endpoint
   * @description Use with system.runJob() for async execution
   * @example
   * system.runJob(NET.emit('custom:endpoint', PROTO.String, 'Data'));
   * @param endpoint - Target endpoint
   * @param serializer - Serializer for the message
   * @param value - Value to send
   * @yields Generator function for system.runJob()
   */
  static *emit<T>(endpoint: string, serializer: Serializer<T>, value: T): Generator<void, void> {
    yield* NET.emitter.emit(endpoint, serializer, value);
  }

  /**
   * Listens on a specific endpoint
   * @example
   * NET.listen('custom:endpoint', PROTO.String, function* (message) {
   *     console.log('Received:', message);
   * });
   * @param endpoint - Endpoint identifier
   * @param deserializer - Deserializer for incoming data
   * @param callback - Generator callback
   * @returns Unsubscribe function
   */
  static listen<T>(
    endpoint: string,
    deserializer: Serializer<T>,
    callback: (value: T) => Generator<void, void> | void
  ): () => void {
    if (!NET.listener) {
      NET.listener = new MessageListener(NET.endpointManager);
      NET.listener.initialize();
    }
    return NET.listener.listen(endpoint, deserializer, callback);
  }

  /**
   * Serializes a buffer to network fragments
   * @param buffer - ByteBuffer to serialize
   * @param maxSize - Maximum fragment size
   * @returns Generator yielding string array of fragments
   */
  static *serialize(buffer: ByteBuffer, maxSize: number): Generator<void, string[]> {
    return yield* PacketEncoder.encode(buffer, maxSize);
  }

  /**
   * Deserializes network fragments back to a buffer
   * @param fragments - Array of fragment strings
   * @returns Generator yielding ByteBuffer
   */
  static *deserialize(fragments: string[]): Generator<void, ByteBuffer> {
    return yield* PacketEncoder.decode(fragments);
  }
}

export default NET;
