import type { PlayerId, RuleStyle, GameMode, AIDifficulty, HeroId } from '../types';
import { GameState } from '../core/GameState';
import { TerritoryScorer } from '../core/TerritoryScorer';
import { ChampionManager } from '../core/ChampionManager';
import { RogueliteManager, type SpellId } from '../core/RogueliteManager';
import { RoguelikeRunManager } from '../core/RoguelikeRunManager';
import { PolyominoManager } from '../core/PolyominoManager';
import { TutorialManager } from '../tutorial/TutorialManager';
import { DevModeManager } from '../core/DevModeManager';
import { DuelistRenderer } from './DuelistRenderer';
import { GlobalSettings } from '../core/GlobalSettings';
import { t, getLanguage } from '../i18n/i18n';
import { BGMGenerator } from '../audio/BGMGenerator';

export class HUDController {
    private static alertTimeout: number | null = null;
    public static isZenMode: boolean = false;

    public static toggleZenMode() {
        this.isZenMode = !this.isZenMode;
        if (this.isZenMode) {
            document.body.classList.add('zen-mode');
            const isEn = getLanguage() === 'en';
            this.showAlert(isEn ? "🧘 Zen Mode Activated" : "🧘 Modo Zen Activado", 2000);
        } else {
            document.body.classList.remove('zen-mode');
            const isEn = getLanguage() === 'en';
            this.showAlert(isEn ? "👁️ Zen Mode Deactivated" : "👁️ Modo Zen Desactivado", 2000);
        }
        
        // Actualizar botón en Modal de Opciones si está abierto
        const zenBtn = document.getElementById('opt-zen-toggle');
        if (zenBtn) {
            zenBtn.classList.toggle('active', this.isZenMode);
            zenBtn.classList.toggle('inactive', !this.isZenMode);
            zenBtn.textContent = this.isZenMode ? (getLanguage() === 'en' ? 'Enabled' : 'Activado') : (getLanguage() === 'en' ? 'Disabled' : 'Desactivado');
        }
    }

