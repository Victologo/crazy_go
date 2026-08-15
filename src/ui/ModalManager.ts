// ui/ModalManager.ts - Fachada Central de Ventanas Modales (Modo Libre, Online P2P, Opciones, Puntuación y Roguelike)
import type { 
    GameSetupConfig, 
    HeroId, 
    RogueliteDifficulty, 
    ScoreReport, 
    PlayerId,
    BoardShape,
    BoardSize
} from '../types';
import { SoundFX } from '../audio/SoundFX';
import { RoguelikeRunManager } from '../core/RoguelikeRunManager';
import { ScoreModalRenderer } from './modals/ScoreModalRenderer';
import { RogueModalRenderer } from './modals/RogueModalRenderer';
import { NetworkManager } from '../network/NetworkManager';
import { DevModeManager } from '../core/DevModeManager';
import { getLanguage, t } from '../i18n/i18n';

export class ModalManager {
    public static closeAllModals() {
        document.querySelectorAll('.modal-backdrop').forEach(el => {
            el.classList.add('hidden');
        });
    }

    // ==================== 1. MODAL DE CONFIGURACIÓN (MODO LIBRE - WIZARD 5 PASOS) ====================
    public static currentWizardStep: number = 1;

    public static openNewGameModal() {
        this.currentWizardStep = 1;
        this.setWizardStep(1);
        document.getElementById('new-game-modal')?.classList.remove('hidden');
    }

    public static closeNewGameModal() {
        document.getElementById('new-game-modal')?.classList.add('hidden');
    }

    public static setWizardStep(step: number, config?: GameSetupConfig) {
        this.currentWizardStep = Math.max(1, Math.min(5, step));

        // Actualizar visibilidad de paneles de pasos
        for (let i = 1; i <= 5; i++) {
            const panel = document.getElementById(`wizard-step-${i}`);
            panel?.classList.toggle('hidden', i !== this.currentWizardStep);
            panel?.classList.toggle('active', i === this.currentWizardStep);
        }

        // Actualizar nodos del stepper
        document.querySelectorAll('#wizard-stepper .wizard-step-node').forEach(node => {
            const nodeStep = parseInt(node.getAttribute('data-step') || '1', 10);
            node.classList.toggle('active', nodeStep === this.currentWizardStep);
            node.classList.toggle('completed', nodeStep < this.currentWizardStep);
        });

        // Actualizar pill contador
        const counter = document.getElementById('wizard-step-counter');
        if (counter) counter.innerText = `Paso ${this.currentWizardStep} de 5`;

        // Actualizar botones del footer
        const btnPrev = document.getElementById('btn-wizard-prev');
        const btnNext = document.getElementById('btn-wizard-next');
        const btnStart = document.getElementById('btn-setup-start');

        if (btnPrev) {
            btnPrev.innerText = this.currentWizardStep === 1 ? 'Cancelar' : '◀ Atrás';
        }

        if (btnNext) {
            btnNext.classList.toggle('hidden', this.currentWizardStep === 5);
        }

        if (btnStart) {
            btnStart.classList.toggle('hidden', this.currentWizardStep !== 5);
        }

        if (config) {
            this.updateWizardSummary(config);
        }
    }

