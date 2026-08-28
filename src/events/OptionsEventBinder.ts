// events/OptionsEventBinder.ts — Eventos de Opciones (Volumen, Zoom, Idioma, Dev Mode, Feedback) y Panel Sandbox
import type { HeroId, BoardShape, BoardSize } from '../types';
import { ModalManager } from '../ui/ModalManager';
import { HUDController } from '../ui/HUDController';
import { GameController } from '../controllers/GameController';
import { RoguelikeController } from '../controllers/RoguelikeController';
import { RoguelikeRunManager } from '../core/RoguelikeRunManager';
import { SandboxController, type SandboxBrush, type PresetScenario } from '../controllers/SandboxController';
import { SoundFX } from '../audio/SoundFX';
import { BGMGenerator } from '../audio/BGMGenerator';
import { DevModeManager } from '../core/DevModeManager';
import { GlobalSettings } from '../core/GlobalSettings';
import { setLanguage, getLanguage } from '../i18n/i18n';
import { SetupEventBinder } from './SetupEventBinder';
import { StageHazardManager } from '../core/StageHazardManager';

export class OptionsEventBinder {
    public static init() {
        this.setupOptionsModalEvents();
        this.setupSandboxEvents();
    }

    private static setupOptionsModalEvents() {
        const volSlider = document.getElementById('opt-vol-slider') as HTMLInputElement | null;
        volSlider?.addEventListener('input', (e) => {
            const val = parseInt((e.target as HTMLInputElement).value, 10);
            SoundFX.setMasterVolume(val / 100);
            BGMGenerator.setVolume(val / 100);
            const volText = document.getElementById('opt-vol-text');
            if (volText) volText.innerText = `${val}%`;
        });

        volSlider?.addEventListener('change', () => {
            SoundFX.playPlaceStone();
        });

        document.getElementById('btn-menu-feedback')?.addEventListener('click', () => {
            SoundFX.playPlaceStone();
            ModalManager.openFeedbackModal();
        });

        document.getElementById('opt-sfx-toggle')?.addEventListener('click', () => {
            SoundFX.toggleSFX();
            ModalManager.updateOptionsModalUI();
        });

        document.getElementById('opt-bgm-toggle')?.addEventListener('click', () => {
            SoundFX.toggleBGM();
            ModalManager.updateOptionsModalUI();
        });

        // Selector de Idioma (Español / Inglés)
        document.getElementById('opt-lang-es')?.addEventListener('click', () => {
            setLanguage('es');
            ModalManager.updateOptionsModalUI();
            ModalManager.updateRoguelikeSetupModalUI(RoguelikeController.tempRogueMode, RoguelikeController.tempRogueDifficulty, RoguelikeController.tempRogueHero);
            ModalManager.updateSetupModalUI(SetupEventBinder.tempSetupConfig);
            ModalManager.setWizardStep(ModalManager.currentWizardStep, SetupEventBinder.tempSetupConfig);
            if (GameController.state) GameController.updateInGameUI();
            SoundFX.playPlaceStone();
        });

        document.getElementById('opt-lang-en')?.addEventListener('click', () => {
            setLanguage('en');
            ModalManager.updateOptionsModalUI();
            ModalManager.updateRoguelikeSetupModalUI(RoguelikeController.tempRogueMode, RoguelikeController.tempRogueDifficulty, RoguelikeController.tempRogueHero);
            ModalManager.updateSetupModalUI(SetupEventBinder.tempSetupConfig);
            ModalManager.setWizardStep(ModalManager.currentWizardStep, SetupEventBinder.tempSetupConfig);
            if (GameController.state) GameController.updateInGameUI();
            SoundFX.playPlaceStone();
        });

        // Dev Mode unificado: activa Sandbox Testing Lab + Undo/Redo + herramientas de debug en cualquier combate
        document.getElementById('opt-dev-toggle')?.addEventListener('click', () => {
            const enabled = DevModeManager.toggleDevMode();
            const isEn = getLanguage() === 'en';
            HUDController.showAlert(
                enabled
                    ? (isEn ? '🧪 Dev Mode ON — Sandbox & Debug tools enabled for all combats' : '🧪 Dev Mode ACTIVADO — Sandbox y herramientas activas en todos los combates')
                    : (isEn ? '🧪 Dev Mode OFF' : '🧪 Dev Mode DESACTIVADO'),
                2400
            );
            ModalManager.updateOptionsModalUI();
            if (GameController.state) GameController.updateInGameUI();
            SoundFX.playPlaceStone();
        });

        document.getElementById('opt-fps-30')?.addEventListener('click', () => {
            GlobalSettings.fpsLimit = 30;
            ModalManager.updateOptionsModalUI();
            SoundFX.playPlaceStone();
        });

        document.getElementById('opt-fps-60')?.addEventListener('click', () => {
            GlobalSettings.fpsLimit = 60;
            ModalManager.updateOptionsModalUI();
            SoundFX.playPlaceStone();
        });

        document.getElementById('opt-particles-toggle')?.addEventListener('click', () => {
            GlobalSettings.particlesEnabled = !GlobalSettings.particlesEnabled;
            ModalManager.updateOptionsModalUI();
            SoundFX.playPlaceStone();
        });

        // Selector de Barra de Winrate
        document.getElementById('opt-winrate-toggle')?.addEventListener('click', () => {
            GlobalSettings.winrateBarEnabled = !GlobalSettings.winrateBarEnabled;
            ModalManager.updateOptionsModalUI();
            if (GameController.state) {
                GameController.updateInGameUI();
            }
            SoundFX.playPlaceStone();
        });

        // Selector de Modo Zen
        document.getElementById('opt-zen-toggle')?.addEventListener('click', () => {
            HUDController.toggleZenMode();
            SoundFX.playPlaceStone();
        });



        // Cerrar Feedback Modal
        document.getElementById('btn-feedback-header-close')?.addEventListener('click', () => {
            ModalManager.closeFeedbackModal();
            SoundFX.playPlaceStone();
        });
        document.getElementById('btn-feedback-cancel')?.addEventListener('click', () => {
            ModalManager.closeFeedbackModal();
            SoundFX.playPlaceStone();
        });

        // Enviar Feedback internamente usando Web3Forms API (sin apps externas)
        document.getElementById('btn-feedback-send')?.addEventListener('click', async () => {
            const nameEl = document.getElementById('fb-name') as HTMLInputElement;
            const subjectEl = document.getElementById('fb-subject') as HTMLInputElement;
            const messageEl = document.getElementById('fb-message') as HTMLTextAreaElement;
            const sendBtn = document.getElementById('btn-feedback-send') as HTMLButtonElement | null;

            const name = nameEl?.value.trim() || 'Anónimo';
            const subject = subjectEl?.value.trim();
            const message = messageEl?.value.trim();
            const isEn = getLanguage() === 'en';

            if (!subject) {
                subjectEl?.focus();
                HUDController.showAlert(isEn ? '✉️ Please enter a subject.' : '✉️ Por favor escribe un asunto.', 2200);
                return;
            }
            if (!message) {
                messageEl?.focus();
                HUDController.showAlert(isEn ? '✉️ Please enter a message.' : '✉️ Por favor escribe un mensaje.', 2200);
                return;
            }

            // Web3Forms API
            const WEB3FORMS_ACCESS_KEY = 'a7fdb48a-8c81-4fae-90d0-4421b1558867';

            if (sendBtn) {
                sendBtn.innerText = isEn ? '⏳ Sending...' : '⏳ Enviando...';
                sendBtn.disabled = true;
            }

            try {
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        access_key: WEB3FORMS_ACCESS_KEY,
                        subject: `Nuevo mensaje de mejora sobre Crazy-Go: ${subject}`,
                        name: name,
                        'Aviso': 'Se recibió nuevo mensaje de mejora sobre el juego Crazy-Go',
                        message: message,
                        from_name: 'Crazy Go App',
                    }),
                });

