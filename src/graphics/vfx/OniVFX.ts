// graphics/vfx/OniVFX.ts — Animaciones de Inhalación Gravitacional y Festín de Almas (Máscara Oni)
import { SoundFX } from '../../audio/SoundFX';
import type { PlayerId } from '../../core/GraphBoard';

export interface OniStoneShift {
    fromId: string;
    toId?: string;
    fromCoords: { x: number; y: number };
    toCoords: { x: number; y: number };
    playerId: PlayerId;
    isDevoured?: boolean;
}

export class OniVFX {
    /**
     * Animación cinemática del Vórtice Gravitacional e Inhalación del Oni:
     * - Ráfagas de viento y miasma carmesí-púrpura convergiendo hacia la boca del Oni.
     * - Deslizamiento suave de las piedras ligeras (1-2 piedras) hacia abajo (y + 1).
     * - Absorción / devoración de piedras en el abismo de las fauces con implosión y encogimiento.
     * - Sonido de vendaval y energía demoníaca.
     */
    public static triggerOniInhalation(
        mouthCenter: { x: number; y: number },
        shifts: OniStoneShift[],
        svgElement: SVGSVGElement,
        onComplete: () => void,
        stoneRadius: number = 18
    ): void {
        const vfxLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        vfxLayer.setAttribute('class', 'vfx-oni-inhalation-layer');
        const liveContainer = svgElement.querySelector('#vfx-live-container') || svgElement;
        liveContainer.appendChild(vfxLayer);

        SoundFX.playWind();

        const hasDevoured = shifts.some(s => s.isDevoured);
        if (hasDevoured) {
            setTimeout(() => {
                SoundFX.playDemonicRoar();
            }, 300);
        }

        const mx = mouthCenter.x;
        const my = mouthCenter.y;
        const r = Math.max(10, stoneRadius);

        // 1. Efecto de Vórtice de Viento / Miasma hacia la Boca
        const vortexGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        vortexGroup.setAttribute('class', 'vfx-oni-vortex-wind');
        vfxLayer.appendChild(vortexGroup);

        // Definición de gradiente dinámico para las ráfagas de viento demoníaco si no existe
        let defs = svgElement.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svgElement.prepend(defs);
        }

        if (!svgElement.querySelector('#oni-wind-gradient')) {
            const windGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            windGrad.setAttribute('id', 'oni-wind-gradient');
            windGrad.setAttribute('x1', '0%');
            windGrad.setAttribute('y1', '0%');
            windGrad.setAttribute('x2', '0%');
            windGrad.setAttribute('y2', '100%');

            const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('stop-color', '#a855f7');
            stop1.setAttribute('stop-opacity', '0');

            const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop2.setAttribute('offset', '60%');
            stop2.setAttribute('stop-color', '#e11d48');
            stop2.setAttribute('stop-opacity', '0.75');

            const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop3.setAttribute('offset', '100%');
            stop3.setAttribute('stop-color', '#4c1d95');
            stop3.setAttribute('stop-opacity', '0.95');

            windGrad.appendChild(stop1);
            windGrad.appendChild(stop2);
            windGrad.appendChild(stop3);
            defs.appendChild(windGrad);
        }

        // 2. Trazar Ráfagas Curvas hacia la Boca
        const windLinesCount = 18;
        const bbox = svgElement.viewBox.baseVal;
        const width = bbox.width || 600;
        const height = bbox.height || 600;

