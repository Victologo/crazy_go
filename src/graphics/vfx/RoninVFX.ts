// graphics/vfx/RoninVFX.ts - Animación de Filo del Samurai de Ronin (Tajo Preciso y Centrado)
import { SoundFX } from '../../audio/SoundFX';

export class RoninVFX {
    /**
     * Animación: Tajo de Katana preciso a la casilla afectada
     * - Dimensiones optimizadas (50% más compacto, ajustado a los 36px de la piedra).
     * - Tajo único y estilizado sin duplicaciones paralelas.
     * - Anillo de impacto centrado exactamente sobre la intersección.
     * - 1s visible con brillo y 2s de desvanecimiento suave (3s total).
     */
    public static triggerWindSlash(coord: { x: number; y: number }, svgElement: SVGSVGElement) {
        SoundFX.playKatanaSlash();

        // Obtener la capa persistente de VFX
        let container = svgElement.querySelector('#vfx-live-container') as SVGGElement | null;
        if (!container) {
            container = svgElement;
        }

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'vfx-wind-slash-anim');

        // 1. Anillo de corte y mira luminosa en la casilla exacta afectada (ajustado al radio de piedra)
        const targetRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        targetRing.setAttribute('cx', coord.x.toString());
        targetRing.setAttribute('cy', coord.y.toString());
        targetRing.setAttribute('r', '17');
        targetRing.setAttribute('fill', 'rgba(56, 189, 248, 0.18)');
        targetRing.setAttribute('stroke', '#38bdf8');
        targetRing.setAttribute('stroke-width', '2.5');
        targetRing.setAttribute('stroke-dasharray', '5 3');
        targetRing.setAttribute('class', 'slash-target-mark');
        group.appendChild(targetRing);

        // 2. Destello exterior de energía cortante cyan (38px de semieje diagonal)
        const outerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dOuter = `M ${coord.x - 38} ${coord.y - 38} Q ${coord.x + 6} ${coord.y - 4} ${coord.x + 38} ${coord.y + 38}`;
        outerPath.setAttribute('d', dOuter);
        outerPath.setAttribute('stroke', '#38bdf8');
        outerPath.setAttribute('stroke-width', '5.5');
        outerPath.setAttribute('stroke-linecap', 'round');
        outerPath.setAttribute('fill', 'none');
        outerPath.setAttribute('class', 'slash-stroke');
        outerPath.style.filter = 'drop-shadow(0 0 6px #0284c7) drop-shadow(0 0 12px #38bdf8)';
        group.appendChild(outerPath);

        // 3. Filo central de acero plateado ultra-afilado (Blanco puro)
        const innerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dInner = `M ${coord.x - 36} ${coord.y - 36} Q ${coord.x + 6} ${coord.y - 4} ${coord.x + 36} ${coord.y + 36}`;
        innerPath.setAttribute('d', dInner);
        innerPath.setAttribute('stroke', '#ffffff');
        innerPath.setAttribute('stroke-width', '2.2');
        innerPath.setAttribute('stroke-linecap', 'round');
        innerPath.setAttribute('fill', 'none');
        innerPath.setAttribute('class', 'slash-stroke');
        group.appendChild(innerPath);

        // 4. Micro-destello de corte central
        const centerSpark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        centerSpark.setAttribute('cx', coord.x.toString());
        centerSpark.setAttribute('cy', coord.y.toString());
        centerSpark.setAttribute('r', '7');
        centerSpark.setAttribute('fill', '#ffffff');
        centerSpark.setAttribute('class', 'slash-target-mark');
        group.appendChild(centerSpark);

        container.appendChild(group);

        // Micro-sacudida de pantalla limpia
        const boardEl = document.getElementById('board-container') || document.getElementById('game-screen');
        if (boardEl) {
            boardEl.classList.remove('vfx-screen-shake');
            void boardEl.offsetWidth;
            boardEl.classList.add('vfx-screen-shake');
            setTimeout(() => boardEl.classList.remove('vfx-screen-shake'), 140);
        }

        // Limpiar tras finalizar el ciclo
        setTimeout(() => {
            group.remove();
        }, 3100);
    }
}
