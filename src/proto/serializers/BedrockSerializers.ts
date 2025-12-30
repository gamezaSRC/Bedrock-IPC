import { Serializer } from '../Serializer';
import {
  VarUInt64,
  VarUInt32,
  Boolean as BooleanSerializer,
  UInt8,
  UInt16,
  Int32,
  Float32
} from './PrimitiveSerializers';
import { String as StringSerializer } from './StringSerializer';
import type { ByteBuffer } from '../ByteBuffer';
import type {
  World as WorldType,
  Block as BlockType,
  Entity as EntityType,
  Player as PlayerType,
  ItemStack as ItemStackType
} from '@minecraft/server';

// Serialized types
export interface SerializedWorld {
  time: number;
  dayTime: number;
  moonPhase: number;
  difficulty: string;
  isHardcore: boolean;
}

export interface SerializedItemStack {
  typeId: string;
  amount: number;
  nameTag: string | null;
  durability?: number;
}

export interface SerializedEntity {
  typeId: string;
  id: string;
  location: { x: number; y: number; z: number };
  rotation: { x: number; y: number };
  isValid: boolean;
  isSneaking: boolean;
  isSprinting: boolean;
  nameTag: string | null;
  dimension: string;
}

export interface SerializedPlayer extends SerializedEntity {
  name: string;
  health: number;
  hunger: number;
  gameMode: string;
  level: number;
  graphicsMode: string;
}

export interface SerializedBlock {
  typeId: string;
  location: { x: number; y: number; z: number };
  permutation: { id: string; states: Record<string, unknown> } | null;
  hasInventory: boolean;
  states: Record<string, unknown>;
}

/**
 * World serializer
 */
export class WorldSerializer extends Serializer<SerializedWorld> {
  *serialize(world: any, buffer: ByteBuffer): Generator<void, void> {
    yield* VarUInt64.serialize(BigInt(world.getAbsoluteTime?.() || Date.now()), buffer);
    yield* VarUInt64.serialize(BigInt(world.getTimeOfDay() || 0), buffer);
    yield* UInt8.serialize(world.getMoonPhase?.() || 0, buffer);
    yield* StringSerializer.serialize(world.getDifficulty?.() || 'Easy', buffer);
    yield* BooleanSerializer.serialize(world.isHardcore || false, buffer);
  }

  *deserialize(buffer: ByteBuffer): Generator<void, SerializedWorld> {
    const time = yield* VarUInt64.deserialize(buffer);
    const dayTime = yield* VarUInt64.deserialize(buffer);
    const moonPhase = yield* UInt8.deserialize(buffer);
    const difficulty = yield* StringSerializer.deserialize(buffer);
    const isHardcore = yield* BooleanSerializer.deserialize(buffer);

    return {
      time: Number(time),
      dayTime: Number(dayTime),
      moonPhase,
      difficulty,
      isHardcore
    };
  }
}

/**
 * ItemStack serializer
 */
export class ItemStackSerializer extends Serializer<SerializedItemStack | null> {
  *serialize(item: any, buffer: ByteBuffer): Generator<void, void> {
    if (!item) {
      yield* UInt8.serialize(0, buffer);
      return;
    }

    yield* UInt8.serialize(1, buffer);
    yield* StringSerializer.serialize(item.typeId || '', buffer);
    yield* UInt8.serialize(item.amount || 1, buffer);
    if (item.nameTag) {
      yield* BooleanSerializer.serialize(true, buffer);
      yield* StringSerializer.serialize(item.nameTag, buffer);
    } else {
      yield* BooleanSerializer.serialize(false, buffer);
    }
    const durability = (item as unknown as { durability?: number }).durability;
    if (durability !== undefined) {
      yield* BooleanSerializer.serialize(true, buffer);
      yield* VarUInt32.serialize(durability, buffer);
    } else {
      yield* BooleanSerializer.serialize(false, buffer);
    }
  }

