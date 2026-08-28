import type { HeroId, RogueliteDifficulty } from '../../types';
import { RoguelikeRunManager } from '../../core/RoguelikeRunManager';
import { RogueliteManager } from '../../core/RogueliteManager';

import { ModalManager } from '../ModalManager';
import { getLanguage, t, translateEnemyName, applyTranslationsToDOM } from '../../i18n/i18n';
import { RogueChoiceCameraController } from '../../controllers/RogueChoiceCameraController';

export class RogueModalRenderer {
    public static openRoguelikeSetupModal() {
        document.getElementById('roguelike-setup-modal')?.classList.remove('hidden');
    }

    public static closeRoguelikeSetupModal() {
        document.getElementById('roguelike-setup-modal')?.classList.add('hidden');
    }

    public static openRogueChoiceModal() {
        const modal = document.getElementById('modal-rogue-choice');
        if (!modal) return;

        const isEn = getLanguage() === 'en';
        const hero = RoguelikeRunManager.HEROES[RoguelikeRunManager.selectedHero || 'tengu'];
        
        // 1. Set Left and Right Hero Images
        const leftImg = document.getElementById('rogue-hero-img-left') as HTMLImageElement | null;
        const rightImg = document.getElementById('rogue-hero-img-right') as HTMLImageElement | null;

        if (hero) {
            if (leftImg) {
                // Character seen from behind returning to the Dojo (tilted left)
                leftImg.src = `./heroes/${hero.id}_back.png`;
                leftImg.style.transform = 'scaleX(-1) rotate(-3deg)'; 
            }
            if (rightImg) {
                // Character seen from behind advancing forward into the expedition
                rightImg.src = `./heroes/${hero.id}_back.png`;
                rightImg.style.transform = 'scale(1)';
            }
        }

        // 2. Populate Central Run Information Plaque
        const nameEl = document.getElementById('saved-run-hero-name');
        const iconEl = document.getElementById('saved-run-hero-icon');
        const diffEl = document.getElementById('saved-run-diff');
        const progEl = document.getElementById('saved-run-progress');

        if (nameEl && hero) nameEl.innerText = hero.name;
        if (iconEl && hero) iconEl.innerText = hero.icon;
        
        if (diffEl) {
            const diff = RoguelikeRunManager.runDifficulty || 'normal';
            const diffConfig: Record<string, { label: string; flameClass: string; bg: string; color: string; border: string }> = {
                easy: {
                    label: isEn ? 'Easy' : 'Fácil',
                    flameClass: 'flame-easy',
                    bg: 'rgba(34, 197, 94, 0.18)',
                    color: '#86efac',
                    border: 'rgba(34, 197, 94, 0.4)'
                },
                normal: {
                    label: isEn ? 'Medium' : 'Medio',
                    flameClass: 'flame-normal',
                    bg: 'rgba(245, 158, 11, 0.18)',
                    color: '#fde68a',
                    border: 'rgba(245, 158, 11, 0.4)'
                },
                hard: {
                    label: isEn ? 'Hard' : 'Difícil',
                    flameClass: 'flame-hard',
                    bg: 'rgba(239, 68, 68, 0.18)',
                    color: '#f87171',
                    border: 'rgba(239, 68, 68, 0.4)'
                },
                extreme: {
                    label: isEn ? 'Grandmaster' : 'Gran Maestro',
                    flameClass: 'flame-extreme',
                    bg: 'rgba(168, 85, 247, 0.18)',
                    color: '#d8b4fe',
                    border: 'rgba(168, 85, 247, 0.4)'
                }
            };

            const currentDiff = diffConfig[diff] || diffConfig['normal'];
            diffEl.style.background = currentDiff.bg;
            diffEl.style.color = currentDiff.color;
            diffEl.style.borderColor = currentDiff.border;
            diffEl.style.display = 'inline-flex';
            diffEl.style.alignItems = 'center';
            diffEl.style.gap = '6px';
            diffEl.innerHTML = `<span class="diff-flame ${currentDiff.flameClass}" style="font-size: 1.1rem; vertical-align: middle;">🔥</span><span>${currentDiff.label}</span>`;
        }

        if (progEl) {
            const node = RoguelikeRunManager.getCurrentNode();
            if (node) {
                let translatedTitle = node.title;
                if (node.battleConfig?.enemyName) {
                    const translatedEnemy = translateEnemyName(node.battleConfig.enemyName);
                    translatedTitle = translatedEnemy;
                }
                progEl.innerText = t('rogue.choice_node_tier', { tier: node.tier + 1, title: translatedTitle });
            } else {
                progEl.innerText = t('rogue.choice_ready_advance');
            }
        }

        modal.classList.remove('hidden');

        // Apply HTML data-i18n translations
        applyTranslationsToDOM();

        // 3. Initialize the 2.5D camera and spatial hover behavior
        const choiceCamera = new RogueChoiceCameraController();
        choiceCamera.init();
    }

