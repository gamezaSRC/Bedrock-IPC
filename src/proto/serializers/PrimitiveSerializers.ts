import { Serializer } from '../Serializer';
import type { ByteBuffer } from '../ByteBuffer';

/**
 * Void serializer - no data
 */
export class VoidSerializer extends Serializer<void> {
  *serialize(_value: void, _buffer: ByteBuffer): Generator<void, void> {}
  *deserialize(_buffer: ByteBuffer): Generator<void, void> {}
}

/**
 * Null serializer - always null
 */
export class NullSerializer extends Serializer<null> {
  *serialize(_value: null, _buffer: ByteBuffer): Generator<void, void> {}
  *deserialize(_buffer: ByteBuffer): Generator<void, null> {
    return null;
  }
}

/**
 * Undefined serializer - always undefined
 */
export class UndefinedSerializer extends Serializer<undefined> {
  *serialize(_value: undefined, _buffer: ByteBuffer): Generator<void, void> {}
  *deserialize(_buffer: ByteBuffer): Generator<void, undefined> {
    return undefined;
  }
}

/**
 * Boolean serializer
 */
export class BooleanSerializer extends Serializer<boolean> {
  *serialize(value: boolean, buffer: ByteBuffer): Generator<void, void> {
    buffer.writeByte(value ? 1 : 0);
  }
  *deserialize(buffer: ByteBuffer): Generator<void, boolean> {
    return buffer.readByte() !== 0;
  }
}

/**
 * Signed 8-bit integer serializer
 */
export class Int8Serializer extends Serializer<number> {
  *serialize(value: number, buffer: ByteBuffer): Generator<void, void> {
    const offset = buffer.allocate(1);
    buffer.dataView.setInt8(offset, value);
  }
  *deserialize(buffer: ByteBuffer): Generator<void, number> {
    const offset = buffer.advance(1);
    return buffer.dataView.getInt8(offset);
  }
}

/**
 * Signed 16-bit integer serializer
 */
export class Int16Serializer extends Serializer<number> {
  *serialize(value: number, buffer: ByteBuffer): Generator<void, void> {
    const offset = buffer.allocate(2);
    buffer.dataView.setInt16(offset, value);
  }
  *deserialize(buffer: ByteBuffer): Generator<void, number> {
    const offset = buffer.advance(2);
    return buffer.dataView.getInt16(offset);
  }
}

/**
 * Signed 32-bit integer serializer
 */
export class Int32Serializer extends Serializer<number> {
  *serialize(value: number, buffer: ByteBuffer): Generator<void, void> {
    const offset = buffer.allocate(4);
    buffer.dataView.setInt32(offset, value);
  }
  *deserialize(buffer: ByteBuffer): Generator<void, number> {
    const offset = buffer.advance(4);
    return buffer.dataView.getInt32(offset);
  }
}

/**
 * Unsigned 8-bit integer serializer
 */
export class UInt8Serializer extends Serializer<number> {
  *serialize(value: number, buffer: ByteBuffer): Generator<void, void> {
    const offset = buffer.allocate(1);
    buffer.dataView.setUint8(offset, value);
  }
  *deserialize(buffer: ByteBuffer): Generator<void, number> {
    const offset = buffer.advance(1);
    return buffer.dataView.getUint8(offset);
  }
}

/**
 * Unsigned 16-bit integer serializer
 */
export class UInt16Serializer extends Serializer<number> {
  *serialize(value: number, buffer: ByteBuffer): Generator<void, void> {
    const offset = buffer.allocate(2);
    buffer.dataView.setUint16(offset, value);
  }
  *deserialize(buffer: ByteBuffer): Generator<void, number> {
    const offset = buffer.advance(2);
    return buffer.dataView.getUint16(offset);
  }
}

/**
 * Unsigned 32-bit integer serializer
 */
export class UInt32Serializer extends Serializer<number> {
  *serialize(value: number, buffer: ByteBuffer): Generator<void, void> {
    const offset = buffer.allocate(4);
    buffer.dataView.setUint32(offset, value);
  }
  *deserialize(buffer: ByteBuffer): Generator<void, number> {
    const offset = buffer.advance(4);
    return buffer.dataView.getUint32(offset);
  }
}

/**
 * 32-bit float serializer
 */
export class Float32Serializer extends Serializer<number> {
  *serialize(value: number, buffer: ByteBuffer): Generator<void, void> {
    const offset = buffer.allocate(4);
    buffer.dataView.setFloat32(offset, value);
  }
  *deserialize(buffer: ByteBuffer): Generator<void, number> {
    const offset = buffer.advance(4);
    return buffer.dataView.getFloat32(offset);
  }
}

