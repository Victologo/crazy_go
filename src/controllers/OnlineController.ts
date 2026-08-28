import type { 
    BoardShape, 
    BoardSize, 
    BoardBackground,
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
import { getLanguage } from '../i18n/i18n';

import { joinRoom as joinMqttRoom, selfId } from '@trystero-p2p/mqtt';

export class OnlineController {
    public static onlinePlayerCount: 2 | 4 = 2;
    public static onlineHostColor: PlayerId = 1;
    public static onlineGameType: 'standard' | 'coop_rogue' = 'standard';
    public static onlineShape: BoardShape = 'square';
    public static onlineSize: BoardSize = 9;
    public static onlineSeed: number = Math.floor(Math.random() * 9999999);
    public static onlineKomi: number = 6.5;
    public static onlineBackground: BoardBackground = 'combat';
    public static onlineHostHero: HeroId | null = null;
    public static onlineGuestHero: HeroId | null = null;
    public static onlineAIDifficulty: string = '15k';
    public static onlineAISlots: Record<number, string> = { 2: '15k', 3: '15k', 4: '15k' };
    public static currentShareUrl: string = '';
    public static isMatchmaking: boolean = false;
    private static matchmakingInterval: number | null = null;

    public static startMatchmaking(playerCount: 2 | 4) {
        this.isMatchmaking = true;
        this.onlinePlayerCount = playerCount;
        document.getElementById('btn-matchmaking-2p')?.parentElement?.classList.add('hidden');
        document.getElementById('matchmaking-status-box')?.classList.remove('hidden');
        const statusEl = document.getElementById('matchmaking-status-text');
        if (statusEl) {
            const isEn = getLanguage() === 'en';
            statusEl.innerText = isEn ? 'Searching for an opponent...' : 'Buscando oponente...';
        }
        
        // Disconnect from any existing room
        NetworkManager.disconnect();

        // Use a dynamic matchmaking room based on current hour to avoid stale peers
        const hourKey = new Date().toISOString().slice(0, 13);
        const mmCode = `MATCHMAKING_${playerCount}P_${hourKey}`;
        
        try {
            const mmRoom = joinMqttRoom(
                {
                    appId: 'crazygo-v6',
                    relayConfig: {
                        urls: [
                            'wss://broker.emqx.io:8084/mqtt',
                            'wss://broker.hivemq.com:8884/mqtt'
                        ]
                    },
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
                mmCode
            );
            
            // Listen for matchmaking custom messages via Trystero makeAction
            const matchAction = mmRoom.makeAction<{ code: string; hostColor: number }>('match');
            
            mmRoom.onPeerJoin = (peerId: string) => {
                if (this.isMatchmaking) {
                    // Arbitraje determinista: el peer con menor ID genera la sala y hostea
                    if (selfId < peerId) {
                        const privateCode = `GO-${Math.floor(1000 + Math.random() * 9000)}`;
                        matchAction.send({ code: privateCode, hostColor: 2 }, { target: peerId });
                        this.finalizeMatchmaking(privateCode, true);
                        try { mmRoom.leave(); } catch (_) {}
                    }
                }
            };
            
            matchAction.onMessage = (data: { code: string; hostColor: number }) => {
                if (this.isMatchmaking && data && data.code) {
                    // El anfitrión nos envió el código de la sala privada
                    this.finalizeMatchmaking(data.code, false);
                    try { mmRoom.leave(); } catch (_) {}
                }
            };
            
            // Store cleanup
            this.matchmakingInterval = window.setInterval(() => {
                if (!this.isMatchmaking) {
                    try { mmRoom.leave(); } catch (_) {}
                    if (this.matchmakingInterval) clearInterval(this.matchmakingInterval);
                }
            }, 1000) as unknown as number;
        } catch (err) {
            console.error('[Matchmaking Error]:', err);
            const isEn = getLanguage() === 'en';
            if (statusEl) statusEl.innerText = isEn ? 'Error starting matchmaking.' : 'Error al buscar partida.';
        }
    }

    public static cancelMatchmaking() {
        this.isMatchmaking = false;
        if (this.matchmakingInterval) clearInterval(this.matchmakingInterval);
        document.getElementById('matchmaking-status-box')?.classList.add('hidden');
        document.getElementById('btn-matchmaking-2p')?.parentElement?.classList.remove('hidden');
        NetworkManager.disconnect();
    }

    private static finalizeMatchmaking(privateCode: string, isHost: boolean) {
        if (this.matchmakingInterval) clearInterval(this.matchmakingInterval);
        this.isMatchmaking = false;
        document.getElementById('matchmaking-status-text')!.innerText = '¡Oponente encontrado! Conectando...';
        
        setTimeout(() => {
            if (isHost) {
                // Config predeterminada para matchmaking (9x9 Clásico)
                this.onlineHostColor = 1;
                this.onlineShape = 'square';
                this.onlineSize = 9;
                
                // Empezar a hostear la sala privada en el lobby
                ModalManager.switchOnlineTab('create');
                ModalManager.setOnlineWizardStep(6);
                this.startHostingRoom(privateCode);
            } else {
                // Unirse a la sala privada
                ModalManager.switchOnlineTab('join');
                const input = document.getElementById('input-join-room-code') as HTMLInputElement | null;
                if (input) input.value = privateCode;
                this.joinOnlineRoom(privateCode);
            }
        }, 1000);
    }

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
            (skillType, targetNodeId) => NetworkManager.sendSkill(skillType, targetNodeId),
            () => NetworkManager.sendUndoRewind()
        );

        NetworkManager.onSkillReceived = (skillType, targetNodeId, senderColor) => {
            GameController.handleRemoteSkill(skillType, targetNodeId, senderColor);
        };

        NetworkManager.onUndoReceived = (senderColor) => {
            GameController.handleRemoteUndo(senderColor);
        };

        // Callbacks de NetworkManager
        NetworkManager.onPlayerConnected = (assignedColor: PlayerId, playerCount: 2 | 4) => {
            ModalManager.closeOnlineModal();

            const isCoop = !!NetworkManager.currentConfig?.isCoopRogue;
            GameController.localOnlineColor = assignedColor;
            
            if (isCoop) {
                if (!NetworkManager.isHost) {
                    import('./RoguelikeController').then(({ RoguelikeController }) => {
                        import('../core/RoguelikeRunManager').then(({ RoguelikeRunManager }) => {
                            RoguelikeRunManager.startRun(
                                NetworkManager.currentConfig?.difficulty || 'normal',
                                NetworkManager.currentConfig?.hostHero || 'normal',
                                'coop'
                            );
                            RoguelikeController.resumeMap();
                            RoguelikeController.showCoopBriefing();
                            
                            const isEn = getLanguage() === 'en';
                            HUDController.showAlert(isEn ? `🤝 Co-op Roguelike Expedition started! Sharing ⚫ Black stones.` : `🤝 ¡Expedición Roguelike Cooperativa iniciada! Compartís el bando ⚫ Negras.`);
                            SoundFX.playPlaceStone();
                        });
                    });
                }
            } else {
                ScreenManager.showGameScreen();
                const myHero = (assignedColor === (NetworkManager.currentConfig?.hostColor || 1))
                    ? (NetworkManager.currentConfig?.hostHero || null)
                    : (NetworkManager.currentConfig?.guestHeroes ? NetworkManager.currentConfig.guestHeroes[assignedColor] : null) || this.onlineGuestHero;

                GameController.initGame({
                    gameMode: 'online',
                    ruleStyle: 'classic',
                    isCoopRogue: false,
                    playerCount: playerCount,
                    humanColor: assignedColor,
                    komi: this.onlineKomi,
                    shape: this.onlineShape,
                    size: this.onlineSize,
                    seed: this.onlineSeed,
                    background: NetworkManager.currentConfig?.background || this.onlineBackground || 'combat',
                    heroId: myHero
                });

                const isEn = getLanguage() === 'en';
                const colorNames: Record<PlayerId, string> = isEn ? {
                    1: 'Black ⚫ (P1)',
                    2: 'White ⚪ (P2)',
                    3: 'Emerald 🟢 (P3)',
                    4: 'Amethyst 🟣 (P4)'
                } : {
                    1: 'Negras ⚫ (P1)',
                    2: 'Blancas ⚪ (P2)',
                    3: 'Esmeralda 🟢 (P3)',
                    4: 'Amatista 🟣 (P4)'
                };
                HUDController.showAlert(isEn ? `🎮 Online match started (${playerCount}P)! Playing as ${colorNames[assignedColor]}.` : `🎮 ¡Partida en red iniciada (${playerCount}P)! Juegas como ${colorNames[assignedColor]}.`);
                SoundFX.playPlaceStone();
            }
        };

        NetworkManager.onLobbyUpdated = (connectedCount: number, slots: PlayerSlotInfo[]) => {
            const isEn = getLanguage() === 'en';
            const totalTarget = NetworkManager.currentConfig?.playerCount || this.onlinePlayerCount;
            const statusText = isEn 
                ? `Room open (${connectedCount}/${totalTarget} connected). Share the code.` 
                : `Sala abierta (${connectedCount}/${totalTarget} conectados). Comparte el código.`;
            ModalManager.updateOnlineLobbyStatus(statusText, slots, NetworkManager.assignedColor);
        };

        NetworkManager.onMoveReceived = (nodeId: string) => {
            if (GameController.renderer) {
                GameController.renderer.handleNodeClick(nodeId, false);
                GameController.renderer.isInteractive = GameController.isLocalPlayerTurn();
                GameController.renderer.render();
                GameController.updateInGameUI();
            }
        };

        NetworkManager.onPassReceived = () => {
            GameController.handlePass(false);
            if (GameController.renderer) {
                GameController.renderer.isInteractive = GameController.isLocalPlayerTurn();
                GameController.renderer.render();
                GameController.updateInGameUI();
            }
        };

        NetworkManager.onGameEndReceived = () => {
            GameController.showFinalScoreModal();
        };

        NetworkManager.onMapClickReceived = (nodeId: string) => {
            if (OnlineController.onlineGameType === 'coop_rogue') {
                import('./RoguelikeController').then(({ RoguelikeController }) => {
                    import('../core/RoguelikeRunManager').then(({ RoguelikeRunManager }) => {
                        const targetNode = RoguelikeRunManager.map?.nodes.get(nodeId);
                        if (targetNode) {
                            RoguelikeController.handleMapNodeClick(targetNode, true);
                        }
                    });
                });
            }
        };

        NetworkManager.onEventOptionClickReceived = (optionId: string) => {
            if (OnlineController.onlineGameType === 'coop_rogue') {
                const btn = document.querySelector(`[data-option-id="${optionId}"]`) as HTMLButtonElement | null;
                if (btn) {
                    btn.click();
                } else {
                    console.warn('Network sync: Event option not found', optionId);
                }
            }
        };

        NetworkManager.onPeerDisconnected = () => {
            const isEn = getLanguage() === 'en';
            HUDController.showAlert(isEn ? "⚠️ A player has disconnected from the match." : "⚠️ Un jugador se ha desconectado de la partida.");
        };

        NetworkManager.onVoteAbandonReceived = () => {
            const isEn = getLanguage() === 'en';
            const msg = isEn 
                ? "Your partner wants to abandon the Co-op Expedition. Do you agree?" 
                : "Tu compañero quiere abandonar la Expedición Cooperativa. ¿Estás de acuerdo?";
            
            // Usar confirm nativo para bloquear y forzar la respuesta
            const accepted = confirm(msg);
            
            if (NetworkManager.sendFn) {
                NetworkManager.sendFn({ type: 'VOTE_ABANDON_REPLY', accepted });
            }
            
            if (accepted) {
                import('./RoguelikeController').then(({ RoguelikeController }) => {
                    RoguelikeController.abandonRun(true);
                });
            }
        };

        NetworkManager.onVoteAbandonReplyReceived = (accepted: boolean) => {
            const isEn = getLanguage() === 'en';
            if (accepted) {
                HUDController.showAlert(isEn ? "Partner agreed. Abandoning run." : "Compañero aceptó. Abandonando expedición.");
                import('./RoguelikeController').then(({ RoguelikeController }) => {
                    RoguelikeController.abandonRun(true);
                });
            } else {
                HUDController.showAlert(isEn ? "Partner declined to abandon the run." : "El compañero rechazó abandonar la expedición.");
            }
        };

        NetworkManager.onError = (msg: string) => {
            HUDController.showAlert(`⚠️ ${msg}`);
        };
    }

    public static openOnlineModal() {
        NetworkManager.disconnect();
        ModalManager.openOnlineModal();
        ModalManager.switchOnlineTab('create');
        ModalManager.setOnlineWizardStep(1);
        ModalManager.updateOnlineModalUI(
            this.onlineHostColor, 
            this.onlineShape, 
            this.onlineSize, 
            this.onlineKomi, 
            this.onlinePlayerCount,
            this.onlineHostHero,
            this.onlineBackground
        );
        ModalManager.updateOnlineGuestHeroUI(this.onlineGuestHero);
    }

    public static startHostingRoom(forceRoomCode?: string) {
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
            seed: this.onlineSeed,
            komi: this.onlineKomi,
            background: this.onlineBackground,
            hostColor: this.onlinePlayerCount === 4 ? 1 : this.onlineHostColor,
            playerCount: this.onlineGameType === 'coop_rogue' ? 2 : this.onlinePlayerCount,
            hostHero: this.onlineHostHero,
            isCoopRogue: this.onlineGameType === 'coop_rogue',
            slots: { 
                1: { slotId: 1, teamId: 1, type: 'human_local', aiDifficulty: this.onlineAIDifficulty },
                2: { slotId: 2, teamId: 2, type: 'human_remote', aiDifficulty: this.onlineAISlots[2] || this.onlineAIDifficulty },
                3: { slotId: 3, teamId: 1, type: 'human_remote', aiDifficulty: this.onlineAISlots[3] || this.onlineAIDifficulty },
                4: { slotId: 4, teamId: 2, type: 'human_remote', aiDifficulty: this.onlineAISlots[4] || this.onlineAIDifficulty }
            }
        };

        // Asignamos el host según el color escogido
        if (config.slots && config.hostColor) {
            config.slots[config.hostColor].type = 'human_local';
        }

        NetworkManager.hostRoom(
            config,
            (roomCode) => {
                if (codeBox) codeBox.innerText = roomCode;
                
                const currentBase = window.location.origin;
                this.currentShareUrl = `${currentBase}/?join=${roomCode}`;

                const isEn = getLanguage() === 'en';
                const initialText = isEn
                    ? `Waiting for players to join the room... (1/${this.onlinePlayerCount})`
                    : `Esperando a que se unan los jugadores a la sala... (1/${this.onlinePlayerCount})`;
                if (statusText) {
                    statusText.innerText = initialText;
                }
            },
            (errMsg) => {
                if (statusText) {
                    statusText.innerText = `Error: ${errMsg}`;
                }
            },
            forceRoomCode
        );
    }

    public static joinOnlineRoom(roomCode: string) {
        const isEn = getLanguage() === 'en';
        const cleanCode = this.sanitizeRoomCode(roomCode);
        if (!cleanCode) {
            HUDController.showAlert(isEn ? "Enter a valid room code (e.g., GO-4821)." : "Introduce un código de sala válido (ej: GO-4821).");
            return;
        }

        const statusBox = document.getElementById('join-status-box') || document.getElementById('online-status-box');
        const statusText = document.getElementById('join-status-text') || document.getElementById('online-status-text');
        if (statusBox && statusText) {
            statusBox.classList.remove('hidden');
            statusText.innerText = isEn ? `Connecting to room ${cleanCode}...` : `Conectando a la sala ${cleanCode}...`;
        }

        const slotsGrid = document.getElementById('join-lobby-slots-grid');
        if (slotsGrid) {
            slotsGrid.innerHTML = '';
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
                    ruleStyle: config.isCoopRogue ? 'roguelite' : 'classic',
                    isCoopRogue: config.isCoopRogue,
                    coopSubTurn: 1,
                    playerCount: playerCount,
                    humanColor: assignedColor,
                    komi: config.komi,
                    shape: config.shape,
                    size: config.size,
                    seed: config.seed,
                    background: config.background || 'combat',
                    heroId: myHero
                });

                const colorNames: Record<PlayerId, string> = isEn ? {
                    1: 'Black ⚫ (P1)',
                    2: 'White ⚪ (P2)',
                    3: 'Emerald 🟢 (P3)',
                    4: 'Amethyst 🟣 (P4)'
                } : {
                    1: 'Negras ⚫ (P1)',
                    2: 'Blancas ⚪ (P2)',
                    3: 'Esmeralda 🟢 (P3)',
                    4: 'Amatista 🟣 (P4)'
                };

                HUDController.showAlert(isEn ? `🎮 Connected to room (${playerCount}P)! Playing as ${colorNames[assignedColor]}.` : `🎮 ¡Conectado a la sala (${playerCount}P)! Juegas como ${colorNames[assignedColor]}.`);
                SoundFX.playPlaceStone();
            },
            (errMsg) => {
                if (statusText) {
                    statusText.innerText = `❌ ${errMsg}`;
                }
                HUDController.showAlert(isEn ? `Failed to join: ${errMsg}` : `Error al unirse: ${errMsg}`);
                SoundFX.playIllegal();
            }
        );
    }

    public static forceStartOnlineGame() {
        if (this.onlineGameType === 'coop_rogue' && NetworkManager.isHost) {
            ModalManager.closeOnlineModal();
            import('../ui/ModalManager').then(({ ModalManager: MM }) => {
                MM.openRoguelikeSetupModal();
            });
        } else {
            NetworkManager.requestStartGame();
        }
    }

    public static copyRoomLink() {
        const roomCode = NetworkManager.currentRoomCode || '';
        if (!roomCode) return;
        const isEn = getLanguage() === 'en';

        // Siempre copiamos solo el código GO-XXXX (no la URL completa),
        // para que sea fácil de compartir en chats sin confundir a nadie.
        const textToCopy = roomCode;

        const onSuccess = () => {
            const btn = document.getElementById('btn-copy-room-link');
            if (btn) btn.innerHTML = isEn ? '<span>Copied! ✅</span>' : '<span>¡Copiado! ✅</span>';
            setTimeout(() => {
                if (btn) btn.innerHTML = isEn ? '<span>📋 Copy Code</span>' : '<span>📋 Copiar Código</span>';
            }, 2000);
            HUDController.showAlert(
                isEn ? `Room code copied: ${roomCode}` : `Código de sala copiado: ${roomCode}`
            );
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(onSuccess).catch(() => {
                HUDController.showAlert(isEn ? `Room code: ${roomCode}` : `Código de sala: ${roomCode}`);
            });
        } else {
            onSuccess();
        }
    }
}
