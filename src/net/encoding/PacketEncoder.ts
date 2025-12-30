import { ByteBuffer } from '../../proto/ByteBuffer';

/**
 * Encodes ByteBuffer to transportable string format
 * Uses mixed UTF-16 and hex encoding for efficiency
 */
export class PacketEncoder {
  /**
   * Maximum fragment size in bytes
   */
  static readonly MAX_FRAGMENT_SIZE = 2048;

  /**
   * Encodes buffer to string fragments
   * @param buffer - Buffer to encode
   * @param maxSize - Max size per fragment (default: 2048)
   * @returns Generator yielding string array
   */
  static *encode(buffer: ByteBuffer, maxSize: number = PacketEncoder.MAX_FRAGMENT_SIZE): Generator<void, string[]> {
    const bytes = buffer.toUint8Array();
    const fragments: string[] = [];
    let currentFragment = '';
    let currentSize = 0;

    for (let i = 0; i < bytes.length; i += 2) {
      const low = bytes[i];
      const high = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const charCode = low | (high << 8);
      const charSize = charCode > 0xFF
        ? (charCode <= 0x7F ? 1 : charCode <= 0x7FF ? 2 : 3)
        : 2;
      if (currentSize + charSize > maxSize) {
        fragments.push(currentFragment);
        currentFragment = '';
        currentSize = 0;
      }
      if (charCode > 0xFF) {
        currentFragment += globalThis.String.fromCharCode(charCode);
        currentSize += charSize;
      } else {
        currentFragment += charCode.toString(16).padStart(2, '0').toUpperCase();
        currentSize += 2;
      }
      yield;
    }
    if (currentFragment || fragments.length === 0) {
      fragments.push(currentFragment);
    }
    return fragments;
  }

  /**
   * Decodes string fragments back to ByteBuffer
   * @param fragments - Encoded fragments
   * @returns Generator yielding ByteBuffer
   */
  static *decode(fragments: string[]): Generator<void, ByteBuffer> {
    const buffer = new ByteBuffer();
    if (!fragments || !globalThis.Array.isArray(fragments)) {
      buffer.resetRead();
      return buffer;
    }

    if (fragments.length === 0) {
      buffer.resetRead();
      return buffer;
    }
    for (let i = 0; i < fragments.length; i++) {
      const fragment = fragments[i];
      if (!fragment) continue;
      for (let j = 0; j < fragment.length; j++) {
        const charCode = fragment.charCodeAt(j);
        if (charCode <= 0xFF) {
          const hex = fragment[j] + fragment[++j];
          const hexCode = parseInt(hex, 16);
          buffer.writeByte(hexCode & 0xFF);
          buffer.writeByte(hexCode >> 8);
        } else {
          buffer.writeByte(charCode & 0xFF);
          buffer.writeByte(charCode >> 8);
        }
        yield;
      }
    }
    buffer.resetRead();
    return buffer;
  }
}
