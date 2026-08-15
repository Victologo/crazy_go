// graphics/vfx/RoninVFX.ts - Animación Cinematográfica de Filo del Samurai de Ronin
import { SoundFX } from '../../audio/SoundFX';

export class RoninVFX {
    /**
     * Animación Cinematográfica: Ráfaga de Viento Cortante y Tajo de Katana (Wind & Blade Slash)
     * - Tajo expandido de gran envergadura (más de 200px de longitud diagonal).
     * - Se inserta en #vfx-live-container para no ser destruido por los re-renderizados del tablero.
     * - Permanece 1s visible con resplandor completo y se desvanece suavemente a lo largo de 2s (total 3s).
     * - Señaliza nítidamente la casilla exacta afectada con anillo de corte y kanji de impacto.
     */
    public static triggerWindSlash(coord: { x: number; y: number }, svgElement: SVGSVGElement) {
        SoundFX.playKatanaSlash();

        // Obtener o crear la capa persistente de VFX
        let container = svgElement.querySelector('#vfx-live-container') as SVGGElement | null;
        if (!container) {
            container = svgElement;
        }

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'vfx-wind-slash-anim');

        // 1. Radar / Anillo de mira luminosa en la casilla exacta afectada
        const targetRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        targetRing.setAttribute('cx', coord.x.toString());
        targetRing.setAttribute('cy', coord.y.toString());
        targetRing.setAttribute('r', '32');
        targetRing.setAttribute('fill', 'rgba(56, 189, 248, 0.22)');
        targetRing.setAttribute('stroke', '#38bdf8');
        targetRing.setAttribute('stroke-width', '3.5');
        targetRing.setAttribute('stroke-dasharray', '8 4');
        targetRing.setAttribute('class', 'slash-target-mark');
        group.appendChild(targetRing);

        // 2. Anillo interior de onda expansiva
        const shockRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        shockRing.setAttribute('cx', coord.x.toString());
        shockRing.setAttribute('cy', coord.y.toString());
        shockRing.setAttribute('r', '18');
        shockRing.setAttribute('fill', 'none');
        shockRing.setAttribute('stroke', '#ffffff');
        shockRing.setAttribute('stroke-width', '2');
        shockRing.setAttribute('class', 'slash-target-mark');
        group.appendChild(shockRing);

        // 3. Destello de resplandor exterior de viento cortante (Gran envergadura - 220px)
        const outerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dOuter = `M ${coord.x - 110} ${coord.y - 110} Q ${coord.x + 25} ${coord.y - 15} ${coord.x + 110} ${coord.y + 110}`;
        outerPath.setAttribute('d', dOuter);
        outerPath.setAttribute('stroke', 'rgba(56, 189, 248, 0.45)');
        outerPath.setAttribute('stroke-width', '14');
        outerPath.setAttribute('stroke-linecap', 'round');
        outerPath.setAttribute('fill', 'none');
        outerPath.setAttribute('class', 'slash-stroke');
        outerPath.style.filter = 'drop-shadow(0 0 16px #0284c7) drop-shadow(0 0 28px #38bdf8)';
        group.appendChild(outerPath);

        // 4. Filo medio de energía cortante cyan brillante
        const midPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dMid = `M ${coord.x - 105} ${coord.y - 105} Q ${coord.x + 25} ${coord.y - 15} ${coord.x + 105} ${coord.y + 105}`;
        midPath.setAttribute('d', dMid);
        midPath.setAttribute('stroke', '#38bdf8');
        midPath.setAttribute('stroke-width', '7');
        midPath.setAttribute('stroke-linecap', 'round');
        midPath.setAttribute('fill', 'none');
        midPath.setAttribute('class', 'slash-stroke');
        group.appendChild(midPath);

        // 5. Filo central de acero plateado ultra-afilado (Blanco puro cortante)
        const innerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dInner = `M ${coord.x - 100} ${coord.y - 100} Q ${coord.x + 25} ${coord.y - 15} ${coord.x + 100} ${coord.y + 100}`;
        innerPath.setAttribute('d', dInner);
        innerPath.setAttribute('stroke', '#ffffff');
        innerPath.setAttribute('stroke-width', '3.5');
        innerPath.setAttribute('stroke-linecap', 'round');
        innerPath.setAttribute('fill', 'none');
        innerPath.setAttribute('class', 'slash-stroke');
        group.appendChild(innerPath);

        // 6. Contratrazado cruzado en aspas (Segundo corte perpendicular)
        const crossOuter = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dCrossOuter = `M ${coord.x + 95} ${coord.y - 95} Q ${coord.x - 20} ${coord.y + 15} ${coord.x - 95} ${coord.y + 95}`;
        crossOuter.setAttribute('d', dCrossOuter);
        crossOuter.setAttribute('stroke', '#7dd3fc');
        crossOuter.setAttribute('stroke-width', '6');
        crossOuter.setAttribute('stroke-linecap', 'round');
        crossOuter.setAttribute('fill', 'none');
        crossOuter.setAttribute('class', 'slash-stroke');
        crossOuter.style.animationDelay = '0.04s';
        group.appendChild(crossOuter);

        const crossInner = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dCrossInner = `M ${coord.x + 90} ${coord.y - 90} Q ${coord.x - 20} ${coord.y + 15} ${coord.x - 90} ${coord.y + 90}`;
        crossInner.setAttribute('d', dCrossInner);
        crossInner.setAttribute('stroke', '#ffffff');
        crossInner.setAttribute('stroke-width', '2.5');
        crossInner.setAttribute('stroke-linecap', 'round');
        crossInner.setAttribute('fill', 'none');
        crossInner.setAttribute('class', 'slash-stroke');
        crossInner.style.animationDelay = '0.04s';
        group.appendChild(crossInner);

        container.appendChild(group);

        // Micro-sacudida de pantalla para dar peso e impacto cinematográfico al golpe de katana
        const boardEl = document.getElementById('board-container') || document.getElementById('game-screen');
        if (boardEl) {
            boardEl.classList.remove('vfx-screen-shake');
            void boardEl.offsetWidth;
            boardEl.classList.add('vfx-screen-shake');
            setTimeout(() => boardEl.classList.remove('vfx-screen-shake'), 180);
        }

        // Limpiar el elemento tras finalizar el ciclo de 3.2 segundos
        setTimeout(() => {
            group.remove();
        }, 3200);
    }
}
