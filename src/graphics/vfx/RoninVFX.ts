// graphics/vfx/RoninVFX.ts - Animación de Filo del Samurai / Viento Cortante de Ronin
import { SoundFX } from '../../audio/SoundFX';

export class RoninVFX {
    /**
     * Animación: Ráfaga de Viento Cortante y Tajo de Katana (Wind & Blade Slash)
     * - Tajo expandido de gran visibilidad.
     * - Permanece 1s visible en el tablero y se desvanece suavemente durante 2s (total 3s).
     * - Señaliza nítidamente la casilla exacta afectada con anillo de corte.
     */
    public static triggerWindSlash(coord: { x: number; y: number }, svgElement: SVGSVGElement) {
        SoundFX.playKatanaSlash();

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'vfx-wind-slash-anim');

        // 0. Anillo de corte y mira luminosa en la casilla afectada
        const targetRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        targetRing.setAttribute('cx', coord.x.toString());
        targetRing.setAttribute('cy', coord.y.toString());
        targetRing.setAttribute('r', '24');
        targetRing.setAttribute('fill', 'rgba(56, 189, 248, 0.15)');
        targetRing.setAttribute('stroke', '#38bdf8');
        targetRing.setAttribute('stroke-width', '2.5');
        targetRing.setAttribute('stroke-dasharray', '5 3');
        targetRing.setAttribute('class', 'slash-target-mark');
        group.appendChild(targetRing);

        // 1. Tajo principal exterior de viento (Cyan eléctrico brillante y ancho)
        const outerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dOuter = `M ${coord.x - 56} ${coord.y - 56} Q ${coord.x + 14} ${coord.y - 8} ${coord.x + 56} ${coord.y + 56}`;
        outerPath.setAttribute('d', dOuter);
        outerPath.setAttribute('stroke', '#38bdf8');
        outerPath.setAttribute('stroke-width', '6.5');
        outerPath.setAttribute('stroke-linecap', 'round');
        outerPath.setAttribute('fill', 'none');
        outerPath.setAttribute('class', 'slash-stroke');
        outerPath.style.filter = 'drop-shadow(0 0 10px #0284c7) drop-shadow(0 0 18px #38bdf8)';
        group.appendChild(outerPath);

        // 2. Filo central de acero plateado ultra-afilado (Blanco puro cortante)
        const innerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dInner = `M ${coord.x - 52} ${coord.y - 52} Q ${coord.x + 14} ${coord.y - 8} ${coord.x + 52} ${coord.y + 52}`;
        innerPath.setAttribute('d', dInner);
        innerPath.setAttribute('stroke', '#ffffff');
        innerPath.setAttribute('stroke-width', '3');
        innerPath.setAttribute('stroke-linecap', 'round');
        innerPath.setAttribute('fill', 'none');
        innerPath.setAttribute('class', 'slash-stroke');
        group.appendChild(innerPath);

        // 3. Contratrazado cruzado en aspas (Corte diagonal secundario)
        const crossPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dCross = `M ${coord.x + 48} ${coord.y - 48} Q ${coord.x - 10} ${coord.y + 8} ${coord.x - 48} ${coord.y + 48}`;
        crossPath.setAttribute('d', dCross);
        crossPath.setAttribute('stroke', '#7dd3fc');
        crossPath.setAttribute('stroke-width', '4');
        crossPath.setAttribute('stroke-linecap', 'round');
        crossPath.setAttribute('fill', 'none');
        crossPath.setAttribute('class', 'slash-stroke');
        crossPath.style.animationDelay = '0.05s';
        group.appendChild(crossPath);

        // 4. Filo interior blanco del contra-corte
        const crossInnerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dCrossInner = `M ${coord.x + 44} ${coord.y - 44} Q ${coord.x - 10} ${coord.y + 8} ${coord.x - 44} ${coord.y + 44}`;
        crossInnerPath.setAttribute('d', dCrossInner);
        crossInnerPath.setAttribute('stroke', '#ffffff');
        crossInnerPath.setAttribute('stroke-width', '2');
        crossInnerPath.setAttribute('stroke-linecap', 'round');
        crossInnerPath.setAttribute('fill', 'none');
        crossInnerPath.setAttribute('class', 'slash-stroke');
        crossInnerPath.style.animationDelay = '0.05s';
        group.appendChild(crossInnerPath);

        svgElement.appendChild(group);

        // Limpiar el elemento del DOM tras finalizar el ciclo de 3 segundos
        setTimeout(() => {
            group.remove();
        }, 3100);
    }
}