    public static updateWizardSummary(config: GameSetupConfig) {
        const titleEl = document.getElementById('wizard-summary-title');
        const descEl = document.getElementById('wizard-summary-desc');
        const imgEl = document.getElementById('wizard-summary-hero-img') as HTMLImageElement | null;

        const playersText = config.playerCount === 4 ? '4 Jugadores (FFA Cuádruple)' : '2 Jugadores (Duelo 1v1)';
        const modeText = config.gameMode === '1via' ? (config.playerCount === 4 ? '1 Humano vs 3 IAs' : 'Humano vs IA') : 'Modo Local (Pasa y Juega)';
        
        if (titleEl) {
            titleEl.innerText = `${playersText} • ${modeText}`;
        }

        const shapeLabels: Record<string, string> = {
            square: 'Cuadrado',
            triangle: 'Triangular',
            hex: 'Hexagonal',
            eroded: 'Erosionado',
            islands: 'Islas / Abismos',
            cross: 'Cruz / Diamante',
            procedural: 'Procedural Infinito'
        };
        const shapeName = shapeLabels[config.shape] || config.shape;

        const hero = config.heroId ? RoguelikeRunManager.HEROES[config.heroId] : RoguelikeRunManager.HEROES['normal'];
        const heroName = hero ? hero.name : 'Hombre Normal';

        const diffLabels: Record<string, string> = {
            easy: 'Fácil (25k)',
            medium: 'Medio (16k)',
            hard: 'Difícil (4k)',
            dan: 'Extremo (2 Dan)'
        };
        const diffText = config.gameMode === '1via' ? ` • Dificultad ${diffLabels[config.difficulty] || 'Medio'}` : '';

        const special = config.specialStones;
        let specialSummary = 'Go Clásico Puro';
        if (special && special.enabled) {
            specialSummary = `Especiales: ${special.playerSprouting}🌿 ${special.playerDomino}🀄 ${special.playerMonolith}🧱`;
            if (config.gameMode === '1via') {
                specialSummary += special.aiEnabled ? ` (IA: ${special.aiSprouting}🌿 ${special.aiDomino}🀄 ${special.aiMonolith}🧱)` : ' (IA: ❌)';
            }
        }

        if (descEl) {
            descEl.innerText = `Tablero ${config.size}x${config.size} ${shapeName} • ${heroName}${diffText} • ${specialSummary} • Komi ${config.komi} pts`;
        }

        if (imgEl) {
            imgEl.src = hero ? (hero.faceImage || hero.image) : '/heroes/normal_face.jpg';
            imgEl.alt = heroName;
        }
    }

