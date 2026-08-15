// controllers/OnlineController.ts - Orquestador de Multijugador Online P2P (WebRTC 2P y 4P, Salas y Sincronización)
import type { 
    BoardShape, 
    BoardSize, 
    PlayerId, 
    HeroId,
    OnlineGameConfig 
} from '../types';
import { NetworkManager, type PlayerSlotInfo } from '../network/NetworkManager';
import { SoundFX } from '../audio/SoundFX';
import { ScreenManager } from '../ui/ScreenManager';
import { ModalManager } from '../ui/ModalManager';
import { HUDController } from '../ui/HUDController';
import { GameController } from './GameController';

export class OnlineController {
    public static onlinePlayerCount: 2 | 4 = 2;
    public static onlineHostColor: PlayerId = 1;
    public static onlineGameType: 'standard' | 'coop_rogue' = 'standard';
    public static onlineShape: BoardShape = 'square';
    public static onlineSize: BoardSize = 9;
    public static onlineKomi: number = 6.5;
    public static onlineHostHero: HeroId | null = null;
    public static onlineGuestHero: HeroId | null = null;
    public static currentShareUrl: string = '';

    public static sanitizeRoomCode(raw: string): string {
        if (!raw) return '';
        let code = raw.trim();
        // Si el usuario pega un enlace completo (ej: http://localhost:5173/?join=GO-7799)
        if (code.includes('?') || code.includes('join=') || code.includes('room=')) {
            try {
                const url = new URL(code.startsWith('http') ? code : `http://crazygo.local/${code}`);
                const qJoin = url.searchParams.get('join') || url.searchParams.get('room');
                if (qJoin) code = qJoin;
            } catch {
                const match = code.match(/[?&](?:join|room)=([A-Za-z0-9_-]+)/i);
                if (match) code = match[1];
            }
        }
        code = code.toUpperCase().trim();
        const goMatch = code.match(/GO-\d{4}/i);
        if (goMatch) {
            return goMatch[0].toUpperCase();
        }
        const digitMatch = code.match(/^\d{4}$/);
        if (digitMatch) {
            return `GO-${digitMatch[0]}`;
        }
        return code;
    }

    public static init() {
        // Enlazar callbacks de red con el GameController
        GameController.setOnlineCallbacks(
            (nodeId) => NetworkManager.sendMove(nodeId),
            () => NetworkManager.sendPass(),
            (skillType, targetNodeId) => NetworkManager.sendSkill(skillType, targetNodeId)
        );

        NetworkManager.onSkillReceived = (skillType, targetNodeId, senderColor) => {
            GameController.handleRemoteSkill(skillType, targetNodeId, senderColor);
        };

        // Callbacks de NetworkManager
        NetworkManager.onPlayerConnected = (assignedColor: PlayerId, playerCount: 2 | 4) => {
            ModalManager.closeOnlineModal();
            ScreenManager.showGameScreen();

            const isCoop = !!NetworkManager.currentConfig?.isCoopRogue;
            const myHero = (assignedColor === (NetworkManager.currentConfig?.hostColor || 1))
                ? (NetworkManager.currentConfig?.hostHero || null)
                : (NetworkManager.currentConfig?.guestHeroes ? NetworkManager.currentConfig.guestHeroes[assignedColor] : null) || this.onlineGuestHero;

            GameController.localOnlineColor = assignedColor;
            GameController.initGame({
                gameMode: 'online',
                ruleStyle: isCoop ? 'roguelite' : 'classic',
                isCoopRogue: isCoop,
                coopSubTurn: 1,
                playerCount: isCoop ? 2 : playerCount,
                humanColor: isCoop ? 1 : assignedColor,
                komi: this.onlineKomi,
                shape: this.onlineShape,
                size: this.onlineSize,
                heroId: myHero
            });

            if (isCoop) {
                const roleLabel = assignedColor === 1 ? 'Anfitrión (Turno 1)' : 'Compañero (Turno 2)';
                HUDController.showAlert(`🤝 ¡Expedición Roguelike Cooperativa iniciada! Compartís el bando ⚫ Negras. Rol: ${roleLabel}.`);
            } else {
                const colorNames: Record<PlayerId, string> = {
                    1: 'Negras ⚫ (P1)',
                    2: 'Blancas ⚪ (P2)',
                    3: 'Esmeralda 🟢 (P3)',
                    4: 'Amatista 🟣 (P4)'
                };
                HUDController.showAlert(`🎮 ¡Partida en red iniciada (${playerCount}P)! Juegas como ${colorNames[assignedColor]}.`);
            }
            SoundFX.playPlaceStone();
        };

        NetworkManager.onLobbyUpdated = (connectedCount: number, slots: PlayerSlotInfo[]) => {
            const totalTarget = NetworkManager.currentConfig?.playerCount || this.onlinePlayerCount;
            const statusText = `Sala abierta (${connectedCount}/${totalTarget} conectados). Comparte el código.`;
            ModalManager.updateOnlineLobbyStatus(statusText, slots, NetworkManager.assignedColor);
        };

        NetworkManager.onMoveReceived = (nodeId: string) => {
            if (GameController.renderer) {
                GameController.renderer.handleNodeClick(nodeId, false);
                GameController.renderer.isInteractive = GameController.isLocalPlayerTurn();
            }
        };

        NetworkManager.onPassReceived = () => {
            GameController.handlePass(false);
            if (GameController.renderer) {
                GameController.renderer.isInteractive = GameController.isLocalPlayerTurn();
            }
        };

        NetworkManager.onGameEndReceived = () => {
            GameController.showFinalScoreModal();
        };

        NetworkManager.onPeerDisconnected = () => {
            HUDController.showAlert("⚠️ Un jugador se ha desconectado de la partida.");
        };

        NetworkManager.onError = (msg: string) => {
            HUDController.showAlert(`⚠️ ${msg}`);
        };
    }

