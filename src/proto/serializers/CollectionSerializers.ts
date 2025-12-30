import { Serializer } from '../Serializer';
import { VarUInt32, Boolean } from './PrimitiveSerializers';
import type { ByteBuffer } from '../ByteBuffer';

/**
 * Array serializer - dynamic length homogeneous arrays
 * @template T - Element type
 */
export class ArraySerializer<T> extends Serializer<T[]> {
  private elementSerializer: Serializer<T>;

  constructor(elementSerializer: Serializer<T>) {
    super();
    this.elementSerializer = elementSerializer;
  }

  *serialize(value: T[], buffer: ByteBuffer): Generator<void, void> {
    yield* VarUInt32.serialize(value.length, buffer);
    for (const item of value) {
      yield* this.elementSerializer.serialize(item, buffer);
    }
  }

  *deserialize(buffer: ByteBuffer): Generator<void, T[]> {
    const length = yield* VarUInt32.deserialize(buffer);
    const result: T[] = [];
    if (!this.elementSerializer) {
      console.error('[ERROR] ArraySerializer: elementSerializer is undefined!');
      return result;
    }
    for (let i = 0; i < length; i++) {
      result.push(yield* this.elementSerializer.deserialize(buffer));
    }
    return result;
  }
}

/**
 * Schema type for ObjectSerializer
 */
export type ObjectSchema = Record<string, Serializer<unknown>>;

/**
 * Infer the object type from a schema
 */
export type InferSchemaType<S extends ObjectSchema> = {
  [K in keyof S]: S[K] extends Serializer<infer T> ? T : never;
};

/**
 * Object serializer - fixed schema objects
 * @template S - Schema type
 */
export class ObjectSerializer<S extends ObjectSchema> extends Serializer<InferSchemaType<S>> {
  private schema: S;

  constructor(schema: S) {
    super();
    this.schema = schema;
  }

  *serialize(value: InferSchemaType<S>, buffer: ByteBuffer): Generator<void, void> {
    for (const key in this.schema) {
      yield* this.schema[key].serialize((value as Record<string, unknown>)[key], buffer);
    }
  }

  *deserialize(buffer: ByteBuffer): Generator<void, InferSchemaType<S>> {
    const result: Record<string, unknown> = {};
    if (!this.schema) {
      console.error('[ERROR] ObjectSerializer: schema is undefined!');
      return result as InferSchemaType<S>;
    }
    for (const key in this.schema) {
      const serializer = this.schema[key];
      if (!serializer) {
        console.error(`[ERROR] ObjectSerializer: serializer for key "${key}" is undefined!`);
        continue;
      }
      result[key] = yield* serializer.deserialize(buffer);
    }
    return result as InferSchemaType<S>;
  }
}

/**
 * Tuple serializer - fixed length heterogeneous arrays
 */
export class TupleSerializer<T extends unknown[]> extends Serializer<T> {
  private serializers: Serializer<unknown>[];

  constructor(serializers: Serializer<unknown>[]) {
    super();
    this.serializers = serializers;
  }

  *serialize(value: T, buffer: ByteBuffer): Generator<void, void> {
    for (let i = 0; i < this.serializers.length; i++) {
      yield* this.serializers[i].serialize(value[i], buffer);
    }
  }

  *deserialize(buffer: ByteBuffer): Generator<void, T> {
    const result: unknown[] = [];
    if (!this.serializers) {
      console.error('[ERROR] TupleSerializer: serializers array is undefined!');
      return result as T;
    }
    for (let i = 0; i < this.serializers.length; i++) {
      const serializer = this.serializers[i];
      if (!serializer) {
        console.error(`[ERROR] TupleSerializer: serializer at index ${i} is undefined!`);
        continue;
      }
      result.push(yield* serializer.deserialize(buffer));
    }
    return result as T;
  }
}

/**
 * Optional serializer - nullable values
 * @template T - Inner type
 */
