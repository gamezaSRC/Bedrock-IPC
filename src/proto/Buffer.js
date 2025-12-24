/**
 * Buffer class for handling byte data with dynamic resizing
 * Manages byte buffer operations
 */
export class Buffer {
    /**
     * @private
     * @type {Uint8Array}
     */
    _buffer;

    /**
     * @private
     * @type {DataView}
     */
    _data_view;

    /**
     * @private
     * @type {number}
     */
    _length;

    /**
     * @private
     * @type {number}
     */
    _offset;

    /**
     * Gets the end position of the buffer
     * @returns {number}
     */
    get end() {
        return this._length + this._offset;
    }

    /**
     * Gets the front position of the buffer
     * @returns {number}
     */
    get front() {
        return this._offset;
    }

    /**
     * Gets the DataView of the buffer
     * @returns {DataView}
     */
    get data_view() {
        return this._data_view;
    }

    /**
     * Creates a new Buffer instance
     * @param {number} size - Initial buffer size (default: 256)
     */
    constructor(size = 256) {
        this._buffer = new Uint8Array(size);
        this._data_view = new DataView(this._buffer.buffer);
        this._length = 0;
        this._offset = 0;
    }

    /**
     * Reserves space in the buffer and returns the offset
     * @param {number} amount - Amount of bytes to reserve
     * @returns {number} The offset where the reserved space starts
     */
    reserve(amount) {
        this.ensure_capacity(amount);
        const end = this.end;
        this._length += amount;
        return end;
    }

    /**
     * Consumes bytes from the buffer
     * @param {number} amount - Amount of bytes to consume
     * @returns {number} The offset where consumption started
     * @throws {Error} If not enough bytes available
     */
    consume(amount) {
        if (amount > this._length)
            throw new Error('not enough bytes');
        const front = this.front;
        this._length -= amount;
        this._offset += amount;
        return front;
    }

    /**
     * Writes data to the buffer
     * @param {number | Uint8Array} input - Data to write
     */
    write(input) {
        if (typeof input === 'number') {
            const offset = this.reserve(1);
            this._buffer[offset] = input;
        } else {
            const offset = this.reserve(input.length);
            this._buffer.set(input, offset);
        }
    }

    /**
     * Reads data from the buffer
     * @param {number} [amount] - Amount of bytes to read
     * @returns {number | Uint8Array} Single byte or byte array
     */
    read(amount) {
        if (amount === undefined) {
            const offset = this.consume(1);
            return this._buffer[offset];
        } else {
            const offset = this.consume(amount);
            return this._buffer.slice(offset, offset + amount);
        }
    }

    /**
     * Ensures the buffer has enough capacity
     * @private
     * @param {number} size - Required size
     */
    ensure_capacity(size) {
        if (this.end + size > this._buffer.length) {
            const larger_buffer = new Uint8Array((this.end + size) * 2);
            larger_buffer.set(this._buffer.subarray(this._offset, this.end), 0);
            this._buffer = larger_buffer;
            this._offset = 0;
            this._data_view = new DataView(this._buffer.buffer);
        }
    }

    /**
     * Creates a Buffer from a Uint8Array
     * @static
     * @param {Uint8Array} array - Source array
     * @returns {Buffer} New Buffer instance
     */
    static from_uint8array(array) {
        const buffer = new Buffer();
        buffer._buffer = array;
        buffer._length = array.length;
        buffer._offset = 0;
        buffer._data_view = new DataView(array.buffer);
        return buffer;
    }

    /**
     * Converts buffer to Uint8Array
     * @returns {Uint8Array} The buffer as Uint8Array
     */
    to_uint8array() {
        return this._buffer.subarray(this._offset, this.end);
    }
}
