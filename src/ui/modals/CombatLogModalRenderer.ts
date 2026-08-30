// src/ui/modals/CombatLogModalRenderer.ts - Visor Interactivo y Controlador de Repeticiones de Combate

import type {
    CombatLogEntry,
    CombatReplayFile,
    BoardShape,
    BoardSize
} from '../../types';
import { CombatLogManager } from '../../core/CombatLogManager';
import { GraphBoard, BoardNode } from '../../core/GraphBoard';
import { BoardGenerators } from '../../graphics/BoardGenerators';
import { SVGDefs } from '../../graphics/SVGDefs';
import { HUDController } from '../HUDController';
import { SoundFX } from '../../audio/SoundFX';
import { getLanguage } from '../../i18n/i18n';

export class CombatLogModalRenderer {
    public static currentStepIndex: number = 0;
    public static activeEntries: CombatLogEntry[] = [];
    public static activeReplay: CombatReplayFile | null = null;
    public static replayBoard: GraphBoard | null = null;
    
    private static isAutoPlaying: boolean = false;
    private static autoPlayTimer: number | null = null;
    private static playbackDelayMs: number = 1000;
    private static activeFilter: 'all' | 'stones' | 'skills' | 'poly' | 'passes' | 'board' = 'all';
    private static searchQuery: string = '';
    private static isInitialized: boolean = false;

    /**
     * Abre el modal de Registro de Combate (usando la partida en curso o un replay importado)
     */
    public static openCombatLogModal(importedReplay?: CombatReplayFile): void {
        const modal = document.getElementById('modal-combat-log');
        if (!modal) return;

        this.initEventHandlers();

        if (importedReplay) {
            this.activeReplay = importedReplay;
            this.activeEntries = importedReplay.entries;
        } else {
            this.activeReplay = CombatLogManager.exportReplayFile();
            this.activeEntries = CombatLogManager.getEntries();
        }

        if (!this.activeEntries || this.activeEntries.length === 0) {
            const isEn = getLanguage() === 'en';
            const shape: BoardShape = (this.activeReplay?.gameConfig?.shape as BoardShape) || 'square';
            const size: BoardSize = (this.activeReplay?.gameConfig?.size as BoardSize) || 9;
            this.replayBoard = new GraphBoard();
            BoardGenerators.generate(this.replayBoard, shape, size);
            const emptySnapshot = CombatLogManager.createBoardSnapshot(this.replayBoard);

            this.activeEntries = [{
                stepIndex: 0,
                turnRound: 1,
                turnLabel: '0',
                playerId: 1,
                playerName: isEn ? 'No Match Active' : 'Sin Partida Activa',
                playerHeroId: 'normal',
                actionType: 'place_stone',
                actionName: isEn ? 'No Moves' : 'Sin Jugadas',
                primaryNodeId: null,
                coordinateLabel: '—',
                affectedNodeIds: [],
                capturedCount: 0,
                descriptionEs: 'No hay ninguna partida activa grabada. Juega un combate o pulsa "📂 Importar Replay" para cargar un archivo .cgo.',
                descriptionEn: 'No active match recorded yet. Play a game or click "📂 Import Replay" to load a .cgo file.',
                boardSnapshot: emptySnapshot,
                snapshotDetails: {
                    blackCaptures: 0,
                    whiteCaptures: 0,
                    greenCaptures: 0,
                    purpleCaptures: 0,
                    currentPlayer: 1,
                    lastMoveNodeId: null,
                    isGameOver: false
                },
                timestamp: Date.now()
            }];
        } else {
            // Inicializar tablero de repetición con la topología del combate
            const config = this.activeReplay?.gameConfig || { shape: 'square', size: 9 };
            this.replayBoard = new GraphBoard();
            BoardGenerators.generate(
                this.replayBoard,
                (config.shape as BoardShape) || 'square',
                (config.size as BoardSize) || 9
            );
        }

        // Configurar Slider de pasos
        const slider = document.getElementById('replay-step-slider') as HTMLInputElement | null;
        const maxLabel = document.getElementById('replay-slider-max-label');
        const maxIndex = Math.max(0, this.activeEntries.length - 1);

        if (slider) {
            slider.min = '0';
            slider.max = maxIndex.toString();
            slider.value = maxIndex.toString();
        }
        if (maxLabel) {
            maxLabel.textContent = maxIndex.toString();
        }

        // Posicionar en el último paso (o en el paso 0 si es un archivo importado)
        this.currentStepIndex = importedReplay ? 0 : maxIndex;
        this.activeFilter = 'all';
        this.searchQuery = '';
        const searchInput = document.getElementById('replay-search-input') as HTMLInputElement | null;
        if (searchInput) searchInput.value = '';

        this.updateFilterButtons();
        this.renderTimelineList();
        this.goToStep(this.currentStepIndex, false);
        this.updateFooterMeta();

        modal.classList.remove('hidden');
    }

    /**
     * Cierra el modal y detiene la reproducción automática
     */
    public static closeCombatLogModal(): void {
        this.pauseAutoPlay();
        const modal = document.getElementById('modal-combat-log');
        if (modal) {
            modal.classList.add('hidden');
        }
        import('../../controllers/GameController').then(m => {
            if (m.GameController.renderer) {
                m.GameController.renderer.isInteractive = m.GameController.isLocalPlayerTurn();
                m.GameController.renderer.render();
            }
        });
    }

