import * as Serializers from './serializers/index.js';

/**
 * Header structure for IPC messages
 * Contains metadata about message fragmentation and routing
 */
export const Header = Serializers.Object({
    guid: Serializers.String,
    encoding: Serializers.String,
    index: Serializers.UVarInt32,
    final: Serializers.Boolean
});

/**
 * Endpoint identifier type
 */
export const Endpoint = Serializers.String;
