import type { PlayerId, AIDifficulty, HeroId, EnemyHeroId } from '../types';
import { RoguelikeRunManager } from '../core/RoguelikeRunManager';
import { TutorialManager } from '../tutorial/TutorialManager';
import { NetworkManager } from '../network/NetworkManager';
import { GameState } from '../core/GameState';
import { ChampionManager } from '../core/ChampionManager';
import { t, translateEnemyName, getLanguage } from '../i18n/i18n';

export class DuelistRenderer {
    public static formatRankDisplay(diff?: string): string {
        if (!diff) return '15 Kyu';
        const d = diff.toLowerCase().trim();
        if (d === 'easy') return '25 Kyu';
        if (d === 'medium' || d === 'normal') return '15 Kyu';
        if (d === 'hard') return '5 Kyu';
        if (d === 'extreme' || d === 'dan' || d === 'grandmaster') return '1 Dan';
        if (d.endsWith('k')) {
            const num = d.replace('k', '');
            return `${num} Kyu`;
        }
        if (d.endsWith('d')) {
            const num = d.replace('d', '');
            return `${num} Dan`;
        }
        return diff;
    }

    public static updateDuelists(
        isRoguelike: boolean,
        heroId?: HeroId,
        node?: any,
        gameMode?: string,
        difficulty?: AIDifficulty,
        state?: GameState,
        aiHeroId?: EnemyHeroId | null,
        rivalImage?: string,
        rivalName?: string,
        rivalIcon?: string,
        enemyHeroIds?: Record<number, any>
    ) {
        const playerCard = document.getElementById('duel-player-card');
        const enemyCard = document.getElementById('duel-enemy-card');
        const multiEnemyCard = document.getElementById('duel-multi-enemies-card');

        if (!playerCard || !enemyCard) return;

        if (TutorialManager.isActive) {
            this.renderTutorialDuelists(playerCard, enemyCard, multiEnemyCard, heroId);
            return;
        }

        if (gameMode === 'story') {
            playerCard.classList.add('hidden');
            enemyCard.classList.add('hidden');
            if (multiEnemyCard) multiEnemyCard.classList.add('hidden');
            return;
        }

        const is4Player = state ? state.playerCount === 4 : false;

        if (is4Player && multiEnemyCard) {
            this.render4PlayerDuelists(playerCard, enemyCard, multiEnemyCard, heroId, gameMode, state, enemyHeroIds);
            return;
        }

        // === MODO 2 JUGADORES, ROGUELIKE O 1v1 / 1vIA ===
        this.render2PlayerDuelists(playerCard, enemyCard, multiEnemyCard, isRoguelike, heroId, node, gameMode, difficulty, state, aiHeroId, rivalImage, rivalName, rivalIcon);
    }

