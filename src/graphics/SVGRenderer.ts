// graphics/SVGRenderer.ts - Motor Principal de Renderizado SVG para Goban y Topologías de Crazy Go
import { GraphBoard, type BoardNode } from '../core/GraphBoard';
import { GameState } from '../core/GameState';
import { RulesEngine } from '../core/RulesEngine';
import { SoundFX } from '../audio/SoundFX';
import { ChampionManager } from '../core/ChampionManager';
import { PolyominoManager } from '../core/PolyominoManager';
import { SandboxController } from '../controllers/SandboxController';
import { HUDController } from '../ui/HUDController';
import { SVGDefs } from './SVGDefs';
import { SVGGhostPreview } from './SVGGhostPreview';
import { TutorialManager } from '../tutorial/TutorialManager';
import { StoryController } from '../story/StoryController';
import { getLanguage } from '../i18n/i18n';
import { VFXManager } from './VFXManager';

export class SVGRenderer {
    public svgElement: SVGSVGElement;
    private board: GraphBoard;
    private state: GameState;
    private onUIUpdate: () => void;
    private onIllegalMove: (msg: string) => void;
    private onMovePlaced?: (nodeId: string, isLocal: boolean) => void;
    private onSkillPlaced?: (skillType: string, nodeId: string) => void;
    private isTurnAllowedCallback?: () => boolean;
    private getLocalPlayerColorCallback?: () => import('../core/GraphBoard').PlayerId;
    public onPassiveBurnCompleted?: () => void;
    public isInteractive: boolean = true;
    public lastHoveredNode: BoardNode | null = null;
    public currentStoneRadius: number = 18;
    public activeHintNodeId: string | null = null;
    public activeContinuation: Array<{ nodeId: string; playerId: import('../core/GraphBoard').PlayerId; step: number }> | null = null;

    constructor(
        svgElementId: string, 
        board: GraphBoard, 
        state: GameState, 
        onUIUpdate: () => void,
        onIllegalMove: (msg: string) => void,
        onMovePlaced?: (nodeId: string, isLocal: boolean) => void,
        onSkillPlaced?: (skillType: string, nodeId: string) => void,
        isTurnAllowed?: () => boolean,
        getLocalPlayerColor?: () => import('../core/GraphBoard').PlayerId
    ) {
        this.svgElement = document.getElementById(svgElementId) as unknown as SVGSVGElement;
        this.board = board;
        this.state = state;
        this.onUIUpdate = onUIUpdate;
        this.onIllegalMove = onIllegalMove;
        this.onMovePlaced = onMovePlaced;
        this.onSkillPlaced = onSkillPlaced;
        this.isTurnAllowedCallback = isTurnAllowed;
        this.getLocalPlayerColorCallback = getLocalPlayerColor;

        if (!this.svgElement) {
            console.error(`Element with id ${svgElementId} not found`);
        }
    }

    render() {
        if (!this.svgElement) return;

        // 1. Guardar capas de animación activas en vivo (para no cortar llamaradas de fuego ni cenizas flotantes)
        const liveVfxContainer = this.svgElement.querySelector('#vfx-live-container');
        const activeLiveVfx = liveVfxContainer ? Array.from(liveVfxContainer.children) : [];

        // Limpiar el SVG
        this.svgElement.innerHTML = '';

        const nodes = Array.from(this.board.nodes.values());
        if (nodes.length === 0) return;

        // 2. Calcular límites (Bounding Box) exactos para centrado perfecto
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const node of nodes) {
            if (node.x < minX) minX = node.x;
            if (node.x > maxX) maxX = node.x;
            if (node.y < minY) minY = node.y;
            if (node.y > maxY) maxY = node.y;
        }

        // Calcular radio óptimo de piedra según la distancia mínima entre nodos
        let minNeighborDistance = Infinity;
        for (const node of nodes) {
            for (const nId of node.neighbors) {
                const neighbor = this.board.nodes.get(nId);
                if (neighbor) {
                    const dist = Math.hypot(node.x - neighbor.x, node.y - neighbor.y);
                    if (dist > 0 && dist < minNeighborDistance) {
                        minNeighborDistance = dist;
                    }
                }
            }
        }

        const stoneRadius = isFinite(minNeighborDistance)
            ? Math.max(10, Math.min(25, minNeighborDistance * 0.475))
            : 18;
        this.currentStoneRadius = stoneRadius;

        // Margen compacto y óptimo para todas las topologías (picudas, duales, anchas o estándar)
        // La madera sobresale exactamente alrededor de las piedras periféricas sin desperdiciar espacio en el viewBox
        const padding = stoneRadius * 1.08;
        const safetyMargin = padding + 4;
        const finalWidth = (maxX - minX) + safetyMargin * 2;
        const finalHeight = (maxY - minY) + safetyMargin * 2;
        const finalMinX = minX - safetyMargin;
        const finalMinY = minY - safetyMargin;

        this.svgElement.setAttribute('viewBox', `${finalMinX} ${finalMinY} ${finalWidth} ${finalHeight}`);
        this.svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        // 3. Inyectar Definiciones (Defs) de Sombras, Gradientes y Efectos de forma global (solo una vez)
        if (!document.getElementById('global-svg-defs')) {
            const globalDefsSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
            globalDefsSvg.setAttribute('id', 'global-svg-defs');
            // Importante: No usar display: none porque rompería los patrones en Firefox/Safari
            globalDefsSvg.setAttribute("style", "position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none;");
            globalDefsSvg.appendChild(SVGDefs.createDefinitions());
            document.body.appendChild(globalDefsSvg);
        }

        // 3.5. Generar Fondo de Madera Dinámico (Forma Convex Hull)
        this.renderBoardBackground(nodes, padding);

        // 4. Dibujar Líneas de la Red (Grid Lines / Urushi Ink)
        this.renderGridLines(nodes);

        // 5. Dibujar Puntos Estrella (Hoshi) si existen
        this.renderStarPoints(nodes, stoneRadius);

        // 6. Superposición de Territorio (Si la partida ha terminado)
        this.renderTerritoryOverlay(stoneRadius);

        // 6b. Superposición de Seki (vida mutua — no puntúan para nadie)
        this.renderSekiOverlay(stoneRadius);

        // 6b. Renderizar Objetos y Rehenes Capturables
        this.renderCaptives(stoneRadius);

        // 7. Dibujar Piedras Colocadas y Efectos de Estado
        this.renderStones(nodes, stoneRadius);

        // 8. Capa Persistente de VFX en Vivo (Llamarada, humo y partículas de ceniza)
        const newLiveVfxGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        newLiveVfxGroup.setAttribute("id", "vfx-live-container");
        newLiveVfxGroup.style.pointerEvents = 'none';
        activeLiveVfx.forEach(child => newLiveVfxGroup.appendChild(child));
        this.svgElement.appendChild(newLiveVfxGroup);

        // 9. Capa Interactiva (Clicks y Ghost Hover)
        this.renderInteractiveLayer(nodes, stoneRadius);

