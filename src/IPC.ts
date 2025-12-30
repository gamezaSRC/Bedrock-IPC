/**
 * @license MIT
 * @copyright 2025 gameza_src
 *
 * Bedrock-IPC: Inter Pack Communication for Minecraft Bedrock
 *
 * Features:
 * - Bidirectional Communication: Request-response with invoke/handle
 * - Rich Type Support: Primitives, objects, arrays, maps, and custom types
 * - Channel-Based: Organize communication with named channels
 * - Low-Level Access: Direct endpoint control with NET
 * - Auto-Fragmentation: Handles large messages automatically
 */

import { IPCClient } from './client/IPCClient';
import type { Serializer } from './proto/Serializer';
export * as PROTO from './proto/index';
export { IPCClient } from './client/IPCClient';

/** Shared IPC client instance */
const CLIENT = new IPCClient();

/**
 * IPC - Static facade for Inter-Pack Communication
 * @description Uses a shared IPCClient instance internally
 */
export class IPC {
  /**
   * Sends a one-way message to all listeners on a channel
   * @param channel - Channel identifier
   * @param serializer - Serializer for the value
   * @param value - Data to send
   */
  static send<T>(channel: string, serializer: Serializer<T>, value: T): void {
    CLIENT.send(channel, serializer, value);
  }

  /**
   * Sends a request and waits for a response asynchronously
   * @param channel - Channel identifier
   * @param serializer - Serializer for request
   * @param value - Request data
   * @param deserializer - Deserializer for response
   * @returns Promise that resolves to the response
   */
  static invoke<TReq, TRes>(
    channel: string,
    serializer: Serializer<TReq>,
    value: TReq,
    deserializer: Serializer<TRes>
  ): Promise<TRes> {
    return CLIENT.invoke(channel, serializer, value, deserializer);
  }

  /**
   * Listens to all messages on a channel (multiple times)
   * @param channel - Channel identifier
   * @param deserializer - Deserializer for incoming data
   * @param listener - Callback function
   * @returns Function to unsubscribe
   */
  static on<T>(
    channel: string,
    deserializer: Serializer<T>,
    listener: (value: T) => Generator<void, void> | void
  ): () => void {
    return CLIENT.on(channel, deserializer, listener);
  }

  /**
   * Listens to ONE message on a channel, then auto-unsubscribes
   * @param channel - Channel identifier
   * @param deserializer - Deserializer for incoming data
   * @param listener - Callback function
   * @returns Function to unsubscribe (can be called manually if needed)
   */
  static once<T>(
    channel: string,
    deserializer: Serializer<T>,
    listener: (value: T) => Generator<void, void> | void
  ): () => void {
    return CLIENT.once(channel, deserializer, listener);
  }

  /**
   * Registers a handler to respond to invoke requests
   * @param channel - Channel identifier
   * @param deserializer - Deserializer for requests
   * @param serializer - Serializer for responses
   * @param handler - Callback that returns response
   * @returns Function to unsubscribe
   */
  static handle<TReq, TRes>(
    channel: string,
    deserializer: Serializer<TReq>,
    serializer: Serializer<TRes>,
    handler: (request: TReq) => TRes | Generator<void, TRes>
  ): () => void {
    return CLIENT.handle(channel, deserializer, serializer, handler);
  }

  /**
   * Closes the IPC client and cleans up resources
   */
  static close(): void {
    CLIENT.close();
  }
}

export default IPC;
