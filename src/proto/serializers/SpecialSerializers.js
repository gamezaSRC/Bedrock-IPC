import { Float64 } from './PrimitiveSerializers.js';

/**
 * Special type serializers
 * Handles Void, Null, Undefined, and Date types
 */

/**
 * Void serializer - serializes nothing
 */
export const Void = {
    *serialize() { },
    *deserialize() { }
};

/**
 * Null serializer - always returns null
 */
export const Null = {
    *serialize() { },
    *deserialize() {
        return null;
    }
};

/**
 * Undefined serializer - always returns undefined
 */
export const Undefined = {
    *serialize() { },
    *deserialize() {
        return undefined;
    }
};

/**
 * Date serializer - serializes Date as timestamp
 */
export const Date = {
    *serialize(value, stream) {
        yield* Float64.serialize(value.getTime(), stream);
    },
    *deserialize(stream) {
        return new globalThis.Date(yield* Float64.deserialize(stream));
    }
};
