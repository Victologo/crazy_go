// graphics/vfx/RyujinVFX.ts - Animación de Aliento de Llamas Sagradas y Ceniza de Ryūjin
import { SoundFX } from '../../audio/SoundFX';

export class RyujinVFX {
    /**
     * Animación: Aliento de Llamas Sagradas y Ceniza de Ryūjin (Furia del Dragón)
     * Desata una llamarada ígnea fulgurante sobre la piedra y genera ceniza y ascuas flotantes que se disuelven en 1.0s,
     * solapándose fluidamente con el turno siguiente sin bloquear la partida.
     */
    public static triggerDragonFlame(coord: { x: number; y: number }, svgElement: SVGSVGElement, onComplete?: () => void) {
        const boardTarget = document.getElementById('board-container') || document.getElementById('game-screen');
        if (boardTarget) {
            boardTarget.classList.remove('vfx-screen-shake');
            void boardTarget.offsetWidth;
            boardTarget.classList.add('vfx-screen-shake');
            setTimeout(() => boardTarget.classList.remove('vfx-screen-shake'), 380);
        }
        SoundFX.playDragonFlame();

        const flameLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        flameLayer.setAttribute('class', 'vfx-dragon-flame-live-layer');
        flameLayer.style.pointerEvents = 'none';

        // 1. Nube de humo de incineración oscura
        const smoke = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        smoke.setAttribute('cx', `${coord.x}`);
        smoke.setAttribute('cy', `${coord.y}`);
        smoke.setAttribute('r', '10');
        smoke.setAttribute('fill', '#0f172a');
        smoke.setAttribute('class', 'vfx-smoke-puff-anim');
        flameLayer.appendChild(smoke);

        // 2. Chorro de fuego del dragón en descenso
        const breathStream = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        breathStream.setAttribute('x1', `${coord.x - 50}`);
        breathStream.setAttribute('y1', `${coord.y - 100}`);
        breathStream.setAttribute('x2', `${coord.x}`);
        breathStream.setAttribute('y2', `${coord.y}`);
        breathStream.setAttribute('stroke', 'url(#meteor-gradient)');
        breathStream.setAttribute('stroke-width', '10');
        breathStream.setAttribute('stroke-linecap', 'round');
        breathStream.setAttribute('class', 'vfx-dragon-fire-blast');
        flameLayer.appendChild(breathStream);

        // 3. Núcleo ardiente de plasma y explosión de fuego
        const fireCore = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        fireCore.setAttribute('cx', `${coord.x}`);
        fireCore.setAttribute('cy', `${coord.y}`);
        fireCore.setAttribute('r', '28');
        fireCore.setAttribute('fill', 'url(#meteor-gradient)');
        fireCore.setAttribute('filter', 'url(#glow-meteor)');
        fireCore.setAttribute('class', 'vfx-dragon-fire-blast');
        flameLayer.appendChild(fireCore);

        // 4. 14 Partículas de Ceniza y Ascuas Incandescentes Flotantes (duración 1.0s)
        for (let i = 0; i < 14; i++) {
            const angle = (i / 14) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
            const dist = 14 + Math.random() * 26;
            const ashX = Math.cos(angle) * dist;
            const ashY = -18 - Math.random() * 34; // Ascenso hacia arriba simulando convección térmica de ceniza

            const ash = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ash.setAttribute('cx', `${coord.x}`);
            ash.setAttribute('cy', `${coord.y}`);
            const isEmber = i % 3 === 0;
            ash.setAttribute('r', (isEmber ? (1.5 + Math.random() * 1.5) : (2.2 + Math.random() * 2.2)).toString());
            ash.setAttribute('fill', isEmber ? '#fbbf24' : (i % 2 === 0 ? '#334155' : '#1e293b'));
            ash.setAttribute('class', 'vfx-ash-dissolve-particle');
            ash.setAttribute('style', `--ashX: ${ashX}px; --ashY: ${ashY}px; --ashDelay: ${i * 20}ms;`);
            flameLayer.appendChild(ash);
        }

        // Adjuntar al contenedor dedicado de VFX en vivo
        let liveVfxContainer = svgElement.querySelector('#vfx-live-container');
        if (!liveVfxContainer) {
            liveVfxContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            liveVfxContainer.setAttribute('id', 'vfx-live-container');
            liveVfxContainer.setAttribute('style', 'pointer-events: none;');
            svgElement.appendChild(liveVfxContainer);
        }
        liveVfxContainer.appendChild(flameLayer);

        // Ejecutar callback para continuar el juego de inmediato (solapamiento fluido)
        if (onComplete) onComplete();

        // Autodestrucción completa tras 1.0s (1000ms)
        setTimeout(() => {
            flameLayer.remove();
        }, 1000);
    }
}
