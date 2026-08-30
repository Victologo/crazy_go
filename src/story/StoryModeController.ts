import { GameController } from '../controllers/GameController';
import { SoundFX } from '../audio/SoundFX';
import { HUDController } from '../ui/HUDController';
import { StoryDebugUI } from './StoryDebugUI';
import type { BoardShape, CaptiveEntity } from '../types';
import { StoryDialogueRenderer } from '../ui/StoryDialogueRenderer';
import { GameEventBus } from '../events/GameEventBus';
import { ChampionManager } from '../core/ChampionManager';

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type StoryEventType =
    | 'dialogue'            // Show a narrative dialogue box
    | 'earthquake'          // Screen shake + crack overlay + optional board shatter
    | 'alert'               // Small top-bar alert banner
    | 'zone_darken';        // Darken a rectangular area of the board (future)

export interface StoryEvent {
    id: string;
    triggerTurn: number;           // Fire when currentTurn reaches this value
    type: StoryEventType;
    speaker?: string;              // For dialogue events
    text?: string;                 // Dialogue or alert text
    position?: 'left' | 'right';  // Dialogue position
    shatterBoard?: boolean;        // Whether to run board-shatter animation (earthquake)
    crackCount?: number;           // Number of crack lines to draw (earthquake)
    mechanicalSplit?: boolean;     // Whether to physically destroy a line of nodes to split the board in two
}

export interface StoryChapter {
    id: number;
    title: string;
    introLore: string;             // Shown before the battle starts
    speaker: string;               // "— Voz del Narrador" etc.
    size: number;
    shape: BoardShape;
    difficulty: 'easy' | 'medium' | 'hard' | 'dan';
    bgStyle?: string;              // CSS class to add to #board-viewport
    events: StoryEvent[];
    shrines?: string[];            // Node IDs of Qi Shrines (e.g., "4,4")
    captives?: CaptiveEntity[];    // Objects to surround & liberate on the board
}

// ─────────────────────────────────────────────────────────────────────────────
//  CHAPTER DATA
// ─────────────────────────────────────────────────────────────────────────────