export class OptionalSerializer<T> extends Serializer<T | undefined | null> {
  private serializer: Serializer<T>;

  constructor(serializer: Serializer<T>) {
    super();
    this.serializer = serializer;
  }

  *serialize(value: T | undefined | null, buffer: ByteBuffer): Generator<void, void> {
    const isDefined = value !== undefined && value !== null;
    yield* Boolean.serialize(isDefined, buffer);
    if (isDefined) {
      yield* this.serializer.serialize(value, buffer);
    }
  }

  *deserialize(buffer: ByteBuffer): Generator<void, T | undefined> {
    const isDefined = yield* Boolean.deserialize(buffer);
    if (isDefined) {
      return yield* this.serializer.deserialize(buffer);
    }
    return undefined;
  }
}

/**
 * Map serializer - key-value pairs
 * @template K - Key type
 * @template V - Value type
 */
export class MapSerializer<K, V> extends Serializer<Map<K, V>> {
  private keySerializer: Serializer<K>;
  private valueSerializer: Serializer<V>;

  constructor(keySerializer: Serializer<K>, valueSerializer: Serializer<V>) {
    super();
    this.keySerializer = keySerializer;
    this.valueSerializer = valueSerializer;
  }

  *serialize(value: Map<K, V>, buffer: ByteBuffer): Generator<void, void> {
    yield* VarUInt32.serialize(value.size, buffer);
    for (const [k, v] of value) {
      yield* this.keySerializer.serialize(k, buffer);
      yield* this.valueSerializer.serialize(v, buffer);
    }
  }

  *deserialize(buffer: ByteBuffer): Generator<void, Map<K, V>> {
    const size = yield* VarUInt32.deserialize(buffer);
    const result = new globalThis.Map<K, V>();
    for (let i = 0; i < size; i++) {
      const key = yield* this.keySerializer.deserialize(buffer);
      const val = yield* this.valueSerializer.deserialize(buffer);
      result.set(key, val);
    }
    return result;
  }
}

/**
 * Set serializer - unique values
 * @template T - Element type
 */
export class SetSerializer<T> extends Serializer<Set<T>> {
  private elementSerializer: Serializer<T>;

  constructor(elementSerializer: Serializer<T>) {
    super();
    this.elementSerializer = elementSerializer;
  }

  *serialize(value: Set<T>, buffer: ByteBuffer): Generator<void, void> {
    yield* VarUInt32.serialize(value.size, buffer);
    for (const item of value) {
      yield* this.elementSerializer.serialize(item, buffer);
    }
  }

  *deserialize(buffer: ByteBuffer): Generator<void, Set<T>> {
    const size = yield* VarUInt32.deserialize(buffer);
    const result = new globalThis.Set<T>();
    for (let i = 0; i < size; i++) {
      result.add(yield* this.elementSerializer.deserialize(buffer));
    }
    return result;
  }
}

// Factory functions
export function Array<T>(elementSerializer: Serializer<T>): ArraySerializer<T> {
  return new ArraySerializer(elementSerializer);
}

export function Object<S extends ObjectSchema>(schema: S): ObjectSerializer<S> {
  return new ObjectSerializer(schema);
}

export function Tuple<T extends Serializer<unknown>[]>(...serializers: T): TupleSerializer<{
  [K in keyof T]: T[K] extends Serializer<infer U> ? U : never;
}> {
  return new TupleSerializer(serializers) as TupleSerializer<{
    [K in keyof T]: T[K] extends Serializer<infer U> ? U : never;
  }>;
}

export function Optional<T>(serializer: Serializer<T>): OptionalSerializer<T> {
  return new OptionalSerializer(serializer);
}

export function Map<K, V>(keySerializer: Serializer<K>, valueSerializer: Serializer<V>): MapSerializer<K, V> {
  return new MapSerializer(keySerializer, valueSerializer);
}

export function Set<T>(elementSerializer: Serializer<T>): SetSerializer<T> {
  return new SetSerializer(elementSerializer);
}
