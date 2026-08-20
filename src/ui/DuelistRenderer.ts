import type { PlayerId, AIDifficulty, HeroId, EnemyHeroId } from '../types';
import { RoguelikeRunManager } from '../core/RoguelikeRunManager';
import { TutorialManager } from '../tutorial/TutorialManager';
import { NetworkManager } from '../network/NetworkManager';
import { GameState } from '../core/GameState';
import { t, translateEnemyName, getLanguage } from '../i18n/i18n';

export class DuelistRenderer {
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

        const is4Player = state ? state.playerCount === 4 : false;

        if (is4Player && multiEnemyCard) {
            this.render4PlayerDuelists(playerCard, enemyCard, multiEnemyCard, heroId, gameMode, state, enemyHeroIds);
            return;
        }

        // === MODO 2 JUGADORES, ROGUELIKE O 1v1 / 1vIA ===
        this.render2PlayerDuelists(playerCard, enemyCard, multiEnemyCard, isRoguelike, heroId, node, gameMode, difficulty, aiHeroId, rivalImage, rivalName, rivalIcon);
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
        const p1HeroId = heroId || 'normal';
        const hero = RoguelikeRunManager.HEROES[p1HeroId] || RoguelikeRunManager.HEROES['normal'];
        if (pImg && hero) {
            pImg.src = hero.image;
            pImg.classList.toggle('hero-normal-img', p1HeroId === 'normal');
        }
        if (pIcon && hero) pIcon.innerText = hero.icon;
        if (pName && hero) {
            const hName = t(`champion.${p1HeroId}.name`) || hero.name;
            pName.innerText = gameMode === '1via' ? hName : `${hName} (${t('hud.player_num', { num: 1 })})`;
        }

