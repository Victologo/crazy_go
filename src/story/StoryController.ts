import { STORY_CAMPAIGN, type StoryDialogueLine } from './StoryCampaign';
import { GameController } from '../controllers/GameController';
import { HUDController } from '../ui/HUDController';
import { StoryDialogueRenderer } from '../ui/StoryDialogueRenderer';
import { GameEventBus } from '../events/GameEventBus';
import { ChampionManager } from '../core/ChampionManager';
import { SoundFX } from '../audio/SoundFX';
import { getLanguage } from '../i18n/i18n';
import type { HeroId, PlayerId } from '../types';

export class StoryController {
    public static currentChapterIndex: number = 0;
    public static isDialogueActive: boolean = false;
    public static selectedPlayerHero: HeroId = 'normal';
    private static currentDialogues: StoryDialogueLine[] = [];
    private static dialogueIndex: number = 0;
    private static resolveDialogueComplete: (() => void) | null = null;

    public static startCampaign() {
        this.currentChapterIndex = 0;
        this.selectedPlayerHero = 'normal';
        this.startChapter(this.currentChapterIndex);
    }

    public static isCurrentChapterSolo(): boolean {
        if (GameController.config.gameMode !== 'story') return false;
        const chapter = STORY_CAMPAIGN[this.currentChapterIndex];
        return !chapter || chapter.enemyHeroId === null;
    }

    public static startChapter(index: number) {
        if (index >= STORY_CAMPAIGN.length) {
            SoundFX.playSpecial();
            HUDController.showAlert("🏆 ¡FELICIDADES! ¡Has completado todas las Crónicas del Goban!", 6000);
            return;
        }

        this.currentChapterIndex = index;
        const chapter = STORY_CAMPAIGN[index];
        
        // El héroe del jugador puede ser el Hombre Normal (cap 1-2) o el Campeón elegido en el Draft
        const playerHero = (index >= 2 && this.selectedPlayerHero !== 'normal') 
            ? this.selectedPlayerHero 
            : chapter.heroId;

        // Configuración de GameController para la misión de historia
        GameController.config = {
            ...GameController.config,
            gameMode: 'story',
            playerCount: 2,
            humanColor: 1,
            difficulty: index <= 1 ? 'easy' : (index === 2 ? 'medium' : 'hard'),
            size: chapter.boardSize,
            heroId: playerHero,
            enemyHeroId: chapter.enemyHeroId,
            komi: chapter.komi,
            shape: chapter.boardShape,
            ruleStyle: 'roguelite',
            specialStones: {
                enabled: index >= 2,
                playerSprouting: index >= 2 ? 2 : 0,
                playerDomino: index >= 2 ? 2 : 0,
                playerMonolith: index >= 2 ? 1 : 0,
                aiEnabled: index >= 3,
                aiSprouting: index >= 3 ? 1 : 0,
                aiDomino: index >= 3 ? 1 : 0,
                aiMonolith: index >= 3 ? 1 : 0
            }
        };

        GameController.initGame(GameController.config);

        // Equipar al campeón en el ChampionManager
        ChampionManager.setHero(playerHero, chapter.boardSize);

        // Colocar piedras iniciales y entidades/reliquias
        if (GameController.state && GameController.board) {
            for (const s of chapter.initialStones) {
                const node = GameController.board.nodes.get(`${s.x},${s.y}`);
                if (node) {
                    node.stone = {
                        id: GameController.state.entityManager.createEntity(),
                        playerId: s.player as any,
                        isInvisible: false,
                        isIndestructible: false,
                        isFrozen: false,
                        stoneType: 'single'
                    };
                }
            }

            GameController.state.captives = chapter.captives.map(c => {
                const nodeId = `${c.x},${c.y}`;
                return {
                    id: c.id,
                    nodeId: nodeId,
                    nodeIds: c.nodeIds,
                    type: c.type,
                    name: c.name,
                    icon: c.icon,
                    description: c.description,
                    rewardType: c.rewardType,
                    rewardValue: c.rewardValue,
                    isCaptured: false
                };
            });
            GameController.renderer?.render();
        }

        // Diálogo pre-batalla si existe
        const preBattleEvent = chapter.events.find(e => e.trigger === 'pre_battle');
        if (preBattleEvent) {
            this.playDialogueSequence(preBattleEvent.dialogues).then(() => {
                HUDController.showAlert(`▶ Comienza: ${chapter.title}`, 2500);
            });
        }
    }

    public static playDialogueSequence(dialogues: StoryDialogueLine[]): Promise<void> {
        return new Promise((resolve) => {
            if (dialogues.length === 0) {
                resolve();
                return;
            }
            this.isDialogueActive = true;
            this.currentDialogues = dialogues;
            this.dialogueIndex = 0;
            this.resolveDialogueComplete = resolve;
            
            StoryDialogueRenderer.show();
            this.renderCurrentDialogue();
        });
    }

    public static advanceDialogue() {
        if (!this.isDialogueActive) return;

        this.dialogueIndex++;
        if (this.dialogueIndex >= this.currentDialogues.length) {
            // Fin de la secuencia de diálogo
            this.isDialogueActive = false;
            StoryDialogueRenderer.hide();
            if (this.resolveDialogueComplete) {
                const cb = this.resolveDialogueComplete;
                this.resolveDialogueComplete = null;
                cb();
            }

            // Si es el turno de la IA, reanudar su pensamiento
            if (GameController.state && !GameController.state.isGameOver && GameController.state.currentPlayer !== GameController.config.humanColor) {
                GameController.checkAITurn();
            }
        } else {
            this.renderCurrentDialogue();
        }
    }

