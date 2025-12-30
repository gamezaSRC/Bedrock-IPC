import { Serializer } from '../Serializer';
import { Float64 } from './PrimitiveSerializers';
import type { ByteBuffer } from '../ByteBuffer';

/**
 * Date serializer - stores as timestamp
 */
export class DateSerializer extends Serializer<Date> {
  *serialize(value: Date, buffer: ByteBuffer): Generator<void, void> {
    yield* Float64.serialize(value.getTime(), buffer);
  }
  *deserialize(buffer: ByteBuffer): Generator<void, Date> {
    const timestamp = yield* Float64.deserialize(buffer);
    return new globalThis.Date(timestamp);
  }
}

// Singleton instances
export const Date = new DateSerializer();
