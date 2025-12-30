import { Object as ObjectSerializer } from '../../proto/serializers/CollectionSerializers';
import * as PROTO from '../../proto/index';

/**
 * Current protocol version
 */
export const PROTOCOL_VERSION = 'mcbe-ipc:v3';

/**
 * Header structure type
 */
export interface HeaderData {
  guid: string;
  version: string;
  index: number;
  isFinal: boolean;
}

/**
 * Header structure serializer
 */
export const HeaderSerializer = ObjectSerializer({
  guid: PROTO.String,
  version: PROTO.String,
  index: PROTO.VarUInt32,
  isFinal: PROTO.Boolean
});

/**
 * Header utilities
 */
export class Header {
  /**
   * Generates a unique message ID
   * @returns 8-character hex string
   */
  static generateId(): string {
    const random = (Math.random() * 0x100000000) >>> 0;
    return (
      (random & 0xFF).toString(16).padStart(2, '0') +
      ((random >> 8) & 0xFF).toString(16).padStart(2, '0') +
      ((random >> 16) & 0xFF).toString(16).padStart(2, '0') +
      ((random >> 24) & 0xFF).toString(16).padStart(2, '0')
    ).toUpperCase();
  }

  /**
   * Creates a new header object
   * @param guid - Message ID
   * @param index - Fragment index
   * @param isFinal - Is this the last fragment
   * @returns Header data object
   */
  static create(guid: string, index: number, isFinal: boolean): HeaderData {
    return {
      guid,
      version: PROTOCOL_VERSION,
      index,
      isFinal
    };
  }
}
