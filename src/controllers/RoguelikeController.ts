// controllers/RoguelikeController.ts - Orquestador de la Expedición Roguelike (Carrusel, Mapa, Eventos, Tienda y Recompensas)
import type { 
    HeroId, 
    RogueliteDifficulty, 
    SpellId, 
    MapNode 
} from '../types';
import { RoguelikeRunManager } from '../core/RoguelikeRunManager';
import { RogueliteManager } from '../core/RogueliteManager';
import { ChampionManager } from '../core/ChampionManager';
import { RoguelikeMapRenderer } from '../graphics/RoguelikeMapRenderer';
import { SoundFX } from '../audio/SoundFX';
import { ScreenManager } from '../ui/ScreenManager';
import { ModalManager } from '../ui/ModalManager';
import { HUDController } from '../ui/HUDController';
import { GameController } from './GameController';

export class RoguelikeController {
    public static tempRogueDifficulty: RogueliteDifficulty = 'easy';
    public static tempRogueHero: HeroId = 'normal';
    public static mapRenderer: RoguelikeMapRenderer | null = null;
    public static selectedRewardItem: { type: 'spell' | 'poly'; id: string; name: string; icon: string; desc: string } | null = null;
    public static pendingGoldReward: number = 0;

    private static heroKeys: HeroId[] = ['normal', 'tengu', 'himiko', 'kitsune', 'ronin', 'alchemist', 'ryujin'];

    public static prevHero() {
        const idx = this.heroKeys.indexOf(this.tempRogueHero);
        const nextIdx = (idx - 1 + this.heroKeys.length) % this.heroKeys.length;
        this.tempRogueHero = this.heroKeys[nextIdx];
        ModalManager.updateRoguelikeSetupModalUI(this.tempRogueDifficulty, this.tempRogueHero);
        SoundFX.playPlaceStone();
    }

    public static nextHero() {
        const idx = this.heroKeys.indexOf(this.tempRogueHero);
        const nextIdx = (idx + 1) % this.heroKeys.length;
        this.tempRogueHero = this.heroKeys[nextIdx];
        ModalManager.updateRoguelikeSetupModalUI(this.tempRogueDifficulty, this.tempRogueHero);
        SoundFX.playPlaceStone();
    }

    public static setHero(heroId: HeroId) {
        this.tempRogueHero = heroId;
        ModalManager.updateRoguelikeSetupModalUI(this.tempRogueDifficulty, this.tempRogueHero);
        SoundFX.playPlaceStone();
    }

    public static setDifficulty(diff: RogueliteDifficulty) {
        this.tempRogueDifficulty = diff;
        ModalManager.updateRoguelikeSetupModalUI(this.tempRogueDifficulty, this.tempRogueHero);
        SoundFX.playPlaceStone();
    }

    public static openRoguelikeOrResume() {
        if (RoguelikeRunManager.hasSavedRun() || (RoguelikeRunManager.isRunActive && RoguelikeRunManager.map)) {
            // Cargar estado si aún no está en memoria
            if (!RoguelikeRunManager.isRunActive || !RoguelikeRunManager.map) {
                RoguelikeRunManager.loadFromLocalStorage();
            }
            ModalManager.openRogueChoiceModal();
        } else {
            ModalManager.openRoguelikeSetupModal();
            ModalManager.updateRoguelikeSetupModalUI(this.tempRogueDifficulty, this.tempRogueHero);
        }
    }

    public static resumeActiveRun() {
        ModalManager.closeRogueChoiceModal();
        if (!RoguelikeRunManager.isRunActive || !RoguelikeRunManager.map) {
            RoguelikeRunManager.loadFromLocalStorage();
        }
        this.resumeMap();
        const heroName = RoguelikeRunManager.HEROES[RoguelikeRunManager.selectedHero]?.name || 'Campeón';
        HUDController.showAlert(`🗺️ Expedición reanudada (${heroName}).`);
        SoundFX.playPlaceStone();
    }

