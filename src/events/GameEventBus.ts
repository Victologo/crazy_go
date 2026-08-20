import type { PlayerId } from '../core/GraphBoard';
import type { ScoreReport } from '../core/TerritoryScorer';

export interface EntityCapturedPayload {
    captive: any;
    capturerId: PlayerId;
    gameMode: string;
}

export interface MatchEndedPayload {
    report: ScoreReport;
    gameMode: string;
}

export type GameEventMap = {
    'ENTITY_CAPTURED': EntityCapturedPayload;
    'MATCH_ENDED': MatchEndedPayload;
};

export type GameEventType = keyof GameEventMap;

type EventHandler<T extends GameEventType> = (payload: GameEventMap[T]) => void;

export class GameEventBus {
    private static listeners: { [K in GameEventType]?: EventHandler<K>[] } = {};

    public static on<T extends GameEventType>(event: T, handler: EventHandler<T>): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(handler);
    }

    public static off<T extends GameEventType>(event: T, handler: EventHandler<T>): void {
        const eventListeners = this.listeners[event];
        if (eventListeners) {
            this.listeners[event] = eventListeners.filter(h => h !== handler) as any;
        }
    }

    public static emit<T extends GameEventType>(event: T, payload: GameEventMap[T]): void {
        const eventListeners = this.listeners[event];
        if (eventListeners) {
            // Copiamos el array para evitar problemas si un listener se da de baja durante la iteración
            const listenersCopy = [...eventListeners];
            for (const handler of listenersCopy) {
                try {
                    handler(payload);
                } catch (e) {
                    console.error(`Error en listener del evento ${event}:`, e);
                }
            }
        }
    }

    public static clearAll(): void {
        this.listeners = {};
    }
}
