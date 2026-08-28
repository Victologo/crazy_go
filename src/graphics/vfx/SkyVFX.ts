// graphics/vfx/SkyVFX.ts — Animación Fluida de Caída y Construcción Celestial de Bloques Cuadrados (2x2)
import { SoundFX } from '../../audio/SoundFX';

export interface SkySquareImpact {
    center: { x: number; y: number };
    nodeIds: string[];
    coords: { x: number; y: number }[];
}

export class SkyVFX {
    /**
     * Animación: Caída Fluida de Bloques Cuadrados del Cielo
     * 5 bloques cuadrados luminosos de 2x2 descienden con estelas celestes,
     * aterrizando suavemente sobre el tablero para construir el nuevo terreno sin sacudidas de pantalla.
     */
    public static triggerSkyFallingSquares(
        squares: SkySquareImpact[],
        svgElement: SVGSVGElement,
        onImpactSquare: (index: number) => void,
        onComplete: () => void,
        stoneRadius: number = 18
    ): void {
        const vfxLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        vfxLayer.setAttribute('class', 'vfx-sky-layer');
        const liveContainer = svgElement.querySelector('#vfx-live-container') || svgElement;
        liveContainer.appendChild(vfxLayer);

        const r = Math.max(10, stoneRadius);
        const squareSize = r * 2.8; // Tamaño visual del bloque 2x2

        squares.forEach((sq, idx) => {
            const delayMs = idx * 110;
            setTimeout(() => {
                const cx = sq.center.x;
                const cy = sq.center.y;

                // 1. Grupo del Bloque Cuadrado Celestial Descendiendo con fluidez
                const fallGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                fallGroup.setAttribute('class', 'vfx-sky-falling-block');
                fallGroup.setAttribute('style', `transform-origin: ${cx}px ${cy}px;`);

                // Estelas verticales celestes etéreas
                const trail1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                trail1.setAttribute('x1', `${cx - squareSize * 0.35}`);
                trail1.setAttribute('y1', `${cy - r * 6}`);
                trail1.setAttribute('x2', `${cx - squareSize * 0.35}`);
                trail1.setAttribute('y2', `${cy}`);
                trail1.setAttribute('stroke', '#38bdf8');
                trail1.setAttribute('stroke-width', `${r * 0.25}`);
                trail1.setAttribute('stroke-linecap', 'round');
                trail1.setAttribute('opacity', '0.7');
                fallGroup.appendChild(trail1);

                const trail2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                trail2.setAttribute('x1', `${cx + squareSize * 0.35}`);
                trail2.setAttribute('y1', `${cy - r * 6}`);
                trail2.setAttribute('x2', `${cx + squareSize * 0.35}`);
                trail2.setAttribute('y2', `${cy}`);
                trail2.setAttribute('stroke', '#38bdf8');
                trail2.setAttribute('stroke-width', `${r * 0.25}`);
                trail2.setAttribute('stroke-linecap', 'round');
                trail2.setAttribute('opacity', '0.7');
                fallGroup.appendChild(trail2);

                const coreTrail = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                coreTrail.setAttribute('x1', `${cx}`);
                coreTrail.setAttribute('y1', `${cy - r * 7}`);
                coreTrail.setAttribute('x2', `${cx}`);
                coreTrail.setAttribute('y2', `${cy}`);
                coreTrail.setAttribute('stroke', '#fef08a');
                coreTrail.setAttribute('stroke-width', `${r * 0.35}`);
                coreTrail.setAttribute('stroke-linecap', 'round');
                coreTrail.setAttribute('opacity', '0.85');
                fallGroup.appendChild(coreTrail);

                // Bloque Cuadrado Físico que cae suavemente
                const blockRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                blockRect.setAttribute('x', `${cx - squareSize / 2}`);
                blockRect.setAttribute('y', `${cy - squareSize / 2}`);
                blockRect.setAttribute('width', `${squareSize}`);
                blockRect.setAttribute('height', `${squareSize}`);
                blockRect.setAttribute('rx', `${r * 0.35}`);
                blockRect.setAttribute('ry', `${r * 0.35}`);
                blockRect.setAttribute('fill', 'url(#sky-block-grad)');
                blockRect.setAttribute('stroke', '#fef08a');
                blockRect.setAttribute('stroke-width', `${r * 0.14}`);
                blockRect.setAttribute('filter', 'drop-shadow(0 0 16px rgba(56, 189, 248, 0.8))');
                fallGroup.appendChild(blockRect);

                // Runa celestial central
                const runeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                runeText.setAttribute('x', `${cx}`);
                runeText.setAttribute('y', `${cy + r * 0.26}`);
                runeText.setAttribute('text-anchor', 'middle');
                runeText.setAttribute('fill', '#ffffff');
                runeText.setAttribute('font-size', `${r * 1.05}px`);
                runeText.setAttribute('font-weight', 'bold');
                runeText.textContent = '☁️';
                fallGroup.appendChild(runeText);

                vfxLayer.appendChild(fallGroup);

                // 2. Momento del Aterrizaje Suave (300ms de descenso armónico)
                setTimeout(() => {
                    fallGroup.remove();

                    // Construir casillas en el goban
                    onImpactSquare(idx);
                    SoundFX.playSkyBlockLand();

                    // Halo expansivo de aterrizaje celestial
                    const impactFlash = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    impactFlash.setAttribute('x', `${cx - squareSize * 0.55}`);
                    impactFlash.setAttribute('y', `${cy - squareSize * 0.55}`);
                    impactFlash.setAttribute('width', `${squareSize * 1.1}`);
                    impactFlash.setAttribute('height', `${squareSize * 1.1}`);
                    impactFlash.setAttribute('rx', `${r * 0.35}`);
                    impactFlash.setAttribute('ry', `${r * 0.35}`);
                    impactFlash.setAttribute('fill', 'rgba(56, 189, 248, 0.25)');
                    impactFlash.setAttribute('stroke', '#38bdf8');
                    impactFlash.setAttribute('stroke-width', `${r * 0.3}`);
                    impactFlash.setAttribute('class', 'vfx-sky-impact-flash');
                    vfxLayer.appendChild(impactFlash);

                    // Ondas etéreas circulares suaves
                    const shockwave = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    shockwave.setAttribute('cx', `${cx}`);
                    shockwave.setAttribute('cy', `${cy}`);
                    shockwave.setAttribute('r', `${r * 0.5}`);
                    shockwave.setAttribute('fill', 'none');
                    shockwave.setAttribute('stroke', '#fef08a');
                    shockwave.setAttribute('stroke-width', `${r * 0.16}`);
                    shockwave.setAttribute('class', 'vfx-shockwave-anim');
                    vfxLayer.appendChild(shockwave);

                    // Chispas estelares celestiales
                    const sparkAngles = [0, 60, 120, 180, 240, 300];
                    sparkAngles.forEach(deg => {
                        const rad = (deg * Math.PI) / 180;
                        const dist = r * (1.1 + Math.random() * 0.8);
                        const tx = Math.cos(rad) * dist;
                        const ty = Math.sin(rad) * dist;

                        const spark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        spark.setAttribute('cx', `${cx}`);
                        spark.setAttribute('cy', `${cy}`);
                        spark.setAttribute('r', `${r * (0.08 + Math.random() * 0.1)}`);
                        spark.setAttribute('fill', Math.random() > 0.4 ? '#38bdf8' : '#fef08a');
                        spark.setAttribute('class', 'vfx-ember-particle');
                        spark.setAttribute('style', `--tx: ${tx.toFixed(1)}px; --ty: ${ty.toFixed(1)}px;`);
                        vfxLayer.appendChild(spark);
                    });

                }, 290);

            }, delayMs);
        });

        setTimeout(() => {
            vfxLayer.remove();
            onComplete();
        }, squares.length * 110 + 450);
    }
}
