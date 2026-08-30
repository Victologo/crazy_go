// RoguelikeMapRenderer.ts - Renderizado del Mapa Procedural de Nodos para Crazy Go
import type { RoguelikeMap, MapNode } from '../core/RoguelikeMapGenerator';
import { SoundFX } from '../audio/SoundFX';
import { t, translateEnemyName } from '../i18n/i18n';

export class RoguelikeMapRenderer {
    private container: HTMLElement;
    private onNodeSelected: (node: MapNode) => void;

    constructor(containerId: string, onNodeSelected: (node: MapNode) => void) {
        const el = document.getElementById(containerId) || 
                   document.getElementById('roguelike-map-canvas-container') || 
                   document.getElementById('roguelike-map-viewport');
        if (!el) throw new Error(`Container with id ${containerId} not found`);
        this.container = el;
        this.onNodeSelected = onNodeSelected;
    }

    public render(map: RoguelikeMap, isNewRun: boolean = false) {
        this.container.innerHTML = '';

        const mapWrapper = document.createElement('div');
        mapWrapper.className = 'rogue-map-scroll-wrapper';

        // 1. Atmósfera Superior: Ceniza Negra Carbonizada y Brasas Ígneas (alrededor del Jefe Dragón)
        const embersLayer = document.createElement('div');
        embersLayer.className = 'map-embers-layer';
        
        // 1a. Escamas de Ceniza Negra y Hollín
        for (let i = 0; i < 14; i++) {
            const ash = document.createElement('div');
            ash.className = 'map-ash-flake';
            ash.style.left = `${Math.random() * 92 + 4}%`;
            ash.style.top = `${Math.random() * 80}%`;
            const sizeW = Math.random() * 6 + 4;
            const sizeH = Math.random() * 5 + 3;
            ash.style.width = `${sizeW}px`;
            ash.style.height = `${sizeH}px`;
            ash.style.animationDelay = `${Math.random() * 4}s`;
            ash.style.animationDuration = `${Math.random() * 2.5 + 4}s`;
            embersLayer.appendChild(ash);
        }

        // 1b. Brasas incandescentes al rojo vivo
        for (let i = 0; i < 14; i++) {
            const ember = document.createElement('div');
            ember.className = 'map-ember';
            ember.style.left = `${Math.random() * 90 + 5}%`;
            ember.style.top = `${Math.random() * 85}%`;
            const size = Math.random() * 4.5 + 2.5;
            ember.style.width = `${size}px`;
            ember.style.height = `${size}px`;
            ember.style.animationDelay = `${Math.random() * 3.5}s`;
            ember.style.animationDuration = `${Math.random() * 2 + 3}s`;
            embersLayer.appendChild(ember);
        }
        mapWrapper.appendChild(embersLayer);

        // 2. Capa Inferior de Decoración (Panda, Ciervo, Pinos y Bambú removidos / reservada para Tarea 296 en Roadmap)
        // [FUTURO / Tarea 296]: Ecosistema dinámico ilustrado con sprites / shaders dedicados en el mapa roguelike.

        // 3. Calcular altura dinámica del mapa según el número de tiers
        let maxY = 750;
        for (const node of map.nodes.values()) {
            if (node.y > maxY) maxY = node.y;
        }
        const stageHeight = maxY + 80;
        mapWrapper.style.height = `${stageHeight + 40}px`;
        mapWrapper.style.minHeight = `${stageHeight + 40}px`;

        // 4. Crear capa SVG para las líneas de camino (Sumi-e Paths)
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'rogue-map-svg-connections');
        svg.setAttribute('viewBox', `0 0 1000 ${stageHeight}`);
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.style.height = `${stageHeight}px`;

        // Dibujar conexiones entre nodos
        for (const [_, node] of map.nodes.entries()) {
            const startX = (node.x / 100) * 1000;
            const startY = node.y;

            for (const nextId of node.nextConnectedNodeIds) {
                const nextNode = map.nodes.get(nextId);
                if (nextNode) {
                    const endX = (nextNode.x / 100) * 1000;
                    const endY = nextNode.y;

                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    // Curva bezier orgánica para estilo pergamino tradicional
                    const midY = (startY + endY) / 2;
                    const d = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
                    path.setAttribute('d', d);

                    const isTraversed = node.status === 'completed' && (nextNode.status === 'completed' || nextNode.status === 'available' || nextNode.status === 'current');
                    const isAvailable = (node.status === 'completed' || node.status === 'current') && nextNode.status === 'available';

                    let pathClass = 'rogue-map-path';
                    if (isTraversed) pathClass += ' path-traversed';
                    else if (isAvailable) pathClass += ' path-available';

                    path.setAttribute('class', pathClass);
                    svg.appendChild(path);
                }
            }
        }
        mapWrapper.appendChild(svg);