    public static closeRogueChoiceModal() {
        document.getElementById('modal-rogue-choice')?.classList.add('hidden');
    }

    public static updateRoguelikeSetupModalUI(_tempMode: '1p' | 'coop', tempDifficulty: RogueliteDifficulty, tempHero: HeroId) {
        document.getElementById('rogue-diff-easy')?.classList.toggle('active', tempDifficulty === 'easy');
        document.getElementById('rogue-diff-normal')?.classList.toggle('active', tempDifficulty === 'normal');
        document.getElementById('rogue-diff-hard')?.classList.toggle('active', tempDifficulty === 'hard');
        document.getElementById('rogue-diff-extreme')?.classList.toggle('active', tempDifficulty === 'extreme');

        ModalManager.renderHeroShowcaseElements('rogue', tempHero);
    }

    public static showRewardModal(
        goldReward: number,
        options: { type?: string; id: string; name: string; icon: string; desc: string }[],
        selectedId: string,
        onItemSelected: (id: string) => void
    ) {
        const modal = document.getElementById('rogue-reward-modal');
        const goldText = document.getElementById('reward-gold-amount');
        const cardsGrid = document.getElementById('reward-cards-grid') || document.getElementById('reward-cards-container');

        // 1. Mostrar Campeón Victorioso Celebrando
        const heroId = RoguelikeRunManager.selectedHero || 'tengu';
        const hero = RoguelikeRunManager.HEROES[heroId];
        const heroImg = document.getElementById('reward-hero-img') as HTMLImageElement | null;
        const heroName = document.getElementById('reward-hero-name');
        if (heroImg && hero) {
            heroImg.src = hero.image || hero.faceImage || './heroes/tengu.png';
        }
        if (heroName && hero) {
            heroName.innerText = hero.name;
        }

        // 2. Magatamas ganadas
        if (goldText) goldText.innerText = `+${goldReward} Magatamas 🏮`;

        // 3. Grid de 3 opciones con selección exclusiva
        if (cardsGrid) {
            cardsGrid.innerHTML = '';
            options.forEach(opt => {
                const card = document.createElement('div');
                const isSelected = selectedId === opt.id;
                card.className = `reward-card-choice ${isSelected ? 'active' : ''}`;
                card.innerHTML = `
                    <div class="reward-card-badge-row">
                        <span class="reward-card-icon">${opt.icon}</span>
                        <span class="reward-check-pill">${isSelected ? '✓ SELECCIONADO' : 'ELEGIR'}</span>
                    </div>
                    <strong class="card-name">${opt.name}</strong>
                    <p class="card-desc">${opt.desc}</p>
                `;
                card.addEventListener('click', () => {
                    onItemSelected(opt.id);
                    document.querySelectorAll('.reward-card-choice').forEach(c => {
                        c.classList.remove('active');
                        const pill = c.querySelector('.reward-check-pill');
                        if (pill) pill.textContent = 'ELEGIR';
                    });
                    card.classList.add('active');
                    const myPill = card.querySelector('.reward-check-pill');
                    if (myPill) myPill.textContent = '✓ SELECCIONADO';
                });
                cardsGrid.appendChild(card);
            });
        }

        if (modal) modal.classList.remove('hidden');
    }

    public static closeRewardModal() {
        document.getElementById('rogue-reward-modal')?.classList.add('hidden');
    }