    public static updateInGameUI(
        state: GameState,
        currentMode: GameMode,
        currentRuleStyle: RuleStyle,
        humanColor: PlayerId,
        localOnlineColor: PlayerId,
        difficulty: AIDifficulty,
        isLocalTurn: boolean
    ) {
        const turnSpan = document.getElementById('ui-turn');
        const playerIndicator = document.getElementById('ui-player-indicator');
        const playerName = document.getElementById('ui-player-name');
        const blackCaps = document.getElementById('ui-black-captures');
        const whiteCaps = document.getElementById('ui-white-captures');
        const greenCaps = document.getElementById('ui-green-captures');
        const purpleCaps = document.getElementById('ui-purple-captures');
        const capP3 = document.getElementById('cap-item-p3');
        const capP4 = document.getElementById('cap-item-p4');
        const onlineBadge = document.getElementById('ui-online-status');
        const onlineBadgeText = document.getElementById('ui-online-status-text');

        const topbar = document.getElementById('game-topbar');
        if (topbar) {
            topbar.classList.toggle('tutorial-active', TutorialManager.isActive);
        }

        const undoBtn = document.getElementById('btn-game-undo') as HTMLButtonElement | null;
        const redoBtn = document.getElementById('btn-game-redo') as HTMLButtonElement | null;
        const sandboxBtn = document.getElementById('btn-game-sandbox') as HTMLButtonElement | null;

        const isUndoAllowed = DevModeManager.isUndoRedoAllowed(currentMode);
        const isSandboxAllowed = DevModeManager.isSandboxAllowed(currentMode);

        if (undoBtn) {
            undoBtn.classList.toggle('hidden', !isUndoAllowed);
            undoBtn.disabled = !state.canUndo();
        }
        if (redoBtn) {
            redoBtn.classList.toggle('hidden', !isUndoAllowed);
            redoBtn.disabled = !state.canRedo();
        }
        if (sandboxBtn) {
            sandboxBtn.classList.toggle('hidden', !isSandboxAllowed);
        }

        if (turnSpan) turnSpan.innerText = state.getTurnLabel();

        // Píldora de modo online
        if (onlineBadge && onlineBadgeText) {
            if (currentMode === 'online') {
                onlineBadge.classList.remove('hidden');
                if (isLocalTurn) {
                    onlineBadge.style.borderColor = '#10b981';
                    onlineBadgeText.innerText = `🟢 ${t('hud.turn_human')}`;
                    onlineBadgeText.style.color = '#34d399';
                } else {
                    onlineBadge.style.borderColor = '#f59e0b';
                    onlineBadgeText.innerText = `⏳ ${t('hud.online_waiting')}`;
                    onlineBadgeText.style.color = '#fbbf24';
                }
            } else {
                onlineBadge.classList.add('hidden');
            }
        }

        // Indicador de turno y nombre
        if (playerIndicator && playerName) {
            if (state.isGameOver) {
                playerName.innerText = t('hud.game_over');
                playerIndicator.className = "stone-indicator";
            } else {
                const cp = state.currentPlayer;
                const meta = TerritoryScorer.PLAYER_META[cp];
                const turnClass = cp === 1 ? 'black-turn' : cp === 2 ? 'white-turn' : cp === 3 ? 'green-turn' : 'purple-turn';
                playerIndicator.className = `stone-indicator ${turnClass}`;

                let roleText = `(P${cp})`;
                if (currentMode === '1via') {
                    const diffLabel = this.getDifficultyLabel(difficulty);
                    roleText = cp === humanColor ? `(${t('hud.player_you')})` : `(IA • ${diffLabel})`;
                } else if (currentMode === 'online') {
                    roleText = cp === localOnlineColor ? `(${t('hud.player_you')})` : `(${t('hud.online_waiting')})`;
                }
                playerName.innerText = `${meta.name} ${roleText}`;
            }
        }

        // Contadores de capturas y Komi
        if (blackCaps) blackCaps.innerText = state.blackCaptures.toString();
        if (whiteCaps) {
            const p2Komi = state.playerKomis ? (state.playerKomis[2] ?? state.komi) : state.komi;
            const komiText = p2Komi > 0 ? ` <small id="ui-komi-sub">(+${p2Komi})</small>` : '';
            whiteCaps.innerHTML = `${state.whiteCaptures}${komiText}`;
        }
        if (greenCaps) {
            const p3Komi = state.playerKomis ? (state.playerKomis[3] ?? 0) : 0;
            const komiText = (state.playerCount === 4 && p3Komi > 0) ? ` <small>(+${p3Komi})</small>` : '';
            greenCaps.innerHTML = `${state.greenCaptures}${komiText}`;
        }
        if (purpleCaps) {
            const p4Komi = state.playerKomis ? (state.playerKomis[4] ?? 0) : 0;
            const komiText = (state.playerCount === 4 && p4Komi > 0) ? ` <small>(+${p4Komi})</small>` : '';
            purpleCaps.innerHTML = `${state.purpleCaptures}${komiText}`;
        }

        let scoringBanner = document.getElementById('ui-scoring-banner');
        if (state.isScoringPhase) {
            if (!scoringBanner) {
                scoringBanner = document.createElement('div');
                scoringBanner.id = 'ui-scoring-banner';
                scoringBanner.innerHTML = `
                    <div style="background: rgba(0,0,0,0.85); border: 2px solid #fbbf24; border-radius: 8px; padding: 12px; margin: 10px; display: flex; align-items: center; justify-content: space-between; gap: 16px; position: absolute; z-index: 1000; top: 60px; left: 50%; transform: translateX(-50%); width: max-content;">
                        <span style="color: #fbbf24; font-weight: bold;">⚖️ Fase de Disputa: Marca los grupos vivos/muertos</span>
                        <div>
                            <button id="btn-scoring-resume" class="btn btn-secondary btn-sm" style="margin-right: 8px; padding: 4px 12px; cursor: pointer;">Reanudar</button>
                            <button id="btn-scoring-accept" class="btn btn-primary btn-sm" style="padding: 4px 12px; cursor: pointer;">Aceptar</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(scoringBanner);
                
                document.getElementById('btn-scoring-resume')?.addEventListener('click', () => {
                    import('../controllers/GameController').then(gc => {
                        gc.GameController.handlePass(true); // Abort scoring and resume properly
                    });
                });

                document.getElementById('btn-scoring-accept')?.addEventListener('click', () => {
                    import('../controllers/GameController').then(gc => {
                        gc.GameController.state.isScoringPhase = false;
                        gc.GameController.state.isGameOver = true;
                        gc.GameController.updateInGameUI();
                    });
                });
            }
            scoringBanner.style.display = 'block';
        } else if (scoringBanner) {
            scoringBanner.style.display = 'none';
        }

        // Mostrar / ocultar 4P
        if (state.playerCount === 4) {
            capP3?.classList.remove('hidden');
            capP4?.classList.remove('hidden');
        } else {
            capP3?.classList.add('hidden');
            capP4?.classList.add('hidden');
        }

        this.updateChampionUI(currentRuleStyle, isLocalTurn, state.isGameOver);
        this.updatePolyominoUI(isLocalTurn, state.isGameOver, state.currentPlayer);
        this.updateSpellbarUI(currentRuleStyle, isLocalTurn, state.isGameOver);

        // Toggle Stage Hazard Warning Icons in HUD immediately and synchronously
        import('../controllers/GameController').then(gc => {
            const b = gc.GameController.board;
            if (b) {
                const volcanoWarning = document.getElementById('ui-volcano-warning');
                if (volcanoWarning) volcanoWarning.classList.toggle('hidden', b.shape !== 'volcano');

                const skyWarning = document.getElementById('ui-sky-warning');
                if (skyWarning) skyWarning.classList.toggle('hidden', b.shape !== 'sky');

                const oniWarning = document.getElementById('ui-oni-warning');
                if (oniWarning) oniWarning.classList.toggle('hidden', b.shape !== 'oni');
            }
        });

        // Win Rate Bar (Llamada al motor de análisis para N jugadores - Se desactiva en Modo Historia o por configuración de usuario)
        const isStoryMode = currentMode === 'story' || (typeof window !== 'undefined' && !!((window as any).StoryModeController?.isStoryActive || (window as any).__isStoryLoading));
        if (!isStoryMode && GlobalSettings.winrateBarEnabled) {
            import('../core/AnalysisEngine').then(m => {
                import('../controllers/GameController').then(gc => {
                    const b = gc.GameController.board;
                    if (b && state) {
                        const { playerWinRates } = m.AnalysisEngine.calculateWinRate(b, state);
                        this.updateWinRates(playerWinRates, state.playerCount);
                    }
                });
            });
        } else {
            const wrapper = document.getElementById('winrate-bar-wrapper');
            if (wrapper) wrapper.classList.add('hidden');
        }
    }

    public static updateWinRates(winRates: Record<PlayerId, number>, playerCount: number) {
        const wrapper = document.getElementById('winrate-bar-wrapper');
        if (!wrapper) return;

        const isStory = typeof window !== 'undefined' && !!((window as any).StoryModeController?.isStoryActive || (window as any).__isStoryLoading);

        if (playerCount < 2 || TutorialManager.isActive || isStory || !GlobalSettings.winrateBarEnabled) {
            wrapper.classList.add('hidden');
            return;
        } else {
            wrapper.classList.remove('hidden');
        }

        const seg1 = document.getElementById('winrate-segment-1');
        const seg2 = document.getElementById('winrate-segment-2');
        const seg3 = document.getElementById('winrate-segment-3');
        const seg4 = document.getElementById('winrate-segment-4');
        
        const lbl1 = document.getElementById('winrate-label-1');
        const lbl2 = document.getElementById('winrate-label-2');
        const lbl3 = document.getElementById('winrate-label-3');
        const lbl4 = document.getElementById('winrate-label-4');

        if (seg1 && lbl1) {
            const v = Math.round(winRates[1] || 0);
            seg1.style.width = `${v}%`;
            lbl1.style.width = `${v}%`;
            lbl1.innerText = `${v}%`;
            lbl1.style.display = v > 0 ? 'block' : 'none';
        }
        if (seg2 && lbl2) {
            const v = Math.round(winRates[2] || 0);
            seg2.style.width = `${v}%`;
            lbl2.style.width = `${v}%`;
            lbl2.innerText = `${v}%`;
            lbl2.style.display = v > 0 ? 'block' : 'none';
        }
        
        if (seg3 && lbl3) {
            const v = Math.round(winRates[3] || 0);
            seg3.style.width = playerCount >= 3 ? `${v}%` : '0%';
            seg3.style.display = playerCount >= 3 ? 'block' : 'none';
            lbl3.style.width = playerCount >= 3 ? `${v}%` : '0%';
            lbl3.innerText = `${v}%`;
            lbl3.style.display = (playerCount >= 3 && v > 0) ? 'block' : 'none';
        }
        if (seg4 && lbl4) {
            const v = Math.round(winRates[4] || 0);
            seg4.style.width = playerCount >= 4 ? `${v}%` : '0%';
            seg4.style.display = playerCount >= 4 ? 'block' : 'none';
            lbl4.style.width = playerCount >= 4 ? `${v}%` : '0%';
            lbl4.innerText = `${v}%`;
            lbl4.style.display = (playerCount >= 4 && v > 0) ? 'block' : 'none';
        }
    }

    public static updateWinRate(blackWinRate: number, whiteWinRate: number) {
        // Redirigir la llamada clásica de 2 jugadores al nuevo sistema unificado
        this.updateWinRates({ 1: blackWinRate, 2: whiteWinRate } as Record<PlayerId, number>, 2);
    }

    public static setHintButtonActive(active: boolean) {
        const btnHint = document.getElementById('btn-master-hint');
        if (btnHint) {
            btnHint.classList.toggle('active', active);
        }
    }

    public static updateChampionUI(_currentRuleStyle: RuleStyle, isLocalTurn: boolean, isGameOver: boolean) {
        const duelSkillBtn = document.getElementById('btn-duel-champion-skill') as HTMLButtonElement | null;
        const duelSkillIcon = document.getElementById('duel-skill-icon');
        const duelSkillText = document.getElementById('duel-skill-text');

        const currentHero = ChampionManager.currentHero;
        if (!currentHero) {
            if (duelSkillBtn) duelSkillBtn.style.display = 'none';
            return;
        }

        const heroId = currentHero;
        const hero = RoguelikeRunManager.HEROES[heroId] || RoguelikeRunManager.HEROES['tengu'];
        
        if (hero.skillType === 'none') {
            if (duelSkillBtn) duelSkillBtn.style.display = 'none';
            return;
        }
        if (duelSkillBtn) duelSkillBtn.style.display = 'flex';

        const activeSkill = ChampionManager.ACTIVE_SKILLS[heroId];
        const passiveSkill = ChampionManager.PASSIVE_SKILLS[heroId];

        if (hero.skillType === 'active' && activeSkill) {
            const isEn = getLanguage() === 'en';
            const skillTooltip = hero.id === 'tengu'
                ? (isEn ? 'Meteor Strike: Unleash meteors (6 on 9x9, 13 on 13x13, 27 on 19x19) in the selected zone to destroy stones.' : 'Lluvia Meteórica: Desata meteoros (6 en 9x9, 13 en 13x13, 27 en 19x19) en la zona elegida para destruir piedras.')
                : `${activeSkill.name}: ${activeSkill.description}`;

            if (duelSkillBtn) {
                duelSkillBtn.disabled = ChampionManager.activeChargesLeft <= 0 || !isLocalTurn || isGameOver;
                duelSkillBtn.classList.toggle('targeting', ChampionManager.currentTargetingMode !== 'none');
                duelSkillBtn.classList.toggle('depleted', ChampionManager.activeChargesLeft <= 0);
                duelSkillBtn.classList.remove('passive-badge');
                duelSkillBtn.title = skillTooltip;
                if (duelSkillIcon) {
                    duelSkillIcon.style.display = 'inline-block';
                    duelSkillIcon.innerText = activeSkill.icon;
                }
                if (duelSkillText) {
                    if (ChampionManager.currentTargetingMode !== 'none') {
                        duelSkillText.innerHTML = `<span class="duel-skill-name">${t('hud.skill_target_click')}</span>`;
                    } else if (ChampionManager.activeChargesLeft > 0) {
                        const rawSkillName = t(`champion.${heroId}.active_name`) || activeSkill.name;
                        const cleanSkillName = rawSkillName.replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s*\(\d+\s*(?:uso|usos|use|uses)?\)/gi, '').trim();
                        const combatFormula = t(`champion.${heroId}.combat_formula`) || t(`champion.${heroId}.active_desc`) || activeSkill.description || '';
                        duelSkillText.innerHTML = `<span class="duel-skill-name">${cleanSkillName} (${ChampionManager.activeChargesLeft})</span><span class="duel-skill-formula">${combatFormula}</span>`;
                    } else {
                        duelSkillText.innerHTML = `<span class="duel-skill-name">${t('hud.skill_depleted')}</span>`;
                    }
                }
            }
        } else {
            // Héroe de pasiva pura (Himiko / Ryūjin / Ronin / Normal)
            const passiveName = t(`champion.${heroId}.passive_name`) || passiveSkill?.name || 'Pasiva';
            const combatFormula = t(`champion.${heroId}.combat_formula`) || t(`champion.${heroId}.passive_desc`) || passiveSkill?.description || '';
            const passiveTooltip = `${passiveName}: ${t(`champion.${heroId}.passive_desc`) || passiveSkill?.description || ''}`;

            if (duelSkillBtn) {
                duelSkillBtn.disabled = true;
                duelSkillBtn.classList.remove('targeting');
                duelSkillBtn.classList.remove('depleted');
                duelSkillBtn.classList.add('passive-badge');
                duelSkillBtn.title = passiveTooltip;
                if (duelSkillIcon) {
                    duelSkillIcon.style.display = 'none'; // Elimina el icono gris para aprovechar todo el ancho
                }
                if (duelSkillText) {
                    duelSkillText.innerHTML = `<span class="duel-skill-name">${passiveName}</span><span class="duel-skill-formula">${combatFormula}</span>`;
                }
            }
        }
    }

    public static triggerStandeeSkillFX(_playerId: number, isLocalPlayer: boolean) {
        // En 1v1 normal, playerId local suele ser 1. Si es IA, es 2.
        const cardId = isLocalPlayer ? 'duel-player-card' : 'duel-enemy-card';
        const card = document.getElementById(cardId);
        if (card) {
            card.classList.remove('standee-skill-active');
            // Forzar reflow para reiniciar la animación
            void card.offsetWidth;
            card.classList.add('standee-skill-active');
            setTimeout(() => {
                card.classList.remove('standee-skill-active');
            }, 800);
        }
    }

    public static updateSpellbarUI(
        _currentRuleStyle: RuleStyle, 
        isLocalTurn: boolean, 
        isGameOver: boolean,
        onSpellSelect?: (spellId: SpellId) => void
    ) {
        const spellbar = document.getElementById('game-spellbar');
        const magicSection = document.getElementById('magic-spells-section');
        
        const availableSpells = RogueliteManager.getSpells().filter(s => s.usesLeft > 0);
        const hasMagic = availableSpells.length > 0;
        magicSection?.classList.toggle('hidden', !hasMagic);

        if (hasMagic) {
            const cardsContainer = document.getElementById('spellbar-cards');
            if (cardsContainer) {
                cardsContainer.innerHTML = '';

                availableSpells.forEach(spell => {
                    const card = document.createElement('button');
                    card.className = `btn-spell-card ${RogueliteManager.selectedSpell === spell.id ? 'active' : ''}`;
                    card.disabled = !isLocalTurn || isGameOver;
                    card.title = `${spell.name} (${spell.description})`;
                    card.innerHTML = `
                        <span class="spell-icon">${spell.icon}</span>
                        <span class="spell-name">${spell.name}</span>
                        <span class="spell-badge">${spell.usesLeft}</span>
                    `;

                    card.addEventListener('click', () => {
                        if (onSpellSelect) {
                            onSpellSelect(spell.id);
                        }
                    });

                    cardsContainer.appendChild(card);
                });
            }
        }

        // Botón de Pasar Turno: siempre visible en el spellbar, activo solo en turno local
        const passBtn = document.getElementById('btn-pass') as HTMLButtonElement | null;
        const passDivider = document.getElementById('spellbar-pass-divider');
        if (passBtn) {
            passBtn.disabled = !isLocalTurn || isGameOver;
            passBtn.classList.toggle('disabled-pass', !isLocalTurn || isGameOver);
        }
        if (passDivider) {
            passDivider.classList.toggle('hidden', false);
        }

        // El spellbar siempre aparece durante el juego (pass button siempre disponible)
        spellbar?.classList.remove('hidden');
    }

    public static updateTimers(
        playerTimers: Record<PlayerId, { timeRemainingSeconds: number; movesCount: number; isFlagFallen: boolean; byoYomiPeriodsLeft?: number; isInByoYomi?: boolean }>,
        activePlayer: PlayerId,
        timerMode?: string
    ) {
        const topbarPill = document.getElementById('ui-timer-pill');
        const topbarText = document.getElementById('ui-timer-text');
        const playerTimer = document.getElementById('duel-player-timer');
        const playerTimerDigits = document.getElementById('duel-player-timer-digits');
        const enemyTimer = document.getElementById('duel-enemy-timer');
        const enemyTimerDigits = document.getElementById('duel-enemy-timer-digits');

        if (!timerMode || timerMode === 'none') {
            topbarPill?.classList.add('hidden');
            playerTimer?.classList.add('hidden');
            enemyTimer?.classList.add('hidden');
            return;
        }

        topbarPill?.classList.remove('hidden');
        playerTimer?.classList.remove('hidden');
        enemyTimer?.classList.remove('hidden');

        const activeTimer = playerTimers[activePlayer];
        const activeSecs = activeTimer?.timeRemainingSeconds || 0;
        const p1Timer = playerTimers[1];
        const p2Timer = playerTimers[2];
        const p1Secs = p1Timer?.timeRemainingSeconds || 0;
        const p2Secs = p2Timer?.timeRemainingSeconds || 0;

        const formatTime = (seconds: number, timerInfo?: { byoYomiPeriodsLeft?: number; isInByoYomi?: boolean }) => {
            const s = Math.max(0, Math.floor(seconds));
            const mins = Math.floor(s / 60);
            const remSecs = s % 60;
            const timeStr = `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
            if (timerInfo?.isInByoYomi && timerInfo.byoYomiPeriodsLeft !== undefined) {
                return `${timeStr} (${timerInfo.byoYomiPeriodsLeft}P)`;
            }
            return timeStr;
        };

        if (topbarText) {
            topbarText.innerText = formatTime(activeSecs, activeTimer);
            topbarPill?.classList.toggle('timer-urgent', activeSecs <= 5);
            topbarPill?.classList.toggle('timer-warning', activeSecs > 5 && activeSecs <= 10);
        }

        if (playerTimerDigits) {
            playerTimerDigits.innerText = formatTime(p1Secs, p1Timer);
            playerTimer?.classList.toggle('timer-active', activePlayer === 1);
            playerTimer?.classList.toggle('timer-urgent', activePlayer === 1 && p1Secs <= 5);
            playerTimer?.classList.toggle('timer-warning', activePlayer === 1 && p1Secs > 5 && p1Secs <= 10);
        }

        if (enemyTimerDigits) {
            enemyTimerDigits.innerText = formatTime(p2Secs, p2Timer);
            enemyTimer?.classList.toggle('timer-active', activePlayer === 2);
            enemyTimer?.classList.toggle('timer-urgent', activePlayer === 2 && p2Secs <= 5);
            enemyTimer?.classList.toggle('timer-warning', activePlayer === 2 && p2Secs > 5 && p2Secs <= 10);
        }
    }

    public static updatePolyominoUI(
        isLocalTurn: boolean, 
        isGameOver: boolean,
        currentPlayer: PlayerId = 1
    ) {
        PolyominoManager.syncCardsWithInventory(currentPlayer);
        const polyDock = document.getElementById('polyomino-dock-section');
        const sproutCard = PolyominoManager.polyominoCards.get('sprouting');
        const dominoCard = PolyominoManager.polyominoCards.get('domino');
        const monolithCard = PolyominoManager.polyominoCards.get('monolith');

        const totalUses = (sproutCard?.usesLeft || 0) + (dominoCard?.usesLeft || 0) + (monolithCard?.usesLeft || 0);

        if (!PolyominoManager.hasAnyAvailablePolyominoes(currentPlayer) && totalUses === 0) {
            polyDock?.classList.add('hidden');
            return;
        }

        if (polyDock) {
            polyDock.classList.remove('hidden');
        }

        const btnSprout = document.getElementById('poly-btn-sprouting') as HTMLButtonElement | null;
        const btnDomino = document.getElementById('poly-btn-domino') as HTMLButtonElement | null;
        const btnMonolith = document.getElementById('poly-btn-monolith') as HTMLButtonElement | null;

        const sproutUses = document.getElementById('poly-uses-sprouting');
        const dominoUses = document.getElementById('poly-uses-domino');
        const monolithUses = document.getElementById('poly-uses-monolith');
        const dominoSizeLabel = document.getElementById('poly-domino-size-label');

        if (sproutUses && sproutCard) {
            sproutUses.innerText = `${sproutCard.usesLeft}`;
            sproutUses.classList.toggle('badge-depleted', sproutCard.usesLeft <= 0);
        }
        if (dominoUses && dominoCard) {
            dominoUses.innerText = `${dominoCard.usesLeft}`;
            dominoUses.classList.toggle('badge-depleted', dominoCard.usesLeft <= 0);
        }
        if (monolithUses && monolithCard) {
            monolithUses.innerText = `${monolithCard.usesLeft}`;
            monolithUses.classList.toggle('badge-depleted', monolithCard.usesLeft <= 0);
        }

        if (dominoSizeLabel) {
            if (PolyominoManager.activePolyomino === 'domino') {
                dominoSizeLabel.innerText = PolyominoManager.orientation === 'horizontal' ? '2x1 ⇄ [R]' : '2x1 ⇅ [R]';
            } else {
                dominoSizeLabel.innerText = '2x1';
            }
        }

        if (btnSprout && sproutCard) {
            btnSprout.disabled = sproutCard.usesLeft <= 0 || !isLocalTurn || isGameOver;
            btnSprout.classList.toggle('active', PolyominoManager.activePolyomino === 'sprouting');
        }

        if (btnDomino && dominoCard) {
            const isEn = getLanguage() === 'en';
            btnDomino.disabled = dominoCard.usesLeft <= 0 || !isLocalTurn || isGameOver;
            btnDomino.classList.toggle('active', PolyominoManager.activePolyomino === 'domino');
            btnDomino.title = isEn
                ? `🀄 Duplicity (2x1): 2 connected stones block. Orientation: ${PolyominoManager.orientation === 'horizontal' ? 'Horizontal ⇄' : 'Vertical ⇅'} (Press [R] to rotate 90º)`
                : `🀄 Duplicidad (2x1): Bloque de 2 piedras conectadas. Orientación: ${PolyominoManager.orientation === 'horizontal' ? 'Horizontal ⇄' : 'Vertical ⇅'} (Pulsa [R] para rotar 90º)`;
        }

        if (btnMonolith && monolithCard) {
            btnMonolith.disabled = monolithCard.usesLeft <= 0 || !isLocalTurn || isGameOver;
            btnMonolith.classList.toggle('active', PolyominoManager.activePolyomino === 'monolith');
        }
    }

    public static setAIBadge(thinking: boolean) {
        const badge = document.getElementById('ui-ai-badge');
        if (badge) {
            if (thinking) {
                badge.innerText = `🤖 ${t('hud.ai_thinking') || 'Thinking...'}`;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    public static updateStageBadge(isActive: boolean, title?: string, enemyName?: string, rankLabel?: string) {
        const stageBadge = document.getElementById('ui-rogue-stage-badge');
        const stageText = document.getElementById('ui-rogue-stage-text');
        const isEn = getLanguage() === 'en';
        if (stageBadge && stageText) {
            if (isActive) {
                stageBadge.classList.remove('hidden');
                const defaultTitle = isEn ? 'Battle' : 'Batalla';
                const label = enemyName ? `${enemyName} (${rankLabel || ''})` : (title || defaultTitle);
                stageText.innerText = `⚔️ ${label}`;
            } else {
                stageBadge.classList.add('hidden');
            }
        }
    }

    public static showAlert(message: string, durationMs: number = 3200) {
        const alertBox = document.getElementById('game-alert-box');
        const alertText = document.getElementById('game-alert-text');
        if (!alertBox || !alertText) return;

        if (this.alertTimeout) {
            clearTimeout(this.alertTimeout);
            this.alertTimeout = null;
        }

        alertText.innerText = message;
        alertBox.classList.remove('hidden');
        alertBox.classList.add('show');

        this.alertTimeout = window.setTimeout(() => {
            alertBox.classList.remove('show');
            setTimeout(() => alertBox.classList.add('hidden'), 300);
            this.alertTimeout = null;
        }, durationMs);
    }

    public static hideAlert() {
        const alertBox = document.getElementById('game-alert-box');
        if (alertBox) {
            alertBox.classList.remove('show');
            alertBox.classList.add('hidden');
        }
        if (this.alertTimeout) {
            clearTimeout(this.alertTimeout);
            this.alertTimeout = null;
        }
    }

    /**
     * Muestra el anuncio de inicio de partida (Roguelike, 1 vs 1 Local y 4P) con máscara 70% negra, blur y tipografía libre
     * con transición fluida de entrada y desvanecimiento suave de 1.5 segundos hacia el Goban.
     */
    public static showRogueKomiAnnouncement(
        komiParam: number | { komi: number; playerKomis?: Record<number, number>; playerCount?: number }, 
        autoHideMs: number = 2200,
        customBadge?: string
    ) {
        const overlay = document.getElementById('rogue-komi-announcement-overlay');
        const badgeEl = overlay?.querySelector('.rogue-komi-role-badge') as HTMLElement | null;
        const titleEl = overlay?.querySelector('.rogue-komi-main-title') as HTMLElement | null;
        const displayEl = overlay?.querySelector('.rogue-komi-score-display') as HTMLElement | null;
        const expEl = overlay?.querySelector('.rogue-komi-explanation') as HTMLElement | null;
        const isEn = getLanguage() === 'en';
        if (!overlay) return;

        const is4P = typeof komiParam === 'object' && komiParam.playerCount === 4;

        if (badgeEl) {
            badgeEl.innerText = customBadge || (isEn ? '⚫ PLAYING AS BLACK • FIRST TURN' : '⚫ JUEGAS CON NEGRAS • PRIMER TURNO');
        }

        if (is4P) {
            const pK = (typeof komiParam === 'object' && komiParam.playerKomis) ? komiParam.playerKomis : { 2: 2.5, 3: 4.5, 4: 6.5 };
            if (titleEl) {
                titleEl.innerText = isEn ? "TURN COMPENSATION KOMI" : "KOMI DE COMPENSACIÓN";
            }
            if (displayEl) {
                displayEl.innerHTML = `
                  <div class="rogue-komi-4p-row">
                    <div class="rogue-komi-4p-item">
                      <span class="rogue-komi-stone-icon">⚪</span>
                      <span class="rogue-komi-4p-val">+${pK[2] ?? 2.5}</span>
                      <small class="rogue-komi-4p-label">${isEn ? 'White (P2)' : 'Blancas (P2)'}</small>
                    </div>
                    <div class="rogue-komi-4p-item">
                      <span class="rogue-komi-stone-icon">🟢</span>
                      <span class="rogue-komi-4p-val">+${pK[3] ?? 4.5}</span>
                      <small class="rogue-komi-4p-label">${isEn ? 'Emerald (P3)' : 'Esmeralda (P3)'}</small>
                    </div>
                    <div class="rogue-komi-4p-item">
                      <span class="rogue-komi-stone-icon">🟣</span>
                      <span class="rogue-komi-4p-val">+${pK[4] ?? 6.5}</span>
                      <small class="rogue-komi-4p-label">${isEn ? 'Amethyst (P4)' : 'Amatista (P4)'}</small>
                    </div>
                  </div>
                `;
            }
            if (expEl) {
                expEl.innerText = isEn 
                    ? "Staggered territory compensation according to turn order." 
                    : "Compensación territorial escalonada según el orden de turno.";
            }
        } else {
            const komiVal = typeof komiParam === 'number' ? komiParam : komiParam.komi;
            if (titleEl) {
                titleEl.innerText = isEn ? "WHITE'S KOMI" : "KOMI DE BLANCAS";
            }
            if (displayEl) {
                displayEl.innerHTML = `
                  <span class="rogue-komi-stone-icon">⚪</span>
                  <span id="rogue-komi-display-value" class="rogue-komi-score-text">+${komiVal} ${isEn ? 'POINTS' : 'PUNTOS'}</span>
                `;
            }
            if (expEl) {
                expEl.innerText = isEn 
                    ? "Canonical territory compensation for playing second." 
                    : "Compensación canónica de territorio para el segundo jugador.";
            }
        }

        overlay.classList.remove('hidden');
        overlay.classList.remove('fade-out');
        overlay.classList.remove('active');

        // Forzar reflow para activar la animación de entrada suave
        void overlay.offsetWidth;
        overlay.classList.add('active');

        let isDismissed = false;

        const hide = () => {
            if (isDismissed) return;
            isDismissed = true;

            overlay.classList.remove('active');
            overlay.classList.add('fade-out');

            // 1.5s (1500ms) exactos para que la transición suave se desvanezca poco a poco
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.classList.remove('fade-out');
            }, 1500);

            overlay.removeEventListener('click', hide);
            window.removeEventListener('keydown', keyHide);
        };

        const keyHide = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                hide();
            }
        };

        overlay.addEventListener('click', hide, { once: true });
        window.addEventListener('keydown', keyHide, { once: true });

        if (autoHideMs > 0) {
            setTimeout(() => {
                hide();
            }, autoHideMs);
        }
    }

