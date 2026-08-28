// graphics/vfx/TenguVFX.ts - Animación de Lluvia Meteórica de Tengu
import { SoundFX } from '../../audio/SoundFX';

export class TenguVFX {
    /**
     * Animación: Lluvia Meteórica (Meteor Shower de Tengu)
     * Desata meteoros incandescentes fluidos con estelas de fuego que caen exactamente sobre las coordenadas
     * de las intersecciones válidas seleccionadas, escaladas según la geometría del tablero.
     */
    public static triggerMeteorShower(
        impactCoords: { x: number; y: number }[], 
        svgElement: SVGSVGElement,
        onImpactNode: (index: number) => void,
        onComplete: () => void,
        stoneRadius: number = 18,
        meteorTheme: 'red' | 'blue' = 'red'
    ) {
        const vfxLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        vfxLayer.setAttribute('class', 'vfx-meteor-layer');
        const liveContainer = svgElement.querySelector('#vfx-live-container') || svgElement;
        liveContainer.appendChild(vfxLayer);

        const r = Math.max(10, stoneRadius);
        const headR = r * 0.72;
        const tailLenX = r * 3.6;
        const tailLenY = r * 6.2;

        impactCoords.forEach((coord, idx) => {
            const delayMs = idx * 110;
            setTimeout(() => {
                // 1. Grupo del Meteorito Ígneo en Descenso
                const meteorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                meteorGroup.setAttribute('class', 'vfx-meteor-comet');
                meteorGroup.setAttribute('style', `transform-origin: ${coord.x}px ${coord.y}px;`);

                // Estela exterior de fuego carmesí
                const outerTail = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                outerTail.setAttribute('x1', `${coord.x - tailLenX}`);
                outerTail.setAttribute('y1', `${coord.y - tailLenY}`);
                outerTail.setAttribute('x2', `${coord.x}`);
                outerTail.setAttribute('y2', `${coord.y}`);
                outerTail.setAttribute('stroke', meteorTheme === 'red' ? '#ef4444' : '#3b82f6');
                outerTail.setAttribute('stroke-width', `${r * 0.44}`);
                outerTail.setAttribute('stroke-linecap', 'round');
                outerTail.setAttribute('opacity', '0.9');
                meteorGroup.appendChild(outerTail);

                // Núcleo brillante interior de plasma dorado
                const coreTail = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                coreTail.setAttribute('x1', `${coord.x - tailLenX * 0.78}`);
                coreTail.setAttribute('y1', `${coord.y - tailLenY * 0.78}`);
                coreTail.setAttribute('x2', `${coord.x}`);
                coreTail.setAttribute('y2', `${coord.y}`);
                coreTail.setAttribute('stroke', meteorTheme === 'red' ? '#fde047' : '#93c5fd');
                coreTail.setAttribute('stroke-width', `${r * 0.2}`);
                coreTail.setAttribute('stroke-linecap', 'round');
                coreTail.setAttribute('opacity', '0.95');
                meteorGroup.appendChild(coreTail);

                // Cabeza incandescente del meteorito
                const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                head.setAttribute('cx', `${coord.x}`);
                head.setAttribute('cy', `${coord.y}`);
                head.setAttribute('r', `${headR}`);
                head.setAttribute('fill', meteorTheme === 'red' ? '#fbbf24' : '#60a5fa');
                head.setAttribute('stroke', meteorTheme === 'red' ? '#ea580c' : '#2563eb');
                head.setAttribute('stroke-width', `${r * 0.14}`);
                head.setAttribute('filter', meteorTheme === 'red' ? 'drop-shadow(0 0 12px #f97316)' : 'drop-shadow(0 0 12px #3b82f6)');
                meteorGroup.appendChild(head);

                vfxLayer.appendChild(meteorGroup);

                // 2. Momento del Impacto Ígneo (220ms después del inicio de este meteoro)
                setTimeout(() => {
                    meteorGroup.remove();

                    // ¡DESTRUYE LA PIEDRA FÍSICA EN TIEMPO REAL!
                    onImpactNode(idx);
                    SoundFX.playMeteorImpact();
                    
                    const boardTarget = document.getElementById('board-container') || document.getElementById('game-screen');
                    if (boardTarget) {
                        boardTarget.classList.remove('vfx-screen-shake');
                        void boardTarget.offsetWidth;
                        boardTarget.classList.add('vfx-screen-shake');
                        setTimeout(() => boardTarget.classList.remove('vfx-screen-shake'), 140);
                    }

                    // Anillo de explosión ígnea centrado exactamente en la intersección
                    const burst = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    burst.setAttribute('cx', `${coord.x}`);
                    burst.setAttribute('cy', `${coord.y}`);
                    burst.setAttribute('r', '0');
                    burst.setAttribute('fill', 'none');
                    burst.setAttribute('stroke', meteorTheme === 'red' ? '#f97316' : '#3b82f6');
                    burst.setAttribute('stroke-width', `${r * 0.8}`);
                    burst.setAttribute('class', 'vfx-meteor-burst');
                    vfxLayer.appendChild(burst);

                    // Onda expansiva secundaria dorada
                    const shockwave = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    shockwave.setAttribute('cx', `${coord.x}`);
                    shockwave.setAttribute('cy', `${coord.y}`);
                    shockwave.setAttribute('r', `${r * 0.55}`);
                    shockwave.setAttribute('fill', 'none');
                    shockwave.setAttribute('stroke', '#f59e0b');
                    shockwave.setAttribute('stroke-width', `${r * 0.12}`);
                    shockwave.setAttribute('class', 'vfx-shockwave-anim');
                    vfxLayer.appendChild(shockwave);

                    // Chispas y ascuas incandescentes radiales
                    const sparkAngles = [0, 90, 180, 270, 45, 135, 225, 315];
                    sparkAngles.forEach(deg => {
                        const rad = (deg * Math.PI) / 180;
                        const dist = r * (1.0 + Math.random() * 0.8);
                        const tx = Math.cos(rad) * dist;
                        const ty = Math.sin(rad) * dist;

                        const spark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        spark.setAttribute('cx', `${coord.x}`);
                        spark.setAttribute('cy', `${coord.y}`);
                        spark.setAttribute('r', (r * (0.08 + Math.random() * 0.1)).toString());
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
