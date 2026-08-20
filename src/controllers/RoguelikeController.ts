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
import { GameEventBus } from '../events/GameEventBus';
import { t, translateEnemyName, getLanguage } from '../i18n/i18n';

export class RoguelikeController {
    public static tempRogueDifficulty: RogueliteDifficulty = 'easy';
    public static tempRogueHero: HeroId = 'normal';
    public static tempRogueMode: '1p' | 'coop' = '1p';
    public static mapRenderer: RoguelikeMapRenderer | null = null;
    public static selectedRewardItem: { type: 'spell' | 'poly'; id: string; name: string; icon: string; desc: string } | null = null;
    public static pendingGoldReward: number = 0;
    public static tempLoanHero: HeroId | null = null;

    private static heroKeys: HeroId[] = ['normal', 'tengu', 'himiko', 'kitsune', 'ronin', 'alchemist', 'ryujin'];
    private static lastHeroSwitchTime: number = 0;

    public static prevHero() {
        const now = Date.now();
        if (now - this.lastHeroSwitchTime < 150) return;
        this.lastHeroSwitchTime = now;

        const idx = this.heroKeys.indexOf(this.tempRogueHero);
        const prevIdx = (idx - 1 + this.heroKeys.length) % this.heroKeys.length;
        this.tempRogueHero = this.heroKeys[prevIdx];
        ModalManager.updateRoguelikeSetupModalUI(this.tempRogueMode, this.tempRogueDifficulty, this.tempRogueHero);
        SoundFX.playPlaceStone();
    }

    public static nextHero() {
        const now = Date.now();
        if (now - this.lastHeroSwitchTime < 150) return;
        this.lastHeroSwitchTime = now;

        const idx = this.heroKeys.indexOf(this.tempRogueHero);
        const nextIdx = (idx + 1) % this.heroKeys.length;
        this.tempRogueHero = this.heroKeys[nextIdx];
        ModalManager.updateRoguelikeSetupModalUI(this.tempRogueMode, this.tempRogueDifficulty, this.tempRogueHero);
        SoundFX.playPlaceStone();
    }

    public static setHero(heroId: HeroId) {
        this.tempRogueHero = heroId;
        ModalManager.updateRoguelikeSetupModalUI(this.tempRogueMode, this.tempRogueDifficulty, this.tempRogueHero);
        SoundFX.playPlaceStone();
    }

    public static setDifficulty(diff: RogueliteDifficulty) {
        this.tempRogueDifficulty = diff;
        ModalManager.updateRoguelikeSetupModalUI(this.tempRogueMode, this.tempRogueDifficulty, this.tempRogueHero);
        SoundFX.playPlaceStone();
    }

