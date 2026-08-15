import type { PlayerId, RuleStyle, GameMode, AIDifficulty, HeroId } from '../types';
import { TerritoryScorer } from '../core/TerritoryScorer';
import { ChampionManager } from '../core/ChampionManager';
import { RogueliteManager, type SpellId } from '../core/RogueliteManager';
import { RoguelikeRunManager } from '../core/RoguelikeRunManager';
import { PolyominoManager } from '../core/PolyominoManager';
import { BossManager } from '../core/BossManager';
import { GameState } from '../core/GameState';
import { TutorialManager } from '../tutorial/TutorialManager';
import { NetworkManager } from '../network/NetworkManager';
import { DevModeManager } from '../core/DevModeManager';
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
                    roleText = cp === humanColor ? `— ${t('hud.turn_human')}` : `— ${t('hud.turn_ai')} (${diffLabel})`;
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
                        duelSkillText.innerText = '🎯 Clic en Casilla';
                    } else if (ChampionManager.activeChargesLeft > 0) {
                        duelSkillText.innerText = `${activeSkill.name} (${ChampionManager.activeChargesLeft})`;
                    } else {
                        duelSkillText.innerText = 'Habilidad Agotada (0)';
                    }
                }
            }
        } else {
            // Héroe de pasiva pura (Himiko / Ryūjin)
            const passiveTooltip = `${passiveSkill?.name || 'Pasiva'}: ${passiveSkill?.description || ''}`;

            if (duelSkillBtn) {
                duelSkillBtn.disabled = true;
                duelSkillBtn.classList.remove('targeting');
                duelSkillBtn.classList.remove('depleted');
                duelSkillBtn.title = passiveTooltip;
                if (duelSkillIcon) duelSkillIcon.innerText = passiveSkill?.icon || '✨';
                if (duelSkillText) {
                    duelSkillText.innerText = ChampionManager.isPassiveSkillAvailable 
                        ? `${passiveSkill?.name || 'Habilidad'} (Habilidad Pasiva)`
                        : 'Pasiva Activada ✓';
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
        const playerCard = document.getElementById('duel-player-card');
        const enemyCard = document.getElementById('duel-enemy-card');
        const multiEnemyCard = document.getElementById('duel-multi-enemies-card');

        if (!playerCard || !enemyCard) return;

        const is4Player = state ? state.playerCount === 4 : false;

        if (is4Player && multiEnemyCard) {
            // === MODO 4 JUGADORES (FFA 1v3 IA o 4P Local) ===
            enemyCard.classList.add('hidden');
            multiEnemyCard.classList.remove('hidden');
            playerCard.classList.remove('hidden');

            const pImg = document.getElementById('duel-player-img') as HTMLImageElement | null;
            const pIcon = document.getElementById('duel-player-icon-badge');
            const pName = document.getElementById('duel-player-name');
            const pTitle = document.getElementById('duel-player-title');
            const roleTag = playerCard.querySelector('.duel-role-tag') as HTMLElement | null;

            if (gameMode === '1via') {
                // Caso 1 Human vs 3 AIs:
                // Izquierda: Jugador Humano (Tú)
                if (roleTag) roleTag.innerText = 'TÚ (CAMPEÓN)';
                if (heroId) {
                    const hero = RoguelikeRunManager.HEROES[heroId];
                    if (pImg && hero) pImg.src = hero.image;
                    if (pIcon && hero) pIcon.innerText = hero.icon;
                    if (pName && hero) pName.innerText = hero.name;
                    if (pTitle) pTitle.innerText = '⚫ Negras (J1)';
                } else {
                    if (pImg) pImg.src = '/heroes/ronin.png';
                    if (pIcon) pIcon.innerText = '⚫';
                    if (pName) pName.innerText = 'Jugador (Tú)';
                    if (pTitle) pTitle.innerText = '⚫ Negras (J1)';
                }

                // Derecha: 3 Oponentes IA
                const randomMonk = [
                    { name: 'Joven Ren', avatar: '/enemies/monk_1.png', icon: '⚪', rank: '25 Kyu • IA Blanca' },
                    { name: 'Joven Hiro', avatar: '/enemies/monk_2.png', icon: '⚪', rank: '25 Kyu • IA Blanca' },
                    { name: 'Joven Sora', avatar: '/enemies/monk_3.png', icon: '⚪', rank: '25 Kyu • IA Blanca' },
                    { name: 'Joven Daiki', avatar: '/enemies/monk_4.png', icon: '⚪', rank: '25 Kyu • IA Blanca' },
                    { name: 'Joven Kazuki', avatar: '/enemies/monk_5.png', icon: '⚪', rank: '25 Kyu • IA Blanca' }
                ][Math.floor(Math.random() * 5)];

                const randomSage = [
                    { name: 'Kenshin el Sabio', avatar: '/enemies/sage_1.png', icon: '🟢', rank: '16 Kyu • IA Verde' },
                    { name: 'Nobunaga el Sabio', avatar: '/enemies/sage_2.png', icon: '🟢', rank: '16 Kyu • IA Verde' },
                    { name: 'Masashi el Sabio', avatar: '/enemies/sage_3.png', icon: '🟢', rank: '16 Kyu • IA Verde' },
                    { name: 'Tetsuo el Sabio', avatar: '/enemies/sage_4.png', icon: '🟢', rank: '16 Kyu • IA Verde' },
                    { name: 'Genzaburo el Sabio', avatar: '/enemies/sage_5.png', icon: '🟢', rank: '16 Kyu • IA Verde' }
                ][Math.floor(Math.random() * 5)];

                const aiOpponents = [
                    { pid: 2, name: randomMonk.name, icon: randomMonk.icon, avatar: randomMonk.avatar, rank: randomMonk.rank },
                    { pid: 3, name: randomSage.name, icon: randomSage.icon, avatar: randomSage.avatar, rank: randomSage.rank },
                    { pid: 4, name: 'Centinela Dragón', icon: '🟣', avatar: '/enemies/samurai.png', rank: '4 Kyu • IA Púrpura' }
                ];

                multiEnemyCard.innerHTML = '';
                aiOpponents.forEach(ai => {
                    const isTurn = state?.currentPlayer === ai.pid;
                    const card = document.createElement('div');
                    card.className = `mini-opponent-card ${isTurn ? 'active-turn' : ''}`;
                    card.innerHTML = `
                        <div class="mini-opponent-avatar">
                            <img src="${ai.avatar}" alt="${ai.name}" />
                        </div>
                        <div class="mini-opponent-info">
                            <div class="mini-opponent-header">
                                <span class="mini-opponent-badge">${ai.icon}</span>
                                <strong class="mini-opponent-name">${ai.name}</strong>
                            </div>
                            <small class="mini-opponent-sub">${ai.rank}</small>
                            <span class="mini-opponent-status ${isTurn ? 'playing' : 'waiting'}">
                                ${isTurn ? '🤖 ¡Pensando jugada...!' : '⏳ En espera'}
                            </span>
                        </div>
                    `;
                    multiEnemyCard.appendChild(card);
                });
            } else {
                // Caso 4P Local Pasa y Juega:
                // Izquierda: Jugador Activo (al que le toca mover)
                const activeP = state ? state.currentPlayer : 1;
                if (roleTag) roleTag.innerText = `TURNO ACTUAL (J${activeP})`;

                const localHeroes: Record<number, { name: string; title: string; icon: string; img: string }> = {
                    1: { name: 'Jugador 1', title: 'Piedras Negras', icon: '⚫', img: '/heroes/ronin.png' },
                    2: { name: 'Jugador 2', title: 'Piedras Blancas', icon: '⚪', img: '/heroes/kitsune.png' },
                    3: { name: 'Jugador 3', title: 'Piedras Esmeralda', icon: '🟢', img: '/heroes/himiko.png' },
                    4: { name: 'Jugador 4', title: 'Piedras Amatista', icon: '🟣', img: '/heroes/ryujin.png' }
                };

                const currentHeroData = localHeroes[activeP];
                if (pImg) pImg.src = currentHeroData.img;
                if (pIcon) pIcon.innerText = currentHeroData.icon;
                if (pName) pName.innerText = currentHeroData.name;
                if (pTitle) pTitle.innerText = `${currentHeroData.title} • ¡Te toca mover!`;

                // Derecha: Los 3 Jugadores que están en espera
                const waitingPlayers = [1, 2, 3, 4].filter(p => p !== activeP);
                multiEnemyCard.innerHTML = '';
                waitingPlayers.forEach(p => {
                    const hData = localHeroes[p];
                    const card = document.createElement('div');
                    card.className = 'mini-opponent-card';
                    card.innerHTML = `
                        <div class="mini-opponent-avatar">
                            <img src="${hData.img}" alt="${hData.name}" />
                        </div>
                        <div class="mini-opponent-info">
                            <div class="mini-opponent-header">
                                <span class="mini-opponent-badge">${hData.icon}</span>
                                <strong class="mini-opponent-name">${hData.name}</strong>
                            </div>
                            <small class="mini-opponent-sub">${hData.title}</small>
                            <span class="mini-opponent-status waiting">⏳ Esperando turno</span>
                        </div>
                    `;
                    multiEnemyCard.appendChild(card);
                });
            }
            return;
        }

        // === MODO TUTORIAL / DOJO ===
        if (TutorialManager.isActive) {
            if (multiEnemyCard) multiEnemyCard.classList.add('hidden');
            playerCard.classList.remove('hidden');
            enemyCard.classList.remove('hidden');

            const currentTutorialHero = heroId || TutorialManager.currentChapter?.heroId;
            const pImg = document.getElementById('duel-player-img') as HTMLImageElement | null;
            const pIcon = document.getElementById('duel-player-icon-badge');
            const pName = document.getElementById('duel-player-name');
            const pTitle = document.getElementById('duel-player-title');
            const roleTag = playerCard.querySelector('.duel-role-tag') as HTMLElement | null;

            if (currentTutorialHero && currentTutorialHero !== 'normal') {
                const hero = RoguelikeRunManager.HEROES[currentTutorialHero];
                if (roleTag) roleTag.innerText = 'TÚ (CAMPEÓN)';
                if (pImg && hero) {
                    pImg.src = hero.image;
                    pImg.classList.remove('hero-normal-img');
                }
                if (pIcon && hero) pIcon.innerText = hero.icon;
                if (pName && hero) pName.innerText = hero.name;
                if (pTitle && hero) pTitle.innerText = '⚫ Héroe Místico';
            } else {
                if (roleTag) roleTag.innerText = 'TÚ (APRENDIZ)';
                if (pImg) {
                    pImg.src = '/heroes/normal.png';
                    pImg.classList.add('hero-normal-img');
                }
                if (pIcon) pIcon.innerText = '🥋';
                if (pName) pName.innerText = 'Aprendiz de Go';
                if (pTitle) pTitle.innerText = '';
            }

            const enemyRoleTag = enemyCard.querySelector('.duel-role-tag') as HTMLElement | null;
            if (enemyRoleTag) enemyRoleTag.innerText = 'MAESTRO DEL DOJO';

            const eImg = document.getElementById('duel-enemy-img') as HTMLImageElement | null;
            const eIcon = document.getElementById('duel-enemy-icon-badge');
            const eName = document.getElementById('duel-enemy-name');
            const eRank = document.getElementById('duel-enemy-rank');

            if (eImg) eImg.src = '/enemies/sage_1.png';
            if (eIcon) eIcon.innerText = '📜';
            if (eName) eName.innerText = 'Sensei Hiroshi';
            if (eRank) eRank.innerText = '9 Dan • Maestro de Go';

            this.updateStageBadge(false);
            return;
        }

        // === MODO 2 JUGADORES O ROGUELIKE (1v1) ===
        if (multiEnemyCard) multiEnemyCard.classList.add('hidden');
        playerCard.classList.remove('hidden');
        enemyCard.classList.remove('hidden');

        const roleTag = playerCard.querySelector('.duel-role-tag') as HTMLElement | null;
        if (roleTag) roleTag.innerText = 'TÚ (CAMPEÓN)';

        const activeHeroId = heroId || (isRoguelike ? 'normal' : null);
        playerCard.setAttribute('data-hero', activeHeroId || 'none');
        playerCard.classList.toggle('hero-normal', activeHeroId === 'normal');

        if (isRoguelike) {
            const targetHero: HeroId = heroId || 'normal';
            const hero = RoguelikeRunManager.HEROES[targetHero];
            const pImg = document.getElementById('duel-player-img') as HTMLImageElement | null;
            if (pImg) pImg.classList.toggle('hero-normal-img', targetHero === 'normal');
            const pIcon = document.getElementById('duel-player-icon-badge');
            const pName = document.getElementById('duel-player-name');
            const pTitle = document.getElementById('duel-player-title');

            if (pImg && hero) pImg.src = hero.image;
            if (pIcon && hero) pIcon.innerText = hero.icon;
            if (pName && hero) pName.innerText = hero.name;
            if (pTitle) pTitle.innerText = '';

            const eImg = document.getElementById('duel-enemy-img') as HTMLImageElement | null;
            const eIcon = document.getElementById('duel-enemy-icon-badge');
            const eName = document.getElementById('duel-enemy-name');
            const eRank = document.getElementById('duel-enemy-rank');

            const bConfig = node?.battleConfig;
            if (eImg) eImg.src = bConfig?.enemyImage || '/enemies/monk.png';
            if (eIcon) eIcon.innerText = bConfig?.enemyIcon || '🧘';
            if (eName) eName.innerText = bConfig?.enemyName || 'Monje Novato';
            if (eRank) {
                eRank.innerText = node?.type === 'boss'
                    ? `👑 Dragón Ancestral • Aliento Calcinante (${BossManager.bossChargesLeft} cargas)`
                    : `${bConfig?.rankLabel || '30 Kyu'} • ${bConfig?.shape || 'square'}`;
            }
        } else if (gameMode === '1via') {
            const pImg = document.getElementById('duel-player-img') as HTMLImageElement | null;
            const pIcon = document.getElementById('duel-player-icon-badge');
            const pName = document.getElementById('duel-player-name');
            const pTitle = document.getElementById('duel-player-title');

            if (heroId) {
                const hero = RoguelikeRunManager.HEROES[heroId];
                if (pImg && hero) {
                    pImg.src = hero.image;
                    pImg.classList.toggle('hero-normal-img', heroId === 'normal');
                }
                if (pIcon && hero) pIcon.innerText = hero.icon;
                if (pName && hero) pName.innerText = hero.name;
                if (pTitle) pTitle.innerText = '';
            } else {
                if (pImg) {
                    pImg.src = '/heroes/ronin.png';
                    pImg.classList.remove('hero-normal-img');
                }
                if (pIcon) pIcon.innerText = '⚫';
                if (pName) pName.innerText = 'Jugador (Tú)';
                if (pTitle) pTitle.innerText = '';
            }

            const eImg = document.getElementById('duel-enemy-img') as HTMLImageElement | null;
            const eIcon = document.getElementById('duel-enemy-icon-badge');
            const eName = document.getElementById('duel-enemy-name');
            const eRank = document.getElementById('duel-enemy-rank');

            const randomMonks = [
                { name: 'Joven Ren', image: '/enemies/monk_1.png', icon: '🧘', rank: '30 Kyu • Principiante' },
                { name: 'Joven Hiro', image: '/enemies/monk_2.png', icon: '🧘', rank: '28 Kyu • Principiante' },
                { name: 'Joven Sora', image: '/enemies/monk_3.png', icon: '🧘', rank: '25 Kyu • Aprendiz' },
                { name: 'Joven Daiki', image: '/enemies/monk_4.png', icon: '🧘', rank: '22 Kyu • Aprendiz' },
                { name: 'Joven Kazuki', image: '/enemies/monk_5.png', icon: '🧘', rank: '20 Kyu • Intermedio' }
            ];

            const randomSages = [
                { name: 'Kenshin el Sabio', image: '/enemies/sage_1.png', icon: '📜', rank: '16 Kyu • Sabio' },
                { name: 'Nobunaga el Sabio', image: '/enemies/sage_2.png', icon: '📜', rank: '14 Kyu • Sabio' },
                { name: 'Masashi el Sabio', image: '/enemies/sage_3.png', icon: '📜', rank: '12 Kyu • Maestro' },
                { name: 'Tetsuo el Sabio', image: '/enemies/sage_4.png', icon: '📜', rank: '10 Kyu • Maestro' },
                { name: 'Genzaburo el Sabio', image: '/enemies/sage_5.png', icon: '📜', rank: '8 Kyu • Maestro' }
            ];

            const chosenSage = randomSages[Math.floor(Math.random() * randomSages.length)];
            const chosenMonk = randomMonks[Math.floor(Math.random() * randomMonks.length)];

            let aiImage = chosenSage.image;
            let aiIcon = chosenSage.icon;
            let aiName = chosenSage.name;
            let aiRank = chosenSage.rank;

            if (difficulty === 'easy') {
                aiImage = chosenMonk.image;
                aiIcon = chosenMonk.icon;
                aiName = chosenMonk.name;
                aiRank = chosenMonk.rank;
            } else if (difficulty === 'hard') {
                aiImage = '/enemies/samurai.png';
                aiIcon = '⚔️';
                aiName = 'Samurái Ronin';
                aiRank = '4 Kyu • Avanzado';
            } else if (difficulty === 'dan') {
                aiImage = '/enemies/boss.png';
                aiIcon = '👑';
                aiName = 'Gran Maestro Zen';
                aiRank = '2 Dan • Maestro KataGo';
            }

            if (eImg) eImg.src = aiImage;
            if (eIcon) eIcon.innerText = aiIcon;
            if (eName) eName.innerText = aiName;
            if (eRank) eRank.innerText = aiRank;
        } else {
            const pImg = document.getElementById('duel-player-img') as HTMLImageElement | null;
            const pIcon = document.getElementById('duel-player-icon-badge');
            const pName = document.getElementById('duel-player-name');
            const pTitle = document.getElementById('duel-player-title');

            const eImg = document.getElementById('duel-enemy-img') as HTMLImageElement | null;
            const eIcon = document.getElementById('duel-enemy-icon-badge');
            const eName = document.getElementById('duel-enemy-name');
            const eRank = document.getElementById('duel-enemy-rank');

            if (gameMode === 'online') {
                const myColor = NetworkManager.assignedColor || 1;
                const oppColor = (myColor === 1 ? 2 : 1) as PlayerId;
                const guestHeroes = NetworkManager.currentConfig?.guestHeroes || {};
                const myHeroKey = heroId || (myColor === 1 ? NetworkManager.currentConfig?.hostHero : guestHeroes[myColor]) || 'normal';
                const oppHeroKey = (oppColor === 1 ? NetworkManager.currentConfig?.hostHero : guestHeroes[oppColor]) || 'kitsune';

                const myHero = RoguelikeRunManager.HEROES[myHeroKey as HeroId] || RoguelikeRunManager.HEROES['normal'];
                const oppHero = RoguelikeRunManager.HEROES[oppHeroKey as HeroId] || RoguelikeRunManager.HEROES['kitsune'];

                if (pImg && myHero) {
                    pImg.src = myHero.image;
                    pImg.classList.toggle('hero-normal-img', myHeroKey === 'normal');
                }
                if (pIcon && myHero) pIcon.innerText = myHero.icon;
                if (pName && myHero) pName.innerText = `${myHero.name} (Tú)`;
                if (pTitle) pTitle.innerText = myColor === 1 ? 'Negras ⚫' : 'Blancas ⚪';

                if (eImg && oppHero) {
                    eImg.src = oppHero.image;
                    eImg.classList.toggle('hero-normal-img', oppHeroKey === 'normal');
                }
                if (eIcon && oppHero) eIcon.innerText = oppHero.icon;
                if (eName && oppHero) eName.innerText = `${oppHero.name} (Rival)`;
                if (eRank) eRank.innerText = oppColor === 1 ? 'Negras ⚫' : 'Blancas ⚪';
            } else {
                if (heroId) {
                    const hero = RoguelikeRunManager.HEROES[heroId];
                    if (pImg && hero) {
                        pImg.src = hero.image;
                        pImg.classList.toggle('hero-normal-img', heroId === 'normal');
                    }
                    if (pIcon && hero) pIcon.innerText = hero.icon;
                    if (pName && hero) pName.innerText = hero.name;
                    if (pTitle) pTitle.innerText = '';
                } else {
                    if (pImg) {
                        pImg.src = '/heroes/normal.png';
                        pImg.classList.add('hero-normal-img');
                    }
                    if (pIcon) pIcon.innerText = '👤';
                    if (pName) pName.innerText = 'Jugador 1';
                    if (pTitle) pTitle.innerText = '';
                }

                if (eImg) eImg.src = '/heroes/kitsune.png';
                if (eIcon) eIcon.innerText = '🦊';
                if (eName) eName.innerText = 'Jugador 2';
                if (eRank) eRank.innerText = 'Blancas ⚪';
            }
        }
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
