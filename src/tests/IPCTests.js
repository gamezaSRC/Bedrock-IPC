/**
 * IPC System - Test Suite
 * Demonstrates the functionality of send, invoke, on and handle
 */

import { system } from '@minecraft/server';
import IPC, { PROTO } from '../IPC.js';
/**
 * Test 1: send/on - Unidirectional Communication
 */
function testSendOn() {
    console.log('=== TEST 1: send/on ===');
    
    // Listener - receiver
    const unsubscribe = IPC.on('test:notification', PROTO.String, (message) => {
        console.log('Message received:', message);
    });
    
    // Sender - emitter
    IPC.send('test:notification', PROTO.String, 'Hello from send!');
    // Clean up listener
    // unsubscribe();
}

/**
 * Test 2: invoke/handle - Bidirectional with response
 */
async function testInvokeHandle() {
    console.log('\n=== TEST 2: invoke/handle ===');
    
    // Handler - responds to questions
    const unsubscribe = IPC.handle(
        'test:calculate',
        PROTO.Int32,  // receives
        PROTO.Int32,  // responds
        (number) => {
            console.log('Handler received:', number);
            return number * 2;
        }
    );
    
    // Invoker - asks the question
    const result = await IPC.invoke(
        'test:calculate',
        PROTO.Int32,  // sends
        21,
        PROTO.Int32   // expects
    );
    console.log('Response:', result); // Should be 42
    
    // Limpiar handler
    // unsubscribe();
}

/**
 * Test 3: Communication with Objects
 */
async function testObjectCommunication() {
    console.log('\n=== TEST 3: Objects ===');
    
    const UserSchema = PROTO.Object({
        name: PROTO.String,
        level: PROTO.Int32,
        active: PROTO.Boolean
    });
    
    IPC.handle(
        'test:getUser',
        PROTO.String,      // receives: user ID
        UserSchema,        // responds: complete user
        (userId) => {
            console.log('User requested:', userId);
            return {
                name: 'Steve',
                level: 10,
                active: true
            };
        }
    );
    
    const user = await IPC.invoke(
        'test:getUser',
        PROTO.String,
        'user123',
        UserSchema
    );
    console.log('User obtained:', JSON.stringify(user));
}

/**
 * Test 4: Communication with Arrays
 */
async function testArrayCommunication() {
    console.log('\n=== TEST 4: Arrays ===');
    
    const NumberArraySchema = PROTO.Array(PROTO.Int32);
    
    IPC.handle(
        'test:sumArray',
        NumberArraySchema,
        PROTO.Int32,
        (numbers) => {
            console.log('Array received:', numbers);
            const sum = numbers.reduce((a, b) => a + b, 0);
            return sum;
        }
    );
    
    const suma = await IPC.invoke(
        'test:sumArray',
        NumberArraySchema,
        [10, 20, 30, 40],
        PROTO.Int32
    );
    console.log('Sum:', suma); // Should be 100
}

/**
 * Test 5: Multiple listeners
 */
async function testMultipleListeners() {
    console.log('\n=== TEST 5: Multiple Listeners ===');

    IPC.on('test:broadcast', PROTO.String, (msg) => {
        console.log('Listener 1 received:', msg);
    });
    
    IPC.on('test:broadcast', PROTO.String, (msg) => {
        console.log('Listener 2 received:', msg);
    });
    
    // Small delay to ensure listeners are registered
    await system.waitTicks(1);
        
    IPC.send('test:broadcast', PROTO.String, 'Message to everyone!');
}

/**
 * Test 6: once - Listen only once
 */
async function testOnce() {
    console.log('\n=== TEST 6: once ===');
    
    IPC.once('test:oneTime', PROTO.String, (msg) => {
        console.log('Unique message received:', msg);
    });
    
    // Small delay to ensure the listener is registered
    await system.waitTicks(1);
    
    IPC.send('test:oneTime', PROTO.String, 'First message');
    IPC.send('test:oneTime', PROTO.String, 'Second message - not received');
}

/**
 * Test 7: Complex Objects
 */
async function testComplexObjects() {
    console.log('\n=== TEST 7: Complex Objects ===');
    
    const ItemSchema = PROTO.Object({
        name: PROTO.String,
        quantity: PROTO.Int32
    });
    
    const InventorySchema = PROTO.Object({
        player: PROTO.String,
        items: PROTO.Array(ItemSchema)
    });
    
    IPC.handle(
        'test:getInventory',
        PROTO.String,
        InventorySchema,
        (playerId) => {
            console.log('Inventory requested for:', playerId);
            return {
                player: playerId,
                items: [
                    { name: 'Diamond Sword', quantity: 1 },
                    { name: 'Apples', quantity: 64 },
                    { name: 'Dirt Blocks', quantity: 128 }
                ]
            };
        }
    );
    
    const inventory = await IPC.invoke(
        'test:getInventory',
        PROTO.String,
        'Steve123',
        InventorySchema
    );
    console.log('Inventory:', JSON.stringify(inventory));
}

/**
 * Test 8: Primitive Serializers
 */
async function testPrimitives() {
    console.log('\n=== TEST 8: Primitive Types ===');
    
    // Test Int8
    IPC.handle('test:int8', PROTO.Int8, PROTO.Int8, (v) => v + 10);
    const r1 = await IPC.invoke('test:int8', PROTO.Int8, 5, PROTO.Int8);
    console.log('Int8:', r1); // 15
    
    // Test Float32
    IPC.handle('test:float', PROTO.Float32, PROTO.Float32, (v) => v * 2.5);
    const r2 = await IPC.invoke('test:float', PROTO.Float32, 4.0, PROTO.Float32);
    console.log('Float32:', r2); // 10.0
    
    // Test Boolean
    IPC.handle('test:bool', PROTO.Boolean, PROTO.Boolean, (v) => !v);
    const r3 = await IPC.invoke('test:bool', PROTO.Boolean, true, PROTO.Boolean);
    console.log('Boolean:', r3); // false
}

export async function runAllTests() {
    try {
        testSendOn();
        await testInvokeHandle();
        await testObjectCommunication();
        await testArrayCommunication();
        await testMultipleListeners();
        await testOnce();
        await testComplexObjects();
        await testPrimitives();
        
        console.log('\nAll tests completed successfully!');
    } catch (error) {
        console.error('Error in tests:', error);
    }
}

// Export individual tests
export {
    testSendOn,
    testInvokeHandle,
    testObjectCommunication,
    testArrayCommunication,
    testMultipleListeners,
    testOnce,
    testComplexObjects,
    testPrimitives
};