        // 5. Crear capa de Nodos Interactivos (HTML Elements sobre el pergamino)
        const nodesContainer = document.createElement('div');
        nodesContainer.className = 'rogue-map-nodes-layer';
        nodesContainer.style.height = `${stageHeight}px`;

        for (const [_, node] of map.nodes.entries()) {
            const nodeEl = document.createElement('button');
            nodeEl.className = `rogue-node-btn node-type-${node.type} node-status-${node.status}`;
            nodeEl.style.left = `${node.x}%`;
            nodeEl.style.top = `${node.y}px`;
            nodeEl.setAttribute('data-node-id', node.id);

            const isEn = t('app.title') === 'Crazy Go' && (document.documentElement.lang === 'en' || !document.documentElement.lang.startsWith('es'));
            let statusBadgeHtml = '';
            let unitHereHtml = '';
            if (node.status === 'completed') {
                statusBadgeHtml = '<span class="node-badge-done">✓</span>';
            } else if (node.status === 'current') {
                statusBadgeHtml = '<span class="node-badge-current-dot"></span>';
                unitHereHtml = isEn ? '<span class="node-unit-here-label">YOU ARE HERE</span>' : '<span class="node-unit-here-label">ESTÁS AQUÍ</span>';
            }

            let nodeTitle = node.title;
            let nodeDesc = node.description;
            if (isEn) {
                if (node.type === 'battle') {
                    nodeTitle = `Go Battle (Round ${node.tier + 1})`;
                    nodeDesc = 'Face a Go rival on an asymmetric board. Win sacred artifacts and scrolls.';
                } else if (node.type === 'shrine') {
                    nodeTitle = 'Mystic Shrine';
                    nodeDesc = "Receive a spiritual blessing or restore your Champion's Active Skill.";
                } else if (node.type === 'rest') {
                    nodeTitle = 'Meditation Area';
                    nodeDesc = 'Rest to recover spell charges or forge tactical scrolls and polyomino tiles.';
                } else if (node.type === 'shop') {
                    nodeTitle = 'Go Merchant';
                    nodeDesc = 'Choose sacred artifacts and scrolls to empower your expedition.';
                } else if (node.type === 'boss') {
                    nodeTitle = '🐉 Great Grey Sage Dragon (Final Boss)';
                    nodeDesc = 'The ultimate Goban challenge. An ancient sage dragon with grey scales and long whiskers who incinerates 25% of the board.';
                }
            }

            let iconHtml = `<span class="node-icon">${node.icon}</span>`;
            if (node.type === 'battle' || node.type === 'boss') {
                const shape = node.battleConfig?.shape || 'square';
                const size = node.battleConfig?.size || 9;
                
                // Escalar el tablero según la proximidad al jefe final (9x9 -> 19x19)
                const scale = size === 9 ? 0.7 : (size === 19 ? 1.2 : 0.95);
                const w = 48 * scale;
                const h = 48 * scale;
                
                let pathD = '';
                switch (shape) {
                    case 'triangle':
                        pathD = `M ${w/2} 0 L ${w} ${h} L 0 ${h} Z`;
                        break;
                    case 'hex':
                    case 'hexagon':
                        pathD = `M ${w/2} 0 L ${w} ${h*0.25} L ${w} ${h*0.75} L ${w/2} ${h} L 0 ${h*0.75} L 0 ${h*0.25} Z`;
                        break;
                    case 'cross':
                        pathD = `M ${w*0.3} 0 L ${w*0.7} 0 L ${w*0.7} ${h*0.3} L ${w} ${h*0.3} L ${w} ${h*0.7} L ${w*0.7} ${h*0.7} L ${w*0.7} ${h} L ${w*0.3} ${h} L ${w*0.3} ${h*0.7} L 0 ${h*0.7} L 0 ${h*0.3} L ${w*0.3} ${h*0.3} Z`;
                        break;
                    case 'star_5':
                    case 'star_6':
                        pathD = `M ${w/2} 0 L ${w*0.6} ${h*0.3} L ${w} ${h*0.3} L ${w*0.7} ${h*0.6} L ${w*0.8} ${h} L ${w/2} ${h*0.7} L ${w*0.2} ${h} L ${w*0.3} ${h*0.6} L 0 ${h*0.3} L ${w*0.4} ${h*0.3} Z`;
                        break;
                    case 'hourglass':
                        pathD = `M 0 0 L ${w} 0 L ${w*0.6} ${h/2} L ${w} ${h} L 0 ${h} L ${w*0.4} ${h/2} Z`;
                        break;
                    case 'irregular':
                    case 'islands_v1':
                    case 'islands_v2':
                    case 'eroded':
                        pathD = `M ${w*0.1} ${h*0.1} Q ${w*0.5} 0 ${w*0.9} ${h*0.2} Q ${w} ${h*0.5} ${w*0.8} ${h*0.9} Q ${w*0.5} ${h} ${w*0.1} ${h*0.8} Q 0 ${h*0.5} ${w*0.1} ${h*0.1} Z`;
                        break;
                    default:
                        // square
                        pathD = `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
                        break;
                }

                // Generar grid de lineas dentro del SVG
                let gridLines = '';
                const lines = size === 19 ? 7 : (size === 13 ? 5 : 3);
                for (let i = 1; i <= lines; i++) {
                    const pos = (i / (lines + 1)) * w;
                    gridLines += `<line x1="${pos}" y1="0" x2="${pos}" y2="${h}" stroke="rgba(202, 138, 4, 0.2)" stroke-width="0.5" />`;
                    const posY = (i / (lines + 1)) * h;
                    gridLines += `<line x1="0" y1="${posY}" x2="${w}" y2="${posY}" stroke="rgba(202, 138, 4, 0.2)" stroke-width="0.5" />`;
                }

                // Asegurar que el SVG contenga un grid y borde
                const svgHtml = `
                    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 0; opacity: 0.9; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
                        <path d="${pathD}" fill="#1e293b" stroke="#ca8a04" stroke-width="1.5" />
                        <g clip-path="url(#shapeClip-${node.id})">
                            <clipPath id="shapeClip-${node.id}">
                                <path d="${pathD}" />
                            </clipPath>
                            ${gridLines}
                        </g>
                    </svg>
                `;

                iconHtml = `
                    <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                        ${svgHtml}
                        <span class="node-icon" style="position: relative; z-index: 1;">${node.icon}</span>
                    </div>
                `;
            }

            // Easter Egg: Mini Dragón Volador Orbital alrededor del nodo Boss
            let dragonEasterEggHtml = '';
            if (node.type === 'boss') {
                dragonEasterEggHtml = `
                    <div class="map-boss-dragon-orbit" title="🐉 Gran Dragón Sabio">
                        <div class="map-boss-mini-dragon">
                            <svg class="mini-dragon-svg" viewBox="0 0 40 24" width="34" height="22">
                                <defs>
                                    <filter id="dragonGlow-${node.id}" x="-30%" y="-30%" width="160%" height="160%">
                                        <feGaussianBlur stdDeviation="1" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                    <linearGradient id="dragonGrad-${node.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#fca5a5" />
                                        <stop offset="40%" stop-color="#ef4444" />
                                        <stop offset="100%" stop-color="#7f1d1d" />
                                    </linearGradient>
                                    <linearGradient id="wingGrad-${node.id}" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stop-color="#fef08a" />
                                        <stop offset="100%" stop-color="#f59e0b" />
                                    </linearGradient>
                                </defs>
                                <path class="dragon-body" d="M 33,12 Q 27,6 21,12 T 11,12 T 3,14" fill="none" stroke="url(#dragonGrad-${node.id})" stroke-width="4.2" stroke-linecap="round" />
                                <path d="M 32,13 Q 27,8 21,13 T 11,13 T 4,14.5" fill="none" stroke="#fef08a" stroke-width="1.6" stroke-linecap="round" />
                                <path d="M 3,14 L 0,10.5 L 3.5,13 L 0,16.5 Z" fill="#f59e0b" />
                                <g class="dragon-wings">
                                    <path d="M 22,10 Q 25,0 30,2 Q 26,7 21,11 Z" fill="url(#wingGrad-${node.id})" opacity="0.95" />
                                    <path d="M 20,12 Q 17,21 12,19 Q 16,14 21,11 Z" fill="url(#wingGrad-${node.id})" opacity="0.8" />
                                </g>
                                <g class="dragon-head">
                                    <circle cx="33" cy="11" r="3.6" fill="#ef4444" />
                                    <path d="M 32,8 L 29,4.5 M 34,8 L 33.5,3.5" stroke="#fbbf24" stroke-width="1.3" stroke-linecap="round" />
                                    <circle cx="34.5" cy="10.2" r="1.1" fill="#fef08a" filter="url(#dragonGlow-${node.id})" />
                                    <path d="M 36,12 Q 39,11 38,15.5" fill="none" stroke="#fbbf24" stroke-width="0.9" />
                                    <circle class="dragon-spark" cx="37.5" cy="11.2" r="1.3" fill="#f59e0b" />
                                </g>
                            </svg>
                            <div class="mini-dragon-trail"></div>
                        </div>
                    </div>
                `;
            }

            nodeEl.innerHTML = `
                <div class="node-card-tile">
                    ${iconHtml}
                    ${statusBadgeHtml}
                </div>
                ${dragonEasterEggHtml}
                ${unitHereHtml}
                <div class="node-tooltip">
                    <strong class="tooltip-title">${nodeTitle}</strong>
                    ${node.battleConfig ? `<span class="tooltip-sub">${translateEnemyName(node.battleConfig.enemyName)} (${node.battleConfig.rankLabel}) • ${t('wizard.shape_' + node.battleConfig.shape) || node.battleConfig.shape}</span>` : ''}
                    <p class="tooltip-desc">${nodeDesc}</p>
                </div>
            `;

            if (node.status === 'available' || node.status === 'current') {
                nodeEl.addEventListener('click', () => {
                    SoundFX.playPlaceStone();
                    this.onNodeSelected(node);
                });
            }

            nodesContainer.appendChild(nodeEl);
        }

        mapWrapper.appendChild(nodesContainer);
        this.container.appendChild(mapWrapper);

        // Auto-scroll y animación de descenso del mapa
        setTimeout(() => {
            const viewport = document.getElementById('roguelike-map-viewport') || this.container;
            if (!viewport) return;

            if (isNewRun) {
                // Al inicio de la run: Posicionar la cámara arriba en el Jefe Dragón
                viewport.scrollTop = 0;

                // Tras una pausa dramática de 450ms, descender suavemente hasta los nodos iniciales abajo
                setTimeout(() => {
                    const activeNode = Array.from(map.nodes.values()).find(n => n.status === 'available' || n.status === 'current');
                    const targetY = activeNode ? Math.max(0, activeNode.y - 300) : (viewport.scrollHeight - viewport.clientHeight);

                    this.smoothScrollTo(viewport, targetY, 1500, () => {
                        // Al llegar abajo, destacar los nodos disponibles con un pulso dorado
                        const availableTiles = document.querySelectorAll('.node-status-available .node-card-tile');
                        availableTiles.forEach(tile => {
                            tile.classList.add('node-starting-pulse');
                            setTimeout(() => tile.classList.remove('node-starting-pulse'), 2000);
                        });
                    });
                }, 450);
            } else {
                const activeNode = Array.from(map.nodes.values()).find(n => n.status === 'available' || n.status === 'current');
                if (activeNode) {
                    const targetY = Math.max(0, activeNode.y - 300);
                    viewport.scrollTo({ top: targetY, behavior: 'smooth' });
                }
            }
        }, 100);
    }

    /**
     * Realiza un desplazamiento vertical fluido con curva de aceleración/desaceleración suave
     */
    private smoothScrollTo(element: HTMLElement, targetY: number, durationMs: number, onComplete?: () => void) {
        const startY = element.scrollTop;
        const distance = targetY - startY;
        const startTime = performance.now();

        const step = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            // Curva easeInOutCubic
            const ease = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            element.scrollTop = startY + distance * ease;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.scrollTop = targetY;
                if (onComplete) onComplete();
            }
        };

        requestAnimationFrame(step);
    }
}