    public static updateSetupModalUI(config: GameSetupConfig) {
        const btnP2 = document.getElementById('setup-players-2');
        const btnP4 = document.getElementById('setup-players-4');
        const btn1v1 = document.getElementById('setup-mode-1v1');
        const btn1via = document.getElementById('setup-mode-1via');
        const aiBox = document.getElementById('setup-ai-options');
        const labelLocal = document.getElementById('label-mode-local');
        const labelAI = document.getElementById('label-mode-ai');

        btnP2?.classList.toggle('active', config.playerCount === 2);
        btnP4?.classList.toggle('active', config.playerCount === 4);

        if (labelLocal) labelLocal.innerText = config.playerCount === 4 ? "4 Jugadores Local" : "1 vs 1 Local";
        if (labelAI) labelAI.innerText = config.playerCount === 4 ? "1 Humano vs 3 IAs" : "Humano vs IA";

        btn1v1?.classList.toggle('active', config.gameMode === '1v1');
        btn1via?.classList.toggle('active', config.gameMode === '1via');
        aiBox?.classList.toggle('hidden', config.gameMode !== '1via');

        document.getElementById('setup-color-black')?.classList.toggle('active', config.humanColor === 1);
        document.getElementById('setup-color-white')?.classList.toggle('active', config.humanColor === 2);

        document.getElementById('setup-diff-easy')?.classList.toggle('active', config.difficulty === 'easy');
        document.getElementById('setup-diff-medium')?.classList.toggle('active', config.difficulty === 'medium');
        document.getElementById('setup-diff-hard')?.classList.toggle('active', config.difficulty === 'hard');
        document.getElementById('setup-diff-dan')?.classList.toggle('active', config.difficulty === 'dan');

        this.renderHeroShowcaseElements('setup', config.heroId || null);

        document.getElementById('setup-shape-square')?.classList.toggle('active', config.shape === 'square');
        document.getElementById('setup-shape-triangle')?.classList.toggle('active', config.shape === 'triangle');
        document.getElementById('setup-shape-hex')?.classList.toggle('active', config.shape === 'hex');
        document.getElementById('setup-shape-eroded')?.classList.toggle('active', config.shape === 'eroded');
        document.getElementById('setup-shape-islands')?.classList.toggle('active', config.shape === 'islands');
        document.getElementById('setup-shape-cross')?.classList.toggle('active', config.shape === 'cross');
        document.getElementById('setup-shape-procedural')?.classList.toggle('active', config.shape === 'procedural');

        document.getElementById('setup-size-9')?.classList.toggle('active', config.size === 9);
        document.getElementById('setup-size-13')?.classList.toggle('active', config.size === 13);
        document.getElementById('setup-size-19')?.classList.toggle('active', config.size === 19);

        // Fondos / Escenarios
        const curBg = config.background || 'combat';
        document.querySelectorAll('.btn-setup-bg').forEach(btn => {
            const bgVal = btn.getAttribute('data-bg');
            btn.classList.toggle('active', bgVal === curBg);
        });

        // Configuración de Piedras Especiales / Poliminós
        const special = config.specialStones || {
            enabled: false,
            playerSprouting: 2,
            playerDomino: 2,
            playerMonolith: 1,
            aiEnabled: false,
            aiSprouting: 2,
            aiDomino: 2,
            aiMonolith: 1
        };

        const btnToggleSpecial = document.getElementById('btn-toggle-special-stones');
        const labelToggleSpecial = document.getElementById('label-toggle-special');
        const specialControls = document.getElementById('special-stones-controls');

        if (btnToggleSpecial) {
            btnToggleSpecial.setAttribute('data-enabled', special.enabled ? 'true' : 'false');
            btnToggleSpecial.classList.toggle('active', special.enabled);
        }
        if (labelToggleSpecial) {
            labelToggleSpecial.innerText = special.enabled ? 'Habilitado ✨' : 'Desactivado ❌';
        }
        specialControls?.classList.toggle('hidden', !special.enabled);

        const setVal = (id: string, val: number) => {
            const el = document.getElementById(id);
            if (el) el.innerText = `${val}`;
        };
        setVal('display-poly-player-sprouting', special.playerSprouting);
        setVal('display-poly-player-domino', special.playerDomino);
        setVal('display-poly-player-monolith', special.playerMonolith);

        // Control IA de especiales
        const aiSpecialBox = document.getElementById('special-stones-ai-box');
        if (aiSpecialBox) {
            aiSpecialBox.style.display = config.gameMode === '1via' ? 'block' : 'none';
        }

        const btnToggleAISpecial = document.getElementById('btn-toggle-ai-special');
        const labelToggleAISpecial = document.getElementById('label-toggle-ai-special');
        const aiPolyCounters = document.getElementById('ai-poly-counters');

        if (btnToggleAISpecial) {
            btnToggleAISpecial.setAttribute('data-enabled', special.aiEnabled ? 'true' : 'false');
            btnToggleAISpecial.classList.toggle('active', special.aiEnabled);
        }
        if (labelToggleAISpecial) {
            labelToggleAISpecial.innerText = special.aiEnabled ? 'IA: Habilitado ✨' : 'IA: Desactivado ❌';
        }
        aiPolyCounters?.classList.toggle('hidden', !special.aiEnabled);

        setVal('display-poly-ai-sprouting', special.aiSprouting);
        setVal('display-poly-ai-domino', special.aiDomino);
        setVal('display-poly-ai-monolith', special.aiMonolith);

        const komiDisplay = document.getElementById('setup-komi-display');
        if (komiDisplay) komiDisplay.innerText = `${config.komi} pts`;

        const komiInput = document.getElementById('setup-komi-input') as HTMLInputElement | null;
        if (komiInput) komiInput.value = config.komi.toString();

        document.querySelectorAll('.btn-setup-komi').forEach(btn => {
            const val = parseFloat(btn.getAttribute('data-komi') || '6.5');
            btn.classList.toggle('active', val === config.komi);
        });

        // Controles de Reloj / Temporizador
        const timer = config.timer || { mode: 'none', byoYomiSeconds: 30, mainTimeSeconds: 300, incrementSeconds: 5 };
        const timerEnabled = timer.mode !== 'none';

        const btnToggleTimer = document.getElementById('btn-toggle-timer');
        const labelToggleTimer = document.getElementById('label-toggle-timer');
        const timerControls = document.getElementById('timer-controls');

        if (btnToggleTimer) {
            btnToggleTimer.setAttribute('data-enabled', timerEnabled ? 'true' : 'false');
            btnToggleTimer.classList.toggle('active', timerEnabled);
        }
        if (labelToggleTimer) {
            labelToggleTimer.innerText = timerEnabled ? 'Activo ⏱️' : 'Sin Límite ❌';
        }
        timerControls?.classList.toggle('hidden', !timerEnabled);

        if (timerEnabled) {
            document.querySelectorAll('.btn-timer-mode').forEach(btn => {
                const m = btn.getAttribute('data-mode');
                btn.classList.toggle('active', m === timer.mode);
            });

            document.getElementById('timer-options-per-move')?.classList.toggle('hidden', timer.mode !== 'per_move');
            document.getElementById('timer-options-absolute')?.classList.toggle('hidden', timer.mode !== 'absolute');
            document.getElementById('timer-options-fischer')?.classList.toggle('hidden', timer.mode !== 'fischer');

            const activeSubBox = timer.mode === 'per_move'
                ? document.getElementById('timer-options-per-move')
                : timer.mode === 'absolute'
                ? document.getElementById('timer-options-absolute')
                : document.getElementById('timer-options-fischer');

            if (activeSubBox) {
                activeSubBox.querySelectorAll('.btn-timer-val').forEach(b => {
                    const v = parseInt(b.getAttribute('data-val') || '0', 10);
                    if (timer.mode === 'per_move') {
                        b.classList.toggle('active', v === timer.byoYomiSeconds);
                    } else if (timer.mode === 'absolute') {
                        b.classList.toggle('active', v === timer.mainTimeSeconds);
                    } else if (timer.mode === 'fischer') {
                        b.classList.toggle('active', v === timer.mainTimeSeconds);
                    }
                });
            }
        }

        this.updateWizardSummary(config);
    }

