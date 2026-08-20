// network/NetworkManager.ts - Gestor de Red P2P Instantáneo con WebRTC y MQTT Broker Swarm
import { joinRoom, type Room } from '@trystero-p2p/mqtt';
import type { PlayerId, HeroId, OnlineGameConfig } from '../types';
import { getLanguage } from '../i18n/i18n';

export interface PlayerSlotInfo {
    id: PlayerId;
    name: string;
    isHost: boolean;
    connected: boolean;
    heroId?: HeroId | null;
}

export type NetworkMessage =
    | { type: 'INIT_GAME'; config: OnlineGameConfig; assignedColor: PlayerId; playerCount: 2 | 4 }
    | { type: 'LOBBY_UPDATE'; playerCount: 2 | 4; connectedCount: number; slots: PlayerSlotInfo[] }
    | { type: 'GUEST_JOINED'; heroId: HeroId | null }
    | { type: 'HERO_SELECT'; heroId: HeroId | null; senderColor?: PlayerId }
    | { type: 'START_GAME'; config: OnlineGameConfig; assignedColor: PlayerId; playerCount: 2 | 4 }
    | { type: 'REQUEST_START' }
    | { type: 'MOVE'; nodeId: string; senderColor?: PlayerId }
    | { type: 'PASS'; senderColor?: PlayerId }
    | { type: 'SKILL_USE'; skillType: string; targetNodeId: string; senderColor: PlayerId }
    | { type: 'UNDO_REWIND'; senderColor?: PlayerId }
    | { type: 'SCORE' }
    | { type: 'REMATCH'; config: OnlineGameConfig }
    | { type: 'DISCONNECT'; senderColor?: PlayerId };

export class NetworkManager {
    private static room: Room | null = null;
    private static sendFn: ((msg: NetworkMessage, targetPeerId?: string) => void) | null = null;

    private static guestSlots: Map<string, { playerId: PlayerId; heroId?: HeroId | null }> = new Map();
    public static isHost: boolean = false;
    public static currentRoomCode: string | null = null;
    public static currentConfig: OnlineGameConfig | null = null;
    public static assignedColor: PlayerId = 1;
    public static localHero: HeroId | null = null;
    private static hasStartedMatch: boolean = false;

    private static readonly APP_ID = 'crazygo-v6';

    // Callbacks públicos
    public static onPlayerConnected: ((guestColor: PlayerId, playerCount: 2 | 4) => void) | null = null;
    public static onLobbyUpdated: ((connectedCount: number, slots: PlayerSlotInfo[]) => void) | null = null;
    public static onMoveReceived: ((nodeId: string) => void) | null = null;
    public static onPassReceived: (() => void) | null = null;
    public static onSkillReceived: ((skillType: string, targetNodeId: string, senderColor?: PlayerId) => void) | null = null;
    public static onUndoReceived: ((senderColor?: PlayerId) => void) | null = null;
    public static onGameEndReceived: (() => void) | null = null;
    public static onPeerDisconnected: (() => void) | null = null;
    public static onError: ((msg: string) => void) | null = null;

    public static generateRoomCode(): string {
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `GO-${rand}`;
    }

    public static sendHeroSelect(heroId: HeroId | null) {
        this.localHero = heroId;
        if (this.isHost) {
            if (this.currentConfig) {
                this.currentConfig.hostHero = heroId;
                this.broadcastLobbyUpdate();
            }
        } else if (this.sendFn) {
            this.sendFn({
                type: 'HERO_SELECT',
                heroId: heroId,
                senderColor: this.assignedColor
            });
        }
    }

