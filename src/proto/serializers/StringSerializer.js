import { UVarInt32 } from './PrimitiveSerializers.js';

/**
 * String serializer
 * Uses variable-length encoding for character codes
 */
export const String = {
    *serialize(value, stream) {
        yield* UVarInt32.serialize(value.length, stream);
        for (let i = 0; i < value.length; i++) {
            const code = value.charCodeAt(i);
            yield* UVarInt32.serialize(code, stream);
        }
    },
    *deserialize(stream) {
        const length = yield* UVarInt32.deserialize(stream);
        let value = '';
        for (let i = 0; i < length; i++) {
            const code = yield* UVarInt32.deserialize(stream);
            value += globalThis.String.fromCharCode(code);
        }
        return value;
    }
};
