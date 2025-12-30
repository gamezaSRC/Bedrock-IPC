import { Serializer } from '../Serializer';
import { VarUInt32 } from './PrimitiveSerializers';
import type { ByteBuffer } from '../ByteBuffer';

/**
 * String serializer - length-prefixed UTF-16 char codes
 */
export class StringSerializer extends Serializer<string> {
  *serialize(value: string, buffer: ByteBuffer): Generator<void, void> {
    yield* VarUInt32.serialize(value.length, buffer);
    for (let i = 0; i < value.length; i++) {
      const charCode = value.charCodeAt(i);
      yield* VarUInt32.serialize(charCode, buffer);
    }
  }
  *deserialize(buffer: ByteBuffer): Generator<void, string> {
    const length = yield* VarUInt32.deserialize(buffer);
    if (length === undefined || length === null) {
      throw new Error('VarUInt32.deserialize returned undefined for string length');
    }
    let result = '';
    for (let i = 0; i < length; i++) {
      const charCode = yield* VarUInt32.deserialize(buffer);
      result += globalThis.String.fromCharCode(charCode);
    }
    return result;
  }
}

/**
 * Raw bytes serializer (Uint8Array)
 */
export class BytesSerializer extends Serializer<Uint8Array> {
  *serialize(value: Uint8Array, buffer: ByteBuffer): Generator<void, void> {
    yield* VarUInt32.serialize(value.length, buffer);
    buffer.writeBytes(value);
  }
  *deserialize(buffer: ByteBuffer): Generator<void, Uint8Array> {
    const length = yield* VarUInt32.deserialize(buffer);
    return buffer.readBytes(length);
  }
}

// Singleton instances
export const String = new StringSerializer();
export const Bytes = new BytesSerializer();
