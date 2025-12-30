# Bedrock-IPC

## SOLID Principles Applied

### Single Responsibility Principle (SRP)
- **Buffer**: Manages byte buffer operations only
- **Serializer**: Base class for all serializers
- **NetworkSerializer**: Manages network-level string encoding only
- **EndpointManager**: Handles endpoint registration and routing only
- **MessageEmitter**: Handles outgoing messages only
- **MessageListener**: Handles incoming messages only
- **IPCClient**: Provides high-level IPC interface only
- **DirectIPCClient**: Manages P2P encrypted connections only
- **CryptoHelper**: Handles Diffie-Hellman key exchange and XOR encryption
- **Connection**: Represents individual P2P connection only
- **ConnectionManager**: Manages multiple P2P connections only

### Open/Closed Principle (OCP)
- All serializers extend the `Serializer` base class without modification
- New serializer types can be added by extending `Serializer`
- Collection serializers use factory functions for composability
- Custom serializers can be created by extending the base class

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

### Basic Usage

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

### Advanced Usage

```javascript
import { IPCClient } from './client/IPCClient.js';
import * as PROTO from './proto/index.js';
import { DirectIPCClient } from './direct/index.js';

// High-level IPC client
const client = new IPCClient();

// Use custom object serializers
const UserSerializer = PROTO.Object({
    name: PROTO.String,
    age: PROTO.Int32
});

client.send('user', UserSerializer, { name: 'John', age: 30 });

// P2P Encrypted connections
const p2pClient = new DirectIPCClient('my_peer_id');
const connection = await p2pClient.connect('other_peer_id', {
  encrypted: true,
  prime: 19893121,      // custom Diffie-Hellman prime
  generator: 341        // custom generator
});

connection.send('secure', PROTO.String, 'encrypted message');
```

### Creating Custom Serializers

```javascript
import { Serializer } from './proto/Serializer.js';
import * as PROTO from './proto/index.js';

class CustomSerializer extends Serializer {
    *serialize(value, buffer) {
        // Your serialization logic
        yield* PROTO.String.serialize(value.id, buffer);
        yield* PROTO.Int32.serialize(value.count, buffer);
    }

    *deserialize(buffer) {
        // Your deserialization logic
        const id = yield* PROTO.String.deserialize(buffer);
        const count = yield* PROTO.Int32.deserialize(buffer);
        return { id, count };
    }
}

const MyCustom = new CustomSerializer();
```

### NET (Low-Level API)

```javascript
import { system } from '@minecraft/server';
import IPC from './IPC.js';
import NET from './NET.js';
import * as PROTO from './proto/index.js';

// Using IPC (High Level - Channel based)
IPC.send('myChannel', PROTO.String, 'Hello via IPC');

// Using NET (Low Level - Endpoint based, bypasses channel abstraction)
system.runJob(NET.emit('custom:endpoint', PROTO.String, 'Hello via NET'));

// NET.FRAG_MAX is the maximum fragment size (2048 bytes)
console.log('Max fragment:', NET.FRAG_MAX);
```