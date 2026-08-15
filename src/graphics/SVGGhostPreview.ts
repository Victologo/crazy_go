// graphics/SVGGhostPreview.ts - Gestión de Previsualización Fantasma (Ghost Preview, Poliminós y Tooltips sobre Goban)
import type { GraphBoard, BoardNode } from '../core/GraphBoard';
import type { GameState } from '../core/GameState';
import { PolyominoManager } from '../core/PolyominoManager';
import { ChampionManager } from '../core/ChampionManager';

export class SVGGhostPreview {
    public static renderGhost(
        svgElement: SVGSVGElement,
        board: GraphBoard,
        state: GameState,
        node: BoardNode,
        stoneRadius: number
    ) {
        this.clearGhost();

        const ghostGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        ghostGroup.setAttribute("id", "ghost-preview");
        ghostGroup.style.pointerEvents = 'none';

        const polyType = PolyominoManager.activePolyomino;

        let ghostFill = "rgba(20, 20, 20, 0.45)";
        let ghostStroke = "#000000";

        if (state.currentPlayer === 2) {
            ghostFill = "rgba(255, 255, 255, 0.65)";
            ghostStroke = "#cbd5e1";
        } else if (state.currentPlayer === 3) {
            ghostFill = "rgba(16, 185, 129, 0.55)";
            ghostStroke = "#10b981";
        } else if (state.currentPlayer === 4) {
            ghostFill = "rgba(139, 92, 246, 0.55)";
            ghostStroke = "#8b5cf6";
        }

        // 1. Preview de Zona de Lluvia Meteórica (Tengu)
        if (ChampionManager.currentTargetingMode === 'meteor_5x5') {
            const zoneNodes = ChampionManager.getMeteorZoneNodes(board, node.id);
            if (zoneNodes.length > 0) {
                const meteorGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                meteorGroup.setAttribute("id", "ghost-preview");
                meteorGroup.setAttribute("class", "meteor-target-preview-group");
                meteorGroup.style.pointerEvents = 'none';

                let avgX = 0, minY = 99999;

                for (const zn of zoneNodes) {
                    avgX += zn.x;
                    if (zn.y < minY) minY = zn.y;

                    const isEpicenter = zn.id === node.id;
                    const hasStone = zn.stone !== null;
                    const isEnemy = hasStone && zn.stone!.playerId !== state.currentPlayer;
                    const isFriendly = hasStone && zn.stone!.playerId === state.currentPlayer;

                    // Círculo de área de impacto en cada casilla afectada
                    const blastCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    blastCircle.setAttribute("cx", zn.x.toString());
                    blastCircle.setAttribute("cy", zn.y.toString());
                    blastCircle.setAttribute("r", (stoneRadius * (isEpicenter ? 1.25 : 1.05)).toString());

                    if (isEnemy) {
                        blastCircle.setAttribute("fill", "rgba(239, 68, 68, 0.38)");
                        blastCircle.setAttribute("stroke", "#ef4444");
                        blastCircle.setAttribute("stroke-width", "2.4");
                    } else if (isFriendly) {
                        blastCircle.setAttribute("fill", "rgba(245, 158, 11, 0.32)");
                        blastCircle.setAttribute("stroke", "#f59e0b");
                        blastCircle.setAttribute("stroke-width", "2");
                    } else {
                        blastCircle.setAttribute("fill", "rgba(249, 115, 22, 0.25)");
                        blastCircle.setAttribute("stroke", "#f97316");
                        blastCircle.setAttribute("stroke-width", "1.6");
                    }

                    blastCircle.setAttribute("filter", "url(#glow-meteor)");
                    blastCircle.setAttribute("class", "vfx-meteor-target-pulse");
                    meteorGroup.appendChild(blastCircle);

                    // Anillo de retícula táctica interior
                    const reticle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    reticle.setAttribute("cx", zn.x.toString());
                    reticle.setAttribute("cy", zn.y.toString());
                    reticle.setAttribute("r", (stoneRadius * 0.65).toString());
                    reticle.setAttribute("fill", "none");
                    reticle.setAttribute("stroke", isEnemy ? "#fca5a5" : (isFriendly ? "#fde68a" : "#fed7aa"));
                    reticle.setAttribute("stroke-width", "1.2");
                    reticle.setAttribute("stroke-dasharray", "3,2");
                    meteorGroup.appendChild(reticle);

                    // Marcador de Epicentro
                    if (isEpicenter) {
                        const epicRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        epicRing.setAttribute("cx", zn.x.toString());
                        epicRing.setAttribute("cy", zn.y.toString());
                        epicRing.setAttribute("r", (stoneRadius * 1.5).toString());
                        epicRing.setAttribute("fill", "none");
                        epicRing.setAttribute("stroke", "#ef4444");
                        epicRing.setAttribute("stroke-width", "2.5");
                        epicRing.setAttribute("stroke-dasharray", "6,3");
                        epicRing.setAttribute("class", "vfx-meteor-epicenter-ring");
                        meteorGroup.appendChild(epicRing);

                        const epicIcon = document.createElementNS("http://www.w3.org/2000/svg", "text");
                        epicIcon.setAttribute("x", zn.x.toString());
                        epicIcon.setAttribute("y", (zn.y + 5).toString());
                        epicIcon.setAttribute("text-anchor", "middle");
                        epicIcon.setAttribute("font-size", (stoneRadius * 0.85).toString());
                        epicIcon.textContent = "☄️";
                        meteorGroup.appendChild(epicIcon);
                    }
                }

                avgX /= zoneNodes.length;

                // Tooltip flotante con número de casillas afectadas
                const tooltipGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                const pillBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                const pillText = document.createElementNS("http://www.w3.org/2000/svg", "text");

                const tooltipY = minY - stoneRadius * 1.5;
                const meteorCount = ChampionManager.getMeteorCount(board);
                const pillTextContent = `☄️ Zona de Ataque (${zoneNodes.length} casillas / ${meteorCount} impactos)`;
                const pillWidth = Math.max(200, pillTextContent.length * 8.2);
                const pillHeight = 22;

                pillBg.setAttribute("x", (avgX - pillWidth / 2).toString());
                pillBg.setAttribute("y", (tooltipY - pillHeight / 2).toString());
                pillBg.setAttribute("width", pillWidth.toString());
                pillBg.setAttribute("height", pillHeight.toString());
                pillBg.setAttribute("rx", "11");
                pillBg.setAttribute("fill", "rgba(20, 10, 5, 0.95)");
                pillBg.setAttribute("stroke", "#f97316");
                pillBg.setAttribute("stroke-width", "1.5");
                pillBg.setAttribute("filter", "drop-shadow(0 3px 8px rgba(0,0,0,0.6))");

                pillText.setAttribute("x", avgX.toString());
                pillText.setAttribute("y", (tooltipY + 4.5).toString());
                pillText.setAttribute("text-anchor", "middle");
                pillText.setAttribute("fill", "#fdba74");
                pillText.setAttribute("font-size", "11");
                pillText.setAttribute("font-weight", "800");
                pillText.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
                pillText.textContent = pillTextContent;

                tooltipGroup.appendChild(pillBg);
                tooltipGroup.appendChild(pillText);
                meteorGroup.appendChild(tooltipGroup);

                svgElement.appendChild(meteorGroup);
            }
            return;
        }

        // 1.5 Preview de Objetivo Singular (Ryūjin: Furia del Dragón, Ronin: Inversión, Kitsune: Escudo)
        if (ChampionManager.currentTargetingMode === 'dragon_burn_2' || ChampionManager.currentTargetingMode === 'convert_enemy' || ChampionManager.currentTargetingMode === 'shield_target') {
            const targetingPid = ChampionManager.targetingPlayerId || state.currentPlayer;
            const isValid = ChampionManager.isValidTarget(board, node.id, targetingPid);

            const targetGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            targetGroup.setAttribute("id", "ghost-preview");
            targetGroup.style.pointerEvents = 'none';

            const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            ring.setAttribute("cx", node.x.toString());
            ring.setAttribute("cy", node.y.toString());
            ring.setAttribute("r", (stoneRadius * 1.35).toString());
            ring.setAttribute("fill", isValid ? "rgba(239, 68, 68, 0.25)" : "rgba(100, 100, 100, 0.15)");
            ring.setAttribute("stroke", isValid ? "#ef4444" : "#94a3b8");
            ring.setAttribute("stroke-width", "2.5");
            ring.setAttribute("stroke-dasharray", isValid ? "4,3" : "none");
            targetGroup.appendChild(ring);

            const iconText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            iconText.setAttribute("x", node.x.toString());
            iconText.setAttribute("y", (node.y + 5).toString());
            iconText.setAttribute("text-anchor", "middle");
            iconText.setAttribute("font-size", (stoneRadius * 0.9).toString());
            iconText.textContent = ChampionManager.currentTargetingMode === 'dragon_burn_2' ? "🔥" : (ChampionManager.currentTargetingMode === 'convert_enemy' ? "🌪️" : "🛡️");
            targetGroup.appendChild(iconText);

            if (ChampionManager.currentTargetingMode === 'dragon_burn_2') {
                const tooltipGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                const pillBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                const pillText = document.createElementNS("http://www.w3.org/2000/svg", "text");

                const tooltipY = node.y - stoneRadius * 1.6;
                const pillTextContent = isValid
                    ? `🔥 Calcinar Piedra (${ChampionManager.dragonBurnKillsRemaining} restante(s))`
                    : (node.stone?.isIndestructible ? `🛡️ Piedra Sagrada Inmune` : `⚠️ Selecciona una piedra`);
                const pillWidth = Math.max(160, pillTextContent.length * 7.5);
                const pillHeight = 20;

                pillBg.setAttribute("x", (node.x - pillWidth / 2).toString());
                pillBg.setAttribute("y", (tooltipY - pillHeight / 2).toString());
                pillBg.setAttribute("width", pillWidth.toString());
                pillBg.setAttribute("height", pillHeight.toString());
                pillBg.setAttribute("rx", "10");
                pillBg.setAttribute("fill", "rgba(20, 10, 5, 0.92)");
                pillBg.setAttribute("stroke", isValid ? "#ef4444" : "#64748b");
                pillBg.setAttribute("stroke-width", "1.3");

                pillText.setAttribute("x", node.x.toString());
                pillText.setAttribute("y", (tooltipY + 4).toString());
                pillText.setAttribute("text-anchor", "middle");
                pillText.setAttribute("fill", isValid ? "#fca5a5" : "#cbd5e1");
                pillText.setAttribute("font-size", "10.5");
                pillText.setAttribute("font-weight", "800");
                pillText.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
                pillText.textContent = pillTextContent;

                tooltipGroup.appendChild(pillBg);
                tooltipGroup.appendChild(pillText);
                targetGroup.appendChild(tooltipGroup);
            } else if (ChampionManager.currentTargetingMode === 'convert_enemy') {
                const tooltipGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                const pillBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                const pillText = document.createElementNS("http://www.w3.org/2000/svg", "text");

                const tooltipY = node.y - stoneRadius * 1.6;
                const remaining = ChampionManager.roninInversionsRemaining > 0 
                    ? ChampionManager.roninInversionsRemaining 
                    : ChampionManager.getRoninInversionCount(board);
                const pillTextContent = isValid
                    ? `🌪️ Invertir Color (${remaining} restante(s))`
                    : (node.stone?.isIndestructible ? `🛡️ Piedra Sagrada Inmune` : `⚠️ Selecciona una piedra`);
                const pillWidth = Math.max(160, pillTextContent.length * 7.5);
                const pillHeight = 20;

                pillBg.setAttribute("x", (node.x - pillWidth / 2).toString());
                pillBg.setAttribute("y", (tooltipY - pillHeight / 2).toString());
                pillBg.setAttribute("width", pillWidth.toString());
                pillBg.setAttribute("height", pillHeight.toString());
                pillBg.setAttribute("rx", "10");
                pillBg.setAttribute("fill", "rgba(10, 20, 25, 0.92)");
                pillBg.setAttribute("stroke", isValid ? "#0ea5e9" : "#64748b");
                pillBg.setAttribute("stroke-width", "1.3");

                pillText.setAttribute("x", node.x.toString());
                pillText.setAttribute("y", (tooltipY + 4).toString());
                pillText.setAttribute("text-anchor", "middle");
                pillText.setAttribute("fill", isValid ? "#7dd3fc" : "#cbd5e1");
                pillText.setAttribute("font-size", "10.5");
                pillText.setAttribute("font-weight", "800");
                pillText.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
                pillText.textContent = pillTextContent;

                tooltipGroup.appendChild(pillBg);
                tooltipGroup.appendChild(pillText);
                targetGroup.appendChild(tooltipGroup);
            }

            svgElement.appendChild(targetGroup);
            return;
        }

        // Preview de Poliminós (Germinante 1x1, Dominó 2x1, Monolito 2x2)
        if (polyType && polyType !== 'single') {
            const targetNodeIds = PolyominoManager.getPolyominoTargetNodes(board, node.id, polyType, PolyominoManager.orientation);
            const isValid = PolyominoManager.isValidPolyominoPlacement(board, targetNodeIds);

            const displayFill = isValid ? ghostFill : "rgba(239, 68, 68, 0.45)";
            const displayStroke = isValid ? (polyType === 'sprouting' ? '#10b981' : ghostStroke) : "#ef4444";

            // Si es Dominó 2x1, dibujar cápsula de conexión visual entre ambas piedras
            if (polyType === 'domino' && targetNodeIds.length === 2) {
                const nodeA = board.nodes.get(targetNodeIds[0]);
                const nodeB = board.nodes.get(targetNodeIds[1]);
                if (nodeA && nodeB) {
                    const linkPill = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    linkPill.setAttribute("x1", nodeA.x.toString());
                    linkPill.setAttribute("y1", nodeA.y.toString());
                    linkPill.setAttribute("x2", nodeB.x.toString());
                    linkPill.setAttribute("y2", nodeB.y.toString());
                    linkPill.setAttribute("stroke", displayStroke);
                    linkPill.setAttribute("stroke-width", (stoneRadius * 1.6).toString());
                    linkPill.setAttribute("stroke-linecap", "round");
                    linkPill.setAttribute("opacity", isValid ? "0.35" : "0.2");
                    ghostGroup.appendChild(linkPill);
                }
            }

            for (const nid of targetNodeIds) {
                const targetNode = board.nodes.get(nid);
                if (targetNode) {
                    const ghostCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    ghostCircle.setAttribute("cx", targetNode.x.toString());
                    ghostCircle.setAttribute("cy", targetNode.y.toString());
                    ghostCircle.setAttribute("r", (stoneRadius * 0.95).toString());
                    ghostCircle.setAttribute("fill", displayFill);
                    ghostCircle.setAttribute("stroke", displayStroke);
                    ghostCircle.setAttribute("stroke-width", "1.6");
                    if (!isValid) {
                        ghostCircle.setAttribute("stroke-dasharray", "3,3");
                    }
                    ghostGroup.appendChild(ghostCircle);

                    if (polyType === 'sprouting') {
                        const sproutText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                        sproutText.setAttribute("x", targetNode.x.toString());
                        sproutText.setAttribute("y", (targetNode.y + 4).toString());
                        sproutText.setAttribute("text-anchor", "middle");
                        sproutText.setAttribute("font-size", (stoneRadius * 0.75).toString());
                        sproutText.textContent = "🌿";
                        ghostGroup.appendChild(sproutText);
                    }
                }
            }

            // Tooltip flotante indicador de rotación sobre el Dominó
            if (polyType === 'domino' && targetNodeIds.length > 0) {
                let avgX = 0, minY = 99999;
                for (const nid of targetNodeIds) {
                    const tn = board.nodes.get(nid);
                    if (tn) {
                        avgX += tn.x;
                        if (tn.y < minY) minY = tn.y;
                    }
                }
                avgX /= targetNodeIds.length;

                const tooltipGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                const pillBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                const pillText = document.createElementNS("http://www.w3.org/2000/svg", "text");

                const tooltipY = minY - stoneRadius * 1.4;
                const orientSymbol = PolyominoManager.orientation === 'horizontal' ? '⇄ 90º [R]' : '⇅ 90º [R]';

                const pillWidth = 84;
                const pillHeight = 18;
                pillBg.setAttribute("x", (avgX - pillWidth / 2).toString());
                pillBg.setAttribute("y", (tooltipY - pillHeight / 2).toString());
                pillBg.setAttribute("width", pillWidth.toString());
                pillBg.setAttribute("height", pillHeight.toString());
                pillBg.setAttribute("rx", "9");
                pillBg.setAttribute("fill", "rgba(10, 15, 26, 0.92)");
                pillBg.setAttribute("stroke", "#10b981");
                pillBg.setAttribute("stroke-width", "1.2");
                pillBg.setAttribute("filter", "drop-shadow(0 2px 6px rgba(0,0,0,0.5))");

                pillText.setAttribute("x", avgX.toString());
                pillText.setAttribute("y", (tooltipY + 4).toString());
                pillText.setAttribute("text-anchor", "middle");
                pillText.setAttribute("fill", "#6ee7b7");
                pillText.setAttribute("font-size", "10.5");
                pillText.setAttribute("font-weight", "800");
                pillText.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
                pillText.textContent = `🀄 ${orientSymbol}`;

                tooltipGroup.appendChild(pillBg);
                tooltipGroup.appendChild(pillText);
                ghostGroup.appendChild(tooltipGroup);
            }

            svgElement.appendChild(ghostGroup);
            return;
        }

        // Preview Estándar
        const isCaptiveNode = state.captives?.some(c => c.nodeId === node.id && !c.isCaptured);
        if (node.stone !== null || isCaptiveNode) return;

        const ghostCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ghostCircle.setAttribute("cx", node.x.toString());
        ghostCircle.setAttribute("cy", node.y.toString());
        ghostCircle.setAttribute("r", (stoneRadius * 0.95).toString());
        ghostCircle.setAttribute("fill", ghostFill);
        ghostCircle.setAttribute("stroke", ghostStroke);
        ghostCircle.setAttribute("stroke-width", "1.2");

        ghostGroup.appendChild(ghostCircle);
        svgElement.appendChild(ghostGroup);
    }

