// main.ts - Punto de Entrada y Ensamblador Principal de Crazy Go
import './style.css';
import { ThemeManager } from './ui/ThemeManager';
import { ScreenManager } from './ui/ScreenManager';
import { ModalManager } from './ui/ModalManager';
import { GameController } from './controllers/GameController';
import { OnlineController } from './controllers/OnlineController';
import { RoguelikeRunManager } from './core/RoguelikeRunManager';
import { AppEventBinder } from './events/AppEventBinder';
import { initI18n } from './i18n/i18n';
import { DevModeManager } from './core/DevModeManager';
import { GlobalSettings } from './core/GlobalSettings';
import { UITemplateLoader } from './ui/UITemplateLoader';

class CrazyGoApp {
    public static init() {
        // -1. Inyectar Modales HTML
        UITemplateLoader.loadAll();

        // 0. Inicializar Idioma / Localización y Modo Desarrollador
        initI18n();
        DevModeManager.init();
        GlobalSettings.init();

        // 1. Inicializar Tema y Red
        ThemeManager.init(() => {
            if (GameController.renderer) {
                GameController.renderer.render();
            }
        });

        OnlineController.init();

        // 2. Restaurar Expedición Roguelike guardada si existe
        RoguelikeRunManager.loadFromLocalStorage();

        // 3. Vincular Navegación, Atajos de Teclado y Eventos Globales
        AppEventBinder.init();
        import('./story/StoryModeController').then(m => m.StoryModeController.init());
        
        // 3.5 Inicializar DB y nombre
        import('./network/DatabaseManager').then(async (m) => {
            await m.DatabaseManager.initialize();
            const profile = await m.DatabaseManager.getProfile(m.DatabaseManager.getUserId());
            if (profile) {
                import('./network/NetworkManager').then(nm => {
                    nm.NetworkManager.localName = profile.displayName;
                });
            }
        });

        // 4. Comprobar si se ha entrado mediante enlace de invitación online (?join=XXXX o ?room=XXXX)
        const params = new URLSearchParams(window.location.search);
        const joinCode = params.get('join') || params.get('room');
        if (joinCode) {
            ModalManager.openOnlineModal();
            ModalManager.switchOnlineTab('join');
            const input = document.getElementById('input-join-room-code') as HTMLInputElement | null;
            if (input) input.value = joinCode;
            OnlineController.joinOnlineRoom(joinCode);
        } else {
            ScreenManager.showMainMenu();
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
CrazyGoApp.init();
