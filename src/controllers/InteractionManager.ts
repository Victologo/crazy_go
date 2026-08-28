import { GameController } from './GameController';
import { HUDController } from '../ui/HUDController';
import { SoundFX } from '../audio/SoundFX';
import { TutorialManager } from '../tutorial/TutorialManager';
import { RogueliteManager } from '../core/RogueliteManager';
import { ChampionManager } from '../core/ChampionManager';
// ...
import { AnalysisEngine } from '../core/AnalysisEngine';
import type { SpellId, PolyominoType } from '../types';
import { getLanguage } from '../i18n/i18n';

export class InteractionManager {
    public static selectSpell(spellId: SpellId) {
        const isEn = getLanguage() === 'en';
        if (!GameController.isLocalPlayerTurn()) {
            HUDController.showAlert(isEn ? "You can only cast spells during your turn." : "Solo puedes lanzar hechizos durante tu turno.");
            SoundFX.playIllegal();
            return;
        }

        const spell = RogueliteManager.getSpells().find(s => s.id === spellId);
        if (!spell || spell.usesLeft <= 0) {
            HUDController.showAlert(isEn ? "No charges left for this spell." : "No quedan cargas para este hechizo.");
            SoundFX.playIllegal();
            return;
        }

        if (TutorialManager.isActive) {
            const expected = TutorialManager.getExpectedAction();
            if (expected?.type !== 'use_spell' || expected.spellId !== spellId) {
                const spellName = spell.name;
                HUDController.showAlert(isEn ? `🥋 Sensei: Do not use ${spellName} now. Follow the instructions of the current step.` : `🥋 Sensei: No uses ${spellName} ahora. Sigue las instrucciones del paso actual.`, 2800);
                SoundFX.playIllegal();
                return;
            }
        }

        RogueliteManager.castSpell(
            spellId,
            GameController.board,
            GameController.state,
            GameController.config.humanColor,
            (msg, removedStones) => {
                GameController.renderer.render();
                if (removedStones && GameController.renderer) {
                    removedStones.forEach(s => GameController.renderer.triggerRewindStoneLift(s.x, s.y, s.playerId));
                }
                GameController.updateInGameUI();
                HUDController.showAlert(msg);

                // Disparo de online-undo callback si es online y usamos rewind
                if (spellId === 'rewind' && GameController.config.gameMode === 'online' && GameController.onOnlineUndoCallback) {
                    GameController.onOnlineUndoCallback();
                }

                if (TutorialManager.isActive) {
                    TutorialManager.advanceStep();
                }
            },
            (err) => {
                HUDController.showAlert(err);
            }
        );
    }

    public static selectPolyomino(type: PolyominoType) {
        GameController.selectPolyomino(type);
    }

    public static rotatePolyomino() {
        GameController.rotatePolyomino();
    }

    public static toggleChampionActiveSkill() {
        const isEn = getLanguage() === 'en';
        if (!ChampionManager.isActiveSkillAvailable) {
            HUDController.showAlert(isEn ? "You have already used your Champion's active skill in this match." : "Ya has utilizado la habilidad activa de tu Campeón en esta partida.");
            SoundFX.playIllegal();
            return;
        }
        if (ChampionManager.currentHero === 'alchemist' && ChampionManager.alchemistUsedThisTurn) {
            HUDController.showAlert(isEn ? "⚗️ You already used Chromatic Inversion this turn. Wait for the next turn." : "⚗️ Ya usaste la Inversión Cromática este turno. Espera al siguiente turno.");
            SoundFX.playIllegal();
            return;
        }
        if (!GameController.isLocalPlayerTurn()) {
            HUDController.showAlert(isEn ? "You can only activate skills during your turn." : "Solo puedes activar habilidades durante tu turno.");
            SoundFX.playIllegal();
            return;
        }

        if (ChampionManager.currentTargetingMode !== 'none') {
            ChampionManager.currentTargetingMode = 'none';
            SoundFX.playSkillDeactivate();
            HUDController.showAlert(isEn ? "Skill selection cancelled." : "Selección de habilidad cancelada.");
        } else {
            const hero = ChampionManager.currentHero || 'tengu';
            const skill = ChampionManager.ACTIVE_SKILLS[hero];
            if (!skill) {
                HUDController.showAlert(isEn ? "This hero has no active skill." : "Este héroe no posee habilidad activa.");
                return;
            }
            SoundFX.playSkillActivate();
            HUDController.triggerStandeeSkillFX(GameController.config.humanColor, true);
            ChampionManager.currentTargetingMode = skill.targetingMode;
            ChampionManager.targetingPlayerId = (GameController.config.gameMode === 'online' ? GameController.localOnlineColor : GameController.state.currentPlayer);
            HUDController.showAlert(isEn ? `🎯 ${skill.name}: Click on the board to execute skill.` : `🎯 ${skill.name}: Haz clic en el tablero para ejecutar la habilidad.`);
        }
        GameController.updateInGameUI();
        if (GameController.renderer) GameController.renderer.render();
    }

    public static triggerBestMoveHint() {
        const isEn = getLanguage() === 'en';
        if (!GameController.isLocalPlayerTurn()) {
            HUDController.showAlert(isEn ? "You can only ask for hints during your turn." : "Solo puedes solicitar pistas durante tu turno.");
            SoundFX.playIllegal();
            return;
        }

        const analysis = AnalysisEngine.analyzePosition(GameController.board, GameController.state, GameController.state.currentPlayer);
        
        if (!analysis.bestMoveNodeId) {
            HUDController.showAlert(isEn ? "No clear move recommendation." : "Sin recomendación clara de jugada.");
            return;
        }

        if (GameController.renderer) {
            if (GameController.renderer.activeHintNodeId === analysis.bestMoveNodeId) {
                GameController.renderer.clearHint();
                HUDController.setHintButtonActive(false);
                return;
            }
            GameController.renderer.showHint(analysis.bestMoveNodeId, analysis.continuation);
            HUDController.setHintButtonActive(true);
            SoundFX.playSpecial();
            HUDController.showAlert(isEn ? `👁️ Master's Eye: ${analysis.tacticalReason}` : `👁️ Ojo del Maestro: ${analysis.tacticalReason}`, 4000);
        }
    }
}
