// core/DevModeManager.ts - Gestor de Modo Desarrollador (Developer Mode) vs Modo Jugador Normal
import type { GameMode } from '../types';

export class DevModeManager {
    private static readonly STORAGE_KEY = 'crazy_go_dev_mode';
    private static _isDevMode: boolean = false;

    public static init() {
        try {
            this._isDevMode = localStorage.getItem(this.STORAGE_KEY) === 'true';
        } catch {
            this._isDevMode = false;
        }
    }

    public static isDevMode(): boolean {
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

    /**
     * Retorna si las acciones de Deshacer (Undo) y Rehacer (Redo) están permitidas.
     * - Online: NUNCA permitidas.
     * - Roguelike e Historia: Bloqueadas para usuario normal (solo permitidas si DevMode está activo).
     * - Local libre (1v1 / 1vIA): Permitidas para análisis y práctica.
     */
    public static isUndoRedoAllowed(gameMode: GameMode): boolean {
        if (gameMode === 'online') return false;
        if (this._isDevMode) return true;
        return gameMode === '1v1' || gameMode === '1via';
    }

    /**
     * Retorna si el botón y acceso al Laboratorio Sandbox (Pruebas) en el HUD está permitido.
     * - Online: NUNCA permitido.
     * - Roguelike e Historia: Bloqueado para usuario normal (solo permitido si DevMode está activo).
     * - Local libre: Permitido.
     */
    public static isSandboxAllowed(gameMode: GameMode): boolean {
        if (gameMode === 'online') return false;
        if (this._isDevMode) return true;
        return gameMode === '1v1' || gameMode === '1via';
    }
}