        let configEnemyHeroIds: Record<number, any> = enemyHeroIds || {};

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
                if (gameMode === '1via') {
                    nameEl.innerText = hId === 'normal' ? `IA (P${pid})` : `${champName} (IA)`;
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
        aiHeroId?: EnemyHeroId | null,
        rivalImage?: string,
        rivalName?: string,
        rivalIcon?: string
    ) {
        if (multiEnemyCard) multiEnemyCard.classList.add('hidden');
        playerCard.classList.remove('hidden');
        enemyCard.classList.remove('hidden');

        const roleTag = playerCard.querySelector('.duel-role-tag') as HTMLElement | null;
        if (roleTag) roleTag.innerText = t('hud.role_you_champion');

        const enemyRoleTag = enemyCard.querySelector('.duel-role-tag') as HTMLElement | null;
        if (enemyRoleTag) enemyRoleTag.innerText = t('hud.role_rival');

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

            const eImg = document.getElementById('duel-enemy-img') as HTMLImageElement | null;
            const eIcon = document.getElementById('duel-enemy-icon-badge');
            const eName = document.getElementById('duel-enemy-name');
            const eRank = document.getElementById('duel-enemy-rank');

            const bConfig = node?.battleConfig;
            if (eImg) eImg.src = bConfig?.enemyImage || './enemies/monk_1.png';
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

            const eImg = document.getElementById('duel-enemy-img') as HTMLImageElement | null;
            const eIcon = document.getElementById('duel-enemy-icon-badge');
            const eName = document.getElementById('duel-enemy-name');
            const eRank = document.getElementById('duel-enemy-rank');

            const randomMonks = [
                { name: 'Joven Ren', image: './enemies/monk_1.png', icon: '🧘', rank: '30 Kyu' },
                { name: 'Joven Hiro', image: './enemies/monk_2.png', icon: '🧘', rank: '28 Kyu' },
                { name: 'Joven Sora', image: './enemies/monk_3.png', icon: '🧘', rank: '25 Kyu' },
                { name: 'Joven Daiki', image: './enemies/monk_4.png', icon: '🧘', rank: '22 Kyu' },
                { name: 'Joven Kazuki', image: './enemies/monk_5.png', icon: '🧘', rank: '20 Kyu' }
            ];

            const randomSages = [
                { name: 'Kenshin el Sabio', image: './enemies/sage_1.png', icon: '📜', rank: '16 Kyu' },
                { name: 'Nobunaga el Sabio', image: './enemies/sage_2.png', icon: '📜', rank: '14 Kyu' },
                { name: 'Masashi el Sabio', image: './enemies/sage_3.png', icon: '📜', rank: '12 Kyu' },
                { name: 'Tetsuo el Sabio', image: './enemies/sage_4.png', icon: '📜', rank: '10 Kyu' },
                { name: 'Genzaburo el Sabio', image: './enemies/sage_5.png', icon: '📜', rank: '8 Kyu' }
            ];

            const chosenSage = randomSages[Math.floor(Math.random() * randomSages.length)];
            const chosenMonk = randomMonks[Math.floor(Math.random() * randomMonks.length)];

            let aiImage = chosenSage.image;
            let aiIcon = chosenSage.icon;
            let aiName = chosenSage.name;
            let aiRank = chosenSage.rank;

            // Si el caller provee imagen/nombre de rival (monje o sabio elegido en setup), usarlos directamente
            if (rivalImage) {
                aiImage = rivalImage;
                aiIcon = rivalIcon || '🧘';
                aiName = rivalName || 'Rival';
                aiRank = difficulty === 'easy' ? '25 Kyu' : '16 Kyu';
                enemyCard.setAttribute('data-hero', 'none');
            } else if (aiHeroId === 'boss' || (difficulty as any) === 'dan') {
                aiImage = './enemies/boss.png';
                aiIcon = '👑';
                aiName = `🐉 ${t('champion.boss.name')}`;
                aiRank = '2 Dan Pro';
                enemyCard.setAttribute('data-hero', 'boss');
            } else if (aiHeroId && aiHeroId !== 'normal') {
                const oppHero = RoguelikeRunManager.HEROES[aiHeroId as HeroId];
                if (oppHero) {
                    aiImage = oppHero.image;
                    aiIcon = oppHero.icon;
                    aiName = t(`champion.${aiHeroId}.name`) || oppHero.name;
                    aiRank = (difficulty as any) === 'dan' ? '2 Dan Pro' : (difficulty === 'hard' ? '4 Kyu' : (difficulty === 'medium' ? '16 Kyu' : '25 Kyu'));
                    enemyCard.setAttribute('data-hero', aiHeroId);
                }
            } else if (difficulty === 'easy') {
                aiImage = chosenMonk.image;
                aiIcon = chosenMonk.icon;
                aiName = chosenMonk.name;
                aiRank = chosenMonk.rank;
                enemyCard.setAttribute('data-hero', 'none');
            } else if (difficulty === 'hard') {
                aiImage = chosenSage.image;
                aiIcon = chosenSage.icon;
                aiName = chosenSage.name;
                aiRank = chosenSage.rank;
                enemyCard.setAttribute('data-hero', 'none');
            }

            const eSkillBadge = document.getElementById('duel-enemy-skill-badge');
            const eSkillIcon = document.getElementById('duel-enemy-skill-icon');
            const eSkillText = document.getElementById('duel-enemy-skill-text');

            if (eImg) {
                eImg.src = aiImage;
                eImg.classList.toggle('hero-boss-img', enemyCard.getAttribute('data-hero') === 'boss' || difficulty === 'dan');
                eImg.classList.toggle('hero-normal-img', enemyCard.getAttribute('data-hero') === 'normal');
            }
            if (eIcon) eIcon.innerText = aiIcon;
            if (eName) eName.innerText = translateEnemyName(aiName);
            if (eRank) eRank.innerText = aiRank;

            // Renderizar placa de habilidad única del rival si posee poderes especiales
            if (eSkillBadge && eSkillIcon && eSkillText) {
                const isEn = getLanguage() === 'en';
                const currentEnemyHero = enemyCard.getAttribute('data-hero');
                if (currentEnemyHero === 'boss' || difficulty === 'dan') {
                    eSkillBadge.classList.remove('hidden');
                    eSkillIcon.innerText = '🐉';
                    eSkillText.innerText = isEn ? 'Calcinating Breath' : 'Aliento Calcinante';
                    eSkillBadge.title = isEn 
                        ? '🐉 Calcinating Breath: Incinerates 25% of the board in a corner quadrant.' 
                        : '🐉 Aliento Calcinante: Calcina el 25% del tablero en una esquina.';
                } else if (currentEnemyHero && currentEnemyHero !== 'none' && currentEnemyHero !== 'normal') {
                    eSkillBadge.classList.remove('hidden');
                    const heroSkillMap: Record<string, { icon: string; nameEs: string; nameEn: string; descEs: string; descEn: string }> = {
                        kitsune: { icon: '🦊', nameEs: 'Escudo Divino', nameEn: 'Divine Shield', descEs: 'Protege piedras clave haciéndolas inmunes a capturas.', descEn: 'Protects key stones making them immune to capture.' },
                        tengu: { icon: '👺', nameEs: 'Lluvia Meteórica', nameEn: 'Meteor Strike', descEs: 'Arrasa un área de piedras enemigas con meteoritos.', descEn: 'Devastates enemy stones with a falling meteor shower.' },
                        ryujin: { icon: '🐉', nameEs: 'Furia del Dragón', nameEn: 'Dragon Fury', descEs: 'Quema piedras rivales inmediatamente al consolidar ojos.', descEn: 'Incinerates enemy stones when making eyes.' },
                        ronin: { icon: '🗡️', nameEs: 'Tajo del Samurai', nameEn: 'Samurai Slash', descEs: 'Transmuta piedras enemigas al instante con precisión de acero.', descEn: 'Transmutes enemy stones instantly with steel precision.' },
                        alchemist: { icon: '⚗️', nameEs: 'Inversión Cromática', nameEn: 'Chromatic Inversion', descEs: 'Transmuta piedras enemigas sin ceder el turno.', descEn: 'Transmutes enemy stones without yielding turn.' },
                        himiko: { icon: '👑', nameEs: 'Lluvia Pétrea', nameEn: 'Stone Rain', descEs: 'Invoca refuerzos masivos celestiales sobre el Goban.', descEn: 'Summons celestial stone reinforcements onto the Goban.' }
                    };
                    const sInfo = heroSkillMap[currentEnemyHero];
                    if (sInfo) {
                        eSkillIcon.innerText = sInfo.icon;
                        eSkillText.innerText = isEn ? sInfo.nameEn : sInfo.nameEs;
                        eSkillBadge.title = isEn ? `${sInfo.icon} ${sInfo.nameEn}: ${sInfo.descEn}` : `${sInfo.icon} ${sInfo.nameEs}: ${sInfo.descEs}`;
                    } else {
                        eSkillBadge.classList.add('hidden');
                    }
                } else {
                    eSkillBadge.classList.add('hidden');
                }
            }
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

                playerCard.setAttribute('data-hero', myHeroKey);
                enemyCard.setAttribute('data-hero', oppHeroKey);

                const myHero = RoguelikeRunManager.HEROES[myHeroKey as HeroId] || RoguelikeRunManager.HEROES['normal'];
                const oppHero = RoguelikeRunManager.HEROES[oppHeroKey as HeroId] || RoguelikeRunManager.HEROES['kitsune'];

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
            } else {
                // 1v1 Local Mode
                const p1HeroId = heroId || 'normal';
                const p1Hero = RoguelikeRunManager.HEROES[p1HeroId] || RoguelikeRunManager.HEROES['normal'];
                if (pImg && p1Hero) {
                    pImg.src = p1Hero.image;
                    pImg.classList.toggle('hero-normal-img', p1HeroId === 'normal');
                }
                if (pIcon && p1Hero) pIcon.innerText = p1Hero.icon;
                if (pName && p1Hero) pName.innerText = `${t(`champion.${p1HeroId}.name`) || p1Hero.name} (${t('hud.player_num', { num: 1 })})`;
                if (pTitle) pTitle.innerText = t('hud.player_black');

                const p2HeroId = (aiHeroId as HeroId) || (rivalName ? 'normal' : 'normal');
                const p2Hero = RoguelikeRunManager.HEROES[p2HeroId] || RoguelikeRunManager.HEROES['normal'];
                if (eImg && p2Hero) {
                    eImg.src = rivalImage || p2Hero.image;
                    eImg.classList.toggle('hero-normal-img', p2HeroId === 'normal');
                }
                if (eIcon && p2Hero) eIcon.innerText = rivalIcon || p2Hero.icon;
                if (eName && p2Hero) eName.innerText = rivalName ? translateEnemyName(rivalName) : `${t(`champion.${p2HeroId}.name`) || p2Hero.name} (${t('hud.player_num', { num: 2 })})`;
                if (eRank) eRank.innerText = t('hud.player_white');
            }
        }
    }
}
