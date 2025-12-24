import { Buffer } from './Buffer.js';

/**
 * MIPS (Minecraft IPC Serialization) utilities
 * Handles hex string serialization/deserialization
 * Manages MIPS encoding
 */
export class MIPS {
    /**
     * Serializes a buffer to MIPS hex string format
     * @param {Buffer} stream - Buffer to serialize
     * @returns {Generator<void, string>} Generator yielding control and returning hex string
     */
    static *serialize(stream) {
        const uint8array = stream.to_uint8array();
        let str = '(0x';
        for (let i = 0; i < uint8array.length; i++) {
            const hex = uint8array[i].toString(16).padStart(2, '0').toUpperCase();
            str += hex;
            yield;
        }
        str += ')';
        return str;
    }

    /**
     * Deserializes a MIPS hex string to a buffer
     * @param {string} str - MIPS hex string to deserialize
     * @returns {Generator<void, Buffer>} Generator yielding control and returning Buffer
     */
    static *deserialize(str) {
        if (str.startsWith('(0x') && str.endsWith(')')) {
            const buffer = new Buffer();
            const hex_str = str.slice(3, str.length - 1);
            for (let i = 0; i < hex_str.length; i++) {
                const hex = hex_str[i] + hex_str[++i];
                buffer.write(parseInt(hex, 16));
                yield;
            }
            return buffer;
        }
        return new Buffer();
    }
}
