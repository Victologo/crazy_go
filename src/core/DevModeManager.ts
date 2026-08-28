// core/DevModeManager.ts - Gestor de Modo Desarrollador (Developer Mode) con Sandbox integrado
import type { GameMode } from '../types';
import { RoguelikeRunManager } from './RoguelikeRunManager';

export class DevModeManager {
    private static readonly STORAGE_KEY = 'crazy_go_dev_mode';
    private static _isDevMode: boolean = false;

    public static init() {
        try {
            // Migrar sandbox_mode anterior si existía
            const legacySandbox = localStorage.getItem('crazy_go_sandbox_mode');
            if (legacySandbox === 'true') {
                localStorage.setItem(this.STORAGE_KEY, 'true');
                localStorage.removeItem('crazy_go_sandbox_mode');
            }
            this._isDevMode = localStorage.getItem(this.STORAGE_KEY) === 'true';
        } catch {
            this._isDevMode = false;
        }
    }

    public static isDevMode(): boolean {
        return this._isDevMode;
    }

    /** Alias para compatibilidad con código que usaba sandbox mode separado */
    public static isSandboxMode(): boolean {
        return this._isDevMode;
    }

    public static setDevMode(enabled: boolean): void {
        this._isDevMode = enabled;
        try {
            localStorage.setItem(this.STORAGE_KEY, enabled ? 'true' : 'false');
        } catch (e) {
            console.warn('Could not save dev mode to localStorage', e);
        }
    }

    public static toggleDevMode(): boolean {
        const nextState = !this._isDevMode;
        this.setDevMode(nextState);
        return nextState;
    }

    /** Alias para compatibilidad con código que usaba toggleSandboxMode */
    public static setSandboxMode(enabled: boolean): void {
        this.setDevMode(enabled);
    }

    public static toggleSandboxMode(): boolean {
        return this.toggleDevMode();
    }

    // ==================== PERMISOS ====================

    /**
     * Undo/Redo: permitido en partidas locales, modo historia y siempre si Dev Mode está activo.
     */
    public static isUndoRedoAllowed(gameMode: GameMode): boolean {
        if (gameMode === 'online') return false;
        if (this._isDevMode) return true;
        if (RoguelikeRunManager.isRunActive) return false;
        return gameMode === '1v1' || gameMode === '1via' || gameMode === 'story';
    }

    /**
     * Sandbox Testing Lab: disponible en partidas locales, modo historia y en CUALQUIER modo si Dev Mode está activo.
     * Online: bloqueado siempre.
     */
    public static isSandboxAllowed(gameMode: GameMode): boolean {
        if (gameMode === 'online') return false;
        if (this._isDevMode) return true;
        if (RoguelikeRunManager.isRunActive) return false;
        return gameMode === '1v1' || gameMode === '1via' || gameMode === 'story';
    }
}
