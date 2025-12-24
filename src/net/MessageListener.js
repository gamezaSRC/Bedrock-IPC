import { system, ScriptEventSource, ScriptEventCommandMessageAfterEvent } from '@minecraft/server';
import { MIPS, Endpoint, Header } from '../proto/index.js';
import { NetworkSerializer } from './NetworkSerializer.js';
import { EndpointManager } from './EndpointManager.js';

/**
 * MessageListener class
 * Handles incoming message reception and defragmentation
 * Manages incoming messages
 */
export class MessageListener {
    /**
     * @private
     * @type {EndpointManager}
     */
    #endpointManager;

    /**
     * @private
     * @type {boolean}
     */
    #initialized = false;

    /**
     * Creates a new MessageListener
     * @param {EndpointManager} endpointManager
     */
    constructor(endpointManager) {
        this.#endpointManager = endpointManager;
    }

    /**
     * Initializes the message listener
     * Sets up script event subscription
     */
    initialize() {
        if (this.#initialized) return;
        this.#initialized = true;
        system.afterEvents.scriptEventReceive.subscribe(event => {
            system.runJob(this.#handleScriptEvent(event));
        });
    }

    /**
     * Handles incoming script events
     * @private
     * @param {ScriptEventCommandMessageAfterEvent} event - Script event
     * @returns {Generator<void, void>} Generator for async execution
     */
    *#handleScriptEvent(event) {
        if (event.sourceType !== ScriptEventSource.Server) return;
        const [serialized_endpoint, serialized_header] = event.id.split(':');
        const endpoint_stream = yield* MIPS.deserialize(serialized_endpoint);
        const endpoint = yield* Endpoint.deserialize(endpoint_stream);
        const listeners = this.#endpointManager.getListeners(endpoint);
        if (listeners !== undefined) {
            const header_stream = yield* MIPS.deserialize(serialized_header);
            const header = yield* Header.deserialize(header_stream);
            const errors = [];
            for (let i = 0; i < listeners.length; i++) {
                try {
                    yield* listeners[i](header, event.message);
                } catch (e) {
                    errors.push(e);
                }
            }

            if (errors.length > 0)
                throw new AggregateError(errors, 'one or more listeners failed');
        }
    }

    /**
     * Registers a listener for an endpoint with message reassembly
     * @param {string} endpoint - Endpoint identifier
     * @param {Object} serializer - Serializer for the message
     * @param {Function} callback - Callback to invoke with deserialized message
     * @returns {Function} Unsubscribe function
     */
    listen(endpoint, serializer, callback) {
        const buffer = new Map();
        const listener = function* (payload, serialized_packet) {
            let fragment = buffer.get(payload.guid);
            if (!fragment) {
                fragment = {
                    size: -1,
                    serialized_packets: [],
                    data_size: 0
                };
                buffer.set(payload.guid, fragment);
            }
            if (payload.final) 
                fragment.size = payload.index + 1;
            fragment.serialized_packets[payload.index] = serialized_packet;
            fragment.data_size += payload.index + 1;
            if (fragment.size !== -1 && 
                fragment.data_size === (fragment.size * (fragment.size + 1)) / 2) {
                const stream = yield* NetworkSerializer.deserialize(fragment.serialized_packets);
                const value = yield* serializer.deserialize(stream);
                yield* callback(value);
                buffer.delete(payload.guid);
            }
        };

        return this.#endpointManager.register(endpoint, listener);
    }

    close() {
        this.#endpointManager.clearAll();
    }
}
