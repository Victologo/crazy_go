// graphics/vfx/RoninVFX.ts - Animación de Viento Cortante de Ronin
import { SoundFX } from '../../audio/SoundFX';

export class RoninVFX {
    /**
     * Animación: Ráfaga de Viento Cortante (Wind Slash)
     */
    public static triggerWindSlash(coord: { x: number; y: number }, svgElement: SVGSVGElement) {
        SoundFX.playCapture();

        const slash = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        slash.setAttribute('class', 'vfx-wind-slash-anim');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${coord.x - 30} ${coord.y - 30} Q ${coord.x} ${coord.y + 10} ${coord.x + 30} ${coord.y + 30}`;
        path.setAttribute('d', d);
        path.setAttribute('stroke', '#38bdf8');
        path.setAttribute('stroke-width', '4');
        path.setAttribute('fill', 'none');
        path.setAttribute('class', 'slash-stroke');

        slash.appendChild(path);
        svgElement.appendChild(slash);

        setTimeout(() => {
            slash.remove();
        }, 600);
    }
}
