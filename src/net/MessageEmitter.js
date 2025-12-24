import { system } from '@minecraft/server';
import { Buffer, MIPS, Endpoint, Header } from '../proto/index.js';
import { NetworkSerializer } from './NetworkSerializer.js';

/**
 * MessageEmitter class
 * Handles message emission with fragmentation support
 * Manages outgoing messages
 */
export class MessageEmitter {
    /**
     * Generates a unique ID for message tracking
     * @private
     * @returns {string} Unique hex ID
     */
    #generateId() {
        const r = (Math.random() * 0x100000000) >>> 0;
        return (
            ((r & 0xff).toString(16).padStart(2, '0') +
            ((r >> 8) & 0xff).toString(16).padStart(2, '0') +
            ((r >> 16) & 0xff).toString(16).padStart(2, '0') +
            ((r >> 24) & 0xff).toString(16).padStart(2, '0')).toUpperCase()
        );
    }

    /**
     * Emits a message to an endpoint
     * @param {string} endpoint - Target endpoint
     * @param {Object} serializer - Serializer for the message
     * @param {*} value - Value to send
     * @returns {Generator<void, void>} Generator for async execution
     */
    *emit(endpoint, serializer, value) {
        const guid = this.#generateId();
        const endpoint_stream = new Buffer();
        yield* Endpoint.serialize(endpoint, endpoint_stream);
        const serialized_endpoint = yield* MIPS.serialize(endpoint_stream);
        const packet_stream = new Buffer();
        yield* serializer.serialize(value, packet_stream);
        const serialized_packets = yield* NetworkSerializer.serialize(
            packet_stream,
            NetworkSerializer.FRAG_MAX
        );
        for (let i = 0; i < serialized_packets.length; i++) {
            const serialized_packet = serialized_packets[i];
            const header = {
                guid,
                encoding: 'mcbe-ipc:v3',
                index: i,
                final: i === serialized_packets.length - 1
            };
            const header_stream = new Buffer();
            yield* Header.serialize(header, header_stream);
            const serialized_header = yield* MIPS.serialize(header_stream);
            system.sendScriptEvent(
                `${serialized_endpoint}:${serialized_header}`,
                serialized_packet
            );
        }
    }
}
