// ui/ScreenManager.ts - Gestión de Navegación entre Pantallas Principales
import { RoguelikeRunManager } from '../core/RoguelikeRunManager';
import type { RogueliteDifficulty } from '../types';
import { BGMGenerator } from '../audio/BGMGenerator';
import { getLanguage } from '../i18n/i18n';
import { MenuCameraController } from '../controllers/MenuCameraController';
import { StoryModeController } from '../story/StoryModeController';
import { TutorialManager } from '../tutorial/TutorialManager';

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

    public static isTransitioning = false;

    public static async transitionTo(targetScreen: AppScreen, onMidpoint?: () => void, instant: boolean = false): Promise<void> {
        if (this.currentScreen === targetScreen && !document.getElementById(`${targetScreen}-screen`)?.classList.contains('hidden')) {
            if (onMidpoint) onMidpoint();
            return;
        }

        const overlay = document.getElementById('screen-transition-overlay');

        if (!instant && overlay) {
            this.isTransitioning = true;
            overlay.classList.add('transition-active');
            await new Promise(r => setTimeout(r, 240));
        }

        // Punto ciego (Midpoint): Conmutación del DOM de pantallas
        document.getElementById('main-menu-screen')?.classList.toggle('hidden', targetScreen !== 'main-menu');
        document.getElementById('roguelike-map-screen')?.classList.toggle('hidden', targetScreen !== 'roguelike-map');
        document.getElementById('game-screen')?.classList.toggle('hidden', targetScreen !== 'game');

        this.currentScreen = targetScreen;

        if (targetScreen === 'main-menu') {
            (window as any).GameController?.stopGame();
            if (StoryModeController.isStoryActive) {
                StoryModeController.stopCampaign();
            }
            if (TutorialManager.isActive) {
                TutorialManager.stopTutorial();
            }
            MenuCameraController.reset();
            BGMGenerator.playMenu();
        } else if (targetScreen === 'roguelike-map') {
            (window as any).GameController?.stopGame();
            if (StoryModeController.isStoryActive) {
                StoryModeController.stopCampaign();
            }
            this.updateMapHUD();
            BGMGenerator.playMap();
        }

        if (onMidpoint) {
            try {
                onMidpoint();
            } catch (err) {
                console.error('[ScreenManager] Error during onMidpoint callback:', err);
            }
        }

        if (this.onScreenChangeCallback) {
            this.onScreenChangeCallback(targetScreen);
        }

        if (!instant && overlay) {
            await new Promise(r => setTimeout(r, 40));
            overlay.classList.remove('transition-active');
            await new Promise(r => setTimeout(r, 300));
            this.isTransitioning = false;
        }
    }

    public static showMainMenu(instant: boolean = false) {
        this.transitionTo('main-menu', undefined, instant);
    }

    public static showRoguelikeMapScreen(instant: boolean = false) {
        this.transitionTo('roguelike-map', undefined, instant);
    }

    public static showGameScreen(onMidpoint?: () => void, instant: boolean = false) {
        this.transitionTo('game', onMidpoint, instant);
    }

    public static updateMapHUD() {
        const hero = RoguelikeRunManager.HEROES[RoguelikeRunManager.selectedHero];
        const avatarEl = document.getElementById('map-hero-avatar');
        const nameEl = document.getElementById('map-hero-name');
        const diffEl = document.getElementById('map-diff-text');
        const isEn = getLanguage() === 'en';
        if (avatarEl) avatarEl.innerText = hero.icon;
        if (nameEl) nameEl.innerText = hero.name;
        if (diffEl) {
            const diff = RoguelikeRunManager.runDifficulty || 'normal';
            const diffConfigs: Record<RogueliteDifficulty, { label: string; flameClass: string }> = isEn ? {
                easy: { label: 'Easy', flameClass: 'flame-easy' },
                normal: { label: 'Medium', flameClass: 'flame-normal' },
                hard: { label: 'Hard', flameClass: 'flame-hard' },
                extreme: { label: 'Grandmaster', flameClass: 'flame-extreme' }
            } : {
                easy: { label: 'Fácil', flameClass: 'flame-easy' },
                normal: { label: 'Medio', flameClass: 'flame-normal' },
                hard: { label: 'Difícil', flameClass: 'flame-hard' },
                extreme: { label: 'Gran Maestro', flameClass: 'flame-extreme' }
            };
            const cfg = diffConfigs[diff] || diffConfigs['normal'];
            diffEl.innerHTML = `<span class="diff-flame ${cfg.flameClass}" style="font-size: 1rem; vertical-align: middle; margin-right: 4px;">🔥</span><span>${cfg.label}</span>`;
        }
    }
}
