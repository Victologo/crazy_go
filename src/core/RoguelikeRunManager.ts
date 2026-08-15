import { RoguelikeMapGenerator, type RoguelikeMap, type MapNode } from './RoguelikeMapGenerator';
import { RogueliteManager, type SpellId } from './RogueliteManager';
import { t } from '../i18n/i18n';

export type RogueliteDifficulty = 'easy' | 'normal' | 'hard' | 'extreme';
export type HeroId = 'tengu' | 'himiko' | 'kitsune' | 'ronin' | 'alchemist' | 'ryujin' | 'normal';

export interface HeroInfo {
    id: HeroId;
    name: string;
    icon: string;
    title: string;
    description: string;
    image: string;
    faceImage: string;
    quote: string;
    skillType: 'active' | 'passive' | 'none';
    activeName?: string;
    activeDesc?: string;
    activeCharges?: number;
    passiveName?: string;
    passiveDesc?: string;
    startingSpells: { [spellId: string]: number };
}

export class RoguelikeRunManager {
    public static isRunActive: boolean = false;
    public static runDifficulty: RogueliteDifficulty = 'easy';
    public static selectedHero: HeroId = 'tengu';
    
    // Estado del Mapa Procedural y Progresión
    public static map: RoguelikeMap | null = null;
    public static currentNodeId: string | null = null;
    public static magatamas: number = 50; // Monedas espirituales
    public static permanentKomiBonus: number = 0;
    public static completedNodes: Set<string> = new Set();
    public static polyominoes: { sprouting: number; domino: number; monolith: number } = {
        sprouting: 0,
        domino: 0,
        monolith: 0
    };

    private static readonly STORAGE_KEY = 'crazy_go_roguelike_run';

    public static get HEROES(): Record<HeroId, HeroInfo> {
        return {
            normal: {
                id: 'normal',
                name: t('champion.normal.name'),
                icon: '👤',
                title: t('champion.normal.title'),
                description: t('champion.normal.passive_desc'),
                image: '/heroes/normal.png',
                faceImage: '/heroes/normal_face.jpg',
                quote: t('champion.normal.quote'),
                skillType: 'none',
                activeName: t('champion.normal.name'),
                activeDesc: t('champion.normal.passive_desc'),
                passiveName: t('champion.normal.passive_name'),
                passiveDesc: t('champion.normal.passive_desc'),
                startingSpells: { rewind: 2, meteor: 0, shield: 0, convert: 0 }
            },
            tengu: {
                id: 'tengu',
                name: t('champion.tengu.name'),
                icon: '🦅',
                title: t('champion.tengu.title'),
                description: t('champion.tengu.quote'),
                image: '/heroes/tengu.png',
                faceImage: '/heroes/tengu_face.jpg',
                quote: t('champion.tengu.quote'),
                skillType: 'active',
                activeName: t('champion.tengu.active_name'),
                activeDesc: t('champion.tengu.active_desc'),
                activeCharges: 1,
                startingSpells: { rewind: 2, meteor: 0, shield: 0, convert: 0 }
            },
            himiko: {
                id: 'himiko',
                name: t('champion.himiko.name'),
                icon: '✨',
                title: t('champion.himiko.title'),
                description: t('champion.himiko.quote'),
                image: '/heroes/himiko.png',
                faceImage: '/heroes/himiko_face.jpg',
                quote: t('champion.himiko.quote'),
                skillType: 'passive',
                passiveName: t('champion.himiko.passive_name'),
                passiveDesc: t('champion.himiko.passive_desc'),
                startingSpells: { rewind: 2, meteor: 0, shield: 0, convert: 0 }
            },
            kitsune: {
                id: 'kitsune',
                name: t('champion.kitsune.name'),
                icon: '🦊',
                title: t('champion.kitsune.title'),
                description: t('champion.kitsune.quote'),
                image: '/heroes/kitsune.png',
                faceImage: '/heroes/kitsune_face.jpg',
                quote: t('champion.kitsune.quote'),
                skillType: 'active',
                activeName: t('champion.kitsune.active_name'),
                activeDesc: t('champion.kitsune.active_desc'),
                activeCharges: 2,
                startingSpells: { rewind: 2, meteor: 0, shield: 0, convert: 0 }
            },
            ronin: {
                id: 'ronin',
                name: t('champion.ronin.name'),
                icon: '⚡',
                title: t('champion.ronin.title'),
                description: t('champion.ronin.quote'),
                image: '/heroes/ronin.png',
                faceImage: '/heroes/ronin_face.jpg',
                quote: t('champion.ronin.quote'),
                skillType: 'passive',
                passiveName: t('champion.ronin.passive_name'),
                passiveDesc: t('champion.ronin.passive_desc'),
                startingSpells: { rewind: 2, meteor: 0, shield: 0, convert: 0 }
            },
            alchemist: {
                id: 'alchemist',
                name: t('champion.alchemist.name'),
                icon: '⚗️',
                title: t('champion.alchemist.title'),
                description: t('champion.alchemist.quote'),
                image: '/heroes/alchemist.png',
                faceImage: '/heroes/alchemist_face.jpg',
                quote: t('champion.alchemist.quote'),
                skillType: 'active',
                activeName: t('champion.alchemist.active_name'),
                activeDesc: t('champion.alchemist.active_desc'),
                activeCharges: 1,
                startingSpells: { rewind: 2, meteor: 0, shield: 0, convert: 0 }
            },
            ryujin: {
                id: 'ryujin',
                name: t('champion.ryujin.name'),
                icon: '🐲',
                title: t('champion.ryujin.title'),
                description: t('champion.ryujin.quote'),
                image: '/heroes/ryujin.png',
                faceImage: '/heroes/ryujin_face.jpg',
                quote: t('champion.ryujin.quote'),
                skillType: 'passive',
                passiveName: t('champion.ryujin.passive_name'),
                passiveDesc: t('champion.ryujin.passive_desc'),
                startingSpells: { rewind: 2, meteor: 0, shield: 0, convert: 0 }
            }
        };
    }

