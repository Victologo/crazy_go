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

            // Icono y contenido
            let statusBadgeHtml = '';
            let unitHereHtml = '';
            if (node.status === 'completed') {
                statusBadgeHtml = '<span class="node-badge-done">✓</span>';
            } else if (node.status === 'current') {
                statusBadgeHtml = '<span class="node-badge-current-dot"></span>';
                unitHereHtml = '<span class="node-unit-here-label">ESTÁS AQUÍ</span>';
            }

            nodeEl.innerHTML = `
                <div class="node-card-tile">
                    <span class="node-icon">${node.icon}</span>
                    ${statusBadgeHtml}
                </div>
                ${unitHereHtml}
                <div class="node-tooltip">
                    <strong class="tooltip-title">${node.title}</strong>
                    ${node.battleConfig ? `<span class="tooltip-sub">${translateEnemyName(node.battleConfig.enemyName)} (${node.battleConfig.rankLabel}) • ${t('wizard.shape_' + node.battleConfig.shape) || node.battleConfig.shape}</span>` : ''}
                    <p class="tooltip-desc">${node.description}</p>
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