export const STORY_CHAPTERS: StoryChapter[] = [
    {
        id: 1,
        title: '✦ The Shattered Goban ✦',
        introLore:
            'The Void has fractured our universe into floating islands of stone and light.\n\n' +
            'You are the Cosmic Weaver. Place your stones of Dark Qi to reclaim territory, ' +
            'encircle the Celestial Qi Shard at the center, and heal this first island before entropy consumes it.',
        speaker: '— The Narrator',
        size: 9,
        shape: 'square',
        difficulty: 'easy',
        shrines: ['4,4'], // Center island
        captives: [
            {
                id: 'ch1_core',
                nodeId: '4,4',
                type: 'spirit',
                name: 'Celestial Qi Core',
                icon: '💎',
                description: 'Encircle to harness +10 Cosmic Silk and +1 Divine Shield!',
                rewardType: 'spell',
                isCaptured: false,
            }
        ],
        events: [
            {
                id: 'ch1-turn2',
                triggerTurn: 2,
                type: 'alert',
                text: '💎 Encircle the Celestial Qi Core (💎) in the center with your stones to liberate its power!',
            },
            {
                id: 'ch1-turn4',
                triggerTurn: 4,
                type: 'dialogue',
                speaker: '🌑 The Void',
                text: 'This island belongs to chaos. Every intersection you claim is a thread you sew back into reality... but I am faster.',
                position: 'right',
            },
            {
                id: 'ch1-turn10',
                triggerTurn: 10,
                type: 'alert',
                text: '💡 Tip: Fully surrounding an enemy group takes away its liberties. Without liberties, it is captured.',
            },
            {
                id: 'ch1-turn16',
                triggerTurn: 16,
                type: 'dialogue',
                speaker: '⚫ The Weaver',
                text: 'I can feel the Qi flowing through the intersections I have sown. The first crack is about to close...',
                position: 'left',
            },
        ],
    },
    {
        id: 2,
        title: '⚡ The Crystal Fault ⚡',
        introLore:
            'The first island has been purified. But the tectonic fabric here is on the verge of collapse.\n\n' +
            'Rescue the Trapped Sage Monk and recover the Ancient Scroll before Turn 5, when the Void unleashes a seismic catastrophe that will sever the board in two!',
        speaker: '— The Great Sages',
        size: 13,
        shape: 'square',
        difficulty: 'medium',
        shrines: ['3,3', '9,9'],
        captives: [
            {
                id: 'ch2_scroll',
                nodeId: '3,3',
                type: 'scroll_relic',
                name: 'Scroll of Fault Balance',
                icon: '📜',
                description: 'Encircle to gain +1 Sacred Rewind!',
                rewardType: 'spell',
                isCaptured: false,
            },
            {
                id: 'ch2_monk',
                nodeId: '9,9',
                type: 'hostage',
                name: 'Trapped Sage Monk',
                icon: '🧙',
                description: 'Encircle to rescue the monk (+1 Divine Shield & +1 Skill Charge)!',
                rewardType: 'spell',
                isCaptured: false,
            }
        ],
        events: [
            {
                id: 'ch2-turn2',
                triggerTurn: 2,
                type: 'dialogue',
                speaker: '🌑 The Void',
                text: 'You feel the trembling under your fingers? At Turn 5, I will split this board in two!',
                position: 'right',
            },
            {
                id: 'ch2-turn3',
                triggerTurn: 3,
                type: 'alert',
                text: '⚠️ SEISMIC WARNING: The central fault will rupture at Turn 5! Secure the Sages now!',
            },
            {
                id: 'ch2-earthquake',
                triggerTurn: 5,
                type: 'earthquake',
                speaker: '💥 CATACLYSMIC QUAKE',
                text: 'The central tectonic plate ruptures! The Goban is permanently split into two separate battlefields!',
                position: 'left',
                shatterBoard: false,
                crackCount: 5,
                mechanicalSplit: true,
            },
            {
                id: 'ch2-turn10',
                triggerTurn: 10,
                type: 'dialogue',
                speaker: '⚫ The Weaver',
                text: 'The board is severed, but neither player can cross the chasm. We must fight on two independent fronts!',
                position: 'left',
            },
        ],
    },
    {
        id: 3,
        title: '🏔️ The Three Quake Islands 🏔️',
        introLore:
            'The cosmic fault line has created three isolated landmasses in the void.\n\n' +
            'A legendary Polyomino Cache lies on the northern atoll. Encircle it to gain Domino stones that span across borders!',
        speaker: '— The Great Sages',
        size: 13 as import('../types').BoardSize,
        shape: 'islands_v1',
        difficulty: 'medium',
        shrines: ['6,6', '2,10', '10,2'],
        captives: [
            {
                id: 'ch3_chest',
                nodeId: '2,10',
                type: 'chest',
                name: 'Celestial Domino Cache',
                icon: '🎁',
                description: 'Encircle to gain +1 Domino Tile (2x1) and +1 Sprout Stone!',
                rewardType: 'poly',
                isCaptured: false,
            }
        ],
        events: [
            {
                id: 'ch3-turn2',
                triggerTurn: 2,
                type: 'dialogue',
                speaker: '🌑 The Void',
                text: 'Three islands. Three fronts. Where will you invest your Qi? I will strike where you least expect.',
                position: 'right',
            },
            {
                id: 'ch3-turn6',
                triggerTurn: 6,
                type: 'alert',
                text: '⚖️ Tenuki: Sometimes the greatest victory is abandoning a small island to dominate the main land.',
            },
            {
                id: 'ch3-turn18',
                triggerTurn: 18,
                type: 'dialogue',
                speaker: '⚫ The Weaver',
                text: 'The fabric of the cosmos is responding. Each island purified brings the Grand Goban closer to wholeness.',
                position: 'left',
            },
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
//  CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

export class StoryModeController {
    public static readonly STORY_CHAPTERS: StoryChapter[] = STORY_CHAPTERS;
    public static currentChapter: number = 0;
    public static isStoryActive: boolean = false;
    private static worldOffsetX: number = 0;
    private static worldOffsetY: number = 0;
    public static readonly COSMIC_SCALE: number = 0.08;

    // Turn-event watcher
    private static _turnWatcher: ReturnType<typeof setInterval> | null = null;
    private static _eventsFired: Set<string> = new Set();

    // ─── LIFECYCLE ───────────────────────────────────────────────────────────

    public static init(): void {
        console.log('🌌 [StoryMode] StoryModeController.init()');
        (window as any).StoryModeController = StoryModeController;
        StoryDebugUI.init();

        GameEventBus.on('MATCH_ENDED', (payload) => {
            if (!this.isStoryActive) return;
            const report = payload.report;
            console.log('🏁 [StoryMode] MATCH_ENDED received. Ranking:', report.ranking);
            if (report.ranking && report.ranking[0] && report.ranking[0].playerId === 1) {
                this.onWinCurrentChapter();
            } else {
                this.onLoseCurrentChapter();
            }
        });
    }

    public static startCampaign(): void {
        console.log('🌌 [StoryMode] startCampaign() started');
        this.isStoryActive = true;
        this.worldOffsetX = 0;
        this.worldOffsetY = 0;
        this._eventsFired.clear();
        this._resetWorldContainer();

        // Enforce cosmic starfield background immediately
        HUDController.setBoardBackground('story');
        const viewport = document.getElementById('board-viewport');
        if (viewport) {
            viewport.setAttribute('data-bg', 'story');
            viewport.style.backgroundImage = "radial-gradient(circle at center, rgb(10 14 26 / 40%) 0%, rgb(5 8 18 / 0%) 100%), url('./bg_story.jpg')";
        }

        const debugPanel = document.getElementById('story-debug-panel');
        if (debugPanel) debugPanel.classList.remove('hidden');

        // Play the cinematic intro first — when skipped or finished, loads chapter 0 in cosmic overview!
        this.showCinematicIntro(true);
    }

    public static stopCampaign(): void {
        console.log('🌌 [StoryMode] stopCampaign()');
        this.isStoryActive = false;
        this._stopTurnWatcher();
        this._removeCrackOverlay();
        this.resetWorld();
        document.getElementById('story-debug-panel')?.classList.add('hidden');
        StoryDialogueRenderer.hide();
    }

    // ─── CHAPTER LOADING ─────────────────────────────────────────────────────

    public static loadChapter(index: number, startZoomedOut: boolean = true): void {
        const chapter = STORY_CHAPTERS[index];
        if (!chapter) {
            SoundFX.playVictoryFanfare();
            HUDController.showAlert('🏆 The Grand Goban has been restored! Universe purified.', 6000);
            return;
        }

        this.currentChapter = index;
        this._eventsFired.clear();
        this._removeCrackOverlay();
        document.getElementById('story-enter-prompt')?.remove();

        // ── 1. Configure game as '1via' — proven, working AI ──────────────
        GameController.config = {
            ruleStyle: 'classic',
            gameMode: '1via',
            playerCount: 2,
            humanColor: 1,
            difficulty: chapter.difficulty,
            komi: 6.5,
            shape: chapter.shape,
            size: chapter.size as import('../types').BoardSize,
            heroId: 'normal',
            enemyHeroId: 'story_sage',
            enemyHeroIds: { 2: 'story_sage', 3: 'story_sage', 4: 'story_sage' },
            isRoguelikeMatch: false,
            background: 'story',
        };
        (window as any).__isStoryLoading = true;
        GameController.initGame();
        (window as any).__isStoryLoading = false;

        // Ensure Hero state and skills are clean for Normal Person
        ChampionManager.resetForMatch('normal', GameController.board, 1);
        ChampionManager.currentTargetingMode = 'none';
        const skillBtn = document.getElementById('btn-duel-champion-skill');
        if (skillBtn) skillBtn.style.display = 'none';

        // Force cosmic background
        HUDController.setBoardBackground('story');
        const viewport = document.getElementById('board-viewport');
        if (viewport) {
            viewport.setAttribute('data-bg', 'story');
            viewport.style.backgroundImage = "radial-gradient(circle at center, rgb(10 14 26 / 40%) 0%, rgb(5 8 18 / 0%) 100%), url('./bg_story.jpg')";
        }

        // Populate captives if configured for this chapter
        if (chapter.captives && GameController.state) {
            GameController.state.captives = JSON.parse(JSON.stringify(chapter.captives));
            GameController.renderer?.render();
        }

        const pCard = document.getElementById('duel-player-card');
        const eCard = document.getElementById('duel-enemy-card');
        const worldContainer = document.getElementById('story-world-container');
        const mainSvg = document.getElementById('game-svg');
        const debugPanel = document.getElementById('story-debug-panel');
        if (debugPanel) debugPanel.classList.remove('hidden');
        this._refreshDebugChapterSelect(index);

        this._stopTurnWatcher();

        if (startZoomedOut) {
            // ── Zoomed out cosmic overview: waiting for player click ──
            if (pCard) { pCard.style.opacity = '0'; pCard.style.pointerEvents = 'none'; pCard.style.transition = 'opacity 0.6s ease'; }
            if (eCard) { eCard.style.opacity = '0'; eCard.style.pointerEvents = 'none'; eCard.style.transition = 'opacity 0.6s ease'; }
            if (worldContainer) {
                worldContainer.style.transition = 'transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)';
                worldContainer.style.transform = `translate(${this.worldOffsetX}px, ${this.worldOffsetY}px) scale(${this.COSMIC_SCALE})`;
                worldContainer.style.cursor = 'pointer';
                worldContainer.style.filter = 'drop-shadow(0 0 35px rgba(251, 191, 36, 0.85))';
            }
            if (mainSvg) {
                mainSvg.style.pointerEvents = 'none';
            }

            const promptId = 'story-enter-prompt';
            let promptEl = document.getElementById(promptId);
            if (promptEl) promptEl.remove();

            promptEl = document.createElement('div');
            promptEl.id = promptId;
            promptEl.style.cssText = `
                position: fixed; top: 72%; left: 50%; transform: translate(-50%, -50%);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: var(--font-display, 'Cinzel', serif);
                color: #fbbf24; text-align: center;
                cursor: pointer; z-index: 1000;
                background: rgba(8, 12, 24, 0.92); padding: 18px 36px; border-radius: 16px;
                border: 2px solid rgba(251, 191, 36, 0.7);
                box-shadow: 0 0 50px rgba(124, 58, 237, 0.6), inset 0 0 25px rgba(251, 191, 36, 0.2);
                backdrop-filter: blur(16px);
                animation: storyNodePulse 2.2s infinite ease-in-out;
                user-select: none; transition: transform 0.25s ease, box-shadow 0.25s ease;
            `;
            promptEl.innerHTML = `
                <div style="font-size:0.75rem; font-weight:800; letter-spacing:0.28em; text-transform:uppercase; color:#94a3b8; margin-bottom:6px;">
                    ✦ FRACTURE NODE 0${index + 1} ✦
                </div>
                <div style="font-size:1.4rem; font-weight:bold; color:#fbbf24; text-shadow:0 0 16px rgba(251,191,36,0.6); margin-bottom:12px;">
                    ${chapter.title}
                </div>
                <div style="display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg, #7c3aed, #4f46e5); color:#ffffff; font-size:0.92rem; font-weight:800; letter-spacing:0.1em; padding:10px 24px; border-radius:8px; box-shadow:0 4px 20px rgba(124,58,237,0.6);">
                    ⚔️ DIVE INTO GOBAN ✦
                </div>
            `;
            document.body.appendChild(promptEl);

            let entered = false;
            const onClickEnter = () => {
                if (entered) return;
                entered = true;

                if (promptEl) {
                    promptEl.style.opacity = '0';
                    promptEl.style.transform = 'translate(-50%, -40%) scale(0.9)';
                    promptEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    setTimeout(() => promptEl?.remove(), 450);
                }
                SoundFX.playSpecial();

                if (worldContainer) {
                    worldContainer.style.cursor = 'default';
                    worldContainer.style.filter = '';
                    worldContainer.style.transition = 'transform 1.5s cubic-bezier(0.16, 1, 0.3, 1)';
                    worldContainer.style.transform = `translate(${this.worldOffsetX}px, ${this.worldOffsetY}px) scale(1)`;
                    
                    setTimeout(() => {
                        if (pCard) { pCard.style.opacity = '1'; pCard.style.pointerEvents = 'auto'; }
                        if (eCard) { eCard.style.opacity = '1'; eCard.style.pointerEvents = 'auto'; }
                        const boardContainer = document.getElementById('board-container');
                        if (boardContainer) {
                            boardContainer.classList.add('vfx-screen-shake');
                            setTimeout(() => boardContainer.classList.remove('vfx-screen-shake'), 400);
                        }
                    }, 1100);
                }

                setTimeout(() => {
                    if (mainSvg) mainSvg.style.pointerEvents = 'auto';
                    if (GameController.renderer) GameController.renderer.isInteractive = true;
                    this._startTurnWatcher(chapter);
                    this._showDialogue(chapter.title, chapter.introLore, chapter.speaker, 'left', true);
                }, 1400);
            };

            promptEl.addEventListener('click', onClickEnter);
            worldContainer?.addEventListener('click', onClickEnter, { once: true });
        } else {
            // ── Standard in-game start (direct dive / post-intro) ──
            if (pCard) { pCard.style.opacity = '1'; pCard.style.pointerEvents = 'auto'; }
            if (eCard) { eCard.style.opacity = '1'; eCard.style.pointerEvents = 'auto'; }
            if (worldContainer) {
                worldContainer.style.transform = `translate(${this.worldOffsetX}px, ${this.worldOffsetY}px) scale(1)`;
                worldContainer.style.cursor = 'default';
                worldContainer.style.filter = '';
            }
            if (mainSvg) mainSvg.style.pointerEvents = 'auto';
            if (GameController.renderer) GameController.renderer.isInteractive = true;

            this._startTurnWatcher(chapter);
            setTimeout(() => {
                this._showDialogue(chapter.title, chapter.introLore, chapter.speaker, 'left', true);
            }, 300);
        }
    }

    // ─── VICTORY / DEFEAT ────────────────────────────────────────────────────

    public static onWinCurrentChapter(): void {
        if (!this.isStoryActive) return;
        this._stopTurnWatcher();

        const chapter = STORY_CHAPTERS[this.currentChapter];
        SoundFX.playVictoryFanfare();
        HUDController.showAlert(`✅ "${chapter?.title ?? ''}" purificado. La naturaleza reclama el Goban.`, 3000);

        // Decorate the board with real illustrated nature assets (pines, sakura, bamboo, vines)
        this._bloomConqueredBoard();

        this._showDialogue(
            '⚫ The Weaver',
            'This island has been purifed and restored by nature. The Qi flows freely once more. Onward to the next cosmic fracture!',
            '',
            'left',
            false
        );

        // After enjoying the garden (3.2s) → Zoom out & pan to next chapter
        setTimeout(() => {
            StoryDialogueRenderer.hide();
            this._transitionToNextChapter();
        }, 3200);
    }

    public static onLoseCurrentChapter(): void {
        if (!this.isStoryActive) return;
        SoundFX.playDefeatGong();
        HUDController.showAlert('💀 The Void has consumed you. The weave crumbles.', 3000);
    }

    private static _bloomConqueredBoard(): void {
        const svg = document.getElementById('game-svg') as SVGSVGElement | null;
        if (!svg) return;
        
        const board = GameController.board;
        if (!board) return;

        // Remove old bloom layer if any
        document.getElementById('story-nature-bloom-layer')?.remove();

        const bloomLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        bloomLayer.setAttribute('id', 'story-nature-bloom-layer');
        bloomLayer.style.pointerEvents = 'none';

        // 1. Draw organic winding green ivy vines along board connections
        const vineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        vineGroup.setAttribute('class', 'story-vines-group');
        
        const drawnEdges = new Set<string>();
        for (const node of board.nodes.values()) {
            if (node.terrain === 'DESTROYED') continue;
            for (const neighborId of node.neighbors) {
                const neighbor = board.nodes.get(neighborId);
                if (!neighbor || neighbor.terrain === 'DESTROYED') continue;
                const edgeKey = [node.id, neighborId].sort().join('--');
                if (drawnEdges.has(edgeKey)) continue;
                drawnEdges.add(edgeKey);

                if (Math.random() < 0.45) {
                    const midX = (node.x + neighbor.x) / 2 + (Math.random() - 0.5) * 14;
                    const midY = (node.y + neighbor.y) / 2 + (Math.random() - 0.5) * 14;

                    const vine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    vine.setAttribute('d', `M ${node.x} ${node.y} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${neighbor.x} ${neighbor.y}`);
                    vine.setAttribute('stroke', '#16a34a');
                    vine.setAttribute('stroke-width', '3.5');
                    vine.setAttribute('stroke-linecap', 'round');
                    vine.setAttribute('fill', 'none');
                    vine.setAttribute('filter', 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.8))');
                    vine.style.animation = 'storyVineGrow 1.2s ease forwards';
                    vine.style.animationDelay = `${Math.random() * 600}ms`;
                    vineGroup.appendChild(vine);
                }
            }
        }
        bloomLayer.appendChild(vineGroup);

        // 2. Place illustrated nature assets (pine, sakura, bamboo, vines/moss)
        const assetTypes = [
            { src: '/nature/nature_pine.png', w: 60, h: 60, offsetY: -28 },
            { src: '/nature/nature_sakura.png', w: 64, h: 64, offsetY: -30 },
            { src: '/nature/nature_bamboo.png', w: 50, h: 56, offsetY: -26 },
            { src: '/nature/nature_vines.png', w: 54, h: 50, offsetY: -18 },
        ];

        const validNodes = Array.from(board.nodes.values()).filter(n => n.terrain !== 'DESTROYED');
        const shuffled = [...validNodes].sort(() => Math.random() - 0.5);
        const count = Math.min(Math.max(6, Math.floor(validNodes.length * 0.38)), 28);
        const selectedNodes = shuffled.slice(0, count);

        selectedNodes.forEach((node, i) => {
            const asset = assetTypes[i % assetTypes.length];
            const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            img.setAttribute('href', asset.src);
            img.setAttribute('x', (node.x - asset.w / 2).toString());
            img.setAttribute('y', (node.y + asset.offsetY).toString());
            img.setAttribute('width', asset.w.toString());
            img.setAttribute('height', asset.h.toString());
            img.setAttribute('class', 'story-bloom-asset');
            img.style.transformOrigin = `${node.x}px ${node.y}px`;
            img.style.animation = `storyNaturePop 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`;
            img.style.animationDelay = `${120 + i * 85}ms`;
            img.style.opacity = '0';
            bloomLayer.appendChild(img);
        });

        // 3. Inject animation styles if not present
        if (!document.getElementById('story-nature-styles')) {
            const style = document.createElement('style');
            style.id = 'story-nature-styles';
            style.textContent = `
                @keyframes storyNaturePop {
                    0% { opacity: 0; transform: scale(0) translateY(24px); filter: drop-shadow(0 0 0 transparent); }
                    60% { opacity: 1; transform: scale(1.2) translateY(-4px); filter: drop-shadow(0 0 14px rgba(74, 222, 128, 0.85)); }
                    100% { opacity: 1; transform: scale(1) translateY(0); filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.75)); }
                }
                @keyframes storyVineGrow {
                    0% { stroke-dasharray: 200; stroke-dashoffset: 200; opacity: 0; }
                    100% { stroke-dasharray: 200; stroke-dashoffset: 0; opacity: 0.95; }
                }
            `;
            document.head.appendChild(style);
        }

        svg.appendChild(bloomLayer);
    }

    // ─── TURN-EVENT SYSTEM ───────────────────────────────────────────────────

    private static _startTurnWatcher(chapter: StoryChapter): void {
        this._turnWatcher = setInterval(() => {
            if (!this.isStoryActive || !GameController.state || GameController.state.isGameOver) return;
            const turn = GameController.state.currentTurn ?? 0;
            for (const event of chapter.events) {
                if (this._eventsFired.has(event.id)) continue;
                if (turn >= event.triggerTurn) {
                    this._eventsFired.add(event.id);
                    this._fireEvent(event);
                }
            }
        }, 500);
    }

    private static _stopTurnWatcher(): void {
        if (this._turnWatcher !== null) {
            clearInterval(this._turnWatcher);
            this._turnWatcher = null;
        }
    }

    private static _fireEvent(event: StoryEvent): void {
        switch (event.type) {
            case 'dialogue':
                this._showDialogue(event.speaker ?? '', event.text ?? '', '', event.position ?? 'left', true);
                break;

            case 'alert':
                HUDController.showAlert(event.text ?? '', 4000);
                break;

            case 'earthquake':
                this._triggerEarthquake(event);
                break;
        }
    }

    // ─── EARTHQUAKE EFFECT ───────────────────────────────────────────────────

    private static _triggerEarthquake(event: StoryEvent): void {
        const boardContainer = document.getElementById('board-container');
        const viewport = document.getElementById('board-viewport');

        // 1. Strong screen shake
        if (boardContainer) {
            boardContainer.classList.add('vfx-screen-shake');
            setTimeout(() => boardContainer.classList.remove('vfx-screen-shake'), 700);
        }

        SoundFX.playCapture(); // re-use capture sound as a rumble

        // 2. Draw crack overlay on the board
        const crackCount = event.crackCount ?? 4;
        const alignX = event.mechanicalSplit ? 0.5 : undefined;
        this._drawCrackOverlay(crackCount, viewport ?? boardContainer, alignX);

        // 3. Second shake after a moment
        setTimeout(() => {
            if (boardContainer) {
                boardContainer.classList.add('vfx-screen-shake');
                setTimeout(() => boardContainer.classList.remove('vfx-screen-shake'), 500);
            }
        }, 600);

        // 3.5 Mechanical split (destroy nodes and draw fault directly in SVG)
        if (event.mechanicalSplit) {
            const board = GameController.board;
            const size = board.size ?? 13;
            const center = Math.floor(size / 2);
            const destroyedCoords: { x: number; y: number }[] = [];

            for (let row = 0; row < size; row++) {
                const offset = (row % 4 === 0) ? -1 : (row % 3 === 0) ? 1 : 0;
                const col = center + offset;
                const id = `${col},${row}`;
                const node = board.nodes.get(id);
                if (node) {
                    destroyedCoords.push({ x: node.x, y: node.y });
                }
                board.removeNode(id);
            }
            GameController.renderer?.render();

            // Draw glowing fracture line directly into SVG along destroyed coordinates
            const svg = document.getElementById('game-svg') as SVGSVGElement | null;
            if (svg && destroyedCoords.length > 0) {
                const crackGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                crackGroup.setAttribute('id', 'story-fault-split-svg');

                let d = `M ${destroyedCoords[0].x} ${destroyedCoords[0].y}`;
                for (let i = 1; i < destroyedCoords.length; i++) {
                    const jitterX = (Math.random() - 0.5) * 6;
                    d += ` L ${(destroyedCoords[i].x + jitterX).toFixed(1)} ${destroyedCoords[i].y}`;
                }

                // Deep abyss void path
                const abyss = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                abyss.setAttribute('d', d);
                abyss.setAttribute('stroke', '#05030a');
                abyss.setAttribute('stroke-width', '16');
                abyss.setAttribute('stroke-linecap', 'round');
                abyss.setAttribute('stroke-linejoin', 'round');
                crackGroup.appendChild(abyss);

                // Glowing purple energy crack
                const energy = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                energy.setAttribute('d', d);
                energy.setAttribute('stroke', '#c084fc');
                energy.setAttribute('stroke-width', '4');
                energy.setAttribute('stroke-linecap', 'round');
                energy.setAttribute('stroke-linejoin', 'round');
                energy.setAttribute('filter', 'drop-shadow(0 0 10px #a855f7)');
                crackGroup.appendChild(energy);

                // Core electric white fissure
                const core = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                core.setAttribute('d', d);
                core.setAttribute('stroke', '#ffffff');
                core.setAttribute('stroke-width', '1.5');
                core.setAttribute('stroke-linecap', 'round');
                crackGroup.appendChild(core);

                svg.appendChild(crackGroup);
            }
        }

        // 4. Optional: full board shatter (destroy all stones)
        if (event.shatterBoard && GameController.renderer) {
            setTimeout(() => {
                GameController.renderer?.triggerBoardShatterAnimation();
            }, 800);
        }

        // 5. Show narrative dialogue about the earthquake
        setTimeout(() => {
            this._showDialogue(
                event.speaker ?? '💥 COSMIC QUAKE',
                event.text ?? 'The tectonic plate ruptures...',
                '',
                event.position ?? 'left',
                true,
            );
        }, 900);
    }

    /** Draws SVG crack lines over the board to simulate fracture */
    private static _drawCrackOverlay(count: number, container: HTMLElement | null, alignX?: number): void {
        if (!container) return;
        this._removeCrackOverlay();

        const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        overlay.id = 'story-crack-overlay';
        overlay.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        overlay.style.cssText = `
            position:absolute; top:0; left:0; width:100%; height:100%;
            pointer-events:none; z-index:500;
        `;

        const W = container.clientWidth || 600;
        const H = container.clientHeight || 600;
        const baseStartX = alignX !== undefined ? (alignX * W) : undefined;

        for (let i = 0; i < count; i++) {
            const startX = baseStartX !== undefined 
                ? baseStartX + (Math.random() - 0.5) * (W * 0.15) 
                : Math.random() * W;
                
            const startY = 0;
            let x = startX, y = startY;
            let d = `M ${x} ${y}`;
            const steps = 6 + Math.floor(Math.random() * 5);
            for (let s = 0; s < steps; s++) {
                x += (Math.random() - 0.4) * (W * 0.25);
                if (baseStartX !== undefined) {
                    x = x * 0.7 + baseStartX * 0.3; 
                }
                y += H / steps + (Math.random() - 0.5) * 20;
                x = Math.max(0, Math.min(W, x));
                d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
            }
            const crack = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            crack.setAttribute('d', d);
            crack.setAttribute('stroke', `rgba(${80 + i * 30}, ${20 + i * 10}, 180, 0.85)`);
            crack.setAttribute('stroke-width', String(2 + Math.random() * 2));
            crack.setAttribute('fill', 'none');
            crack.setAttribute('stroke-linecap', 'round');
            crack.style.animation = `storycrack-appear 0.4s ease forwards`;
            crack.style.animationDelay = `${i * 80}ms`;
            crack.style.opacity = '0';
            overlay.appendChild(crack);

            // Glow duplicate
            const glow = crack.cloneNode(true) as SVGPathElement;
            glow.setAttribute('stroke', `rgba(160, 80, 255, 0.3)`);
            glow.setAttribute('stroke-width', String(6 + Math.random() * 3));
            glow.style.filter = 'blur(3px)';
            overlay.insertBefore(glow, crack);
        }

        // Inject keyframe if not already present
        if (!document.getElementById('story-crack-style')) {
            const style = document.createElement('style');
            style.id = 'story-crack-style';
            style.textContent = `
                @keyframes storycrack-appear {
                    0%   { opacity: 0; stroke-dashoffset: 1000; stroke-dasharray: 1000; }
                    30%  { opacity: 1; }
                    100% { opacity: 0.75; stroke-dashoffset: 0; }
                }
                @keyframes storyNodePulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 35px rgba(124, 58, 237, 0.4); }
                    50% { transform: translate(-50%, -50%) scale(1.04); box-shadow: 0 0 50px rgba(251, 191, 36, 0.7); }
                }
            `;
            document.head.appendChild(style);
        }

        container.style.position = 'relative';
        container.appendChild(overlay);
    }

    private static _removeCrackOverlay(): void {
        document.getElementById('story-crack-overlay')?.remove();
        document.getElementById('story-fault-split-svg')?.remove();
    }

    // ─── CHAPTER TRANSITION ──────────────────────────────────────────────────

    private static async _transitionToNextChapter(): Promise<void> {
        console.log(`🚀 [StoryMode] _transitionToNextChapter() from Chapter ${this.currentChapter} to ${this.currentChapter + 1}`);
        const worldContainer = document.getElementById('story-world-container');
        const mainSvg = document.getElementById('game-svg') as SVGSVGElement | null;
        const pCard = document.getElementById('duel-player-card');
        const eCard = document.getElementById('duel-enemy-card');

        if (!worldContainer || !mainSvg) return;

        // 1. Fade out standees smoothly
        if (pCard) { pCard.style.opacity = '0'; pCard.style.pointerEvents = 'none'; }
        if (eCard) { eCard.style.opacity = '0'; eCard.style.pointerEvents = 'none'; }

        // 2. Clone the board with its bloomed trees & vines as the "conquered island" (placed below)
        const conquered = mainSvg.cloneNode(true) as SVGSVGElement;
        conquered.removeAttribute('id');
        conquered.setAttribute('class', 'story-conquered-island');
        
        // Convert wood to grass texture
        const woodPolygons = conquered.querySelectorAll('polygon[fill="url(#wood-texture)"]');
        woodPolygons.forEach(p => {
            p.setAttribute('fill', 'url(#grass-texture)');
            if (p.hasAttribute('stroke') && p.getAttribute('stroke') === 'url(#wood-texture)') {
                p.setAttribute('stroke', 'url(#grass-texture)');
            }
        });
        
        // Calculate the relative vertical shift needed to attach the new board above the old one
        // The old board shifts down in its local space, and the new board shifts up in its local space.
        // We use window height units (vh) to keep it responsive.
        const conqueredShiftY = 32; // vh down
        const newBoardShiftY = -32; // vh up
        
        // Accumulate the world offset so when we zoom in, the new board is perfectly centered!
        this.worldOffsetY -= newBoardShiftY * (window.innerHeight / 100);

        conquered.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; transition: transform 1.2s ease, opacity 0.8s ease;
            filter: drop-shadow(0 0 35px rgba(34, 197, 94, 0.95));
            transform: translate(${-this.worldOffsetX}px, ${conqueredShiftY}vh) scale(0.65);
        `;
        worldContainer.appendChild(conquered);

        // 3. Zoom out to deep space
        worldContainer.style.transition = 'transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)';
        worldContainer.style.transform = `translate(${this.worldOffsetX}px, ${this.worldOffsetY}px) scale(${this.COSMIC_SCALE})`;
        worldContainer.style.filter = '';

        // 4. Load the next chapter while zooming out
        setTimeout(() => {
            // We no longer pan horizontally, they share the same macrocosmos vertically
            worldContainer.style.transition = 'transform 1.6s cubic-bezier(0.2, 0.9, 0.3, 1)';
            worldContainer.style.transform = `translate(${this.worldOffsetX}px, ${this.worldOffsetY}px) scale(${this.COSMIC_SCALE})`;
            
            // 5. Load the next chapter in the background
            setTimeout(() => {
                const nextChapter = this.currentChapter + 1;
                console.log(`📖 [StoryMode] Loading new chapter ${nextChapter + 1} ("NUEVO")`);
                this.loadChapter(nextChapter, true);
                const newSvg = document.getElementById('game-svg');
                if (newSvg) {
                    newSvg.style.display = 'block';
                    newSvg.style.transform = `translate(${-this.worldOffsetX}px, ${newBoardShiftY}vh)`;
                }
            }, 300);
        }, 1300);
    }

    // ─── DIALOGUE HELPER ─────────────────────────────────────────────────────

    private static _showDialogue(
        speaker: string,
        text: string,
        _subtitle: string = '',
        position: 'left' | 'right' = 'left',
        _autoCloseOnClick: boolean = true,
    ): void {
        StoryDialogueRenderer.show();
        StoryDialogueRenderer.renderLine({ speakerName: speaker, text, position, speakerImage: '' });
    }

    // ─── PRIVATE HELPERS ─────────────────────────────────────────────────────


    public static resetWorld(): void {
        this.worldOffsetX = 0;
        this.worldOffsetY = 0;
        const wc = document.getElementById('story-world-container');
        if (wc) {
            wc.style.transform = 'translate(0px, 0px) scale(1)';
            wc.style.filter = '';
            wc.style.cursor = 'default';
            wc.style.transition = 'none';
            // Eliminar cualquier elemento clonado extra del contenedor (islas conquistadas, etc.)
            Array.from(wc.children).forEach(c => { if (c.id !== 'game-svg') c.remove(); });
        }
        const svg = document.getElementById('game-svg');
        if (svg) {
            svg.style.transform = '';
            svg.style.opacity = '1';
            svg.style.display = 'block';
            svg.style.pointerEvents = 'auto';
        }
        const pCard = document.getElementById('duel-player-card');
        const eCard = document.getElementById('duel-enemy-card');
        if (pCard) { pCard.style.opacity = '1'; pCard.style.pointerEvents = 'auto'; pCard.style.transition = ''; }
        if (eCard) { eCard.style.opacity = '1'; eCard.style.pointerEvents = 'auto'; eCard.style.transition = ''; }
        
        document.getElementById('story-enter-prompt')?.remove();
        document.getElementById('story-fault-split-svg')?.remove();
        document.getElementById('story-nature-bloom-layer')?.remove();
        document.querySelectorAll('.story-crack-overlay').forEach(el => el.remove());
        document.getElementById('board-container')?.classList.remove('vfx-screen-shake');
        document.getElementById('board-viewport')?.classList.remove('vfx-screen-shake');
        const intro = document.getElementById('story-cinematic-intro');
        if (intro) intro.classList.add('hidden');
    }

    private static _resetWorldContainer(): void {
        this.resetWorld();
    }

    private static _refreshDebugChapterSelect(currentIndex: number): void {
        const sel = document.getElementById('story-debug-chapter') as HTMLSelectElement | null;
        if (!sel) return;
        sel.innerHTML = '';
        STORY_CHAPTERS.forEach((c, i) => {
            const opt = document.createElement('option');
            opt.value = String(i);
            opt.textContent = `Cap. ${c.id}: ${c.title}`;
            if (i === currentIndex) opt.selected = true;
            sel.appendChild(opt);
        });
    }

    public static getChapterCount(): number { return STORY_CHAPTERS.length; }

    // ─── CINEMATIC INTRO ─────────────────────────────────────────────────────

    /**
     * showCinematicIntro(andStart)
     * Displays the fullscreen cosmos intro sequence.
     * If andStart=true, calls loadChapter(0) after dismiss.
     */
    public static showCinematicIntro(andStart: boolean): void {
        const overlay   = document.getElementById('story-cinematic-intro');
        const cosmos    = document.getElementById('story-intro-cosmos');
        const line1     = document.getElementById('story-intro-line1');
        const line2     = document.getElementById('story-intro-line2');
        const line3     = document.getElementById('story-intro-line3');
        const line4     = document.getElementById('story-intro-line4');
        const skipHint  = document.getElementById('story-intro-skip');
        if (!overlay) return;

        // Reset state
        [line1, line2, line3, line4].forEach(el => {
            if (!el) return;
            el.style.opacity = '0';
            el.style.transform = 'translateY(12px)';
        });
        if (skipHint) {
            skipHint.style.opacity = '1';
            skipHint.style.pointerEvents = 'auto';
        }
        if (cosmos) { cosmos.style.transform = 'scale(1)'; cosmos.style.opacity = '1'; }
        overlay.classList.remove('hidden');
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.8s ease';
        requestAnimationFrame(() => { overlay.style.opacity = '1'; });

        let dismissed = false;
        const dismiss = () => {
            if (dismissed) return;
            dismissed = true;
            overlay.style.transition = 'opacity 0.5s ease';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.style.opacity = '';
                overlay.style.transition = '';
                if (andStart) this.loadChapter(0, true);
            }, 550);
            overlay.removeEventListener('click', dismiss);
            window.removeEventListener('keydown', keyDismiss);
        };
        const keyDismiss = () => dismiss();

        // Allow immediate skip / click to dismiss
        overlay.addEventListener('click', dismiss);
        window.addEventListener('keydown', keyDismiss);
        if (skipHint) {
            skipHint.addEventListener('click', (e) => {
                e.stopPropagation();
                dismiss();
            });
        }

        // ── Sequential text reveal ─────────────────────────────────────────
        const show = (el: HTMLElement | null, delay: number) => {
            setTimeout(() => {
                if (!el || dismissed) return;
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, delay);
        };

        show(line1, 500);
        show(line2, 1600);

        // Cosmos slow zoom starts at line2
        setTimeout(() => {
            if (cosmos && !dismissed) {
                cosmos.style.filter = 'brightness(0.5) saturate(1.6)';
            }
        }, 1500);

        show(line3, 2900);

        // Start the dramatic zoom-in when El Vacío is mentioned
        setTimeout(() => {
            if (cosmos && !dismissed) {
                cosmos.style.transform = 'scale(2.2)';
                cosmos.style.filter = 'brightness(0.2) saturate(0.6)';
            }
        }, 3100);

        show(line4, 4400);

        // Brighten back to reveal the world being "stitched"
        setTimeout(() => {
            if (cosmos && !dismissed) {
                cosmos.style.transform = 'scale(1.6)';
                cosmos.style.filter = 'brightness(0.4) saturate(1.5)';
            }
        }, 4600);

        // Auto-dismiss after 9.5s
        setTimeout(dismiss, 9500);
    }

    // ─── DEBUG TESTERS (called from StoryDebugUI) ────────────────────────────


    public static debugTestEarthquake(): void {
        this._triggerEarthquake({
            id: 'debug-eq',
            triggerTurn: 0,
            type: 'earthquake',
            speaker: '💥 TEST — Earthquake',
            text: 'Test earthquake effect. The cracks are the Void becoming visible in the fabric of the world.',
            position: 'left',
            shatterBoard: false,
            crackCount: 6,
            mechanicalSplit: true,
        });
    }

    public static debugTestDialogue(side: 'left' | 'right'): void {
        if (side === 'left') {
            this._showDialogue(
                '⚫ Cosmic Weaver',
                'Every intersection I sow with Qi is a crack I close. The world remembers its original shape.',
                '',
                'left',
                true,
            );
        } else {
            this._showDialogue(
                '🌑 The Void',
                'You cannot sew what I tear. For every thread you weave, I cut two.',
                '',
                'right',
                true,
            );
        }
    }

    public static debugTestAlert(): void {
        const turn = (window as any).__GC?.state?.currentTurn ?? '?';
        HUDController.showAlert(`⚖️ TEST — Turn ${turn}: Tenuki means ignoring the local to win the global.`, 4000);
    }

    public static debugTestShatter(): void {
        if (GameController.renderer) {
            HUDController.showAlert('💥 Shattering board...', 1200);
            setTimeout(() => GameController.renderer?.triggerBoardShatterAnimation(), 400);
        } else {
            HUDController.showAlert('⚠️ No active game to shatter.', 2000);
        }
    }
}

// Global window attachment
if (typeof window !== 'undefined') {
    (window as any).StoryModeController = StoryModeController;
}