        for (let i = 0; i < windLinesCount; i++) {
            const startX = (width * (i + 0.5)) / windLinesCount + (Math.random() * 40 - 20);
            const startY = Math.random() * (height * 0.4); // se originan en la parte media/superior
            const midX = (startX + mx) / 2 + (Math.random() * 60 - 30);
            const midY = (startY + my) / 2;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${startX} ${startY} Q ${midX} ${midY} ${mx} ${my}`);
            path.setAttribute('stroke', 'url(#oni-wind-gradient)');
            path.setAttribute('stroke-width', `${Math.max(2, r * 0.18)}`);
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('fill', 'none');
            path.setAttribute('class', 'vfx-oni-wind-line');
            path.setAttribute('style', `animation-delay: ${i * 35}ms; stroke-dasharray: 140; stroke-dashoffset: 140;`);
            vortexGroup.appendChild(path);
        }

        // 3. Onda de Succión Circular en la Boca
        const suctionRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        suctionRing.setAttribute('cx', `${mx}`);
        suctionRing.setAttribute('cy', `${my}`);
        suctionRing.setAttribute('r', `${r * 3.2}`);
        suctionRing.setAttribute('class', 'vfx-oni-suction-ring');
        suctionRing.setAttribute('fill', 'none');
        suctionRing.setAttribute('stroke', '#e11d48');
        suctionRing.setAttribute('stroke-width', `${r * 0.28}`);
        suctionRing.setAttribute('filter', 'drop-shadow(0 0 16px rgba(225, 29, 72, 0.9))');
        vortexGroup.appendChild(suctionRing);

        // 4. Animar el Deslizamiento y Devoración de las Piedras
        const shiftDurationMs = 550;
        const shiftStartDelayMs = 220;

        const slidingGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        slidingGroup.setAttribute('class', 'vfx-oni-sliding-stones');
        vfxLayer.appendChild(slidingGroup);

        shifts.forEach((shift) => {
            const stoneClone = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            stoneClone.setAttribute('class', 'vfx-oni-sliding-token');

            // Círculo base de la piedra
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', `${shift.fromCoords.x}`);
            circle.setAttribute('cy', `${shift.fromCoords.y}`);
            circle.setAttribute('r', `${r}`);

            let gradId = 'url(#black-stone-grad)';
            if (shift.playerId === 2) gradId = 'url(#white-stone-grad)';
            else if (shift.playerId === 3) gradId = 'url(#green-stone-grad)';
            else if (shift.playerId === 4) gradId = 'url(#purple-stone-grad)';

            circle.setAttribute('fill', gradId);
            circle.setAttribute('filter', 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6))');

            // Aura de viento / arrastre espiritual
            const aura = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            aura.setAttribute('cx', `${shift.fromCoords.x}`);
            aura.setAttribute('cy', `${shift.fromCoords.y}`);
            aura.setAttribute('r', `${r * 1.35}`);
            aura.setAttribute('fill', 'none');
            aura.setAttribute('stroke', shift.isDevoured ? '#e11d48' : '#a855f7');
            aura.setAttribute('stroke-width', '2.5');
            aura.setAttribute('stroke-dasharray', '4, 4');
            aura.setAttribute('opacity', '0.85');

            stoneClone.appendChild(aura);
            stoneClone.appendChild(circle);
            slidingGroup.appendChild(stoneClone);

            // Animar traslación suave hacia toCoords (o hacia el centro de la boca con encogimiento si es devorada)
            setTimeout(() => {
                const dx = shift.toCoords.x - shift.fromCoords.x;
                const dy = shift.toCoords.y - shift.fromCoords.y;
                stoneClone.style.transition = `transform ${shiftDurationMs}ms cubic-bezier(0.25, 1, 0.5, 1), opacity ${shiftDurationMs}ms ease-in`;
                if (shift.isDevoured) {
                    stoneClone.style.transformOrigin = `${shift.fromCoords.x}px ${shift.fromCoords.y}px`;
                    stoneClone.style.transform = `translate(${dx}px, ${dy}px) scale(0.1)`;
                    stoneClone.style.opacity = '0';
                } else {
                    stoneClone.style.transform = `translate(${dx}px, ${dy}px)`;
                }
            }, shiftStartDelayMs);
        });

        // 5. Finalizar animación y limpiar capa de efectos
        const totalDurationMs = shiftStartDelayMs + shiftDurationMs + 350;
        setTimeout(() => {
            vfxLayer.remove();
            onComplete();
        }, totalDurationMs);
    }

    /**
     * Feedback visual de Festín de Almas: Destello carmesí en el standee del héroe.
     */
    public static triggerSoulFeast(playerId: PlayerId = 1): void {
        SoundFX.playDemonicRoar();

        let targetStandee: HTMLElement | null = null;
        if (playerId === 1) {
            targetStandee = document.getElementById('duel-player-card');
        } else {
            targetStandee = document.getElementById('duel-enemy-card') || document.getElementById(`duel-p${playerId}-card`);
        }

        if (targetStandee) {
            targetStandee.classList.remove('soul-feast-flash');
            void targetStandee.offsetWidth; // Forzar reflow para reiniciar animación
            targetStandee.classList.add('soul-feast-flash');

            // Añadir temporalmente una runa flotante de festín de almas
            const runeTag = document.createElement('div');
            runeTag.className = 'soul-feast-floating-tag';
            runeTag.innerHTML = '<span>👹</span><strong>+1 EXTRA</strong>';
            targetStandee.appendChild(runeTag);

            setTimeout(() => {
                targetStandee?.classList.remove('soul-feast-flash');
                runeTag.remove();
            }, 1600);
        }
    }
}