  *deserialize(buffer: ByteBuffer): Generator<void, SerializedItemStack | null> {
    const isNull = yield* UInt8.deserialize(buffer);
    if (isNull === 0) return null;

    const typeId = yield* StringSerializer.deserialize(buffer);
    const amount = yield* UInt8.deserialize(buffer);

    const hasNameTag = yield* BooleanSerializer.deserialize(buffer);
    const nameTag = hasNameTag ? yield* StringSerializer.deserialize(buffer) : null;

    const hasDurability = yield* BooleanSerializer.deserialize(buffer);
    const durability = hasDurability ? yield* VarUInt32.deserialize(buffer) : undefined;

    return {
      typeId,
      amount,
      nameTag,
      durability
    };
  }
}

/**
 * Entity serializer
 */
export class EntitySerializer extends Serializer<SerializedEntity | null> {
  *serialize(entity: any, buffer: ByteBuffer): Generator<void, void> {
    if (!entity || !entity.isValid) {
      yield* UInt8.serialize(0, buffer);
      return;
    }
    const typeId = entity.typeId || '';
    const id = entity.id || '';
    const loc = entity.location || { x: 0, y: 0, z: 0 };
    const rot = entity.getRotation?.() || { x: 0, y: 0 };
    const nameTag = entity.nameTag;
    const dimensionId = entity.dimension?.id || 'minecraft:overworld';
    const isSneaking = entity.isSneaking || false;
    const isSprinting = entity.isSprinting || false;

    yield* UInt8.serialize(1, buffer);
    yield* StringSerializer.serialize(typeId || '', buffer);
    yield* StringSerializer.serialize(id || '', buffer);
    yield* Float32.serialize(loc.x, buffer);
    yield* Float32.serialize(loc.y, buffer);
    yield* Float32.serialize(loc.z, buffer);
    yield* Float32.serialize(rot.x, buffer);
    yield* Float32.serialize(rot.y, buffer);
    yield* BooleanSerializer.serialize(entity.isValid || false, buffer);
    yield* BooleanSerializer.serialize(isSneaking || false, buffer);
    yield* BooleanSerializer.serialize(isSprinting || false, buffer);
    if (nameTag) {
      yield* BooleanSerializer.serialize(true, buffer);
      yield* StringSerializer.serialize(nameTag, buffer);
    } else {
      yield* BooleanSerializer.serialize(false, buffer);
    }
    yield* StringSerializer.serialize(dimensionId, buffer);
  }

  *deserialize(buffer: ByteBuffer): Generator<void, SerializedEntity | null> {
    const isNull = yield* UInt8.deserialize(buffer);
    if (isNull === 0) return null;

    const typeId = yield* StringSerializer.deserialize(buffer);
    const id = yield* StringSerializer.deserialize(buffer);

    const x = yield* Float32.deserialize(buffer);
    const y = yield* Float32.deserialize(buffer);
    const z = yield* Float32.deserialize(buffer);

    const rotX = yield* Float32.deserialize(buffer);
    const rotY = yield* Float32.deserialize(buffer);

    const isValid = yield* BooleanSerializer.deserialize(buffer);
    const isSneaking = yield* BooleanSerializer.deserialize(buffer);
    const isSprinting = yield* BooleanSerializer.deserialize(buffer);

    const hasNameTag = yield* BooleanSerializer.deserialize(buffer);
    const nameTag = hasNameTag ? yield* StringSerializer.deserialize(buffer) : null;
    const dimension = yield* StringSerializer.deserialize(buffer);

    return {
      typeId,
      id,
      location: { x, y, z },
      rotation: { x: rotX, y: rotY },
      isValid,
      isSneaking,
      isSprinting,
      nameTag,
      dimension
    };
  }
}

/**
 * Player serializer - extends Entity
 */
export class PlayerSerializer extends EntitySerializer {
  *serialize(player: PlayerType | null, buffer: ByteBuffer): Generator<void, void> {
    yield* super.serialize(player, buffer);
    if (!player || !player.isValid) return;
    const name = player.name || '';
    const health = player.getComponent?.('minecraft:health')?.currentValue ?? 20;
    const hunger = (player.getComponent?.('minecraft:player.hunger') as { currentValue?: number })?.currentValue ?? 20;
    const gameMode = player.getGameMode?.() || 'Survival';
    const level = player.level || 0;
    const graphicsMode = player.graphicsMode || 'Simple';
    yield* StringSerializer.serialize(name, buffer);
    yield* Float32.serialize(health, buffer);
    yield* Float32.serialize(hunger, buffer);
    yield* StringSerializer.serialize(gameMode, buffer);
    yield* VarUInt32.serialize(level, buffer);
    yield* StringSerializer.serialize(graphicsMode, buffer);
  }

