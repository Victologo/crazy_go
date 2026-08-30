// events/MenuEventBinder.ts — Eventos de navegación, menú principal, dojo y tutorial

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
import { StoryModeController } from '../story/StoryModeController';
import { SetupEventBinder } from './SetupEventBinder';
import { t } from '../i18n/i18n';

import { MenuCameraController } from '../controllers/MenuCameraController';

export class MenuEventBinder {
    public static init(): void {
        // Inicializar el controlador de cámara 3D del menú
        const menuCamera = new MenuCameraController();
        menuCamera.init();

        // Toggle visual de Hitboxes / Contornos de Colisión (Tecla H o F2)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'h' || e.key === 'H' || e.key === 'F2') {
                const scene = document.getElementById('dojo-spatial-scene');
                if (scene) {
                    const isEnabled = scene.classList.toggle('debug-hitboxes');
                    HUDController.showAlert(isEnabled ? '🎯 Contornos de Colisión: ACTIVADOS' : '🎯 Contornos de Colisión: DESACTIVADOS');
                }
            }
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

        document.getElementById('btn-menu-social')?.addEventListener('click', () => {
            import('../ui/modals/SocialModalRenderer').then(m => m.SocialModalRenderer.show());
            SoundFX.playPlaceStone();
        });

        // Botón de Modo Historia
        document.getElementById('btn-menu-story')?.addEventListener('click', () => {
            // ScreenManager.showGameScreen(() => {
            //     StoryModeController.startCampaign();
            // }, true);
            console.log("Story mode locked for v1.0");
            SoundFX.playSpecial();
        });

        document.getElementById('btn-menu-dojo')?.addEventListener('click', () => {
            const dojoModal = document.getElementById('dojo-modal');
            const listContainer = document.getElementById('dojo-chapter-list');
            const titleEl = document.getElementById('dojo-modal-title');
            const descEl = document.getElementById('dojo-modal-desc');
            const closeTextEl = document.getElementById('dojo-modal-close-text');

            if (titleEl) titleEl.textContent = t('dojo.title');
            if (descEl) descEl.textContent = t('dojo.desc');
            if (closeTextEl) closeTextEl.textContent = t('dojo.close');

            if (dojoModal && listContainer) {
                listContainer.innerHTML = '';
                import('../tutorial/TutorialSteps').then(m => {
                    // Módulo I: Fundamentos del Go Canónico
                    const headerClassic = document.createElement('div');
                    headerClassic.className = 'dojo-module-header';
                    headerClassic.innerHTML = `<h3 style="color: #fbbf24; font-family: var(--font-oriental); font-size: 1.4rem; margin: 1rem 0 0.5rem 0; border-bottom: 1px solid rgba(251, 191, 36, 0.3); padding-bottom: 0.5rem;">${t('dojo.module_classic') || 'Módulo I: Fundamentos del Go Canónico'}</h3>`;
                    listContainer.appendChild(headerClassic);

                    const createLessonButton = (chapter: any, index: number) => {
                        const numStr = (index + 1).toString();
                        const btn = document.createElement('button');
                        btn.className = 'dojo-card-btn dojo-lesson-item';
                        btn.innerHTML = `
                            <div class="dojo-lesson-inner">
                                <div class="dojo-lesson-top">
                                    <div class="dojo-zen-ring">
                                        <span class="dojo-zen-num">${numStr}</span>
                                    </div>
                                    <div class="dojo-lesson-titles">
                                        <span class="dojo-lesson-tag">${chapter.tag || (t('dojo.lesson_tag') + ' ' + numStr)}</span>
                                        <h3 class="dojo-lesson-title">${chapter.title}</h3>
                                    </div>
                                </div>
                                ${chapter.description ? `<p class="dojo-lesson-desc">${chapter.description}</p>` : ''}
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
                        return btn;
                    };

                    const classicChapters = m.TUTORIAL_CHAPTERS.filter((c: any) => c.category === 'classic' || !c.category);
                    classicChapters.forEach((chapter: any, i: number) => {
                        listContainer.appendChild(createLessonButton(chapter, i));
                    });

                    // Módulo II: El Camino de Crazy Go
                    const headerSpecial = document.createElement('div');
                    headerSpecial.className = 'dojo-module-header';
                    headerSpecial.innerHTML = `<h3 style="color: #38bdf8; font-family: var(--font-oriental); font-size: 1.4rem; margin: 2rem 0 0.5rem 0; border-bottom: 1px solid rgba(56, 189, 248, 0.3); padding-bottom: 0.5rem;">${t('dojo.module_special') || 'Módulo II: El Camino de Crazy Go'}</h3>`;
                    listContainer.appendChild(headerSpecial);

                    const specialChapters = m.TUTORIAL_CHAPTERS.filter((c: any) => c.category === 'special');
                    specialChapters.forEach((chapter: any, i: number) => {
                        listContainer.appendChild(createLessonButton(chapter, classicChapters.length + i));
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

        document.getElementById('btn-menu-combat-log')?.addEventListener('click', () => {
            ModalManager.openCombatLogModal();
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
            } else if (StoryModeController.isStoryActive) {
                StoryModeController.stopCampaign();
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

        document.getElementById('btn-game-turbo')?.addEventListener('click', (e) => {
            const btn = e.currentTarget as HTMLElement;
            const w = window as any;
            w.AI_TURBO_MODE = !w.AI_TURBO_MODE;
            if (w.AI_TURBO_MODE) {
                btn.style.background = '#f59e0b';
                btn.style.color = '#000';
                HUDController.showAlert('⚡ Modo Turbo IA Activado (Máxima Velocidad)');
                if (GameController.config.gameMode === 'aivsai' || GameController.isAISlot(GameController.state.currentPlayer)) {
                    GameController.checkAITurn();
                }
            } else {
                btn.style.background = '';
                btn.style.color = '';
                HUDController.showAlert('🐌 Modo Turbo IA Desactivado');
            }
            SoundFX.playPlaceStone();
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
