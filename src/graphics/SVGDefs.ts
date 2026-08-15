// graphics/SVGDefs.ts - Generador de Definiciones SVG (Filtros, Gradientes Cromáticos y Resplandores)

export class SVGDefs {
    public static createDefinitions(): SVGDefsElement {
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.innerHTML = `
            <!-- Sombra de piedra de Go -->
            <filter id="stone-shadow" x="-30%" y="-30%" width="170%" height="170%">
                <feDropShadow dx="1.5" dy="3.5" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.45"/>
            </filter>
            <filter id="ghost-shadow" x="-30%" y="-30%" width="170%" height="170%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.25"/>
            </filter>
            <filter id="glow-meteor">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>

            <!-- Halo Dorado Resplandeciente de Piedra Sagrada (Indestructible) -->
            <filter id="sacred-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="3.5" result="glow"/>
                <feComponentTransfer in="glow" result="brightGlow">
                    <feFuncA type="linear" slope="2.2" />
                </feComponentTransfer>
                <feMerge>
                    <feMergeNode in="brightGlow"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>

            <!-- Gradiente Radial Dorado para Aura Sagrada Divina -->
            <radialGradient id="sacred-radial-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#fef08a" stop-opacity="0.85"/>
                <stop offset="35%" stop-color="#fbbf24" stop-opacity="0.55"/>
                <stop offset="70%" stop-color="#f59e0b" stop-opacity="0.25"/>
                <stop offset="100%" stop-color="#d97706" stop-opacity="0"/>
            </radialGradient>

            <!-- Halo Botánico de Piedra Germinante (1x1) -->
            <filter id="sprout-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="glow"/>
                <feMerge>
                    <feMergeNode in="glow"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>

            <!-- Gradiente Piedra Negra (Pizarra/Obsidiana) -->
            <radialGradient id="black-stone-grad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stop-color="#4a4a4a"/>
                <stop offset="45%" stop-color="#242424"/>
                <stop offset="90%" stop-color="#0f0f0f"/>
                <stop offset="100%" stop-color="#050505"/>
            </radialGradient>

            <!-- Gradiente Piedra Blanca (Concha/Nácar) -->
            <radialGradient id="white-stone-grad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="65%" stop-color="#edf2f7"/>
                <stop offset="90%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#94a3b8"/>
            </radialGradient>

            <!-- Gradiente Piedra Esmeralda (Jade / Jugador 3) -->
            <radialGradient id="green-stone-grad" cx="32%" cy="32%" r="68%">
                <stop offset="0%" stop-color="#a7f3d0"/>
                <stop offset="40%" stop-color="#34d399"/>
                <stop offset="75%" stop-color="#059669"/>
                <stop offset="100%" stop-color="#064e3b"/>
            </radialGradient>

            <!-- Gradiente Piedra Amatista (Púrpura / Jugador 4) -->
            <radialGradient id="purple-stone-grad" cx="32%" cy="32%" r="68%">
                <stop offset="0%" stop-color="#ddd6fe"/>
                <stop offset="40%" stop-color="#a78bfa"/>
                <stop offset="75%" stop-color="#7c3aed"/>
                <stop offset="100%" stop-color="#4c1d95"/>
            </radialGradient>

            <!-- Gradiente de Cola de Meteorito -->
            <linearGradient id="meteor-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ef4444" stop-opacity="0" />
                <stop offset="70%" stop-color="#f59e0b" stop-opacity="0.8" />
                <stop offset="100%" stop-color="#fbbf24" stop-opacity="1" />
            </linearGradient>
        `;
        return defs;
    }
}
