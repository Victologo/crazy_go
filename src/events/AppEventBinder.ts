// events/AppEventBinder.ts — Orquestador Central de Eventos (delega a sub-binders temáticos)
import { ModalManager } from '../ui/ModalManager';
import { KeyboardController } from './KeyboardController';
import { MenuEventBinder } from './MenuEventBinder';
import { GameEventBinder } from './GameEventBinder';
import { SetupEventBinder } from './SetupEventBinder';
import { OnlineEventBinder } from './OnlineEventBinder';
import { OptionsEventBinder } from './OptionsEventBinder';
import type { GameSetupConfig } from '../types';

export class AppEventBinder {
    /**
     * Alias de compatibilidad: apunta a SetupEventBinder.tempSetupConfig.
     * Mantiene retrocompatibilidad con cualquier código externo que acceda
     * a AppEventBinder.tempSetupConfig.
     */
    public static get tempSetupConfig(): GameSetupConfig {
        return SetupEventBinder.tempSetupConfig;
    }
    public static set tempSetupConfig(val: GameSetupConfig) {
        SetupEventBinder.tempSetupConfig = val;
    }

    public static init() {
        ModalManager.initZoom();
        MenuEventBinder.init();
        GameEventBinder.init();
        SetupEventBinder.init();
        OnlineEventBinder.init();
        OptionsEventBinder.init();
        this.setupGlobalKeyboardEvents();
    }

    /**
     * Navegación y Selección Universal con Teclado (Delegado a KeyboardController)
     */
    private static setupGlobalKeyboardEvents() {
        KeyboardController.init();
    }
}
