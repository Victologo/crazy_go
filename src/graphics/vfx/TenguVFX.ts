// graphics/vfx/TenguVFX.ts - Animación de Lluvia Meteórica de Tengu
import { SoundFX } from '../../audio/SoundFX';

export class TenguVFX {
    /**
     * Animación: Lluvia Meteórica (Meteor Shower de Tengu)
     * Desata meteoros incandescentes fluidos con estelas de fuego que caen sobre las coordenadas seleccionadas,
     * destruyendo piedras en impacto real con ondas de choque ígneas y chispas.
     */
    public static triggerMeteorShower(
        impactCoords: { x: number; y: number }[], 
        svgElement: SVGSVGElement,
        onImpactNode: (index: number) => void,
        onComplete: () => void
    ) {
        const vfxLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        vfxLayer.setAttribute('class', 'vfx-meteor-layer');
        svgElement.appendChild(vfxLayer);

        impactCoords.forEach((coord, idx) => {
            const delayMs = idx * 110;
            setTimeout(() => {
                // 1. Grupo del Meteorito Ígneo en Descenso
                const meteorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                meteorGroup.setAttribute('class', 'vfx-meteor-comet');
                meteorGroup.setAttribute('style', `transform-origin: ${coord.x}px ${coord.y}px;`);

                // Estela exterior de fuego carmesí
                const outerTail = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                outerTail.setAttribute('x1', `${coord.x - 70}`);
                outerTail.setAttribute('y1', `${coord.y - 120}`);
                outerTail.setAttribute('x2', `${coord.x}`);
                outerTail.setAttribute('y2', `${coord.y}`);
                outerTail.setAttribute('stroke', '#ef4444');
                outerTail.setAttribute('stroke-width', '8');
                outerTail.setAttribute('stroke-linecap', 'round');
                outerTail.setAttribute('opacity', '0.9');
                meteorGroup.appendChild(outerTail);

                // Núcleo brillante interior de plasma dorado
                const coreTail = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                coreTail.setAttribute('x1', `${coord.x - 55}`);
                coreTail.setAttribute('y1', `${coord.y - 95}`);
                coreTail.setAttribute('x2', `${coord.x}`);
                coreTail.setAttribute('y2', `${coord.y}`);
                coreTail.setAttribute('stroke', '#fef08a');
                coreTail.setAttribute('stroke-width', '3.5');
                coreTail.setAttribute('stroke-linecap', 'round');
                coreTail.setAttribute('opacity', '0.95');
                meteorGroup.appendChild(coreTail);

                // Cabeza incandescente del meteorito
                const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                head.setAttribute('cx', `${coord.x}`);
                head.setAttribute('cy', `${coord.y}`);
                head.setAttribute('r', '13');
                head.setAttribute('fill', '#fbbf24');
                head.setAttribute('stroke', '#ea580c');
                head.setAttribute('stroke-width', '2.5');
                head.setAttribute('filter', 'drop-shadow(0 0 12px #f97316)');
                meteorGroup.appendChild(head);

                vfxLayer.appendChild(meteorGroup);

                // 2. Momento del Impacto Ígneo (220ms después del inicio de este meteoro)
                setTimeout(() => {
                    meteorGroup.remove();

                    // ¡DESTRUYE LA PIEDRA FÍSICA EN TIEMPO REAL!
                    onImpactNode(idx);
                    SoundFX.playCapture();
                    
                    const boardTarget = document.getElementById('board-container') || document.getElementById('game-screen');
                    if (boardTarget) {
                        boardTarget.classList.remove('vfx-screen-shake');
                        void boardTarget.offsetWidth;
                        boardTarget.classList.add('vfx-screen-shake');
                        setTimeout(() => boardTarget.classList.remove('vfx-screen-shake'), 140);
                    }

                    // Anillo de explosión ígnea
                    const burst = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    burst.setAttribute('cx', `${coord.x}`);
                    burst.setAttribute('cy', `${coord.y}`);
                    burst.setAttribute('r', '6');
                    burst.setAttribute('fill', 'none');
                    burst.setAttribute('stroke', '#ef4444');
                    burst.setAttribute('stroke-width', '4');
                    burst.setAttribute('class', 'vfx-meteor-burst');
                    vfxLayer.appendChild(burst);

                    // Onda expansiva secundaria dorada
                    const shockwave = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    shockwave.setAttribute('cx', `${coord.x}`);
                    shockwave.setAttribute('cy', `${coord.y}`);
                    shockwave.setAttribute('r', '10');
                    shockwave.setAttribute('fill', 'none');
                    shockwave.setAttribute('stroke', '#f59e0b');
                    shockwave.setAttribute('stroke-width', '2');
                    shockwave.setAttribute('class', 'vfx-shockwave-anim');
                    vfxLayer.appendChild(shockwave);

                    // Chispas y ascuas incandescentes
                    const sparkAngles = [0, 90, 180, 270, 45, 135, 225, 315];
                    sparkAngles.forEach(deg => {
                        const rad = (deg * Math.PI) / 180;
                        const dist = 18 + Math.random() * 14;
                        const tx = Math.cos(rad) * dist;
                        const ty = Math.sin(rad) * dist;

                        const spark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        spark.setAttribute('cx', `${coord.x}`);
                        spark.setAttribute('cy', `${coord.y}`);
                        spark.setAttribute('r', (1.5 + Math.random() * 2).toString());
                        spark.setAttribute('fill', Math.random() > 0.5 ? '#fbbf24' : '#ef4444');
                        spark.setAttribute('class', 'vfx-ember-particle');
                        spark.setAttribute('style', `--tx: ${tx}px; --ty: ${ty}px;`);
                        vfxLayer.appendChild(spark);
                    });

                }, 220);

            }, delayMs);
        });

        setTimeout(() => {
            vfxLayer.remove();
            onComplete();
        }, impactCoords.length * 110 + 450);
    }
}
