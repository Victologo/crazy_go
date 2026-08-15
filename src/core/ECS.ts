// ECS.ts

import type { PlayerId } from './GraphBoard';

export type EntityId = string;

// Components
export interface PositionComponent {
    nodeIds: string[]; // Can occupy multiple nodes (e.g., 2x2 stones)
}

export interface StatusComponent {
    frozenTurns: number;
    invisibleTurns: number;
    indestructibleTurns: number;
}

export interface HeroComponent {
    heroType: string;
    // Specific hero logic can be added here or in systems
}

export interface StoneComponent {
    playerId: PlayerId;
    isGhost: boolean; // True if it's in pre-carga
}

// Entity Manager
export class EntityManager {
    private nextId: number = 1;
    
    // Component stores
    public positions: Map<EntityId, PositionComponent> = new Map();
    public statuses: Map<EntityId, StatusComponent> = new Map();
    public heroes: Map<EntityId, HeroComponent> = new Map();
    public stones: Map<EntityId, StoneComponent> = new Map();

    createEntity(): EntityId {
        return (this.nextId++).toString();
    }

    destroyEntity(id: EntityId) {
        this.positions.delete(id);
        this.statuses.delete(id);
        this.heroes.delete(id);
        this.stones.delete(id);
    }
}