    public static setMode(mode: '1p' | 'coop') {
        this.tempRogueMode = mode;
        ModalManager.updateRoguelikeSetupModalUI(this.tempRogueMode, this.tempRogueDifficulty, this.tempRogueHero);
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
            ModalManager.updateRoguelikeSetupModalUI(this.tempRogueMode, this.tempRogueDifficulty, this.tempRogueHero);
        }
    }

    public static resumeSavedRun() {
        ModalManager.closeRogueChoiceModal();
        if (!RoguelikeRunManager.isRunActive || !RoguelikeRunManager.map) {
            RoguelikeRunManager.loadFromLocalStorage();
        }
        this.resumeMap();
        const isEn = getLanguage() === 'en';
        const heroName = RoguelikeRunManager.HEROES[RoguelikeRunManager.selectedHero]?.name || (isEn ? 'Champion' : 'Campeón');
        HUDController.showAlert(isEn ? `🗺️ Expedition resumed (${heroName}).` : `🗺️ Expedición reanudada (${heroName}).`);
        SoundFX.playPlaceStone();
    }

    public static resumeActiveRun() {
        this.resumeSavedRun();
    }

    public static startFreshRunPrompt() {
        ModalManager.closeRogueChoiceModal();
        RoguelikeRunManager.clearSavedRun();
        RoguelikeRunManager.isRunActive = false;
        RoguelikeRunManager.map = null;
        RoguelikeRunManager.currentNodeId = null;

        ModalManager.openRoguelikeSetupModal();
        ModalManager.updateRoguelikeSetupModalUI(this.tempRogueMode, this.tempRogueDifficulty, this.tempRogueHero);
        SoundFX.playPlaceStone();
    }

    public static abandonRun() {
        RoguelikeRunManager.clearSavedRun();
        RoguelikeRunManager.isRunActive = false;
        ScreenManager.showMainMenu();
        const isEn = getLanguage() === 'en';
        HUDController.showAlert(isEn ? "Expedition cancelled." : "Expedición cancelada.");
        SoundFX.playPlaceStone();
    }

    public static startNewExpedition() {
        ModalManager.closeRoguelikeSetupModal();
        RoguelikeRunManager.startRun(this.tempRogueDifficulty, this.tempRogueHero, this.tempRogueMode);
        ChampionManager.resetForMatch(this.tempRogueHero);

        ScreenManager.showRoguelikeMapScreen();
        this.renderMap();
        const isEn = getLanguage() === 'en';
        HUDController.showAlert(isEn ? `🗺️ New expedition started with ${RoguelikeRunManager.HEROES[this.tempRogueHero].name}!` : `🗺️ ¡Nueva expedición iniciada con ${RoguelikeRunManager.HEROES[this.tempRogueHero].name}!`);
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
        const isEn = getLanguage() === 'en';
        if (node.status !== 'available' && node.status !== 'current') {
            HUDController.showAlert(isEn ? "This node is not currently available." : "Este nodo no está disponible para avanzar.");
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
        const isCoop = RoguelikeRunManager.gameMode === 'coop';
        const heroForBattle = this.tempLoanHero || RoguelikeRunManager.selectedHero;
        this.tempLoanHero = null; // Se consume para la batalla actual

        GameController.initGame({
            playerCount: 2,
            gameMode: '1via',
            isCoopRogue: isCoop,
            isRoguelikeMatch: true,
            coopSubTurn: isCoop ? 1 : undefined,
            humanColor: 1, // En expediciones Roguelike el jugador siempre inicia con Negras
            difficulty: node.battleConfig?.aiDifficulty || 'easy',
            shape: node.battleConfig?.shape || 'square',
            size: node.battleConfig?.size || 9,
            komi: totalKomi,
            ruleStyle: 'roguelite',
            heroId: heroForBattle,
            enemyHeroId: node.battleConfig?.enemyHeroId || null
        });
        const enemy = translateEnemyName(node.battleConfig?.enemyName || t('hud.player_rival'));
        HUDController.showAlert(t('roguelike.battle_start', { enemy }));
    }

    public static getRewardOptionsForBattle(): { type: 'spell' | 'poly'; id: string; name: string; icon: string; desc: string }[] {
        const isEn = getLanguage() === 'en';
        const pool: { type: 'spell' | 'poly'; id: string; name: string; icon: string; desc: string }[] = isEn ? [
            { type: 'spell', id: 'rewind', name: 'Scroll: Rewind (+1)', icon: '⏳', desc: 'Undoes the entire last turn and restores board position.' },
            { type: 'spell', id: 'meteor', name: 'Scroll: Meteor (+1)', icon: '☄️', desc: 'Destroys a random stone (80% enemy, 20% allied) with a falling meteor.' },
            { type: 'spell', id: 'shield', name: 'Scroll: Divine Shield (+1)', icon: '🛡️', desc: 'Your next stone will be immune to captures for 2 turns.' },
            { type: 'spell', id: 'convert', name: 'Scroll: Yin-Yang Inversion (+1)', icon: '☯️', desc: 'Transmutes 1 enemy stone to your color.' },
            { type: 'poly', id: 'domino', name: 'Tile: Duplicity 2x1 (+1)', icon: '🀄', desc: 'Places 2 connected stones. Rotates with [R].' },
            { type: 'poly', id: 'sprouting', name: 'Tile: Sprouting 1x1 (+1)', icon: '🌿', desc: 'Automatically sprouts an extra allied stone every 2 turns.' },
            { type: 'poly', id: 'monolith', name: 'Tile: Monolith 2x2 (+1)', icon: '🧱', desc: 'Titan block of 4 joined stones for solid corners.' }
        ] : [
            { type: 'spell', id: 'rewind', name: 'Pergamino: Rebobinar (+1)', icon: '⏳', desc: 'Deshace el último turno completo y restaura la posición.' },
            { type: 'spell', id: 'meteor', name: 'Pergamino: Meteorito (+1)', icon: '☄️', desc: 'Destruye una piedra al azar (80% enemiga, 20% aliada) con un meteorito.' },
            { type: 'spell', id: 'shield', name: 'Pergamino: Escudo Sagrado (+1)', icon: '🛡️', desc: 'Tu siguiente piedra será inmune a capturas durante 2 turnos.' },
            { type: 'spell', id: 'convert', name: 'Pergamino: Inversión Yin-Yang (+1)', icon: '☯️', desc: 'Transmuta 1 piedra enemiga a tu color.' },
            { type: 'poly', id: 'domino', name: 'Ficha: Duplicidad 2x1 (+1)', icon: '🀄', desc: 'Coloca 2 piedras unidas indisolublemente. Rota con [R].' },
            { type: 'poly', id: 'sprouting', name: 'Ficha: Germinante 1x1 (+1)', icon: '🌿', desc: 'Cada 2 turnos brota automáticamente una piedra aliada extra.' },
            { type: 'poly', id: 'monolith', name: 'Ficha: Monolito 2x2 (+1)', icon: '🧱', desc: 'Titán de 4 piedras unidas para asegurar esquinas sólidas.' }
        ];

        const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
        this.selectedRewardItem = shuffled[0];
        return shuffled;
    }

    public static handleRematchOrRewardButton() {
        if (GameController.config.isRoguelikeMatch === true) {
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
                const isEn = getLanguage() === 'en';
                HUDController.showAlert(isEn ? "💀 You have fallen on the spiritual path of Go." : "💀 Has sucumbido en el camino espiritual del Go.");
            }
        } else {
            // Modo Libre: Revancha
            ModalManager.closeScoreModal();
            GameController.initGame(GameController.config);
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
        const isEn = getLanguage() === 'en';
        if (node && node.tier === 5) {
            // ¡Expedición completada con éxito!
            HUDController.showAlert(isEn ? "🏆 YOU HAVE CONQUERED CRAZY GO EXPEDITION! You are a Grandmaster!" : "🏆 ¡HAS CONQUISTADO LA EXPEDICIÓN DE CRAZY GO! ¡Eres un Gran Maestro!");
            RoguelikeRunManager.clearSavedRun();
            RoguelikeRunManager.isRunActive = false;
            ScreenManager.showMainMenu();
        } else {
            ScreenManager.showRoguelikeMapScreen();
            this.renderMap();
            const rewardName = this.selectedRewardItem ? this.selectedRewardItem.name : (isEn ? 'Reward' : 'Recompensa');
            HUDController.showAlert(isEn ? `✨ ${rewardName} obtained! Choose your next path.` : `✨ ¡${rewardName} obtenido! Elige tu próximo camino.`);
        }
    }

    private static showSanctuaryEvent(node: MapNode) {
        const isEn = getLanguage() === 'en';
        ModalManager.showEventModal(
            '⛩️',
            isEn ? 'Sacred Shrine of the Spirits' : 'Santuario Sagrado de los Espíritus',
            isEn ? 'A mystical aura envelops this ancient stone altar. The spirits offer you their sacred blessing:' : 'Una energía mística envuelve este altar sagrado de piedra. Los espíritus ancestrales te ofrecen su bendición:',
            [
                {
                    id: 'restore_active',
                    label: isEn ? "Hero's Blessing (+1 Rewind & Skill Charge)" : 'Bendición del Héroe (+1 Rebobinar y Habilidad)',
                    sub: isEn ? "Restores your Champion's active skill and grants +1 Time Rewind Scroll." : 'Recupera la Habilidad de tu Campeón y recibes +1 Pergamino de Rebobinar Tiempo.',
                    icon: '✨',
                    onClick: () => {
                        ChampionManager.resetForMatch(RoguelikeRunManager.selectedHero);
                        RogueliteManager.addSpell('rewind', 1);
                        RoguelikeRunManager.completeNode(node.id);
                        ModalManager.closeEventModal();
                        this.renderMap();
                        HUDController.showAlert(isEn ? "✨ Champion Skill restored and +1 Rewind received!" : "✨ ¡Habilidad de Campeón restaurada y +1 Rebobinar recibido!");
                        SoundFX.playUndo();
                    }
                },
                {
                    id: 'spiritual_pact',
                    label: isEn ? 'Spiritual Pact (Borrow Champion for Next Battle)' : 'Pacto Espiritual (Préstamo de Campeón para el Próximo Combate)',
                    sub: isEn ? 'Commune with ancestral champions and choose one to fight as in your upcoming match.' : 'Canaliza la fuerza de otros campeones y elige a uno para encarnarlo en tu próxima batalla.',
                    icon: '🎭',
                    onClick: () => {
                        this.showChampionLoanSelection(node);
                    }
                },
                {
                    id: 'poly_blessing',
                    label: isEn ? 'Blessing of the Kami (+1 Sprouting, +1 Duplicity & +1 Shield)' : 'Ofrenda de los Kami (+1 Germinante, +1 Dominó y +1 Escudo)',
                    sub: isEn ? 'Receive consecrated ancestral polyomino artifacts and a divine aegis for your tactical pouch.' : 'Recibes artefactos ancestrales consagrados y un pergamino de égida divina.',
                    icon: '🌿',
                    onClick: () => {
                        RoguelikeRunManager.addPolyomino('sprouting', 1);
                        RoguelikeRunManager.addPolyomino('domino', 1);
                        RogueliteManager.addSpell('shield', 1);
                        RoguelikeRunManager.completeNode(node.id);
                        ModalManager.closeEventModal();
                        this.renderMap();
                        HUDController.showAlert(isEn ? "🌿 You received 1 Sprouting Tile, 1 Duplicity Tile, and 1 Divine Shield!" : "🌿 ¡Has recibido 1 Ficha Germinante, 1 Dominó y 1 Escudo Divino!");
                        SoundFX.playUndo();
                    }
                }
            ]
        );
    }

    private static showChampionLoanSelection(node: MapNode) {
        const isEn = getLanguage() === 'en';
        const heroes: { id: HeroId; name: string; skill: string; icon: string }[] = isEn ? [
            { id: 'kitsune', name: 'Kitsune', skill: 'Divine Shield: Grants immunity to key stones.', icon: '🦊' },
            { id: 'tengu', name: 'Tengu', skill: 'Meteor Strike: Devastates an enemy region.', icon: '👺' },
            { id: 'ryujin', name: 'Ryūjin', skill: 'Dragon Fury: Incinerates enemy stones upon making eyes.', icon: '🐉' },
            { id: 'ronin', name: 'Ronin', skill: 'Samurai Slash: Transmutes enemy stones with katana precision.', icon: '🗡️' },
            { id: 'alchemist', name: 'Alchemist', skill: 'Chromatic Inversion: Transmutes stones without passing turn.', icon: '⚗️' },
            { id: 'himiko', name: 'Himiko', skill: 'Celestial Stone Rain: Summons massive stone reinforcements.', icon: '👑' }
        ] : [
            { id: 'kitsune', name: 'Kitsune', skill: 'Escudo Divino: Inmunidad para piedras clave.', icon: '🦊' },
            { id: 'tengu', name: 'Tengu', skill: 'Lluvia Meteórica: Arrasa un área de piedras rivales.', icon: '👺' },
            { id: 'ryujin', name: 'Ryūjin', skill: 'Furia del Dragón: Quema piedras rivales al consolidar ojos.', icon: '🐉' },
            { id: 'ronin', name: 'Ronin', skill: 'Tajo del Samurai: Transmuta piedras enemigas al instante.', icon: '🗡️' },
            { id: 'alchemist', name: 'Alquimista', skill: 'Inversión Cromática: Transmuta piedras sin perder el turno.', icon: '⚗️' },
            { id: 'himiko', name: 'Himiko', skill: 'Lluvia Pétrea: Invoca refuerzos celestiales masivos.', icon: '👑' }
        ];

        ModalManager.showEventModal(
            '🎭',
            isEn ? 'Choose Spiritual Champion' : 'Elegir Campeón Espiritual',
            isEn ? 'Select which champion spirit you will channel for your next battle:' : 'Selecciona a qué campeón canalizarás durante tu próximo combate:',
            heroes.map(h => ({
                id: `hero_${h.id}`,
                label: `${h.icon} ${h.name}`,
                sub: h.skill,
                icon: h.icon,
                onClick: () => {
                    this.tempLoanHero = h.id;
                    RoguelikeRunManager.completeNode(node.id);
                    ModalManager.closeEventModal();
                    this.renderMap();
                    HUDController.showAlert(isEn
                        ? `🎭 Spiritual Pact sealed! You will channel ${h.name} in your next battle!`
                        : `🎭 ¡Pacto Espiritual sellado! Canalizarás a ${h.name} en tu próxima batalla!`,
                        3500
                    );
                    SoundFX.playSpecial();
                }
            }))
        );
    }

    private static showRestEvent(node: MapNode) {
        const isEn = getLanguage() === 'en';
        ModalManager.showEventModal(
            '🏕️',
            isEn ? 'Meditation & Rest Area' : 'Zona de Meditación y Descanso',
            isEn ? 'The warmth of the bonfire and the rustling wind calm your mind and restore your strength.' : 'El calor de la hoguera y el sonido del viento te permiten reposar tu mente y reponer fuerzas.',
            [
                {
                    id: 'rest_recharge',
                    label: isEn ? 'Meditate & Replenish (+1 Charge to Spells & Polyominoes)' : 'Meditar y Reponer (+1 Carga a Hechizos y Poliminós)',
                    sub: isEn ? 'Restores +1 use to all spell scrolls and polyomino tiles in your possession.' : 'Restaura +1 uso a tus pergaminos y fichas poliminó que posees.',
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
                        HUDController.showAlert(isEn ? "🧘 All scrolls and tiles recovered +1 charge!" : "🧘 ¡Tus pergaminos y fichas han recuperado +1 carga!");
                        SoundFX.playUndo();
                    }
                },
                {
                    id: 'rest_spells',
                    label: isEn ? 'Arcane Study (+1 Meteor & +1 Inversion Scroll)' : 'Estudio Arcano (+1 Meteorito y +1 Inversión Yin-Yang)',
                    sub: isEn ? 'Gain two powerful offensive tactical spell scrolls for future encounters.' : 'Obtienes dos poderosos pergaminos ofensivos para tus próximos encuentros.',
                    icon: '☄️',
                    onClick: () => {
                        RogueliteManager.addSpell('meteor', 1);
                        RogueliteManager.addSpell('convert', 1);
                        RoguelikeRunManager.completeNode(node.id);
                        ModalManager.closeEventModal();
                        this.renderMap();
                        HUDController.showAlert(isEn ? "☄️ You received 1 Meteor Scroll and 1 Yin-Yang Inversion!" : "☄️ ¡Has recibido 1 Pergamino de Meteorito y 1 Inversión Yin-Yang!");
                        SoundFX.playUndo();
                    }
                },
                {
                    id: 'rest_poly',
                    label: isEn ? 'Tactical Masonry (+1 Monolith 2x2 & +1 Duplicity 2x1)' : 'Forja Táctica (+1 Monolito 2x2 y +1 Dominó 2x1)',
                    sub: isEn ? 'Craft heavyweight tactical polyomino stone blocks for territorial dominance.' : 'Forjas bloques poliminó titánicos para dominar esquinas y consolidar territorio.',
                    icon: '🧱',
                    onClick: () => {
                        RoguelikeRunManager.addPolyomino('monolith', 1);
                        RoguelikeRunManager.addPolyomino('domino', 1);
                        RoguelikeRunManager.completeNode(node.id);
                        ModalManager.closeEventModal();
                        this.renderMap();
                        HUDController.showAlert(isEn ? "🧱 You crafted 1 Monolith 2x2 and 1 Duplicity 2x1!" : "🧱 ¡Has forjado 1 Monolito 2x2 y 1 Dominó 2x1!");
                        SoundFX.playUndo();
                    }
                }
            ]
        );
    }

    private static showMerchantStore(node: MapNode) {
        const isEn = getLanguage() === 'en';
        const storeCatalog: { type: 'spell' | 'poly'; id: string; name: string; image: string; icon: string; desc: string }[] = isEn ? [
            { type: 'spell', id: 'rewind', name: 'Scroll: Rewind (+1)', image: './items/item_rewind.svg', icon: '⏳', desc: 'Undoes the entire last turn and restores board position.' },
            { type: 'spell', id: 'meteor', name: 'Scroll: Meteor (+1)', image: './items/item_meteor.svg', icon: '☄️', desc: 'Destroys a random stone (80% enemy, 20% allied) with a falling meteor.' },
            { type: 'spell', id: 'shield', name: 'Scroll: Divine Shield (+1)', image: './items/item_shield.svg', icon: '🛡️', desc: 'Your next stone will be immune to captures for 2 turns.' },
            { type: 'spell', id: 'convert', name: 'Scroll: Yin-Yang Inversion (+1)', image: './items/item_convert.svg', icon: '☯️', desc: 'Transmutes 1 enemy stone to your color.' },
            { type: 'poly', id: 'domino', name: 'Tile: Duplicity 2x1 (+1)', image: './items/item_domino.svg', icon: '🀄', desc: 'Places 2 indissolubly joined stones. Rotates with [R].' },
            { type: 'poly', id: 'sprouting', name: 'Tile: Sprouting 1x1 (+1)', image: './items/item_sprouting.svg', icon: '🌿', desc: 'Automatically sprouts an extra allied stone every 2 turns.' },
            { type: 'poly', id: 'monolith', name: 'Tile: Monolith 2x2 (+1)', image: './items/item_monolith.svg', icon: '🧱', desc: 'Titan block of 4 joined stones forming a square.' }
        ] : [
            { type: 'spell', id: 'rewind', name: 'Pergamino: Rebobinar (+1)', image: './items/item_rewind.svg', icon: '⏳', desc: 'Deshace el último turno completo y restaura la posición.' },
            { type: 'spell', id: 'meteor', name: 'Pergamino: Meteorito (+1)', image: './items/item_meteor.svg', icon: '☄️', desc: 'Destruye una piedra al azar (80% enemiga, 20% aliada) con un meteorito.' },
            { type: 'spell', id: 'shield', name: 'Pergamino: Escudo Sagrado (+1)', image: './items/item_shield.svg', icon: '🛡️', desc: 'Tu siguiente piedra será inmune a capturas durante 2 turnos.' },
            { type: 'spell', id: 'convert', name: 'Pergamino: Inversión Yin-Yang (+1)', image: './items/item_convert.svg', icon: '☯️', desc: 'Transmuta 1 piedra enemiga a tu color.' },
            { type: 'poly', id: 'domino', name: 'Ficha: Duplicidad 2x1 (+1)', image: './items/item_domino.svg', icon: '🀄', desc: 'Coloca 2 piedras unidas indisolublemente. Rota con [R].' },
            { type: 'poly', id: 'sprouting', name: 'Ficha: Germinante 1x1 (+1)', image: './items/item_sprouting.svg', icon: '🌿', desc: 'Brota automáticamente una piedra aliada cada 2 turnos.' },
            { type: 'poly', id: 'monolith', name: 'Ficha: Monolito 2x2 (+1)', image: './items/item_monolith.svg', icon: '🧱', desc: 'Bloque titán de 4 piedras unidas en cuadrado.' }
        ];

        // 4 Opciones en la tienda
        const shopItems = [...storeCatalog].sort(() => 0.5 - Math.random()).slice(0, 4);
        const selectedIds = new Set<string>();

        const renderShop = () => {
            const count = selectedIds.size;
            const shopTitle = isEn ? `Scroll & Tile Merchant (${count}/2 chosen)` : `Mercader de Pergaminos y Fichas (${count}/2 elegidas)`;
            const shopDesc = isEn ? 'A wandering monk offers sacred Go artifacts and scrolls. Choose up to 2 items for your expedition:' : 'Un monje errante te ofrece artefactos y pergaminos sagrados de Go. Puedes elegir hasta 2 opciones para tu expedición:';

            ModalManager.showEventModal(
                '🛒',
                shopTitle,
                shopDesc,
                shopItems.map(item => {
                    const isSelected = selectedIds.has(item.id);
                    return {
                        id: item.id,
                        label: item.name,
                        sub: item.desc,
                        icon: item.icon,
                        image: item.image,
                        selected: isSelected,
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
                if (isEn) {
                    btnLeave.innerText = count > 0 ? `Claim ${count} ${count === 1 ? 'Reward' : 'Rewards'} & Continue ➔` : "Continue Path (No selection) ➔";
                } else {
                    btnLeave.innerText = count > 0 ? `Reclamar ${count} ${count === 1 ? 'Recompensa' : 'Recompensas'} y Continuar ➔` : "Continuar Ruta (Sin elegir) ➔";
                }

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
                    if (isEn) {
                        HUDController.showAlert(count > 0 ? `✨ You obtained ${count} merchant ${count === 1 ? 'reward' : 'rewards'}!` : "🗺️ You continued your journey along the map.");
                    } else {
                        HUDController.showAlert(count > 0 ? `✨ ¡Has obtenido ${count} ${count === 1 ? 'recompensa' : 'recompensas'} del mercader!` : "🗺️ Has proseguido tu ruta en el mapa.");
                    }
                    SoundFX.playPlaceStone();
                };
            }
        };

        renderShop();
    }
}

// Suscribirse a eventos globales para recompensas de captura en el tablero
GameEventBus.on('ENTITY_CAPTURED', (payload) => {
    if (GameController.config.isRoguelikeMatch === true) {
        const { captive } = payload;
        
        // Lo resolvemos de forma síncrona usando una forma segura si no tenemos i18n importado estáticamente
        // Pero arriba RoguelikeController ya importa algo de i18n? Veamos, asumamos texto simple o import arriba.
        // Mejor evitamos bloqueos con el texto:
        const isEn = document.documentElement.lang === 'en'; 

        if (captive.type === 'chest') {
            import('../core/RoguelikeRunManager').then(m => {
                m.RoguelikeRunManager.addPolyomino('domino', 1);
                m.RoguelikeRunManager.addPolyomino('sprouting', 1);
            });
            import('../ui/HUDController').then(m => m.HUDController.showAlert(isEn ? "🎁 Chest unlocked! (+1 Duplicity & +1 Sprouting)" : "🎁 ¡Has liberado el Cofre! (+1 Dominó y +1 Germinante)"));
        } else if (captive.type === 'hostage') {
            ChampionManager.activeChargesLeft += 1;
            RogueliteManager.addSpell('shield', 1);
            import('../ui/HUDController').then(m => m.HUDController.showAlert(isEn ? "🧙 Monk rescued! (+1 Skill Charge & +1 Divine Shield)" : "🧙 ¡Has rescatado al Monje! (+1 Carga de Habilidad y +1 Escudo Divino)"));
        } else if (captive.type === 'scroll_relic') {
            RogueliteManager.addSpell('rewind', 1);
            import('../ui/HUDController').then(m => m.HUDController.showAlert(isEn ? "📜 You obtained the Sacred Scroll of Rewind (+1)!" : "📜 ¡Has obtenido el Pergamino Sagrado de Rebobinar (+1)"));
        } else if (captive.type === 'spirit') {
            import('../core/RoguelikeRunManager').then(m => m.RoguelikeRunManager.addPolyomino('monolith', 1));
            RogueliteManager.addSpell('convert', 1);
            import('../ui/HUDController').then(m => m.HUDController.showAlert(isEn ? "✨ Guardian Spirit freed! (+1 Monolith Tile 2x2 & +1 Yin-Yang Inversion)" : "✨ ¡Has liberado al Espíritu Guardián! (+1 Ficha Monolito 2x2 y +1 Inversión Yin-Yang)"));
        }
    }
});
