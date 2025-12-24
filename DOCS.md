# IPC System - Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Installation & Setup](#installation--setup)
3. [Quick Start](#quick-start)
4. [Architecture](#architecture)
5. [API Reference](#api-reference)
6. [Type System](#type-system)
7. [Examples](#examples)
8. [Advanced Usage](#advanced-usage)
9. [Testing](#testing)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)
12. [FAQ](#faq)

---

## Introduction

**IPC (Inter-Process Communication)** is a lightweight, production-ready messaging system for Minecraft Bedrock Edition scripting. It enables seamless communication between multiple scripts using a channel-based, message-passing architecture.

### Key Features

- **🔄 Bidirectional Communication** - Request-response pattern with `invoke/handle`
- **📦 Rich Type Support** - Primitives, objects, arrays, maps, and custom types
- **🎯 Channel-Based** - Organize communication with named channels
- **⚙️ Low-Level Access** - Direct endpoint control when needed
- **📊 Auto-Fragmentation** - Handles large messages automatically
- **✅ Tested & Reliable** - Comprehensive test suite included

---

## Installation & Setup

### 1. Import the Module

```javascript
import IPC, { PROTO } from './IPC.js';
```

### 2. Verify Installation

Run the test suite to ensure everything works:

```javascript
import { runAllTests } from './Utilities/IPC/tests/IPCTests.js';

world.afterEvents.worldLoad.subscribe(() => {
    runAllTests();
});
```

### 3. Alternative: Using NET (Low-level API)

```javascript
import NET from './NET.js';
```

---

## Quick Start

### Basic Message Sending (One-way)

**Sender:**
```javascript
import IPC, { PROTO } from './IPC.js';

IPC.send('notifications', PROTO.String, 'Player joined!');
```

**Receiver:**
```javascript
IPC.on('notifications', PROTO.String, (message) => {
    console.log('Notification:', message);
});
```

### Request-Response (Bidirectional)

**Server (Handler):**
```javascript
IPC.handle(
    'getPlayerData',
    PROTO.String,        // receives: player ID
    PROTO.Object({       // responds: player object
        name: PROTO.String,
        level: PROTO.Int32
    }),
    (playerId) => {
        return {
            name: 'Steve',
            level: 10
        };
    }
);
```

**Client (Invoker):**
```javascript
const playerData = await IPC.invoke(
    'getPlayerData',
    PROTO.String,
    'player123',
    PROTO.Object({
        name: PROTO.String,
        level: PROTO.Int32
    })
);

console.log('Player:', playerData.name, 'Level:', playerData.level);
```

---

## Architecture

### Three-Layer Design

```
┌─────────────────────────────────────────┐
│   IPC Layer (Application)               │
│   - send(), invoke(), on(), handle()    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   NET Layer (Network)                   │
│   - Message fragmentation               │
│   - Endpoint routing                    │
│   - Message reassembly                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   PROTO Layer (Protocol)                │
│   - Serialization/Deserialization       │
│   - Buffer management                   │
│   - Type encoding                       │
└─────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Purpose | Usage |
|-----------|---------|-------|
| **Buffer** | Byte buffer with dynamic resizing | Internal |
| **MIPS** | Hex string encoding/decoding | Internal |
| **Serializers** | Type-specific encode/decode | Configuration |
| **NetworkSerializer** | Network-level fragmentation | Internal |
| **EndpointManager** | Route listeners to endpoints | Internal |
| **MessageEmitter** | Send fragmented messages | Internal |
| **MessageListener** | Reassemble & route messages | Internal |
| **IPCClient** | High-level API | Application |
| **IPC** | Static facade | Application |

---

## API Reference

### IPC Class (High-Level API)

#### `IPC.send(channel, serializer, value)`

Sends a one-way message to all listeners on a channel.

```javascript
IPC.send('chat', PROTO.String, 'Hello everyone!');
```

**Parameters:**
- `channel` (string): Channel identifier
- `serializer` (object): Serializer for the value
- `value` (any): Data to send

**Returns:** undefined

---

#### `IPC.on(channel, deserializer, listener)`

Listens to all messages on a channel (multiple times).

```javascript
const unsubscribe = IPC.on('chat', PROTO.String, (message) => {
    console.log('Message:', message);
});

// Stop listening
unsubscribe();
```

**Parameters:**
- `channel` (string): Channel identifier
- `deserializer` (object): Deserializer for incoming data
- `listener` (function): Callback function

**Returns:** Function to unsubscribe

---

#### `IPC.once(channel, deserializer, listener)`

Listens to ONE message on a channel, then auto-unsubscribes.

```javascript
IPC.once('welcome', PROTO.String, (message) => {
    console.log('Welcome:', message); // Only called once
});
```

**Parameters:** Same as `on()`

**Returns:** Function to unsubscribe (can be called manually if needed)

---

#### `IPC.invoke(channel, requestSerializer, value, responseDeserializer)`

Sends a request and waits for a response asynchronously.

```javascript
const response = await IPC.invoke(
    'calculate',
    PROTO.Int32,
    42,
    PROTO.Int32
);
console.log('Response:', response);
```

**Parameters:**
- `channel` (string): Channel identifier
- `requestSerializer` (object): Serializer for request
- `value` (any): Request data
- `responseDeserializer` (object): Deserializer for response

**Returns:** Promise that resolves to the response

---

#### `IPC.handle(channel, requestDeserializer, responseSerializer, handler)`

Registers a handler to respond to invoke requests.

```javascript
IPC.handle(
    'calculate',
    PROTO.Int32,
    PROTO.Int32,
    (number) => {
        return number * 2;
    }
);
```

**Parameters:**
- `channel` (string): Channel identifier
- `requestDeserializer` (object): Deserializer for requests
- `responseSerializer` (object): Serializer for responses
- `handler` (function): Callback that returns response

**Returns:** Function to unsubscribe

---

#### `IPC.close()`

Closes the IPC client and cleans up resources.

```javascript
IPC.close();
```

---

### NET Class (Low-Level API)

For advanced users who need direct endpoint control.

#### `NET.emit(endpoint, serializer, value)`

Sends a message to a specific endpoint (bypasses channel abstraction).

```javascript
import { system } from '@minecraft/server';

system.runJob(NET.emit('custom:endpoint', PROTO.String, 'Data'));
```

**Returns:** Generator function (requires `system.runJob()`)

---

#### `NET.listen(endpoint, deserializer, callback)`

Listens on a specific endpoint.

```javascript
NET.listen('custom:endpoint', PROTO.String, function* (message) {
    console.log('Received:', message);
});
```

**Returns:** Function to unsubscribe

---

#### `NET.FRAG_MAX`

Maximum fragment size for network messages (2048 bytes).

```javascript
console.log('Max fragment size:', NET.FRAG_MAX);
```

---

## Type System

### Primitive Types

```javascript
PROTO.Int8          // -128 to 127
PROTO.Int16         // -32768 to 32767
PROTO.Int32         // -2147483648 to 2147483647
PROTO.UInt8         // 0 to 255
PROTO.UInt16        // 0 to 65535
PROTO.UInt32        // 0 to 4294967295
PROTO.VarInt32      // Variable-length signed integer
PROTO.Float32       // Single precision (4 bytes)
PROTO.Float64       // Double precision (8 bytes)
PROTO.Boolean       // true or false
PROTO.String        // Text (variable length)
```

### Collection Types

```javascript
// Array of integers
PROTO.Array(PROTO.Int32)

// Object with properties
PROTO.Object({
    name: PROTO.String,
    age: PROTO.Int32,
    active: PROTO.Boolean
})

// Tuple (fixed-length, heterogeneous)
PROTO.Tuple(PROTO.String, PROTO.Int32, PROTO.Boolean)

// Optional value (can be undefined)
PROTO.Optional(PROTO.String)

// Map with string keys and int values
PROTO.Map(PROTO.String, PROTO.Int32)

// Set of unique strings
PROTO.Set(PROTO.String)
```

### Special Types

```javascript
PROTO.Void        // No data
PROTO.Null        // Always null
PROTO.Undefined   // Always undefined
PROTO.Date        // JavaScript Date object
```

### Creating Custom Serializers

```javascript
const MyCustomType = {
    *serialize(value, stream) {
        // Encode value to stream
        yield* PROTO.String.serialize(value.name, stream);
        yield* PROTO.Int32.serialize(value.count, stream);
    },
    *deserialize(stream) {
        // Decode value from stream
        const name = yield* PROTO.String.deserialize(stream);
        const count = yield* PROTO.Int32.deserialize(stream);
        return { name, count };
    }
};

// Use it like any other serializer
IPC.send('custom', MyCustomType, { name: 'test', count: 5 });
```

---

## Examples

### Example 1: Simple Chat System

**Chat Server:**
```javascript
import IPC, { PROTO } from './IPC.js';

IPC.on('chat:message', PROTO.String, (message) => {
    console.log('[Chat]', message);
    // Broadcast to all players
});
```

**Chat Client:**
```javascript
import IPC, { PROTO } from './IPC.js';

IPC.send('chat:message', PROTO.String, 'Hello everyone!');
```

---

### Example 2: Player Data Service

**Data Service:**
```javascript
const PlayerSchema = PROTO.Object({
    id: PROTO.String,
    name: PROTO.String,
    level: PROTO.Int32,
    coins: PROTO.Int32
});

const players = new Map();

IPC.handle('player:get', PROTO.String, PlayerSchema, (playerId) => {
    return players.get(playerId) || { id: playerId, name: 'Unknown', level: 0, coins: 0 };
});

IPC.handle('player:set', PlayerSchema, PROTO.Boolean, (player) => {
    players.set(player.id, player);
    return true;
});
```

**Data Consumer:**
```javascript
// Get player data
const player = await IPC.invoke('player:get', PROTO.String, 'player123', PlayerSchema);
console.log(`${player.name} - Level ${player.level}`);

// Update player data
await IPC.invoke(
    'player:set',
    PlayerSchema,
    { id: 'player123', name: 'Steve', level: 5, coins: 100 },
    PROTO.Boolean
);
```

---

### Example 3: Inventory Management

**Inventory Service:**
```javascript
const ItemSchema = PROTO.Object({
    id: PROTO.String,
    name: PROTO.String,
    quantity: PROTO.Int32
});

const InventorySchema = PROTO.Object({
    playerId: PROTO.String,
    items: PROTO.Array(ItemSchema)
});

IPC.handle('inventory:get', PROTO.String, InventorySchema, (playerId) => {
    return {
        playerId,
        items: [
            { id: 'sword', name: 'Diamond Sword', quantity: 1 },
            { id: 'apple', name: 'Apple', quantity: 64 }
        ]
    };
});
```

**Inventory Consumer:**
```javascript
const inventory = await IPC.invoke(
    'inventory:get',
    PROTO.String,
    'player123',
    InventorySchema
);

inventory.items.forEach(item => {
    console.log(`${item.name} x${item.quantity}`);
});
```

---

### Example 4: Event Broadcasting

**Event Emitter:**
```javascript
const EventSchema = PROTO.Object({
    type: PROTO.String,
    timestamp: PROTO.Int32,
    data: PROTO.String
});

function emitEvent(type, data) {
    IPC.send('events', EventSchema, {
        type,
        timestamp: Date.now(),
        data
    });
}

// Usage
emitEvent('player:login', 'Steve');
emitEvent('server:tick', 'Tick 1000');
```

**Event Listener:**
```javascript
IPC.on('events', EventSchema, (event) => {
    console.log(`[${event.type}] ${event.data}`);
});
```

---

## Advanced Usage

### Scoped Channels

```javascript
// Group related channels
const CHANNELS = {
    CHAT: 'chat:message',
    PLAYER: 'player:update',
    WORLD: 'world:event'
};

IPC.send(CHANNELS.CHAT, PROTO.String, 'Hello');
```

---

### Error Handling

```javascript
try {
    const result = await IPC.invoke(
        'risky:operation',
        PROTO.Int32,
        42,
        PROTO.String
    );
    console.log('Success:', result);
} catch (error) {
    console.error('Operation failed:', error);
}
```

---

### Multiple Handlers (Service Pattern)

```javascript
// Service A provides endpoint 1
IPC.handle('service:a', PROTO.String, PROTO.String, (req) => `A: ${req}`);

// Service B provides endpoint 2
IPC.handle('service:b', PROTO.String, PROTO.String, (req) => `B: ${req}`);

// Client uses both
const resA = await IPC.invoke('service:a', PROTO.String, 'test', PROTO.String);
const resB = await IPC.invoke('service:b', PROTO.String, 'test', PROTO.String);
```

---

### Bulk Operations

```javascript
const NumberArray = PROTO.Array(PROTO.Int32);

IPC.handle('math:sum', NumberArray, PROTO.Int32, (numbers) => {
    return numbers.reduce((a, b) => a + b, 0);
});

const sum = await IPC.invoke('math:sum', NumberArray, [1, 2, 3, 4, 5], PROTO.Int32);
console.log('Sum:', sum); // 15
```

---

## Testing

### Run All Tests

```javascript
import { runAllTests } from './Utilities/IPC/tests/IPCTests.js';

world.afterEvents.worldLoad.subscribe(() => {
    runAllTests();
});
```

### Run Individual Tests

```javascript
import { 
    testSendOn, 
    testInvokeHandle, 
    testObjectCommunication 
} from './Utilities/IPC/tests/IPCTests.js';

await testSendOn();
await testInvokeHandle();
await testObjectCommunication();
```

### Available Tests

1. **testSendOn** - Basic one-way messaging
2. **testInvokeHandle** - Request-response pattern
3. **testObjectCommunication** - Object serialization
4. **testArrayCommunication** - Array operations
5. **testMultipleListeners** - Broadcasting
6. **testOnce** - Single message listening
7. **testComplexObjects** - Nested structures
8. **testPrimitives** - Primitive type handling

---

## Best Practices

### 1. Use Descriptive Channel Names

```javascript
// Good
IPC.send('player:levelup', ...)
IPC.send('inventory:update', ...)

// Avoid
IPC.send('msg', ...)
IPC.send('update', ...)
```

### 2. Define Schemas Centrally

```javascript
// schemas.js
export const UserSchema = PROTO.Object({
    id: PROTO.String,
    name: PROTO.String,
    level: PROTO.Int32
});

// other files
import { UserSchema } from './schemas.js';
IPC.send('user:update', UserSchema, userData);
```

### 3. Handle Errors Properly

```javascript
try {
    const response = await IPC.invoke(...);
} catch (error) {
    console.error('IPC Error:', error);
    // Fallback logic
}
```

### 4. Unsubscribe When Done

```javascript
const unsubscribe = IPC.on('channel', PROTO.String, (msg) => {
    // Handle message
});

// Later, clean up
unsubscribe();
```

### 5. Use once() for One-Time Events

```javascript
// Good for startup events
IPC.once('server:ready', PROTO.Boolean, (ready) => {
    console.log('Server is ready');
});
```

### 6. Type Safety with Custom Types

```javascript
// Validate data before sending
const UserSchema = PROTO.Object({
    name: PROTO.String,
    age: PROTO.Int32
});

const isValidUser = (user) => {
    return typeof user.name === 'string' && 
           typeof user.age === 'number' &&
           user.age > 0;
};

if (isValidUser(userData)) {
    IPC.send('user:create', UserSchema, userData);
}
```

---

## Troubleshooting

### Issue: Type Mismatch Errors

**Solution:** Ensure serializer and deserializer match.

```javascript
// Send with Int32
IPC.send('channel', PROTO.Int32, 42);

// Receive with Int32 (must match!)
IPC.on('channel', PROTO.Int32, (value) => console.log(value));
```

---

### Issue: Memory Leaks from Listeners

**Solution:** Always unsubscribe when done.

```javascript
// Bad - listener stays in memory
IPC.on('channel', PROTO.String, (msg) => console.log(msg));

// Good - clean up
const unsubscribe = IPC.on('channel', PROTO.String, (msg) => {
    console.log(msg);
});
unsubscribe(); // Remove listener
```

---

## FAQ

### Q: What's the difference between `send()` and `invoke()`?

**A:**
- `send()` - One-way message, no response expected
- `invoke()` - Request-response, waits for handler to respond

### Q: Can multiple handlers exist for the same channel?

**A:** No, the last handler registered will override previous ones. Use `IPC.on()` for multiple listeners.

### Q: What happens if invoke() times out?

**A:** It will continue waiting indefinitely. Implement a timeout wrapper if needed:

```javascript
const timeoutInvoke = (channel, reqSerializer, value, resDeserializer, timeoutTicks = 100) => {
    return Promise.race([
        IPC.invoke(channel, reqSerializer, value, resDeserializer),
        new Promise((_, reject) => 
            system.runTimeout(() => reject(new Error('Timeout')), 100)
        )
    ]);
};
```

### Q: Can I send custom objects?

**A:** Yes! Create a schema using `PROTO.Object()`:

```javascript
const CustomSchema = PROTO.Object({
    field1: PROTO.String,
    field2: PROTO.Int32
});
```

### Q: Is the IPC system thread-safe?

**A:** Messages are processed sequentially through Minecraft's script engine, so it's safe for game operations.

### Q: How large can messages be?

**A:** Unlimited - the system auto-fragments at 2048 bytes per fragment and reassembles on the other end.

### Q: Can I use IPC between different behavior packs?

**A:** Yes, as long as they're loaded in the same world. They share the script event system.

### Q: Is there a message queue if no listener exists?

**A:** No, messages are delivered immediately. If no listener exists, the message is lost. Use `handle()` for guaranteed delivery via `invoke()`.

### Q: Can I monitor IPC traffic for debugging?

**A:** Yes, add logging in your handlers:

```javascript
IPC.on('debug:channel', PROTO.String, (msg) => {
    console.log('[IPC Debug]', msg);
});
```

---