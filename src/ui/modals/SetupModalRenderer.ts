
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
        const modeText = config.gameMode === '1via' 
            ? (config.playerCount === 4 ? (isEn ? '1 Human vs 3 AIs' : '1 Humano vs 3 IAs') : (isEn ? 'Human vs AI' : 'Humano vs IA')) 
            : (isEn ? 'Local Mode (Pass & Play)' : 'Modo Local (Pasa y Juega)');
        
        if (titleEl) {
            titleEl.innerText = `${playersText} • ${modeText}`;
        }

        const shapeLabels: Record<string, string> = {
            square: isEn ? 'Square' : 'Cuadrado',
            triangle: isEn ? 'Triangular' : 'Triangular',
            hex: isEn ? 'Hexagonal' : 'Hexagonal',
            eroded: isEn ? 'Eroded' : 'Erosionado',
            islands: isEn ? 'Islands / Chasms' : 'Islas / Abismos',
            cross: isEn ? 'Cross / Diamond' : 'Cruz / Diamante',
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
        const diffText = config.gameMode === '1via' ? ` • ${isEn ? 'Difficulty' : 'Dificultad'} ${diffLabels[config.difficulty] || (isEn ? 'Medium' : 'Medio')}` : '';

        const special = config.specialStones;
        let specialSummary = isEn ? 'Pure Canonical Go' : 'Go Clásico Puro';
        if (special && special.enabled) {
            specialSummary = `${isEn ? 'Specials' : 'Especiales'}: ${special.playerSprouting}🌿 ${special.playerDomino}🀄 ${special.playerMonolith}🧱`;
            if (config.gameMode === '1via') {
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
        if (previewTitle) previewTitle.innerText = `${config.size}x${config.size} ${shapeName}`;
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

        const allShapes = ['square', 'triangle', 'hex', 'eroded', 'islands_v1', 'islands_v2', 'islands', 'cross', 'hourglass', 'geode', 'spiral', 'rings', 'star_5', 'star_6', 'procedural'];
        allShapes.forEach(sh => {
            document.getElementById(`setup-shape-${sh}`)?.classList.toggle('active', config.shape === sh);
        });

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
        const shapeLabels: Record<string, string> = { square: 'Cuadrado', triangle: 'Triangular', hex: 'Hexagonal', eroded: 'Erosionado', islands: 'Islas / Abismos', cross: 'Cruz / Diamante', procedural: 'Procedural Infinito' };
        if (stageBoardInfo) stageBoardInfo.innerText = `${config.size}x${config.size} ${shapeLabels[config.shape] || config.shape} • ${board.nodes.size} Pts`;

        // Mismo info para el paso 6
        const rivalBoardInfo = document.getElementById('wizard-rival-board-info');
        if (rivalBoardInfo) rivalBoardInfo.innerText = `${config.size}x${config.size} ${shapeLabels[config.shape] || config.shape} • ${board.nodes.size} Pts`;

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
