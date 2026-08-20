// VFXManager.ts - Fachada Central de Animaciones y Efectos Visuales para Habilidades de Campeones y Go
import { TenguVFX } from './vfx/TenguVFX';
import { HimikoVFX } from './vfx/HimikoVFX';
import { KitsuneVFX } from './vfx/KitsuneVFX';
import { RoninVFX } from './vfx/RoninVFX';
import { AlchemistVFX } from './vfx/AlchemistVFX';
import { RyujinVFX } from './vfx/RyujinVFX';
import { BossVFX } from './vfx/BossVFX';

export class VFXManager {
    /**
     * Limpia de forma absoluta cualquier residuo de animación o efectos visuales en el SVG
     */
    public static clearAllVFX(svgElement: SVGSVGElement | null) {
        if (!svgElement) return;
        const lingering = svgElement.querySelectorAll(
            '.vfx-stone-rain-layer, .vfx-grey-dragon-layer, .vfx-dragon-flame-anim, ' +
            '.vfx-meteor-layer, .vfx-shockwave-anim, .vfx-wind-slash-anim, .alchemist-transmute-vfx, .vfx-ripple, ' +
            '.vfx-capture-dissolve, .targeting-overlay, #ghost-preview, .vfx-meteor-burst, ' +
            '.vfx-dragon-flame-live-layer'
        );
        lingering.forEach(el => el.remove());
    }

    /**
     * Aplica temblor de pantalla (Screen Shake)
     */
    public static screenShake(durationMs: number = 500) {
        const target = document.getElementById('board-container') || document.getElementById('game-screen');
        if (!target) return;

        target.classList.remove('vfx-screen-shake');
        void target.offsetWidth;
        target.classList.add('vfx-screen-shake');

        setTimeout(() => {
            target.classList.remove('vfx-screen-shake');
        }, durationMs);
    }

    /**
     * Animación: Lluvia Meteórica (Tengu)
     */
    public static triggerMeteorShower(
        impactCoords: { x: number; y: number }[], 
        svgElement: SVGSVGElement,
        onImpactNode: (index: number) => void,
        onComplete: () => void,
        stoneRadius: number = 18
    ) {
        TenguVFX.triggerMeteorShower(impactCoords, svgElement, onImpactNode, onComplete, stoneRadius);
    }

    /**
     * Animación: Lluvia Pétrea Celestial (Himiko)
     */
    public static triggerStoneRainBeams(
        coords: { x: number; y: number }[],
        svgElement: SVGSVGElement,
        onStoneImpact: (index: number) => void,
        onComplete: () => void
    ) {
        HimikoVFX.triggerStoneRainBeams(coords, svgElement, onStoneImpact, onComplete);
    }

    /**
     * Animación: Ráfaga de Viento Cortante (Ronin)
     */
    public static triggerWindSlash(coord: { x: number; y: number }, svgElement: SVGSVGElement) {
        RoninVFX.triggerWindSlash(coord, svgElement);
    }

    /**
     * Animación: Transmutación Alquímica (Alquimista)
     */
    public static triggerTransmuteSlash(coord: { x: number; y: number }, svgElement: SVGSVGElement) {
        AlchemistVFX.triggerTransmuteSlash(coord, svgElement);
    }

    /**
     * Animación: Teletransporte Espiritual (Kitsune)
     */
    public static triggerTeleportPoof(coord: { x: number; y: number }, svgElement: SVGSVGElement) {
        KitsuneVFX.triggerTeleportPoof(coord, svgElement);
    }

    /**
     * Animación: Concesión de Escudo Divino Sagrado (Kitsune)
     */
    public static triggerDivineShieldAura(coord: { x: number; y: number }, svgElement: SVGSVGElement) {
        KitsuneVFX.triggerDivineShieldAura(coord, svgElement);
    }

    /**
     * Animación: Rotura del Escudo Divino (Kitsune)
     */
    public static triggerDivineShieldShatter(coord: { x: number; y: number }, svgElement: SVGSVGElement) {
        KitsuneVFX.triggerDivineShieldShatter(coord, svgElement);
    }

    /**
     * Animación: Aliento de Llamas Sagradas y Ceniza de Ryūjin (Furia del Dragón)
     */
    public static triggerDragonFlame(coord: { x: number; y: number }, svgElement: SVGSVGElement, onComplete?: () => void) {
        RyujinVFX.triggerDragonFlame(coord, svgElement, onComplete);
    }

    /**
     * Animación: Aliento Calcinante del Gran Dragón Sabio Gris
     */
    public static triggerGreyDragonBreath(
        quadrantCoords: { x: number; y: number }[],
        centerCoord: { x: number; y: number },
        svgElement: SVGSVGElement,
        onComplete: () => void
    ) {
        BossVFX.triggerGreyDragonBreath(quadrantCoords, centerCoord, svgElement, onComplete);
    }
}
