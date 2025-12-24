import { UVarInt32, Boolean as BooleanSerializer } from './PrimitiveSerializers.js';

/**
 * Collection serializers - factory functions for complex types
 */

/**
 * Creates an Object serializer from a schema
 * @param {Object} schema - Object schema with serializers for each property
 * @returns {Object} Serializer with serialize/deserialize methods
 */
export function Object(schema) {
    return {
        *serialize(value, stream) {
            for (const key in schema) {
                yield* schema[key].serialize(value[key], stream);
            }
        },
        *deserialize(stream) {
            const result = {};
            for (const key in schema) {
                result[key] = yield* schema[key].deserialize(stream);
            }
            return result;
        }
    };
}

/**
 * Creates an Array serializer for a specific type
 * @param {Object} itemSerializer - Serializer for array items
 * @returns {Object} Serializer with serialize/deserialize methods
 */
export function Array(itemSerializer) {
    return {
        *serialize(value, stream) {
            yield* UVarInt32.serialize(value.length, stream);
            for (const item of value) {
                yield* itemSerializer.serialize(item, stream);
            }
        },
        *deserialize(stream) {
            const result = [];
            const length = yield* UVarInt32.deserialize(stream);
            for (let i = 0; i < length; i++) {
                result[i] = yield* itemSerializer.deserialize(stream);
            }
            return result;
        }
    };
}

/**
 * Creates a Tuple serializer for fixed-length heterogeneous arrays
 * @param {...Object} serializers - Serializers for each tuple element
 * @returns {Object} Serializer with serialize/deserialize methods
 */
export function Tuple(...serializers) {
    return {
        *serialize(value, stream) {
            for (let i = 0; i < serializers.length; i++) {
                yield* serializers[i].serialize(value[i], stream);
            }
        },
        *deserialize(stream) {
            const result = [];
            for (let i = 0; i < serializers.length; i++) {
                result[i] = yield* serializers[i].deserialize(stream);
            }
            return result;
        }
    };
}

/**
 * Creates an Optional serializer for nullable values
 * @param {Object} itemSerializer - Serializer for the optional value
 * @returns {Object} Serializer with serialize/deserialize methods
 */
export function Optional(itemSerializer) {
    return {
        *serialize(value, stream) {
            const defined = value !== undefined;
            yield* BooleanSerializer.serialize(defined, stream);
            if (defined)
                yield* itemSerializer.serialize(value, stream);
        },
        *deserialize(stream) {
            const defined = yield* BooleanSerializer.deserialize(stream);
            if (defined)
                return yield* itemSerializer.deserialize(stream);
            return undefined;
        }
    };
}

/**
 * Creates a Map serializer
 * @param {Object} keySerializer - Serializer for map keys
 * @param {Object} valueSerializer - Serializer for map values
 * @returns {Object} Serializer with serialize/deserialize methods
 */
export function Map(keySerializer, valueSerializer) {
    return {
        *serialize(value, stream) {
            yield* UVarInt32.serialize(value.size, stream);
            for (const [k, v] of value) {
                yield* keySerializer.serialize(k, stream);
                yield* valueSerializer.serialize(v, stream);
            }
        },
        *deserialize(stream) {
            const size = yield* UVarInt32.deserialize(stream);
            const result = new globalThis.Map();
            for (let i = 0; i < size; i++) {
                const k = yield* keySerializer.deserialize(stream);
                const v = yield* valueSerializer.deserialize(stream);
                result.set(k, v);
            }
            return result;
        }
    };
}

/**
 * Creates a Set serializer
 * @param {Object} itemSerializer - Serializer for set items
 * @returns {Object} Serializer with serialize/deserialize methods
 */
export function Set(itemSerializer) {
    return {
        *serialize(set, stream) {
            yield* UVarInt32.serialize(set.size, stream);
            for (const v of set) {
                yield* itemSerializer.serialize(v, stream);
            }
        },
        *deserialize(stream) {
            const size = yield* UVarInt32.deserialize(stream);
            const result = new globalThis.Set();
            for (let i = 0; i < size; i++) {
                const v = yield* itemSerializer.deserialize(stream);
                result.add(v);
            }
            return result;
        }
    };
}
