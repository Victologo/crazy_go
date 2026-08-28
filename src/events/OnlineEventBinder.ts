// events/OnlineEventBinder.ts — Eventos del wizard online: sala, modos, campeones host/guest y lobby

import type { HeroId, BoardShape, BoardSize, BoardBackground } from '../types';
import { ModalManager } from '../ui/ModalManager';
import { HUDController } from '../ui/HUDController';
import { OnlineController } from '../controllers/OnlineController';
import { NetworkManager } from '../network/NetworkManager';
import { SoundFX } from '../audio/SoundFX';

export class OnlineEventBinder {
    public static init() {
        const refreshHostUI = () => {
            ModalManager.updateOnlineModalUI(
                OnlineController.onlineHostColor, 
                OnlineController.onlineShape, 
                OnlineController.onlineSize, 
                OnlineController.onlineKomi, 
                OnlineController.onlinePlayerCount,
                OnlineController.onlineHostHero,
                OnlineController.onlineBackground,
                OnlineController.onlineSeed
            );
        };

        // --- NAVEGACIÓN DEL WIZARD ONLINE (HOST) ---
        document.getElementById('btn-online-wizard-prev')?.addEventListener('click', () => {
            if (ModalManager.currentOnlineWizardStep === 1) {
                ModalManager.closeOnlineModal();
                NetworkManager.disconnect();
            } else {
                let targetStep = ModalManager.currentOnlineWizardStep - 1;
                if (OnlineController.onlineGameType === 'coop_rogue' && ModalManager.currentOnlineWizardStep === 6) {
                    targetStep = 1; // Volver al inicio directo en Roguelike
                }
                ModalManager.setOnlineWizardStep(targetStep);
                if (targetStep < 6 && NetworkManager.isHost) {
                    NetworkManager.disconnect();
                }
            }
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-online-wizard-next')?.addEventListener('click', () => {
            let targetStep = ModalManager.currentOnlineWizardStep + 1;
            if (OnlineController.onlineGameType === 'coop_rogue' && ModalManager.currentOnlineWizardStep === 1) {
                targetStep = 6; // Ir directo al Lobby en Roguelike
            }
            ModalManager.setOnlineWizardStep(targetStep);
            if (targetStep === 6) {
                OnlineController.startHostingRoom();
            }
            SoundFX.playPlaceStone();
        });

        document.querySelectorAll('#online-wizard-stepper .wizard-step-node').forEach(node => {
            node.addEventListener('click', () => {
                let targetStep = parseInt(node.getAttribute('data-step') || '1', 10);
                if (OnlineController.onlineGameType === 'coop_rogue' && targetStep > 1 && targetStep < 6) {
                    targetStep = 6;
                }
                ModalManager.setOnlineWizardStep(targetStep);
                if (targetStep === 6) {
                    OnlineController.startHostingRoom();
                } else if (NetworkManager.isHost) {
                    NetworkManager.disconnect();
                }
                SoundFX.playPlaceStone();
            });
        });

        document.getElementById('tab-btn-matchmaking')?.addEventListener('click', () => {
            ModalManager.switchOnlineTab('matchmaking');
            NetworkManager.disconnect();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-matchmaking-2p')?.addEventListener('click', () => {
            OnlineController.startMatchmaking(2);
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-matchmaking-4p')?.addEventListener('click', () => {
            OnlineController.startMatchmaking(4);
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-cancel-matchmaking')?.addEventListener('click', () => {
            OnlineController.cancelMatchmaking();
            SoundFX.playPlaceStone();
        });

        document.getElementById('tab-btn-create-room')?.addEventListener('click', () => {
            ModalManager.switchOnlineTab('create');
            ModalManager.setOnlineWizardStep(1);
            NetworkManager.disconnect();
            SoundFX.playPlaceStone();
        });

        document.getElementById('tab-btn-join-room')?.addEventListener('click', () => {
            ModalManager.switchOnlineTab('join');
            NetworkManager.disconnect();
            SoundFX.playPlaceStone();
            const input = document.getElementById('input-join-room-code') as HTMLInputElement | null;
            if (input) {
                setTimeout(() => input.focus(), 60);
            }
        });

        document.getElementById('btn-copy-room-link')?.addEventListener('click', () => {
            OnlineController.copyRoomLink();
            SoundFX.playPlaceStone();
        });

        document.getElementById('online-mode-standard')?.addEventListener('click', () => {
            OnlineController.onlineGameType = 'standard';
            document.getElementById('online-mode-standard')?.classList.add('active');
            document.getElementById('online-mode-roguelike')?.classList.remove('active');
            refreshHostUI();
            SoundFX.playPlaceStone();
            setTimeout(() => ModalManager.setOnlineWizardStep(2), 160);
        });

        document.getElementById('online-mode-roguelike')?.addEventListener('click', () => {
            OnlineController.onlineGameType = 'coop_rogue';
            OnlineController.onlinePlayerCount = 2;
            document.getElementById('online-mode-roguelike')?.classList.add('active');
            document.getElementById('online-mode-standard')?.classList.remove('active');
            refreshHostUI();
            SoundFX.playPlaceStone();
            setTimeout(() => ModalManager.setOnlineWizardStep(6), 160);
        });

        document.getElementById('online-players-2')?.addEventListener('click', () => {
            OnlineController.onlinePlayerCount = 2;
            refreshHostUI();
            SoundFX.playPlaceStone();
            setTimeout(() => ModalManager.setOnlineWizardStep(3), 160);
        });

        document.getElementById('online-players-4')?.addEventListener('click', () => {
            OnlineController.onlinePlayerCount = 4;
            refreshHostUI();
            SoundFX.playPlaceStone();
            setTimeout(() => ModalManager.setOnlineWizardStep(3), 160);
        });

        document.getElementById('btn-online-force-start')?.addEventListener('click', () => {
            OnlineController.forceStartOnlineGame();
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-online-modal-start')?.addEventListener('click', () => {
            OnlineController.forceStartOnlineGame();
            SoundFX.playPlaceStone();
        });

        // Opciones del Paso 6 (Lobby): actualizan configuración y sincronizan sala
        document.getElementById('online-color-black')?.addEventListener('click', () => {
            OnlineController.onlineHostColor = 1;
            refreshHostUI();
            if (ModalManager.currentOnlineWizardStep === 6) {
                OnlineController.startHostingRoom();
            }
            SoundFX.playPlaceStone();
        });

        document.getElementById('online-color-white')?.addEventListener('click', () => {
            OnlineController.onlineHostColor = 2;
            refreshHostUI();
            if (ModalManager.currentOnlineWizardStep === 6) {
                OnlineController.startHostingRoom();
            }
            SoundFX.playPlaceStone();
        });

        const shapes: BoardShape[] = ['square', 'volcano', 'sky', 'oni', 'triangle', 'hex', 'eroded', 'islands_v1', 'islands_v2', 'islands', 'cross', 'hourglass', 'geode', 'spiral', 'rings', 'star_5', 'star_6', 'procedural'];
        shapes.forEach(sh => {
            document.getElementById(`online-shape-${sh}`)?.addEventListener('click', () => {
                OnlineController.onlineShape = sh;
                if (sh === 'procedural') {
                    OnlineController.onlineSeed = Math.floor(Math.random() * 9999999);
                }
                refreshHostUI();
                SoundFX.playPlaceStone();
            });
        });

        const onlineRerollBtn = document.getElementById('online-shape-procedural-reroll');
        onlineRerollBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            OnlineController.onlineShape = 'procedural';
            OnlineController.onlineSeed = Math.floor(Math.random() * 9999999);
            onlineRerollBtn.classList.add('spin-anim');
            setTimeout(() => onlineRerollBtn.classList.remove('spin-anim'), 400);
            refreshHostUI();
            SoundFX.playPlaceStone();
        });

        const sizes: BoardSize[] = [9, 13, 19];
        sizes.forEach(sz => {
            document.getElementById(`online-size-${sz}`)?.addEventListener('click', () => {
                OnlineController.onlineSize = sz;
                refreshHostUI();
                SoundFX.playPlaceStone();
            });
        });

        // Escenarios / Fondos Online (Paso 5)
        document.querySelectorAll('.btn-online-bg').forEach(btn => {
            btn.addEventListener('click', () => {
                const bg = btn.getAttribute('data-bg') as BoardBackground | null;
                if (bg) {
                    OnlineController.onlineBackground = bg;
                    refreshHostUI();
                    SoundFX.playPlaceStone();
                }
            });
        });

        // Komi (Paso 6)
        document.querySelectorAll('.btn-online-komi').forEach(btn => {
            btn.addEventListener('click', () => {
                OnlineController.onlineKomi = parseFloat(btn.getAttribute('data-komi') || '6.5');
                refreshHostUI();
                if (ModalManager.currentOnlineWizardStep === 6) {
                    OnlineController.startHostingRoom();
                }
                SoundFX.playPlaceStone();
            });
        });

        document.getElementById('online-komi-input')?.addEventListener('input', (e) => {
            const val = parseFloat((e.target as HTMLInputElement).value);
            if (!isNaN(val) && val >= 0) {
                OnlineController.onlineKomi = val;
                refreshHostUI();
                if (ModalManager.currentOnlineWizardStep === 6) {
                    OnlineController.startHostingRoom();
                }
            }
        });

        // --- SELECTORES DE DIFICULTAD DE IA (ONLINE) ---
        const getKyuDanString = (val: number): string => {
            if (val <= 30) return `${31 - val}k`;
            return `${val - 30}d`;
        };
        let isOnlineGranularAI = false;

        document.getElementById('btn-toggle-online-ai-granular')?.addEventListener('click', () => {
            isOnlineGranularAI = !isOnlineGranularAI;
            const btn = document.getElementById('btn-toggle-online-ai-granular');
            const label = document.getElementById('label-toggle-online-ai-granular');
            if (btn) {
                btn.setAttribute('data-enabled', isOnlineGranularAI ? 'true' : 'false');
                btn.classList.toggle('active', isOnlineGranularAI);
            }
            if (label) label.innerText = isOnlineGranularAI ? 'Granular ⚙️' : 'Pack Mode 📦';
            
            document.getElementById('online-ai-pack-mode-box')?.classList.toggle('hidden', isOnlineGranularAI);
            document.getElementById('online-ai-granular-mode-box')?.classList.toggle('hidden', !isOnlineGranularAI);
            
            refreshHostUI();
            SoundFX.playPlaceStone();
        });

        document.getElementById('online-ai-master-slider')?.addEventListener('input', (e) => {
            const val = parseInt((e.target as HTMLInputElement).value, 10);
            const str = getKyuDanString(val);
            document.getElementById('online-ai-master-display')!.innerText = str;
            OnlineController.onlineAIDifficulty = str;
            [2, 3, 4].forEach(p => { OnlineController.onlineAISlots[p] = str; });
            
            if (ModalManager.currentOnlineWizardStep === 6 && NetworkManager.isHost) {
                OnlineController.startHostingRoom();
            }
            refreshHostUI();
        });

        [2, 3, 4].forEach(p => {
            document.getElementById(`online-ai-granular-p${p}-slider`)?.addEventListener('input', (e) => {
                const val = parseInt((e.target as HTMLInputElement).value, 10);
                const str = getKyuDanString(val);
                document.getElementById(`online-ai-granular-p${p}-display`)!.innerText = str;
                OnlineController.onlineAISlots[p] = str;
                OnlineController.onlineAIDifficulty = str;
                
                if (ModalManager.currentOnlineWizardStep === 6 && NetworkManager.isHost) {
                    OnlineController.startHostingRoom();
                }
                refreshHostUI();
            });
        });

        const handleJoinAction = () => {
            const input = document.getElementById('input-join-room-code') as HTMLInputElement | null;
            if (input && input.value) {
                OnlineController.joinOnlineRoom(input.value);
            } else {
                HUDController.showAlert("Por favor, introduce el código de la sala.");
                SoundFX.playIllegal();
            }
        };

        document.getElementById('btn-submit-join-room')?.addEventListener('click', () => {
            handleJoinAction();
        });

        const inputJoin = document.getElementById('input-join-room-code') as HTMLInputElement | null;
        inputJoin?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleJoinAction();
            }
        });

        inputJoin?.addEventListener('paste', () => {
            setTimeout(() => {
                if (inputJoin.value) {
                    inputJoin.value = OnlineController.sanitizeRoomCode(inputJoin.value);
                }
            }, 20);
        });

        const heroes: HeroId[] = ['normal', 'tengu', 'himiko', 'kitsune', 'ronin', 'alchemist', 'ryujin'];

        // Navegación de héroe para el Anfitrión (Host)
        document.getElementById('btn-online-host-hero-prev')?.addEventListener('click', () => {
            const currentHero = OnlineController.onlineHostHero || 'normal';
            let idx = heroes.indexOf(currentHero as HeroId);
            if (idx === -1) idx = 0;
            const prevIdx = (idx - 1 + heroes.length) % heroes.length;
            OnlineController.onlineHostHero = heroes[prevIdx];
            refreshHostUI();
            NetworkManager.sendHeroSelect(OnlineController.onlineHostHero);
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-online-host-hero-next')?.addEventListener('click', () => {
            const currentHero = OnlineController.onlineHostHero || 'normal';
            let idx = heroes.indexOf(currentHero as HeroId);
            if (idx === -1) idx = 0;
            const nextIdx = (idx + 1) % heroes.length;
            OnlineController.onlineHostHero = heroes[nextIdx];
            refreshHostUI();
            NetworkManager.sendHeroSelect(OnlineController.onlineHostHero);
            SoundFX.playPlaceStone();
        });

        document.querySelectorAll('#online-host-hero-thumb-strip .hero-thumb-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const h = btn.getAttribute('data-hero') as HeroId | null;
                if (h) {
                    OnlineController.onlineHostHero = h;
                    refreshHostUI();
                    NetworkManager.sendHeroSelect(OnlineController.onlineHostHero);
                    SoundFX.playPlaceStone();
                }
            });
        });

        // Navegación de héroe para el Invitado (Guest)
        document.getElementById('btn-online-guest-hero-prev')?.addEventListener('click', () => {
            const currentHero = OnlineController.onlineGuestHero || 'normal';
            let idx = heroes.indexOf(currentHero as HeroId);
            if (idx === -1) idx = 0;
            const prevIdx = (idx - 1 + heroes.length) % heroes.length;
            OnlineController.onlineGuestHero = heroes[prevIdx];
            ModalManager.updateOnlineGuestHeroUI(OnlineController.onlineGuestHero);
            NetworkManager.sendHeroSelect(OnlineController.onlineGuestHero);
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-online-guest-hero-next')?.addEventListener('click', () => {
            const currentHero = OnlineController.onlineGuestHero || 'normal';
            let idx = heroes.indexOf(currentHero as HeroId);
            if (idx === -1) idx = 0;
            const nextIdx = (idx + 1) % heroes.length;
            OnlineController.onlineGuestHero = heroes[nextIdx];
            ModalManager.updateOnlineGuestHeroUI(OnlineController.onlineGuestHero);
            NetworkManager.sendHeroSelect(OnlineController.onlineGuestHero);
            SoundFX.playPlaceStone();
        });

        document.querySelectorAll('#online-guest-hero-thumb-strip .hero-thumb-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const h = btn.getAttribute('data-hero') as HeroId | null;
                if (h) {
                    OnlineController.onlineGuestHero = h;
                    ModalManager.updateOnlineGuestHeroUI(OnlineController.onlineGuestHero);
                    NetworkManager.sendHeroSelect(OnlineController.onlineGuestHero);
                    SoundFX.playPlaceStone();
                }
            });
        });

        document.getElementById('btn-online-cancel')?.addEventListener('click', () => {
            ModalManager.closeOnlineModal();
            NetworkManager.disconnect();
            SoundFX.playPlaceStone();
        });
    }
}
