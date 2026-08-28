
import type { 
    GameSetupConfig, 
    HeroId
} from '../../types';
import { RoguelikeRunManager } from '../../core/RoguelikeRunManager';
import { t, getLanguage, translateEnemyName, applyTranslationsToDOM } from '../../i18n/i18n';
import { BoardGenerators } from '../../graphics/BoardGenerators';
import { SVGRenderer } from '../../graphics/SVGRenderer';
import { GameState } from '../../core/GameState';
import { GraphBoard } from '../../core/GraphBoard';

export class SetupModalRenderer {
    // ==================== 1. MODAL DE CONFIGURACIÓN (MODO LIBRE - WIZARD 7 PASOS) ====================
    public static currentWizardStep: number = 1;
    public static current4PSlot: number = 2;

    /** Monje/Sabio resuelto en la sesión actual de configuración (para preview consistente) */
    private static resolvedMonkIndex: number = Math.floor(Math.random() * 5);
    private static resolvedSageIndex: number = Math.floor(Math.random() * 5);

    private static readonly MONKS = [
        { name: 'Joven Ren',    image: './enemies/monk_1.png' },
        { name: 'Joven Hiro',   image: './enemies/monk_2.png' },
        { name: 'Joven Sora',   image: './enemies/monk_3.png' },
        { name: 'Joven Daiki',  image: './enemies/monk_4.png' },
        { name: 'Joven Kazuki', image: './enemies/monk_5.png' },
    ];

    private static readonly SAGES = [
        { name: 'Kenshin el Sabio',    image: './enemies/sage_1.png' },
        { name: 'Nobunaga el Sabio',   image: './enemies/sage_2.png' },
        { name: 'Masashi el Sabio',    image: './enemies/sage_3.png' },
        { name: 'Tetsuo el Sabio',     image: './enemies/sage_4.png' },
        { name: 'Genzaburo el Sabio',  image: './enemies/sage_5.png' },
    ];

    /** Reasigna aleatoriamente el monje/sabio (llamar al abrir el modal) */
    public static rerollSessionRivals() {
        this.resolvedMonkIndex = Math.floor(Math.random() * 5);
        this.resolvedSageIndex = Math.floor(Math.random() * 5);
    }

    public static openNewGameModal() {
        this.currentWizardStep = 1;
        this.rerollSessionRivals(); // nuevo monje/sabio en cada apertura del wizard
        applyTranslationsToDOM();
        this.setWizardStep(1);
        document.getElementById('new-game-modal')?.classList.remove('hidden');
    }