    public static hostRoom(
        config: OnlineGameConfig,
        onReady: (code: string) => void,
        onErrorCb: (err: string) => void
    ) {
        // Si ya estamos hosteando una sala activa, solo actualizamos la configuración sin romper la sala ni regenerar el código
        if (this.isHost && this.currentRoomCode && this.room) {
            this.currentConfig = { 
                ...this.currentConfig,
                ...config, 
                playerCount: config.playerCount || this.currentConfig?.playerCount || 2,
                hostHero: config.hostHero !== undefined ? config.hostHero : (this.currentConfig?.hostHero || null),
            };
            this.assignedColor = config.hostColor;
            onReady(this.currentRoomCode);
            this.broadcastLobbyUpdate();
            return;
        }

        this.disconnect();
        this.isHost = true;
        this.hasStartedMatch = false;
        this.currentConfig = { 
            ...config, 
            playerCount: config.playerCount || 2,
            hostHero: config.hostHero || this.localHero || null,
            guestHeroes: {}
        };
        this.assignedColor = config.hostColor;
        this.currentRoomCode = this.generateRoomCode();
        this.guestSlots.clear();

        try {
            this.room = joinRoom(
                {
                    appId: this.APP_ID,
                    turnConfig: [
                        {
                            urls: 'turn:openrelay.metered.ca:80',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        },
                        {
                            urls: 'turn:openrelay.metered.ca:443',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        }
                    ]
                }, 
                this.currentRoomCode
            );

            const action = this.room.makeAction<string>('game_action');

            this.sendFn = (msg: NetworkMessage, targetPeerId?: string) => {
                const str = JSON.stringify(msg);
                if (targetPeerId) {
                    action.send(str, { target: targetPeerId });
                } else {
                    action.send(str);
                }
            };

            // Al unirse un invitado a la sala
            this.room.onPeerJoin = (peerId: string) => {
                const totalAllowed = (this.currentConfig?.playerCount || 2) - 1;
                if (this.guestSlots.size >= totalAllowed) return;

                // Asignar color libre
                const usedColors = new Set<PlayerId>([this.assignedColor]);
                for (const slot of this.guestSlots.values()) {
                    usedColors.add(slot.playerId);
                }

                let nextColor: PlayerId = 2;
                for (const c of [1, 2, 3, 4] as PlayerId[]) {
                    if (!usedColors.has(c)) {
                        nextColor = c;
                        break;
                    }
                }

                this.guestSlots.set(peerId, { playerId: nextColor, heroId: null });

                // Enviar configuración al recién llegado
                if (this.sendFn) {
                    this.sendFn({
                        type: 'INIT_GAME',
                        config: this.currentConfig!,
                        assignedColor: nextColor,
                        playerCount: this.currentConfig!.playerCount || 2
                    }, peerId);
                }

                this.broadcastLobbyUpdate();

                // Si la sala está llena en 2P, iniciar automáticamente con sincronización de pulso
                const targetPlayers = (this.currentConfig?.playerCount || 2) - 1;
                if (this.guestSlots.size >= targetPlayers) {
                    setTimeout(() => {
                        this.startGame();
                    }, 200);
                }
            };

            this.room.onPeerLeave = (peerId: string) => {
                this.guestSlots.delete(peerId);
                this.broadcastLobbyUpdate();
                if (this.onPeerDisconnected) this.onPeerDisconnected();
            };

            action.onMessage = (rawStr: string, context) => {
                try {
                    const msg = JSON.parse(rawStr) as NetworkMessage;
                    this.handleHostIncomingMessage(context.peerId, msg);
                } catch (e) {
                    console.warn('[P2P Message parse error]:', e);
                }
            };

            onReady(this.currentRoomCode);
            this.broadcastLobbyUpdate();
        } catch (err: unknown) {
            const msg = `Error al crear sala: ${err instanceof Error ? err.message : String(err)}`;
            onErrorCb(msg);
            if (this.onError) this.onError(msg);
        }
    }

    public static startGame() {
        if (!this.isHost || !this.currentConfig || !this.sendFn) return;

        const pCount = this.currentConfig.playerCount || 2;
        
        // Enviar START_GAME con redundancia de 3 pulsos para garantizar llegada inmediata a todos los invitados
        for (let pulse = 0; pulse < 3; pulse++) {
            setTimeout(() => {
                if (!this.sendFn || !this.currentConfig) return;
                // Broadcast general
                this.sendFn({
                    type: 'START_GAME',
                    config: this.currentConfig,
                    assignedColor: 2,
                    playerCount: pCount
                });
                // Mensajes individuales a cada slot
                for (const [peerId, slot] of this.guestSlots.entries()) {
                    this.sendFn({
                        type: 'START_GAME',
                        config: this.currentConfig,
                        assignedColor: slot.playerId,
                        playerCount: pCount
                    }, peerId);
                }
            }, pulse * 150);
        }

        if (!this.hasStartedMatch) {
            this.hasStartedMatch = true;
            if (this.onPlayerConnected) {
                this.onPlayerConnected(this.assignedColor, pCount);
            }
        }
    }

