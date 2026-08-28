import { TUTORIAL_CHAPTERS, type TutorialChapter, type TutorialStep, type TutorialAction } from './TutorialSteps';
import { GameController } from '../controllers/GameController';
import { HUDController } from '../ui/HUDController';
import { SoundFX } from '../audio/SoundFX';
import { PolyominoManager } from '../core/PolyominoManager';
import { ChampionManager } from '../core/ChampionManager';
import { RogueliteManager } from '../core/RogueliteManager';
import type { PlayerId } from '../types';
import { t, getLanguage } from '../i18n/i18n';

export class TutorialManager {
    public static isActive: boolean = false;
    public static currentChapter: TutorialChapter | null = null;
    public static currentStepIndex: number = 0;
    private static finishTimeout: number | null = null;
    private static isAdvancing: boolean = false;

    public static initTutorial(chapterId: string) {
        if (this.finishTimeout) {
            clearTimeout(this.finishTimeout);
            this.finishTimeout = null;
        }

        const chapter = TUTORIAL_CHAPTERS.find(c => c.id === chapterId);
        if (!chapter) {
            console.error("Capítulo de tutorial no encontrado:", chapterId);
            return;
        }

        this.isActive = true;
        if (typeof window !== 'undefined') (window as any).__isTutorialActive = true;
        document.body.classList.add('tutorial-active');
        document.getElementById('game-topbar')?.classList.add('tutorial-active');
        this.currentChapter = chapter;
        this.currentStepIndex = 0;
        this.isAdvancing = false;

        const isPolySpellChapter = chapter.id === 'cap_8_hechizos_poliminos';
        const isPassChapter = chapter.id === 'cap_seki' || chapter.steps.some(s => s.expectedAction.type === 'pass');
        const heroId = chapter.heroId || 'normal';
        const isChampionMode = heroId !== 'normal';
        
        document.body.classList.toggle('tutorial-show-spellbar', isPolySpellChapter);
        document.body.classList.toggle('tutorial-show-pass-only', isPassChapter);

        // Configurar la partida para el tutorial
        GameController.config = {
            ...GameController.config,
            gameMode: '1via',
            size: chapter.boardSize,
            heroId: chapter.heroId,
            komi: chapter.komi,
            shape: 'square',
            ruleStyle: isPolySpellChapter ? 'roguelite' : 'classic',
            specialStones: {
                enabled: isPolySpellChapter,
                playerSprouting: isPolySpellChapter ? 1 : 0,
                playerDomino: isPolySpellChapter ? 1 : 0,
                playerMonolith: isPolySpellChapter ? 1 : 0,
                aiEnabled: false,
                aiSprouting: 0,
                aiDomino: 0,
                aiMonolith: 0
            }
        };

        GameController.initGame(GameController.config);

        PolyominoManager.resetForMatch(false, GameController.config);

        if (isChampionMode) {
            ChampionManager.resetForMatch(heroId, GameController.board);
            ChampionManager.setHero(heroId);
            ChampionManager.activeChargesLeft = 1;
            ChampionManager.isPassiveSkillAvailable = true;
            RogueliteManager.resetSpells({});
            HUDController.updateDuelists(
                false,
                heroId,
                undefined,
                '1via',
                'easy'
            );
        } else {
            ChampionManager.resetForMatch('normal', GameController.board);
            HUDController.updateDuelists(
                false,
                'normal',
                undefined,
                '1via',
                'easy'
            );
        }

        if (isPolySpellChapter) {
            RogueliteManager.resetSpells({ meteor: 2, rewind: 1 });
            const inv = new Map<import('../types').PolyominoType, number>();
            inv.set('sprouting', 1);
            inv.set('domino', 1);
            inv.set('monolith', 1);
            PolyominoManager.playerInventories.set(1, inv);
            PolyominoManager.syncCardsWithInventory(1);
        } else {
            RogueliteManager.resetSpells({});
        }

        // Limpiar el tablero y colocar las piedras iniciales
        if (GameController.board && GameController.state) {
            GameController.board.nodes.forEach(n => n.stone = null);
            GameController.state.moveHistory = [];
            
            for (const stone of chapter.initialStones) {
                const node = GameController.board.nodes.get(stone.id);
                if (node) {
                    node.stone = {
                        id: GameController.state.entityManager.createEntity(),
                        playerId: stone.player as PlayerId,
                        isInvisible: false,
                        isIndestructible: false,
                        isFrozen: false,
                        stoneType: 'single'
                    };
                }
            }
        }

        this.showCurrentStepOverlay();
        GameController.updateInGameUI();
        if (GameController.renderer) {
            GameController.renderer.render();
        }
    }