    public static closeNewGameModal() {
        document.getElementById('new-game-modal')?.classList.add('hidden');
    }
    public static setWizardStep(step: number, config?: GameSetupConfig) {
        this.currentWizardStep = Math.max(1, Math.min(7, step));

        // Actualizar visibilidad de paneles de pasos
        for (let i = 1; i <= 7; i++) {
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
        if (counter) counter.innerText = t('wizard.step', { current: this.currentWizardStep, total: 7 });

        // Actualizar botones del footer
        const btnPrev = document.getElementById('btn-wizard-prev');
        const btnNext = document.getElementById('btn-wizard-next');
        const btnStart = document.getElementById('btn-setup-start');

        if (btnPrev) {
            btnPrev.innerText = this.currentWizardStep === 1 ? t('wizard.btn_cancel') : t('wizard.btn_back');
        }

        if (btnNext) {
            btnNext.innerHTML = `<span>${t('wizard.btn_next')}</span>`;
            btnNext.classList.toggle('hidden', this.currentWizardStep === 7);
        }

        if (btnStart) {
            btnStart.innerHTML = `<span>${t('wizard.btn_start')}</span>`;
            btnStart.classList.toggle('hidden', this.currentWizardStep !== 7);
        }

        if (config) {
            this.updateWizardSummary(config);
        }
    }


    public static updateWizardSummary(config: GameSetupConfig) {
        const titleEl = document.getElementById('wizard-summary-title');
        const descEl = document.getElementById('wizard-summary-desc');
        const imgEl = document.getElementById('wizard-summary-hero-img') as HTMLImageElement | null;

        const isEn = getLanguage() === 'en';
        const playersText = config.playerCount === 4 
            ? (isEn ? '4 Players (4P FFA Go)' : '4 Jugadores (FFA Cuádruple)') 
            : (isEn ? '2 Players (1v1 Duel)' : '2 Jugadores (Duelo 1v1)');
            
        let modeText = '';
        if (config.gameMode === 'aivsai') {
            modeText = isEn ? 'AI vs AI' : 'IA vs IA';
        } else if (config.gameMode === '1via') {
            modeText = (config.playerCount === 4 ? (isEn ? '1 Human vs 3 AIs' : '1 Humano vs 3 IAs') : (isEn ? 'Human vs AI' : 'Humano vs IA'));
        } else {
            modeText = (isEn ? 'Local Mode (Pass & Play)' : 'Modo Local (Pasa y Juega)');
        }
        
        if (titleEl) {
            titleEl.innerText = `${playersText} • ${modeText}`;
        }

        const shapeLabels: Record<string, string> = {
            square: isEn ? 'Square' : 'Cuadrado',
            volcano: isEn ? 'Volcano' : 'Volcánico',
            sky: isEn ? 'Sky' : 'Cielo',
            oni: isEn ? 'Oni Mask' : 'Máscara Oni',
            triangle: isEn ? 'Triangular' : 'Triangular',
            hex: isEn ? 'Hexagonal' : 'Hexagonal',
            eroded: isEn ? 'Eroded' : 'Erosionado',
            islands: isEn ? 'Islands / Chasms' : 'Islas / Abismos',
            islands_v1: isEn ? 'Islands v1' : 'Islas v1',
            islands_v2: isEn ? 'Islands v2' : 'Islas v2',
            cross: isEn ? 'Cross / Diamond' : 'Cruz / Diamante',
            hourglass: isEn ? 'Hourglass' : 'Reloj de Arena',
            geode: isEn ? 'Geode' : 'Geoda',
            spiral: isEn ? 'Spiral' : 'Espiral',
            rings: isEn ? 'Rings' : 'Anillos',
            star_5: isEn ? 'Star (5P)' : 'Estrella (5P)',
            star_6: isEn ? 'Star of David' : 'Estrella de David',
            procedural: isEn ? 'Infinite Procedural' : 'Procedural Infinito'
        };
        const shapeName = shapeLabels[config.shape] || config.shape;

        const hero = config.heroId ? RoguelikeRunManager.HEROES[config.heroId] : RoguelikeRunManager.HEROES['normal'];
        const heroName = hero ? hero.name : (isEn ? 'Normal Person' : 'Hombre Normal');

        const diffLabels: Record<string, string> = {
            easy: isEn ? 'Easy (25k)' : 'Fácil (25k)',
            medium: isEn ? 'Medium (16k)' : 'Medio (16k)',
            hard: isEn ? 'Hard (4k)' : 'Difícil (4k)',
            dan: isEn ? 'Supreme (2 Dan)' : 'Extremo (2 Dan)'
        };
        const diffText = (config.gameMode === '1via' || config.gameMode === 'aivsai') ? ` • ${isEn ? 'Difficulty' : 'Dificultad'} ${diffLabels[config.difficulty] || (isEn ? 'Medium' : 'Medio')}` : '';

        const special = config.specialStones;
        let specialSummary = isEn ? 'Pure Canonical Go' : 'Go Clásico Puro';
        if (special && special.enabled) {
            specialSummary = `${isEn ? 'Specials' : 'Especiales'}: ${special.playerSprouting}🌿 ${special.playerDomino}🀄 ${special.playerMonolith}🧱`;
            if (config.gameMode === '1via' || config.gameMode === 'aivsai') {
                specialSummary += special.aiEnabled ? ` (AI: ${special.aiSprouting}🌿 ${special.aiDomino}🀄 ${special.aiMonolith}🧱)` : ' (AI: ❌)';
            }
        }

        let komiSummary = `Komi ${config.komi} pts`;
        if (config.playerCount === 4) {
            const pk = config.playerKomis || { 2: 2.5, 3: 4.5, 4: 6.5 };
            komiSummary = `Komi: ⚪${pk[2] ?? 2.5} • 🟢${pk[3] ?? 4.5} • 🟣${pk[4] ?? 6.5}`;
        }

        let timerSummary = isEn ? 'No Time Limit' : 'Sin Límite';
        if (config.timer && config.timer.mode !== 'none') {
            if (config.timer.mode === 'per_move') {
                timerSummary = `⏱️ ${config.timer.byoYomiSeconds}s Byo-yomi`;
            } else if (config.timer.mode === 'japanese') {
                timerSummary = `⏱️ ${Math.round(config.timer.mainTimeSeconds / 60)}m + ${config.timer.byoYomiPeriods || 3}×${config.timer.byoYomiSeconds}s`;
            } else if (config.timer.mode === 'fischer') {
                timerSummary = `⏱️ ${Math.round(config.timer.mainTimeSeconds / 60)}m + ${config.timer.incrementSeconds}s`;
            } else if (config.timer.mode === 'absolute') {
                timerSummary = `⏱️ ${Math.round(config.timer.mainTimeSeconds / 60)}m ${isEn ? 'Bank' : 'Absoluto'}`;
            }
        }

        if (descEl) {
            descEl.innerText = `${isEn ? 'Board' : 'Tablero'} ${config.size}x${config.size} ${shapeName} • ${heroName}${diffText} • ${specialSummary} • ${komiSummary} • ${timerSummary}`;
        }

        if (imgEl) {
            imgEl.src = hero ? (hero.faceImage || hero.image) : '/heroes/normal_face.jpg';
            imgEl.alt = heroName;
        }

        // Setup Board Name/Size in Preview Panel
        const previewTitle = document.getElementById('wizard-board-preview-title');
        const previewDesc = document.getElementById('wizard-board-preview-desc');
        const effectiveSize = config.shape === 'oni' ? 25 : config.size;
        if (previewTitle) previewTitle.innerText = `${effectiveSize}x${effectiveSize} ${shapeName}`;
        if (previewDesc) previewDesc.innerText = `... Intersections`;

        // Duel Stage Character Images & Names
        const stagePlayerImg = document.getElementById('wizard-stage-player-img') as HTMLImageElement | null;
        const stagePlayerName = document.getElementById('wizard-stage-player-name');
        if (stagePlayerImg) stagePlayerImg.src = hero ? (hero.image || hero.faceImage || './heroes/normal.png') : './heroes/normal.png';
        if (stagePlayerName) stagePlayerName.innerText = heroName;

        const enemyHeroId = config.enemyHeroId || 'random';
        const rivalBox = document.getElementById('wizard-stage-rival-box');
        const stageRivalImg = document.getElementById('wizard-stage-rival-img') as HTMLImageElement | null;
        const stageRivalName = document.getElementById('wizard-stage-rival-name');
        const stageRivalMystery = document.getElementById('wizard-stage-rival-mystery');
        const rivalBadge = document.getElementById('setup-rival-display-badge');

        if (enemyHeroId === 'random') {
            if (stageRivalImg) stageRivalImg.classList.add('hidden');
            if (stageRivalMystery) stageRivalMystery.classList.remove('hidden');
            if (rivalBox) {
                rivalBox.classList.add('duel-mystery-box');
                rivalBox.classList.remove('duel-champion-standee');
            }
            if (stageRivalName) stageRivalName.innerText = t('wizard.unknown_rival');
            if (rivalBadge) rivalBadge.innerText = t('wizard.rival_badge_random');
        } else if (enemyHeroId === 'random_monk') {
            const monk = this.MONKS[this.resolvedMonkIndex];
            if (stageRivalImg) { stageRivalImg.src = monk.image; stageRivalImg.classList.remove('hidden'); }
            if (stageRivalMystery) stageRivalMystery.classList.add('hidden');
            if (rivalBox) { rivalBox.classList.remove('duel-mystery-box'); rivalBox.classList.add('duel-champion-standee'); }
            if (stageRivalName) stageRivalName.innerText = `🧘 ${translateEnemyName(monk.name)}`;
            if (rivalBadge) rivalBadge.innerText = t('wizard.rival_badge_random_monk');
        } else if (enemyHeroId === 'random_sage') {
            const sage = this.SAGES[this.resolvedSageIndex];
            if (stageRivalImg) { stageRivalImg.src = sage.image; stageRivalImg.classList.remove('hidden'); }
            if (stageRivalMystery) stageRivalMystery.classList.add('hidden');
            if (rivalBox) { rivalBox.classList.remove('duel-mystery-box'); rivalBox.classList.add('duel-champion-standee'); }
            if (stageRivalName) stageRivalName.innerText = `🧙 ${translateEnemyName(sage.name)}`;
            if (rivalBadge) rivalBadge.innerText = t('wizard.rival_badge_random_sage');
        } else {
            const rivalHero = enemyHeroId !== 'boss' ? RoguelikeRunManager.HEROES[enemyHeroId as HeroId] : null;
            if (rivalHero) {
                if (stageRivalImg) {
                    stageRivalImg.src = rivalHero.image || rivalHero.faceImage || './heroes/normal.png';
                    stageRivalImg.classList.remove('hidden');
                }
                if (stageRivalMystery) stageRivalMystery.classList.add('hidden');
                if (rivalBox) {
                    rivalBox.classList.remove('duel-mystery-box');
                    rivalBox.classList.add('duel-champion-standee');
                }
                if (stageRivalName) stageRivalName.innerText = rivalHero.name;
                if (rivalBadge) rivalBadge.innerText = t('wizard.rival_badge_chosen', { name: rivalHero.name });
            }
        }
        
        const stageBoardInfo = document.getElementById('wizard-stage-board-info');
        if (stageBoardInfo) stageBoardInfo.innerText = `${config.size}x${config.size} ${shapeName}`;
    }

    public static updateSetupModalUI(config: GameSetupConfig) {
        const btnP2 = document.getElementById('setup-players-2');
        const btnP4 = document.getElementById('setup-players-4');
        const btn1v1 = document.getElementById('setup-mode-1v1');
        const btn1via = document.getElementById('setup-mode-1via');
        const btnAivsai = document.getElementById('setup-mode-aivsai');
        const aiBox = document.getElementById('setup-ai-options');
        const labelLocal = document.getElementById('label-mode-local');
        const labelAI = document.getElementById('label-mode-ai');

        btnP2?.classList.toggle('active', config.playerCount === 2);
        btnP4?.classList.toggle('active', config.playerCount === 4);

        if (labelLocal) labelLocal.innerText = config.playerCount === 4 ? "4 Jugadores Local" : "1 vs 1 Local";
        if (labelAI) labelAI.innerText = config.playerCount === 4 ? "1 Humano vs 3 IAs" : "Humano vs IA";

        btn1v1?.classList.toggle('active', config.gameMode === '1v1');
        btn1via?.classList.toggle('active', config.gameMode === '1via');
        btnAivsai?.classList.toggle('active', config.gameMode === 'aivsai');
        aiBox?.classList.toggle('hidden', config.gameMode !== '1via' && config.gameMode !== 'aivsai');

        document.getElementById('setup-color-black')?.classList.toggle('active', config.humanColor === 1);
        document.getElementById('setup-color-white')?.classList.toggle('active', config.humanColor === 2);

        // Update Slider Values
        const parseKyuDanToNumber = (diff: string): number => {
            if (!diff) return 16;
            if (diff === 'easy') return 6;
            if (diff === 'medium') return 15;
            if (diff === 'hard') return 27;
            if (diff === 'dan') return 32;
            if (diff.endsWith('k')) return 31 - parseInt(diff);
            if (diff.endsWith('d')) return 30 + parseInt(diff);
            return 16;
        };
        const parseDifficultyString = (diff: string): string => {
            if (!diff) return '15k';
            if (diff === 'easy') return '25k';
            if (diff === 'medium') return '15k';
            if (diff === 'hard') return '4k';
            if (diff === 'dan') return '2d';
            return diff;
        };

        const masterVal = parseKyuDanToNumber(config.difficulty);
        const masterStr = parseDifficultyString(config.difficulty);
        
        const mSlider = document.getElementById('ai-master-slider') as HTMLInputElement;
        const mDisplay = document.getElementById('ai-master-display');
        if (mSlider) mSlider.value = masterVal.toString();
        if (mDisplay) mDisplay.innerText = masterStr;

        // Individual Bot Sliders
        const slots = config.slots || ({} as Record<import('../../core/GraphBoard').PlayerId, import('../../types').PlayerSlot>);
        [2, 3, 4].forEach(p => {
            const playerId = p as import('../../core/GraphBoard').PlayerId;
            const pDiff = slots[playerId]?.aiDifficulty || config.difficulty;
            const pVal = parseKyuDanToNumber(pDiff);
            const pStr = parseDifficultyString(pDiff);
            
            const slider = document.getElementById(`ai-granular-p${p}-slider`) as HTMLInputElement;
            const display = document.getElementById(`ai-granular-p${p}-display`);
            
            if (slider) slider.value = pVal.toString();
            if (display) display.innerText = pStr;
        });

        // Hide P3/P4 rows if 2P mode
        const p3Row = document.getElementById('ai-granular-p3-row');
        const p4Row = document.getElementById('ai-granular-p4-row');
        if (p3Row) p3Row.style.display = config.playerCount === 2 ? 'none' : 'flex';
        if (p4Row) p4Row.style.display = config.playerCount === 2 ? 'none' : 'flex';

        this.renderHeroShowcaseElements('setup', config.heroId || null);

        const allShapes = ['square', 'volcano', 'sky', 'oni', 'triangle', 'hex', 'eroded', 'islands_v1', 'islands_v2', 'islands', 'cross', 'hourglass', 'geode', 'spiral', 'rings', 'star_5', 'star_6', 'procedural'];
        allShapes.forEach(sh => {
            document.getElementById(`setup-shape-${sh}`)?.classList.toggle('active', config.shape === sh);
        });

        // Toggle Volcano Info Icon Display
        const volcanoInfo = document.getElementById('setup-volcano-info');
        if (volcanoInfo) {
            volcanoInfo.style.display = config.shape === 'volcano' ? 'flex' : 'none';
        }

        // Toggle Sky Info Icon Display
        const skyInfo = document.getElementById('setup-sky-info');
        if (skyInfo) {
            skyInfo.style.display = config.shape === 'sky' ? 'flex' : 'none';
        }

        // Toggle Oni Info Icon Display
        const oniInfo = document.getElementById('setup-oni-info');
        if (oniInfo) {
            oniInfo.style.display = config.shape === 'oni' ? 'flex' : 'none';
        }

        // Render Prominent Hazard Banner under Board Preview
        const hazardBanner = document.getElementById('setup-board-hazard-banner');
        if (hazardBanner) {
            const isEn = getLanguage() === 'en';
            if (config.shape === 'volcano') {
                hazardBanner.classList.remove('hidden');
                hazardBanner.innerHTML = `<span>🌋 <strong>${isEn ? 'Volcano:' : 'Volcán:'}</strong> ${isEn ? 'Every 10 turns per player (20 total), a meteor destroys 1 intersection.' : 'Cada 10 turnos por jugador (20 totales), un meteorito destruye 1 casilla.'}</span>`;
            } else if (config.shape === 'sky') {
                hazardBanner.classList.remove('hidden');
                hazardBanner.innerHTML = `<span>☁️ <strong>${isEn ? 'Sky Board:' : 'Cielo:'}</strong> ${isEn ? 'Every 10 turns per player (20 total), 5 square blocks (2x2) fall from the sky expanding the goban.' : 'Cada 10 turnos por jugador (20 totales), 5 nuevos bloques (2x2) caen del cielo expandiendo el goban.'}</span>`;
            } else if (config.shape === 'oni') {
                hazardBanner.classList.remove('hidden');
                hazardBanner.innerHTML = `<span>👹 <strong>${isEn ? 'Oni Mask:' : 'Máscara Oni:'}</strong> ${isEn ? '🌪️ <strong>Inhalation</strong> (every 14 turns: vortex pulls 1-3 stone groups from all sides towards the mouth and devours them; 4+ stones resist) & 🩸 <strong>Soul Feast</strong> (capturing 2+ stones grants +1 extra turn).' : '🌪️ <strong>Inhalación</strong> (cada 14 turnos: atrae grupos de 1 a 3 piedras hacia la boca y las devora; 4+ piedras resisten) y 🩸 <strong>Festín de Almas</strong> (capturar 2+ piedras otorga +1 turno extra).'}</span>`;
            } else {
                hazardBanner.classList.add('hidden');
                hazardBanner.innerHTML = '';
            }
        }

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
            aiSpecialBox.style.display = (config.gameMode === '1via' || config.gameMode === 'aivsai') ? 'block' : 'none';
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

        // Komi Controls (2P vs 4P)
        const is4P = config.playerCount === 4;
        const box2P = document.getElementById('setup-komi-2p-box');
        const box4P = document.getElementById('setup-komi-4p-box');
        if (box2P) box2P.classList.toggle('hidden', is4P);
        if (box4P) box4P.classList.toggle('hidden', !is4P);

        if (is4P) {
            if (!config.playerKomis) {
                config.playerKomis = { 2: 2.5, 3: 4.5, 4: 6.5 };
            }
            const p2K = config.playerKomis[2] ?? 2.5;
            const p3K = config.playerKomis[3] ?? 4.5;
            const p4K = config.playerKomis[4] ?? 6.5;

            const dP2 = document.getElementById('setup-komi-p2-display');
            const inP2 = document.getElementById('setup-komi-p2-input') as HTMLInputElement | null;
            if (dP2) dP2.innerText = `${p2K} pts`;
            if (inP2) inP2.value = p2K.toString();
            document.querySelectorAll('.btn-setup-komi-p2').forEach(btn => {
                const v = parseFloat(btn.getAttribute('data-komi') || '2.5');
                btn.classList.toggle('active', v === p2K);
            });

            const dP3 = document.getElementById('setup-komi-p3-display');
            const inP3 = document.getElementById('setup-komi-p3-input') as HTMLInputElement | null;
            if (dP3) dP3.innerText = `${p3K} pts`;
            if (inP3) inP3.value = p3K.toString();
            document.querySelectorAll('.btn-setup-komi-p3').forEach(btn => {
                const v = parseFloat(btn.getAttribute('data-komi') || '4.5');
                btn.classList.toggle('active', v === p3K);
            });

            const dP4 = document.getElementById('setup-komi-p4-display');
            const inP4 = document.getElementById('setup-komi-p4-input') as HTMLInputElement | null;
            if (dP4) dP4.innerText = `${p4K} pts`;
            if (inP4) inP4.value = p4K.toString();
            document.querySelectorAll('.btn-setup-komi-p4').forEach(btn => {
                const v = parseFloat(btn.getAttribute('data-komi') || '6.5');
                btn.classList.toggle('active', v === p4K);
            });
        } else {
            const komiDisplay = document.getElementById('setup-komi-display');
            if (komiDisplay) komiDisplay.innerText = `${config.komi} pts`;

            const komiInput = document.getElementById('setup-komi-input') as HTMLInputElement | null;
            if (komiInput) komiInput.value = config.komi.toString();

            document.querySelectorAll('.btn-setup-komi').forEach(btn => {
                const val = parseFloat(btn.getAttribute('data-komi') || '6.5');
                btn.classList.toggle('active', val === config.komi);
            });
        }

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
            document.getElementById('timer-options-japanese')?.classList.toggle('hidden', timer.mode !== 'japanese');
            document.getElementById('timer-options-fischer')?.classList.toggle('hidden', timer.mode !== 'fischer');
            document.getElementById('timer-options-absolute')?.classList.toggle('hidden', timer.mode !== 'absolute');

            // 1. Por jugada
            const boxPerMove = document.getElementById('timer-options-per-move');
            if (boxPerMove) {
                boxPerMove.querySelectorAll('.btn-timer-val').forEach(b => {
                    const v = parseInt(b.getAttribute('data-val') || '0', 10);
                    b.classList.toggle('active', v === timer.byoYomiSeconds);
                });
                const inp = document.getElementById('setup-timer-byoyomi-input') as HTMLInputElement | null;
                if (inp) inp.value = (timer.byoYomiSeconds || 30).toString();
            }

            // 2. Japonés
            const boxJapanese = document.getElementById('timer-options-japanese');
            if (boxJapanese) {
                boxJapanese.querySelectorAll('.btn-timer-val').forEach(b => {
                    const mainSecs = parseInt(b.getAttribute('data-val') || '0', 10);
                    const byoSecs = parseInt(b.getAttribute('data-byo') || '0', 10);
                    const periods = parseInt(b.getAttribute('data-periods') || '3', 10);
                    b.classList.toggle('active', mainSecs === timer.mainTimeSeconds && byoSecs === timer.byoYomiSeconds && periods === (timer.byoYomiPeriods || 3));
                });
                const inpMain = document.getElementById('setup-timer-japanese-main-input') as HTMLInputElement | null;
                const inpPeriods = document.getElementById('setup-timer-japanese-periods-input') as HTMLInputElement | null;
                const inpByo = document.getElementById('setup-timer-japanese-byo-input') as HTMLInputElement | null;
                if (inpMain) inpMain.value = Math.max(1, Math.round((timer.mainTimeSeconds || 300) / 60)).toString();
                if (inpPeriods) inpPeriods.value = (timer.byoYomiPeriods || 3).toString();
                if (inpByo) inpByo.value = (timer.byoYomiSeconds || 30).toString();
            }

            // 3. Fischer
            const boxFischer = document.getElementById('timer-options-fischer');
            if (boxFischer) {
                boxFischer.querySelectorAll('.btn-timer-val').forEach(b => {
                    const mainSecs = parseInt(b.getAttribute('data-val') || '0', 10);
                    const incSecs = parseInt(b.getAttribute('data-inc') || '0', 10);
                    b.classList.toggle('active', mainSecs === timer.mainTimeSeconds && incSecs === timer.incrementSeconds);
                });
                const inpMain = document.getElementById('setup-timer-fischer-main-input') as HTMLInputElement | null;
                const inpInc = document.getElementById('setup-timer-fischer-inc-input') as HTMLInputElement | null;
                if (inpMain) inpMain.value = Math.max(1, Math.round((timer.mainTimeSeconds || 180) / 60)).toString();
                if (inpInc) inpInc.value = (timer.incrementSeconds || 5).toString();
            }

            // 4. Absoluto
            const boxAbsolute = document.getElementById('timer-options-absolute');
            if (boxAbsolute) {
                boxAbsolute.querySelectorAll('.btn-timer-val').forEach(b => {
                    const v = parseInt(b.getAttribute('data-val') || '0', 10);
                    b.classList.toggle('active', v === timer.mainTimeSeconds);
                });
                const inp = document.getElementById('setup-timer-absolute-input') as HTMLInputElement | null;
                if (inp) inp.value = Math.max(1, Math.round((timer.mainTimeSeconds || 300) / 60)).toString();
            }
        }

        this.updateWizardSummary(config);
        this.renderSetupPreviews(config);
    }

