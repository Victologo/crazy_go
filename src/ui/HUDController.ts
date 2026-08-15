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
import { t } from '../i18n/i18n';

export class HUDController {
    private static alertTimeout: number | null = null;

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
                    roleText = cp === humanColor ? `— ${t('hud.turn_human')}` : `— ${t('hud.turn_ai')} ${diffLabel}`;
                } else if (currentMode === 'online') {
                    roleText = cp === localOnlineColor ? `— ${t('hud.turn_human')}` : `— ${t('hud.online_waiting')}`;
                }
                playerName.innerText = `${meta.name} ${meta.icon} ${roleText}`;
            }
        }

        // Contadores de capturas y Komi
        if (blackCaps) blackCaps.innerText = state.blackCaptures.toString();
        if (whiteCaps) {
            const komiText = state.komi > 0 ? ` <small id="ui-komi-sub">(+${state.komi})</small>` : '';
            whiteCaps.innerHTML = `${state.whiteCaptures}${komiText}`;
        }
        if (greenCaps) {
            const komiText = (state.playerCount === 4 && state.komi > 0) ? ` <small>(+${state.komi})</small>` : '';
            greenCaps.innerHTML = `${state.greenCaptures}${komiText}`;
        }
        if (purpleCaps) {
            const komiText = (state.playerCount === 4 && state.komi > 0) ? ` <small>(+${state.komi})</small>` : '';
            purpleCaps.innerHTML = `${state.purpleCaptures}${komiText}`;
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
            const skillTooltip = hero.id === 'tengu'
                ? 'Lluvia Meteórica: Desata meteoros (5 en 9x9, 9 en 13x13, 15 en 19x19) en la zona elegida para destruir piedras.'
                : `${activeSkill.name}: ${activeSkill.description}`;

            if (duelSkillBtn) {
                duelSkillBtn.disabled = ChampionManager.activeChargesLeft <= 0 || !isLocalTurn || isGameOver;
                duelSkillBtn.classList.toggle('targeting', ChampionManager.currentTargetingMode !== 'none');
                duelSkillBtn.classList.toggle('depleted', ChampionManager.activeChargesLeft <= 0);
                duelSkillBtn.title = skillTooltip;
                if (duelSkillIcon) duelSkillIcon.innerText = activeSkill.icon;
                if (duelSkillText) {
                    if (ChampionManager.currentTargetingMode !== 'none') {
                        duelSkillText.innerText = t('hud.skill_target_click');
                    } else if (ChampionManager.activeChargesLeft > 0) {
                        const rawSkillName = t(`champion.${heroId}.active_name`) || activeSkill.name;
                        // Eliminar emojis y sufijos hardcodeados como (1 use)
                        const cleanSkillName = rawSkillName.replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s*\(\d+\s*(?:uso|usos|use|uses)?\)/gi, '').trim();
                        duelSkillText.innerText = `${cleanSkillName} (${ChampionManager.activeChargesLeft})`;
                    } else {
                        duelSkillText.innerText = t('hud.skill_depleted');
                    }
                }
            }
        } else {
            // Héroe de pasiva pura (Himiko / Ryūjin / Ronin)
            const passiveName = t(`champion.${heroId}.passive_name`) || passiveSkill?.name || 'Pasiva';
            const passiveDesc = t(`champion.${heroId}.passive_desc`) || passiveSkill?.description || '';
            const passiveTooltip = `${passiveName}: ${passiveDesc}`;

            if (duelSkillBtn) {
                duelSkillBtn.disabled = true;
                duelSkillBtn.classList.remove('targeting');
                duelSkillBtn.classList.remove('depleted');
                duelSkillBtn.title = passiveTooltip;
                if (duelSkillIcon) duelSkillIcon.innerText = passiveSkill?.icon || '✨';
                if (duelSkillText) {
                    duelSkillText.innerText = ChampionManager.isPassiveSkillAvailable 
                        ? `${passiveName} ${t('hud.skill_passive_suffix', { name: '' }).replace('() ', '').trim()}`
                        : t('hud.skill_passive_activated');
                }
            }
        }
    }

    public static updateSpellbarUI(
        currentRuleStyle: RuleStyle, 
        isLocalTurn: boolean, 
        isGameOver: boolean,
        onSpellSelect?: (spellId: SpellId) => void
    ) {
        const spellbar = document.getElementById('game-spellbar');
        const magicSection = document.getElementById('magic-spells-section');
        
        const availableSpells = RogueliteManager.getSpells().filter(s => s.usesLeft > 0);
        const hasMagic = currentRuleStyle === 'roguelite' && availableSpells.length > 0;
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

        // Si no hay magia ni poliminós habilitados, ocultar completamente la barra inferior
        const polyDock = document.getElementById('polyomino-dock-section');
        const hasPoly = polyDock && !polyDock.classList.contains('hidden');

        if (!hasMagic && !hasPoly) {
            spellbar?.classList.add('hidden');
        } else {
            spellbar?.classList.remove('hidden');
        }
    }

    public static updateTimers(
        playerTimers: Record<PlayerId, { timeRemainingSeconds: number; movesCount: number; isFlagFallen: boolean }>,
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

        const activeSecs = playerTimers[activePlayer]?.timeRemainingSeconds || 0;
        const p1Secs = playerTimers[1]?.timeRemainingSeconds || 0;
        const p2Secs = playerTimers[2]?.timeRemainingSeconds || 0;

        const formatTime = (seconds: number) => {
            const s = Math.max(0, Math.floor(seconds));
            const mins = Math.floor(s / 60);
            const remSecs = s % 60;
            return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
        };

        if (topbarText) {
            topbarText.innerText = formatTime(activeSecs);
            topbarPill?.classList.toggle('timer-warning', activeSecs <= 10);
        }

        if (playerTimerDigits) {
            playerTimerDigits.innerText = formatTime(p1Secs);
            playerTimer?.classList.toggle('timer-active', activePlayer === 1);
            playerTimer?.classList.toggle('timer-warning', activePlayer === 1 && p1Secs <= 10);
        }

        if (enemyTimerDigits) {
            enemyTimerDigits.innerText = formatTime(p2Secs);
            enemyTimer?.classList.toggle('timer-active', activePlayer === 2);
            enemyTimer?.classList.toggle('timer-warning', activePlayer === 2 && p2Secs <= 10);
        }
    }

    public static updatePolyominoUI(
        isLocalTurn: boolean, 
        isGameOver: boolean,
        currentPlayer: PlayerId = 1
    ) {
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
            btnDomino.disabled = dominoCard.usesLeft <= 0 || !isLocalTurn || isGameOver;
            btnDomino.classList.toggle('active', PolyominoManager.activePolyomino === 'domino');
            btnDomino.title = `🀄 Duplicidad (2x1): Bloque de 2 piedras conectadas. Orientación: ${PolyominoManager.orientation === 'horizontal' ? 'Horizontal ⇄' : 'Vertical ⇅'} (Pulsa [R] para rotar 90º)`;
        }

        if (btnMonolith && monolithCard) {
            btnMonolith.disabled = monolithCard.usesLeft <= 0 || !isLocalTurn || isGameOver;
            btnMonolith.classList.toggle('active', PolyominoManager.activePolyomino === 'monolith');
        }
    }

    public static setAIBadge(thinking: boolean) {
        const badge = document.getElementById('ui-ai-badge');
        if (badge) {
            if (thinking) badge.classList.remove('hidden');
            else badge.classList.add('hidden');
        }
    }

    public static updateStageBadge(isActive: boolean, title?: string, enemyName?: string, rankLabel?: string) {
        const stageBadge = document.getElementById('ui-rogue-stage-badge');
        const stageText = document.getElementById('ui-rogue-stage-text');
        if (stageBadge && stageText) {
            if (isActive) {
                stageBadge.classList.remove('hidden');
                const label = enemyName ? `${enemyName} (${rankLabel || ''})` : (title || 'Batalla');
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
     * Muestra el anuncio de inicio de partida (Roguelike y 1 vs 1 Local) con máscara 70% negra, blur y tipografía libre
     * con transición fluida de entrada y desvanecimiento suave de 1.5 segundos hacia el Goban.
     */
    public static showRogueKomiAnnouncement(
        komiValue: number, 
        autoHideMs: number = 2200,
        customBadge?: string
    ) {
        const overlay = document.getElementById('rogue-komi-announcement-overlay');
        const valEl = document.getElementById('rogue-komi-display-value');
        const badgeEl = overlay?.querySelector('.rogue-komi-role-badge') as HTMLElement | null;
        if (!overlay) return;

        if (valEl) {
            valEl.innerText = `+${komiValue} PUNTOS`;
        }

        if (badgeEl) {
            badgeEl.innerText = customBadge || '⚫ JUEGAS CON NEGRAS • PRIMER TURNO';
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
        state?: GameState
    ) {
        DuelistRenderer.updateDuelists(isRoguelike, heroId, node, gameMode, difficulty, state);
    }

    public static setBoardBackground(bg?: string) {
        const viewport = document.getElementById('board-viewport');
        if (viewport) {
            if (bg) {
                viewport.setAttribute('data-bg', bg);
            } else {
                viewport.removeAttribute('data-bg');
            }
        }
    }

    private static getDifficultyLabel(difficulty: AIDifficulty): string {
        switch (difficulty) {
            case 'easy': return '(25k)';
            case 'medium': return '(16k)';
            case 'hard': return '(4k)';
            case 'dan': return '(2 Dan)';
        }
    }
}
