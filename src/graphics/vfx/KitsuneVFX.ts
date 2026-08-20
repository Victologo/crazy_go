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

    /**
     * Animación: Concesión de Escudo Divino Sagrado (Kitsune)
     */
    public static triggerDivineShieldAura(coord: { x: number; y: number }, svgElement: SVGSVGElement) {
        const aura = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        aura.setAttribute('cx', `${coord.x}`);
        aura.setAttribute('cy', `${coord.y}`);
        aura.setAttribute('r', '26');
        aura.setAttribute('fill', 'url(#sacred-radial-glow)');
        aura.setAttribute('stroke', '#f59e0b');
        aura.setAttribute('stroke-width', '2.5');
        aura.setAttribute('class', 'vfx-sacred-aura-pulse');
        const liveContainer = svgElement.querySelector('#vfx-live-container') || svgElement;
        liveContainer.appendChild(aura);

        setTimeout(() => {
            aura.remove();
        }, 1200);
    }

    private static recentShatters: Set<string> = new Set();

    /**
     * Animación: Rotura del Escudo Divino (Kitsune)
     */
    public static triggerDivineShieldShatter(coord: { x: number; y: number }, svgElement: SVGSVGElement) {
        const key = `${coord.x},${coord.y}`;
        if (this.recentShatters.has(key)) return;
        this.recentShatters.add(key);
        setTimeout(() => this.recentShatters.delete(key), 800);

        const shatter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        shatter.setAttribute('cx', `${coord.x}`);
        shatter.setAttribute('cy', `${coord.y}`);
        shatter.setAttribute('r', '22');
        shatter.setAttribute('fill', 'transparent');
        shatter.setAttribute('stroke', '#fbbf24');
        shatter.setAttribute('stroke-width', '3');
        shatter.setAttribute('stroke-dasharray', '8, 4');
        shatter.setAttribute('class', 'vfx-shield-shatter');
        
        const liveContainer = svgElement.querySelector('#vfx-live-container') || svgElement;
        liveContainer.appendChild(shatter);

        setTimeout(() => {
            shatter.remove();
        }, 600);
    }
}