    public static showEventModal(
        icon: string,
        title: string,
        desc: string,
        actions: { id: string; label: string; sub?: string; icon: string; image?: string; selected?: boolean; disabled?: boolean; onClick: () => void }[]
    ) {
        const modal = document.getElementById('rogue-event-modal');
        const iconEl = document.getElementById('event-modal-icon');
        const titleEl = document.getElementById('event-modal-title');
        const descEl = document.getElementById('event-modal-desc') || document.getElementById('event-modal-subtitle');
        const actionsContainer = document.getElementById('event-modal-actions') || document.getElementById('event-body-content');

        if (iconEl) iconEl.innerText = icon;
        if (titleEl) titleEl.innerText = title;
        if (descEl) descEl.innerHTML = desc.replace(/\n/g, '<br/>');

        const btnLeave = document.getElementById('btn-event-leave');
        if (btnLeave) {
            btnLeave.classList.add('hidden');
        }

        if (actionsContainer) {
            actionsContainer.innerHTML = '';
            const isFloatingImageMode = actions.some(a => !!a.image);
            if (isFloatingImageMode) {
                const grid = document.createElement('div');
                grid.className = 'event-floating-grid';
                actions.forEach(act => {
                    const itemBtn = document.createElement('button');
                    itemBtn.className = `btn-floating-item ${act.selected ? 'active selected' : ''}`;
                    itemBtn.disabled = !!act.disabled;
                    itemBtn.setAttribute('data-option-id', act.id);
                    itemBtn.innerHTML = `
                        <div class="floating-item-art">
                            ${act.image ? `<img src="${act.image}" class="floating-item-img" alt="${act.label}"/>` : `<span class="floating-item-emoji">${act.icon}</span>`}
                            ${act.selected ? `<div class="floating-item-badge">✓</div>` : ''}
                        </div>
                        <div class="floating-item-info">
                            <strong class="floating-item-title">${act.label}</strong>
                            ${act.sub ? `<span class="floating-item-desc">${act.sub}</span>` : ''}
                        </div>
                    `;
                    itemBtn.addEventListener('click', (e) => {
                        const isInfoBtn = act.id === 'btn_coop_start' || act.id.startsWith('btn_info');
                        if (e.isTrusted) {
                            import('../../network/NetworkManager').then(({ NetworkManager }) => {
                                if (NetworkManager.currentConfig?.isCoopRogue) {
                                    if (!NetworkManager.isHost && !isInfoBtn) {
                                        const isEn = getLanguage() === 'en';
                                        import('../HUDController').then(({ HUDController }) => HUDController.showAlert(isEn ? "Only the Host can select rewards." : "Solo el Anfitrión puede elegir las recompensas."));
                                        return;
                                    } else {
                                        if (NetworkManager.isHost) {
                                            NetworkManager.sendFn?.({ type: 'EVENT_OPTION_CLICK', optionId: act.id });
                                        }
                                        act.onClick();
                                    }
                                } else {
                                    act.onClick();
                                }
                            });
                        } else {
                            act.onClick();
                        }
                    });
                    grid.appendChild(itemBtn);
                });
                actionsContainer.appendChild(grid);
            } else {
                const list = document.createElement('div');
                list.className = 'event-options-list';
                actions.forEach(act => {
                    const btn = document.createElement('button');
                    btn.className = `btn-event-option ${act.selected ? 'active' : ''}`;
                    btn.disabled = !!act.disabled;
                    btn.setAttribute('data-option-id', act.id);
                    btn.innerHTML = `
                        <div class="event-option-icon">${act.icon}</div>
                        <div class="event-option-info">
                            <strong class="event-option-title">${act.label}</strong>
                            ${act.sub ? `<span class="event-option-desc">${act.sub}</span>` : ''}
                        </div>
                    `;
                    btn.addEventListener('click', (e) => {
                        const isInfoBtn = act.id === 'btn_coop_start' || act.id.startsWith('btn_info');
                        if (e.isTrusted) {
                            import('../../network/NetworkManager').then(({ NetworkManager }) => {
                                if (NetworkManager.currentConfig?.isCoopRogue) {
                                    if (!NetworkManager.isHost && !isInfoBtn) {
                                        const isEn = getLanguage() === 'en';
                                        import('../HUDController').then(({ HUDController }) => HUDController.showAlert(isEn ? "Only the Host can select rewards." : "Solo el Anfitrión puede elegir las recompensas."));
                                        return;
                                    } else {
                                        if (NetworkManager.isHost) {
                                            NetworkManager.sendFn?.({ type: 'EVENT_OPTION_CLICK', optionId: act.id });
                                        }
                                        act.onClick();
                                    }
                                } else {
                                    act.onClick();
                                }
                            });
                        } else {
                            act.onClick();
                        }
                    });
                    list.appendChild(btn);
                });
                actionsContainer.appendChild(list);
            }
        }

        if (modal) modal.classList.remove('hidden');
    }

    public static closeEventModal() {
        document.getElementById('rogue-event-modal')?.classList.add('hidden');
    }