    public static clearGhost(svgElement?: SVGSVGElement | null) {
        const existingGhost = document.getElementById("ghost-preview");
        if (existingGhost) {
            existingGhost.remove();
        }
        if (svgElement && ChampionManager.currentTargetingMode === 'none') {
            const overlays = svgElement.querySelectorAll(".targeting-overlay");
            overlays.forEach(el => el.remove());
        }
    }

    public static renderTargetingOverlay(
        svgElement: SVGSVGElement,
        board: GraphBoard,
        currentPlayer: any,
        stoneRadius: number
    ) {
        // Eliminar cualquier overlay previo para evitar duplicados o residuos
        const existingOverlays = svgElement.querySelectorAll(".targeting-overlay");
        existingOverlays.forEach(el => el.remove());

        const mode = ChampionManager.currentTargetingMode;
        if (mode === 'none' || mode === 'meteor_5x5') return;

        const overlayGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        overlayGroup.setAttribute("class", "targeting-overlay");
        overlayGroup.style.pointerEvents = 'none';

        for (const [id, node] of board.nodes.entries()) {
            const isValid = ChampionManager.isValidTarget(board, id, currentPlayer);
            if (isValid) {
                const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                halo.setAttribute("cx", node.x.toString());
                halo.setAttribute("cy", node.y.toString());
                halo.setAttribute("r", (stoneRadius * 1.25).toString());
                halo.setAttribute("fill", "none");
                halo.setAttribute("stroke", (mode === 'convert_enemy' || mode === 'dragon_burn_2') ? '#ef4444' : '#f59e0b');
                halo.setAttribute("stroke-width", "2");
                halo.setAttribute("stroke-dasharray", "4,4");
                overlayGroup.appendChild(halo);
            }
        }
        svgElement.appendChild(overlayGroup);
    }
}
