/**
 * @license MIT
 * @copyright 2025 gameza_src
 *
 * Bedrock-IPC: Inter Pack Communication for Minecraft Bedrock
 *
 * @module bedrock-ipc
 */

// Main exports
export { IPC, PROTO, IPCClient } from './IPC';
export { NET } from './NET';

// Protocol exports
export { ByteBuffer } from './proto/ByteBuffer';
export { Serializer } from './proto/Serializer';
export * from './proto/serializers/PrimitiveSerializers';
export * from './proto/serializers/StringSerializer';
export * from './proto/serializers/CollectionSerializers';
export * from './proto/serializers/SpecialSerializers';
export * from './proto/serializers/BedrockSerializers';

// Network exports
export { EndpointManager } from './net/EndpointManager';
export { Header, HeaderCodec, PacketEncoder } from './net/index';
export { MessageEmitter, MessageListener } from './net/index';

// Client exports
export { IPCClient as Client } from './client/IPCClient';
