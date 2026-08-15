// graphics/vfx/HimikoVFX.ts - Animación de Lluvia Pétrea Celestial de Himiko
import { SoundFX } from '../../audio/SoundFX';

export class HimikoVFX {
    /**
     * Animación: Lluvia Pétrea Celestial (Himiko)
     * Cometas astrales fluidos con estela luminosa que descienden del cosmos y al impactar hacen emerger la piedra directamente en la casilla.
     */
    public static triggerStoneRainBeams(
        coords: { x: number; y: number }[],
        svgElement: SVGSVGElement,
        onStoneImpact: (index: number) => void,
        onComplete: () => void
    ) {
        const vfxLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        vfxLayer.setAttribute('class', 'vfx-stone-rain-layer');
        svgElement.appendChild(vfxLayer);

        coords.forEach((coord, idx) => {
            const delayMs = idx * 240;
            setTimeout(() => {
                // 1. Grupo del Cometa Astral Descendente
                const cometGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                cometGroup.setAttribute('class', 'vfx-celestial-comet');
                cometGroup.setAttribute('style', `transform-origin: ${coord.x}px ${coord.y}px;`);

                // Estela exterior de luz celeste
                const outerTail = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                outerTail.setAttribute('x1', `${coord.x - 55}`);
                outerTail.setAttribute('y1', `${coord.y - 100}`);
                outerTail.setAttribute('x2', `${coord.x}`);
                outerTail.setAttribute('y2', `${coord.y}`);
                outerTail.setAttribute('stroke', '#38bdf8');
                outerTail.setAttribute('stroke-width', '7');
                outerTail.setAttribute('stroke-linecap', 'round');
                outerTail.setAttribute('opacity', '0.9');
                cometGroup.appendChild(outerTail);

                // Núcleo brillante interior de la estela
                const coreTail = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                coreTail.setAttribute('x1', `${coord.x - 45}`);
                coreTail.setAttribute('y1', `${coord.y - 85}`);
                coreTail.setAttribute('x2', `${coord.x}`);
                coreTail.setAttribute('y2', `${coord.y}`);
                coreTail.setAttribute('stroke', '#ffffff');
                coreTail.setAttribute('stroke-width', '3');
                coreTail.setAttribute('stroke-linecap', 'round');
                coreTail.setAttribute('opacity', '0.95');
                cometGroup.appendChild(coreTail);

                // Cabeza brillante de la piedra astral
                const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                head.setAttribute('cx', `${coord.x}`);
                head.setAttribute('cy', `${coord.y}`);
                head.setAttribute('r', '14');
                head.setAttribute('fill', '#ffffff');
                head.setAttribute('stroke', '#0284c7');
                head.setAttribute('stroke-width', '2.5');
                head.setAttribute('filter', 'drop-shadow(0 0 12px #38bdf8)');
                cometGroup.appendChild(head);

                vfxLayer.appendChild(cometGroup);

                // 2. Momento del Impacto Físico (260ms después del inicio de este cometa)
                setTimeout(() => {
                    cometGroup.remove();

                    // ¡EMERGE LA PIEDRA FÍSICA EN LA CASILLA INMEDIATAMENTE!
                    onStoneImpact(idx);
                    SoundFX.playPlaceStone();
                    
                    const boardTarget = document.getElementById('board-container') || document.getElementById('game-screen');
                    if (boardTarget) {
                        boardTarget.classList.remove('vfx-screen-shake');
                        void boardTarget.offsetWidth;
                        boardTarget.classList.add('vfx-screen-shake');
                        setTimeout(() => boardTarget.classList.remove('vfx-screen-shake'), 160);
                    }

                    // Anillo de explosión celestial
                    const burst = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    burst.setAttribute('cx', `${coord.x}`);
                    burst.setAttribute('cy', `${coord.y}`);
                    burst.setAttribute('r', '6');
                    burst.setAttribute('fill', 'none');
                    burst.setAttribute('stroke', '#38bdf8');
                    burst.setAttribute('stroke-width', '4');
                    burst.setAttribute('class', 'vfx-celestial-burst');
                    vfxLayer.appendChild(burst);

                    // Chispas de polvo estelar
                    const sparkAngles = [0, 90, 180, 270, 45, 135, 225, 315];
                    sparkAngles.forEach(deg => {
                        const rad = (deg * Math.PI) / 180;
                        const dist = 20 + Math.random() * 12;
                        const tx = Math.cos(rad) * dist;
                        const ty = Math.sin(rad) * dist;

                        const spark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        spark.setAttribute('cx', `${coord.x}`);
                        spark.setAttribute('cy', `${coord.y}`);
                        spark.setAttribute('r', '2.5');
                        spark.setAttribute('fill', '#7dd3fc');
                        spark.setAttribute('class', 'vfx-stardust-particle');
                        spark.setAttribute('style', `--tx: ${tx}px; --ty: ${ty}px;`);
                        vfxLayer.appendChild(spark);
                    });

                }, 260);

            }, delayMs);
        });

        setTimeout(() => {
            vfxLayer.remove();
            onComplete();
        }, coords.length * 240 + 500);
    }
}
