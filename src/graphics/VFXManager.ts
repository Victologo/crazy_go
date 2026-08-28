// VFXManager.ts - Fachada Central de Animaciones y Efectos Visuales para Habilidades de Campeones y Go
import { TenguVFX } from './vfx/TenguVFX';
import { HimikoVFX } from './vfx/HimikoVFX';
import { KitsuneVFX } from './vfx/KitsuneVFX';
import { RoninVFX } from './vfx/RoninVFX';
import { AlchemistVFX } from './vfx/AlchemistVFX';
import { RyujinVFX } from './vfx/RyujinVFX';
import { BossVFX } from './vfx/BossVFX';
import { OniVFX, type OniStoneShift } from './vfx/OniVFX';
import type { PlayerId } from '../core/GraphBoard';

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
            '.vfx-dragon-flame-live-layer, .vfx-oni-inhalation-layer'
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

    /**
     * Animación: Inhalación del Demonio / Vórtice Gravitacional (Máscara Oni)
     */
    public static triggerOniInhalation(
        mouthCenter: { x: number; y: number },
        shifts: OniStoneShift[],
        svgElement: SVGSVGElement,
        onComplete: () => void,
        stoneRadius: number = 18
    ) {
        OniVFX.triggerOniInhalation(mouthCenter, shifts, svgElement, onComplete, stoneRadius);
    }

    /**
     * Feedback Visual: Festín de Almas (Turno Extra Consecutivo)
     */
    public static triggerSoulFeast(playerId: PlayerId = 1) {
        OniVFX.triggerSoulFeast(playerId);
    }

    /**
     * Animación: Disolución Zen de Piedras Capturadas (desintegración in-situ con micro-anillo de Qi y partículas de tinta Sumi-e)
     */
    public static triggerZenDissolution(
        coords: { x: number; y: number }[],
        svgElement: SVGSVGElement | null,
        stoneRadius: number = 18
    ) {
        if (!svgElement || coords.length === 0) return;

        const vfxLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        vfxLayer.setAttribute('class', 'vfx-capture-dissolve-layer');
        vfxLayer.style.pointerEvents = 'none';

        coords.forEach(pt => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);

            // 1. Anillo de onda expansiva de Qi suave
            const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ring.setAttribute('r', `${stoneRadius * 0.75}`);
            ring.setAttribute('class', 'zen-dissolve-ring');
            g.appendChild(ring);

            // 2. Núcleo de humo de tinta / éter que se desvanece
            const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            core.setAttribute('r', `${stoneRadius * 0.95}`);
            core.setAttribute('class', 'zen-dissolve-core');
            g.appendChild(core);

            // 3. Micro-partículas de Qi que se dispersan radialmente
            const particleCount = 6;
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2 + (Math.random() * 0.5 - 0.25);
                const dist = stoneRadius * (1.2 + Math.random() * 0.6);
                const pX = Math.cos(angle) * dist;
                const pY = Math.sin(angle) * dist;
                const pR = 2.2 + Math.random() * 1.8;

                const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                particle.setAttribute('cx', '0');
                particle.setAttribute('cy', '0');
                particle.setAttribute('r', `${pR}`);
                particle.setAttribute('class', 'zen-dissolve-particle');
                particle.style.setProperty('--dx', `${pX}px`);
                particle.style.setProperty('--dy', `${pY}px`);
                particle.style.animationDelay = `${Math.random() * 0.05}s`;
                g.appendChild(particle);
            }

            vfxLayer.appendChild(g);
        });

        svgElement.appendChild(vfxLayer);

        setTimeout(() => {
            vfxLayer.remove();
        }, 450);
    }
}