    /**
     * Navega a un paso específico de la partida y actualiza el tablero y la interfaz
     */
    public static goToStep(stepIndex: number, playSound: boolean = true): void {
        if (!this.activeEntries || this.activeEntries.length === 0) return;
        
        // Limitar dentro de rango válido
        const clampedIndex = Math.max(0, Math.min(stepIndex, this.activeEntries.length - 1));
        this.currentStepIndex = clampedIndex;

        const entry = this.activeEntries[clampedIndex];
        if (!entry) return;

        // Actualizar slider
        const slider = document.getElementById('replay-step-slider') as HTMLInputElement | null;
        if (slider) slider.value = clampedIndex.toString();

        // Actualizar Cabecera de Paso
        const stepBadge = document.getElementById('replay-step-badge');
        const turnBadge = document.getElementById('replay-turn-badge');
        const descText = document.getElementById('replay-step-desc');
        const isEn = getLanguage() === 'en';

        if (stepBadge) {
            stepBadge.textContent = isEn
                ? `Step ${clampedIndex} / ${this.activeEntries.length - 1}`
                : `Paso ${clampedIndex} / ${this.activeEntries.length - 1}`;
        }
        if (turnBadge) {
            turnBadge.textContent = isEn ? `Turn ${entry.turnLabel || '0'}` : `Turno ${entry.turnLabel || '0'}`;
        }
        if (descText) {
            descText.textContent = isEn ? (entry.descriptionEn || '') : (entry.descriptionEs || '');
        }

        // Actualizar Capturas en este paso con protección de nulos
        const capP1 = document.getElementById('replay-cap-p1');
        const capP2 = document.getElementById('replay-cap-p2');
        const capP3 = document.getElementById('replay-cap-p3');
        const capP4 = document.getElementById('replay-cap-p4');

        if (capP1) capP1.textContent = `⚫ ${entry.snapshotDetails?.blackCaptures ?? 0}`;
        if (capP2) capP2.textContent = `⚪ ${entry.snapshotDetails?.whiteCaptures ?? 0}`;
        if (capP3) {
            if (this.activeReplay?.gameConfig?.playerCount === 4) {
                capP3.classList.remove('hidden');
                capP3.textContent = `🟢 ${entry.snapshotDetails?.greenCaptures ?? 0}`;
            } else {
                capP3.classList.add('hidden');
            }
        }
        if (capP4) {
            if (this.activeReplay?.gameConfig?.playerCount === 4) {
                capP4.classList.remove('hidden');
                capP4.textContent = `🟣 ${entry.snapshotDetails?.purpleCaptures ?? 0}`;
            } else {
                capP4.classList.add('hidden');
            }
        }

        // Renderizar Tablero SVG con el snapshot de este paso
        this.renderStepBoard(entry);
        this.renderWinRateBar(entry);

        // Resaltar tarjeta activa en la lista del Timeline
        this.highlightActiveTimelineCard(clampedIndex);

        if (playSound && clampedIndex > 0) {
            if (entry.capturedCount > 0) {
                SoundFX.playCapture();
            } else if (entry.actionType === 'place_stone' || entry.actionType === 'polyomino') {
                SoundFX.playPlaceStone();
            } else if (entry.actionType === 'champion_skill' || entry.actionType === 'spell_cast') {
                SoundFX.playSpecial();
            } else if (entry.actionType === 'pass') {
                SoundFX.playPass();
            }
        }
    }

    public static nextStep(): void {
        if (this.currentStepIndex < this.activeEntries.length - 1) {
            this.goToStep(this.currentStepIndex + 1);
        } else {
            this.pauseAutoPlay();
        }
    }

    public static prevStep(): void {
        if (this.currentStepIndex > 0) {
            this.goToStep(this.currentStepIndex - 1);
        }
    }

    public static firstStep(): void {
        this.goToStep(0);
    }

    public static lastStep(): void {
        this.goToStep(this.activeEntries.length - 1);
    }

    /**
     * Alterna la reproducción automática paso a paso
     */
    public static toggleAutoPlay(): void {
        if (this.isAutoPlaying) {
            this.pauseAutoPlay();
        } else {
            this.startAutoPlay();
        }
    }

    public static startAutoPlay(): void {
        this.isAutoPlaying = true;
        this.updatePlayButtonUI();

        // Si ya estamos en el último paso, reiniciar desde el principio
        if (this.currentStepIndex >= this.activeEntries.length - 1) {
            this.goToStep(0);
        }

        if (this.autoPlayTimer) clearInterval(this.autoPlayTimer);
        this.autoPlayTimer = window.setInterval(() => {
            if (this.currentStepIndex < this.activeEntries.length - 1) {
                this.nextStep();
            } else {
                this.pauseAutoPlay();
            }
        }, this.playbackDelayMs);
    }

    public static pauseAutoPlay(): void {
        this.isAutoPlaying = false;
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
        this.updatePlayButtonUI();
    }