    public static addPolyomino(type: 'sprouting' | 'domino' | 'monolith', amount: number = 1) {
        this.polyominoes[type] = (this.polyominoes[type] || 0) + amount;
        this.saveToLocalStorage();
    }

    /**
     * Komi base canónico según dificultad en Roguelike:
     * Fácil: 2.5 | Normal/Intermedio: 4.5 | Difícil: 6.5 | Maestro/Gran Maestro: 5.5
     */
    public static getBaseKomi(): number {
        switch (this.runDifficulty) {
            case 'easy': return 2.5;
            case 'normal': return 4.5;
            case 'hard': return 6.5;
            case 'extreme': return 5.5;
            default: return 4.5;
        }
    }

    /**
     * Komi total para Blancas (Base + Bonificaciones de Santuario/Reliquias)
     */
    public static getTotalKomi(): number {
        return this.getBaseKomi() + this.permanentKomiBonus;
    }

    /**
     * Inicia una nueva expedición generando el mapa procedural desde el Nodo 0
     */
    public static startRun(difficulty: RogueliteDifficulty, heroId: HeroId) {
        this.isRunActive = true;
        this.runDifficulty = difficulty;
        this.selectedHero = heroId;
        this.magatamas = 50;
        this.permanentKomiBonus = 0;
        this.completedNodes.clear();
        this.currentNodeId = null;
        this.polyominoes = { sprouting: 0, domino: 0, monolith: 0 };

        // Al inicio de run: solo 2 hechizos de rebobinar
        RogueliteManager.initSpells({ rewind: 2, meteor: 0, shield: 0, convert: 0 });

        // Generar mapa procedural
        this.map = RoguelikeMapGenerator.generateMap(difficulty);
        this.saveToLocalStorage();
    }

    /**
     * Devuelve el nodo actual o el nodo de inicio
     */
    public static getCurrentNode(): MapNode | null {
        if (!this.map) return null;
        if (!this.currentNodeId) {
            return this.map.nodes.get(this.map.startNodeId) || null;
        }
        return this.map.nodes.get(this.currentNodeId) || null;
    }

    /**
     * Selecciona un nodo del mapa para iniciar su batalla o evento
     */
    public static selectNode(nodeId: string): MapNode | null {
        if (!this.map) return null;
        const node = this.map.nodes.get(nodeId);
        if (!node || (node.status !== 'available' && node.status !== 'current')) return null;

        this.currentNodeId = nodeId;
        node.status = 'current';
        this.saveToLocalStorage();
        return node;
    }

    /**
     * Marca el nodo actual (o especificado) como completado, otorga recompensas y desbloquea los siguientes nodos conectados
     */
    public static completeNode(nodeId?: string): boolean {
        if (nodeId) this.currentNodeId = nodeId;
        return this.completeCurrentNode();
    }

