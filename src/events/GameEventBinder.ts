// events/GameEventBinder.ts — Eventos de partida: pasar turno, deshacer, hechizos, poliminós y modales de puntuación

import { GameController } from '../controllers/GameController';
import { InteractionManager } from '../controllers/InteractionManager';
import { RoguelikeController } from '../controllers/RoguelikeController';
import { ModalManager } from '../ui/ModalManager';

export class GameEventBinder {
    public static init(): void {
        const passHandler = () => {
            GameController.handlePass(true);
        };
        document.getElementById('btn-pass')?.addEventListener('click', passHandler);
        document.getElementById('btn-action-pass')?.addEventListener('click', passHandler);

        document.getElementById('btn-game-undo')?.addEventListener('click', () => {
            GameController.handleUndo();
        });

        document.getElementById('btn-game-redo')?.addEventListener('click', () => {
            GameController.handleRedo();
        });

        document.getElementById('btn-master-hint')?.addEventListener('click', () => {
            InteractionManager.triggerBestMoveHint();
        });

        document.getElementById('btn-duel-champion-skill')?.addEventListener('click', () => {
            InteractionManager.toggleChampionActiveSkill();
        });

        // Botones de hechizos en barra inferior (4 Hechizos Místicos)
        document.getElementById('spell-btn-rewind')?.addEventListener('click', () => {
            GameController.selectSpell('rewind');
        });
        document.getElementById('spell-btn-meteor')?.addEventListener('click', () => {
            GameController.selectSpell('meteor');
        });
        document.getElementById('spell-btn-shield')?.addEventListener('click', () => {
            GameController.selectSpell('shield');
        });
        document.getElementById('spell-btn-convert')?.addEventListener('click', () => {
            GameController.selectSpell('convert');
        });

        // Botones de Fichas Poliminó en barra táctica
        document.getElementById('poly-btn-sprouting')?.addEventListener('click', () => {
            GameController.selectPolyomino('sprouting');
        });
        document.getElementById('poly-btn-domino')?.addEventListener('click', () => {
            GameController.selectPolyomino('domino');
        });
        document.getElementById('poly-btn-monolith')?.addEventListener('click', () => {
            GameController.selectPolyomino('monolith');
        });

        document.getElementById('btn-modal-rematch')?.addEventListener('click', () => {
            RoguelikeController.handleRematchOrRewardButton();
        });

        document.getElementById('btn-modal-dispute')?.addEventListener('click', () => {
            ModalManager.closeScoreModal();
            GameController.state.isGameOver = false;
            GameController.state.isScoringPhase = true;
            GameController.state.consecutivePasses = 0;
            GameController.updateInGameUI();
            if (GameController.renderer) GameController.renderer.render();
        });

        document.getElementById('btn-modal-inspect')?.addEventListener('click', () => {
            ModalManager.inspectBoard();
        });

        document.getElementById('btn-modal-close')?.addEventListener('click', () => {
            ModalManager.inspectBoard();
        });

        document.getElementById('floating-inspect-btn')?.addEventListener('click', () => {
            ModalManager.restoreScoreModal();
        });

        // Botón de Registro de Combate y Repetición (In-game e Inspección Final)
        document.getElementById('btn-game-combat-log')?.addEventListener('click', () => {
            ModalManager.openCombatLogModal();
        });

        document.getElementById('btn-modal-combat-log')?.addEventListener('click', () => {
            ModalManager.openCombatLogModal();
        });

        // Previsualización Dinámica de Vectores de Inhalación del Tablero Oni en Hover
        const oniWarningIcon = document.getElementById('ui-oni-warning');
        if (oniWarningIcon) {
            oniWarningIcon.addEventListener('mouseenter', () => {
                if (GameController.board && GameController.board.shape === 'oni' && GameController.renderer) {
                    import('../graphics/vfx/OniInhalationPreview').then(m => {
                        m.OniInhalationPreview.show(GameController.board, GameController.renderer.svgElement);
                    });
                }
            });

            oniWarningIcon.addEventListener('mouseleave', () => {
                if (GameController.renderer) {
                    import('../graphics/vfx/OniInhalationPreview').then(m => {
                        m.OniInhalationPreview.hide(GameController.renderer.svgElement);
                    });
                }
            });
        }
    }
}