    public static startFreshRunPrompt() {
        ModalManager.closeRogueChoiceModal();
        RoguelikeRunManager.clearSavedRun();
        RoguelikeRunManager.isRunActive = false;
        RoguelikeRunManager.map = null;
        RoguelikeRunManager.currentNodeId = null;

        ModalManager.openRoguelikeSetupModal();
        ModalManager.updateRoguelikeSetupModalUI(this.tempRogueDifficulty, this.tempRogueHero);
        SoundFX.playPlaceStone();
    }

    public static abandonRun() {
        RoguelikeRunManager.clearSavedRun();
        RoguelikeRunManager.isRunActive = false;
        ScreenManager.showMainMenu();
        HUDController.showAlert("Expedición cancelada.");
        SoundFX.playPlaceStone();
    }

    public static startNewExpedition() {
        ModalManager.closeRoguelikeSetupModal();
        RoguelikeRunManager.startRun(this.tempRogueDifficulty, this.tempRogueHero);
        ChampionManager.resetForMatch(this.tempRogueHero);

        ScreenManager.showRoguelikeMapScreen();
        this.renderMap();
        HUDController.showAlert(`🗺️ ¡Nueva expedición iniciada con ${RoguelikeRunManager.HEROES[this.tempRogueHero].name}!`);
        SoundFX.playPlaceStone();
    }

    public static resumeMap() {
        ScreenManager.showRoguelikeMapScreen();
        this.renderMap();
    }

    public static renderMap() {
        if (!RoguelikeRunManager.map) return;
        if (!this.mapRenderer) {
            this.mapRenderer = new RoguelikeMapRenderer('roguelike-map-canvas-container', (node: any) => {
                this.handleMapNodeClick(node);
            });
        }
        this.mapRenderer.render(RoguelikeRunManager.map);
        ScreenManager.updateMapHUD();
    }

    public static handleMapNodeClick(node: any) {
        if (node.status !== 'available' && node.status !== 'current') {
            HUDController.showAlert("Este nodo no está disponible para avanzar.");
            SoundFX.playIllegal();
            return;
        }

        RoguelikeRunManager.selectNode(node.id);
        SoundFX.playPlaceStone();

        switch (node.type) {
            case 'battle':
            case 'elite':
            case 'boss':
                this.startBattle(node);
                break;
            case 'shrine':
                this.showSanctuaryEvent(node);
                break;
            case 'rest':
                this.showRestEvent(node);
                break;
            case 'shop':
                this.showMerchantStore(node);
                break;
        }
    }

    private static startBattle(node: MapNode) {
        ScreenManager.showGameScreen();
        const totalKomi = RoguelikeRunManager.getTotalKomi();
        GameController.initGame({
            playerCount: 2,
            gameMode: '1via',
            humanColor: 1, // En expediciones Roguelike el jugador siempre inicia con Negras
            difficulty: node.battleConfig?.aiDifficulty || 'easy',
            shape: node.battleConfig?.shape || 'square',
            size: node.battleConfig?.size || 9,
            komi: totalKomi,
            ruleStyle: 'roguelite',
            heroId: RoguelikeRunManager.selectedHero,
            enemyHeroId: node.battleConfig?.enemyHeroId || null
        });
        HUDController.showAlert(`⚔️ ¡Comienza la batalla contra ${node.battleConfig?.enemyName || 'el rival'}!`);
    }

