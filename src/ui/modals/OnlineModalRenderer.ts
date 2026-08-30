
import type { HeroId, PlayerId, BoardShape, BoardSize, BoardBackground } from '../../types';
import { NetworkManager } from '../../network/NetworkManager';
import { RoguelikeRunManager } from '../../core/RoguelikeRunManager';
import { SetupModalRenderer } from "./SetupModalRenderer";
import { BoardGenerators } from '../../graphics/BoardGenerators';
import { SVGRenderer } from '../../graphics/SVGRenderer';
import { GameState } from '../../core/GameState';
import { GraphBoard } from '../../core/GraphBoard';
import { getLanguage, applyTranslationsToDOM } from '../../i18n/i18n';
import { OnlineController } from '../../controllers/OnlineController';
export class OnlineModalRenderer {
    // ==================== 2. MODAL ONLINE P2P (WEBRTC 2P & 4P) ====================
    public static currentOnlineWizardStep: number = 1;

    public static setOnlineWizardStep(step: number) {
        this.currentOnlineWizardStep = step;
        const isCoopRogue = (OnlineController as any).onlineGameType === 'coop_rogue';

        for (let i = 1; i <= 6; i++) {
            const panel = document.getElementById(`online-host-step-${i}`);
            panel?.classList.toggle('hidden', i !== this.currentOnlineWizardStep);
            panel?.classList.toggle('active', i === this.currentOnlineWizardStep);
        }

        ['players', 'board', 'champion', 'scenery'].forEach(id => {
            const node = document.getElementById(`online-wizard-node-${id}`);
            const line = document.getElementById(`online-wizard-line-${id}`);
            if (node) node.classList.toggle('hidden', isCoopRogue);
            if (line) line.classList.toggle('hidden', isCoopRogue);
        });

        // Actualizar numeración dinámica de pasos en nodos del stepper
        const numLobby = document.getElementById('online-step-num-lobby');
        if (numLobby) numLobby.innerText = isCoopRogue ? '2' : '6';

        document.querySelectorAll('#online-wizard-stepper .wizard-step-node').forEach(node => {
            const nodeStep = parseInt(node.getAttribute('data-step') || '1', 10);
            node.classList.toggle('active', nodeStep === this.currentOnlineWizardStep);
            node.classList.toggle('completed', nodeStep < this.currentOnlineWizardStep);
        });

        const totalSteps = isCoopRogue ? 2 : 6;
        let displayCurrentStep = this.currentOnlineWizardStep;
        if (isCoopRogue && this.currentOnlineWizardStep === 6) {
            displayCurrentStep = 2;
        }

        const counter = document.getElementById('online-wizard-step-counter');
        if (counter) {
            const isEn = getLanguage() === 'en';
            counter.innerText = isEn 
                ? `Step ${displayCurrentStep} of ${totalSteps}` 
                : `Paso ${displayCurrentStep} de ${totalSteps}`;
        }

        const btnPrev = document.getElementById('btn-online-wizard-prev');
        const btnNext = document.getElementById('btn-online-wizard-next');

        if (btnPrev) {
            btnPrev.classList.toggle('hidden', this.currentOnlineWizardStep === 1);
        }
        if (btnNext) {
            btnNext.classList.toggle('hidden', this.currentOnlineWizardStep === 6);
        }

        const btnForceStart = document.getElementById('btn-online-force-start');
        if (btnForceStart) {
            btnForceStart.classList.toggle('hidden', this.currentOnlineWizardStep !== 6);
        }

        applyTranslationsToDOM();
    }

    public static openOnlineModal() {
        document.getElementById('online-modal')?.classList.remove('hidden');
    }

    public static closeOnlineModal() {
        document.getElementById('online-modal')?.classList.add('hidden');
    }