    private static renderSetupPreviews(config: GameSetupConfig) {
        // Generar un estado de juego inerte solo para el preview
        const board = new GraphBoard();
        BoardGenerators.generate(board, config.shape, config.size, config.seed);
        const state = new GameState(config.komi, config.playerCount);

        // Actualizar número de intersecciones en el label del preview 3
        const previewDesc = document.getElementById('wizard-board-preview-desc');
        if (previewDesc) previewDesc.innerText = `${board.nodes.size} Intersecciones`;
        const stageBoardInfo = document.getElementById('wizard-stage-board-info');
        const shapeLabels: Record<string, string> = { square: 'Cuadrado', triangle: 'Triangular', hex: 'Hexagonal', eroded: 'Erosionado', islands: 'Islas / Abismos', cross: 'Cruz / Diamante', oni: 'Máscara Oni', procedural: 'Procedural Infinito' };
        const effectiveSize = config.shape === 'oni' ? 25 : config.size;
        if (stageBoardInfo) stageBoardInfo.innerText = `${effectiveSize}x${effectiveSize} ${shapeLabels[config.shape] || config.shape} • ${board.nodes.size} Pts`;

        // Mismo info para el paso 6
        const rivalBoardInfo = document.getElementById('wizard-rival-board-info');
        if (rivalBoardInfo) rivalBoardInfo.innerText = `${effectiveSize}x${effectiveSize} ${shapeLabels[config.shape] || config.shape} • ${board.nodes.size} Pts`;

        // Renderizar Previsualización Paso 3 — SIN escenario: fondo blanco con cuadrícula gris sutil
        const previewViewport1 = document.getElementById('wizard-board-preview-viewport');
        if (previewViewport1) {
            previewViewport1.style.backgroundImage = '';  // Sin imagen de fondo
            previewViewport1.classList.add('wizard-board-no-scenery');
        }

        const svg1 = document.getElementById('wizard-board-preview-svg');
        if (svg1) {
            const renderer1 = new SVGRenderer('wizard-board-preview-svg', board, state, () => {}, () => {});
            renderer1.isInteractive = false;
            renderer1.render();
        }

        // Renderizar Previsualización Paso 5 (Combate con escenario)
        const stageViewport = document.getElementById('wizard-scenery-stage-viewport');
        if (stageViewport) stageViewport.style.backgroundImage = `url('./bg_${config.background || 'combat'}.jpg')`;

        const svg2 = document.getElementById('wizard-stage-board-svg');
        if (svg2) {
            const renderer2 = new SVGRenderer('wizard-stage-board-svg', board, state, () => {}, () => {});
            renderer2.isInteractive = false;
            renderer2.render();
        }

        // Renderizar Previsualización Paso 6 (Oponente — mismo escenario y tablero)
        const rivalStageViewport = document.getElementById('wizard-rival-stage-viewport');
        if (rivalStageViewport) rivalStageViewport.style.backgroundImage = `url('./bg_${config.background || 'combat'}.jpg')`;

        const svg3 = document.getElementById('wizard-rival-board-svg');
        if (svg3) {
            const renderer3 = new SVGRenderer('wizard-rival-board-svg', board, state, () => {}, () => {});
            renderer3.isInteractive = false;
            renderer3.render();
        }

        // Sincronizar personaje del jugador en los stages de paso 5 y 6
        const hero = config.heroId ? RoguelikeRunManager.HEROES[config.heroId] : RoguelikeRunManager.HEROES['normal'];
        const rivalPlayerImg = document.getElementById('wizard-rival-player-img') as HTMLImageElement | null;
        const rivalPlayerName = document.getElementById('wizard-rival-player-name');
        if (rivalPlayerImg && hero) rivalPlayerImg.src = hero.image || hero.faceImage || './heroes/normal.png';
        if (rivalPlayerName && hero) rivalPlayerName.innerText = hero.name;

        // Sincronizar rival en el stage del paso 6
        this.updateRivalStage6(config);
    }

