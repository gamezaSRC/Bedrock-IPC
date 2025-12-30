import type { ByteBuffer } from './ByteBuffer';

/**
 * Abstract base class for serializers
 * @template T - Type of value to serialize/deserialize
 */
export abstract class Serializer<T = unknown> {
  /**
   * Serializes a value to the buffer
   * @param value - Value to serialize
   * @param buffer - Target buffer
   */
  abstract serialize(value: T, buffer: ByteBuffer): Generator<void, void>;

  /**
   * Deserializes a value from the buffer
   * @param buffer - Source buffer
   * @returns Generator yielding the deserialized value
   */
  abstract deserialize(buffer: ByteBuffer): Generator<void, T>;
}
