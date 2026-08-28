// ui/ThemeManager.ts - Gestión de Tema Visual (Fijado permanentemente en Modo Oscuro)
import type { AppTheme } from '../types';

export class ThemeManager {
    private static onThemeChangedCallback: ((theme: AppTheme) => void) | null = null;

    public static init(onThemeChanged?: (theme: AppTheme) => void) {
        this.onThemeChangedCallback = onThemeChanged || null;
        this.applyTheme('dark');
    }

    public static getTheme(): AppTheme {
        return 'dark';
    }

    public static applyTheme(_theme: AppTheme = 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('crazy_go_theme', 'dark');

        if (this.onThemeChangedCallback) {
            this.onThemeChangedCallback('dark');
        }
    }

    public static toggleTheme(): AppTheme {
        // Silenciado: modo oscuro permanente
        return 'dark';
    }
}
