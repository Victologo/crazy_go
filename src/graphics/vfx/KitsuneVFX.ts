// graphics/vfx/KitsuneVFX.ts - Animación de Teletransporte Espiritual de Kitsune

export class KitsuneVFX {
    /**
     * Animación: Teletransporte Espiritual (Kitsune)
     */
    public static triggerTeleportPoof(coord: { x: number; y: number }, svgElement: SVGSVGElement) {
        const poof = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        poof.setAttribute('cx', `${coord.x}`);
        poof.setAttribute('cy', `${coord.y}`);
        poof.setAttribute('r', '18');
        poof.setAttribute('fill', '#c084fc');
        poof.setAttribute('class', 'vfx-teleport-poof');
        svgElement.appendChild(poof);

        setTimeout(() => {
            poof.remove();
        }, 500);
    }
}
