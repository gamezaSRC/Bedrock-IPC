/**
 * Dynamic byte buffer for binary serialization
 * Automatically grows when needed
 */
export class ByteBuffer {
  private bytes: Uint8Array;
  private view: DataView;
  private writePos: number = 0;
  private readPos: number = 0;

  /**
   * Creates a new ByteBuffer
   * @param initialSize - Initial buffer size in bytes (default: 256)
   */
  constructor(initialSize: number = 256) {
    this.bytes = new Uint8Array(initialSize);
    this.view = new DataView(this.bytes.buffer);
  }

  /**
   * Gets the current write position
   */
  get writePosition(): number {
    return this.writePos;
  }

  /**
   * Gets the current read position
   */
  get readPosition(): number {
    return this.readPos;
  }

  /**
   * Gets the number of bytes available to read
   */
  get available(): number {
    return this.writePos - this.readPos;
  }

  /**
   * Gets the underlying DataView
   */
  get dataView(): DataView {
    return this.view;
  }

  /**
   * Ensures buffer has enough capacity, grows if needed
   * @param needed - Additional bytes needed
   */
  private ensureCapacity(needed: number): void {
    const required = this.writePos + needed;
    if (required > this.bytes.length) {
      const newSize = Math.max(this.bytes.length * 2, required);
      const newBytes = new Uint8Array(newSize);
      newBytes.set(this.bytes);
      this.bytes = newBytes;
      this.view = new DataView(this.bytes.buffer);
    }
  }

  /**
   * Allocates space for writing and returns the offset
   * @param size - Bytes to allocate
   * @returns Offset where data should be written
   */
  allocate(size: number): number {
    this.ensureCapacity(size);
    const offset = this.writePos;
    this.writePos += size;
    return offset;
  }

  /**
   * Advances read position and returns the starting offset
   * @param size - Bytes to advance
   * @returns Offset where data starts
   * @throws Error if not enough bytes available
   */
  advance(size: number): number {
    if (size > this.available) {
      throw new Error(`Buffer underflow: requested ${size}, available ${this.available}`);
    }
    const offset = this.readPos;
    this.readPos += size;
    return offset;
  }

  /**
   * Writes a single byte
   * @param value - Byte value (0-255)
   */
  writeByte(value: number): void {
    const offset = this.allocate(1);
    this.bytes[offset] = value & 0xFF;
  }

  /**
   * Reads a single byte
   * @returns Byte value
   */
  readByte(): number {
    const offset = this.advance(1);
    return this.bytes[offset];
  }

  /**
   * Writes a byte array
   * @param data - Bytes to write
   */
  writeBytes(data: Uint8Array): void {
    const offset = this.allocate(data.length);
    this.bytes.set(data, offset);
  }

  /**
   * Reads a byte array
   * @param length - Number of bytes to read
   * @returns Read bytes
   */
  readBytes(length: number): Uint8Array {
    const offset = this.advance(length);
    return this.bytes.slice(offset, offset + length);
  }

  /**
   * Resets read position to start
   */
  resetRead(): void {
    this.readPos = 0;
  }

  /**
   * Clears the buffer completely
   */
  clear(): void {
    this.writePos = 0;
    this.readPos = 0;
  }

  /**
   * Gets the written data as Uint8Array
   * @returns Copy of written bytes
   */
  toUint8Array(): Uint8Array {
    return this.bytes.slice(0, this.writePos);
  }

  /**
   * Creates a ByteBuffer from existing data
   * @param data - Source data
   * @returns New ByteBuffer with data
   */
  static from(data: Uint8Array): ByteBuffer {
    const buffer = new ByteBuffer(data.length);
    buffer.writeBytes(data);
    buffer.resetRead();
    return buffer;
  }
}
