// graphics/vfx/BossVFX.ts - Animación de Aliento Calcinante del Gran Dragón Sabio Gris
import { SoundFX } from '../../audio/SoundFX';

export class BossVFX {
    /**
     * Animación: Aliento Calcinante del Gran Dragón Sabio Gris
     * Desata una tormenta de fuego celestial sobre el cuadrante del 25% del tablero
     * y genera la emergencia física de la piedra en el centro del vacío.
     */
    public static triggerGreyDragonBreath(
        quadrantCoords: { x: number; y: number }[],
        centerCoord: { x: number; y: number },
        svgElement: SVGSVGElement,
        onComplete: () => void
    ) {
        const boardTarget = document.getElementById('board-container') || document.getElementById('game-screen');
        if (boardTarget) {
            boardTarget.classList.remove('vfx-screen-shake');
            void boardTarget.offsetWidth;
            boardTarget.classList.add('vfx-screen-shake');
            setTimeout(() => boardTarget.classList.remove('vfx-screen-shake'), 750);
        }
        SoundFX.playBossDragonBreath();

        const vfxLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        vfxLayer.setAttribute('class', 'vfx-grey-dragon-layer');
        svgElement.appendChild(vfxLayer);

        // 1. Destellos calcinantes en todas las intersecciones del cuadrante
        quadrantCoords.forEach((coord, idx) => {
            setTimeout(() => {
                const burst = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                burst.setAttribute('cx', `${coord.x}`);
                burst.setAttribute('cy', `${coord.y}`);
                burst.setAttribute('r', '18');
                burst.setAttribute('fill', '#94a3b8');
                burst.setAttribute('stroke', '#38bdf8');
                burst.setAttribute('stroke-width', '2.5');
                burst.setAttribute('class', 'vfx-dragon-incinerate');
                vfxLayer.appendChild(burst);
            }, idx * 15);
        });

        // 2. Vórtice de fuego dragón en el cuadrante
        const vortex = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        vortex.setAttribute('cx', `${centerCoord.x}`);
        vortex.setAttribute('cy', `${centerCoord.y}`);
        vortex.setAttribute('r', '60');
        vortex.setAttribute('fill', 'none');
        vortex.setAttribute('stroke', '#e2e8f0');
        vortex.setAttribute('stroke-width', '5');
        vortex.setAttribute('stroke-dasharray', '8 4');
        vortex.setAttribute('class', 'vfx-dragon-flame-shockwave');
        vfxLayer.appendChild(vortex);

        // 3. Estallido y materialización en el centro
        setTimeout(() => {
            SoundFX.playPlaceStone();
            onComplete();

            setTimeout(() => {
                vfxLayer.remove();
            }, 400);
        }, 320);
    }
}
