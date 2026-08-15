// ui/ThemeManager.ts - Gestión de Tema Visual (Madera Kaya Zen vs Pizarra Obsidiana)
import type { AppTheme } from '../types';
import { SoundFX } from '../audio/SoundFX';

export class ThemeManager {
    private static currentTheme: AppTheme = (localStorage.getItem('crazy_go_theme') as AppTheme) || 'dark';
    private static onThemeChangedCallback: ((theme: AppTheme) => void) | null = null;

    public static init(onThemeChanged?: (theme: AppTheme) => void) {
        this.onThemeChangedCallback = onThemeChanged || null;
        this.applyTheme(this.currentTheme);
    }

    public static getTheme(): AppTheme {
        return this.currentTheme;
    }

    public static applyTheme(theme: AppTheme) {
        this.currentTheme = theme;
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('crazy_go_theme', theme);

        const icon = theme === 'dark' ? '☀️' : '🌙';
        const tooltip = theme === 'dark' 
            ? 'Cambiar a Modo Claro (Madera Kaya Zen)' 
            : 'Cambiar a Modo Oscuro (Pizarra Obsidiana)';

        document.querySelectorAll('.theme-icon').forEach(el => {
            (el as HTMLElement).innerText = icon;
        });

        document.querySelectorAll('.btn-theme-toggle').forEach(el => {
            (el as HTMLElement).title = tooltip;
        });

        if (this.onThemeChangedCallback) {
            this.onThemeChangedCallback(theme);
        }
    }

    public static toggleTheme(): AppTheme {
        const nextTheme: AppTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(nextTheme);
        SoundFX.playPlaceStone();
        return nextTheme;
    }
}
