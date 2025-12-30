import { ByteBuffer } from '../../proto/ByteBuffer';

/**
 * Codec for encoding/decoding data to hex format
 */
export class HeaderCodec {
  /**
   * Encodes a buffer to hex string format (0xHEX)
   * @param buffer - Source buffer
   * @returns Generator yielding hex string
   */
  static *encodeToHex(buffer: ByteBuffer): Generator<void, string> {
    const bytes = buffer.toUint8Array();
    let hex = '(0x';
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0').toUpperCase();
      yield;
    }
    hex += ')';
    return hex;
  }

  /**
   * Decodes hex string format to buffer
   * @param hex - Hex string in (0xHEX) format
   * @returns Generator yielding ByteBuffer
   */
  static *decodeFromHex(hex: string): Generator<void, ByteBuffer> {
    const buffer = new ByteBuffer();
    if (hex.startsWith('(0x') && hex.endsWith(')')) {
      const content = hex.slice(3, -1);
      for (let i = 0; i < content.length; i += 2) {
        const byte = parseInt(content.slice(i, i + 2), 16);
        buffer.writeByte(byte);
        yield;
      }
    }

    buffer.resetRead();
    return buffer;
  }
}
