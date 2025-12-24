/**
 * IPC System
 * 
 * Architecture:
 * - proto/: Protocol layer (serialization, buffer management)
 * - net/: Network layer (message fragmentation, routing)
 * - ipc/: Application layer (high-level IPC interface)
 */
import { IPCClient } from './client/IPCClient.js';
export * as PROTO from './proto/index.js';
const CLIENT = new IPCClient();
class IPC {
    /**
     * Sends a message with args to channel
     * @param {string} channel - Channel identifier
     * @param {Object} serializer - Serializer for the message
     * @param {*} value - Value to send
     */
    static send(channel, serializer, value) {
        CLIENT.send(channel, serializer, value);
    }

    /**
     * Sends an invoke message through IPC, and expects a result asynchronously
     * @param {string} channel - Channel identifier
     * @param {Object} serializer - Serializer for the request
     * @param {*} value - Value to send
     * @param {Object} deserializer - Deserializer for the response
     * @returns {Promise<*>} Promise resolving to the response
     */
    static invoke(channel, serializer, value, deserializer) {
        return CLIENT.invoke(channel, serializer, value, deserializer);
    }

    /**
     * Listens to channel. When a new message arrives, listener will be called
     * @param {string} channel - Channel identifier
     * @param {Object} deserializer - Deserializer for the message
     * @param {Function} listener - Listener callback
     * @returns {Function} Unsubscribe function
     */
    static on(channel, deserializer, listener) {
        return CLIENT.on(channel, deserializer, listener);
    }

    /**
     * Listens to channel once. When a new message arrives, listener will be called and then removed
     * @param {string} channel - Channel identifier
     * @param {Object} deserializer - Deserializer for the message
     * @param {Function} listener - Listener callback
     * @returns {Function} Unsubscribe function
     */
    static once(channel, deserializer, listener) {
        return CLIENT.once(channel, deserializer, listener);
    }

    /**
     * Adds a handler for an invoke IPC
     * @param {string} channel - Channel identifier
     * @param {Object} deserializer - Deserializer for the request
     * @param {Object} serializer - Serializer for the response
     * @param {Function} listener - Handler callback
     * @returns {Function} Unsubscribe function
     */
    static handle(channel, deserializer, serializer, listener) {
        return CLIENT.handle(channel, deserializer, serializer, listener);
    }

    /**
     * Closes the IPC client and cleans up resources
     */
    static close() {
        CLIENT.close();
    }
};

export default IPC;