    public static completeCurrentNode(): boolean {
        if (!this.map || !this.currentNodeId) return false;

        const current = this.map.nodes.get(this.currentNodeId);
        if (!current) return false;

        current.status = 'completed';
        this.completedNodes.add(this.currentNodeId);

        // Si completamos el nodo Boss, la run ha sido ganada
        if (current.type === 'boss') {
            this.clearSavedRun();
            return true; // Victoria total
        }

        // Bloquear todos los demás nodos de este Tier y tiers inferiores
        for (const n of this.map.nodes.values()) {
            if (n.status === 'available' && n.tier <= current.tier) {
                n.status = 'locked';
            }
        }

        // Desbloquear los nodos conectados directamente
        for (const nextId of current.nextConnectedNodeIds) {
            const nextNode = this.map.nodes.get(nextId);
            if (nextNode && nextNode.status !== 'completed') {
                nextNode.status = 'available';
            }
        }

        this.saveToLocalStorage();
        return false;
    }

    /**
     * Añade Magatamas
     */
    public static addMagatamas(amount: number) {
        this.magatamas += amount;
        this.saveToLocalStorage();
    }

    /**
     * Gasta Magatamas si se dispone de suficiente saldo
     */
    public static spendMagatamas(amount: number): boolean {
        if (this.magatamas >= amount) {
            this.magatamas -= amount;
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    /**
     * Guarda el estado completo de la expedición en localStorage
     */
    public static saveToLocalStorage() {
        if (!this.isRunActive || !this.map) {
            return;
        }

        try {
            const serializedSpells: Record<string, number> = {};
            for (const [id, spell] of RogueliteManager.playerSpells.entries()) {
                serializedSpells[id] = spell.usesLeft;
            }

            const data = {
                isRunActive: this.isRunActive,
                runDifficulty: this.runDifficulty,
                selectedHero: this.selectedHero,
                magatamas: this.magatamas,
                permanentKomiBonus: this.permanentKomiBonus,
                completedNodes: Array.from(this.completedNodes),
                currentNodeId: this.currentNodeId,
                map: {
                    startNodeId: this.map.startNodeId,
                    bossNodeId: this.map.bossNodeId,
                    nodes: Array.from(this.map.nodes.entries()),
                    tiers: this.map.tiers
                },
                spells: serializedSpells,
                polyominoes: this.polyominoes
            };

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Error guardando run en localStorage:", e);
        }
    }

    /**
     * Carga el estado de la expedición desde localStorage si existe
     */
    public static loadFromLocalStorage(): boolean {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return false;

            const data = JSON.parse(raw);
            if (!data || !data.isRunActive || !data.map) return false;

            this.isRunActive = true;
            this.runDifficulty = data.runDifficulty || 'easy';
            this.selectedHero = data.selectedHero || 'tengu';
            this.magatamas = data.magatamas || 50;
            this.permanentKomiBonus = data.permanentKomiBonus || 0;
            this.completedNodes = new Set(data.completedNodes || []);
            this.currentNodeId = data.currentNodeId || null;

            this.map = {
                startNodeId: data.map.startNodeId,
                bossNodeId: data.map.bossNodeId,
                nodes: new Map(data.map.nodes),
                tiers: data.map.tiers
            };

            if (data.spells) {
                for (const [sId, uses] of Object.entries(data.spells)) {
                    const sp = RogueliteManager.playerSpells.get(sId as SpellId);
                    if (sp) sp.usesLeft = uses as number;
                }
            }

            if (data.polyominoes) {
                this.polyominoes = {
                    sprouting: data.polyominoes.sprouting || 0,
                    domino: data.polyominoes.domino || 0,
                    monolith: data.polyominoes.monolith || 0
                };
            } else {
                this.polyominoes = { sprouting: 0, domino: 0, monolith: 0 };
            }

            return true;
        } catch (e) {
            console.error("Error cargando run de localStorage:", e);
            return false;
        }
    }

    /**
     * Limpia la expedición guardada
     */
    public static clearSavedRun() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (e) {
            console.error("Error limpiando run de localStorage:", e);
        }
    }

    /**
     * Comprueba si hay una expedición activa guardada en localStorage
     */
    public static hasSavedRun(): boolean {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            return !!(data && data.isRunActive && data.map);
        } catch {
            return false;
        }
    }
}