    /** Actualiza el rival mostrado en el stage del paso 6 */
    public static updateRivalStage6(config: GameSetupConfig) {
        const is4P = config.playerCount === 4;
        
        // Show/hide 4P specific UI
        const slotContainer = document.getElementById('setup-rival-slots-container');
        if (slotContainer) {
            slotContainer.classList.toggle('hidden', !is4P);
            slotContainer.querySelectorAll('.btn-rival-slot').forEach(btn => {
                const slot = parseInt(btn.getAttribute('data-slot') || '2', 10);
                btn.classList.toggle('active', slot === this.current4PSlot);
            });
        }

        const rivalImg = document.getElementById('wizard-rival-img') as HTMLImageElement | null;
        const rivalMultiBox = document.getElementById('wizard-rival-multi-box');
        const rivalMystery = document.getElementById('wizard-rival-mystery');
        const rivalBox = document.getElementById('wizard-rival-box');
        const rivalName = document.getElementById('wizard-rival-name');
        const rivalBadge = document.getElementById('wizard-rival-badge');

        if (rivalBadge) {
            rivalBadge.innerText = is4P ? t('wizard.rival_badge_4p') : t('wizard.rival_badge_1p');
        }

        // Determinar qué héroe estamos previsualizando para los badges
        let previewHeroId: string = 'random';

        if (is4P) {
            if (rivalImg) rivalImg.classList.add('hidden');
            if (rivalMystery) rivalMystery.classList.add('hidden');
            if (rivalBox) { 
                rivalBox.classList.remove('duel-mystery-box'); 
                rivalBox.classList.add('duel-champion-standee'); 
            }
            if (rivalMultiBox) rivalMultiBox.classList.remove('hidden');

            const enemyIds = config.enemyHeroIds || {};
            previewHeroId = enemyIds[this.current4PSlot] || 'normal';

            [2, 3, 4].forEach(slot => {
                const imgEl = document.getElementById(`wizard-rival-img-${slot}`) as HTMLImageElement | null;
                if (imgEl) {
                    const hId = enemyIds[slot] || 'normal';
                    imgEl.src = this.getHeroImageForPreview(hId as any);
                    imgEl.classList.toggle('stage-slot-active', slot === this.current4PSlot);
                }
            });

            if (rivalName) rivalName.innerText = t('wizard.rival_squad');
            
        } else {
            // 1v1 Mode
            if (rivalMultiBox) rivalMultiBox.classList.add('hidden');
            previewHeroId = config.enemyHeroId || 'random';

            if (previewHeroId === 'random') {
                if (rivalImg) rivalImg.classList.add('hidden');
                if (rivalMystery) rivalMystery.classList.remove('hidden');
                if (rivalBox) { rivalBox.classList.add('duel-mystery-box'); rivalBox.classList.remove('duel-champion-standee'); }
                if (rivalName) rivalName.innerText = t('wizard.unknown_rival');
            } else {
                if (rivalImg) {
                    rivalImg.src = this.getHeroImageForPreview(previewHeroId as any);
                    rivalImg.classList.remove('hidden');
                }
                if (rivalMystery) rivalMystery.classList.add('hidden');
                if (rivalBox) { rivalBox.classList.remove('duel-mystery-box'); rivalBox.classList.add('duel-champion-standee'); }
                
                if (previewHeroId === 'random_monk') {
                    if (rivalName) rivalName.innerText = `🧘 ${translateEnemyName(this.MONKS[this.resolvedMonkIndex].name)}`;
                } else if (previewHeroId === 'random_sage') {
                    if (rivalName) rivalName.innerText = `🧙 ${translateEnemyName(this.SAGES[this.resolvedSageIndex].name)}`;
                } else {
                    const rh = RoguelikeRunManager.HEROES[previewHeroId as HeroId];
                    if (rivalName && rh) rivalName.innerText = rh.name;
                }
            }
        }



        // Actualizar badge de la selección (grilla de rivales del paso 6)
        const badge = document.getElementById('setup-rival-display-badge');
        if (badge) {
            if (previewHeroId === 'random') {
                badge.innerText = t('wizard.rival_badge_random');
            } else if (previewHeroId === 'random_monk') {
                badge.innerText = t('wizard.rival_badge_random_monk');
            } else if (previewHeroId === 'random_sage') {
                badge.innerText = t('wizard.rival_badge_random_sage');
            } else if (previewHeroId === 'normal') {
                badge.innerText = `👤 ${t('champion.normal.name')}`;
            } else {
                const heroName = RoguelikeRunManager.HEROES[previewHeroId as HeroId]?.name || previewHeroId;
                badge.innerText = t('wizard.rival_badge_chosen', { name: heroName });
            }
        }

        // Actualizar botones activos en la grilla de rivales
        document.querySelectorAll('.btn-setup-rival').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-rival') === previewHeroId);
        });
    }

    private static getHeroImageForPreview(hId: HeroId | 'random' | 'random_monk' | 'random_sage'): string {
        if (hId === 'random' || !hId) return './heroes/normal.png';
        if (hId === 'random_monk') return this.MONKS[this.resolvedMonkIndex].image;
        if (hId === 'random_sage') return this.SAGES[this.resolvedSageIndex].image;
        const rh = RoguelikeRunManager.HEROES[hId as HeroId];
        return rh ? (rh.image || rh.faceImage || './heroes/normal.png') : './heroes/normal.png';
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

}