    private static render4PlayerDuelists(
        playerCard: HTMLElement,
        enemyCard: HTMLElement,
        multiEnemyCard: HTMLElement,
        heroId?: HeroId,
        gameMode?: string,
        state?: GameState,
        enemyHeroIds?: Record<number, any>
    ) {
        enemyCard.classList.add('hidden');
        multiEnemyCard.classList.remove('hidden');
        playerCard.classList.remove('hidden');

        const pImg = document.getElementById('duel-player-img') as HTMLImageElement | null;
        const pIcon = document.getElementById('duel-player-icon-badge');
        const pName = document.getElementById('duel-player-name');
        const roleTag = playerCard.querySelector('.duel-role-tag') as HTMLElement | null;

        const activeP = state?.currentPlayer || 1;

        if (roleTag) {
            roleTag.innerText = gameMode === '1via' ? t('hud.role_you_champion') : t('hud.role_current_turn', { player: activeP });
        }

        // Player 1 (Left Standee)
        let p1HeroId = heroId || 'normal';
        const configEnemyHeroIds = enemyHeroIds || {};

        if (gameMode === 'online' && NetworkManager.currentConfig) {
            const hostColor = NetworkManager.currentConfig.hostColor || 1;
            const guestHeroes = NetworkManager.currentConfig.guestHeroes || {};
            p1HeroId = (hostColor === 1 ? NetworkManager.currentConfig.hostHero : guestHeroes[1]) || 'normal';
            
            [2, 3, 4].forEach(pid => {
                configEnemyHeroIds[pid] = (hostColor === pid ? NetworkManager.currentConfig!.hostHero : guestHeroes[pid as PlayerId]) || 'normal';
            });
        }

        const hero = RoguelikeRunManager.HEROES[p1HeroId as HeroId] || RoguelikeRunManager.HEROES['normal'];
        if (pImg && hero) {
            pImg.src = hero.image;
            pImg.classList.toggle('hero-normal-img', p1HeroId === 'normal');
        }
        if (pIcon && hero) pIcon.innerText = hero.icon;
        if (pName && hero) {
            const hName = t(`champion.${p1HeroId}.name`) || hero.name;
            pName.innerText = gameMode === '1via' ? hName : `${hName} (${t('hud.player_num', { num: 1 })})`;
        }

        // Mapeo dinámico de posiciones de rotación en 4P:
        // El jugador activo está al frente (pos-front); el siguiente en turno rota atrás a la derecha (pos-back-right); el otro atrás a la izquierda (pos-back-left).
        const positionClasses: Record<number, Record<number, string>> = {
            1: { 2: 'pos-front', 3: 'pos-back-right', 4: 'pos-back-left' },
            2: { 2: 'pos-front', 3: 'pos-back-right', 4: 'pos-back-left' },
            3: { 3: 'pos-front', 4: 'pos-back-right', 2: 'pos-back-left' },
            4: { 4: 'pos-front', 2: 'pos-back-right', 3: 'pos-back-left' },
        };
        const currentPositions = positionClasses[activeP] || positionClasses[1];

        // Update P2, P3, P4
        [2, 3, 4].forEach(pid => {
            const card = document.getElementById(`duel-p${pid}-card`);
            const img = document.getElementById(`duel-p${pid}-img`) as HTMLImageElement | null;
            const nameEl = document.getElementById(`duel-p${pid}-name`);
            const isTurn = activeP === pid;

            if (card) {
                card.classList.remove('pos-front', 'pos-back-right', 'pos-back-left', 'active-turn');
                const posClass = currentPositions[pid] || 'pos-front';
                card.classList.add(posClass);
                if (isTurn) {
                    card.classList.add('active-turn');
                }
            }

            let hId = configEnemyHeroIds[pid] || 'normal';
            if (hId === 'random' || hId === 'random_monk' || hId === 'random_sage') {
                hId = 'normal';
            }

            const enemyHero = RoguelikeRunManager.HEROES[hId as HeroId] || RoguelikeRunManager.HEROES['normal'];
            
            if (img) {
                img.src = enemyHero.image;
                img.classList.toggle('hero-normal-img', hId === 'normal');
            }
            
            if (nameEl) {
                const champName = t(`champion.${hId}.name`) || enemyHero.name;
                if (gameMode === '1via' || gameMode === 'aivsai') {
                    const slotDiff = (state as any)?.config?.slots?.[pid]?.aiDifficulty || (state as any)?.config?.difficulty || '30k';
                    const formattedDiff = DuelistRenderer.formatRankDisplay(slotDiff);
                    nameEl.innerText = `${champName} (IA • ${formattedDiff})`;
                } else {
                    nameEl.innerText = `${champName} (${t('hud.player_num', { num: pid })})`;
                }
            }
        });
    }

    private static renderTutorialDuelists(
        playerCard: HTMLElement,
        enemyCard: HTMLElement,
        multiEnemyCard: HTMLElement | null,
        heroId?: HeroId
    ) {
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
            if (roleTag) roleTag.innerText = t('hud.role_you_champion');
            if (pImg && hero) {
                pImg.src = hero.image;
                pImg.classList.remove('hero-normal-img');
            }
            if (pIcon && hero) pIcon.innerText = hero.icon;
            if (pName && hero) pName.innerText = t(`champion.${currentTutorialHero}.name`) || hero.name;
            if (pTitle) pTitle.innerText = '';
        } else {
            if (roleTag) roleTag.innerText = t('hud.role_you_apprentice');
            if (pImg) {
                pImg.src = './heroes/normal.png';
                pImg.classList.add('hero-normal-img');
            }
            if (pIcon) pIcon.innerText = '🥋';
            if (pName) pName.innerText = t('champion.normal.name');
            if (pTitle) pTitle.innerText = '';
        }