    public static getRewardOptionsForBattle(): { type: 'spell' | 'poly'; id: string; name: string; icon: string; desc: string }[] {
        const pool: { type: 'spell' | 'poly'; id: string; name: string; icon: string; desc: string }[] = [
            { type: 'spell', id: 'rewind', name: 'Pergamino: Rebobinar (+1)', icon: '⏳', desc: 'Deshace el último turno completo y restaura la posición.' },
            { type: 'spell', id: 'meteor', name: 'Pergamino: Meteorito (+1)', icon: '☄️', desc: 'Destruye una piedra enemiga al azar en el Goban.' },
            { type: 'spell', id: 'shield', name: 'Pergamino: Escudo Sagrado (+1)', icon: '🛡️', desc: 'Tu siguiente piedra será inmune a capturas.' },
            { type: 'spell', id: 'convert', name: 'Pergamino: Inversión Yin-Yang (+1)', icon: '☯️', desc: 'Transmuta 1 piedra enemiga en una aliada de tu bando.' },
            { type: 'poly', id: 'domino', name: 'Ficha: Duplicidad 2x1 (+1)', icon: '🀄', desc: 'Coloca 2 piedras unidas indisolublemente. Rota con [R].' },
            { type: 'poly', id: 'sprouting', name: 'Ficha: Germinante 1x1 (+1)', icon: '🌿', desc: 'Cada 2 turnos brota automáticamente una piedra aliada extra.' },
            { type: 'poly', id: 'monolith', name: 'Ficha: Monolito 2x2 (+1)', icon: '🧱', desc: 'Titán de 4 piedras unidas para asegurar esquinas sólidas.' }
        ];

        const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
        this.selectedRewardItem = shuffled[0];
        return shuffled;
    }

    public static handleRematchOrRewardButton() {
        if (RoguelikeRunManager.isRunActive) {
            const report = GameController.state?.scoreReport;
            const humanWon = (GameController.config.humanColor === 1 && report?.winner === 'black') || 
                             (GameController.config.humanColor === 2 && report?.winner === 'white');

            if (humanWon) {
                // Victoria en Roguelike -> Reclamar recompensa y avanzar
                this.claimReward();
            } else {
                // Derrota -> Fin de la expedición
                ModalManager.closeScoreModal();
                RoguelikeRunManager.clearSavedRun();
                RoguelikeRunManager.isRunActive = false;
                ScreenManager.showMainMenu();
                HUDController.showAlert("💀 Has sucumbido en el camino espiritual del Go.");
            }
        } else {
            // Modo Libre: Revancha
            ModalManager.closeScoreModal();
            GameController.initGame();
        }
    }

    public static claimReward() {
        if (this.selectedRewardItem) {
            if (this.selectedRewardItem.type === 'spell') {
                RogueliteManager.addSpell(this.selectedRewardItem.id as SpellId, 1);
            } else if (this.selectedRewardItem.type === 'poly') {
                RoguelikeRunManager.addPolyomino(this.selectedRewardItem.id as any, 1);
            }
        }
        RoguelikeRunManager.completeCurrentNode();

        ModalManager.closeScoreModal();

        const node = RoguelikeRunManager.getCurrentNode();
        if (node && node.tier === 5) {
            // ¡Expedición completada con éxito!
            HUDController.showAlert("🏆 ¡HAS CONQUISTADO LA EXPEDICIÓN DE CRAZY GO! ¡Eres un Gran Maestro!");
            RoguelikeRunManager.clearSavedRun();
            RoguelikeRunManager.isRunActive = false;
            ScreenManager.showMainMenu();
        } else {
            ScreenManager.showRoguelikeMapScreen();
            this.renderMap();
            const rewardName = this.selectedRewardItem ? this.selectedRewardItem.name : 'Recompensa';
            HUDController.showAlert(`✨ ¡${rewardName} obtenido! Elige tu próximo camino.`);
        }
    }

