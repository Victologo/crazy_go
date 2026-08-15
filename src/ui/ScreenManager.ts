// ui/ScreenManager.ts - Gestión de Navegación entre Pantallas Principales
import { RoguelikeRunManager } from '../core/RoguelikeRunManager';
import type { RogueliteDifficulty } from '../types';
import { BGMGenerator } from '../audio/BGMGenerator';

export type AppScreen = 'main-menu' | 'roguelike-map' | 'game';

export class ScreenManager {
    private static currentScreen: AppScreen = 'main-menu';
    private static onScreenChangeCallback: ((screen: AppScreen) => void) | null = null;

    public static init(onScreenChange?: (screen: AppScreen) => void) {
        this.onScreenChangeCallback = onScreenChange || null;
    }

    public static getCurrentScreen(): AppScreen {
        return this.currentScreen;
    }

    public static showMainMenu() {
        this.currentScreen = 'main-menu';
        document.getElementById('main-menu-screen')?.classList.remove('hidden');
        document.getElementById('game-screen')?.classList.add('hidden');
        document.getElementById('roguelike-map-screen')?.classList.add('hidden');

        BGMGenerator.playMap();

        if (this.onScreenChangeCallback) {
            this.onScreenChangeCallback('main-menu');
        }
    }

    public static showRoguelikeMapScreen() {
        this.currentScreen = 'roguelike-map';
        document.getElementById('main-menu-screen')?.classList.add('hidden');
        document.getElementById('game-screen')?.classList.add('hidden');
        document.getElementById('roguelike-map-screen')?.classList.remove('hidden');

        // Actualizar HUD del mapa
        this.updateMapHUD();
        BGMGenerator.playMap();

        if (this.onScreenChangeCallback) {
            this.onScreenChangeCallback('roguelike-map');
        }
    }

    public static showGameScreen() {
        this.currentScreen = 'game';
        document.getElementById('main-menu-screen')?.classList.add('hidden');
        document.getElementById('roguelike-map-screen')?.classList.add('hidden');
        document.getElementById('game-screen')?.classList.remove('hidden');

        BGMGenerator.playBattle();

        if (this.onScreenChangeCallback) {
            this.onScreenChangeCallback('game');
        }
    }

    public static updateMapHUD() {
        const hero = RoguelikeRunManager.HEROES[RoguelikeRunManager.selectedHero];
        const avatarEl = document.getElementById('map-hero-avatar');
        const nameEl = document.getElementById('map-hero-name');
        const diffEl = document.getElementById('map-diff-text');
        if (avatarEl) avatarEl.innerText = hero.icon;
        if (nameEl) nameEl.innerText = hero.name;
        if (diffEl) {
            const diffLabels: Record<RogueliteDifficulty, string> = {
                easy: '🟢 Fácil',
                normal: '🟡 Normal',
                hard: '🔴 Difícil',
                extreme: '🟣 Gran Maestro'
            };
            diffEl.innerText = diffLabels[RoguelikeRunManager.runDifficulty] || '🟢 Fácil';
        }
    }
}