    public static joinRoom(
        roomCode: string,
        guestHero: HeroId | null,
        onConnectedCb: (config: OnlineGameConfig, assignedColor: PlayerId, playerCount: 2 | 4) => void,
        onErrorCb: (err: string) => void
    ) {
        this.disconnect();
        this.isHost = false;
        this.hasStartedMatch = false;
        this.localHero = guestHero;
        this.currentRoomCode = roomCode.toUpperCase().trim();

        try {
            this.room = joinRoom(
                {
                    appId: this.APP_ID,
                    turnConfig: [
                        {
                            urls: 'turn:openrelay.metered.ca:80',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        },
                        {
                            urls: 'turn:openrelay.metered.ca:443',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        }
                    ]
                }, 
                this.currentRoomCode
            );

            const action = this.room.makeAction<string>('game_action');

            this.sendFn = (msg: NetworkMessage, targetPeerId?: string) => {
                const str = JSON.stringify(msg);
                if (targetPeerId) {
                    action.send(str, { target: targetPeerId });
                } else {
                    action.send(str);
                }
            };

            this.room.onPeerJoin = (_peerId: string) => {
                // Al descubrir al anfitrión, notificar llegada y héroe elegido
                if (this.sendFn) {
                    this.sendFn({
                        type: 'GUEST_JOINED',
                        heroId: this.localHero
                    });
                }
            };

            this.room.onPeerLeave = (_peerId: string) => {
                if (this.onPeerDisconnected) this.onPeerDisconnected();
            };

            action.onMessage = (rawStr: string) => {
                try {
                    const msg = JSON.parse(rawStr) as NetworkMessage;
                    this.handleClientIncomingMessage(msg, onConnectedCb);
                } catch (e) {
                    console.warn('[P2P Client parse error]:', e);
                }
            };
        } catch (err: unknown) {
            const msg = `Error al unirse a la sala: ${err instanceof Error ? err.message : String(err)}`;
            onErrorCb(msg);
            if (this.onError) this.onError(msg);
        }
    }

    private static handleHostIncomingMessage(fromPeerId: string, msg: NetworkMessage) {
        if (!msg || !msg.type) return;

        // Retransmitir a otros clientes
        if (this.sendFn) {
            for (const peerId of this.guestSlots.keys()) {
                if (peerId !== fromPeerId) {
                    this.sendFn(msg, peerId);
                }
            }
        }

        switch (msg.type) {
            case 'GUEST_JOINED':
            case 'HERO_SELECT': {
                let slot = this.guestSlots.get(fromPeerId);
                if (!slot) {
                    const usedColors = new Set<PlayerId>([this.assignedColor]);
                    for (const s of this.guestSlots.values()) usedColors.add(s.playerId);
                    let nextColor: PlayerId = 2;
                    for (const c of [1, 2, 3, 4] as PlayerId[]) {
                        if (!usedColors.has(c)) { nextColor = c; break; }
                    }
                    slot = { playerId: nextColor, heroId: msg.heroId };
                    this.guestSlots.set(fromPeerId, slot);
                } else {
                    slot.heroId = msg.heroId;
                }

                if (!this.currentConfig!.guestHeroes) this.currentConfig!.guestHeroes = {};
                this.currentConfig!.guestHeroes[slot.playerId] = msg.heroId;

                // Responder con la configuración y el slot asignado
                if (this.sendFn) {
                    this.sendFn({
                        type: 'INIT_GAME',
                        config: this.currentConfig!,
                        assignedColor: slot.playerId,
                        playerCount: this.currentConfig!.playerCount || 2
                    }, fromPeerId);
                }

                this.broadcastLobbyUpdate();

                // Si son 2 jugadores, iniciar partida
                if (this.guestSlots.size >= ((this.currentConfig?.playerCount || 2) - 1)) {
                    setTimeout(() => {
                        this.startGame();
                    }, 180);
                }
                break;
            }
            case 'REQUEST_START':
                this.startGame();
                break;
            case 'MOVE':
                if (this.onMoveReceived) this.onMoveReceived(msg.nodeId);
                break;
            case 'PASS':
                if (this.onPassReceived) this.onPassReceived();
                break;
            case 'SKILL_USE':
                if (this.onSkillReceived) this.onSkillReceived(msg.skillType, msg.targetNodeId, msg.senderColor);
                break;
            case 'UNDO_REWIND':
                if (this.onUndoReceived) this.onUndoReceived(msg.senderColor);
                break;
            case 'SCORE':
                if (this.onGameEndReceived) this.onGameEndReceived();
                break;
            case 'DISCONNECT':
                if (this.onPeerDisconnected) this.onPeerDisconnected();
                break;
        }
    }

    private static handleClientIncomingMessage(
        msg: NetworkMessage, 
        onConnectedCb: (config: OnlineGameConfig, assignedColor: PlayerId, playerCount: 2 | 4) => void
    ) {
        if (!msg || !msg.type) return;

        switch (msg.type) {
            case 'INIT_GAME':
                this.currentConfig = msg.config;
                this.assignedColor = msg.assignedColor;
                if (this.localHero) {
                    this.sendHeroSelect(this.localHero);
                }
                break;
            case 'LOBBY_UPDATE':
                if (this.onLobbyUpdated) {
                    this.onLobbyUpdated(msg.connectedCount, msg.slots);
                }
                break;
            case 'START_GAME':
                if (!this.hasStartedMatch) {
                    this.hasStartedMatch = true;
                    this.currentConfig = msg.config;
                    this.assignedColor = msg.assignedColor;
                    onConnectedCb(msg.config, msg.assignedColor, msg.playerCount);
                }
                break;
            case 'MOVE':
                if (this.onMoveReceived) this.onMoveReceived(msg.nodeId);
                break;
            case 'PASS':
                if (this.onPassReceived) this.onPassReceived();
                break;
            case 'SKILL_USE':
                if (this.onSkillReceived) this.onSkillReceived(msg.skillType, msg.targetNodeId, msg.senderColor);
                break;
            case 'UNDO_REWIND':
                if (this.onUndoReceived) this.onUndoReceived(msg.senderColor);
                break;
            case 'SCORE':
                if (this.onGameEndReceived) this.onGameEndReceived();
                break;
            case 'DISCONNECT':
                if (this.onPeerDisconnected) this.onPeerDisconnected();
                break;
        }
    }

