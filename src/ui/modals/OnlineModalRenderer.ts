
import type { HeroId, PlayerId, BoardShape, BoardSize, BoardBackground } from '../../types';
import { NetworkManager } from '../../network/NetworkManager';
import { RoguelikeRunManager } from '../../core/RoguelikeRunManager';
import { SetupModalRenderer } from "./SetupModalRenderer";
import { BoardGenerators } from '../../graphics/BoardGenerators';
import { SVGRenderer } from '../../graphics/SVGRenderer';
import { GameState } from '../../core/GameState';
import { GraphBoard } from '../../core/GraphBoard';
export class OnlineModalRenderer {
    // ==================== 2. MODAL ONLINE P2P (WEBRTC 2P & 4P) ====================
    public static currentOnlineWizardStep: number = 1;

    public static setOnlineWizardStep(step: number) {
        this.currentOnlineWizardStep = step;
        for (let i = 1; i <= 5; i++) {
            const panel = document.getElementById(`online-host-step-${i}`);
            panel?.classList.toggle('hidden', i !== this.currentOnlineWizardStep);
            panel?.classList.toggle('active', i === this.currentOnlineWizardStep);
        }

        document.querySelectorAll('#online-wizard-stepper .wizard-step-node').forEach(node => {
            const nodeStep = parseInt(node.getAttribute('data-step') || '1', 10);
            node.classList.toggle('active', nodeStep === this.currentOnlineWizardStep);
            node.classList.toggle('completed', nodeStep < this.currentOnlineWizardStep);
        });

        const counter = document.getElementById('online-wizard-step-counter');
        if (counter) counter.innerText = `Step ${this.currentOnlineWizardStep} of 5`;

        const btnPrev = document.getElementById('btn-online-wizard-prev');
        const btnNext = document.getElementById('btn-online-wizard-next');

        if (btnPrev) {
            btnPrev.classList.toggle('hidden', this.currentOnlineWizardStep === 1);
        }
        if (btnNext) {
            btnNext.classList.toggle('hidden', this.currentOnlineWizardStep === 5);
        }
    }

    public static openOnlineModal() {
        document.getElementById('online-modal')?.classList.remove('hidden');
    }

    public static closeOnlineModal() {
        document.getElementById('online-modal')?.classList.add('hidden');
    }

    public static switchOnlineTab(tab: 'create' | 'join') {
        const btnCreate = document.getElementById('tab-btn-create-room');
        const btnJoin = document.getElementById('tab-btn-join-room');
        const tabCreate = document.getElementById('view-create-room');
        const tabJoin = document.getElementById('view-join-room');

        btnCreate?.classList.toggle('active', tab === 'create');
        btnJoin?.classList.toggle('active', tab === 'join');
        tabCreate?.classList.toggle('hidden', tab !== 'create');
        tabJoin?.classList.toggle('hidden', tab !== 'join');
    }

    public static updateOnlineModalUI(
        hostColor: PlayerId, 
        shape: BoardShape, 
        size: BoardSize, 
        komi: number, 
        playerCount: 2 | 4 = 2,
        hostHero: HeroId | null = null,
        background: BoardBackground = 'combat'
    ) {
        document.getElementById('online-players-2')?.classList.toggle('active', playerCount === 2);
        document.getElementById('online-players-4')?.classList.toggle('active', playerCount === 4);

        const colorPickerRow = document.getElementById('online-host-color-section');
        if (colorPickerRow) {
            colorPickerRow.classList.toggle('hidden', playerCount === 4);
        }

        document.getElementById('online-color-black')?.classList.toggle('active', hostColor === 1);
        document.getElementById('online-color-white')?.classList.toggle('active', hostColor === 2);

        const allShapes = ['square', 'triangle', 'hex', 'eroded', 'islands_v1', 'islands_v2', 'islands', 'cross', 'hourglass', 'geode', 'spiral', 'rings', 'star_5', 'star_6', 'procedural'];
        allShapes.forEach(sh => {
            document.getElementById(`online-shape-${sh}`)?.classList.toggle('active', shape === sh);
        });

        // Fondos / Escenarios
        document.querySelectorAll('.btn-online-bg').forEach(btn => {
            const bgVal = btn.getAttribute('data-bg');
            btn.classList.toggle('active', bgVal === background);
        });

        const stageViewport = document.getElementById('online-scenery-stage-viewport');
        if (stageViewport) {
            stageViewport.style.backgroundImage = `url('./bg_${background}.jpg')`;
        }

        // Render Online Board Preview
        const previewTitle = document.getElementById('online-board-preview-title');
        const previewDesc = document.getElementById('online-board-preview-desc');
        const shapeLabels: Record<string, string> = { square: 'Cuadrado', triangle: 'Triangular', hex: 'Hexagonal', eroded: 'Erosionado', islands: 'Islas / Abismos', cross: 'Cruz / Diamante', procedural: 'Procedural Infinito' };
        const shapeName = shapeLabels[shape] || shape;
        
        const board = new GraphBoard();
        BoardGenerators.generate(board, shape, size, 12345);
        if (previewTitle) previewTitle.innerText = `${size}x${size} ${shapeName}`;
        if (previewDesc) previewDesc.innerText = `${board.nodes.size} Intersecciones`;

        const svg = document.getElementById('online-board-preview-svg');
        if (svg) {
            const state = new GameState(komi, playerCount);
            const renderer = new SVGRenderer(
                'online-board-preview-svg', 
                board, 
                state, 
                () => {}, 
                () => {}
            );
            renderer.isInteractive = false;
            renderer.render();
        }

        document.getElementById('online-size-9')?.classList.toggle('active', size === 9);
        document.getElementById('online-size-13')?.classList.toggle('active', size === 13);
        document.getElementById('online-size-19')?.classList.toggle('active', size === 19);

        const komiDisplay = document.getElementById('online-komi-display');
        if (komiDisplay) komiDisplay.innerText = `${komi} pts`;

        const komiInput = document.getElementById('online-komi-input') as HTMLInputElement | null;
        if (komiInput) komiInput.value = komi.toString();

        document.querySelectorAll('.btn-online-komi').forEach(btn => {
            const val = parseFloat(btn.getAttribute('data-komi') || '6.5');
            btn.classList.toggle('active', val === komi);
        });

        SetupModalRenderer.renderHeroShowcaseElements('online-host', hostHero);
    }

