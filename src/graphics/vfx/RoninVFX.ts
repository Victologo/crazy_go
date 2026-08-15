// graphics/vfx/RoninVFX.ts - Animación de Filo del Samurai / Viento Cortante de Ronin
import { SoundFX } from '../../audio/SoundFX';

export class RoninVFX {
    /**
     * Animación: Ráfaga de Viento Cortante y Tajo de Katana (Wind & Blade Slash)
     */
    public static triggerWindSlash(coord: { x: number; y: number }, svgElement: SVGSVGElement) {
        SoundFX.playKatanaSlash();

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'vfx-wind-slash-anim');

        // 1. Destello exterior de viento cortante (Cyan brillante)
        const outerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dOuter = `M ${coord.x - 38} ${coord.y - 38} Q ${coord.x + 8} ${coord.y - 4} ${coord.x + 38} ${coord.y + 38}`;
        outerPath.setAttribute('d', dOuter);
        outerPath.setAttribute('stroke', '#38bdf8');
        outerPath.setAttribute('stroke-width', '5.5');
        outerPath.setAttribute('stroke-linecap', 'round');
        outerPath.setAttribute('fill', 'none');
        outerPath.setAttribute('class', 'slash-stroke');
        outerPath.style.filter = 'drop-shadow(0 0 8px #0284c7) drop-shadow(0 0 14px #38bdf8)';

        // 2. Filo central de acero plateado ultra-afilado (Blanco puro)
        const innerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dInner = `M ${coord.x - 34} ${coord.y - 34} Q ${coord.x + 8} ${coord.y - 4} ${coord.x + 34} ${coord.y + 34}`;
        innerPath.setAttribute('d', dInner);
        innerPath.setAttribute('stroke', '#ffffff');
        innerPath.setAttribute('stroke-width', '2.5');
        innerPath.setAttribute('stroke-linecap', 'round');
        innerPath.setAttribute('fill', 'none');
        innerPath.setAttribute('class', 'slash-stroke');

        // 3. Contratrazado cruzado (Cruz de corte samurai en aspas)
        const crossPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dCross = `M ${coord.x + 32} ${coord.y - 32} Q ${coord.x - 6} ${coord.y + 4} ${coord.x - 32} ${coord.y + 32}`;
        crossPath.setAttribute('d', dCross);
        crossPath.setAttribute('stroke', '#7dd3fc');
        crossPath.setAttribute('stroke-width', '3');
        crossPath.setAttribute('stroke-linecap', 'round');
        crossPath.setAttribute('fill', 'none');
        crossPath.setAttribute('class', 'slash-stroke');
        crossPath.style.animationDelay = '0.04s';

        // 4. Chispas de impacto cortante
        const spark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        spark.setAttribute('cx', coord.x.toString());
        spark.setAttribute('cy', coord.y.toString());
        spark.setAttribute('r', '18');
        spark.setAttribute('fill', 'rgba(56, 189, 248, 0.4)');
        spark.setAttribute('class', 'vfx-capture-dissolve');

        group.appendChild(outerPath);
        group.appendChild(innerPath);
        group.appendChild(crossPath);
        group.appendChild(spark);
        svgElement.appendChild(group);

        setTimeout(() => {
            group.remove();
        }, 650);
    }
}