    private static showSanctuaryEvent(node: MapNode) {
        ModalManager.showEventModal(
            '⛩️',
            'Santuario Sagrado de los Espíritus',
            'Una energía mística envuelve este altar sagrado de piedra. Los espíritus ancestrales te ofrecen su bendición:',
            [
                {
                    id: 'restore_active',
                    label: 'Bendición del Héroe (+1 Rebobinar y Habilidad)',
                    sub: 'Recupera la Habilidad de tu Campeón y recibes +1 Pergamino de Rebobinar Tiempo.',
                    icon: '✨',
                    onClick: () => {
                        ChampionManager.resetForMatch(RoguelikeRunManager.selectedHero);
                        RogueliteManager.addSpell('rewind', 1);
                        RoguelikeRunManager.completeNode(node.id);
                        ModalManager.closeEventModal();
                        this.renderMap();
                        HUDController.showAlert("✨ ¡Habilidad de Campeón restaurada y +1 Rebobinar recibido!");
                        SoundFX.playUndo();
                    }
                },
                {
                    id: 'komi_boost',
                    label: 'Ofrenda Celestial (+1.5 Komi)',
                    sub: 'Aumenta tu bonificación de Komi permanente para todas las batallas venideras.',
                    icon: '💎',
                    onClick: () => {
                        RoguelikeRunManager.permanentKomiBonus += 1.5;
                        RoguelikeRunManager.completeNode(node.id);
                        ModalManager.closeEventModal();
                        this.renderMap();
                        HUDController.showAlert("💎 ¡Komi permanente aumentado en +1.5 puntos!");
                        SoundFX.playUndo();
                    }
                },
                {
                    id: 'poly_blessing',
                    label: 'Ofrenda de los Kami (+1 Ficha Germinante y +1 Dominó)',
                    sub: 'Encuentras artefactos ancestrales consagrados para tu alforja táctica.',
                    icon: '🌿',
                    onClick: () => {
                        RoguelikeRunManager.addPolyomino('sprouting', 1);
                        RoguelikeRunManager.addPolyomino('domino', 1);
                        RoguelikeRunManager.completeNode(node.id);
                        ModalManager.closeEventModal();
                        this.renderMap();
                        HUDController.showAlert("🌿 ¡Has recibido 1 Ficha Germinante y 1 Dominó!");
                        SoundFX.playUndo();
                    }
                }
            ]
        );
    }

    private static showRestEvent(node: MapNode) {
        ModalManager.showEventModal(
            '🏕️',
            'Zona de Meditación y Descanso',
            'El calor de la hoguera y el sonido del viento te permiten reposar tu mente y reponer fuerzas.',
            [
                {
                    id: 'rest_recharge',
                    label: 'Meditar y Reponer (+1 Carga a Hechizos y Poliminós)',
                    sub: 'Restaura +1 uso a tus pergaminos y fichas poliminó que posees.',
                    icon: '🧘',
                    onClick: () => {
                        RogueliteManager.getSpells().forEach(s => {
                            if (s.usesLeft > 0 || s.id === 'rewind') {
                                s.usesLeft += 1;
                            }
                        });
                        if (RoguelikeRunManager.polyominoes.domino > 0) RoguelikeRunManager.polyominoes.domino += 1;
                        if (RoguelikeRunManager.polyominoes.sprouting > 0) RoguelikeRunManager.polyominoes.sprouting += 1;
                        if (RoguelikeRunManager.polyominoes.monolith > 0) RoguelikeRunManager.polyominoes.monolith += 1;

                        RoguelikeRunManager.saveToLocalStorage();
                        RoguelikeRunManager.completeNode(node.id);
                        ModalManager.closeEventModal();
                        this.renderMap();
                        HUDController.showAlert("🧘 ¡Tus pergaminos y fichas han recuperado +1 carga!");
                        SoundFX.playUndo();
                    }
                },
                {
                    id: 'rest_komi',
                    label: 'Estudiar Estrategia Zen (+2.0 Komi)',
                    sub: 'Adquieres sabiduría táctica para ganar ventaja de puntuación permanente.',
                    icon: '📜',
                    onClick: () => {
                        RoguelikeRunManager.permanentKomiBonus += 2.0;
                        RoguelikeRunManager.completeNode(node.id);
                        ModalManager.closeEventModal();
                        this.renderMap();
                        HUDController.showAlert("📜 ¡Komi permanente aumentado en +2.0 puntos!");
                        SoundFX.playUndo();
                    }
                }
            ]
        );
    }

