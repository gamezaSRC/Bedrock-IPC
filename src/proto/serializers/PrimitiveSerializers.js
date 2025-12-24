/**
 * Int8 serializer
 */
export const Int8 = {
    *serialize(value, stream) {
        stream.data_view.setInt8(stream.reserve(1), value);
    },
    *deserialize(stream) {
        return stream.data_view.getInt8(stream.consume(1));
    }
};

/**
 * Int16 serializer
 */
export const Int16 = {
    *serialize(value, stream) {
        stream.data_view.setInt16(stream.reserve(2), value);
    },
    *deserialize(stream) {
        return stream.data_view.getInt16(stream.consume(2));
    }
};

/**
 * Int32 serializer
 */
export const Int32 = {
    *serialize(value, stream) {
        stream.data_view.setInt32(stream.reserve(4), value);
    },
    *deserialize(stream) {
        return stream.data_view.getInt32(stream.consume(4));
    }
};

/**
 * UInt8 serializer
 */
export const UInt8 = {
    *serialize(value, stream) {
        stream.data_view.setUint8(stream.reserve(1), value);
    },
    *deserialize(stream) {
        return stream.data_view.getUint8(stream.consume(1));
    }
};

/**
 * UInt16 serializer
 */
export const UInt16 = {
    *serialize(value, stream) {
        stream.data_view.setUint16(stream.reserve(2), value);
    },
    *deserialize(stream) {
        return stream.data_view.getUint16(stream.consume(2));
    }
};

/**
 * UInt32 serializer
 */
export const UInt32 = {
    *serialize(value, stream) {
        stream.data_view.setUint32(stream.reserve(4), value);
    },
    *deserialize(stream) {
        return stream.data_view.getUint32(stream.consume(4));
    }
};

/**
 * UVarInt32 serializer - Variable-length unsigned integer
 */
export const UVarInt32 = {
    *serialize(value, stream) {
        value >>>= 0;
        while (value >= 0x80) {
            stream.write((value & 0x7f) | 0x80);
            value >>>= 7;
            yield;
        }
        stream.write(value);
    },
    *deserialize(stream) {
        let value = 0;
        for (let size = 0; size < 5; size++) {
            const byte = stream.read();
            value |= (byte & 0x7f) << (size * 7);
            yield;
            if ((byte & 0x80) == 0)
                break;
        }
        return value >>> 0;
    }
};

/**
 * VarInt32 serializer - Variable-length signed integer with zigzag encoding
 */
export const VarInt32 = {
    *serialize(value, stream) {
        const zigzag = (value << 1) ^ (value >> 31);
        yield* UVarInt32.serialize(zigzag, stream);
    },
    *deserialize(stream) {
        const zigzag = yield* UVarInt32.deserialize(stream);
        return (zigzag >>> 1) ^ -(zigzag & 1);
    }
};

/**
 * Float32 serializer
 */
export const Float32 = {
    *serialize(value, stream) {
        stream.data_view.setFloat32(stream.reserve(4), value);
    },
    *deserialize(stream) {
        return stream.data_view.getFloat32(stream.consume(4));
    }
};

/**
 * Float64 serializer
 */
export const Float64 = {
    *serialize(value, stream) {
        stream.data_view.setFloat64(stream.reserve(8), value);
    },
    *deserialize(stream) {
        return stream.data_view.getFloat64(stream.consume(8));
    }
};

/**
 * Boolean serializer
 */
export const Boolean = {
    *serialize(value, stream) {
        stream.write(value ? 1 : 0);
    },
    *deserialize(stream) {
        return stream.read() !== 0;
    }
};

/**
 * UInt8Array serializer
 */
export const UInt8Array = {
    *serialize(value, stream) {
        yield* UVarInt32.serialize(value.length, stream);
        stream.write(value);
    },
    *deserialize(stream) {
        const length = yield* UVarInt32.deserialize(stream);
        return stream.read(length);
    }
};