    public static stopTutorial() {
        if (this.finishTimeout) {
            clearTimeout(this.finishTimeout);
            this.finishTimeout = null;
        }
        this.isActive = false;
        if (typeof window !== 'undefined') {
            (window as any).__isTutorialActive = false;
            (window as any).__tutorialForceMeteorAlly = false;
            (window as any).__tutorialForceMeteorEnemy = false;
        }
        document.body.classList.remove('tutorial-active');
        document.body.classList.remove('tutorial-show-spellbar');
        document.body.classList.remove('tutorial-show-pass-only');
        this.currentChapter = null;
        this.currentStepIndex = 0;
        this.isAdvancing = false;
        this.hideOverlay();
        document.getElementById('game-topbar')?.classList.remove('tutorial-active');
    }

    public static getCurrentStep(): TutorialStep | null {
        if (!this.isActive || !this.currentChapter) return null;
        if (this.currentStepIndex >= this.currentChapter.steps.length) return null;
        return this.currentChapter.steps[this.currentStepIndex];
    }

    public static getExpectedAction(): TutorialAction | null {
        const step = this.getCurrentStep();
        return step ? step.expectedAction : null;
    }

    public static getCurrentAnnotations(): import('./TutorialSteps').TutorialAnnotation[] {
        const step = this.getCurrentStep();
        return step?.annotations || [];
    }

    public static showCurrentStepOverlay() {
        const step = this.getCurrentStep();
        if (!step) {
            this.finishChapter();
            return;
        }

        // Mostrar bocadillo UI (Renderizado de HTML)
        let overlay = document.getElementById('tutorial-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'tutorial-overlay';
            overlay.className = 'tutorial-overlay';
            const gameScreen = document.getElementById('game-screen');
            if (gameScreen) {
                gameScreen.appendChild(overlay);
            }
        }

        const isDialogOnly = step.expectedAction.type === 'dialog_only';
        const buttonHtml = isDialogOnly
            ? `<div class="tutorial-btn-container">
                <button id="btn-tutorial-continue-step" class="btn btn-primary btn-sm tutorial-continue-btn">${t('btn.understood')}</button>
               </div>`
            : '';

        overlay.style.display = 'flex';
        overlay.innerHTML = `
            <div class="tutorial-bubble">
                <div class="tutorial-text">
                    <strong class="tutorial-title">${step.messageTitle}</strong>
                    <p class="tutorial-body">${step.messageBody}</p>
                </div>
            </div>
            ${buttonHtml}
        `;

        if (isDialogOnly) {
            let wasClicked = false;
            document.getElementById('btn-tutorial-continue-step')?.addEventListener('click', (e) => {
                if (wasClicked || this.isAdvancing) return;
                wasClicked = true;
                const btn = e.currentTarget as HTMLButtonElement | null;
                if (btn) btn.disabled = true;
                SoundFX.playPlaceStone();
                this.advanceStep();
            });
        }

        // Ejecutar callback onStart si existe
        if (step.onStart && GameController.board && GameController.state) {
            step.onStart(GameController.board, GameController.state);
        }

        if (GameController.renderer) {
            GameController.renderer.render(); // Actualiza el resaltado y anotaciones
        }
    }

