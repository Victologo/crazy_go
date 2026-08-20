// events/MenuEventBinder.ts — Eventos de navegación, menú principal, dojo y tutorial

import { ThemeManager } from '../ui/ThemeManager';
import { ScreenManager } from '../ui/ScreenManager';
import { ModalManager } from '../ui/ModalManager';
import { HUDController } from '../ui/HUDController';
import { GameController } from '../controllers/GameController';
import { RoguelikeController } from '../controllers/RoguelikeController';
import { OnlineController } from '../controllers/OnlineController';
import { SoundFX } from '../audio/SoundFX';
import { RoguelikeRunManager } from '../core/RoguelikeRunManager';
import { SandboxController } from '../controllers/SandboxController';
import { TutorialManager } from '../tutorial/TutorialManager';
import { StoryController } from '../story/StoryController';
import { SetupEventBinder } from './SetupEventBinder';

export class MenuEventBinder {
    public static init(): void {
        // Botones de cambio de tema
        document.querySelectorAll('.btn-theme-toggle').forEach(el => {
            el.addEventListener('click', () => {
                const nextTheme = ThemeManager.toggleTheme();
                HUDController.showAlert(`Tema: ${nextTheme === 'light' ? 'Modo Claro ☀️ (Madera Kaya)' : 'Modo Oscuro 🌙 (Pizarra)'}`);
            });
        });

        // Menú Principal
        document.getElementById('btn-menu-roguelike')?.addEventListener('click', () => {
            RoguelikeController.openRoguelikeOrResume();
            SoundFX.playPlaceStone();
        });

        // Modal de Elección Roguelike (Continuar o Nueva Run)
        document.getElementById('btn-rogue-resume-active')?.addEventListener('click', () => {
            RoguelikeController.resumeActiveRun();
        });

        document.getElementById('btn-rogue-start-fresh')?.addEventListener('click', () => {
            RoguelikeController.startFreshRunPrompt();
        });

        document.getElementById('btn-rogue-choice-cancel')?.addEventListener('click', () => {
            ModalManager.closeRogueChoiceModal();
            SoundFX.playPlaceStone();
        });

        const openFreeSetup = () => {
            SetupEventBinder.tempSetupConfig = {
                ruleStyle: 'classic',
                gameMode: '1via',
                playerCount: 2,
                humanColor: 1,
                difficulty: 'medium',
                komi: 6.5,
                shape: 'square',
                size: 9,
                heroId: 'normal',
                enemyHeroId: 'random',
                enemyHeroIds: { 2: 'normal', 3: 'normal', 4: 'normal' },
                isRoguelikeMatch: false,
                background: 'combat'
            };
            ModalManager.openNewGameModal();
            ModalManager.updateSetupModalUI(SetupEventBinder.tempSetupConfig);
            ModalManager.setWizardStep(1, SetupEventBinder.tempSetupConfig);
            SoundFX.playPlaceStone();
        };
        document.getElementById('btn-menu-free')?.addEventListener('click', openFreeSetup);

        document.getElementById('btn-game-sandbox')?.addEventListener('click', () => {
            SandboxController.openInGameSandbox();
        });

        document.getElementById('btn-menu-online')?.addEventListener('click', () => {
            OnlineController.openOnlineModal();
            SoundFX.playPlaceStone();
        });

        // Botón de Modo Historia
        document.getElementById('btn-menu-story')?.addEventListener('click', () => {
            ScreenManager.showGameScreen();
            StoryController.startCampaign();
            SoundFX.playSpecial();
        });

        document.getElementById('btn-menu-dojo')?.addEventListener('click', () => {
            const dojoModal = document.getElementById('dojo-modal');
            const listContainer = document.getElementById('dojo-chapter-list');
            if (dojoModal && listContainer) {
                listContainer.innerHTML = '';
                import('../tutorial/TutorialSteps').then(m => {
                    m.TUTORIAL_CHAPTERS.forEach((chapter, index) => {
                        const numStr = (index + 1).toString();
                        const btn = document.createElement('button');
                        btn.className = 'dojo-card-btn';
                        btn.innerHTML = `
                    <div class="dojo-num-badge">${numStr}</div>
                    <div class="dojo-card-content">
                        <h3 class="dojo-card-title">${chapter.title}</h3>
                    </div>
                `;
                        btn.addEventListener('click', () => {
                            dojoModal.classList.add('hidden');
                            import('../ui/ScreenManager').then(sm => sm.ScreenManager.showGameScreen());
                            import('../tutorial/TutorialManager').then(tm => {
                                tm.TutorialManager.initTutorial(chapter.id);
                            });
                            SoundFX.playSpecial();
                        });
                        listContainer.appendChild(btn);
                    });
                });
                dojoModal.classList.remove('hidden');
            }
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-cancel-dojo')?.addEventListener('click', () => {
            const dojoModal = document.getElementById('dojo-modal');
            if (dojoModal) dojoModal.classList.add('hidden');
            SoundFX.playPlaceStone();
        });

        // Botones del Modal de Lección Completada
        document.getElementById('btn-tutorial-replay')?.addEventListener('click', () => {
            document.getElementById('modal-tutorial-complete')?.classList.add('hidden');
            if (TutorialManager.currentChapter) {
                TutorialManager.initTutorial(TutorialManager.currentChapter.id);
            }
            SoundFX.playSpecial();
        });

        document.getElementById('btn-tutorial-list')?.addEventListener('click', () => {
            document.getElementById('modal-tutorial-complete')?.classList.add('hidden');
            TutorialManager.stopTutorial();
            ScreenManager.showMainMenu();
            document.getElementById('btn-menu-dojo')?.click();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-menu-options')?.addEventListener('click', () => {
            ModalManager.openOptionsModal();
            SoundFX.playPlaceStone();
        });

        // Botones de volver al menú o mapa
        document.getElementById('btn-game-back')?.addEventListener('click', () => {
            if (TutorialManager.isActive) {
                TutorialManager.stopTutorial();
                ScreenManager.showMainMenu();
            } else if (SandboxController.isSandboxActive) {
                SandboxController.isSandboxActive = false;
                SandboxController.isBrushActive = false;
                ModalManager.closeSandboxModal();
                ScreenManager.showMainMenu();
            } else if (GameController.config.gameMode === 'story') {
                StoryController.isDialogueActive = false;
                ScreenManager.showMainMenu();
            } else if (
                GameController.config.gameMode !== '1v1' && 
                GameController.config.gameMode !== '1via' && 
                GameController.config.gameMode !== 'online' &&
                GameController.config.ruleStyle === 'roguelite' && 
                RoguelikeRunManager.isRunActive
            ) {
                RoguelikeController.resumeMap();
            } else {
                ScreenManager.showMainMenu();
            }
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-abandon-run')?.addEventListener('click', () => {
            RoguelikeController.abandonRun();
        });

        document.getElementById('btn-game-reset')?.addEventListener('click', () => {
            GameController.initGame();
            SoundFX.playPlaceStone();
            HUDController.showAlert('🔄 Partida reiniciada.');
        });

        document.getElementById('btn-back-menu')?.addEventListener('click', () => {
            ScreenManager.showMainMenu();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-header-home')?.addEventListener('click', () => {
            ScreenManager.showMainMenu();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-map-back-menu')?.addEventListener('click', () => {
            ScreenManager.showMainMenu();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-map-view-deck')?.addEventListener('click', () => {
            ModalManager.openDeckModal();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-deck-close')?.addEventListener('click', () => {
            ModalManager.closeDeckModal();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-map-view-hero')?.addEventListener('click', () => {
            ModalManager.openDeckModal();
            SoundFX.playPlaceStone();
        });
    }
}
