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

export class SVGRenderer {
    private svgElement: SVGSVGElement;
    private board: GraphBoard;
    private state: GameState;
    private onUIUpdate: () => void;
    private onIllegalMove: (msg: string) => void;
    private onMovePlaced?: (nodeId: string, isLocal: boolean) => void;
    private onSkillPlaced?: (skillType: string, nodeId: string) => void;
    public isInteractive: boolean = true;
    public lastHoveredNode: BoardNode | null = null;
    public currentStoneRadius: number = 18;

    constructor(
        svgElementId: string, 
        board: GraphBoard, 
        state: GameState, 
        onUIUpdate: () => void,
        onIllegalMove: (msg: string) => void,
        onMovePlaced?: (nodeId: string, isLocal: boolean) => void,
        onSkillPlaced?: (skillType: string, nodeId: string) => void
    ) {
        this.svgElement = document.getElementById(svgElementId) as unknown as SVGSVGElement;
        this.board = board;
        this.state = state;
        this.onUIUpdate = onUIUpdate;
        this.onIllegalMove = onIllegalMove;
        this.onMovePlaced = onMovePlaced;
        this.onSkillPlaced = onSkillPlaced;

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

        const padding = stoneRadius * 1.15;
        const width = (maxX - minX) + padding * 2;
        const height = (maxY - minY) + padding * 2;

        this.svgElement.setAttribute('viewBox', `${minX - padding} ${minY - padding} ${width} ${height}`);
        this.svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        // 3. Inyectar Definiciones (Defs) de Sombras, Gradientes y Efectos
        this.svgElement.appendChild(SVGDefs.createDefinitions());

        // 4. Dibujar Líneas de la Red (Grid Lines / Urushi Ink)
        this.renderGridLines(nodes);

        // 5. Dibujar Puntos Estrella (Hoshi) si existen
        this.renderStarPoints(nodes, stoneRadius);

        // 6. Superposición de Territorio (Si la partida ha terminado)
        this.renderTerritoryOverlay(stoneRadius);

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
        for (const [nId, owner] of assignments.entries()) {
            const targetNode = this.board.nodes.get(nId);
            if (targetNode && !targetNode.stone) {
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

                // Aura Dorada Resplandeciente de Piedra Sagrada
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

                    // 4. Emblema sagrado central
                    const sacredSymbol = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    sacredSymbol.setAttribute("x", node.x.toString());
                    sacredSymbol.setAttribute("y", (node.y + 4.5).toString());
                    sacredSymbol.setAttribute("text-anchor", "middle");
                    sacredSymbol.setAttribute("font-size", (stoneRadius * 0.72).toString());
                    sacredSymbol.setAttribute("fill", "#ffffff");
                    sacredSymbol.textContent = "🛡️";
                    stoneG.appendChild(sacredSymbol);
                }

                // Indicador de última jugada
                if (node.id === this.state.lastMoveNodeId) {
                    const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    marker.setAttribute("cx", node.x.toString());
                    marker.setAttribute("cy", node.y.toString());
                    marker.setAttribute("r", (stoneRadius * 0.32).toString());
                    marker.setAttribute("fill", "none");
                    const markerStroke = (pid === 1 || pid === 4) ? "#ffffff" : "#1a1a1a";
                    marker.setAttribute("stroke", markerStroke);
                    marker.setAttribute("stroke-width", "2.2");
                    marker.setAttribute("class", "vfx-last-move-marker");
                    stoneG.appendChild(marker);
                }

                stonesGroup.appendChild(stoneG);
            }
        }
        this.svgElement.appendChild(stonesGroup);
    }

    private renderInteractiveLayer(nodes: BoardNode[], stoneRadius: number) {
        // 0. Renderizar insignias y conteo numérico de libertades del Tutorial (ej. 1, 2, 3, 4)
        if (TutorialManager.isActive) {
            const annotations = TutorialManager.getCurrentAnnotations();
            if (annotations && annotations.length > 0) {
                const annotGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                annotGroup.setAttribute("class", "tutorial-annotations-layer");
                for (const ann of annotations) {
                    const targetNode = this.board.nodes.get(ann.nodeId);
                    if (targetNode) {
                        const annG = document.createElementNS("http://www.w3.org/2000/svg", "g");
                        annG.setAttribute("class", "tutorial-annotation-badge");
                        
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
                this.lastHoveredNode = node;
                if (node.stone && node.stone.isIndestructible) {
                    HUDController.showAlert("🛡️ Piedra Sagrada: Inmune a ser capturada.");
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

        const currentPlayer = this.state.currentPlayer;
        const targetNode = this.board.nodes.get(nodeId);

        // 1. Si estamos en modo selección de objetivo para una Habilidad Activa o Pasiva de Campeón
        if (isTargeting) {
            const targetingPid = ChampionManager.targetingPlayerId || currentPlayer;
            const success = ChampionManager.executeTargetedSkill(
                this.board,
                this.state,
                nodeId,
                targetingPid,
                this.svgElement,
                (msg) => {
                    HUDController.showAlert(msg);
                    SoundFX.playUndo();
                },
                (msg) => this.onIllegalMove(msg),
                () => {
                    this.render();
                    this.onUIUpdate();
                    if (ChampionManager.currentTargetingMode === 'none') {
                        if (this.onSkillPlaced) {
                            this.onSkillPlaced(ChampionManager.currentHero || 'tengu', nodeId);
                        }
                        if (TutorialManager.isActive) {
                            TutorialManager.advanceStep();
                        } else if (this.onMovePlaced) {
                            this.onMovePlaced(nodeId, isLocal);
                        }
                    }
                }
            );
            if (!success) {
                this.state.historyStack.pop();
            }
            return;
        }

        // 2. Si estamos en modo colocación de Ficha Poliminó (🌿 Germinante, 🀄 Dominó, 🧱 Monolito)
        if (PolyominoManager.activePolyomino !== null) {
            this.state.recordSnapshot(this.board);
            const success = PolyominoManager.placePolyomino(
                this.board,
                this.state,
                nodeId,
                currentPlayer,
                (msg) => HUDController.showAlert(msg),
                (msg) => this.onIllegalMove(msg)
            );

            if (success) {
                this.state.advanceTurn(this.board);
                
                // Procesar brotaciones de Piedras Germinantes
                PolyominoManager.processSproutingStones(this.board, this.state, currentPlayer, (sproutNodeId) => {
                    const sproutNode = this.board.nodes.get(sproutNodeId);
                    if (sproutNode) {
                        this.triggerPlacementRipple(sproutNode.x, sproutNode.y, 18);
                    }
                    HUDController.showAlert("🌿 ¡Una Piedra Germinante ha brotado una nueva piedra aliada!");
                });

                this.render();
                this.onUIUpdate();

                if (targetNode) {
                    this.triggerPlacementRipple(targetNode.x, targetNode.y, 22);
                }

                ChampionManager.checkPassiveTriggers(
                    this.board,
                    this.state,
                    currentPlayer,
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
        const result = RulesEngine.tryPlaceStone(this.board, this.state, nodeId, currentPlayer);
        
        if (result.success) {
            if (result.capturedCount > 0) {
                SoundFX.playCapture();
            } else {
                SoundFX.playPlaceStone();
            }

            this.state.advanceTurn(this.board);
            if (TutorialManager.isActive || (StoryController && StoryController.isCurrentChapterSolo())) {
                this.state.currentPlayer = 1;
                this.isInteractive = true;
            }

            // Procesar brotaciones de Piedras Germinantes tras avanzar turno
            PolyominoManager.processSproutingStones(this.board, this.state, currentPlayer, (sproutNodeId) => {
                const sproutNode = this.board.nodes.get(sproutNodeId);
                if (sproutNode) {
                    this.triggerPlacementRipple(sproutNode.x, sproutNode.y, 18);
                }
                HUDController.showAlert("🌿 ¡Una Piedra Germinante ha brotado una nueva piedra aliada!");
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
                currentPlayer,
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
            // Revertir el snapshot si el movimiento no fue válido
            this.state.historyStack.pop();
            SoundFX.playIllegal();
            let msg = "Movimiento ilegal";
            if (result.errorReason === 'SUICIDE') {
                msg = "¡Movimiento ilegal: Suicidio!";
            } else if (result.errorReason === 'KO') {
                msg = "🚫 ¡Regla de Ko! No puedes repetir la misma posición inmediatamente. Juega en otra zona.";
            } else if (result.errorReason === 'OCCUPIED') {
                msg = "¡Esa intersección ya está ocupada!";
            } else if (result.errorReason === 'INVALID_TERRAIN') {
                msg = "¡Esa casilla no es accesible!";
            }
            this.onIllegalMove(msg);
        }
    }
}