    public static hideOverlay() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.innerHTML = '';
            overlay.style.display = 'none';
        }
    }

    public static advanceStep() {
        if (!this.isActive || !this.currentChapter || this.isAdvancing) return;
        this.isAdvancing = true;
        
        const currentStep = this.getCurrentStep();
        if (currentStep?.onComplete && GameController.board && GameController.state) {
            currentStep.onComplete(GameController.board, GameController.state);
        }

        // Mantener siempre el turno en Negras (Jugador 1) para que el jugador pueda seguir colocando piedras libremente
        if (GameController.state) {
            GameController.state.currentPlayer = 1;
        }

        // Transición fluida inmediata (180ms para ver el impacto de la piedra)
        setTimeout(() => {
            this.goToNextStep();
            this.isAdvancing = false;
        }, 180);
    }

    private static goToNextStep() {
        this.currentStepIndex++;
        if (GameController.state) {
            GameController.state.currentPlayer = 1;
        }
        if (this.currentStepIndex >= this.currentChapter!.steps.length) {
            this.finishChapter();
        } else {
            this.showCurrentStepOverlay();
            GameController.updateInGameUI();
            if (GameController.renderer) {
                GameController.renderer.render();
            }
        }
    }

    public static finishChapter() {
        this.hideOverlay();
        if (GameController.renderer) {
            GameController.renderer.render();
        }

        const isEn = getLanguage() === 'en';
        const modal = document.getElementById('modal-tutorial-complete');
        if (!modal || !this.currentChapter) {
            HUDController.showAlert(isEn ? "🎉 Chapter Completed!" : "🎉 ¡Lección Completada!", 3000);
            return;
        }

        const currentIndex = TUTORIAL_CHAPTERS.findIndex(c => c.id === this.currentChapter!.id);
        const nextChapter = currentIndex >= 0 && currentIndex < TUTORIAL_CHAPTERS.length - 1
            ? TUTORIAL_CHAPTERS[currentIndex + 1]
            : null;

        const kickerEl = document.getElementById('tutorial-complete-kicker');
        const titleEl = document.getElementById('tutorial-complete-title');
        const subtitleEl = document.getElementById('tutorial-complete-subtitle');
        const nextBtn = document.getElementById('btn-tutorial-next');
        const replayBtn = document.getElementById('btn-tutorial-replay');
        const listBtn = document.getElementById('btn-tutorial-list');

        if (kickerEl) {
            kickerEl.innerText = isEn ? `✦ LESSON ${this.currentChapter.chapterNumber} COMPLETED ✦` : `✦ LECCIÓN ${this.currentChapter.chapterNumber} COMPLETADA ✦`;
        }
        if (titleEl) {
            titleEl.innerText = `${this.currentChapter.chapterNumber}. ${this.currentChapter.title}`;
        }
        if (subtitleEl) {
            subtitleEl.innerText = isEn 
                ? `You have successfully assimilated the core concepts of this lesson.` 
                : `Has asimilado con éxito los conceptos fundamentales de esta lección.`;
        }

        if (replayBtn) {
            replayBtn.innerHTML = isEn 
                ? `<span class="btn-tut-sub-icon">↺</span><span class="btn-tut-sub-text">Replay</span><span class="btn-tut-sub-kbd">[R]</span>` 
                : `<span class="btn-tut-sub-icon">↺</span><span class="btn-tut-sub-text">Repetir</span><span class="btn-tut-sub-kbd">[R]</span>`;
        }
        if (listBtn) {
            listBtn.innerHTML = isEn 
                ? `<span class="btn-tut-sub-icon">📜</span><span class="btn-tut-sub-text">Dojo List</span><span class="btn-tut-sub-kbd">[Esc]</span>` 
                : `<span class="btn-tut-sub-icon">📜</span><span class="btn-tut-sub-text">Lista del Dojo</span><span class="btn-tut-sub-kbd">[Esc]</span>`;
        }

        if (nextBtn) {
            if (nextChapter) {
                const nextKicker = isEn ? "NEXT LESSON ➔" : "SIGUIENTE LECCIÓN ➔";
                const nextLessonFullTitle = `${nextChapter.chapterNumber}. ${nextChapter.title}`;
                nextBtn.innerHTML = `
                    <div class="btn-tut-next-content">
                        <span class="btn-tut-next-kicker">${nextKicker}</span>
                        <strong class="btn-tut-next-title">${nextLessonFullTitle}</strong>
                    </div>
                    <span class="btn-tut-kbd">↵ Enter</span>
                `;
                nextBtn.onclick = () => {
                    modal.classList.add('hidden');
                    this.initTutorial(nextChapter.id);
                };
            } else {
                const finishKicker = isEn ? "DOJO MASTERED ✦" : "DOJO COMPLETADO ✦";
                const finishTitle = isEn ? "🎓 Finish Dojo" : "🎓 Finalizar Dojo";
                nextBtn.innerHTML = `
                    <div class="btn-tut-next-content">
                        <span class="btn-tut-next-kicker">${finishKicker}</span>
                        <strong class="btn-tut-next-title">${finishTitle}</strong>
                    </div>
                    <span class="btn-tut-kbd">↵ Enter</span>
                `;
                nextBtn.onclick = () => {
                    modal.classList.add('hidden');
                    this.stopTutorial();
                    document.getElementById('btn-game-back')?.click();
                };
            }
        }

        modal.classList.remove('hidden');
        SoundFX.playVictoryFanfare();
        HUDController.showAlert(isEn ? "🎉 Chapter Completed Successfully!" : "🎉 ¡Lección completada con éxito!");
    }

    // Retorna true si la jugada está permitida por el tutorial, false si debe ser bloqueada
    public static validateNodeClick(nodeId: string): boolean {
        if (!this.isActive) return true;

        const expected = this.getExpectedAction();
        if (!expected) return false;
        const isEn = getLanguage() === 'en';

        if (expected.type === 'place_stone') {
            if (nodeId === expected.nodeId) {
                return true;
            } else {
                HUDController.showAlert(isEn ? "🥋 Sensei: That is not the spot! Place your stone on the golden highlighted node." : "🥋 Sensei: ¡Esa no es la posición! Coloca tu piedra en el nodo dorado resaltado.", 2500);
                return false;
            }
        }

        if (expected.type === 'use_polyomino') {
            if (expected.polyType && PolyominoManager.activePolyomino !== expected.polyType) {
                const polyName = isEn 
                    ? (expected.polyType === 'domino' ? 'Duplicity Tile 🀄' : expected.polyType === 'sprouting' ? 'Sprouting Stone 🌿' : 'Monolith Tile 🧱')
                    : (expected.polyType === 'domino' ? 'Ficha Duplicidad 🀄' : expected.polyType === 'sprouting' ? 'Piedra Germinante 🌿' : 'Ficha Monolito 🧱');
                HUDController.showAlert(isEn ? `🥋 Sensei: Select the ${polyName} piece from the bottom dock first.` : `🥋 Sensei: Selecciona primero la ${polyName} en la barra inferior.`, 2800);
                return false;
            }
            if (expected.nodeId && nodeId !== expected.nodeId) {
                HUDController.showAlert(isEn ? "🥋 Sensei: Place the special piece on the golden highlighted intersection." : "🥋 Sensei: Coloca la ficha especial en la intersección dorada resaltada.", 2500);
                return false;
            }
            if (expected.polyType === 'domino' && expected.rotation !== undefined) {
                const requiredOrient = expected.rotation === 0 ? 'horizontal' : 'vertical';
                if (PolyominoManager.orientation !== requiredOrient) {
                    HUDController.showAlert(isEn 
                        ? `🥋 Sensei: Press [R] to rotate the Duplicity tile ${requiredOrient === 'horizontal' ? 'horizontally [⇄]' : 'vertically [⇅]'} before placing it.` 
                        : `🥋 Sensei: Pulsa [R] para rotar la Ficha Duplicidad en ${requiredOrient === 'horizontal' ? 'horizontal [⇄]' : 'vertical [⇅]'} antes de colocarla.`, 
                        2800
                    );
                    return false;
                }
            }
            return true;
        }

        if (expected.type === 'use_spell') {
            if (expected.spellId && RogueliteManager.selectedSpell !== expected.spellId) {
                HUDController.showAlert(isEn ? "🥋 Sensei: Select the spell from the bottom dock first." : "🥋 Sensei: Selecciona primero el pergamino en la barra inferior.", 2800);
                return false;
            }
            if (expected.nodeId && nodeId !== expected.nodeId) {
                HUDController.showAlert(isEn ? "🥋 Sensei: Cast the spell on the golden highlighted intersection." : "🥋 Sensei: Lanza el pergamino sobre la casilla dorada resaltada.", 2500);
                return false;
            }
            return true;
        }

        if (expected.type === 'use_skill') {
            if (ChampionManager.currentTargetingMode === 'none') {
                return false;
            }
            if (expected.nodeId && nodeId !== expected.nodeId) {
                HUDController.showAlert(isEn ? "🥋 Sensei: Aim Tengu's meteor rain at the marked center node (6,4)." : "🥋 Sensei: Apunta la lluvia de meteoros al centro del grupo blanco indicado (6,4).", 2800);
                return false;
            }
            return true;
        }

        if (expected.type === 'dialog_only') {
            HUDController.showAlert(isEn ? "🥋 Sensei: Press 'Understood ➔' or Spacebar to continue." : "🥋 Sensei: Pulsa 'Entendido ➔' o la barra espaciadora para continuar.", 2500);
            return false;
        }
        
        HUDController.showAlert(isEn ? "🥋 Sensei: Complete the action required by the lesson." : "🥋 Sensei: Realiza la acción requerida por la lección.", 2500);
        return false;
    }
}
