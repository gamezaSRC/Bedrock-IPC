import { system } from '@minecraft/server';
import { ByteBuffer } from '../../proto/ByteBuffer';
import * as PROTO from '../../proto/index';
import { PacketEncoder } from '../encoding/PacketEncoder';
import { Header, HeaderSerializer } from '../encoding/Header';
import { HeaderCodec } from '../encoding/HeaderCodec';
import type { Serializer } from '../../proto/Serializer';

/**
 * Handles message emission with fragmentation support
 */
export class MessageEmitter {
  /**
   * Emits a message to an endpoint with automatic fragmentation
   * @param endpoint - Target endpoint
   * @param serializer - Serializer for the message
   * @param value - Value to send
   * @returns Generator for async execution
   */
  *emit<T>(endpoint: string, serializer: Serializer<T>, value: T): Generator<void, void> {
    const guid = Header.generateId();
    const endpointBuffer = new ByteBuffer();
    yield* PROTO.String.serialize(endpoint, endpointBuffer);
    const encodedEndpoint = yield* HeaderCodec.encodeToHex(endpointBuffer);
    const payloadBuffer = new ByteBuffer();
    yield* serializer.serialize(value, payloadBuffer);
    const fragments = yield* PacketEncoder.encode(payloadBuffer);
    for (let i = 0; i < fragments.length; i++) {
      const header = Header.create(guid, i, i === fragments.length - 1);
      const headerBuffer = new ByteBuffer();
      yield* HeaderSerializer.serialize(header, headerBuffer);
      const encodedHeader = yield* HeaderCodec.encodeToHex(headerBuffer);
      system.sendScriptEvent(
        `${encodedEndpoint}:${encodedHeader}`,
        fragments[i]
      );
    }
  }
}