    public static updateOnlineGuestHeroUI(guestHero: HeroId | null = null) {
        SetupModalRenderer.renderHeroShowcaseElements('online-guest', guestHero);
    }

    public static renderOnlineLobbySlots(
        containerId: string, 
        slots: { id: PlayerId; name: string; isHost: boolean; connected: boolean; heroId?: HeroId | null }[], 
        myColor?: PlayerId
    ) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        slots.forEach(slot => {
            const card = document.createElement('div');
            const isMe = slot.id === myColor;
            card.className = `online-slot-card ${slot.connected ? 'connected' : 'waiting'} ${isMe ? 'is-you' : ''}`;

            const hero = slot.heroId ? RoguelikeRunManager.HEROES[slot.heroId] : null;
            const heroTag = hero ? `${hero.icon} ${hero.name}` : (slot.connected ? '⚪ Reglas Clásicas' : '⏳ Esperando...');

            card.innerHTML = `
                <div class="slot-icon-stone slot-stone-${slot.id}"></div>
                <div class="slot-info">
                    <strong class="slot-name">${slot.name}</strong>
                    <small class="slot-hero-tag">${heroTag}</small>
                    <span class="slot-badge">${slot.connected ? (slot.isHost ? '👑 Anfitrión' : '✅ Listo') : '⏳ Esperando...'}</span>
                </div>
            `;
            container.appendChild(card);
        });
    }

    public static updateOnlineLobbyStatus(
        text: string, 
        slots?: { id: PlayerId; name: string; isHost: boolean; connected: boolean; heroId?: HeroId | null }[], 
        myColor?: PlayerId
    ) {
        const hostStatusText = document.getElementById('online-lobby-status-text');
        const joinStatusText = document.getElementById('join-status-text');
        const hostActionBar = document.getElementById('host-action-bar');
        const codeBox = document.getElementById('display-room-code');
        const roomCode = NetworkManager.currentRoomCode || '';

        if (codeBox && roomCode) codeBox.innerText = roomCode;

        if (hostStatusText) {
            hostStatusText.innerHTML = `<strong>Sala ${roomCode}</strong> — ${text}`;
        }
        if (joinStatusText) {
            joinStatusText.innerHTML = `<strong>Sala ${roomCode}</strong> — ${text}`;
        }

        if (slots) {
            this.renderOnlineLobbySlots('online-lobby-slots-grid', slots, myColor);
            this.renderOnlineLobbySlots('join-lobby-slots-grid', slots, myColor);

            const connectedCount = slots.filter(s => s.connected).length;
            const footerStartBtn = document.getElementById('btn-online-force-start');
            if (hostActionBar) {
                if (connectedCount >= 2) {
                    hostActionBar.classList.remove('hidden');
                } else {
                    hostActionBar.classList.add('hidden');
                }
            }
            if (footerStartBtn) {
                if (connectedCount >= 2) {
                    footerStartBtn.classList.remove('hidden');
                    footerStartBtn.innerHTML = `<span>⚔️ ¡Comenzar Partida! (${connectedCount}/${slots.length} Listos)</span>`;
                } else {
                    footerStartBtn.classList.add('hidden');
                }
            }
        }
    }

}