    public static renderHeroShowcaseElements(prefix: string, heroId: HeroId | null) {
        const imgEl = document.getElementById(`${prefix}-hero-showcase-img`) as HTMLImageElement | null;
        const nameEl = document.getElementById(`${prefix}-hero-showcase-name`);
        const subtitleEl = document.getElementById(`${prefix}-hero-showcase-subtitle`);
        const quoteEl = document.getElementById(`${prefix}-hero-showcase-quote`);
        const activeBox = document.querySelector(`.${prefix}-hero-active-box`) as HTMLElement | null;
        const passiveBox = document.querySelector(`.${prefix}-hero-passive-box`) as HTMLElement | null;
        const activeTag = document.getElementById(`${prefix}-hero-active-tag`);
        const activeName = document.getElementById(`${prefix}-hero-active-name`);
        const activeDesc = document.getElementById(`${prefix}-hero-active-desc`);
        const passiveTag = document.getElementById(`${prefix}-hero-passive-tag`);
        const passiveName = document.getElementById(`${prefix}-hero-passive-name`);
        const passiveDesc = document.getElementById(`${prefix}-hero-passive-desc`);

        const effectiveHeroId: HeroId = (!heroId || (heroId as any) === 'none') ? 'normal' : heroId;
        const hero = RoguelikeRunManager.HEROES[effectiveHeroId];
        if (hero) {
            if (imgEl) {
                imgEl.src = hero.faceImage || hero.image;
                imgEl.alt = hero.name;
            }
            if (nameEl) nameEl.innerText = hero.name;
            if (subtitleEl) subtitleEl.style.display = 'none';
            if (quoteEl) quoteEl.style.display = 'none';

            if (hero.skillType === 'active') {
                if (activeBox) {
                    activeBox.style.display = 'flex';
                    const tagKey = `champion.${effectiveHeroId}.active_tag`;
                    if (activeTag) activeTag.innerText = t(tagKey) || '💥 HABILIDAD ACTIVA';
                    if (activeName) {
                        activeName.innerText = hero.activeName || t(`champion.${effectiveHeroId}.active_name`);
                    }
                    if (activeDesc) activeDesc.innerText = hero.activeDesc || t(`champion.${effectiveHeroId}.active_desc`);
                }
                if (passiveBox) passiveBox.style.display = 'none';
            } else if (hero.skillType === 'passive') {
                if (activeBox) activeBox.style.display = 'none';
                if (passiveBox) {
                    passiveBox.style.display = 'flex';
                    const tagKey = `champion.${effectiveHeroId}.passive_tag`;
                    if (passiveTag) passiveTag.innerText = t(tagKey) || '✨ HABILIDAD PASIVA';
                    if (passiveName) passiveName.innerText = hero.passiveName || t(`champion.${effectiveHeroId}.passive_name`);
                    if (passiveDesc) passiveDesc.innerText = hero.passiveDesc || t(`champion.${effectiveHeroId}.passive_desc`);
                }
            } else {
                // Hombre Normal (Sin Habilidades / Go Clásico Puro)
                if (activeBox) activeBox.style.display = 'none';
                if (passiveBox) {
                    passiveBox.style.display = 'flex';
                    if (passiveTag) passiveTag.innerText = t('champion.normal.passive_tag') || '📜 REGLAS PURAS';
                    if (passiveName) passiveName.innerText = hero.passiveName || t('champion.normal.passive_name');
                    if (passiveDesc) passiveDesc.innerText = hero.passiveDesc || t('champion.normal.passive_desc');
                }
            }
        }

        document.querySelectorAll(`#${prefix}-hero-thumb-strip .hero-thumb-btn`).forEach(btn => {
            const h = btn.getAttribute('data-hero');
            const isSelected = (effectiveHeroId === h);
            btn.classList.toggle('active', isSelected);
        });
    }