    private static showMerchantStore(node: MapNode) {
        const storeCatalog: { type: 'spell' | 'poly'; id: string; name: string; icon: string; desc: string }[] = [
            { type: 'spell', id: 'rewind', name: 'Pergamino: Rebobinar (+1)', icon: '⏳', desc: 'Deshace el último turno completo y restaura la posición.' },
            { type: 'spell', id: 'meteor', name: 'Pergamino: Meteorito (+1)', icon: '☄️', desc: 'Destruye una piedra enemiga al azar en el Goban.' },
            { type: 'spell', id: 'shield', name: 'Pergamino: Escudo Sagrado (+1)', icon: '🛡️', desc: 'Tu siguiente piedra será inmune a capturas durante 2 turnos.' },
            { type: 'spell', id: 'convert', name: 'Pergamino: Inversión Yin-Yang (+1)', icon: '☯️', desc: 'Transmuta 1 piedra enemiga a tu color.' },
            { type: 'poly', id: 'domino', name: 'Ficha: Dominó 2x1 (+1)', icon: '🀄', desc: 'Coloca 2 piedras unidas indisolublemente. Rota con [R].' },
            { type: 'poly', id: 'sprouting', name: 'Ficha: Germinante 1x1 (+1)', icon: '🌿', desc: 'Brota automáticamente una piedra aliada cada 2 turnos.' },
            { type: 'poly', id: 'monolith', name: 'Ficha: Monolito 2x2 (+1)', icon: '🧱', desc: 'Bloque titán de 4 piedras unidas en cuadrado.' }
        ];

        // 4 Opciones en la tienda
        const shopItems = [...storeCatalog].sort(() => 0.5 - Math.random()).slice(0, 4);
        const selectedIds = new Set<string>();

        const renderShop = () => {
            const count = selectedIds.size;
            ModalManager.showEventModal(
                '🛒',
                `Mercader de Pergaminos y Fichas (${count}/2 elegidas)`,
                'Un monje errante te ofrece artefactos y pergaminos sagrados de Go. Puedes elegir hasta 2 opciones de forma gratuita:',
                shopItems.map(item => {
                    const isSelected = selectedIds.has(item.id);
                    return {
                        id: item.id,
                        label: `${item.name} ${isSelected ? '✓ (Elegido)' : '(Gratis)'}`,
                        sub: item.desc,
                        icon: item.icon,
                        disabled: !isSelected && count >= 2,
                        onClick: () => {
                            if (isSelected) {
                                selectedIds.delete(item.id);
                                SoundFX.playUndo();
                            } else if (count < 2) {
                                selectedIds.add(item.id);
                                SoundFX.playPlaceStone();
                            }
                            renderShop();
                        }
                    };
                })
            );

            const btnLeave = document.getElementById('btn-event-leave');
            if (btnLeave) {
                btnLeave.innerText = count > 0 ? `Reclamar ${count} ${count === 1 ? 'Recompensa' : 'Recompensas'} y Continuar ➔` : "Continuar Ruta (Sin elegir) ➔";
                btnLeave.onclick = () => {
                    selectedIds.forEach(id => {
                        const it = shopItems.find(x => x.id === id);
                        if (it) {
                            if (it.type === 'spell') {
                                RogueliteManager.addSpell(it.id as SpellId, 1);
                            } else {
                                RoguelikeRunManager.addPolyomino(it.id as any, 1);
                            }
                        }
                    });
                    RoguelikeRunManager.completeNode(node.id);
                    ModalManager.closeEventModal();
                    this.renderMap();
                    HUDController.showAlert(count > 0 ? `✨ ¡Has obtenido ${count} ${count === 1 ? 'recompensa' : 'recompensas'} del mercader!` : "🗺️ Has proseguido tu ruta en el mapa.");
                    SoundFX.playPlaceStone();
                };
            }
        };

        renderShop();
    }
}