    public static requestStartGame() {
        if (this.isHost) {
            this.startGame();
        } else if (this.sendFn) {
            this.sendFn({ type: 'REQUEST_START' });
        }
    }

    public static broadcastLobbyUpdate() {
        if (!this.isHost || !this.currentConfig) return;

        const pCount = this.currentConfig.playerCount || 2;
        const totalConnected = 1 + this.guestSlots.size;

        const slots: PlayerSlotInfo[] = [];
        const colorNames: Record<PlayerId, string> = {
            1: 'Negras ⚫ (P1)',
            2: 'Blancas ⚪ (P2)',
            3: 'Esmeralda 🟢 (P3)',
            4: 'Amatista 🟣 (P4)'
        };

        // Host slot
        slots.push({
            id: this.assignedColor,
            name: `Anfitrión (${colorNames[this.assignedColor]})`,
            isHost: true,
            connected: true,
            heroId: this.currentConfig.hostHero || null
        });

        // Guest slots con color real
        const guestEntries = Array.from(this.guestSlots.values());
        const remainingColors = ([1, 2, 3, 4] as PlayerId[]).filter(c => c !== this.assignedColor);

        for (let i = 0; i < pCount - 1; i++) {
            const guest = guestEntries[i];
            const fallbackColor = remainingColors[i] || 2;
            const isEn = getLanguage() === 'en';
            if (guest) {
                const guestHero = guest.heroId || (this.currentConfig.guestHeroes ? this.currentConfig.guestHeroes[guest.playerId] : null) || null;
                const playerWord = isEn ? 'Player' : 'Jugador';
                slots.push({
                    id: guest.playerId,
                    name: `${playerWord} ${guest.playerId} (${colorNames[guest.playerId]})`,
                    isHost: false,
                    connected: true,
                    heroId: guestHero
                });
            } else {
                const waitingWord = isEn ? 'Waiting...' : 'Esperando...';
                slots.push({
                    id: fallbackColor,
                    name: `${waitingWord} (${colorNames[fallbackColor]})`,
                    isHost: false,
                    connected: false,
                    heroId: null
                });
            }
        }

        // Enviar a todos los invitados
        const msg: NetworkMessage = {
            type: 'LOBBY_UPDATE',
            playerCount: pCount,
            connectedCount: totalConnected,
            slots: slots
        };

        if (this.sendFn) {
            this.sendFn(msg);
        }

        if (this.onLobbyUpdated) {
            this.onLobbyUpdated(totalConnected, slots);
        }
    }

    public static sendMove(nodeId: string) {
        if (!this.sendFn) return;
        const msg: NetworkMessage = {
            type: 'MOVE',
            nodeId: nodeId,
            senderColor: this.assignedColor
        };
        this.sendFn(msg);
    }

    public static sendPass() {
        if (!this.sendFn) return;
        const msg: NetworkMessage = {
            type: 'PASS',
            senderColor: this.assignedColor
        };
        this.sendFn(msg);
    }

    public static sendSkill(skillType: string, targetNodeId: string) {
        if (!this.sendFn) return;
        const msg: NetworkMessage = {
            type: 'SKILL_USE',
            skillType,
            targetNodeId,
            senderColor: this.assignedColor
        };
        this.sendFn(msg);
    }

    public static sendUndoRewind() {
        if (!this.sendFn) return;
        const msg: NetworkMessage = {
            type: 'UNDO_REWIND',
            senderColor: this.assignedColor
        };
        this.sendFn(msg);
    }

    public static sendScore() {
        if (!this.sendFn) return;
        const msg: NetworkMessage = { type: 'SCORE' };
        this.sendFn(msg);
    }

    public static disconnect() {
        if (this.room) {
            try {
                this.room.leave();
            } catch (_) {}
                this.room = null;
        }
        this.sendFn = null;
        this.guestSlots.clear();
        this.currentRoomCode = null;
        this.currentConfig = null;
        this.isHost = false;
        this.hasStartedMatch = false;
    }
}