    private static updatePlayButtonUI(): void {
        const icon = document.getElementById('replay-play-icon');
        const text = document.getElementById('replay-play-text');
        const btn = document.getElementById('btn-replay-play');
        const isEn = getLanguage() === 'en';

        if (icon) icon.textContent = this.isAutoPlaying ? '⏸️' : '▶';
        if (text) text.textContent = this.isAutoPlaying ? (isEn ? 'Pause' : 'Pausa') : (isEn ? 'Play' : 'Auto');
        if (btn) {
            if (this.isAutoPlaying) {
                btn.style.background = 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)';
                btn.style.borderColor = '#f43f5e';
            } else {
                btn.style.background = '';
                btn.style.borderColor = '';
            }
        }
    }

    /**
     * Dibuja el tablero SVG de previsualización con las piedras exactas y resaltados del paso actual
     */
    private static renderStepBoard(entry: CombatLogEntry): void {
        const svg = document.getElementById('replay-board-svg') as SVGSVGElement | null;
        if (!svg || !this.replayBoard) return;

        svg.innerHTML = '';

        // 1. Asegurar que las definiciones globales de SVG existen (en lugar de inyectar localmente)
        let globalDefsSvg = document.getElementById('global-svg-defs') as HTMLElement | SVGSVGElement | null;
        if (!globalDefsSvg) {
            const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svgElement.setAttribute('id', 'global-svg-defs');
            svgElement.setAttribute("style", "position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none;");
            svgElement.appendChild(SVGDefs.createDefinitions());
            document.body.appendChild(svgElement);
        }

        // 2. Aplicar snapshot en los nodos del tablero de repetición
        const snapshotMap = new Map<string, typeof entry.boardSnapshot[0]>();
        if (entry.boardSnapshot && Array.isArray(entry.boardSnapshot)) {
            const size = this.replayBoard.size || 9;
            const spacing = size === 19 ? 28 : size === 13 ? 36 : size === 9 ? 46 : 56;
            const starPoints = BoardGenerators.getStarPoints(size);

            for (const sn of entry.boardSnapshot) {
                snapshotMap.set(sn.id, sn);
                // Si el snapshot contiene nodos generados dinámicamente durante la partida (ej. Expansión Celestial)
                if (!this.replayBoard.nodes.has(sn.id)) {
                    const parts = sn.id.split(',');
                    if (parts.length === 2) {
                        const c = parseFloat(parts[0]);
                        const r = parseFloat(parts[1]);
                        if (!isNaN(c) && !isNaN(r)) {
                            const x = c * spacing;
                            const y = r * spacing;
                            this.replayBoard.addNode(sn.id, x, y, starPoints.has(sn.id));
                            const neighbors = [`${c - 1},${r}`, `${c + 1},${r}`, `${c},${r - 1}`, `${c},${r + 1}`];
                            for (const nId of neighbors) {
                                if (this.replayBoard.nodes.has(nId)) {
                                    this.replayBoard.addEdge(sn.id, nId);
                                }
                            }
                        }
                    }
                }
            }
        }

        for (const [id, node] of this.replayBoard.nodes.entries()) {
            const snapNode = snapshotMap.get(id);
            if (snapNode) {
                node.terrain = snapNode.terrain;
                node.stone = snapNode.stone ? {
                    id: snapNode.stone.id || 'snap_stone',
                    playerId: snapNode.stone.playerId,
                    stoneType: snapNode.stone.stoneType || 'single',
                    isIndestructible: !!snapNode.stone.isIndestructible,
                    shieldTurnsLeft: snapNode.stone.shieldTurnsLeft,
                    polyGroupId: snapNode.stone.polyGroupId,
                    isInvisible: false,
                    isFrozen: false
                } : null;
            } else {
                // Si este nodo no está presente en el snapshot de este turno, fue destruido o aún no se ha expandido
                node.terrain = 'DESTROYED';
                node.stone = null;
            }
        }

        const nodes = Array.from(this.replayBoard.nodes.values());
        if (nodes.length === 0) return;

        // 3. Calcular bounding box y ViewBox adaptativo con espaciado orgánico según casillas vivas en este turno
        const activeNodes = nodes.filter(n => n.terrain !== 'DESTROYED');
        const targetNodes = activeNodes.length > 0 ? activeNodes : nodes;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const n of targetNodes) {
            if (n.x < minX) minX = n.x;
            if (n.x > maxX) maxX = n.x;
            if (n.y < minY) minY = n.y;
            if (n.y > maxY) maxY = n.y;
        }

        let minNeighborDistance = Infinity;
        for (const node of targetNodes) {
            for (const nId of node.neighbors) {
                const neighbor = this.replayBoard.nodes.get(nId);
                if (neighbor && neighbor.terrain !== 'DESTROYED') {
                    const dist = Math.hypot(node.x - neighbor.x, node.y - neighbor.y);
                    if (dist > 0 && dist < minNeighborDistance) {
                        minNeighborDistance = dist;
                    }
                }
            }
        }

        const stoneRadius = isFinite(minNeighborDistance)
            ? Math.max(10, Math.min(25, minNeighborDistance * 0.475))
            : (targetNodes.length > 200 ? 11 : targetNodes.length > 90 ? 14 : 19);

        const padding = stoneRadius * 1.08;
        const safetyMargin = this.replayBoard.shape === 'volcano' ? (padding * 1.55 + 8) : (padding + 4);
        const finalWidth = (maxX - minX) + safetyMargin * 2;
        const finalHeight = (maxY - minY) + safetyMargin * 2;
        const finalMinX = minX - safetyMargin;
        const finalMinY = minY - safetyMargin;

        svg.setAttribute('viewBox', `${finalMinX} ${finalMinY} ${finalWidth} ${finalHeight}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        // 4. Fondo de Madera Dinámico (Forma Convex Hull)
        this.renderBoardBackground(svg, nodes, padding);

        // 4.1 Decoraciones Volcánicas
        if (this.replayBoard.shape === 'volcano') {
            this.renderVolcanoCornerDecorations(svg, nodes, padding);
        }

        // 4.2 Decoración Fauces Oni
        if (this.replayBoard.shape === 'oni') {
            this.renderOniMouthAbyss(svg, padding);
        }

        // 5. Líneas de la cuadrícula (Tinta Urushi negra/marrón)
        this.renderGridLines(svg, nodes);

        // 5.5 Puntos Estrella (Hoshi)
        this.renderStarPoints(svg, nodes, stoneRadius);

        // 6. Poliminós (Duplicidad 2x1 y Monolito 2x2)
        this.renderPolyominoBases(svg, nodes, stoneRadius);

        // 7. Piedras y Marcadores
        this.renderStones(svg, nodes, stoneRadius, entry);
    }

    private static renderBoardBackground(svg: SVGSVGElement, nodes: BoardNode[], padding: number): void {
        if (nodes.length < 3) return;

        const points = nodes.filter(n => n.terrain !== 'DESTROYED').map(n => ({ x: n.x, y: n.y }));
        if (points.length < 3) return;

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

        const bgGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        bgGroup.setAttribute("class", "board-dynamic-background");
        const polyPoints = hull.map(p => `${p.x},${p.y}`).join(" ");

        // Capa 1: Sombra y Borde exterior (Bisel dorado/madera)
        const woodOutline = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        woodOutline.setAttribute("points", polyPoints);
        woodOutline.setAttribute("fill", "url(#wood-texture)");
        woodOutline.setAttribute("stroke", "#cca162");
        woodOutline.setAttribute("stroke-width", (padding * 2 + 6).toString());
        woodOutline.setAttribute("stroke-linejoin", "round");
        woodOutline.setAttribute("filter", "url(#board-shadow)");

        // Capa 2: Madera pura
        const woodBase = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        woodBase.setAttribute("points", polyPoints);
        woodBase.setAttribute("fill", "url(#wood-texture)");
        woodBase.setAttribute("stroke", "url(#wood-texture)");
        woodBase.setAttribute("stroke-width", (padding * 2).toString());
        woodBase.setAttribute("stroke-linejoin", "round");

        bgGroup.appendChild(woodOutline);
        bgGroup.appendChild(woodBase);

        svg.appendChild(bgGroup);
    }

    private static renderVolcanoCornerDecorations(svg: SVGSVGElement, nodes: BoardNode[], padding: number): void {
        const validNodes = nodes.filter(n => n.terrain !== 'DESTROYED');
        if (validNodes.length === 0) return;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const n of validNodes) {
            if (n.x < minX) minX = n.x;
            if (n.x > maxX) maxX = n.x;
            if (n.y < minY) minY = n.y;
            if (n.y > maxY) maxY = n.y;
        }

        const offset = padding * 0.72;
        const corners = [
            { x: minX - offset, y: minY - offset, angle: 45 },
            { x: maxX + offset, y: minY - offset, angle: 135 },
            { x: maxX + offset, y: maxY + offset, angle: 225 },
            { x: minX - offset, y: maxY + offset, angle: 315 },
        ];

        const volcanoGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        volcanoGroup.setAttribute("class", "volcano-corners-decoration");

        const rOuter = Math.max(16, padding * 0.68);
        const rCrater = rOuter * 0.58;
        const rMagma = rOuter * 0.38;

        corners.forEach((c) => {
            const vG = document.createElementNS("http://www.w3.org/2000/svg", "g");
            vG.setAttribute("class", "volcano-corner-item");
            vG.setAttribute("transform", `translate(${c.x}, ${c.y}) rotate(${c.angle})`);

            const shadow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            shadow.setAttribute("cx", "0");
            shadow.setAttribute("cy", "2");
            shadow.setAttribute("r", (rOuter + 3).toString());
            shadow.setAttribute("fill", "rgba(0,0,0,0.65)");
            shadow.setAttribute("filter", "url(#stone-shadow)");
            vG.appendChild(shadow);

            const cone = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            cone.setAttribute("cx", "0");
            cone.setAttribute("cy", "0");
            cone.setAttribute("r", rOuter.toString());
            cone.setAttribute("fill", "url(#volcano-rock-grad)");
            cone.setAttribute("stroke", "#1c1917");
            cone.setAttribute("stroke-width", "2");
            vG.appendChild(cone);

            for (let i = 0; i < 4; i++) {
                const crackAngle = (i * 90 + 25) * (Math.PI / 180);
                const x1 = Math.cos(crackAngle) * rCrater * 0.9;
                const y1 = Math.sin(crackAngle) * rCrater * 0.9;
                const x2 = Math.cos(crackAngle) * (rOuter * 0.9);
                const y2 = Math.sin(crackAngle) * (rOuter * 0.9);

                const crack = document.createElementNS("http://www.w3.org/2000/svg", "line");
                crack.setAttribute("x1", x1.toFixed(1));
                crack.setAttribute("y1", y1.toFixed(1));
                crack.setAttribute("x2", x2.toFixed(1));
                crack.setAttribute("y2", y2.toFixed(1));
                crack.setAttribute("stroke", "#ea580c");
                crack.setAttribute("stroke-width", "1.5");
                crack.setAttribute("stroke-linecap", "round");
                crack.setAttribute("opacity", "0.85");
                vG.appendChild(crack);
            }

            const craterRim = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            craterRim.setAttribute("cx", "0");
            craterRim.setAttribute("cy", "0");
            craterRim.setAttribute("r", rCrater.toString());
            craterRim.setAttribute("fill", "#0c0a09");
            craterRim.setAttribute("stroke", "#7f1d1d");
            craterRim.setAttribute("stroke-width", "1.5");
            vG.appendChild(craterRim);

            const magma = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            magma.setAttribute("cx", "0");
            magma.setAttribute("cy", "0");
            magma.setAttribute("r", rMagma.toString());
            magma.setAttribute("fill", "url(#volcano-magma-grad)");
            vG.appendChild(magma);

            volcanoGroup.appendChild(vG);
        });

        svg.appendChild(volcanoGroup);
    }

    private static renderOniMouthAbyss(svg: SVGSVGElement, _padding: number): void {
        const spacing = 24;
        const mouthCenterX = 12 * spacing;
        const mouthCenterY = 17 * spacing;
        const rx = 4.4 * spacing;
        const ry = 1.35 * spacing;

        const abyssGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        abyssGroup.setAttribute("class", "oni-mouth-abyss-container");

        const outerGlow = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        outerGlow.setAttribute("cx", mouthCenterX.toString());
        outerGlow.setAttribute("cy", mouthCenterY.toString());
        outerGlow.setAttribute("rx", (rx + 8).toString());
        outerGlow.setAttribute("ry", (ry + 6).toString());
        outerGlow.setAttribute("fill", "url(#oni-void-swirl-glow)");
        outerGlow.setAttribute("filter", "url(#oni-void-glow)");
             abyssGroup.appendChild(outerGlow);

        const baseVoid = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        baseVoid.setAttribute("cx", mouthCenterX.toString());
        baseVoid.setAttribute("cy", mouthCenterY.toString());
        baseVoid.setAttribute("rx", rx.toString());
        baseVoid.setAttribute("ry", ry.toString());
        baseVoid.setAttribute("fill", "url(#oni-void-core)");
        baseVoid.setAttribute("stroke", "#7e22ce");
        baseVoid.setAttribute("stroke-width", "2.2");
        baseVoid.setAttribute("stroke-opacity", "0.9");
        abyssGroup.appendChild(baseVoid);

        // Anillos de rotación gravitatoria y vórtice místico
        const swirlRing1 = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        swirlRing1.setAttribute("cx", mouthCenterX.toString());
        swirlRing1.setAttribute("cy", mouthCenterY.toString());
        swirlRing1.setAttribute("rx", (rx * 0.88).toString());
        swirlRing1.setAttribute("ry", (ry * 0.82).toString());
        swirlRing1.setAttribute("fill", "none");
        swirlRing1.setAttribute("stroke", "#e879f9");
        swirlRing1.setAttribute("stroke-width", "1.4");
        swirlRing1.setAttribute("stroke-dasharray", "8, 6, 2, 6");
        swirlRing1.setAttribute("stroke-opacity", "0.75");
        swirlRing1.setAttribute("class", "oni-mouth-swirl-ring-1");
        abyssGroup.appendChild(swirlRing1);

        const swirlRing2 = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        swirlRing2.setAttribute("cx", mouthCenterX.toString());
        swirlRing2.setAttribute("cy", mouthCenterY.toString());
        swirlRing2.setAttribute("rx", (rx * 0.62).toString());
        swirlRing2.setAttribute("ry", (ry * 0.58).toString());
        swirlRing2.setAttribute("fill", "none");
        swirlRing2.setAttribute("stroke", "#f43f5e");
        swirlRing2.setAttribute("stroke-width", "1.2");
        swirlRing2.setAttribute("stroke-dasharray", "5, 5");
        swirlRing2.setAttribute("stroke-opacity", "0.85");
        swirlRing2.setAttribute("class", "oni-mouth-swirl-ring-2");
        abyssGroup.appendChild(swirlRing2);

        const innerRim = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        innerRim.setAttribute("cx", mouthCenterX.toString());
        innerRim.setAttribute("cy", mouthCenterY.toString());
        innerRim.setAttribute("rx", (rx * 0.72).toString());
        innerRim.setAttribute("ry", (ry * 0.65).toString());
        innerRim.setAttribute("fill", "none");
        innerRim.setAttribute("stroke", "#c084fc");
        innerRim.setAttribute("stroke-width", "1.2");
        innerRim.setAttribute("stroke-opacity", "0.6");
        abyssGroup.appendChild(innerRim);

        const coreBlackHole = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        coreBlackHole.setAttribute("cx", mouthCenterX.toString());
        coreBlackHole.setAttribute("cy", mouthCenterY.toString());
        coreBlackHole.setAttribute("rx", (rx * 0.45).toString());
        coreBlackHole.setAttribute("ry", (ry * 0.4).toString());
        coreBlackHole.setAttribute("fill", "#000000");
        abyssGroup.appendChild(coreBlackHole);

        svg.appendChild(abyssGroup);
    }

    private static renderStarPoints(svg: SVGSVGElement, nodes: BoardNode[], stoneRadius: number): void {
        const hoshiGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        hoshiGroup.setAttribute("class", "hoshi-points");
        for (const node of nodes) {
            if (node.isStarPoint && node.terrain !== 'DESTROYED') {
                const star = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                star.setAttribute("cx", node.x.toString());
                star.setAttribute("cy", node.y.toString());
                star.setAttribute("r", (stoneRadius * 0.22).toString());
                star.setAttribute("fill", "#221308");
                hoshiGroup.appendChild(star);
            }
        }
        svg.appendChild(hoshiGroup);
    }

    private static renderGridLines(svg: SVGSVGElement, nodes: BoardNode[]): void {
        const linesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        linesGroup.setAttribute("class", "grid-lines");
        const drawnEdges = new Set<string>();

        for (const node of nodes) {
            if (node.terrain === 'DESTROYED') continue;
            for (const neighborId of node.neighbors) {
                const edgeKey = [node.id, neighborId].sort().join('--');
                if (!drawnEdges.has(edgeKey)) {
                    drawnEdges.add(edgeKey);
                    const neighbor = this.replayBoard?.nodes.get(neighborId);
                    if (neighbor && neighbor.terrain !== 'DESTROYED') {
                        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        line.setAttribute("x1", node.x.toString());
                        line.setAttribute("y1", node.y.toString());
                        line.setAttribute("x2", neighbor.x.toString());
                        line.setAttribute("y2", neighbor.y.toString());
                        line.setAttribute("stroke", "#2a180b");
                        line.setAttribute("stroke-width", "1.9");
                        line.setAttribute("stroke-opacity", "0.92");
                        line.setAttribute("stroke-linecap", "round");
                        linesGroup.appendChild(line);
                    }
                }
            }
        }
        svg.appendChild(linesGroup);
    }

    private static renderPolyominoBases(svg: SVGSVGElement, nodes: BoardNode[], stoneRadius: number): void {
        const polyNodes = nodes.filter(n => n.terrain !== 'DESTROYED' && n.stone && n.stone.stoneType && n.stone.stoneType !== 'single');
        if (polyNodes.length === 0) return;

        const groups = new Map<string, BoardNode[]>();
        for (const n of polyNodes) {
            const gid = n.stone?.polyGroupId || `auto_${n.stone?.playerId}_${n.stone?.stoneType}`;
            if (!groups.has(gid)) groups.set(gid, []);
            groups.get(gid)!.push(n);
        }

        const polyGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

        for (const [_, gNodes] of groups) {
            if (gNodes.length < 2) continue;
            const first = gNodes[0].stone!;
            const pid = first.playerId;
            const type = first.stoneType;
            const strokeColor = type === 'domino' ? '#38bdf8' : '#f59e0b';
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
                polyGroup.appendChild(dominoPill);

                const dominoOutline = document.createElementNS("http://www.w3.org/2000/svg", "line");
                dominoOutline.setAttribute("x1", nA.x.toString());
                dominoOutline.setAttribute("y1", nA.y.toString());
                dominoOutline.setAttribute("x2", nB.x.toString());
                dominoOutline.setAttribute("y2", nB.y.toString());
                dominoOutline.setAttribute("stroke", strokeColor);
                dominoOutline.setAttribute("stroke-width", (stoneRadius * 2.05).toString());
                dominoOutline.setAttribute("stroke-linecap", "round");
                dominoOutline.setAttribute("opacity", "0.45");
                polyGroup.appendChild(dominoOutline);
            } else if (type === 'monolith' && gNodes.length >= 3) {
                const points = gNodes.map(n => ({ x: n.x, y: n.y }));
                const avgX = points.reduce((a, b) => a + b.x, 0) / points.length;
                const avgY = points.reduce((a, b) => a + b.y, 0) / points.length;
                points.sort((a, b) => Math.atan2(a.y - avgY, a.x - avgX) - Math.atan2(b.y - avgY, b.x - avgX));

                const slab = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                slab.setAttribute("points", points.map(p => `${p.x},${p.y}`).join(" "));
                slab.setAttribute("fill", gradFill);
                slab.setAttribute("stroke", strokeColor);
                slab.setAttribute("stroke-width", (stoneRadius * 1.8).toString());
                slab.setAttribute("stroke-linejoin", "round");
                polyGroup.appendChild(slab);
            }
        }
        svg.appendChild(polyGroup);
    }

    private static renderStones(
        svg: SVGSVGElement,
        nodes: BoardNode[],
        stoneRadius: number,
        entry: CombatLogEntry
    ): void {
        const stonesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const highlightGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

        for (const node of nodes) {
            if (node.terrain === 'DESTROYED') continue;
            if (node.stone) {
                const pid = node.stone.playerId;
                const stoneCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                stoneCircle.setAttribute("cx", node.x.toString());
                stoneCircle.setAttribute("cy", node.y.toString());
                stoneCircle.setAttribute("r", stoneRadius.toString());

                if (pid === 1) {
                    stoneCircle.setAttribute("fill", "url(#black-stone-grad)");
                } else if (pid === 2) {
                    stoneCircle.setAttribute("fill", "url(#white-stone-grad)");
                    stoneCircle.setAttribute("stroke", "#cbd5e1");
                    stoneCircle.setAttribute("stroke-width", "0.75");
                } else if (pid === 3) {
                    stoneCircle.setAttribute("fill", "url(#green-stone-grad)");
                    stoneCircle.setAttribute("stroke", "#059669");
                    stoneCircle.setAttribute("stroke-width", "0.75");
                } else if (pid === 4) {
                    stoneCircle.setAttribute("fill", "url(#purple-stone-grad)");
                    stoneCircle.setAttribute("stroke", "#7c3aed");
                    stoneCircle.setAttribute("stroke-width", "0.75");
                }

                stoneCircle.setAttribute("filter", "url(#stone-shadow)");
                stonesGroup.appendChild(stoneCircle);

                // Emblema germinante (🌿)
                if (node.stone.stoneType === 'sprouting') {
                    const sproutText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    sproutText.setAttribute("x", node.x.toString());
                    sproutText.setAttribute("y", (node.y + stoneRadius * 0.35).toString());
                    sproutText.setAttribute("text-anchor", "middle");
                    sproutText.setAttribute("font-size", (stoneRadius * 0.75).toString());
                    sproutText.textContent = "🌿";
                    stonesGroup.appendChild(sproutText);
                }

                // Escudo Divino
                if (node.stone.isIndestructible) {
                    const shieldRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    shieldRing.setAttribute("cx", node.x.toString());
                    shieldRing.setAttribute("cy", node.y.toString());
                    shieldRing.setAttribute("r", (stoneRadius * 1.2).toString());
                    shieldRing.setAttribute("fill", "none");
                    shieldRing.setAttribute("stroke", "#f59e0b");
                    shieldRing.setAttribute("stroke-width", "2");
                    shieldRing.setAttribute("stroke-dasharray", "3,3");
                    stonesGroup.appendChild(shieldRing);
                }
            }

            // Resaltado de la casilla principal del movimiento
            if (entry.primaryNodeId === node.id) {
                const pulseRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                pulseRing.setAttribute("cx", node.x.toString());
                pulseRing.setAttribute("cy", node.y.toString());
                pulseRing.setAttribute("r", (stoneRadius * 1.45).toString());
                pulseRing.setAttribute("fill", "none");
                pulseRing.setAttribute("stroke", "#38bdf8");
                pulseRing.setAttribute("stroke-width", "3");
                pulseRing.setAttribute("class", "replay-highlight-ring");
                highlightGroup.appendChild(pulseRing);

                // Punto central brillante
                const centerDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                centerDot.setAttribute("cx", node.x.toString());
                centerDot.setAttribute("cy", node.y.toString());
                centerDot.setAttribute("r", (stoneRadius * 0.35).toString());
                centerDot.setAttribute("fill", entry.playerId === 1 ? "#ffffff" : "#0f172a");
                centerDot.setAttribute("opacity", "0.95");
                highlightGroup.appendChild(centerDot);
            } else if (entry.affectedNodeIds && entry.affectedNodeIds.includes(node.id)) {
                // Otras casillas afectadas (ej. meteoros, quema, poliminó)
                const affectedRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                affectedRing.setAttribute("cx", node.x.toString());
                affectedRing.setAttribute("cy", node.y.toString());
                affectedRing.setAttribute("r", (stoneRadius * 1.25).toString());
                affectedRing.setAttribute("fill", "none");
                affectedRing.setAttribute("stroke", "#f59e0b");
                affectedRing.setAttribute("stroke-width", "2");
                affectedRing.setAttribute("stroke-dasharray", "4,2");
                highlightGroup.appendChild(affectedRing);
            }
        }

        svg.appendChild(stonesGroup);
        svg.appendChild(highlightGroup);
    }

    /**
     * Renderiza la lista cronológica de tarjetas en el Timeline derecho
     */
    public static renderTimelineList(): void {
        const container = document.getElementById('replay-log-entries-list');
        if (!container) return;

        container.innerHTML = '';
        const isEn = getLanguage() === 'en';

        // Filtrar entradas según el tab activo y la búsqueda
        const filtered = this.activeEntries.filter(entry => {
            if (this.activeFilter === 'stones' && entry.actionType !== 'place_stone') return false;
            if (this.activeFilter === 'skills' && entry.actionType !== 'champion_skill' && entry.actionType !== 'passive_trigger' && entry.actionType !== 'spell_cast') return false;
            if (this.activeFilter === 'poly' && entry.actionType !== 'polyomino') return false;
            if (this.activeFilter === 'passes' && entry.actionType !== 'pass') return false;
            if (this.activeFilter === 'board' && entry.actionType !== 'board_event') return false;

            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                const text = `${entry.turnLabel} ${entry.playerName} ${entry.actionName} ${entry.coordinateLabel} ${isEn ? entry.descriptionEn : entry.descriptionEs}`.toLowerCase();
                return text.includes(q);
            }
            return true;
        });

        if (filtered.length === 0) {
            container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #94a3b8;">${isEn ? 'No entries match this filter.' : 'No hay jugadas que coincidan con este filtro.'}</div>`;
            return;
        }

        filtered.forEach(entry => {
            const card = document.createElement('div');
            card.className = `replay-log-card ${entry.stepIndex === this.currentStepIndex ? 'active-step' : ''}`;
            card.id = `replay-card-${entry.stepIndex}`;

            const pidClass = `p${entry.playerId}`;
            const capBadge = entry.capturedCount > 0
                ? `<span class="card-capture-tag">+${entry.capturedCount} ${isEn ? 'cap' : 'capt'}</span>`
                : '';
            const coordBadge = entry.coordinateLabel !== '—'
                ? `<span class="card-coord-badge">${entry.coordinateLabel}</span>`
                : '';

            let translatedActionName = entry.actionName;
            let translatedPlayerName = entry.playerName;
            if (isEn) {
                if (translatedActionName === 'Piedra Go') translatedActionName = 'Go Stone';
                if (translatedActionName.includes('Pase de Turno')) translatedActionName = 'Pass Turn ⏭️';
                if (translatedActionName.includes('Brote Germinante')) translatedActionName = '🌿 Sprout Growth';
                if (translatedActionName.includes('Erupción Volcánica')) translatedActionName = translatedActionName.replace('Erupción Volcánica', 'Volcanic Eruption');
                if (translatedActionName.includes('Expansión Celestial')) translatedActionName = translatedActionName.replace('Expansión Celestial', 'Celestial Expansion');
                if (translatedActionName.includes('Inhalación Oni')) translatedActionName = translatedActionName.replace('Inhalación Oni', 'Oni Inhalation');
                
                if (translatedPlayerName === 'Jugador 1') translatedPlayerName = 'Player 1';
                if (translatedPlayerName === 'Jugador 2') translatedPlayerName = 'Player 2';
                if (translatedPlayerName.includes('IA ')) translatedPlayerName = translatedPlayerName.replace('IA ', 'AI ');
                if (translatedPlayerName === 'Modo Historia') translatedPlayerName = 'Story Mode';
                if (translatedPlayerName === 'Evento de Tablero') translatedPlayerName = 'Board Event';
            }

            card.innerHTML = `
                <div class="card-turn-pill ${pidClass}">
                    ${entry.turnLabel.replace('Turno ', isEn ? 'Turn ' : 'Turno ')}
                </div>
                <div class="card-info-content">
                    <div class="card-top-row">
                        <span class="card-action-title">${translatedActionName}</span>
                        ${coordBadge}
                        ${capBadge}
                    </div>
                    <div class="card-desc-text">
                        <strong style="color:var(--text-primary)">${translatedPlayerName}</strong>:<br/>
                        ${isEn ? entry.descriptionEn : entry.descriptionEs}
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                this.pauseAutoPlay();
                this.goToStep(entry.stepIndex);
            });

            container.appendChild(card);
        });
    }

    private static highlightActiveTimelineCard(stepIndex: number): void {
        document.querySelectorAll('.replay-log-card').forEach(el => el.classList.remove('active-step'));
        const activeCard = document.getElementById(`replay-card-${stepIndex}`);
        if (activeCard) {
            activeCard.classList.add('active-step');
            activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    private static updateFilterButtons(): void {
        document.querySelectorAll('.filter-tab').forEach(btn => {
            const f = btn.getAttribute('data-filter');
            if (f === this.activeFilter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    private static updateFooterMeta(): void {
        const metaEl = document.getElementById('replay-footer-match-info');
        if (!metaEl || !this.activeReplay) return;
        const cfg = this.activeReplay.gameConfig;
        const isEn = getLanguage() === 'en';
        metaEl.textContent = `${isEn ? 'Mode' : 'Modo'}: ${cfg.gameMode.toUpperCase()} • ${cfg.shape} ${cfg.size}x${cfg.size} • Komi: ${cfg.komi} pts • ${this.activeEntries.length - 1} ${isEn ? 'moves' : 'jugadas'}`;
    }

    /**
     * Vincula todos los listeners del modal de repetición (una sola vez)
     */
    private static initEventHandlers(): void {
        if (this.isInitialized) return;
        this.isInitialized = true;

        // Scrubber slider
        const slider = document.getElementById('replay-step-slider') as HTMLInputElement | null;
        if (slider) {
            slider.addEventListener('input', (e) => {
                const val = parseInt((e.target as HTMLInputElement).value, 10);
                this.pauseAutoPlay();
                this.goToStep(val, false);
            });
        }

        // Playback buttons
        document.getElementById('btn-replay-first')?.addEventListener('click', () => {
            this.pauseAutoPlay();
            this.firstStep();
        });
        document.getElementById('btn-replay-prev')?.addEventListener('click', () => {
            this.pauseAutoPlay();
            this.prevStep();
        });
        document.getElementById('btn-replay-play')?.addEventListener('click', () => {
            this.toggleAutoPlay();
        });
        document.getElementById('btn-replay-next')?.addEventListener('click', () => {
            this.pauseAutoPlay();
            this.nextStep();
        });
        document.getElementById('btn-replay-last')?.addEventListener('click', () => {
            this.pauseAutoPlay();
            this.lastStep();
        });

        // Speed select
        const speedSelect = document.getElementById('replay-speed-select') as HTMLSelectElement | null;
        if (speedSelect) {
            speedSelect.addEventListener('change', (e) => {
                this.playbackDelayMs = parseInt((e.target as HTMLSelectElement).value, 10);
                if (this.isAutoPlaying) {
                    this.pauseAutoPlay();
                    this.startAutoPlay();
                }
            });
        }

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const f = target.getAttribute('data-filter') as typeof this.activeFilter;
                if (f) {
                    this.activeFilter = f;
                    this.updateFilterButtons();
                    this.renderTimelineList();
                }
            });
        });

        // Search input
        const searchInput = document.getElementById('replay-search-input') as HTMLInputElement | null;
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = (e.target as HTMLInputElement).value.trim();
                this.renderTimelineList();
            });
        }

        // Export / Download buttons
        document.getElementById('btn-replay-copy')?.addEventListener('click', () => {
            const jsonStr = CombatLogManager.exportReplayJSON();
            navigator.clipboard.writeText(jsonStr).then(() => {
                const isEn = getLanguage() === 'en';
                HUDController.showAlert(isEn ? "📋 Replay copied to clipboard (JSON)!" : "📋 ¡Repetición copiada al portapapeles en formato JSON!");
                SoundFX.playSpecial();
            }).catch(() => {
                HUDController.showAlert("Error al copiar al portapapeles.");
            });
        });

        document.getElementById('btn-replay-download')?.addEventListener('click', () => {
            CombatLogManager.downloadReplayFile();
            const isEn = getLanguage() === 'en';
            HUDController.showAlert(isEn ? "💾 Downloading replay file (.cgo)..." : "💾 ¡Descargando archivo de repetición (.cgo)...");
            SoundFX.playSpecial();
        });

        // Import file trigger
        const fileInput = document.getElementById('replay-file-input') as HTMLInputElement | null;
        document.getElementById('btn-replay-import-trigger')?.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const raw = event.target?.result as string;
                        const replay = CombatLogManager.importReplayJSON(raw);
                        this.openCombatLogModal(replay);
                        const isEn = getLanguage() === 'en';
                        HUDController.showAlert(isEn ? "📂 Replay loaded successfully!" : "📂 ¡Partida importada y cargada con éxito!");
                        SoundFX.playSpecial();
                    } catch (err: any) {
                        HUDController.showAlert(`❌ Error al importar replay: ${err.message}`);
                        SoundFX.playIllegal();
                    }
                    fileInput.value = ''; // Reset input
                };
                reader.readAsText(file);
            });
        }

        // Close buttons
        document.getElementById('btn-combat-log-close')?.addEventListener('click', () => {
            this.closeCombatLogModal();
            SoundFX.playPlaceStone();
        });
        document.getElementById('btn-combat-log-bottom-close')?.addEventListener('click', () => {
            this.closeCombatLogModal();
            SoundFX.playPlaceStone();
        });
    }

    private static renderWinRateBar(entry: CombatLogEntry): void {
        const wrapper = document.getElementById('replay-winrate-bar-wrapper');
        if (!wrapper) return;

        const winRates = entry.snapshotDetails?.winRates;
        
        if (!winRates) {
            wrapper.classList.add('hidden');
            return;
        }

        wrapper.classList.remove('hidden');

        const pCount = this.activeReplay?.gameConfig?.playerCount || 2;
        
        const seg1 = document.getElementById('replay-winrate-segment-1');
        const seg2 = document.getElementById('replay-winrate-segment-2');
        const seg3 = document.getElementById('replay-winrate-segment-3');
        const seg4 = document.getElementById('replay-winrate-segment-4');
        
        const lbl1 = document.getElementById('replay-winrate-label-1');
        const lbl2 = document.getElementById('replay-winrate-label-2');
        const lbl3 = document.getElementById('replay-winrate-label-3');
        const lbl4 = document.getElementById('replay-winrate-label-4');

        if (seg1 && lbl1) {
            const v = Math.round(winRates[1] || 0);
            seg1.style.width = `${v}%`;
            lbl1.style.width = `${v}%`;
            lbl1.textContent = v >= 5 ? `${v}%` : '';
            seg1.style.display = v > 0 ? 'block' : 'none';
        }
        if (seg2 && lbl2) {
            const v = Math.round(winRates[2] || 0);
            seg2.style.width = `${v}%`;
            lbl2.style.width = `${v}%`;
            lbl2.textContent = v >= 5 ? `${v}%` : '';
            seg2.style.display = v > 0 ? 'block' : 'none';
        }
        if (pCount === 4) {
            if (seg3 && lbl3) {
                const v = Math.round(winRates[3] || 0);
                seg3.style.width = `${v}%`;
                lbl3.style.width = `${v}%`;
                lbl3.textContent = v >= 5 ? `${v}%` : '';
                seg3.style.display = v > 0 ? 'block' : 'none';
            }
            if (seg4 && lbl4) {
                const v = Math.round(winRates[4] || 0);
                seg4.style.width = `${v}%`;
                lbl4.style.width = `${v}%`;
                lbl4.textContent = v >= 5 ? `${v}%` : '';
                seg4.style.display = v > 0 ? 'block' : 'none';
            }
        } else {
            if (seg3) seg3.style.display = 'none';
            if (lbl3) lbl3.style.display = 'none';
            if (seg4) seg4.style.display = 'none';
            if (lbl4) lbl4.style.display = 'none';
        }
    }
}