        const pSub = document.getElementById('duel-player-sub');
        if (pSub) {
            const isEn = getLanguage() === 'en';
            pSub.innerText = isEn ? 'Dojo Apprentice • Fundamentals' : 'Aprendiz del Dojo • Fundamentos';
            pSub.classList.remove('hidden');
        }

        const enemyRoleTag = enemyCard.querySelector('.duel-role-tag') as HTMLElement | null;
        if (enemyRoleTag) enemyRoleTag.innerText = t('hud.role_dojo_master');

        const eImg = document.getElementById('duel-enemy-img') as HTMLImageElement | null;
        const eIcon = document.getElementById('duel-enemy-icon-badge');
        const eName = document.getElementById('duel-enemy-name');
        const eRank = document.getElementById('duel-enemy-rank');

        if (eImg) eImg.src = './enemies/sage_1.png';
        if (eIcon) eIcon.innerText = '📜';
        if (eName) eName.innerText = 'Sensei Hiroshi';
        if (eRank) eRank.innerText = '9 Dan • Dojo Master';
    }

    private static render2PlayerDuelists(
        playerCard: HTMLElement,
        enemyCard: HTMLElement,
        multiEnemyCard: HTMLElement | null,
        isRoguelike: boolean,
        heroId?: HeroId,
        node?: any,
        gameMode?: string,
        difficulty?: AIDifficulty,
        state?: GameState,
        aiHeroId?: EnemyHeroId | null,
        rivalImage?: string,
        rivalName?: string,
        rivalIcon?: string
    ) {
        if (multiEnemyCard) multiEnemyCard.classList.add('hidden');
        playerCard.classList.remove('hidden');
        enemyCard.classList.remove('hidden');

        const roleTag = playerCard.querySelector('.duel-role-tag') as HTMLElement | null;
        if (roleTag) {
            roleTag.innerText = gameMode === 'aivsai' ? '🤖 IA Negra (P1)' : t('hud.role_you_champion');
        }

        const enemyRoleTag = enemyCard.querySelector('.duel-role-tag') as HTMLElement | null;
        if (enemyRoleTag) {
            enemyRoleTag.innerText = gameMode === 'aivsai' ? '🤖 IA Blanca (P2)' : t('hud.role_rival');
        }

        const activeHeroId = heroId || (isRoguelike ? 'normal' : null);
        playerCard.setAttribute('data-hero', activeHeroId || 'none');
        playerCard.classList.toggle('hero-normal', activeHeroId === 'normal');

        const activeEnemyHeroId = aiHeroId || (isRoguelike ? (node?.battleConfig?.enemyHeroId || 'none') : 'none');
        enemyCard.setAttribute('data-hero', activeEnemyHeroId);
        enemyCard.classList.toggle('hero-normal', activeEnemyHeroId === 'normal');

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
            if (pName && hero) pName.innerText = t(`champion.${targetHero}.name`) || hero.name;
            if (pTitle) pTitle.innerText = '';

            const pSub = document.getElementById('duel-player-sub');
            if (pSub) {
                const isEn = getLanguage() === 'en';
                if (targetHero === 'normal') {
                    pSub.innerText = isEn ? '2 Rewinds' : '2 Rebobinares';
                    pSub.classList.remove('hidden');
                } else {
                    pSub.classList.add('hidden');
                }
            }

            const eImg = document.getElementById('duel-enemy-img') as HTMLImageElement | null;
            const eIcon = document.getElementById('duel-enemy-icon-badge');
            const eName = document.getElementById('duel-enemy-name');
            const eRank = document.getElementById('duel-enemy-rank');

            const bConfig = node?.battleConfig;
            if (eImg) eImg.src = bConfig?.enemyImage || './enemies/sage_1.png';
            if (eIcon) eIcon.innerText = bConfig?.enemyIcon || '🧘';
            if (eName) eName.innerText = translateEnemyName(bConfig?.enemyName || t('hud.player_rival'));
            if (eRank) {
                const shapeKey = bConfig?.shape ? `wizard.shape_${bConfig.shape}` : 'wizard.shape_square';
                const shapeText = t(shapeKey) || bConfig?.shape || 'square';
                eRank.innerText = node?.type === 'boss'
                    ? `👑 ${t('champion.boss.name')} • ${t('champion.boss.active_name')}`
                    : `${bConfig?.rankLabel || '30 Kyu'} • ${shapeText}`;
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
                    const container = pImg.closest('.duel-standee-player');
                    if (container) container.setAttribute('data-hero', heroId);
                }
                if (pIcon && hero) pIcon.innerText = hero.icon;
                if (pName && hero) pName.innerText = t(`champion.${heroId}.name`) || hero.name;
                if (pTitle) pTitle.innerText = '';
            } else {
                if (pImg) {
                    pImg.src = './heroes/normal.png';
                    pImg.classList.add('hero-normal-img');
                    const container = pImg.closest('.duel-standee-player');
                    if (container) container.setAttribute('data-hero', 'normal');
                }
                if (pIcon) pIcon.innerText = '👤';
                if (pName) pName.innerText = `${t('hud.player_you')}`;
                if (pTitle) pTitle.innerText = '';
            }

            const pSub = document.getElementById('duel-player-sub');
            if (pSub) {
                const isEn = getLanguage() === 'en';
                if (!heroId || heroId === 'normal') {
                    pSub.innerText = isEn ? '2 Rewinds' : '2 Rebobinares';
                    pSub.classList.remove('hidden');
                } else {
                    pSub.classList.add('hidden');
                }
            }

            const eImg = document.getElementById('duel-enemy-img') as HTMLImageElement | null;
            const eIcon = document.getElementById('duel-enemy-icon-badge');
            const eName = document.getElementById('duel-enemy-name');
            const eRank = document.getElementById('duel-enemy-rank');

            const randomMonks = [
                { name: 'Monje Sabio', image: './enemies/sage_1.png', icon: '📜', rank: '30 Kyu' }
            ];

            const randomSages = [
                { name: 'Monje Sabio', image: './enemies/sage_1.png', icon: '📜', rank: '10 Kyu' }
            ];

            const chosenSage = randomSages[0];
            const chosenMonk = randomMonks[0];

            let aiImage = chosenSage.image;
            let aiIcon = chosenSage.icon;
            let aiName = chosenSage.name;
            let aiRank = chosenSage.rank;

            // Si el caller provee imagen/nombre de rival (monje o sabio elegido en setup), usarlos directamente
            const formattedDiff = DuelistRenderer.formatRankDisplay(difficulty);
            if (rivalImage) {
                aiImage = rivalImage;
                aiIcon = rivalIcon || '🧘';
                aiName = rivalName || 'Rival';
                aiRank = formattedDiff;
                enemyCard.setAttribute('data-hero', 'none');
            } else if (aiHeroId === 'boss' || (difficulty as any) === 'dan') {
                aiImage = './enemies/boss.png';
                aiIcon = '👑';
                aiName = `🐉 ${t('champion.boss.name')}`;
                aiRank = formattedDiff.includes('Dan') ? formattedDiff : '9 Dan';
                enemyCard.setAttribute('data-hero', 'boss');
            } else if (aiHeroId && aiHeroId !== 'normal') {
                const oppHero = RoguelikeRunManager.HEROES[aiHeroId as HeroId];
                if (oppHero) {
                    aiImage = oppHero.image;
                    aiIcon = oppHero.icon;
                    aiName = t(`champion.${aiHeroId}.name`) || oppHero.name;
                    aiRank = formattedDiff;
                    enemyCard.setAttribute('data-hero', aiHeroId);
                }
            } else if (difficulty === 'easy') {
                aiImage = chosenMonk.image;
                aiIcon = chosenMonk.icon;
                aiName = chosenMonk.name;
                aiRank = formattedDiff;
                enemyCard.setAttribute('data-hero', 'none');
            } else if (difficulty === 'hard') {
                aiImage = chosenSage.image;
                aiIcon = chosenSage.icon;
                aiName = chosenSage.name;
                aiRank = formattedDiff;
                enemyCard.setAttribute('data-hero', 'none');
            } else {
                aiRank = formattedDiff;
            }

            if (eImg) {
                eImg.src = aiImage;
                eImg.classList.toggle('hero-boss-img', enemyCard.getAttribute('data-hero') === 'boss' || difficulty === 'dan');
                eImg.classList.toggle('hero-normal-img', enemyCard.getAttribute('data-hero') === 'normal');
            }
            if (eIcon) eIcon.innerText = aiIcon;
            if (eName) eName.innerText = translateEnemyName(aiName);
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
                const hostColor = NetworkManager.currentConfig?.hostColor || 1;
                const oppColor = (myColor === 1 ? 2 : 1) as PlayerId;
                const guestHeroes = NetworkManager.currentConfig?.guestHeroes || {};
                const myHeroKey = heroId || (myColor === hostColor ? NetworkManager.currentConfig?.hostHero : guestHeroes[myColor]) || 'normal';
                const oppHeroKey = (oppColor === hostColor ? NetworkManager.currentConfig?.hostHero : guestHeroes[oppColor]) || 'normal';

                playerCard.setAttribute('data-hero', myHeroKey);
                enemyCard.setAttribute('data-hero', oppHeroKey);

                const myHero = RoguelikeRunManager.HEROES[myHeroKey as HeroId] || RoguelikeRunManager.HEROES['normal'];
                const oppHero = RoguelikeRunManager.HEROES[oppHeroKey as HeroId] || RoguelikeRunManager.HEROES['normal'];

                if (pImg && myHero) {
                    pImg.src = myHero.image;
                    pImg.classList.toggle('hero-normal-img', myHeroKey === 'normal');
                }
                if (pIcon && myHero) pIcon.innerText = myHero.icon;
                if (pName && myHero) pName.innerText = `${t(`champion.${myHeroKey}.name`) || myHero.name} (${t('hud.player_you')})`;
                if (pTitle) pTitle.innerText = myColor === 1 ? t('hud.turn_black') : t('hud.turn_white');

                if (eImg && oppHero) {
                    eImg.src = oppHero.image;
                    eImg.classList.toggle('hero-normal-img', oppHeroKey === 'normal');
                }
                if (eIcon && oppHero) eIcon.innerText = oppHero.icon;
                if (eName && oppHero) eName.innerText = `${t(`champion.${oppHeroKey}.name`) || oppHero.name} (${t('hud.player_rival')})`;
                if (eRank) eRank.innerText = oppColor === 1 ? t('hud.turn_black') : t('hud.turn_white');

                const pSub = document.getElementById('duel-player-sub');
                if (pSub) {
                    const isEn = getLanguage() === 'en';
                    if (myHeroKey === 'normal') {
                        pSub.innerText = isEn ? '2 Rewinds' : '2 Rebobinares';
                        pSub.classList.remove('hidden');
                    } else {
                        pSub.classList.add('hidden');
                    }
                }
            } else {
                // 1v1 Local Mode or AI vs AI
                const p1HeroId = heroId || 'normal';
                const p1Hero = RoguelikeRunManager.HEROES[p1HeroId] || RoguelikeRunManager.HEROES['normal'];
                if (pImg && p1Hero) {
                    pImg.src = p1Hero.image;
                    pImg.classList.toggle('hero-normal-img', p1HeroId === 'normal');
                }
                if (pIcon && p1Hero) pIcon.innerText = p1Hero.icon;
                if (pName && p1Hero) {
                    const champName = t(`champion.${p1HeroId}.name`) || p1Hero.name;
                    pName.innerText = gameMode === 'aivsai' ? `${champName} (IA P1)` : `${champName} (${t('hud.player_num', { num: 1 })})`;
                }
                
                const cfg = (state as any)?.config || (window as any).GameController?.config;
                const pSub = document.getElementById('duel-player-sub');
                if (gameMode === 'aivsai') {
                    const p1Diff = cfg?.slots?.[1]?.aiDifficulty || cfg?.difficulty || difficulty || '30k';
                    const formattedP1Diff = DuelistRenderer.formatRankDisplay(p1Diff);
                    if (pSub) {
                        pSub.innerText = `⚫ ${t('hud.turn_black')} • ${formattedP1Diff}`;
                        pSub.classList.remove('hidden');
                    }
                } else {
                    if (pSub) {
                        const isEn = getLanguage() === 'en';
                        if (p1HeroId === 'normal') {
                            pSub.innerText = isEn ? '2 Rewinds' : '2 Rebobinares';
                            pSub.classList.remove('hidden');
                        } else {
                            pSub.classList.add('hidden');
                        }
                    }
                }

                const p2HeroId = (aiHeroId as HeroId) || (rivalName ? 'normal' : 'normal');
                const p2Hero = RoguelikeRunManager.HEROES[p2HeroId] || RoguelikeRunManager.HEROES['normal'];
                if (eImg && p2Hero) {
                    eImg.src = rivalImage || p2Hero.image;
                    eImg.classList.toggle('hero-normal-img', p2HeroId === 'normal');
                }
                if (eIcon && p2Hero) eIcon.innerText = rivalIcon || p2Hero.icon;
                if (eName && p2Hero) {
                    const champName = t(`champion.${p2HeroId}.name`) || p2Hero.name;
                    if (rivalName) {
                        eName.innerText = translateEnemyName(rivalName);
                    } else if (gameMode === 'aivsai') {
                        eName.innerText = `${champName} (IA P2)`;
                    } else {
                        eName.innerText = `${champName} (${t('hud.player_num', { num: 2 })})`;
                    }
                }
                if (gameMode === 'aivsai') {
                    const p2Diff = cfg?.slots?.[2]?.aiDifficulty || cfg?.difficulty || difficulty;
                    if (eRank) eRank.innerText = `⚪ ${t('hud.turn_white')} • ${DuelistRenderer.formatRankDisplay(p2Diff)}`;
                } else {
                    if (eRank) eRank.innerText = t('hud.player_white');
                }
            }
        }
        
        this.renderEnemySkillBadge(enemyCard, difficulty);
    }

    private static renderEnemySkillBadge(enemyCard: HTMLElement, difficulty?: AIDifficulty) {
        const eSkillBadge = document.getElementById('duel-enemy-skill-badge');
        const eSkillIcon = document.getElementById('duel-enemy-skill-icon');
        const eSkillText = document.getElementById('duel-enemy-skill-text');

        if (!eSkillBadge || !eSkillText) return;

        const isEn = getLanguage() === 'en';
        const currentEnemyHero = enemyCard.getAttribute('data-hero');

        if (eSkillIcon) {
            eSkillIcon.style.display = 'none'; // El contenido enriquecido se renderiza en eSkillText
        }

        if (currentEnemyHero === 'boss' || difficulty === 'dan') {
            eSkillBadge.classList.remove('hidden');
            const name = isEn ? 'Calcinating Breath' : 'Aliento Calcinante';
            const formula = isEn ? 'Incinerates 25% corner quadrant' : 'Calcina el 25% del tablero en una esquina';
            eSkillText.innerHTML = `<span class="duel-skill-name">🐉 ${name}</span><span class="duel-skill-formula">${formula}</span>`;
            eSkillBadge.title = `🐉 ${name}: ${formula}`;
        } else if (currentEnemyHero && currentEnemyHero !== 'none' && currentEnemyHero !== 'normal') {
            eSkillBadge.classList.remove('hidden');
            const hero = RoguelikeRunManager.HEROES[currentEnemyHero as HeroId];
            const activeSkill = ChampionManager.ACTIVE_SKILLS[currentEnemyHero as HeroId];
            const passiveSkill = ChampionManager.PASSIVE_SKILLS[currentEnemyHero as HeroId];
            
            let skillName = '';
            let combatFormula = '';
            let skillIcon = hero?.icon || '⚡';

            if (hero && hero.skillType === 'active' && activeSkill) {
                const rawSkillName = t(`champion.${currentEnemyHero}.active_name`) || activeSkill.name;
                skillName = rawSkillName.replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s*\(\d+\s*(?:uso|usos|use|uses)?\)/gi, '').trim();
                combatFormula = t(`champion.${currentEnemyHero}.combat_formula`) || t(`champion.${currentEnemyHero}.active_desc`) || activeSkill.description || '';
                skillIcon = activeSkill.icon;
            } else {
                skillName = t(`champion.${currentEnemyHero}.passive_name`) || passiveSkill?.name || 'Pasiva';
                combatFormula = t(`champion.${currentEnemyHero}.combat_formula`) || t(`champion.${currentEnemyHero}.passive_desc`) || passiveSkill?.description || '';
                skillIcon = hero?.icon || '⚡';
            }

            eSkillText.innerHTML = `<span class="duel-skill-name">${skillIcon} ${skillName}</span><span class="duel-skill-formula">${combatFormula}</span>`;
            eSkillBadge.title = `${skillIcon} ${skillName}: ${combatFormula}`;
        } else {
            eSkillBadge.classList.add('hidden');
        }
    }
}