                const result = await response.json();

                if (response.ok) {
                    if (sendBtn) sendBtn.innerText = isEn ? '✅ Sent!' : '✅ ¡Enviado!';
                    setTimeout(() => {
                        ModalManager.closeFeedbackModal();
                        if (sendBtn) {
                            sendBtn.innerText = isEn ? 'Send Email' : 'Enviar por Email';
                            sendBtn.disabled = false;
                        }
                        if (nameEl) nameEl.value = '';
                        if (subjectEl) subjectEl.value = '';
                        if (messageEl) messageEl.value = '';
                        HUDController.showAlert(isEn ? '✉️ Feedback sent successfully!' : '✉️ ¡Feedback enviado con éxito!', 3000);
                    }, 1200);
                } else {
                    console.error('Web3Forms error:', result);
                    if (sendBtn) {
                        sendBtn.innerText = isEn ? '❌ Error. Try again' : '❌ Error. Reintentar';
                        sendBtn.disabled = false;
                    }
                    HUDController.showAlert(isEn ? '✉️ Failed to send feedback.' : '✉️ Error al enviar el feedback.', 3000);
                }
            } catch (error) {
                console.error('Fetch error:', error);
                if (sendBtn) {
                    sendBtn.innerText = isEn ? '❌ Network Error' : '❌ Error de red';
                    sendBtn.disabled = false;
                }
                HUDController.showAlert(isEn ? '✉️ Network error sending feedback.' : '✉️ Error de red al enviar feedback.', 3000);
            }
        });

        // Atajo de teclado (Ctrl + Enter) para enviar el feedback más rápido
        const fbModal = document.getElementById('feedback-modal');
        fbModal?.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('btn-feedback-send')?.click();
            }
        });

        // Asignación de Atajo de Feedback
        const savedFeedbackKey = localStorage.getItem('crazygo_feedback_key') || 'F10';
        const btnBindFeedback = document.getElementById('btn-bind-feedback');
        if (btnBindFeedback) {
            btnBindFeedback.textContent = savedFeedbackKey;
            btnBindFeedback.setAttribute('data-key', savedFeedbackKey);

            btnBindFeedback.addEventListener('click', () => {
                const isEn = getLanguage() === 'en';
                btnBindFeedback.textContent = isEn ? 'Press a key...' : 'Presiona tecla...';

                const onKeydown = (e: KeyboardEvent) => {
                    e.preventDefault();
                    let keyName = e.key;
                    if (keyName === ' ') keyName = 'Space';
                    else if (keyName.length === 1) keyName = keyName.toUpperCase();

                    localStorage.setItem('crazygo_feedback_key', keyName);
                    btnBindFeedback.textContent = keyName;
                    btnBindFeedback.setAttribute('data-key', keyName);

                    document.removeEventListener('keydown', onKeydown);
                    SoundFX.playPlaceStone();
                };

                document.addEventListener('keydown', onKeydown);
            });
        }

        document.getElementById('btn-options-header-close')?.addEventListener('click', () => {
            ModalManager.closeOptionsModal();
            SoundFX.playPlaceStone();
        });
    }

    private static setupSandboxEvents() {
        // 1. Cerrar Modal Sandbox (botón inferior y botón '✖' del header)
        document.getElementById('btn-sandbox-close')?.addEventListener('click', () => {
            ModalManager.closeSandboxModal();
            SoundFX.playPlaceStone();
        });
        document.getElementById('btn-sandbox-header-close')?.addEventListener('click', () => {
            ModalManager.closeSandboxModal();
            SoundFX.playPlaceStone();
        });

        // 2. Conmutar Pincel Libre
        document.getElementById('btn-toggle-sandbox-brush')?.addEventListener('click', () => {
            SandboxController.toggleBrush();
        });

        // 3. Pestañas del Panel Sandbox
        document.querySelectorAll('.sandbox-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                if (tabId) {
                    ModalManager.switchSandboxTab(tabId);
                    SoundFX.playPlaceStone();
                }
            });
        });

        // 4. Selección de Pinceles
        document.querySelectorAll('.btn-sandbox-brush').forEach(btn => {
            btn.addEventListener('click', () => {
                const brush = btn.getAttribute('data-brush') as SandboxBrush;
                if (brush) {
                    SandboxController.setBrush(brush);
                }
            });
        });

        // 5. Botón Limpiar Tablero
        document.getElementById('btn-sandbox-clear-board')?.addEventListener('click', () => {
            if (GameController.board && GameController.state) {
                SandboxController.loadPreset('empty_clean', GameController.board, GameController.state, () => GameController.updateInGameUI());
            }
        });

        // 6. Topología y Tamaño en Vivo
        let selectedShape: BoardShape = 'square';
        let selectedSize: BoardSize = 9;

        document.querySelectorAll('.btn-sandbox-shape').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-sandbox-shape').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedShape = (btn.getAttribute('data-shape') || 'square') as BoardShape;
                SoundFX.playPlaceStone();
            });
        });

        const sandboxRerollBtn = document.getElementById('sandbox-shape-procedural-reroll');
        sandboxRerollBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedShape = 'procedural';
            document.querySelectorAll('.btn-sandbox-shape').forEach(b => b.classList.remove('active'));
            document.querySelector('.btn-sandbox-shape[data-shape="procedural"]')?.classList.add('active');
            sandboxRerollBtn.classList.add('spin-anim');
            setTimeout(() => sandboxRerollBtn.classList.remove('spin-anim'), 400);
            if (GameController.board && GameController.state) {
                SandboxController.changeBoardShape('procedural', selectedSize, GameController.board, GameController.state, () => GameController.updateInGameUI());
            }
            SoundFX.playPlaceStone();
        });

        document.querySelectorAll('.btn-sandbox-size').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-sandbox-size').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedSize = parseInt(btn.getAttribute('data-size') || '9', 10) as BoardSize;
                SoundFX.playPlaceStone();
            });
        });

        document.getElementById('btn-sandbox-apply-topology')?.addEventListener('click', () => {
            if (GameController.board && GameController.state) {
                SandboxController.changeBoardShape(selectedShape, selectedSize, GameController.board, GameController.state, () => GameController.updateInGameUI());
            }
        });

        // 7. Escenarios Predefinidos (Tests de Reglas)
        document.querySelectorAll('.sandbox-preset-card').forEach(card => {
            card.addEventListener('click', () => {
                const preset = card.getAttribute('data-preset') as PresetScenario;
                if (preset && GameController.board && GameController.state) {
                    SandboxController.loadPreset(preset, GameController.board, GameController.state, () => GameController.updateInGameUI());
                }
            });
        });

        // 8. Hechizos y Campeones
        document.getElementById('btn-sandbox-infinite-spells')?.addEventListener('click', () => {
            SandboxController.grantInfiniteResources();
        });

        // Developer Hacks
        document.getElementById('btn-sandbox-instant-win')?.addEventListener('click', () => {
            ModalManager.closeSandboxModal();
            GameController.forceVictory();
        });

        document.getElementById('btn-sandbox-unlock-map')?.addEventListener('click', () => {
            RoguelikeRunManager.unlockAllMapNodes();
            RoguelikeController.renderMap(); // Refresca el renderer del mapa
            ModalManager.closeSandboxModal();
            HUDController.showAlert('🗺️ Map Fully Unlocked!');
        });

        document.getElementById('btn-sandbox-trigger-active')?.addEventListener('click', () => {
            if (GameController.board && GameController.state) {
                SandboxController.triggerActiveSkill(GameController.board, GameController.state, () => GameController.updateInGameUI());
            }
        });

        document.getElementById('btn-sandbox-trigger-passive')?.addEventListener('click', () => {
            if (GameController.board && GameController.state) {
                SandboxController.triggerPassiveSkill(GameController.board, GameController.state, () => GameController.updateInGameUI());
            }
        });

        document.getElementById('btn-sandbox-force-meteor')?.addEventListener('click', () => {
            SandboxController.forceMeteorRainTarget(() => GameController.updateInGameUI());
        });

        document.getElementById('btn-sandbox-force-shield')?.addEventListener('click', () => {
            SandboxController.forceDivineShieldTarget(() => GameController.updateInGameUI());
        });

        document.getElementById('btn-sandbox-force-convert')?.addEventListener('click', () => {
            SandboxController.forceChromaticConversion(() => GameController.updateInGameUI());
        });

        document.getElementById('btn-sandbox-force-dragon-breath')?.addEventListener('click', () => {
            SandboxController.forceDragonBreathTarget(() => GameController.updateInGameUI());
        });

        document.getElementById('btn-sandbox-force-ronin-slash')?.addEventListener('click', () => {
            if (GameController.board && GameController.state) {
                SandboxController.forceRoninSlash(GameController.board, GameController.state, () => GameController.updateInGameUI());
            }
        });

        document.getElementById('btn-sandbox-force-stone-rain')?.addEventListener('click', () => {
            if (GameController.board && GameController.state) {
                SandboxController.forceStoneRain(GameController.board, GameController.state, () => GameController.updateInGameUI());
            }
        });

        document.getElementById('btn-sandbox-force-dragon-burn')?.addEventListener('click', () => {
            if (GameController.board && GameController.state) {
                SandboxController.forceDragonCornerBurn(GameController.board, GameController.state, () => GameController.updateInGameUI());
            }
        });

        document.getElementById('btn-sandbox-force-oni-inhalation')?.addEventListener('click', () => {
            if (GameController.board && GameController.state) {
                const svg = document.getElementById('go-board-svg') as SVGSVGElement | null;
                StageHazardManager.forceTriggerOniInhalation(
                    GameController.board,
                    GameController.state,
                    svg,
                    () => GameController.updateInGameUI()
                );
                ModalManager.closeSandboxModal();
            }
        });

        document.getElementById('btn-sandbox-force-rewind')?.addEventListener('click', () => {
            if (GameController.state) {
                SandboxController.addRewinds(GameController.state, 5, () => GameController.updateInGameUI());
            }
        });

        document.getElementById('btn-sandbox-pass-turn')?.addEventListener('click', () => {
            if (GameController.state) {
                GameController.state.advanceTurn();
                ModalManager.closeSandboxModal();
                GameController.updateInGameUI();
                HUDController.showAlert(`🔄 Turno pasado. Le toca al Jugador ${GameController.state.currentPlayer}`);
                SoundFX.playPlaceStone();
            }
        });

        document.querySelectorAll('.btn-sandbox-hero').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-sandbox-hero').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const heroId = btn.getAttribute('data-hero') as HeroId;
                if (heroId) {
                    SandboxController.changeChampion(heroId, () => GameController.updateInGameUI());
                }
            });
        });

        document.querySelectorAll('.btn-sandbox-turn').forEach(btn => {
            btn.addEventListener('click', () => {
                const turn = parseInt(btn.getAttribute('data-turn') || '1', 10) as any;
                if (GameController.state) {
                    SandboxController.forceCurrentPlayer(turn, GameController.state, () => GameController.updateInGameUI());
                }
            });
        });
    }
}