    public static openDeckModal() {
        const modal = document.getElementById('rogue-deck-modal');
        if (!modal) return;

        const heroId = RoguelikeRunManager.selectedHero || 'tengu';
        const hero = RoguelikeRunManager.HEROES[heroId];

        const imgEl = document.getElementById('deck-hero-img') as HTMLImageElement | null;
        const iconEl = document.getElementById('deck-hero-icon');
        const nameEl = document.getElementById('deck-hero-name');
        const titleEl = document.getElementById('deck-hero-title');
        const activeName = document.getElementById('deck-hero-active-name');
        const activeDesc = document.getElementById('deck-hero-active-desc');
        const passiveName = document.getElementById('deck-hero-passive-name');
        const passiveDesc = document.getElementById('deck-hero-passive-desc');

        if (hero) {
            if (imgEl) imgEl.src = hero.faceImage || hero.image;
            if (iconEl) iconEl.innerText = hero.icon;
            if (nameEl) nameEl.innerText = hero.name;
            if (titleEl) titleEl.style.display = 'none';
            if (activeName) activeName.innerText = hero.activeName || 'Habilidad Pasiva';
            if (activeDesc) activeDesc.innerText = hero.activeDesc || hero.passiveDesc || '';
            if (passiveName) passiveName.innerText = hero.passiveName || 'Habilidad Activa';
            if (passiveDesc) passiveDesc.innerText = hero.passiveDesc || hero.activeDesc || '';
        }

        const goldEl = document.getElementById('deck-stat-gold');
        const komiEl = document.getElementById('deck-stat-komi');
        if (goldEl) goldEl.innerText = `${RoguelikeRunManager.magatamas}`;
        if (komiEl) komiEl.innerText = `+${RoguelikeRunManager.permanentKomiBonus.toFixed(1)}`;

        const spellsContainer = document.getElementById('deck-spells-container');
        const isEn = getLanguage() === 'en';
        if (spellsContainer) {
            spellsContainer.innerHTML = '';
            
            // Pergaminos de Hechizos Místicos
            RogueliteManager.getSpells().forEach((spell: any) => {
                const card = document.createElement('div');
                card.className = `deck-spell-card ${spell.usesLeft === 0 ? 'depleted' : ''}`;
                const useWord = isEn ? (spell.usesLeft === 1 ? 'use' : 'uses') : (spell.usesLeft === 1 ? 'uso' : 'usos');
                card.innerHTML = `
                    <div class="deck-spell-icon">${spell.icon}</div>
                    <div class="deck-spell-details">
                        <div class="deck-spell-header">
                            <strong>${spell.name}</strong>
                            <span class="deck-spell-charges">${spell.usesLeft} ${useWord}</span>
                        </div>
                        <p>${spell.description}</p>
                    </div>
                `;
                spellsContainer.appendChild(card);
            });

            // Fichas Poliminó Tácticas
            const polyCards = isEn ? [
                {
                    id: 'domino',
                    name: 'Duplicity Tile (2x1)',
                    icon: '🀄',
                    uses: RoguelikeRunManager.polyominoes.domino,
                    desc: 'Block of 2 indissolubly joined stones. Rotates with [R].'
                },
                {
                    id: 'sprouting',
                    name: 'Sprouting Tile (1x1)',
                    icon: '🌿',
                    uses: RoguelikeRunManager.polyominoes.sprouting,
                    desc: 'Automatically spawns an extra allied stone every 2 turns.'
                },
                {
                    id: 'monolith',
                    name: 'Monolith Tile (2x2)',
                    icon: '🧱',
                    uses: RoguelikeRunManager.polyominoes.monolith,
                    desc: 'Titan block of 4 joined stones forming an indestructible square.'
                }
            ] : [
                {
                    id: 'domino',
                    name: 'Ficha Dominó (2x1)',
                    icon: '🀄',
                    uses: RoguelikeRunManager.polyominoes.domino,
                    desc: 'Bloque de 2 piedras unidas indisolublemente. Rota con [R].'
                },
                {
                    id: 'sprouting',
                    name: 'Ficha Germinante (1x1)',
                    icon: '🌿',
                    uses: RoguelikeRunManager.polyominoes.sprouting,
                    desc: 'Cada 2 turnos brota automáticamente una piedra aliada extra.'
                },
                {
                    id: 'monolith',
                    name: 'Ficha Monolito (2x2)',
                    icon: '🧱',
                    uses: RoguelikeRunManager.polyominoes.monolith,
                    desc: 'Bloque titán de 4 piedras unidas formando un cuadrado indestructible.'
                }
            ];

            polyCards.forEach(poly => {
                const card = document.createElement('div');
                card.className = `deck-spell-card ${poly.uses === 0 ? 'depleted' : ''}`;
                const tileWord = isEn ? (poly.uses === 1 ? 'tile' : 'tiles') : (poly.uses === 1 ? 'ficha' : 'fichas');
                card.innerHTML = `
                    <div class="deck-spell-icon">${poly.icon}</div>
                    <div class="deck-spell-details">
                        <div class="deck-spell-header">
                            <strong>${poly.name}</strong>
                            <span class="deck-spell-charges">${poly.uses} ${tileWord}</span>
                        </div>
                        <p>${poly.desc}</p>
                    </div>
                `;
                spellsContainer.appendChild(card);
            });
        }

        modal.classList.remove('hidden');
    }

    public static closeDeckModal() {
        document.getElementById('modal-deck-view')?.classList.add('hidden');
    }
}