  *deserialize(buffer: ByteBuffer): Generator<void, SerializedPlayer | null> {
    const entityData = yield* super.deserialize(buffer);
    if (!entityData) return null;

    const name = yield* StringSerializer.deserialize(buffer);
    const health = yield* Float32.deserialize(buffer);
    const hunger = yield* Float32.deserialize(buffer);
    const gameMode = yield* StringSerializer.deserialize(buffer);
    const level = yield* VarUInt32.deserialize(buffer);
    const graphicsMode = yield* StringSerializer.deserialize(buffer);

    return {
      ...entityData,
      name,
      health,
      hunger,
      gameMode,
      level,
      graphicsMode
    };
  }
}

/**
 * Block serializer
 */
export class BlockSerializer extends Serializer<SerializedBlock | null> {
  *serialize(block: any, buffer: ByteBuffer): Generator<void, void> {
    if (!block) {
      yield* UInt8.serialize(0, buffer);
      return;
    }
    yield* UInt8.serialize(1, buffer);
    yield* StringSerializer.serialize(block.typeId || '', buffer);

    const loc = block.location || { x: 0, y: 0, z: 0 };
    yield* Int32.serialize(loc.x, buffer);
    yield* Int32.serialize(loc.y, buffer);
    yield* Int32.serialize(loc.z, buffer);

    const perm = block.permutation;
    if (perm) {
      yield* BooleanSerializer.serialize(true, buffer);
      yield* StringSerializer.serialize((perm as unknown as { id?: string }).id || '', buffer);

      const allStates = perm.getAllStates?.() || {};
      const stateCount = Object.keys(allStates).length;
      yield* UInt16.serialize(stateCount, buffer);

      for (const [key, value] of Object.entries(allStates)) {
        yield* StringSerializer.serialize(key, buffer);
        yield* StringSerializer.serialize(String(value), buffer);
      }
    } else {
      yield* BooleanSerializer.serialize(false, buffer);
    }
    const inventory = block.getComponent?.('minecraft:inventory');
    yield* BooleanSerializer.serialize(!!inventory, buffer);
  }

  *deserialize(buffer: ByteBuffer): Generator<void, SerializedBlock | null> {
    const isNull = yield* UInt8.deserialize(buffer);
    if (isNull === 0) return null;

    const typeId = yield* StringSerializer.deserialize(buffer);

    const x = yield* Int32.deserialize(buffer);
    const y = yield* Int32.deserialize(buffer);
    const z = yield* Int32.deserialize(buffer);

    const hasPermutation = yield* BooleanSerializer.deserialize(buffer);
    let permutation: { id: string; states: Record<string, unknown> } | null = null;
    const states: Record<string, unknown> = {};

    if (hasPermutation) {
      const permId = yield* StringSerializer.deserialize(buffer);
      const stateCount = yield* UInt16.deserialize(buffer);

      for (let i = 0; i < stateCount; i++) {
        const key = yield* StringSerializer.deserialize(buffer);
        const value = yield* StringSerializer.deserialize(buffer);
        if (value === 'true') states[key] = true;
        else if (value === 'false') states[key] = false;
        else if (!isNaN(Number(value))) states[key] = parseInt(value);
        else states[key] = value;
      }
      permutation = { id: permId, states };
    }
    const hasInventory = yield* BooleanSerializer.deserialize(buffer);
    return {
      typeId,
      location: { x, y, z },
      permutation,
      hasInventory,
      states
    };
  }
}

// Singleton instances
const WorldS = new WorldSerializer();
const ItemStackS = new ItemStackSerializer();
const EntityS = new EntitySerializer();
const PlayerS = new PlayerSerializer();
const BlockS = new BlockSerializer();
export {
  WorldS as World,
  ItemStackS as ItemStack,
  EntityS as Entity,
  PlayerS as Player,
  BlockS as Block
}