    private static renderCurrentDialogue() {
        const line = this.currentDialogues[this.dialogueIndex];
        StoryDialogueRenderer.renderLine(line);
    }

    public static onCaptiveCaptured(captiveId: string, capturingPlayerId: PlayerId = 1) {
        const chapter = STORY_CAMPAIGN[this.currentChapterIndex];
        if (!chapter) return;

        // Comprobar si el capturador fue el rival (Blancas) o el jugador (Negras)
        const isEnemyCapture = capturingPlayerId === 2;
        let event = isEnemyCapture 
            ? chapter.events.find(e => e.trigger === 'on_enemy_capture' && e.targetId === captiveId)
            : chapter.events.find(e => e.trigger === 'on_capture' && e.targetId === captiveId);

        if (!event && !isEnemyCapture) {
            event = chapter.events.find(e => e.trigger === 'on_capture');
        }

        if (event) {
            this.playDialogueSequence(event.dialogues).then(async () => {
                // 1. Si el evento desencadena la ruptura del tablero
                if (event.shatterBoard && GameController.renderer) {
                    await GameController.renderer.triggerBoardShatterAnimation();
                }

                // 2. Si el evento ofrece el modal de selección de poder
                if (event.offerPowerDraft) {
                    await StoryDialogueRenderer.showPowerDraftModal((chosenHero) => {
                        this.selectedPlayerHero = chosenHero;
                        ChampionManager.setHero(chosenHero, chapter.boardSize);
                        const isEn = getLanguage() === 'en';
                        HUDController.showAlert(isEn ? `✨ You have mastered the Qi of ${chosenHero.toUpperCase()}!` : `✨ ¡Has dominado el Qi de ${chosenHero.toUpperCase()}!`);
                        this.onChapterComplete();
                    });
                } else if (isEnemyCapture && captiveId === chapter.targetCaptiveId) {
                    const isEn = getLanguage() === 'en';
                    HUDController.showAlert(isEn ? "💀 The relic was corrupted. Retrying chapter..." : "💀 La reliquia ha sido corrompida. Reiniciando capítulo...", 3000);
                    setTimeout(() => {
                        this.startChapter(this.currentChapterIndex);
                    }, 2000);
                } else {
                    this.checkWinCondition();
                }
            });
        } else {
            if (isEnemyCapture && captiveId === chapter.targetCaptiveId) {
                const isEn = getLanguage() === 'en';
                HUDController.showAlert(isEn ? "💀 The relic was corrupted. Retrying chapter..." : "💀 La reliquia ha sido corrompida. Reiniciando capítulo...", 3000);
                setTimeout(() => {
                    this.startChapter(this.currentChapterIndex);
                }, 2000);
            } else {
                this.checkWinCondition();
            }
        }
    }

    public static checkWinCondition() {
        const chapter = STORY_CAMPAIGN[this.currentChapterIndex];
        if (!chapter) return;

        if (chapter.winCondition === 'capture_specific' && chapter.targetCaptiveId) {
            const target = GameController.state?.captives.find(c => c.id === chapter.targetCaptiveId);
            if (target && target.isCaptured && target.capturedBy === 1) {
                this.onChapterComplete();
            }
        }
    }

    public static onMatchEnded(winnerPlayerId: PlayerId) {
        const chapter = STORY_CAMPAIGN[this.currentChapterIndex];
        if (!chapter) return;

        if (chapter.winCondition === 'territory') {
            if (winnerPlayerId === 1) {
                // Victoria humana
                const postBattle = chapter.events.find(e => e.trigger === 'post_battle');
                if (postBattle) {
                    this.playDialogueSequence(postBattle.dialogues).then(() => {
                        this.onChapterComplete();
                    });
                } else {
                    this.onChapterComplete();
                }
            } else {
                const isEn = getLanguage() === 'en';
                HUDController.showAlert(isEn ? "💀 You have been outscored in territory. Retrying chapter..." : "💀 Has sido superado en territorio. Reiniciando capítulo...", 3500);
                setTimeout(() => {
                    this.startChapter(this.currentChapterIndex);
                }, 2000);
            }
        } else if (chapter.winCondition === 'capture_specific') {
            const target = GameController.state?.captives.find(c => c.id === chapter.targetCaptiveId);
            if (!target || !target.isCaptured || target.capturedBy !== 1) {
                const isEn = getLanguage() === 'en';
                HUDController.showAlert(isEn ? "💀 Match ended before relic was secured. Retrying..." : "💀 Partida concluida sin sellar la reliquia. Reiniciando...", 3500);
                setTimeout(() => {
                    this.startChapter(this.currentChapterIndex);
                }, 2000);
            }
        }
    }

    public static onChapterComplete() {
        SoundFX.playSpecial();
        const isEn = getLanguage() === 'en';
        HUDController.showAlert(isEn ? "⭐ Chapter Completed! ⭐" : "⭐ ¡Capítulo Completado! ⭐", 2200);
        
        setTimeout(() => {
            this.currentChapterIndex++;
            this.startChapter(this.currentChapterIndex);
        }, 1000);
    }
}

// Suscribirse a los eventos del juego
GameEventBus.on('ENTITY_CAPTURED', (payload) => {
    if (payload.gameMode === 'story') {
        StoryController.onCaptiveCaptured(payload.captive.id, payload.capturerId);
    }
});

GameEventBus.on('MATCH_ENDED', (payload) => {
    if (payload.gameMode === 'story') {
        const winnerId = payload.report.winner === 'black' ? 1 : 2;
        StoryController.onMatchEnded(winnerId);
    }
});
