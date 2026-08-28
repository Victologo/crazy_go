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

            <!-- ======================================================== -->
            <!-- TEXTURAS Y SHADERS DEDICADOS PARA POLIMINÓS (2x1 y 2x2) -->
            <!-- ======================================================== -->
            <!-- Duplicidad 2x1 Negro (Obsidiana) -->
            <linearGradient id="poly-domino-body-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#334155"/>
                <stop offset="25%" stop-color="#1e293b"/>
                <stop offset="70%" stop-color="#0f172a"/>
                <stop offset="100%" stop-color="#020617"/>
            </linearGradient>

            <!-- Duplicidad 2x1 Blanco (Nácar) -->
            <linearGradient id="poly-domino-body-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="35%" stop-color="#f8fafc"/>
                <stop offset="75%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#94a3b8"/>
            </linearGradient>

            <!-- Duplicidad 2x1 Verde (Jade) -->
            <linearGradient id="poly-domino-body-3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#6ee7b7"/>
                <stop offset="35%" stop-color="#10b981"/>
                <stop offset="75%" stop-color="#047857"/>
                <stop offset="100%" stop-color="#064e3b"/>
            </linearGradient>

            <!-- Duplicidad 2x1 Púrpura (Amatista) -->
            <linearGradient id="poly-domino-body-4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#c4b5fd"/>
                <stop offset="35%" stop-color="#8b5cf6"/>
                <stop offset="75%" stop-color="#6d28d9"/>
                <stop offset="100%" stop-color="#4c1d95"/>
            </linearGradient>

            <!-- Monolito 2x2 Negro (Losa Megalítica de Pizarra y Obsidiana) -->
            <linearGradient id="poly-monolith-body-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#334155"/>
                <stop offset="20%" stop-color="#1e293b"/>
                <stop offset="60%" stop-color="#0f172a"/>
                <stop offset="100%" stop-color="#020617"/>
            </linearGradient>

            <!-- Monolito 2x2 Blanco (Mármol y Cuarzo) -->
            <linearGradient id="poly-monolith-body-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="25%" stop-color="#f1f5f9"/>
                <stop offset="70%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#94a3b8"/>
            </linearGradient>

            <!-- Monolito 2x2 Verde (Megalito de Jade) -->
            <linearGradient id="poly-monolith-body-3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#34d399"/>
                <stop offset="40%" stop-color="#059669"/>
                <stop offset="80%" stop-color="#047857"/>
                <stop offset="100%" stop-color="#064e3b"/>
            </linearGradient>

            <!-- Monolito 2x2 Púrpura (Megalito de Cristal Amatista) -->
            <linearGradient id="poly-monolith-body-4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#a78bfa"/>
                <stop offset="40%" stop-color="#7c3aed"/>
                <stop offset="80%" stop-color="#5b21b6"/>
                <stop offset="100%" stop-color="#3b0764"/>
            </linearGradient>

            <!-- Gradiente de Cola de Meteorito -->
            <linearGradient id="meteor-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ef4444" stop-opacity="0" />
                <stop offset="70%" stop-color="#f59e0b" stop-opacity="0.8" />
                <stop offset="100%" stop-color="#fbbf24" stop-opacity="1" />
            </linearGradient>

            <!-- Textura de Madera para el Tablero Dinámico -->
            <pattern id="wood-texture" patternUnits="userSpaceOnUse" width="1200" height="1200">
                <image href="./wood_kaya.jpg" x="0" y="0" width="1200" height="1200" preserveAspectRatio="xMidYMid slice" />
            </pattern>

            <!-- Textura de Hierba para el Tablero Conquistado -->
            <pattern id="grass-texture" patternUnits="userSpaceOnUse" width="1200" height="1200">
                <rect width="1200" height="1200" fill="#2e7d32" />
                <path d="M0,0 L1200,1200 M1200,0 L0,1200" stroke="#1b5e20" stroke-width="2" stroke-dasharray="10 20" opacity="0.3"/>
            </pattern>

            <!-- Sombra del Tablero (Efecto Elevado) -->
            <filter id="board-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="15" stdDeviation="12" flood-color="#000000" flood-opacity="0.85"/>
                <feDropShadow dx="0" dy="0" stdDeviation="25" flood-color="#f59e0b" flood-opacity="0.18"/>
            </filter>

            <!-- Gradiente de Roca Volcánica de Esquinas -->
            <radialGradient id="volcano-rock-grad" cx="45%" cy="45%" r="60%">
                <stop offset="0%" stop-color="#44403c" />
                <stop offset="40%" stop-color="#292524" />
                <stop offset="85%" stop-color="#1c1917" />
                <stop offset="100%" stop-color="#0c0a09" />
            </radialGradient>

            <!-- Gradiente de Magma Ardiente de Cráter -->
            <radialGradient id="volcano-magma-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#fef08a" />
                <stop offset="25%" stop-color="#f59e0b" />
                <stop offset="60%" stop-color="#ea580c" />
                <stop offset="88%" stop-color="#b91c1c" />
                <stop offset="100%" stop-color="#7f1d1d" />
            </radialGradient>

            <!-- Gradiente de Humo y Fumarola Volcánica -->
            <radialGradient id="volcano-smoke-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#a8a29e" stop-opacity="0.65" />
                <stop offset="50%" stop-color="#78716c" stop-opacity="0.35" />
                <stop offset="85%" stop-color="#44403c" stop-opacity="0.1" />
                <stop offset="100%" stop-color="#1c1917" stop-opacity="0" />
            </radialGradient>

            <!-- Gradientes y Filtros Celestes para el Tablero del Cielo -->
            <radialGradient id="sky-cloud-grad" cx="45%" cy="45%" r="65%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
                <stop offset="40%" stop-color="#e0f2fe" stop-opacity="0.8" />
                <stop offset="75%" stop-color="#38bdf8" stop-opacity="0.45" />
                <stop offset="100%" stop-color="#0284c7" stop-opacity="0" />
            </radialGradient>

            <linearGradient id="sky-block-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#e0f2fe" stop-opacity="0.9" />
                <stop offset="35%" stop-color="#38bdf8" stop-opacity="0.85" />
                <stop offset="70%" stop-color="#0284c7" stop-opacity="0.9" />
                <stop offset="100%" stop-color="#0369a1" stop-opacity="0.95" />
            </linearGradient>

            <radialGradient id="sky-star-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffffff" />
                <stop offset="30%" stop-color="#fef08a" />
                <stop offset="70%" stop-color="#38bdf8" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#0284c7" stop-opacity="0" />
            </radialGradient>

            <!-- Gradientes y Filtros para Fichas Poliminó Especiales (Duplicidad y Monolito) -->
            <filter id="domino-bevel" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="1.8" dy="3.8" stdDeviation="2.8" flood-color="#000000" flood-opacity="0.55"/>
            </filter>

            <filter id="monolith-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="3" dy="5.5" stdDeviation="4.5" flood-color="#000000" flood-opacity="0.65"/>
                <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#f59e0b" flood-opacity="0.25"/>
            </filter>

            <filter id="monolith-rune-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="glow"/>
                <feMerge>
                    <feMergeNode in="glow"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>

            <!-- Gradientes y Filtros para la Boca / Fauces del Abismo Infinito del Oni -->
            <radialGradient id="oni-void-core" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#020005" />
                <stop offset="35%" stop-color="#180026" />
                <stop offset="65%" stop-color="#3b0764" />
                <stop offset="88%" stop-color="#831843" />
                <stop offset="100%" stop-color="#030005" />
            </radialGradient>

            <radialGradient id="oni-void-swirl-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ec4899" stop-opacity="0.9" />
                <stop offset="30%" stop-color="#a855f7" stop-opacity="0.75" />
                <stop offset="60%" stop-color="#4c1d95" stop-opacity="0.45" />
                <stop offset="85%" stop-color="#e11d48" stop-opacity="0.2" />
                <stop offset="100%" stop-color="#000000" stop-opacity="0" />
            </radialGradient>

            <linearGradient id="oni-fang-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#fffbeb" />
                <stop offset="60%" stop-color="#fde68a" />
                <stop offset="90%" stop-color="#b45309" />
                <stop offset="100%" stop-color="#78350f" />
            </linearGradient>

            <linearGradient id="oni-fang-lower-grad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stop-color="#fffbeb" />
                <stop offset="60%" stop-color="#fde68a" />
                <stop offset="90%" stop-color="#b45309" />
                <stop offset="100%" stop-color="#78350f" />
            </linearGradient>

            <filter id="oni-void-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4.5" result="blur"/>
                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        `;
        return defs;
    }
}
