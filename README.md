# IPC System

## Overview
This IPC (Inter-Process Communication) this system follows SOLID principles.

## SOLID Principles Applied

### Single Responsibility Principle (SRP)
- **Buffer**: Manages byte buffer operations only
- **MIPS**: Handles MIPS encoding/decoding only
- **NetworkSerializer**: Manages network-level string encoding only
- **EndpointManager**: Handles endpoint registration and routing only
- **MessageEmitter**: Handles outgoing messages only
- **MessageListener**: Handles incoming messages only
- **IPCClient**: Provides high-level IPC interface only

### Open/Closed Principle (OCP)
- Serializers are extensible without modifying existing code
- New serializer types can be added by implementing the serialize/deserialize interface
- Collection serializers use factory functions for composability

### Liskov Substitution Principle (LSP)
- All serializers follow the same interface contract
- Any serializer can be used interchangeably where a serializer is expected

### Interface Segregation Principle (ISP)
- Separate serializers for primitives, strings, collections, and special types
- Clients only depend on the serializers they actually use

### Dependency Inversion Principle (DIP)
- IPCClient depends on abstractions (EndpointManager, MessageEmitter, MessageListener)
- Network layer doesn't depend on application layer
- Protocol layer is independent of both network and application layers

## Usage

### Basic Usage (Backward Compatible)

```javascript
import IPC, { PROTO } from './IPC.js';

// Send a message
IPC.send('myChannel', PROTO.String, 'Hello World');

// Listen for messages
IPC.on('myChannel', PROTO.String, (message) => {
    console.log('Received:', message);
});

// Invoke with response
const result = await IPC.invoke('calculate', PROTO.Int32, 42, PROTO.Int32);
```

### Advanced Usage (New Architecture)

```javascript
import { IPCClient } from './IPC/client/IPCClient.js';
import { String, Int32, Object } from './proto/serializers/index.js';

const client = new IPCClient();

// Use custom object serializers
const UserSerializer = Object({
    name: String,
    age: Int32
});

client.send('user', UserSerializer, { name: 'John', age: 30 });
```

### Creating Custom Serializers

```javascript
import { UVarInt32 } from './proto/serializers/PrimitiveSerializers.js';

const MyCustomSerializer = {
    *serialize(value, stream) {
        // Your serialization logic
        yield* UVarInt32.serialize(value.id, stream);
    },
    *deserialize(stream) {
        // Your deserialization logic
        const id = yield* UVarInt32.deserialize(stream);
        return { id };
    }
};
```

### NET use

```javascript
import { system } from '@minecraft/server';
import IPC from './IPC.js';
import NET from './NET.js';

/**
 * Test: NET vs IPC comparison
 */
async function testNETvsIPC() {
    // Using IPC (High Level)
    IPC.send('myChannel', PROTO.String, 'Hello via IPC');
    
    // Using NET (Low Level)
    system.runJob(NET.emit('custom:endpoint', PROTO.String, 'Hello via NET'));

}
```