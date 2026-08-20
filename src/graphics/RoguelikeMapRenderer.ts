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

    public render(map: RoguelikeMap) {
        this.container.innerHTML = '';

        const mapWrapper = document.createElement('div');
        mapWrapper.className = 'rogue-map-scroll-wrapper';

        // 1. Crear capa SVG para las líneas de camino (Sumi-e Paths)
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'rogue-map-svg-connections');
        svg.setAttribute('viewBox', '0 0 1000 800');
        svg.setAttribute('preserveAspectRatio', 'none');

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
                    path.setAttribute('class', `rogue-map-path ${isTraversed ? 'path-traversed' : ''}`);
                    svg.appendChild(path);
                }
            }
        }
        mapWrapper.appendChild(svg);

        // 2. Crear capa de Nodos Interactivos (HTML Elements sobre el pergamino)
        const nodesContainer = document.createElement('div');
        nodesContainer.className = 'rogue-map-nodes-layer';

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
                    case 'procedural':
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

            nodeEl.innerHTML = `
                <div class="node-card-tile">
                    ${iconHtml}
                    ${statusBadgeHtml}
                </div>
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

        // Auto-scroll al tier disponible en el viewport
        setTimeout(() => {
            const viewport = document.getElementById('roguelike-map-viewport') || this.container;
            const activeNode = Array.from(map.nodes.values()).find(n => n.status === 'available' || n.status === 'current');
            if (activeNode && viewport) {
                const targetY = Math.max(0, activeNode.y - 300);
                viewport.scrollTo({ top: targetY, behavior: 'smooth' });
            }
        }, 100);
    }
}
