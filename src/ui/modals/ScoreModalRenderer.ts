// ui/modals/ScoreModalRenderer.ts - Renderizado del Modal de Puntuación Final, Victoria Unificada Roguelike y Desglose Territorial
import type { ScoreReport, PlayerId, HeroId } from '../../types';
import { TerritoryScorer } from '../../core/TerritoryScorer';
import { RoguelikeRunManager } from '../../core/RoguelikeRunManager';
import { t } from '../../i18n/i18n';

export class ScoreModalRenderer {
    public static showFinalScoreModal(
        report: ScoreReport, 
        playerCount: 2 | 4, 
        isRoguelike: boolean, 
        humanWon: boolean,
        _humanColor: PlayerId,
        nodeTitle?: string,
        enemyName?: string,
        rankLabel?: string,
        heroId?: HeroId,
        rewardOptions?: { type: 'spell' | 'poly'; id: string; name: string; icon: string; desc: string }[],
        selectedRewardId?: string,
        onRewardSelect?: (id: string) => void
    ) {
        const modal = document.getElementById('score-modal');
        const modalScoreCard = document.getElementById('modal-score-card');
        const heroArt = document.getElementById('modal-victory-hero-art') as HTMLImageElement | null;
        const starLeft = document.getElementById('modal-star-left');
        const starRight = document.getElementById('modal-star-right');

        const title = document.getElementById('modal-winner-title');
        const subtitle = document.getElementById('modal-margin-subtitle');
        const grid = document.getElementById('modal-score-breakdown-grid');
        const rewardsSection = document.getElementById('modal-rogue-rewards-section');
        const rewardsContainer = document.getElementById('modal-reward-cards-container');

        const colP3 = document.getElementById('modal-col-p3');
        const colP4 = document.getElementById('modal-col-p4');

        const bTerr = document.getElementById('modal-b-terr');
        const bCaps = document.getElementById('modal-b-caps');
        const bTotal = document.getElementById('modal-b-total');

        const wTerr = document.getElementById('modal-w-terr');
        const wCaps = document.getElementById('modal-w-caps');
        const wKomi = document.getElementById('modal-w-komi');
        const wTotal = document.getElementById('modal-w-total');

        const gTerr = document.getElementById('modal-g-terr');
        const gCaps = document.getElementById('modal-g-caps');
        const gTotal = document.getElementById('modal-g-total');

        const pTerr = document.getElementById('modal-p-terr');
        const pCaps = document.getElementById('modal-p-caps');
        const pTotal = document.getElementById('modal-p-total');

        // Arte del Campeón Escogido en Grande con Transparencia
        const effectiveHeroId = heroId || RoguelikeRunManager.selectedHero || 'tengu';
        const hero = RoguelikeRunManager.HEROES[effectiveHeroId];
        if (heroArt) {
            if (isRoguelike && hero) {
                heroArt.src = hero.image || hero.faceImage || '/heroes/tengu.png';
                heroArt.classList.remove('hidden');
            } else {
                heroArt.classList.add('hidden');
            }
        }

        if (playerCount === 4) {
            modalScoreCard?.classList.add('modal-score-4p');
            modalScoreCard?.classList.remove('modal-victory-unified');
            grid?.classList.add('grid-4p');
            colP3?.classList.remove('hidden');
            colP4?.classList.remove('hidden');
            rewardsSection?.classList.add('hidden');
            starLeft?.classList.add('hidden');
            starRight?.classList.add('hidden');

            if (title && subtitle) {
                if (report.winner !== 'draw' && report.winnerPlayerId) {
                    const winnerMeta = TerritoryScorer.PLAYER_META[report.winnerPlayerId];
                    title.innerText = `🎉 ¡${winnerMeta.name}! ${winnerMeta.icon}`;
                    subtitle.innerText = `1º ${report.ranking[0].name} (${report.ranking[0].total} pts) • 2º ${report.ranking[1].name} (${report.ranking[1].total} pts) • 3º ${report.ranking[2]?.name || ''} • 4º ${report.ranking[3]?.name || ''}`;
                } else {
                    title.innerText = t('score.draw');
                    subtitle.innerText = "Jigo";
                }
            }

            if (gTerr) gTerr.innerText = report.greenTerritory.toString();
            if (gCaps) gCaps.innerText = report.greenCaptures.toString();
            if (gTotal) gTotal.innerText = report.playerScores[3].total.toString();

            if (pTerr) pTerr.innerText = report.purpleTerritory.toString();
            if (pCaps) pCaps.innerText = report.purpleCaptures.toString();
            if (pTotal) pTotal.innerText = report.playerScores[4].total.toString();
        } else {
            modalScoreCard?.classList.remove('modal-score-4p');
            grid?.classList.remove('grid-4p');
            colP3?.classList.add('hidden');
            colP4?.classList.add('hidden');

            const rematchBtn = document.getElementById('btn-modal-rematch');

            if (isRoguelike) {
                modalScoreCard?.classList.add('modal-victory-unified');

                if (humanWon) {
                    if (title) title.innerText = t('score.victory_goban');
                    starLeft?.classList.remove('hidden');
                    starRight?.classList.remove('hidden');

                    const enemyDisplay = enemyName || t('score.rival');
                    const rankDisplay = rankLabel ? ` (${rankLabel})` : '';
                    if (subtitle) {
                        subtitle.innerText = `${t('score.margin_won', { enemy: enemyDisplay + rankDisplay, margin: report.margin })}`;
                    }

                    if (rematchBtn) rematchBtn.innerText = t('btn.claim_and_return');

                    // Renderizar Recompensas Integradas en el Menú de Victoria
                    if (rewardsSection && rewardsContainer && rewardOptions && rewardOptions.length > 0) {
                        rewardsSection.classList.remove('hidden');
                        rewardsContainer.innerHTML = '';

                        rewardOptions.forEach(opt => {
                            const card = document.createElement('div');
                            const isSelected = selectedRewardId === opt.id;
                            card.className = `reward-card-choice ${isSelected ? 'active' : ''}`;
                            card.innerHTML = `
                                <div class="reward-card-badge-row">
                                    <span class="reward-card-icon">${opt.icon}</span>
                                    <span class="reward-check-pill">${isSelected ? '✓ ' + t('btn.selected') : t('btn.choose')}</span>
                                </div>
                                <strong class="card-name">${opt.name}</strong>
                                <p class="card-desc">${opt.desc}</p>
                            `;
                            card.addEventListener('click', () => {
                                if (onRewardSelect) onRewardSelect(opt.id);
                                document.querySelectorAll('#modal-reward-cards-container .reward-card-choice').forEach(c => {
                                    c.classList.remove('active');
                                    const pill = c.querySelector('.reward-check-pill');
                                    if (pill) pill.textContent = t('btn.choose');
                                });
                                card.classList.add('active');
                                const myPill = card.querySelector('.reward-check-pill');
                                if (myPill) myPill.textContent = '✓ ' + t('btn.selected');
                            });
                            rewardsContainer.appendChild(card);
                        });
                    } else {
                        rewardsSection?.classList.add('hidden');
                    }
                } else {
                    starLeft?.classList.add('hidden');
                    starRight?.classList.add('hidden');
                    rewardsSection?.classList.add('hidden');

                    if (title) title.innerText = `💀 ${t('score.fallen_in', { title: nodeTitle || 'Battle' })}`;
                    const enemyDisplay = enemyName || t('score.rival');
                    const rankDisplay = rankLabel ? ` (${rankLabel})` : '';
                    if (subtitle) {
                        subtitle.innerText = `${t('score.defeated_by', { enemy: enemyDisplay + rankDisplay })}`;
                    }
                    if (rematchBtn) rematchBtn.innerText = t('btn.end_expedition');
                }
            } else {
                modalScoreCard?.classList.remove('modal-victory-unified');
                starLeft?.classList.add('hidden');
                starRight?.classList.add('hidden');
                rewardsSection?.classList.add('hidden');

                if (rematchBtn) rematchBtn.innerText = t('btn.new_game');

                if (title && subtitle) {
                    if (report.winner === 'black') {
                        title.innerText = t('score.winner_black');
                        subtitle.innerText = t('score.margin', { margin: report.margin });
                    } else if (report.winner === 'white') {
                        title.innerText = t('score.winner_white');
                        subtitle.innerText = t('score.margin_komi', { margin: report.margin });
                    } else {
                        title.innerText = t('score.draw');
                        subtitle.innerText = "Jigo";
                    }
                }
            }
        }

        // Puntuaciones
        if (bTerr) bTerr.innerText = report.blackTerritory.toString();
        if (bCaps) bCaps.innerText = report.blackCaptures.toString();
        if (bTotal) bTotal.innerText = report.blackTotal.toString();

        if (wTerr) wTerr.innerText = report.whiteTerritory.toString();
        if (wCaps) wCaps.innerText = report.whiteCaptures.toString();
        if (wKomi) wKomi.innerText = `+${report.komi}`;
        if (wTotal) wTotal.innerText = report.whiteTotal.toString();

        // Ocultar botón flotante de inspección si estaba visible
        const floatingBtn = document.getElementById('floating-inspect-btn');
        if (floatingBtn) floatingBtn.classList.add('hidden');

        if (modal) modal.classList.remove('hidden');
    }

    /**
     * Oculta el modal de puntuación para permitir inspeccionar el tablero y muestra el botón flotante
     */
    public static inspectBoard() {
        const modal = document.getElementById('score-modal');
        const floatingBtn = document.getElementById('floating-inspect-btn');
        if (modal) modal.classList.add('hidden');
        if (floatingBtn) floatingBtn.classList.remove('hidden');
    }

    /**
     * Restaura el modal de puntuación y oculta el botón flotante
     */
    public static restoreScoreModal() {
        const modal = document.getElementById('score-modal');
        const floatingBtn = document.getElementById('floating-inspect-btn');
        if (floatingBtn) floatingBtn.classList.add('hidden');
        if (modal) modal.classList.remove('hidden');
    }

    public static closeScoreModal() {
        document.getElementById('score-modal')?.classList.add('hidden');
        document.getElementById('floating-inspect-btn')?.classList.add('hidden');
    }
}