/**
 * 64-bit float (double) serializer
 */
export class Float64Serializer extends Serializer<number> {
  *serialize(value: number, buffer: ByteBuffer): Generator<void, void> {
    const offset = buffer.allocate(8);
    buffer.dataView.setFloat64(offset, value);
  }
  *deserialize(buffer: ByteBuffer): Generator<void, number> {
    const offset = buffer.advance(8);
    return buffer.dataView.getFloat64(offset);
  }
}

/**
 * Variable-length unsigned integer serializer (LEB128)
 */
export class VarUInt32Serializer extends Serializer<number> {
  *serialize(value: number, buffer: ByteBuffer): Generator<void, void> {
    value = value >>> 0;
    while (value >= 0x80) {
      buffer.writeByte((value & 0x7F) | 0x80);
      value = value >>> 7;
      yield;
    }
    buffer.writeByte(value);
  }
  *deserialize(buffer: ByteBuffer): Generator<void, number> {
    let value = 0;
    let shift = 0;
    for (let i = 0; i < 5; i++) {
      if (buffer.available <= 0) {
        throw new Error(`Buffer underflow in VarUInt32 at byte ${i}`);
      }
      const byte = buffer.readByte();
      value |= (byte & 0x7F) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
      yield;
    }
    return value >>> 0;
  }
}

/**
 * Variable-length signed integer serializer (ZigZag + LEB128)
 */
export class VarInt32Serializer extends Serializer<number> {
  private varUInt32 = new VarUInt32Serializer();

  *serialize(value: number, buffer: ByteBuffer): Generator<void, void> {
    const zigzag = (value << 1) ^ (value >> 31);
    yield* this.varUInt32.serialize(zigzag, buffer);
  }
  *deserialize(buffer: ByteBuffer): Generator<void, number> {
    const zigzag = yield* this.varUInt32.deserialize(buffer);
    return (zigzag >>> 1) ^ -(zigzag & 1);
  }
}

/**
 * Variable-length unsigned 64-bit integer serializer
 */
export class VarUInt64Serializer extends Serializer<bigint> {
  static readonly MAX_VALUE = (1n << 64n) - 1n;

  *serialize(value: bigint, buffer: ByteBuffer): Generator<void, void> {
    value = BigInt.asUintN(64, BigInt(value));
    while (value >= 0x80n) {
      buffer.writeByte(Number((value & 0x7Fn) | 0x80n));
      value = value >> 7n;
      yield;
    }
    buffer.writeByte(Number(value));
  }
  *deserialize(buffer: ByteBuffer): Generator<void, bigint> {
    let value = 0n;
    let shift = 0n;
    for (let i = 0; i < 10; i++) {
      const byte = BigInt(buffer.readByte());
      value |= (byte & 0x7Fn) << shift;
      if ((byte & 0x80n) === 0n) break;
      shift += 7n;
      yield;
    }
    return BigInt.asUintN(64, value);
  }
}

/**
 * Variable-length signed 64-bit integer serializer (ZigZag + LEB128)
 */
export class VarInt64Serializer extends Serializer<bigint> {
  private varUInt64 = new VarUInt64Serializer();

  *serialize(value: bigint, buffer: ByteBuffer): Generator<void, void> {
    const zigzag = (value << 1n) ^ (value >> 63n);
    yield* this.varUInt64.serialize(zigzag, buffer);
  }
  *deserialize(buffer: ByteBuffer): Generator<void, bigint> {
    const zigzag = yield* this.varUInt64.deserialize(buffer);
    return (zigzag >> 1n) ^ -(zigzag & 1n);
  }
}

// Singleton instances
export const Void = new VoidSerializer();
export const Null = new NullSerializer();
export const Undefined = new UndefinedSerializer();
export const Boolean = new BooleanSerializer();
export const Int8 = new Int8Serializer();
export const Int16 = new Int16Serializer();
export const Int32 = new Int32Serializer();
export const UInt8 = new UInt8Serializer();
export const UInt16 = new UInt16Serializer();
export const UInt32 = new UInt32Serializer();
export const Float32 = new Float32Serializer();
export const Float64 = new Float64Serializer();
export const VarUInt32 = new VarUInt32Serializer();
export const VarInt32 = new VarInt32Serializer();
export const VarUInt64 = new VarUInt64Serializer();
export const VarInt64 = new VarInt64Serializer();
