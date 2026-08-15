import type { PlayerId, AIDifficulty, HeroId } from '../types';
import { RoguelikeRunManager } from '../core/RoguelikeRunManager';
import { TutorialManager } from '../tutorial/TutorialManager';
import { NetworkManager } from '../network/NetworkManager';
import { GameState } from '../core/GameState';
import { t, getLanguage, translateEnemyName } from '../i18n/i18n';

export class DuelistRenderer {
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
            this.render4PlayerDuelists(playerCard, enemyCard, multiEnemyCard, gameMode, heroId, state);
            return;
        }

        // === MODO TUTORIAL / DOJO ===
        if (TutorialManager.isActive) {
            this.renderTutorialDuelists(playerCard, enemyCard, multiEnemyCard, heroId);
            return;
        }

        // === MODO 2 JUGADORES, ROGUELIKE O 1v1 / 1vIA ===
        this.render2PlayerDuelists(playerCard, enemyCard, multiEnemyCard, isRoguelike, heroId, node, gameMode, difficulty);
    }

    private static render4PlayerDuelists(
        playerCard: HTMLElement,
        enemyCard: HTMLElement,
        multiEnemyCard: HTMLElement,
        gameMode?: string,
        heroId?: HeroId,
        state?: GameState
    ) {
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
            if (roleTag) roleTag.innerText = t('hud.role_you_champion');
            if (heroId) {
                const hero = RoguelikeRunManager.HEROES[heroId];
                if (pImg && hero) pImg.src = hero.image;
                if (pIcon && hero) pIcon.innerText = hero.icon;
                if (pName && hero) pName.innerText = t(`champion.${heroId}.name`) || hero.name;
                if (pTitle) pTitle.innerText = `⚫ ${t('hud.player_black')} (${t('hud.player_num', { num: 1 })})`;
            } else {
                if (pImg) pImg.src = '/heroes/ronin.png';
                if (pIcon) pIcon.innerText = '⚫';
                if (pName) pName.innerText = t('hud.player_you');
                if (pTitle) pTitle.innerText = `⚫ ${t('hud.player_black')} (${t('hud.player_num', { num: 1 })})`;
            }

            const isEn = getLanguage() === 'en';
            const randomMonk = [
                { name: translateEnemyName('Joven Ren'), avatar: '/enemies/monk_1.png', icon: '⚪', rank: `25 Kyu • ${isEn ? 'White AI' : 'IA Blanca'}` },
                { name: translateEnemyName('Joven Hiro'), avatar: '/enemies/monk_2.png', icon: '⚪', rank: `25 Kyu • ${isEn ? 'White AI' : 'IA Blanca'}` },
                { name: translateEnemyName('Joven Sora'), avatar: '/enemies/monk_3.png', icon: '⚪', rank: `25 Kyu • ${isEn ? 'White AI' : 'IA Blanca'}` },
                { name: translateEnemyName('Joven Daiki'), avatar: '/enemies/monk_4.png', icon: '⚪', rank: `25 Kyu • ${isEn ? 'White AI' : 'IA Blanca'}` },
                { name: translateEnemyName('Joven Kazuki'), avatar: '/enemies/monk_5.png', icon: '⚪', rank: `25 Kyu • ${isEn ? 'White AI' : 'IA Blanca'}` }
            ][Math.floor(Math.random() * 5)];

            const randomSage = [
                { name: translateEnemyName('Kenshin el Sabio'), avatar: '/enemies/sage_1.png', icon: '🟢', rank: `16 Kyu • ${isEn ? 'Green AI' : 'IA Verde'}` },
                { name: translateEnemyName('Nobunaga el Sabio'), avatar: '/enemies/sage_2.png', icon: '🟢', rank: `16 Kyu • ${isEn ? 'Green AI' : 'IA Verde'}` },
                { name: translateEnemyName('Masashi el Sabio'), avatar: '/enemies/sage_3.png', icon: '🟢', rank: `16 Kyu • ${isEn ? 'Green AI' : 'IA Verde'}` },
                { name: translateEnemyName('Tetsuo el Sabio'), avatar: '/enemies/sage_4.png', icon: '🟢', rank: `16 Kyu • ${isEn ? 'Green AI' : 'IA Verde'}` },
                { name: translateEnemyName('Genzaburo el Sabio'), avatar: '/enemies/sage_5.png', icon: '🟢', rank: `16 Kyu • ${isEn ? 'Green AI' : 'IA Verde'}` }
            ][Math.floor(Math.random() * 5)];

            const aiOpponents = [
                { pid: 2, name: randomMonk.name, icon: randomMonk.icon, avatar: randomMonk.avatar, rank: randomMonk.rank },
                { pid: 3, name: randomSage.name, icon: randomSage.icon, avatar: randomSage.avatar, rank: randomSage.rank },
                { pid: 4, name: translateEnemyName('Centinela Dragón'), icon: '🟣', avatar: '/enemies/boss.png', rank: `4 Kyu • ${isEn ? 'Purple AI' : 'IA Púrpura'}` }
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
                            ${isTurn ? `🤖 ${t('hud.ai_thinking')}` : `⏳ ${t('hud.waiting')}`}
                        </span>
                    </div>
                `;
                multiEnemyCard.appendChild(card);
            });
        } else {
            // Caso 4P Local Pasa y Juega:
            const activeP = state ? state.currentPlayer : 1;
            if (roleTag) roleTag.innerText = t('hud.role_current_turn', { player: activeP });

            const localHeroes: Record<number, { name: string; title: string; icon: string; img: string }> = {
                1: { name: t('hud.player_num', { num: 1 }), title: t('hud.player_black'), icon: '⚫', img: '/heroes/ronin.png' },
                2: { name: t('hud.player_num', { num: 2 }), title: t('hud.player_white'), icon: '⚪', img: '/heroes/kitsune.png' },
                3: { name: t('hud.player_num', { num: 3 }), title: t('hud.player_emerald'), icon: '🟢', img: '/heroes/himiko.png' },
                4: { name: t('hud.player_num', { num: 4 }), title: t('hud.player_amethyst'), icon: '🟣', img: '/heroes/ryujin.png' }
            };

            const currentHeroData = localHeroes[activeP];
            if (pImg) pImg.src = currentHeroData.img;
            if (pIcon) pIcon.innerText = currentHeroData.icon;
            if (pName) pName.innerText = currentHeroData.name;
            if (pTitle) pTitle.innerText = `${currentHeroData.title} • ${t('hud.your_turn_move')}`;

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
                        <span class="mini-opponent-status waiting">⏳ ${t('hud.waiting_turn')}</span>
                    </div>
                `;
                multiEnemyCard.appendChild(card);
            });
        }
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
                pImg.src = '/heroes/normal.png';
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

        if (eImg) eImg.src = '/enemies/sage_1.png';
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
        difficulty?: AIDifficulty
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
            if (eImg) eImg.src = bConfig?.enemyImage || '/enemies/monk_1.png';
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
                }
                if (pIcon && hero) pIcon.innerText = hero.icon;
                if (pName && hero) pName.innerText = t(`champion.${heroId}.name`) || hero.name;
                if (pTitle) pTitle.innerText = '';
            } else {
                if (pImg) {
                    pImg.src = '/heroes/ronin.png';
                    pImg.classList.remove('hero-normal-img');
                }
                if (pIcon) pIcon.innerText = '⚫';
                if (pName) pName.innerText = `${t('hud.player_you')}`;
                if (pTitle) pTitle.innerText = '';
            }

            const eImg = document.getElementById('duel-enemy-img') as HTMLImageElement | null;
            const eIcon = document.getElementById('duel-enemy-icon-badge');
            const eName = document.getElementById('duel-enemy-name');
            const eRank = document.getElementById('duel-enemy-rank');

            const randomMonks = [
                { name: 'Joven Ren', image: '/enemies/monk_1.png', icon: '🧘', rank: '30 Kyu' },
                { name: 'Joven Hiro', image: '/enemies/monk_2.png', icon: '🧘', rank: '28 Kyu' },
                { name: 'Joven Sora', image: '/enemies/monk_3.png', icon: '🧘', rank: '25 Kyu' },
                { name: 'Joven Daiki', image: '/enemies/monk_4.png', icon: '🧘', rank: '22 Kyu' },
                { name: 'Joven Kazuki', image: '/enemies/monk_5.png', icon: '🧘', rank: '20 Kyu' }
            ];

            const randomSages = [
                { name: 'Kenshin el Sabio', image: '/enemies/sage_1.png', icon: '📜', rank: '16 Kyu' },
                { name: 'Nobunaga el Sabio', image: '/enemies/sage_2.png', icon: '📜', rank: '14 Kyu' },
                { name: 'Masashi el Sabio', image: '/enemies/sage_3.png', icon: '📜', rank: '12 Kyu' },
                { name: 'Tetsuo el Sabio', image: '/enemies/sage_4.png', icon: '📜', rank: '10 Kyu' },
                { name: 'Genzaburo el Sabio', image: '/enemies/sage_5.png', icon: '📜', rank: '8 Kyu' }
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
                aiImage = chosenSage.image;
                aiIcon = chosenSage.icon;
                aiName = chosenSage.name;
                aiRank = chosenSage.rank;
            } else if (difficulty === 'dan') {
                aiImage = '/enemies/boss.png';
                aiIcon = '👑';
                aiName = `🐉 ${t('champion.boss.name')}`;
                aiRank = '2 Dan Pro';
            }

            if (eImg) eImg.src = aiImage;
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
                if (heroId) {
                    const hero = RoguelikeRunManager.HEROES[heroId];
                    if (pImg && hero) {
                        pImg.src = hero.image;
                        pImg.classList.toggle('hero-normal-img', heroId === 'normal');
                    }
                    if (pIcon && hero) pIcon.innerText = hero.icon;
                    if (pName && hero) pName.innerText = t(`champion.${heroId}.name`) || hero.name;
                    if (pTitle) pTitle.innerText = '';
                } else {
                    if (pImg) {
                        pImg.src = '/heroes/normal.png';
                        pImg.classList.add('hero-normal-img');
                    }
                    if (pIcon) pIcon.innerText = '👤';
                    if (pName) pName.innerText = t('hud.player_num', { num: 1 });
                    if (pTitle) pTitle.innerText = '';
                }

                if (eImg) eImg.src = '/heroes/kitsune.png';
                if (eIcon) eIcon.innerText = '🦊';
                if (eName) eName.innerText = t('hud.player_num', { num: 2 });
                if (eRank) eRank.innerText = t('hud.player_white');
            }
        }
    }
}