    // ==================== 2. MODAL ONLINE P2P (WEBRTC 2P & 4P) ====================
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
        hostHero: HeroId | null = null
    ) {
        document.getElementById('online-players-2')?.classList.toggle('active', playerCount === 2);
        document.getElementById('online-players-4')?.classList.toggle('active', playerCount === 4);

        const colorPickerRow = document.getElementById('online-host-color-section');
        if (colorPickerRow) {
            colorPickerRow.classList.toggle('hidden', playerCount === 4);
        }

        document.getElementById('online-color-black')?.classList.toggle('active', hostColor === 1);
        document.getElementById('online-color-white')?.classList.toggle('active', hostColor === 2);

        document.getElementById('online-shape-square')?.classList.toggle('active', shape === 'square');
        document.getElementById('online-shape-triangle')?.classList.toggle('active', shape === 'triangle');
        document.getElementById('online-shape-hex')?.classList.toggle('active', shape === 'hex');
        document.getElementById('online-shape-eroded')?.classList.toggle('active', shape === 'eroded');
        document.getElementById('online-shape-islands')?.classList.toggle('active', shape === 'islands');
        document.getElementById('online-shape-cross')?.classList.toggle('active', shape === 'cross');
        document.getElementById('online-shape-procedural')?.classList.toggle('active', shape === 'procedural');

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

        this.renderHeroShowcaseElements('online-host', hostHero);
    }

    public static updateOnlineGuestHeroUI(guestHero: HeroId | null = null) {
        this.renderHeroShowcaseElements('online-guest', guestHero);
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
            const footerStartBtn = document.getElementById('btn-online-modal-start');
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

    // ==================== 3. MODAL DE OPCIONES / AUDIO ====================
    public static openOptionsModal() {
        document.getElementById('options-modal')?.classList.remove('hidden');
        this.updateOptionsModalUI();
    }

    public static closeOptionsModal() {
        document.getElementById('options-modal')?.classList.add('hidden');
    }

    public static updateOptionsModalUI() {
        const lang = getLanguage();
        const btnLangEs = document.getElementById('opt-lang-es');
        const btnLangEn = document.getElementById('opt-lang-en');
        if (btnLangEs) btnLangEs.classList.toggle('active', lang === 'es');
        if (btnLangEn) btnLangEn.classList.toggle('active', lang === 'en');

        const volSlider = document.getElementById('opt-vol-slider') as HTMLInputElement | null;
        const volText = document.getElementById('opt-vol-text');
        const sfxBtn = document.getElementById('opt-sfx-toggle');
        const bgmBtn = document.getElementById('opt-bgm-toggle');

        const volPct = Math.round(SoundFX.getMasterVolume() * 100);
        if (volSlider) volSlider.value = volPct.toString();
        if (volText) volText.innerText = `${volPct}%`;

        const isSFX = SoundFX.isSFXEnabled();
        if (sfxBtn) {
            sfxBtn.innerText = isSFX ? t('options.enabled') : t('options.disabled');
            sfxBtn.classList.toggle('active', isSFX);
            sfxBtn.classList.toggle('inactive', !isSFX);
        }

        const isBGM = SoundFX.isBGMEnabled();
        if (bgmBtn) {
            bgmBtn.innerText = isBGM ? t('options.enabled') : t('options.disabled');
            bgmBtn.classList.toggle('active', isBGM);
            bgmBtn.classList.toggle('inactive', !isBGM);
        }

        const devBtn = document.getElementById('opt-dev-toggle');
        const isDev = DevModeManager.isDevMode();
        if (devBtn) {
            devBtn.innerText = isDev ? t('options.enabled') : t('options.disabled');
            devBtn.classList.toggle('active', isDev);
            devBtn.classList.toggle('inactive', !isDev);
        }
    }

    // ==================== 4. MODAL DE PUNTUACIÓN FINAL (DELEGADO) ====================
    public static showFinalScoreModal(
        report: ScoreReport, 
        playerCount: 2 | 4, 
        isRoguelike: boolean, 
        humanWon: boolean,
        humanColor: PlayerId,
        nodeTitle?: string,
        enemyName?: string,
        rankLabel?: string,
        heroId?: HeroId,
        rewardOptions?: { type: 'spell' | 'poly'; id: string; name: string; icon: string; desc: string }[],
        selectedRewardId?: string,
        onRewardSelect?: (id: string) => void
    ) {
        ScoreModalRenderer.showFinalScoreModal(
            report, 
            playerCount, 
            isRoguelike, 
            humanWon, 
            humanColor, 
            nodeTitle, 
            enemyName, 
            rankLabel, 
            heroId, 
            rewardOptions, 
            selectedRewardId, 
            onRewardSelect
        );
    }

    public static inspectBoard() {
        ScoreModalRenderer.inspectBoard();
    }

    public static restoreScoreModal() {
        ScoreModalRenderer.restoreScoreModal();
    }

    public static closeScoreModal() {
        ScoreModalRenderer.closeScoreModal();
    }

    // ==================== 5. MODALES DE LA EXPEDICIÓN ROGUELIKE (DELEGADOS) ====================
    public static openRoguelikeSetupModal() {
        document.getElementById('roguelike-setup-modal')?.classList.remove('hidden');
    }

    public static closeRoguelikeSetupModal() {
        document.getElementById('roguelike-setup-modal')?.classList.add('hidden');
    }

    public static openRogueChoiceModal() {
        RogueModalRenderer.openRogueChoiceModal();
    }

    public static closeRogueChoiceModal() {
        RogueModalRenderer.closeRogueChoiceModal();
    }

    public static updateRoguelikeSetupModalUI(tempDifficulty: RogueliteDifficulty, tempHero: HeroId) {
        RogueModalRenderer.updateRoguelikeSetupModalUI(tempDifficulty, tempHero);
    }

    public static showRewardModal(
        goldReward: number,
        options: { type?: string; id: string; name: string; icon: string; desc: string }[],
        selectedId: string,
        onItemSelected: (id: string) => void
    ) {
        RogueModalRenderer.showRewardModal(goldReward, options, selectedId, onItemSelected);
    }

    public static closeRewardModal() {
        RogueModalRenderer.closeRewardModal();
    }

    public static showEventModal(
        icon: string,
        title: string,
        desc: string,
        actions: { id: string; label: string; sub?: string; icon: string; disabled?: boolean; onClick: () => void }[]
    ) {
        RogueModalRenderer.showEventModal(icon, title, desc, actions);
    }

    public static closeEventModal() {
        RogueModalRenderer.closeEventModal();
    }

    public static openDeckModal() {
        RogueModalRenderer.openDeckModal();
    }

    public static closeDeckModal() {
        RogueModalRenderer.closeDeckModal();
    }

    // ==================== 6. MODAL LABORATORIO DE PRUEBAS (SANDBOX) ====================
    public static openSandboxModal() {
        document.getElementById('modal-sandbox')?.classList.remove('hidden');
    }

    public static closeSandboxModal() {
        document.getElementById('modal-sandbox')?.classList.add('hidden');
    }

    public static switchSandboxTab(tabId: string) {
        document.querySelectorAll('.sandbox-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });
        document.querySelectorAll('.sandbox-tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === tabId);
        });
    }
}
