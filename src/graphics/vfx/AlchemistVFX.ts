// graphics/vfx/AlchemistVFX.ts - Efectos Visuales de Transmutación Alquímica
import { GlobalSettings } from '../../core/GlobalSettings';
import { SoundFX } from '../../audio/SoundFX';

export class AlchemistVFX {
    public static triggerTransmuteSlash(targetPos: { x: number; y: number }, svgElement: SVGSVGElement) {
        SoundFX.playAlchemicalTransmute();
        if (!GlobalSettings.particlesEnabled) return;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'alchemist-transmute-vfx');

        // Círculo de transmutación de mercurio y oro
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ring.setAttribute('cx', targetPos.x.toString());
        ring.setAttribute('cy', targetPos.y.toString());
        ring.setAttribute('r', '15');
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', '#a855f7');
        ring.setAttribute('stroke-width', '4');
        ring.setAttribute('stroke-dasharray', '8 4');
        ring.setAttribute('opacity', '0.9');

        const aura = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        aura.setAttribute('cx', targetPos.x.toString());
        aura.setAttribute('cy', targetPos.y.toString());
        aura.setAttribute('r', '8');
        aura.setAttribute('fill', 'rgba(234, 179, 8, 0.4)');

        // Pincel animado
        const brush = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        brush.setAttribute('x', (targetPos.x - 20).toString());
        brush.setAttribute('y', (targetPos.y - 15).toString());
        brush.setAttribute('font-size', '60');
        brush.textContent = '🖌️';
        brush.setAttribute('opacity', '1');

        g.appendChild(aura);
        g.appendChild(ring);
        g.appendChild(brush);
        
        const liveContainer = svgElement.querySelector('#vfx-live-container') || svgElement;
        liveContainer.appendChild(g);

        let scale = 1;
        let opacity = 1;
        let rotation = 0;
        let brushX = targetPos.x - 20;

        const fps = GlobalSettings.fpsLimit;
        const intervalMs = 1000 / fps;
        
        // Ajustamos la velocidad de la animación para que dure lo mismo independientemente de los FPS
        const framesExpected = (1 / 0.06) * (25 / intervalMs);
        const opacityDecay = 1 / framesExpected;
        const scaleGrow = 0.08 * (intervalMs / 25);
        const rotationStep = 15 * (intervalMs / 25);
        const brushMove = 2 * (intervalMs / 25);

        const anim = setInterval(() => {
            scale += scaleGrow;
            opacity -= opacityDecay;
            rotation += rotationStep;
            brushX += brushMove;

            ring.setAttribute('transform', `rotate(${rotation} ${targetPos.x} ${targetPos.y})`);
            ring.setAttribute('r', (15 * scale).toString());
            ring.setAttribute('opacity', Math.max(0, opacity).toString());
            aura.setAttribute('r', (8 * scale * 1.5).toString());
            aura.setAttribute('opacity', Math.max(0, opacity * 0.7).toString());
            
            brush.setAttribute('x', brushX.toString());
            brush.setAttribute('y', (targetPos.y - 15 + Math.sin(rotation * 0.1) * 5).toString());
            brush.setAttribute('opacity', Math.max(0, opacity * 1.2).toString());

            if (opacity <= 0) {
                clearInterval(anim);
                g.remove();
            }
        }, intervalMs);
    }
}
