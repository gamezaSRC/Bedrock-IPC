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
 * Encoding types for IPC messages
 */
export const Encoding = {
    MCBE_IPC_V3: 'mcbe-ipc:v3'
};

/**
 * Endpoint identifier type
 */
export const Endpoint = Serializers.String;