    public static updateDuelists(
        isRoguelike: boolean,
        heroId?: HeroId,
        node?: any,
        gameMode?: string,
        difficulty?: AIDifficulty,
        state?: GameState,
        aiHeroId?: HeroId | null,
        rivalImage?: string,
        rivalName?: string,
        rivalIcon?: string,
        enemyHeroIds?: Record<number, any>
    ) {
        DuelistRenderer.updateDuelists(isRoguelike, heroId, node, gameMode, difficulty, state, aiHeroId, rivalImage, rivalName, rivalIcon, enemyHeroIds);
    }

    public static setBoardBackground(bg?: string) {
        const viewport = document.getElementById('board-viewport');
        if (viewport) {
            // Mapeo seguro de alias de escenarios a imágenes JPG reales existentes en /public
            const bgMapping: Record<string, string> = {
                combat: 'combat',
                dojo: 'combat',
                meadow: 'meadow',
                sunset: 'sunset',
                night: 'night',
                story: 'story',
                void: 'story',
                tutorial: 'tutorial',
                zen: 'tutorial',
                boss: 'boss',
                volcano: 'boss',
                oni: 'combat',
                sky: 'combat'
            };

            const rawBg = bg || 'combat';
            const activeBg = bgMapping[rawBg] || 'combat';

            viewport.setAttribute('data-bg', activeBg);
            viewport.style.backgroundImage = `radial-gradient(circle at center, rgb(12 16 26 / 45%) 0%, rgb(6 9 15 / 0%) 100%), url('./bg_${activeBg}.jpg')`;
            viewport.style.backgroundSize = 'cover';
            viewport.style.backgroundPosition = 'center center';
            viewport.style.backgroundRepeat = 'no-repeat';

            // Cambiar música de fondo asociada al escenario seleccionado
            BGMGenerator.playBackground(rawBg as any);
        }
    }

    private static getDifficultyLabel(difficulty: string): string {
        if (!difficulty) return '(15k)';
        switch (difficulty) {
            case 'easy': return '(25k)';
            case 'medium': return '(16k)';
            case 'hard': return '(4k)';
            case 'dan': return '(2 Dan)';
            default: return `(${difficulty})`;
        }
    }
}