    public static switchOnlineTab(tab: 'create' | 'join' | 'matchmaking' | 'social') {
        const btnCreate = document.getElementById('tab-btn-create-room');
        const btnJoin = document.getElementById('tab-btn-join-room');
        const btnMatchmaking = document.getElementById('tab-btn-matchmaking');
        const btnSocial = document.getElementById('tab-btn-social');
        
        const tabCreate = document.getElementById('view-create-room');
        const tabJoin = document.getElementById('view-join-room');
        const tabMatchmaking = document.getElementById('view-matchmaking');
        const tabSocial = document.getElementById('view-social');

        btnCreate?.classList.toggle('active', tab === 'create');
        btnJoin?.classList.toggle('active', tab === 'join');
        btnMatchmaking?.classList.toggle('active', tab === 'matchmaking');
        btnSocial?.classList.toggle('active', tab === 'social');
        
        tabCreate?.classList.toggle('hidden', tab !== 'create');
        tabJoin?.classList.toggle('hidden', tab !== 'join');
        tabMatchmaking?.classList.toggle('hidden', tab !== 'matchmaking');
        tabSocial?.classList.toggle('hidden', tab !== 'social');

        // En las pestañas de Join (Guest), Matchmaking y Social NO debe existir navegación de wizard (Next/Prev)
        const btnPrev = document.getElementById('btn-online-wizard-prev');
        const btnNext = document.getElementById('btn-online-wizard-next');
        const btnForceStart = document.getElementById('btn-online-force-start');

        if (tab !== 'create') {
            btnPrev?.classList.add('hidden');
            btnNext?.classList.add('hidden');
            btnForceStart?.classList.add('hidden');
        } else {
            // Restaurar visibilidad según el paso del host actual
            if (btnPrev) btnPrev.classList.toggle('hidden', this.currentOnlineWizardStep === 1);
            if (btnNext) btnNext.classList.toggle('hidden', this.currentOnlineWizardStep === 6);
        }

        applyTranslationsToDOM();
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

        const isCoopRogue = OnlineController.onlineGameType === 'coop_rogue';
        const colorPickerRow = document.getElementById('online-host-color-section');
        if (colorPickerRow) {
            colorPickerRow.classList.toggle('hidden', playerCount === 4 || isCoopRogue);
        }

        const komiSection = document.getElementById('online-komi-section');
        if (komiSection) {
            komiSection.classList.toggle('hidden', isCoopRogue);
        }

        document.getElementById('online-color-black')?.classList.toggle('active', hostColor === 1);
        document.getElementById('online-color-white')?.classList.toggle('active', hostColor === 2);

        const allShapes = ['square', 'volcano', 'sky', 'oni', 'triangle', 'hex', 'eroded', 'islands_v1', 'islands_v2', 'islands', 'cross', 'hourglass', 'geode', 'spiral', 'rings', 'star_5', 'star_6'];

        allShapes.forEach(sh => {
            document.getElementById(`online-shape-${sh}`)?.classList.toggle('active', shape === sh);
        });

        // Toggle Volcano Info Icon Display (Online)
        const volcanoInfoOnline = document.getElementById('setup-volcano-info-online');
        if (volcanoInfoOnline) {
            volcanoInfoOnline.style.display = shape === 'volcano' ? 'flex' : 'none';
        }

        // Toggle Sky Info Icon Display (Online)
        const skyInfoOnline = document.getElementById('setup-sky-info-online');
        if (skyInfoOnline) {
            skyInfoOnline.style.display = shape === 'sky' ? 'flex' : 'none';
        }

        // Toggle Oni Info Icon Display (Online)
        const oniInfoOnline = document.getElementById('setup-oni-info-online');
        if (oniInfoOnline) {
            oniInfoOnline.style.display = shape === 'oni' ? 'flex' : 'none';
        }

        // Render Prominent Hazard Banner under Online Board Preview
        const hazardBannerOnline = document.getElementById('setup-board-hazard-banner-online');
        if (hazardBannerOnline) {
            const isEn = getLanguage() === 'en';
            if (shape === 'volcano') {
                hazardBannerOnline.classList.remove('hidden');
                hazardBannerOnline.innerHTML = `<span>🌋 <strong>${isEn ? 'Volcano:' : 'Volcán:'}</strong> ${isEn ? 'Every 10 turns per player (20 total), a meteor destroys 1 intersection.' : 'Cada 10 turnos por jugador (20 totales), un meteorito destruye 1 casilla.'}</span>`;
            } else if (shape === 'sky') {
                hazardBannerOnline.classList.remove('hidden');
                hazardBannerOnline.innerHTML = `<span>☁️ <strong>${isEn ? 'Sky Board:' : 'Cielo:'}</strong> ${isEn ? 'Every 10 turns per player (20 total), 5 square blocks (2x2) fall from the sky expanding the goban.' : 'Cada 10 turnos por jugador (20 totales), 5 nuevos bloques (2x2) caen del cielo expandiendo el goban.'}</span>`;
            } else if (shape === 'oni') {
                hazardBannerOnline.classList.remove('hidden');
                hazardBannerOnline.innerHTML = `<span>👹 <strong>${isEn ? 'Oni Mask:' : 'Máscara Oni:'}</strong> ${isEn ? '🌪️ <strong>Inhalation</strong> (every 14 turns: vortex pulls 1-3 stone groups from all sides towards the mouth and devours them; 4+ stones resist) & 🩸 <strong>Soul Feast</strong> (capturing 2+ stones grants +1 extra turn).' : '🌪️ <strong>Inhalación</strong> (cada 14 turnos: atrae grupos de 1 a 3 piedras hacia la boca y las devora; 4+ piedras resisten) y 🩸 <strong>Festín de Almas</strong> (capturar 2+ piedras otorga +1 turno extra).'}</span>`;
            } else {
                hazardBannerOnline.classList.add('hidden');
                hazardBannerOnline.innerHTML = '';
            }
        }

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
        const shapeLabels: Record<string, string> = { square: 'Cuadrado', triangle: 'Triangular', hex: 'Hexagonal', eroded: 'Erosionado', islands: 'Islas / Abismos', cross: 'Cruz / Diamante', oni: 'Máscara Oni' };
        const shapeName = shapeLabels[shape] || shape;
        const effectiveSize = shape === 'oni' ? 25 : size;
        
        const board = new GraphBoard();
        BoardGenerators.generate(board, shape, size);
        if (previewTitle) previewTitle.innerText = `${effectiveSize}x${effectiveSize} ${shapeName}`;
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

        // Renderizar Tablero Flotante en Escenario (Paso 4 Online)
        const stageSvg = document.getElementById('online-stage-board-svg');
        if (stageSvg) {
            const stageState = new GameState(komi, playerCount);
            const stageRenderer = new SVGRenderer(
                'online-stage-board-svg',
                board,
                stageState,
                () => {},
                () => {}
            );
            stageRenderer.isInteractive = false;
            stageRenderer.render();
        }

        // Actualizar standee del jugador anfitrión en el escenario online
        const stagePlayerImg = document.getElementById('online-stage-player-img') as HTMLImageElement | null;
        if (stagePlayerImg) {
            const h = hostHero ? RoguelikeRunManager.HEROES[hostHero] : null;
            stagePlayerImg.src = h ? (h.image || h.faceImage || './heroes/normal.png') : './heroes/normal.png';
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

        const p3Row = document.getElementById('online-ai-granular-p3-row');
        const p4Row = document.getElementById('online-ai-granular-p4-row');
        if (p3Row) p3Row.style.display = playerCount === 2 ? 'none' : 'flex';
        if (p4Row) p4Row.style.display = playerCount === 2 ? 'none' : 'flex';

        const granularToggleBtn = document.getElementById('btn-toggle-online-ai-granular');
        if (granularToggleBtn) {
            granularToggleBtn.style.display = playerCount === 2 ? 'none' : 'inline-flex';
        }

        if (playerCount === 2) {
            document.getElementById('online-ai-pack-mode-box')?.classList.remove('hidden');
            document.getElementById('online-ai-granular-mode-box')?.classList.add('hidden');
            if (granularToggleBtn) {
                granularToggleBtn.setAttribute('data-enabled', 'false');
                granularToggleBtn.classList.remove('active');
            }
            const label = document.getElementById('label-toggle-online-ai-granular');
            if (label) label.innerText = 'Pack Mode 📦';
        }
    }

    public static updateOnlineGuestHeroUI(guestHero: HeroId | null = null) {
        SetupModalRenderer.renderHeroShowcaseElements('online-guest', guestHero);
    }

    public static renderOnlineLobbySlots(
        containerId: string, 
        slots: { id: PlayerId; name: string; isHost: boolean; connected: boolean; heroId?: HeroId | null, type?: string }[], 
        myColor?: PlayerId
    ) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        const isHostContainer = containerId === 'online-lobby-slots-grid';

        slots.forEach(slot => {
            const card = document.createElement('div');
            const isMe = slot.id === myColor;
            card.className = `online-slot-card ${slot.connected ? 'connected' : 'waiting'} ${isMe ? 'is-you' : ''}`;

            const hero = slot.heroId ? RoguelikeRunManager.HEROES[slot.heroId] : null;
            const heroTag = hero ? `${hero.icon} ${hero.name}` : (slot.connected ? '⚪ Reglas Clásicas' : '⏳ Esperando...');
            
            let slotTypeSelect = '';
            if (isHostContainer && !slot.isHost && OnlineController.onlineGameType !== 'coop_rogue') {
                const currentType = slot.type || 'human_remote';
                slotTypeSelect = `
                    <select class="slot-type-select" data-slot-id="${slot.id}" style="margin-top: 0.5rem; background: rgba(0,0,0,0.3); border: 1px solid #4b5563; color: white; border-radius: 4px; padding: 2px;">
                        <option value="human_remote" ${currentType === 'human_remote' ? 'selected' : ''}>🌐 Esperar Jugador Online</option>
                        <option value="human_local" ${currentType === 'human_local' ? 'selected' : ''}>👤 Jugador Local</option>
                        <option value="ai" ${currentType === 'ai' ? 'selected' : ''}>🤖 IA (Bot)</option>
                    </select>
                `;
            }

            card.innerHTML = `
                <div class="slot-icon-stone slot-stone-${slot.id}"></div>
                <div class="slot-info">
                    <strong class="slot-name">${slot.name}</strong>
                    <small class="slot-hero-tag">${heroTag}</small>
                    ${slotTypeSelect}
                </div>
                <div class="slot-status-col">
                    <span class="slot-badge">${slot.connected ? (slot.isHost ? '👑 Anfitrión' : '✅ Listo') : '⏳ Esperando...'}</span>
                </div>
            `;
            container.appendChild(card);
        });

        // Add event listeners to the new selects
        if (isHostContainer) {
            container.querySelectorAll('.slot-type-select').forEach(select => {
                select.addEventListener('change', (e) => {
                    const target = e.target as HTMLSelectElement;
                    const slotId = parseInt(target.getAttribute('data-slot-id') || '0', 10) as PlayerId;
                    const newType = target.value as 'human_local' | 'human_remote' | 'ai';
                    
                    if (!NetworkManager.currentConfig) return;
                    if (!NetworkManager.currentConfig.slots) NetworkManager.currentConfig.slots = {};
                    
                    NetworkManager.currentConfig.slots[slotId] = {
                        slotId: slotId,
                        teamId: slotId <= 2 ? 1 : 2,
                        type: newType,
                        aiDifficulty: newType === 'ai' ? 'normal' : undefined
                    };
                    
                    NetworkManager.broadcastLobbyUpdate();
                });
            });
        }
    }

    public static updateOnlineLobbyStatus(
        text: string, 
        slots?: { id: PlayerId; name: string; isHost: boolean; connected: boolean; heroId?: HeroId | null, type?: string }[], 
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
                if (connectedCount >= 2 && connectedCount === slots.length) {
                    footerStartBtn.classList.remove('hidden');
                    footerStartBtn.innerHTML = `<span>⚔️ ¡Comenzar Partida! (${connectedCount}/${slots.length} Listos)</span>`;
                } else {
                    footerStartBtn.classList.add('hidden');
                }
            }
        }
    }

}
