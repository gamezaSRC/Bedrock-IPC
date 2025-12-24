import { system } from '@minecraft/server';
import { EndpointManager } from '../net/EndpointManager.js';
import { MessageEmitter } from '../net/MessageEmitter.js';
import { MessageListener } from '../net/MessageListener.js';

/**
 * IPCClient class
 * High-level IPC communication interface
 * Follows Facade pattern to simplify complex network operations
 * Implements Dependency Inversion - depends on abstractions (net layer)
 */
export class IPCClient {
    /**
     * @private
     * @type {EndpointManager}
     */
    #endpointManager;

    /**
     * @private
     * @type {MessageEmitter}
     */
    #messageEmitter;

    /**
     * @private
     * @type {MessageListener}
     */
    #messageListener;

    /**
     * Creates a new IPCClient instance
     */
    constructor() {
        this.#endpointManager = new EndpointManager();
        this.#messageEmitter = new MessageEmitter();
        this.#messageListener = new MessageListener(this.#endpointManager);
        this.#messageListener.initialize();
    }

    /**
     * Sends a message with args to channel
     * @param {string} channel - Channel identifier
     * @param {Object} serializer - Serializer for the message
     * @param {*} value - Value to send
     */
    send(channel, serializer, value) {
        system.runJob(this.#messageEmitter.emit(`ipc:${channel}:send`, serializer, value));
    }

    /**
     * Sends an invoke message through IPC, and expects a result asynchronously
     * @param {string} channel - Channel identifier
     * @param {Object} serializer - Serializer for the request
     * @param {*} value - Value to send
     * @param {Object} deserializer - Deserializer for the response
     * @returns {Promise<*>} Promise resolving to the response
     */
    invoke(channel, serializer, value, deserializer) {
        system.runJob(this.#messageEmitter.emit(`ipc:${channel}:invoke`, serializer, value));
        return new Promise(resolve => {
            const terminate = this.#messageListener.listen(
                `ipc:${channel}:handle`,
                deserializer,
                function* (value) {
                    resolve(value);
                    terminate();
                }
            );
        });
    }

    /**
     * Listens to channel. When a new message arrives, listener will be called
     * @param {string} channel - Channel identifier
     * @param {Object} deserializer - Deserializer for the message
     * @param {Function} listener - Listener callback
     * @returns {Function} Unsubscribe function
     */
    on(channel, deserializer, listener) {
        return this.#messageListener.listen(
            `ipc:${channel}:send`,
            deserializer,
            function* (value) {
                listener(value);
            }
        );
    }

    /**
     * Listens to channel once. When a new message arrives, listener will be called and then removed
     * @param {string} channel - Channel identifier
     * @param {Object} deserializer - Deserializer for the message
     * @param {Function} listener - Listener callback
     * @returns {Function} Unsubscribe function
     */
    once(channel, deserializer, listener) {
        const terminate = this.#messageListener.listen(
            `ipc:${channel}:send`,
            deserializer,
            function* (value) {
                listener(value);
                terminate();
            }
        );
        return terminate;
    }

    /**
     * Adds a handler for an invoke IPC
     * This handler will be called whenever invoke(channel, ...args) is called
     * @param {string} channel - Channel identifier
     * @param {Object} deserializer - Deserializer for the request
     * @param {Object} serializer - Serializer for the response
     * @param {Function} listener - Handler callback
     * @returns {Function} Unsubscribe function
     */
    handle(channel, deserializer, serializer, listener) {
        return this.#messageListener.listen(
            `ipc:${channel}:invoke`,
            deserializer,
            function* (value) {
                const result = listener(value);
                yield* this.#messageEmitter.emit(`ipc:${channel}:handle`, serializer, result);
            }.bind(this)
        );
    }

    /**
     * Closes the IPC client and cleans up resources
     */
    close() {
        this.#messageListener.close();
        this.#endpointManager.clearAll();
    }
}
