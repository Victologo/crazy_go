// graphics/vfx/AlchemistVFX.ts - Efectos Visuales de Transmutación Alquímica
export class AlchemistVFX {
    public static triggerTransmuteSlash(targetPos: { x: number; y: number }, svgElement: SVGSVGElement) {
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

        g.appendChild(aura);
        g.appendChild(ring);
        svgElement.appendChild(g);

        let scale = 1;
        let opacity = 1;
        let rotation = 0;

        const anim = setInterval(() => {
            scale += 0.08;
            opacity -= 0.06;
            rotation += 15;

            ring.setAttribute('transform', `rotate(${rotation} ${targetPos.x} ${targetPos.y})`);
            ring.setAttribute('r', (15 * scale).toString());
            ring.setAttribute('opacity', Math.max(0, opacity).toString());
            aura.setAttribute('r', (8 * scale * 1.5).toString());
            aura.setAttribute('opacity', Math.max(0, opacity * 0.7).toString());

            if (opacity <= 0) {
                clearInterval(anim);
                g.remove();
            }
        }, 25);
    }
}