    public static openOnlineModal() {
        ModalManager.openOnlineModal();
        ModalManager.switchOnlineTab('create');
        ModalManager.updateOnlineModalUI(
            this.onlineHostColor, 
            this.onlineShape, 
            this.onlineSize, 
            this.onlineKomi, 
            this.onlinePlayerCount,
            this.onlineHostHero
        );
        ModalManager.updateOnlineGuestHeroUI(this.onlineGuestHero);
        this.startHostingRoom();
    }

    public static startHostingRoom() {
        const codeBox = document.getElementById('display-room-code') || document.getElementById('online-room-code-display');
        const statusBox = document.getElementById('host-waiting-status') || document.getElementById('online-status-box');
        const statusText = document.getElementById('online-lobby-status-text') || document.getElementById('online-status-text');

        if (statusBox && statusText) {
            statusBox.classList.remove('hidden');
            statusText.innerText = "Creando sala P2P y esperando código...";
        }

        const config: OnlineGameConfig = {
            shape: this.onlineShape,
            size: this.onlineSize,
            komi: this.onlineKomi,
            hostColor: this.onlinePlayerCount === 4 ? 1 : this.onlineHostColor,
            playerCount: this.onlineGameType === 'coop_rogue' ? 2 : this.onlinePlayerCount,
            hostHero: this.onlineHostHero,
            isCoopRogue: this.onlineGameType === 'coop_rogue'
        };

        NetworkManager.hostRoom(
            config,
            (roomCode) => {
                if (codeBox) codeBox.innerText = roomCode;
                
                const currentBase = window.location.origin;
                this.currentShareUrl = `${currentBase}/?join=${roomCode}`;

                const initialText = `Esperando a que se unan los jugadores a la sala... (1/${this.onlinePlayerCount})`;
                if (statusText) {
                    statusText.innerText = initialText;
                }
            },
            (errMsg) => {
                if (statusText) {
                    statusText.innerText = `Error: ${errMsg}`;
                }
            }
        );
    }

    public static joinOnlineRoom(roomCode: string) {
        const cleanCode = this.sanitizeRoomCode(roomCode);
        if (!cleanCode) {
            HUDController.showAlert("Introduce un código de sala válido (ej: GO-4821).");
            return;
        }

        const statusBox = document.getElementById('join-status-box') || document.getElementById('online-status-box');
        const statusText = document.getElementById('join-status-text') || document.getElementById('online-status-text');
        if (statusBox && statusText) {
            statusBox.classList.remove('hidden');
            statusText.innerText = `Conectando a la sala ${cleanCode}...`;
        }

        NetworkManager.joinRoom(
            cleanCode,
            this.onlineGuestHero,
            (config: OnlineGameConfig, assignedColor: PlayerId, playerCount: 2 | 4) => {
                ModalManager.closeOnlineModal();
                ScreenManager.showGameScreen();

                const myHero = (assignedColor === config.hostColor)
                    ? (config.hostHero || null)
                    : (config.guestHeroes ? config.guestHeroes[assignedColor] : null) || this.onlineGuestHero;

                GameController.localOnlineColor = assignedColor;

                GameController.initGame({
                    gameMode: 'online',
                    ruleStyle: 'classic',
                    playerCount: playerCount,
                    humanColor: assignedColor,
                    komi: config.komi,
                    shape: config.shape,
                    size: config.size,
                    heroId: myHero
                });

                const colorNames: Record<PlayerId, string> = {
                    1: 'Negras ⚫ (P1)',
                    2: 'Blancas ⚪ (P2)',
                    3: 'Esmeralda 🟢 (P3)',
                    4: 'Amatista 🟣 (P4)'
                };

                HUDController.showAlert(`🎮 ¡Conectado a la sala (${playerCount}P)! Juegas como ${colorNames[assignedColor]}.`);
                SoundFX.playPlaceStone();
            },
            (errMsg) => {
                if (statusText) {
                    statusText.innerText = `❌ ${errMsg}`;
                }
                HUDController.showAlert(`Error al unirse: ${errMsg}`);
                SoundFX.playIllegal();
            }
        );
    }

    public static forceStartOnlineGame() {
        NetworkManager.requestStartGame();
    }

    public static copyRoomLink() {
        if (this.currentShareUrl) {
            const onSuccess = () => {
                const btn = document.getElementById('btn-copy-room-link');
                if (btn) btn.innerHTML = '<span>¡Copiado! ✅</span>';
                setTimeout(() => {
                    if (btn) btn.innerHTML = '<span>📋 Copiar Enlace</span>';
                }, 2000);
                HUDController.showAlert("Enlace copiado al portapapeles. ¡Pásaselo a tus amigos!");
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(this.currentShareUrl).then(onSuccess).catch(() => {
                    HUDController.showAlert(`Código de sala: ${NetworkManager.currentRoomCode}`);
                });
            } else {
                onSuccess();
            }
        }
    }
}
