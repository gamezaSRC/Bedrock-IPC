import { Buffer } from '../proto/Buffer.js';

/**
 * NetworkSerializer class
 * Handles serialization and deserialization of network messages
 * Manages network-level encoding
 */
export class NetworkSerializer {
    /**
     * Maximum fragment size for network messages
     * @static
     * @readonly
     */
    static FRAG_MAX = 2048;

    /**
     * Serializes a buffer into network-friendly strings
     * @param {Buffer} buffer - Buffer to serialize
     * @param {number} maxSize - Maximum size per fragment
     * @returns {Generator<void, string[]>} Generator yielding control and returning array of strings
     */
    static *serialize(buffer, maxSize = Infinity) {
        const uint8array = buffer.to_uint8array();
        const result = [];
        let acc_str = '';
        let acc_size = 0;
        for (let i = 0; i < uint8array.length; i++) {
            const char_code = uint8array[i] | (uint8array[++i] << 8);
            const utf16_size = char_code <= 0x7f ? 1 : char_code <= 0x7ff ? 2 : char_code <= 0xffff ? 3 : 4;
            const char_size = char_code > 0xff ? utf16_size : 2;
            if (acc_size + char_size > maxSize) {
                result.push(acc_str);
                acc_str = '';
                acc_size = 0;
            }
            if (char_code > 0xff) {
                acc_str += String.fromCharCode(char_code);
                acc_size += utf16_size;
            } else {
                acc_str += char_code.toString(16).padStart(2, '0').toUpperCase();
                acc_size += 2;
            }
            yield;
        }
        result.push(acc_str);
        return result;
    }

    /**
     * Deserializes network strings back into a buffer
     * @param {string[]} strings - Array of strings to deserialize
     * @returns {Generator<void, Buffer>} Generator yielding control and returning Buffer
     */
    static *deserialize(strings) {
        const buffer = new Buffer();

        for (let i = 0; i < strings.length; i++) {
            const str = strings[i];
            for (let j = 0; j < str.length; j++) {
                const char_code = str.charCodeAt(j);
                if (char_code <= 0xff) {
                    const hex = str[j] + str[++j];
                    const hex_code = parseInt(hex, 16);
                    buffer.write(hex_code & 0xff);
                    buffer.write(hex_code >> 8);
                } else {
                    buffer.write(char_code & 0xff);
                    buffer.write(char_code >> 8);
                }
                yield;
            }
            yield;
        }
        return buffer;
    }
}
