import { world } from '@minecraft/server';
import IPC, { PROTO } from './IPC';

/**
 * Tests IPC send and on functionality
 */
function sendAndOnTest(): void {
  const sentAt = Date.now();
  IPC.on('ipc:ready', PROTO.String, () => {
    const receivedAt = Date.now();
    console.log(`IPC Send | Delay: ${receivedAt - sentAt} ms`);
  });
  IPC.send('ipc:ready', PROTO.String, 'IPC System Ready');
}

/**
 * Tests IPC invoke functionality with tuple schema
 */
async function invokeTest(): Promise<void> {
  const pingSentAt = Date.now();

  // Schema: [String, Object with world properties, UInt32]
  const tupleSchema = PROTO.Tuple(
    PROTO.String,
    PROTO.Object({
      dimension: PROTO.String,
    }),
    PROTO.UInt32
  );

  IPC.handle('ipc:ping', tupleSchema, tupleSchema, (array) => {
    return array;
  });

  // sends: [string, {dimension: "minecraft:overworld"}, number]
  const response = await IPC.invoke(
    'ipc:ping',
    tupleSchema,
    ['data', { dimension: world.getDimension('overworld').id }, 42],
    tupleSchema
  );
  const pingReceivedAt = Date.now();
  console.log(`Response: ${JSON.stringify(response)}`);
  console.log(`IPC Invoke | Ping round-trip time: ${pingReceivedAt - pingSentAt} ms`);
}

/**
 * Tests IPC invoke with custom message
 */
async function invokeTestWithCustomSerializer(): Promise<void> {
  const pingSentAt = Date.now();
  IPC.handle('ipc:custom', PROTO.World, PROTO.String, (serializedWorld) => {
    console.log('Custom handler received message:', serializedWorld);
    return `World time: ${serializedWorld.time}, Difficulty: ${serializedWorld.difficulty}`;
  });

  const response = await IPC.invoke('ipc:custom', PROTO.World, world, PROTO.String);
  console.log('Custom serializer response:', response);
  const pingReceivedAt = Date.now();
  console.log(`IPC Invoke | Custom serializer Ping round-trip time: ${pingReceivedAt - pingSentAt} ms`);
  console.log(JSON.stringify(response));
}