        // 10. Overlay de Apuntado de Habilidades
        SVGGhostPreview.renderTargetingOverlay(this.svgElement, this.board, this.state.currentPlayer, stoneRadius);

        // 11. Capa de Ojo del Maestro y Proyección Astral (Secuencia 1-2-3)
        this.renderHintAndContinuation(stoneRadius);
    }

    private renderGridLines(nodes: BoardNode[]) {
        const lineColor = "#2a180b";
        const linesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        linesGroup.setAttribute("class", "grid-lines");

        const drawnEdges = new Set<string>();
        for (const node of nodes) {
            for (const neighborId of node.neighbors) {
                const edgeKey = [node.id, neighborId].sort().join('--');
                if (!drawnEdges.has(edgeKey)) {
                    drawnEdges.add(edgeKey);
                    const neighbor = this.board.nodes.get(neighborId);
                    if (neighbor) {
                        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        line.setAttribute("x1", node.x.toString());
                        line.setAttribute("y1", node.y.toString());
                        line.setAttribute("x2", neighbor.x.toString());
                        line.setAttribute("y2", neighbor.y.toString());
                        line.setAttribute("stroke", lineColor);
                        line.setAttribute("stroke-width", "1.9");
                        line.setAttribute("stroke-opacity", "0.92");
                        line.setAttribute("stroke-linecap", "round");
                        linesGroup.appendChild(line);
                    }
                }
            }
        }
        this.svgElement.appendChild(linesGroup);
    }

    private renderBoardBackground(nodes: BoardNode[], padding: number) {
        if (nodes.length < 3) return;

        // 1. Obtener todos los puntos
        const points = nodes.map(n => ({ x: n.x, y: n.y }));

        // 2. Algoritmo de Graham Scan (Convex Hull)
        points.sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y);
        
        const crossProduct = (o: {x:number, y:number}, a: {x:number, y:number}, b: {x:number, y:number}) => {
            return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
        };

        const lower: {x:number, y:number}[] = [];
        for (const p of points) {
            while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
                lower.pop();
            }
            lower.push(p);
        }

        const upper: {x:number, y:number}[] = [];
        for (let i = points.length - 1; i >= 0; i--) {
            const p = points[i];
            while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
                upper.pop();
            }
            upper.push(p);
        }

        upper.pop();
        lower.pop();
        const hull = lower.concat(upper);

        if (hull.length < 3) return;

        // 3. Crear el Polígono SVG (Usando borde grueso para expandir perfectamente simétrico)
        const bgGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        bgGroup.setAttribute("class", "board-dynamic-background");

        const polyPoints = hull.map(p => `${p.x},${p.y}`).join(" ");

        // Capa 1: Sombra y Borde exterior (Stroke más grueso)
        const woodOutline = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        woodOutline.setAttribute("points", polyPoints);
        woodOutline.setAttribute("fill", "url(#wood-texture)");
        woodOutline.setAttribute("stroke", "#cca162");
        woodOutline.setAttribute("stroke-width", (padding * 2 + 6).toString());
        woodOutline.setAttribute("stroke-linejoin", "round");
        woodOutline.setAttribute("filter", "url(#board-shadow)");

        // Capa 2: Madera pura (Stroke exacto, cubre el borde interior y crea el padding perfecto)
        const woodBase = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        woodBase.setAttribute("points", polyPoints);
        woodBase.setAttribute("fill", "url(#wood-texture)");
        woodBase.setAttribute("stroke", "url(#wood-texture)");
        woodBase.setAttribute("stroke-width", (padding * 2).toString());
        woodBase.setAttribute("stroke-linejoin", "round");

        bgGroup.appendChild(woodOutline);
        bgGroup.appendChild(woodBase);

        this.svgElement.appendChild(bgGroup);
    }

    private renderStarPoints(nodes: BoardNode[], stoneRadius: number) {
        const hoshiGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        hoshiGroup.setAttribute("class", "hoshi-points");
        for (const node of nodes) {
            if (node.isStarPoint) {
                const star = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                star.setAttribute("cx", node.x.toString());
                star.setAttribute("cy", node.y.toString());
                star.setAttribute("r", (stoneRadius * 0.22).toString());
                star.setAttribute("fill", "#221308");
                hoshiGroup.appendChild(star);
            }
        }
        this.svgElement.appendChild(hoshiGroup);
    }



    private renderTerritoryOverlay(stoneRadius: number) {
        if (!this.state.isGameOver || !this.state.scoreReport) return;

        const territoryGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        territoryGroup.setAttribute("class", "territory-overlay");

        const assignments = this.state.scoreReport.territoryMap;
        const deadStones = this.state.scoreReport.deadStones;

        for (const [nId, owner] of assignments.entries()) {
            const targetNode = this.board.nodes.get(nId);
            if (targetNode && (!targetNode.stone || deadStones?.has(nId))) {
                const rectSize = stoneRadius * 0.75;
                const terrSquare = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                terrSquare.setAttribute("x", (targetNode.x - rectSize / 2).toString());
                terrSquare.setAttribute("y", (targetNode.y - rectSize / 2).toString());
                terrSquare.setAttribute("width", rectSize.toString());
                terrSquare.setAttribute("height", rectSize.toString());
                terrSquare.setAttribute("rx", "3");

                if (owner === 1) {
                    terrSquare.setAttribute("fill", "#000000");
                    terrSquare.setAttribute("stroke", "#3b82f6");
                    terrSquare.setAttribute("stroke-width", "1.5");
                } else if (owner === 2) {
                    terrSquare.setAttribute("fill", "#ffffff");
                    terrSquare.setAttribute("stroke", "#f59e0b");
                    terrSquare.setAttribute("stroke-width", "1.5");
                } else if (owner === 3) {
                    terrSquare.setAttribute("fill", "#10b981");
                    terrSquare.setAttribute("stroke", "#34d399");
                    terrSquare.setAttribute("stroke-width", "1.5");
                } else if (owner === 4) {
                    terrSquare.setAttribute("fill", "#8b5cf6");
                    terrSquare.setAttribute("stroke", "#a78bfa");
                    terrSquare.setAttribute("stroke-width", "1.5");
                }
                territoryGroup.appendChild(terrSquare);
            }
        }
        this.svgElement.appendChild(territoryGroup);
    }

    /**
     * Renderiza los nodos en Seki (vida mutua) con un marcador triangular neutro.
     * Bajo reglas japonesas, las intersecciones de Seki no puntúan para nadie.
     * Se renderizan con un triángulo gris translúcido para distinguirlos del dame
     * y del territorio normal.
     */
    private renderSekiOverlay(stoneRadius: number) {
        if (!this.state.isGameOver || !this.state.scoreReport) return;
        const sekiMap = this.state.scoreReport.sekiMap;
        if (!sekiMap || sekiMap.size === 0) return;

        const sekiGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        sekiGroup.setAttribute("class", "seki-overlay");

        for (const nodeId of sekiMap) {
            const node = this.board.nodes.get(nodeId);
            if (!node) continue;

            // Triángulo equilátero centrado en el nodo
            const r = stoneRadius * 0.65;
            const h = r * Math.sqrt(3) / 2;
            const points = [
                `${node.x},${node.y - r}`,
                `${node.x - h},${node.y + r / 2}`,
                `${node.x + h},${node.y + r / 2}`
            ].join(' ');

            const triangle = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            triangle.setAttribute("points", points);
            triangle.setAttribute("fill", "rgba(180,140,255,0.30)");
            triangle.setAttribute("stroke", "#9d6ff0");
            triangle.setAttribute("stroke-width", "1.5");
            triangle.style.pointerEvents = 'none';
            sekiGroup.appendChild(triangle);

            // Letra "S" pequeña en el centro
            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", node.x.toString());
            label.setAttribute("y", (node.y + r * 0.18).toString());
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("dominant-baseline", "middle");
            label.setAttribute("font-size", (stoneRadius * 0.55).toString());
            label.setAttribute("font-weight", "bold");
            label.setAttribute("fill", "#7c3aed");
            label.setAttribute("font-family", "sans-serif");
            label.style.pointerEvents = 'none';
            label.textContent = "S";
            sekiGroup.appendChild(label);
        }

        this.svgElement.appendChild(sekiGroup);
    }

    private renderCaptives(stoneRadius: number) {
        if (!this.state.captives || this.state.captives.length === 0) return;

        const captivesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        captivesGroup.setAttribute("class", "captives-layer");

        for (const captive of this.state.captives) {
            if (captive.isCaptured) continue;

            const entityNodeIds = captive.nodeIds && captive.nodeIds.length > 0
                ? captive.nodeIds
                : [captive.nodeId];
            
            const nodes = entityNodeIds.map(id => this.board.nodes.get(id)).filter(n => !!n);
            if (nodes.length === 0) continue;

            const cg = document.createElementNS("http://www.w3.org/2000/svg", "g");
            cg.setAttribute("class", "captive-entity-group");

            const avgX = nodes.reduce((sum, n) => sum + n!.x, 0) / nodes.length;
            const avgY = nodes.reduce((sum, n) => sum + n!.y, 0) / nodes.length;

            if (nodes.length > 1) {
                // Entidad Multi-Casilla (ej: Monolito 2x1)
                for (const node of nodes) {
                    const cellBase = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    cellBase.setAttribute("cx", node!.x.toString());
                    cellBase.setAttribute("cy", node!.y.toString());
                    cellBase.setAttribute("r", (stoneRadius * 0.95).toString());
                    cellBase.setAttribute("fill", "#1e293b");
                    cellBase.setAttribute("stroke", "#fbbf24");
                    cellBase.setAttribute("stroke-width", "2");
                    cg.appendChild(cellBase);

                    const cellRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    cellRing.setAttribute("cx", node!.x.toString());
                    cellRing.setAttribute("cy", node!.y.toString());
                    cellRing.setAttribute("r", (stoneRadius * 1.25).toString());
                    cellRing.setAttribute("fill", "rgba(245, 158, 11, 0.12)");
                    cellRing.setAttribute("stroke", "#f59e0b");
                    cellRing.setAttribute("stroke-width", "2");
                    cellRing.setAttribute("stroke-dasharray", "4 2");
                    cellRing.setAttribute("class", "captive-entity-ring");
                    cg.appendChild(cellRing);
                }

                // Icono Central Destacado
                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute("x", avgX.toString());
                text.setAttribute("y", (avgY + stoneRadius * 0.42).toString());
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("font-size", (stoneRadius * 1.5).toString());
                text.textContent = captive.icon;
                cg.appendChild(text);
            } else {
                // Entidad de 1 Casilla Estándar
                const node = nodes[0]!;

                const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                ring.setAttribute("cx", node.x.toString());
                ring.setAttribute("cy", node.y.toString());
                ring.setAttribute("r", (stoneRadius * 1.25).toString());
                ring.setAttribute("fill", "rgba(245, 158, 11, 0.15)");
                ring.setAttribute("stroke", "#f59e0b");
                ring.setAttribute("stroke-width", "2");
                ring.setAttribute("stroke-dasharray", "4 2");
                ring.setAttribute("class", "captive-entity-ring");

                const base = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                base.setAttribute("cx", node.x.toString());
                base.setAttribute("cy", node.y.toString());
                base.setAttribute("r", (stoneRadius * 0.9).toString());
                base.setAttribute("fill", "#1e293b");
                base.setAttribute("stroke", "#fbbf24");
                base.setAttribute("stroke-width", "1.5");

                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute("x", node.x.toString());
                text.setAttribute("y", (node.y + stoneRadius * 0.38).toString());
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("font-size", (stoneRadius * 1.15).toString());
                text.textContent = captive.icon;

                cg.appendChild(ring);
                cg.appendChild(base);
                cg.appendChild(text);
            }

            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = `${captive.name}: ${captive.description} (¡Rodéalo con tus piedras para capturarlo!)`;
            cg.appendChild(title);

            captivesGroup.appendChild(cg);
        }

        this.svgElement.appendChild(captivesGroup);
    }

    /**
     * Dispara la animación cinematográfica de ruptura y colapso de todas las piedras del tablero
     */
    public triggerBoardShatterAnimation(): Promise<void> {
        return new Promise((resolve) => {
            const stoneElements = this.svgElement.querySelectorAll('.stone');
            const boardContainer = document.getElementById('board-container');
            if (boardContainer) {
                boardContainer.classList.add('vfx-screen-shake');
                setTimeout(() => boardContainer.classList.remove('vfx-screen-shake'), 600);
            }

            // Onda de choque en el centro del SVG
            const shockwave = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            const bbox = this.svgElement.getBBox();
            shockwave.setAttribute("cx", (bbox.x + bbox.width / 2).toString());
            shockwave.setAttribute("cy", (bbox.y + bbox.height / 2).toString());
            shockwave.setAttribute("class", "vfx-board-collapse-wave");
            this.svgElement.appendChild(shockwave);

            SoundFX.playCapture();

            stoneElements.forEach((el, index) => {
                const htmlEl = el as HTMLElement;
                htmlEl.classList.add('vfx-stone-shatter');
                htmlEl.style.animationDelay = `${(index % 6) * 40}ms`;
            });

            setTimeout(() => {
                shockwave.remove();
                // Limpiar todas las piedras del tablero lógico
                for (const node of this.board.nodes.values()) {
                    node.stone = null;
                }
                this.state.historyStack = [];
                this.state.boardHistory = [];
                this.render();
                this.onUIUpdate();
                resolve();
            }, 850);
        });
    }

    private renderStones(nodes: BoardNode[], stoneRadius: number) {
        const stonesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        stonesGroup.setAttribute("class", "stones-layer");

        // 1. Renderizar bases unificadas de Poliminós (Cápsulas de Dominó 2x1 y Losas de Monolito 2x2)
        this.renderPolyominoBases(stonesGroup, nodes, stoneRadius);

        for (const node of nodes) {
            if (node.stone) {
                const stoneG = document.createElementNS("http://www.w3.org/2000/svg", "g");
                stoneG.setAttribute("class", `stone stone-${node.stone.playerId}`);
                stoneG.style.pointerEvents = 'none';

                const stoneVisual = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                stoneVisual.setAttribute("cx", node.x.toString());
                stoneVisual.setAttribute("cy", node.y.toString());
                stoneVisual.setAttribute("r", stoneRadius.toString());
                
                const pid = node.stone.playerId;
                const isDeadStone = this.state.isGameOver && !!this.state.scoreReport?.deadStones?.has(node.id);

                if (isDeadStone) {
                    stoneG.setAttribute("class", `stone stone-${pid} stone-dead-captured`);
                }

                if (pid === 1) {
                    stoneVisual.setAttribute("fill", "url(#black-stone-grad)");
                } else if (pid === 2) {
                    stoneVisual.setAttribute("fill", "url(#white-stone-grad)");
                    stoneVisual.setAttribute("stroke", "#b0a99c");
                    stoneVisual.setAttribute("stroke-width", "0.75");
                } else if (pid === 3) {
                    stoneVisual.setAttribute("fill", "url(#green-stone-grad)");
                    stoneVisual.setAttribute("stroke", "#047857");
                    stoneVisual.setAttribute("stroke-width", "0.75");
                } else if (pid === 4) {
                    stoneVisual.setAttribute("fill", "url(#purple-stone-grad)");
                    stoneVisual.setAttribute("stroke", "#6d28d9");
                    stoneVisual.setAttribute("stroke-width", "0.75");
                }
                stoneVisual.setAttribute("filter", "url(#stone-shadow)");
                stoneG.appendChild(stoneVisual);

                // Emblema de Piedra Germinante (🌿)
                if (node.stone.stoneType === 'sprouting') {
                    const sproutIcon = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    sproutIcon.setAttribute("x", node.x.toString());
                    sproutIcon.setAttribute("y", (node.y + stoneRadius * 0.32).toString());
                    sproutIcon.setAttribute("text-anchor", "middle");
                    sproutIcon.setAttribute("font-size", (stoneRadius * 0.72).toString());
                    sproutIcon.setAttribute("fill", "#10b981");
                    sproutIcon.textContent = "🌿";
                    stoneG.appendChild(sproutIcon);
                }

                // Indicador visual de piedra muerta capturada al final de la partida
                if (isDeadStone) {
                    const deadCross = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    deadCross.setAttribute("class", "dead-stone-cross");
                    deadCross.setAttribute("x", node.x.toString());
                    deadCross.setAttribute("y", (node.y + stoneRadius * 0.36).toString());
                    deadCross.setAttribute("text-anchor", "middle");
                    deadCross.setAttribute("font-size", (stoneRadius * 1.15).toString());
                    deadCross.setAttribute("font-weight", "900");
                    deadCross.setAttribute("fill", "#ef4444");
                    deadCross.setAttribute("stroke", "#000000");
                    deadCross.setAttribute("stroke-width", "0.6");
                    deadCross.textContent = "✕";
                    stoneG.appendChild(deadCross);
                }

                // Marcador de Última Jugada: pequeño círculo contrastante visible en todos los modos
                if (node.id === this.state.lastMoveNodeId) {
                    const markerColor = pid === 1 ? '#ffffff' : '#1a1a1a';
                    const lastMoveMarker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    lastMoveMarker.setAttribute("cx", node.x.toString());
                    lastMoveMarker.setAttribute("cy", node.y.toString());
                    lastMoveMarker.setAttribute("r", (stoneRadius * 0.32).toString());
                    lastMoveMarker.setAttribute("fill", markerColor);
                    lastMoveMarker.setAttribute("opacity", "0.88");
                    lastMoveMarker.setAttribute("class", "last-move-marker");
                    lastMoveMarker.style.pointerEvents = 'none';
                    stoneG.appendChild(lastMoveMarker);
                }

                if (node.stone.isIndestructible) {
                    // 1. Resplandor radial de fondo pulsante
                    const sacredGlowBg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    sacredGlowBg.setAttribute("cx", node.x.toString());
                    sacredGlowBg.setAttribute("cy", node.y.toString());
                    sacredGlowBg.setAttribute("r", (stoneRadius * 1.55).toString());
                    sacredGlowBg.setAttribute("fill", "url(#sacred-radial-glow)");
                    sacredGlowBg.setAttribute("class", "vfx-sacred-aura-pulse");
                    sacredGlowBg.style.pointerEvents = 'none';
                    stoneG.appendChild(sacredGlowBg);

                    // 2. Anillo de energía divina dorada con rayos giratorios
                    const sacredRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    sacredRing.setAttribute("cx", node.x.toString());
                    sacredRing.setAttribute("cy", node.y.toString());
                    sacredRing.setAttribute("r", (stoneRadius * 1.28).toString());
                    sacredRing.setAttribute("fill", "none");
                    sacredRing.setAttribute("stroke", "#f59e0b");
                    sacredRing.setAttribute("stroke-width", "2.6");
                    sacredRing.setAttribute("stroke-dasharray", "4,3");
                    sacredRing.setAttribute("filter", "url(#sacred-glow)");
                    sacredRing.setAttribute("class", "vfx-sacred-ring-spin");
                    stoneG.appendChild(sacredRing);

                    // 3. Anillo perimetral dorado fino resplandeciente
                    const sacredOuterRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    sacredOuterRing.setAttribute("cx", node.x.toString());
                    sacredOuterRing.setAttribute("cy", node.y.toString());
                    sacredOuterRing.setAttribute("r", (stoneRadius * 1.12).toString());
                    sacredOuterRing.setAttribute("fill", "none");
                    sacredOuterRing.setAttribute("stroke", "#fef08a");
                    sacredOuterRing.setAttribute("stroke-width", "1.6");
                    stoneG.appendChild(sacredOuterRing);
                }

                stonesGroup.appendChild(stoneG);
            }
        }
        this.svgElement.appendChild(stonesGroup);
    }

    private renderPolyominoBases(stonesGroup: SVGGElement, nodes: BoardNode[], stoneRadius: number) {
        const polyNodes = nodes.filter(n => n.stone && n.stone.stoneType && n.stone.stoneType !== 'single');
        if (polyNodes.length === 0) return;

        const groups = new Map<string, BoardNode[]>();
        const visited = new Set<string>();

        // Primero agrupar por polyGroupId explícito
        for (const n of polyNodes) {
            if (n.stone?.polyGroupId) {
                const gid = n.stone.polyGroupId;
                if (!groups.has(gid)) groups.set(gid, []);
                groups.get(gid)!.push(n);
                visited.add(n.id);
            }
        }

        // Para piedras sin polyGroupId (compatibilidad), agrupar por adyacencia
        for (const n of polyNodes) {
            if (visited.has(n.id)) continue;
            const type = n.stone!.stoneType;
            const pid = n.stone!.playerId;
            const groupNodes: BoardNode[] = [];
            const queue = [n];
            visited.add(n.id);

            while (queue.length > 0) {
                const curr = queue.shift()!;
                groupNodes.push(curr);
                for (const neighborId of curr.neighbors) {
                    if (!visited.has(neighborId)) {
                        const neighbor = this.board.nodes.get(neighborId);
                        if (neighbor && neighbor.stone && neighbor.stone.stoneType === type && neighbor.stone.playerId === pid) {
                            visited.add(neighborId);
                            queue.push(neighbor);
                        }
                    }
                }
            }
            if (groupNodes.length > 1) {
                groups.set(`auto_${n.id}`, groupNodes);
            }
        }

        // Renderizar bases unificadas
        for (const [_, gNodes] of groups) {
            const firstStone = gNodes[0].stone!;
            const pid = firstStone.playerId;
            const type = firstStone.stoneType;
            const strokeColor = type === 'domino' ? '#38bdf8' : (type === 'monolith' ? '#f59e0b' : '#10b981');
            const gradFill = pid === 1 ? 'url(#black-stone-grad)' : (pid === 2 ? 'url(#white-stone-grad)' : (pid === 3 ? 'url(#green-stone-grad)' : 'url(#purple-stone-grad)'));

            if (type === 'domino' && gNodes.length === 2) {
                const [nA, nB] = gNodes;
                const dominoPill = document.createElementNS("http://www.w3.org/2000/svg", "line");
                dominoPill.setAttribute("x1", nA.x.toString());
                dominoPill.setAttribute("y1", nA.y.toString());
                dominoPill.setAttribute("x2", nB.x.toString());
                dominoPill.setAttribute("y2", nB.y.toString());
                dominoPill.setAttribute("stroke", gradFill);
                dominoPill.setAttribute("stroke-width", (stoneRadius * 2.0).toString());
                dominoPill.setAttribute("stroke-linecap", "round");
                dominoPill.setAttribute("filter", "url(#stone-shadow)");
                stonesGroup.appendChild(dominoPill);

                const dominoOutline = document.createElementNS("http://www.w3.org/2000/svg", "line");
                dominoOutline.setAttribute("x1", nA.x.toString());
                dominoOutline.setAttribute("y1", nA.y.toString());
                dominoOutline.setAttribute("x2", nB.x.toString());
                dominoOutline.setAttribute("y2", nB.y.toString());
                dominoOutline.setAttribute("stroke", strokeColor);
                dominoOutline.setAttribute("stroke-width", (stoneRadius * 2.04).toString());
                dominoOutline.setAttribute("stroke-linecap", "round");
                dominoOutline.setAttribute("opacity", "0.45");
                dominoOutline.style.pointerEvents = 'none';
                stonesGroup.appendChild(dominoOutline);

                // Conector central de runa 🀄
                const midX = (nA.x + nB.x) / 2;
                const midY = (nA.y + nB.y) / 2;
                const bridgeIcon = document.createElementNS("http://www.w3.org/2000/svg", "text");
                bridgeIcon.setAttribute("x", midX.toString());
                bridgeIcon.setAttribute("y", (midY + stoneRadius * 0.32).toString());
                bridgeIcon.setAttribute("text-anchor", "middle");
                bridgeIcon.setAttribute("font-size", (stoneRadius * 0.72).toString());
                bridgeIcon.setAttribute("fill", strokeColor);
                bridgeIcon.setAttribute("opacity", "0.9");
                bridgeIcon.textContent = "🀄";
                bridgeIcon.style.pointerEvents = 'none';
                stonesGroup.appendChild(bridgeIcon);
            } else if (type === 'monolith' && gNodes.length >= 3) {
                const points = gNodes.map(n => ({ x: n.x, y: n.y }));
                const avgX = points.reduce((acc, p) => acc + p.x, 0) / points.length;
                const avgY = points.reduce((acc, p) => acc + p.y, 0) / points.length;

                points.sort((a, b) => Math.atan2(a.y - avgY, a.x - avgX) - Math.atan2(b.y - avgY, b.x - avgX));
                const polyStr = points.map(p => `${p.x},${p.y}`).join(" ");

                const slab = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                slab.setAttribute("points", polyStr);
                slab.setAttribute("fill", gradFill);
                slab.setAttribute("stroke", strokeColor);
                slab.setAttribute("stroke-width", (stoneRadius * 1.85).toString());
                slab.setAttribute("stroke-linejoin", "round");
                slab.setAttribute("filter", "url(#stone-shadow)");
                stonesGroup.appendChild(slab);

                const monolithIcon = document.createElementNS("http://www.w3.org/2000/svg", "text");
                monolithIcon.setAttribute("x", avgX.toString());
                monolithIcon.setAttribute("y", (avgY + stoneRadius * 0.38).toString());
                monolithIcon.setAttribute("text-anchor", "middle");
                monolithIcon.setAttribute("font-size", (stoneRadius * 0.9).toString());
                monolithIcon.setAttribute("fill", strokeColor);
                monolithIcon.setAttribute("opacity", "0.92");
                monolithIcon.textContent = "🧱";
                monolithIcon.style.pointerEvents = 'none';
                stonesGroup.appendChild(monolithIcon);
            }
        }
    }

    private renderInteractiveLayer(nodes: BoardNode[], stoneRadius: number) {
        // 0. Renderizar insignias y conteo numérico de libertades del Tutorial (ej. 1, 2, 3, 4)
        if (TutorialManager.isActive) {
            const annotations = TutorialManager.getCurrentAnnotations();
            if (annotations && annotations.length > 0) {
                const annotGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                annotGroup.setAttribute("class", "tutorial-annotations-layer");
                annotGroup.style.pointerEvents = 'none'; // No bloquear clics
                for (const ann of annotations) {
                    const targetNode = this.board.nodes.get(ann.nodeId);
                    if (targetNode) {
                        const annG = document.createElementNS("http://www.w3.org/2000/svg", "g");
                        annG.setAttribute("class", "tutorial-annotation-badge");
                        annG.style.pointerEvents = 'none';
                        
                        const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        bgCircle.setAttribute("cx", targetNode.x.toString());
                        bgCircle.setAttribute("cy", targetNode.y.toString());
                        bgCircle.setAttribute("r", (stoneRadius * 0.75).toString());
                        bgCircle.setAttribute("fill", ann.color || "#38bdf8");
                        bgCircle.setAttribute("stroke", "#ffffff");
                        bgCircle.setAttribute("stroke-width", "2.5");
                        bgCircle.setAttribute("filter", "drop-shadow(0 2px 5px rgba(0,0,0,0.5))");
                        
                        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                        text.setAttribute("x", targetNode.x.toString());
                        text.setAttribute("y", targetNode.y.toString());
                        text.setAttribute("text-anchor", "middle");
                        text.setAttribute("dominant-baseline", "central");
                        text.setAttribute("font-size", `${Math.round(stoneRadius * 0.82)}px`);
                        text.setAttribute("font-weight", "900");
                        text.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
                        text.setAttribute("fill", "#0f172a");
                        text.textContent = ann.label;

                        annG.appendChild(bgCircle);
                        annG.appendChild(text);
                        annotGroup.appendChild(annG);
                    }
                }
                this.svgElement.appendChild(annotGroup);
            }
        }

        const interactiveGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        interactiveGroup.setAttribute("class", "interactive-layer");

        for (const node of nodes) {
            const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            hitArea.setAttribute("cx", node.x.toString());
            hitArea.setAttribute("cy", node.y.toString());
            hitArea.setAttribute("r", (stoneRadius * 1.15).toString());
            hitArea.setAttribute("fill", "transparent");

            // Resaltado del Tutorial
            if (TutorialManager.isActive) {
                const expected = TutorialManager.getExpectedAction();
                if (expected && expected.type === 'place_stone' && expected.nodeId === node.id) {
                    hitArea.setAttribute("class", "node-tutorial-target");
                }
            }

            const isTargeting = ChampionManager.currentTargetingMode !== 'none';
            const isPolyActive = PolyominoManager.activePolyomino !== null;
            hitArea.style.cursor = (isTargeting || isPolyActive || (!node.stone && this.isInteractive && !this.state.isGameOver)) ? 'pointer' : 'default';

            hitArea.addEventListener('mouseenter', () => {
                const isEn = getLanguage() === 'en';
                this.lastHoveredNode = node;
                if (node.stone) {
                    if (node.stone.stoneType === 'sprouting') {
                        HUDController.showAlert(isEn
                            ? "🌿 Sprouting Stone (1x1): Sprouts a new allied stone in an adjacent free space in 2 turns."
                            : "🌿 Piedra Germinante (1x1): Brota una nueva piedra aliada en una casilla adyacente tras 2 turnos.",
                            3200
                        );
                    } else if (node.stone.stoneType === 'domino') {
                        HUDController.showAlert(isEn
                            ? "🀄 Duplicity Tile (2x1): Indivisible twin stone block. Shares liberties and destiny."
                            : "🀄 Ficha Duplicidad (2x1): Bloque indivisible de 2 piedras gemelas. Comparten libertades y destino.",
                            3200
                        );
                    } else if (node.stone.stoneType === 'monolith') {
                        HUDController.showAlert(isEn
                            ? "🧱 Monolith Tile (2x2): Colossal 4-stone titan block in reinforced square formation."
                            : "🧱 Ficha Monolito (2x2): Bloque titánico de 4 piedras unidas en formación cuadrada reforzada.",
                            3200
                        );
                    } else if (node.stone.isIndestructible) {
                        HUDController.showAlert(isEn
                            ? "🛡️ Divine Shield: Immune to capture and ability damage."
                            : "🛡️ Escudo Divino: Inmune a capturas y daño de habilidades.",
                            3200
                        );
                    }
                }
                const isTargeting = ChampionManager.currentTargetingMode !== 'none';
                if ((!this.isInteractive && !isTargeting) || this.state.isGameOver) return;
                SVGGhostPreview.renderGhost(this.svgElement, this.board, this.state, node, stoneRadius);
            });

            hitArea.addEventListener('mouseleave', () => {
                if (this.lastHoveredNode === node) {
                    this.lastHoveredNode = null;
                }
                SVGGhostPreview.clearGhost(this.svgElement);
            });

            hitArea.addEventListener('click', () => {
                const isTargeting = ChampionManager.currentTargetingMode !== 'none';
                if ((!this.isInteractive && !isTargeting) || this.state.isGameOver) return;
                this.handleNodeClick(node.id, true);
            });

            interactiveGroup.appendChild(hitArea);
        }
        this.svgElement.appendChild(interactiveGroup);
    }

    public refreshCurrentHoverGhost() {
        const isTargeting = ChampionManager.currentTargetingMode !== 'none';
        if (this.lastHoveredNode && (this.isInteractive || isTargeting) && !this.state.isGameOver) {
            SVGGhostPreview.renderGhost(this.svgElement, this.board, this.state, this.lastHoveredNode, this.currentStoneRadius);
        }
    }

    public triggerPlacementRipple(x: number, y: number, radius: number) {
        const ripple = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ripple.setAttribute("cx", x.toString());
        ripple.setAttribute("cy", y.toString());
        ripple.setAttribute("r", radius.toString());
        ripple.setAttribute("class", "vfx-ripple");
        this.svgElement.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    public triggerCaptureDissolve(x: number, y: number, radius: number) {
        const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        halo.setAttribute("cx", x.toString());
        halo.setAttribute("cy", y.toString());
        halo.setAttribute("r", radius.toString());
        halo.setAttribute("class", "vfx-capture-dissolve");
        this.svgElement.appendChild(halo);

        setTimeout(() => {
            halo.remove();
        }, 500);
    }

    public triggerErrorCross(x: number, y: number, radius: number = 18) {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("class", "vfx-error-cross");

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x.toString());
        circle.setAttribute("cy", y.toString());
        circle.setAttribute("r", (radius * 1.25).toString());
        circle.setAttribute("class", "vfx-error-circle");

        const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line1.setAttribute("x1", (x - radius * 0.65).toString());
        line1.setAttribute("y1", (y - radius * 0.65).toString());
        line1.setAttribute("x2", (x + radius * 0.65).toString());
        line1.setAttribute("y2", (y + radius * 0.65).toString());
        line1.setAttribute("class", "vfx-error-line");

        const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line2.setAttribute("x1", (x + radius * 0.65).toString());
        line2.setAttribute("y1", (y - radius * 0.65).toString());
        line2.setAttribute("x2", (x - radius * 0.65).toString());
        line2.setAttribute("y2", (y + radius * 0.65).toString());
        line2.setAttribute("class", "vfx-error-line");

        group.appendChild(circle);
        group.appendChild(line1);
        group.appendChild(line2);
        this.svgElement.appendChild(group);

        setTimeout(() => {
            group.remove();
        }, 700);
    }

    public handleNodeClick(nodeId: string, isLocal: boolean = false) {
        // -1. Si estamos en modo Tutorial, validar estrictamente la acción esperada antes de procesar
        if (TutorialManager.isActive) {
            if (!TutorialManager.validateNodeClick(nodeId)) {
                const targetNode = this.board.nodes.get(nodeId);
                if (targetNode) {
                    this.triggerErrorCross(targetNode.x, targetNode.y, this.currentStoneRadius);
                }
                SoundFX.playIllegal();
                return; // Bloqueo total
            }
        }

        // 0. Si el Pincel del Modo Sandbox / Troubleshooter está activo
        if (SandboxController.isBrushActive) {
            SandboxController.applyBrush(
                nodeId,
                this.board,
                this.state,
                () => {
                    this.render();
                    this.onUIUpdate();
                },
                (msg) => HUDController.showAlert(msg)
            );
            return;
        }

        const isTargeting = ChampionManager.currentTargetingMode !== 'none';
        if (!this.isInteractive && !isTargeting && isLocal) return;
        if (this.state.isGameOver) return;

        // BLOQUEO ABSOLUTO DE TURNO LOCAL: Si es un clic local y no estamos en modo apuntar habilidad,
        // comprobar estrictamente si el jugador tiene permitido jugar su turno (evita clics prematuros/IA)
        if (isLocal && !isTargeting) {
            if (this.isTurnAllowedCallback && !this.isTurnAllowedCallback()) {
                return;
            }
        }

        // 1. Si estamos en modo selección de objetivo para una Habilidad Activa o Pasiva de Campeón
        if (isTargeting) {
            const targetingPid = ChampionManager.targetingPlayerId || this.state.currentPlayer;
            const wasPassiveTargeting = (ChampionManager.currentTargetingMode === 'dragon_burn_2');

            ChampionManager.executeTargetedSkill(
                this.board,
                this.state,
                nodeId,
                targetingPid,
                this.svgElement,
                (msg) => {
                    HUDController.showAlert(msg);
                    // Note: do NOT play SoundFX here - burn VFX handles its own audio
                },
                (msg) => this.onIllegalMove(msg),
                () => {
                    this.render();
                    this.onUIUpdate();
                    if (ChampionManager.currentTargetingMode === 'none') {
                        // Habilidad completada: deshabilitar clics inmediatamente para que el jugador
                        // no pueda colocar una piedra extra antes de que la IA tome su turno.
                        this.isInteractive = false;
                        if (this.onSkillPlaced && !wasPassiveTargeting) {
                            this.onSkillPlaced(ChampionManager.currentHero || 'tengu', nodeId);
                        }
                        if (TutorialManager.isActive) {
                            TutorialManager.advanceStep();
                        } else if (wasPassiveTargeting && this.onPassiveBurnCompleted) {
                            // Furia del Dragón completada: avanzar turno sin re-ejecutar efectos locales
                            this.onPassiveBurnCompleted();
                        } else if (this.onMovePlaced) {
                            this.onMovePlaced(nodeId, isLocal);
                        }
                        // Tras el callback de turno, re-evaluar si el jugador actual puede jugar
                        // (necesario en modo 1v1 donde no hay IA que reactive el tablero)
                        if (!this.state.isGameOver && this.isTurnAllowedCallback && this.isTurnAllowedCallback()) {
                            this.isInteractive = true;
                        }
                    } else if (wasPassiveTargeting) {
                        // Quema intermedia (aún quedan quemas): mantener modo targeting,
                        // NO permitir colocación libre de piedras (previene bug de ficha del color rival)
                        this.isInteractive = false; // Permite targetear gracias a isTargeting=true sin dar libertad total
                    }
                }
            );
            return;
        }

        // Determinar el color exacto a colocar:
        // Si es un clic local, forzar siempre el color asignado al jugador humano
        const placingPlayer: import('../core/GraphBoard').PlayerId = (isLocal && this.getLocalPlayerColorCallback)
            ? this.getLocalPlayerColorCallback()
            : this.state.currentPlayer;

        const targetNode = this.board.nodes.get(nodeId);

        // 2. Si estamos en modo colocación de Ficha Poliminó (🌿 Germinante, 🀄 Dominó, 🧱 Monolito)
        if (PolyominoManager.activePolyomino !== null) {
            this.state.recordSnapshot(this.board);
            const success = PolyominoManager.placePolyomino(
                this.board,
                this.state,
                nodeId,
                placingPlayer,
                (msg) => HUDController.showAlert(msg),
                (msg) => this.onIllegalMove(msg)
            );

            if (success) {
                const brokenShields = this.state.advanceTurn(this.board);
                const uniqueBroken = Array.from(new Set(brokenShields));
                
                setTimeout(() => {
                    uniqueBroken.forEach(nodeId => {
                        const node = this.board.nodes.get(nodeId);
                        if (node) VFXManager.triggerDivineShieldShatter({ x: node.x, y: node.y }, this.svgElement);
                    });
                }, 50);
                
                // Procesar brotaciones de Piedras Germinantes
                PolyominoManager.processSproutingStones(this.board, this.state, placingPlayer, (sproutNodeId) => {
                    const sproutNode = this.board.nodes.get(sproutNodeId);
                    if (sproutNode) {
                        this.triggerPlacementRipple(sproutNode.x, sproutNode.y, 18);
                    }
                    const isEn = getLanguage() === 'en';
                    HUDController.showAlert(isEn ? "🌿 A Sprouting Stone has grown a new allied stone!" : "🌿 ¡Una Piedra Germinante ha brotado una nueva piedra aliada!");
                });

                this.render();
                this.onUIUpdate();

                if (targetNode) {
                    this.triggerPlacementRipple(targetNode.x, targetNode.y, 22);
                }

                ChampionManager.checkPassiveTriggers(
                    this.board,
                    this.state,
                    placingPlayer,
                    this.svgElement,
                    this.onIllegalMove,
                    () => {
                        this.render();
                        this.onUIUpdate();
                    }
                );

                if (TutorialManager.isActive) {
                    TutorialManager.advanceStep();
                } else if (this.onMovePlaced) {
                    this.onMovePlaced(nodeId, isLocal);
                }
            } else {
                this.state.historyStack.pop();
            }
            return;
        }

        // 3. Colocación Estándar de Piedra Go
        this.state.recordSnapshot(this.board);
        const result = RulesEngine.tryPlaceStone(this.board, this.state, nodeId, placingPlayer);
        
        if (result.success) {
            if (result.capturedCount > 0) {
                SoundFX.playCapture();
            } else {
                SoundFX.playPlaceStone();
            }

            const brokenShields = this.state.advanceTurn(this.board);
            const uniqueBroken = Array.from(new Set(brokenShields));
            
            setTimeout(() => {
                uniqueBroken.forEach(nodeId => {
                    const node = this.board.nodes.get(nodeId);
                    if (node) VFXManager.triggerDivineShieldShatter({ x: node.x, y: node.y }, this.svgElement);
                });
            }, 50);
            if (TutorialManager.isActive || (StoryController && StoryController.isCurrentChapterSolo())) {
                this.state.currentPlayer = 1;
                this.isInteractive = true;
            }

            // Procesar brotaciones de Piedras Germinantes tras avanzar turno
            PolyominoManager.processSproutingStones(this.board, this.state, placingPlayer, (sproutNodeId) => {
                const sproutNode = this.board.nodes.get(sproutNodeId);
                if (sproutNode) {
                    this.triggerPlacementRipple(sproutNode.x, sproutNode.y, 18);
                }
                const isEn = getLanguage() === 'en';
                HUDController.showAlert(isEn ? "🌿 A Sprouting Stone has grown a new allied stone!" : "🌿 ¡Una Piedra Germinante ha brotado una nueva piedra aliada!");
            });

            this.render();
            this.onUIUpdate();

            if (targetNode) {
                const stoneRadius = 18;
                this.triggerPlacementRipple(targetNode.x, targetNode.y, stoneRadius);
            }

            // Comprobar si se dispara alguna pasiva de Campeón
            ChampionManager.checkPassiveTriggers(
                this.board,
                this.state,
                placingPlayer,
                this.svgElement,
                this.onIllegalMove,
                () => {
                    this.render();
                    this.onUIUpdate();
                }
            );

            if (TutorialManager.isActive) {
                TutorialManager.advanceStep();
            } else if (this.onMovePlaced) {
                // Siempre notificamos la jugada original al GameController para que reenvíe online y gestione turnos.
                // Si hay una habilidad en curso (ej. Furia del Dragón), el GameController la detectará
                // mediante ChampionManager.currentTargetingMode !== 'none' y pausará la IA si corresponde.
                this.onMovePlaced(nodeId, isLocal);
            }
        } else {
            // Revertir el snapshot si el movimiento no fue válido
            this.state.historyStack.pop();
            SoundFX.playIllegal();
            const isEn = getLanguage() === 'en';
            let msg = isEn ? "Illegal move" : "Movimiento ilegal";
            if (result.errorReason === 'SUICIDE') {
                msg = isEn ? "Illegal move: Suicide!" : "¡Movimiento ilegal: Suicidio!";
            } else if (result.errorReason === 'KO') {
                msg = isEn ? "🚫 Ko Rule! You cannot immediately repeat the previous board state. Play elsewhere." : "🚫 ¡Regla de Ko! No puedes repetir la misma posición inmediatamente. Juega en otra zona.";
            } else if (result.errorReason === 'OCCUPIED') {
                msg = isEn ? "That intersection is already occupied!" : "¡Esa intersección ya está ocupada!";
            } else if (result.errorReason === 'INVALID_TERRAIN') {
                msg = isEn ? "That node is not accessible!" : "¡Esa casilla no es accesible!";
            }
            this.onIllegalMove(msg);
        }
    }

    public showHint(nodeId: string, continuation?: Array<{ nodeId: string; playerId: import('../core/GraphBoard').PlayerId; step: number }>) {
        this.activeHintNodeId = nodeId;
        this.activeContinuation = continuation || null;
        this.render();
    }

    public clearHint() {
        if (!this.activeHintNodeId && !this.activeContinuation) return;
        this.activeHintNodeId = null;
        this.activeContinuation = null;
        this.render();
    }

    private renderHintAndContinuation(stoneRadius: number) {
        if (!this.activeHintNodeId && (!this.activeContinuation || this.activeContinuation.length === 0)) return;

        const hintGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        hintGroup.setAttribute("class", "hint-layer");
        hintGroup.style.pointerEvents = 'none';

        // 1. Renderizar Proyección Astral de continuación (si existe)
        if (this.activeContinuation && this.activeContinuation.length > 0) {
            for (const item of this.activeContinuation) {
                const node = this.board.nodes.get(item.nodeId);
                if (!node) continue;

                const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
                g.setAttribute("class", "astral-continuation-node");

                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("cx", node.x.toString());
                circle.setAttribute("cy", node.y.toString());
                circle.setAttribute("r", (stoneRadius * 0.92).toString());

                if (item.playerId === 1) {
                    circle.setAttribute("fill", "rgba(15, 23, 42, 0.75)");
                    circle.setAttribute("stroke", "#38bdf8");
                    circle.setAttribute("stroke-width", "2");
                    circle.setAttribute("stroke-dasharray", "3 2");
                } else {
                    circle.setAttribute("fill", "rgba(248, 250, 252, 0.85)");
                    circle.setAttribute("stroke", "#f59e0b");
                    circle.setAttribute("stroke-width", "2");
                    circle.setAttribute("stroke-dasharray", "3 2");
                }
                g.appendChild(circle);

                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute("x", node.x.toString());
                text.setAttribute("y", (node.y + stoneRadius * 0.35).toString());
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("font-size", (stoneRadius * 0.95).toString());
                text.setAttribute("font-weight", "bold");
                text.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
                text.setAttribute("fill", item.playerId === 1 ? "#38bdf8" : "#d97706");
                text.textContent = item.step.toString();
                g.appendChild(text);

                hintGroup.appendChild(g);
            }
        }

        // 2. Renderizar Ojo del Maestro (Halo dorado en la mejor jugada)
        if (this.activeHintNodeId) {
            const node = this.board.nodes.get(this.activeHintNodeId);
            if (node) {
                const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                ring.setAttribute("cx", node.x.toString());
                ring.setAttribute("cy", node.y.toString());
                ring.setAttribute("r", (stoneRadius * 1.25).toString());
                ring.setAttribute("fill", "rgba(251, 191, 36, 0.22)");
                ring.setAttribute("stroke", "#fbbf24");
                ring.setAttribute("stroke-width", "3.2");
                ring.setAttribute("class", "vfx-master-eye-ring");
                hintGroup.appendChild(ring);

                const core = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                core.setAttribute("cx", node.x.toString());
                core.setAttribute("cy", node.y.toString());
                core.setAttribute("r", (stoneRadius * 0.35).toString());
                core.setAttribute("fill", "#fbbf24");
                hintGroup.appendChild(core);
            }
        }

        this.svgElement.appendChild(hintGroup);
    }

    /**
     * Dispara la animación de retorno/desaparición celestial azulada cuando una ficha es rebobinada o deshecha
     */
    public triggerRewindStoneLift(x: number, y: number, playerId: import('../core/GraphBoard').PlayerId = 1) {
        if (!this.svgElement) return;

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "vfx-rewind-lift-container");
        g.style.pointerEvents = "none";

        // 1. Portal de retroceso temporal / halo expansivo azul
        const portal = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        portal.setAttribute("cx", x.toString());
        portal.setAttribute("cy", y.toString());
        portal.setAttribute("r", (this.currentStoneRadius * 1.5).toString());
        portal.setAttribute("class", "vfx-rewind-portal");
        g.appendChild(portal);

        // 2. Ficha etérea que levita, gira y se disuelve en el cielo
        const stone = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        stone.setAttribute("cx", x.toString());
        stone.setAttribute("cy", y.toString());
        stone.setAttribute("r", this.currentStoneRadius.toString());
        stone.setAttribute("class", `vfx-rewind-stone stone-${playerId}`);
        
        if (playerId === 1) {
            stone.setAttribute("fill", "url(#black-stone-grad)");
        } else if (playerId === 2) {
            stone.setAttribute("fill", "url(#white-stone-grad)");
        } else if (playerId === 3) {
            stone.setAttribute("fill", "url(#green-stone-grad)");
        } else {
            stone.setAttribute("fill", "url(#purple-stone-grad)");
        }
        g.appendChild(stone);

        // 3. Destellos / Chispas celestiales en 4 direcciones
        const offsets = [-14, -6, 6, 14];
        for (let i = 0; i < 4; i++) {
            const spark = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            const angle = (i * Math.PI) / 2;
            const dist = this.currentStoneRadius * 0.75;
            const sx = x + Math.cos(angle) * dist;
            const sy = y + Math.sin(angle) * dist;
            spark.setAttribute("cx", sx.toString());
            spark.setAttribute("cy", sy.toString());
            spark.setAttribute("r", "2.8");
            spark.setAttribute("class", "vfx-rewind-spark");
            spark.style.setProperty("--spark-dx", `${offsets[i]}px`);
            g.appendChild(spark);
        }

        const liveContainer = this.svgElement.querySelector('#vfx-live-container') || this.svgElement;
        liveContainer.appendChild(g);

        setTimeout(() => {
            g.remove();
        }, 900);
    }
}
