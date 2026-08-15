import { STORY_CAMPAIGN, type StoryDialogueLine } from './StoryCampaign';
import { GameController } from '../controllers/GameController';
import { HUDController } from '../ui/HUDController';
import { StoryDialogueRenderer } from '../ui/StoryDialogueRenderer';
import { SoundFX } from '../audio/SoundFX';

export class StoryController {
    public static currentChapterIndex: number = 0;
    public static isDialogueActive: boolean = false;
    private static currentDialogues: StoryDialogueLine[] = [];
    private static dialogueIndex: number = 0;
    private static resolveDialogueComplete: (() => void) | null = null;

    public static startCampaign() {
        this.currentChapterIndex = 0;
        this.startChapter(this.currentChapterIndex);
    }

    public static isCurrentChapterSolo(): boolean {
        if (GameController.config.gameMode !== 'story') return false;
        const chapter = STORY_CAMPAIGN[this.currentChapterIndex];
        return !chapter || chapter.enemyHeroId === null;
    }

    public static startChapter(index: number) {
        if (index >= STORY_CAMPAIGN.length) {
            HUDController.showAlert("🎉 ¡Campaña Completada!", 5000);
            return;
        }

        const chapter = STORY_CAMPAIGN[index];
        
        // Initialize GameController for story mode
        GameController.config = {
            ...GameController.config,
            gameMode: 'story',
            playerCount: 2,
            humanColor: 1,
            difficulty: index === 0 ? 'easy' : 'medium',
            size: chapter.boardSize,
            heroId: chapter.heroId,
            enemyHeroId: chapter.enemyHeroId,
            komi: chapter.komi,
            shape: chapter.boardShape,
            ruleStyle: 'roguelite',
            specialStones: {
                enabled: true,
                playerSprouting: 2,
                playerDomino: 2,
                playerMonolith: 1,
                aiEnabled: false,
                aiSprouting: 0,
                aiDomino: 0,
                aiMonolith: 0
            }
        };

        GameController.initGame(GameController.config);

        // Place initial stones and captives
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

        // Check for pre_battle event
        const preBattleEvent = chapter.events.find(e => e.trigger === 'pre_battle');
        if (preBattleEvent) {
            this.playDialogueSequence(preBattleEvent.dialogues).then(() => {
                // Battle starts after dialogue
                HUDController.showAlert(`▶ Comienza: ${chapter.title}`);
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
            // Finish dialogue
            this.isDialogueActive = false;
            StoryDialogueRenderer.hide();
            if (this.resolveDialogueComplete) {
                this.resolveDialogueComplete();
                this.resolveDialogueComplete = null;
            }
        } else {
            this.renderCurrentDialogue();
        }
    }

    private static renderCurrentDialogue() {
        const line = this.currentDialogues[this.dialogueIndex];
        StoryDialogueRenderer.renderLine(line);
    }

    public static onCaptiveCaptured(captiveId: string) {
        const chapter = STORY_CAMPAIGN[this.currentChapterIndex];
        const captureEvent = chapter.events.find(e => e.trigger === 'on_capture' && e.targetId === captiveId);
        
        if (captureEvent) {
            this.playDialogueSequence(captureEvent.dialogues).then(() => {
                this.checkWinCondition();
            });
        } else {
            this.checkWinCondition();
        }
    }

    public static checkWinCondition() {
        const chapter = STORY_CAMPAIGN[this.currentChapterIndex];
        if (chapter.winCondition === 'capture_specific' && chapter.targetCaptiveId) {
            const target = GameController.state?.captives.find(c => c.id === chapter.targetCaptiveId);
            if (target && target.isCaptured) {
                this.onChapterComplete();
            }
        }
    }

    private static onChapterComplete() {
        SoundFX.playSpecial();
        HUDController.showAlert("⭐ ¡Capítulo Completado! ⭐", 3000);
        
        setTimeout(() => {
            this.currentChapterIndex++;
            this.startChapter(this.currentChapterIndex);
        }, 3000);
    }
}
