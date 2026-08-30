// graphics/SVGGhostPreview.ts - Gestión de Previsualización Fantasma (Ghost Preview, Poliminós y Tooltips sobre Goban)
import type { GraphBoard, BoardNode } from '../core/GraphBoard';
import type { GameState } from '../core/GameState';
import { PolyominoManager } from '../core/PolyominoManager';
import { ChampionManager } from '../core/ChampionManager';
import { RulesEngine } from '../core/RulesEngine';
import { getLanguage } from '../i18n/i18n';
import { TenguChampion } from '../core/champions/TenguChampion';

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
        // Materiales y shaders de Go auténticos 3D para previsualización
        const mappedColor = state.playerColors[state.currentPlayer] || state.currentPlayer;
        const gradFill = mappedColor === 1 ? 'url(#black-stone-grad)' 
            : (mappedColor === 2 ? 'url(#white-stone-grad)' 
            : (mappedColor === 3 ? 'url(#green-stone-grad)' : 'url(#purple-stone-grad)'));
        const polyStroke = mappedColor === 1 ? '#38bdf8' 
            : (mappedColor === 2 ? '#60a5fa' 
            : (mappedColor === 3 ? '#10b981' : '#a855f7'));

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
                        epicRing.setAttribute("r", (stoneRadius * 1.55).toString());
                        epicRing.setAttribute("fill", "none");
                        epicRing.setAttribute("stroke", "#f59e0b");
                        epicRing.setAttribute("stroke-width", "2.5");
                        epicRing.setAttribute("stroke-dasharray", "4,4");
                        epicRing.setAttribute("class", "vfx-meteor-epicenter-ring");
                        meteorGroup.appendChild(epicRing);
                    }
                }

                avgX /= zoneNodes.length;

                // Tooltip Flotante del Epicentro
                const tooltipGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                const pillBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                const pillText = document.createElementNS("http://www.w3.org/2000/svg", "text");

                const tooltipY = minY - stoneRadius * 1.5;
                const isEn = getLanguage() === 'en';
                const meteorCount = TenguChampion.getMeteorCount(board);
                const label = isEn 
                    ? `☄️ Meteor Strike Zone (${meteorCount} shots)`
                    : `☄️ Zona de Lluvia Meteórica (${meteorCount} disparos)`;
                const pillWidth = Math.max(160, label.length * 7.2);
                const pillHeight = 20;

                pillBg.setAttribute("x", (avgX - pillWidth / 2).toString());
                pillBg.setAttribute("y", (tooltipY - pillHeight / 2).toString());
                pillBg.setAttribute("width", pillWidth.toString());
                pillBg.setAttribute("height", pillHeight.toString());
                pillBg.setAttribute("rx", "10");
                pillBg.setAttribute("fill", "rgba(15, 23, 42, 0.95)");
                pillBg.setAttribute("stroke", "#f59e0b");
                pillBg.setAttribute("stroke-width", "1.5");
                pillBg.setAttribute("filter", "drop-shadow(0 4px 10px rgba(0,0,0,0.6))");

                pillText.setAttribute("x", avgX.toString());
                pillText.setAttribute("y", (tooltipY + 4).toString());
                pillText.setAttribute("text-anchor", "middle");
                pillText.setAttribute("fill", "#fde68a");
                pillText.setAttribute("font-size", "11");
                pillText.setAttribute("font-weight", "800");
                pillText.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
                pillText.textContent = label;

                tooltipGroup.appendChild(pillBg);
                tooltipGroup.appendChild(pillText);
                meteorGroup.appendChild(tooltipGroup);

                svgElement.appendChild(meteorGroup);
            }
            return;
        }

        // 2. Targeting Individual de Habilidades (Alquimista / Kitsune / Ryujin)
        if (ChampionManager.currentTargetingMode !== 'none') {
            const isValid = ChampionManager.isValidTarget(board, node.id, state.currentPlayer);
            const targetGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            targetGroup.setAttribute("id", "ghost-preview");
            targetGroup.style.pointerEvents = 'none';

            const mode = ChampionManager.currentTargetingMode;
            const isRyujin = mode === 'dragon_burn_2' || ChampionManager.currentHero === 'ryujin';
            const isAlchemist = mode === 'convert_enemy' || ChampionManager.currentHero === 'alchemist';
            const isKitsune = mode === 'shield_target' || ChampionManager.currentHero === 'kitsune';

            let themeColor = '#0ea5e9';
            let themeBg = 'rgba(14, 165, 233, 0.25)';
            let themeText = '#bae6fd';

            if (isRyujin) {
                themeColor = '#ef4444';
                themeBg = 'rgba(239, 68, 68, 0.25)';
                themeText = '#fca5a5';
            } else if (isKitsune) {
                themeColor = '#f59e0b';
                themeBg = 'rgba(245, 158, 11, 0.25)';
                themeText = '#fde68a';
            }

            const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            halo.setAttribute("cx", node.x.toString());
            halo.setAttribute("cy", node.y.toString());
            halo.setAttribute("r", (stoneRadius * 1.35).toString());
            halo.setAttribute("fill", isValid ? themeBg : "rgba(239, 68, 68, 0.2)");
            halo.setAttribute("stroke", isValid ? themeColor : "#ef4444");
            halo.setAttribute("stroke-width", "2.5");
            halo.setAttribute("stroke-dasharray", isValid ? "4,4" : "2,2");
            targetGroup.appendChild(halo);

            // Tooltip flotante de habilidad
            if (node.stone !== null) {
                const tooltipGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                const pillBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                const pillText = document.createElementNS("http://www.w3.org/2000/svg", "text");

                const tooltipY = node.y - stoneRadius * 1.6;
                const isEn = getLanguage() === 'en';

                let remaining = ChampionManager.activeChargesLeft;
                if (isRyujin) {
                    remaining = ChampionManager.dragonBurnKillsRemaining;
                } else if (isAlchemist) {
                    remaining = ChampionManager.alchemistInversionsRemaining;
                }

                let pillTextContent = "";
                let pillStroke = isValid ? themeColor : "#ef4444";
                let pillTextColor = isValid ? themeText : "#fca5a5";

                if (isValid) {
                    if (isRyujin) {
                        pillTextContent = isEn 
                            ? `🔥 Incinerate Stone (${remaining} left)` 
                            : `🔥 Calcinar Piedra (${remaining} restante(s))`;
                    } else if (isAlchemist) {
                        pillTextContent = isEn 
                            ? `🖌️ Transmute Color (${remaining} left)` 
                            : `🖌️ Transmutar Color (${remaining} restante(s))`;
                    } else if (isKitsune) {
                        pillTextContent = isEn 
                            ? `🛡️ Divine Shield (${remaining} left)` 
                            : `🛡️ Escudo Divino (${remaining} restante(s))`;
                    } else {
                        pillTextContent = isEn 
                            ? `⚡ Target Stone (${remaining} left)` 
                            : `⚡ Casilla Objetivo (${remaining} restante(s))`;
                    }
                } else {
                    if (node.stone?.isIndestructible) {
                        pillTextContent = isEn ? `🛡️ Sacred Stone Immune` : `🛡️ Piedra Sagrada Inmune`;
                    } else {
                        pillTextContent = isEn ? `⚠️ Select a valid stone` : `⚠️ Selecciona una piedra válida`;
                    }
                }

                const pillWidth = Math.max(160, pillTextContent.length * 7.5);
                const pillHeight = 20;

                pillBg.setAttribute("x", (node.x - pillWidth / 2).toString());
                pillBg.setAttribute("y", (tooltipY - pillHeight / 2).toString());
                pillBg.setAttribute("width", pillWidth.toString());
                pillBg.setAttribute("height", pillHeight.toString());
                pillBg.setAttribute("rx", "10");
                pillBg.setAttribute("fill", "rgba(15, 23, 42, 0.95)");
                pillBg.setAttribute("stroke", pillStroke);
                pillBg.setAttribute("stroke-width", "1.5");
                pillBg.setAttribute("filter", "drop-shadow(0 4px 10px rgba(0,0,0,0.6))");

                pillText.setAttribute("x", node.x.toString());
                pillText.setAttribute("y", (tooltipY + 4).toString());
                pillText.setAttribute("text-anchor", "middle");
                pillText.setAttribute("fill", pillTextColor);
                pillText.setAttribute("font-size", "11");
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

        // 3. Preview de Poliminós de Alta Fidelidad 3D (Germinante 1x1, Dominó 2x1, Monolito 2x2)
        if (polyType && polyType !== 'single') {
            const targetNodeIds = PolyominoManager.getPolyominoTargetNodes(board, node.id, polyType, PolyominoManager.orientation);
            const isValid = PolyominoManager.isValidPolyominoPlacement(board, targetNodeIds);

            // A. Dominó 2x1 (Bloque Rectangular de Piedra Maciza con Bisel y Hendidura Central)
            if (polyType === 'domino' && targetNodeIds.length === 2) {
                const nodeA = board.nodes.get(targetNodeIds[0]);
                const nodeB = board.nodes.get(targetNodeIds[1]);
                if (nodeA && nodeB) {
                    const dominoBodyFill = `url(#poly-domino-body-${mappedColor})`;
                    const minX = Math.min(nodeA.x, nodeB.x) - stoneRadius * 0.92;
                    const maxX = Math.max(nodeA.x, nodeB.x) + stoneRadius * 0.92;
                    const minY = Math.min(nodeA.y, nodeB.y) - stoneRadius * 0.92;
                    const maxY = Math.max(nodeA.y, nodeB.y) + stoneRadius * 0.92;
                    const blockW = maxX - minX;
                    const blockH = maxY - minY;
                    const rx = stoneRadius * 0.35;

                    // 1. Sombra base y Bloque Rectangular
                    const block = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    block.setAttribute("x", minX.toString());
                    block.setAttribute("y", minY.toString());
                    block.setAttribute("width", blockW.toString());
                    block.setAttribute("height", blockH.toString());
                    block.setAttribute("rx", rx.toString());
                    block.setAttribute("ry", rx.toString());
                    block.setAttribute("fill", isValid ? dominoBodyFill : "rgba(239, 68, 68, 0.45)");
                    block.setAttribute("stroke", isValid ? polyStroke : "#ef4444");
                    block.setAttribute("stroke-width", "1.4");
                    block.setAttribute("opacity", isValid ? "0.88" : "0.6");
                    block.setAttribute("filter", "url(#stone-shadow)");
                    if (!isValid) block.setAttribute("stroke-dasharray", "4,4");
                    ghostGroup.appendChild(block);

                    // 2. Bisel 3D interior
                    const bevel = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    bevel.setAttribute("x", (minX + 2).toString());
                    bevel.setAttribute("y", (minY + 2).toString());
                    bevel.setAttribute("width", (blockW - 4).toString());
                    bevel.setAttribute("height", (blockH - 4).toString());
                    bevel.setAttribute("rx", (rx * 0.7).toString());
                    bevel.setAttribute("ry", (rx * 0.7).toString());
                    bevel.setAttribute("fill", "none");
                    bevel.setAttribute("stroke", isValid ? (mappedColor === 2 ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)") : "rgba(255,255,255,0.2)");
                    bevel.setAttribute("stroke-width", "1.2");
                    bevel.setAttribute("opacity", "0.85");
                    ghostGroup.appendChild(bevel);

                    // 3. Hendidura divisoria central de sillería
                    const midX = (nodeA.x + nodeB.x) / 2;
                    const midY = (nodeA.y + nodeB.y) / 2;
                    const isHorizontal = Math.abs(nodeA.y - nodeB.y) < 1;

                    const seamShadow = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    const seamLight = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    if (isHorizontal) {
                        seamShadow.setAttribute("x1", midX.toString());
                        seamShadow.setAttribute("y1", (minY + 2.5).toString());
                        seamShadow.setAttribute("x2", midX.toString());
                        seamShadow.setAttribute("y2", (maxY - 2.5).toString());
                        seamLight.setAttribute("x1", (midX + 1.2).toString());
                        seamLight.setAttribute("y1", (minY + 2.5).toString());
                        seamLight.setAttribute("x2", (midX + 1.2).toString());
                        seamLight.setAttribute("y2", (maxY - 2.5).toString());
                    } else {
                        seamShadow.setAttribute("x1", (minX + 2.5).toString());
                        seamShadow.setAttribute("y1", midY.toString());
                        seamShadow.setAttribute("x2", (maxX - 2.5).toString());
                        seamShadow.setAttribute("y2", midY.toString());
                        seamLight.setAttribute("x1", (minX + 2.5).toString());
                        seamLight.setAttribute("y1", (midY + 1.2).toString());
                        seamLight.setAttribute("x2", (maxX - 2.5).toString());
                        seamLight.setAttribute("y2", (midY + 1.2).toString());
                    }
                    seamShadow.setAttribute("stroke", isValid ? "rgba(0, 0, 0, 0.7)" : "#7f1d1d");
                    seamShadow.setAttribute("stroke-width", "1.6");
                    ghostGroup.appendChild(seamShadow);

                    seamLight.setAttribute("stroke", isValid ? (mappedColor === 2 ? "rgba(0,0,0,0.2)" : "rgba(255, 255, 255, 0.35)") : "rgba(255,255,255,0.2)");
                    seamLight.setAttribute("stroke-width", "1.0");
                    ghostGroup.appendChild(seamLight);

                    // 4. Cabezas 3D de piedra de Go engastadas en ambos núcleos
                    [nodeA, nodeB].forEach(n => {
                        const head = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        head.setAttribute("cx", n.x.toString());
                        head.setAttribute("cy", n.y.toString());
                        head.setAttribute("r", (stoneRadius * 0.65).toString());
                        head.setAttribute("fill", isValid ? gradFill : "rgba(239, 68, 68, 0.45)");
                        head.setAttribute("opacity", isValid ? "0.95" : "0.65");
                        ghostGroup.appendChild(head);

                        const coreRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        coreRing.setAttribute("cx", n.x.toString());
                        coreRing.setAttribute("cy", n.y.toString());
                        coreRing.setAttribute("r", (stoneRadius * 0.44).toString());
                        coreRing.setAttribute("fill", "none");
                        coreRing.setAttribute("stroke", isValid ? polyStroke : "#ef4444");
                        coreRing.setAttribute("stroke-width", "1.1");
                        coreRing.setAttribute("stroke-dasharray", "2,2");
                        coreRing.setAttribute("opacity", "0.8");
                        ghostGroup.appendChild(coreRing);
                    });

                    // Tooltip indicador de Duplicidad 2x1 y Atajo [R]
                    const tooltipGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                    const pillBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    const pillText = document.createElementNS("http://www.w3.org/2000/svg", "text");

                    const centerX = (minX + maxX) / 2;
                    const tooltipY = minY - stoneRadius * 1.35;
                    const isEn = getLanguage() === 'en';
                    const orientationLabel = PolyominoManager.orientation === 'horizontal' ? '⇄ 0º' : '⇅ 90º';
                    const label = isEn ? `Duplicity (2x1) ${orientationLabel} [R]` : `Duplicidad (2x1) ${orientationLabel} [R]`;
                    const pillWidth = 145;
                    const pillHeight = 18;

                    pillBg.setAttribute("x", (centerX - pillWidth / 2).toString());
                    pillBg.setAttribute("y", (tooltipY - pillHeight / 2).toString());
                    pillBg.setAttribute("width", pillWidth.toString());
                    pillBg.setAttribute("height", pillHeight.toString());
                    pillBg.setAttribute("rx", "9");
                    pillBg.setAttribute("fill", "rgba(10, 15, 26, 0.92)");
                    pillBg.setAttribute("stroke", isValid ? polyStroke : "#ef4444");
                    pillBg.setAttribute("stroke-width", "1.2");
                    pillBg.setAttribute("filter", "drop-shadow(0 2px 6px rgba(0,0,0,0.5))");

                    pillText.setAttribute("x", centerX.toString());
                    pillText.setAttribute("y", (tooltipY + 4).toString());
                    pillText.setAttribute("text-anchor", "middle");
                    pillText.setAttribute("fill", isValid ? polyStroke : "#fca5a5");
                    pillText.setAttribute("font-size", "10");
                    pillText.setAttribute("font-weight", "700");
                    pillText.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
                    pillText.textContent = label;

                    tooltipGroup.appendChild(pillBg);
                    tooltipGroup.appendChild(pillText);
                    ghostGroup.appendChild(tooltipGroup);
                }
            } else if (polyType === 'monolith' && targetNodeIds.length >= 3) {
                // B. Monolito 2x2 (Textura de Aparejo de Ladrillos Entrelazados 3D)
                const monolithBodyFill = `url(#poly-monolith-body-${mappedColor})`;
                const nodesList = targetNodeIds.map(nid => board.nodes.get(nid)).filter(n => !!n) as BoardNode[];
                if (nodesList.length >= 3) {
                    const minX = Math.min(...nodesList.map(n => n.x)) - stoneRadius * 0.95;
                    const maxX = Math.max(...nodesList.map(n => n.x)) + stoneRadius * 0.95;
                    const minY = Math.min(...nodesList.map(n => n.y)) - stoneRadius * 0.95;
                    const maxY = Math.max(...nodesList.map(n => n.y)) + stoneRadius * 0.95;
                    const rectW = maxX - minX;
                    const rectH = maxY - minY;
                    const rx = stoneRadius * 0.25;

                    // 1. Cama de mortero y fondo estructural del muro
                    const mortarColor = mappedColor === 1 ? "#060911" : (mappedColor === 2 ? "#475569" : (mappedColor === 3 ? "#022c22" : "#2e1065"));
                    const wallBase = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    wallBase.setAttribute("x", minX.toString());
                    wallBase.setAttribute("y", minY.toString());
                    wallBase.setAttribute("width", rectW.toString());
                    wallBase.setAttribute("height", rectH.toString());
                    wallBase.setAttribute("rx", rx.toString());
                    wallBase.setAttribute("ry", rx.toString());
                    wallBase.setAttribute("fill", isValid ? mortarColor : "rgba(239, 68, 68, 0.35)");
                    wallBase.setAttribute("stroke", isValid ? "#f59e0b" : "#ef4444");
                    wallBase.setAttribute("stroke-width", "1.6");
                    wallBase.setAttribute("opacity", isValid ? "0.9" : "0.6");
                    wallBase.setAttribute("filter", "url(#stone-shadow)");
                    if (!isValid) wallBase.setAttribute("stroke-dasharray", "6,4");
                    ghostGroup.appendChild(wallBase);

                    // 2. Aparejo de Ladrillos Entrelazados (Running Bond Masonry Texture)
                    const numRows = 4;
                    const rowH = (rectH - 4) / numRows;
                    const gap = 2.2;

                    for (let r = 0; r < numRows; r++) {
                        const rowY = minY + 2 + r * rowH;
                        const brickH = rowH - gap;

                        let bricks: { x: number; w: number }[] = [];
                        if (r % 2 === 0) {
                            const bw = (rectW - 4 - gap) / 2;
                            bricks = [
                                { x: minX + 2, w: bw },
                                { x: minX + 2 + bw + gap, w: bw }
                            ];
                        } else {
                            const halfW = (rectW - 4 - 2 * gap) * 0.25;
                            const fullW = (rectW - 4 - 2 * gap) * 0.5;
                            bricks = [
                                { x: minX + 2, w: halfW },
                                { x: minX + 2 + halfW + gap, w: fullW },
                                { x: minX + 2 + halfW + gap + fullW + gap, w: halfW }
                            ];
                        }

                        bricks.forEach(b => {
                            const brickRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                            brickRect.setAttribute("x", b.x.toString());
                            brickRect.setAttribute("y", rowY.toString());
                            brickRect.setAttribute("width", b.w.toString());
                            brickRect.setAttribute("height", brickH.toString());
                            brickRect.setAttribute("rx", "1.5");
                            brickRect.setAttribute("ry", "1.5");
                            brickRect.setAttribute("fill", isValid ? monolithBodyFill : "rgba(239, 68, 68, 0.45)");
                            brickRect.setAttribute("stroke", isValid ? (mappedColor === 2 ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.5)") : "#ef4444");
                            brickRect.setAttribute("stroke-width", "0.6");
                            brickRect.setAttribute("opacity", isValid ? "0.92" : "0.6");
                            ghostGroup.appendChild(brickRect);

                            const topHighlight = document.createElementNS("http://www.w3.org/2000/svg", "line");
                            topHighlight.setAttribute("x1", (b.x + 0.8).toString());
                            topHighlight.setAttribute("y1", (rowY + 0.8).toString());
                            topHighlight.setAttribute("x2", (b.x + b.w - 0.8).toString());
                            topHighlight.setAttribute("y2", (rowY + 0.8).toString());
                            topHighlight.setAttribute("stroke", isValid ? (mappedColor === 2 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)") : "rgba(255,255,255,0.2)");
                            topHighlight.setAttribute("stroke-width", "0.8");
                            ghostGroup.appendChild(topHighlight);

                            const botShadow = document.createElementNS("http://www.w3.org/2000/svg", "line");
                            botShadow.setAttribute("x1", (b.x + 0.8).toString());
                            botShadow.setAttribute("y1", (rowY + brickH - 0.6).toString());
                            botShadow.setAttribute("x2", (b.x + b.w - 0.8).toString());
                            botShadow.setAttribute("y2", (rowY + brickH - 0.6).toString());
                            botShadow.setAttribute("stroke", "rgba(0,0,0,0.55)");
                            botShadow.setAttribute("stroke-width", "0.8");
                            ghostGroup.appendChild(botShadow);
                        });
                    }

                    // 3. Remaches y anclajes de sillería dorados en las 4 intersecciones
                    nodesList.forEach(n => {
                        const anchorCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        anchorCircle.setAttribute("cx", n.x.toString());
                        anchorCircle.setAttribute("cy", n.y.toString());
                        anchorCircle.setAttribute("r", (stoneRadius * 0.35).toString());
                        anchorCircle.setAttribute("fill", "none");
                        anchorCircle.setAttribute("stroke", isValid ? "#f59e0b" : "#ef4444");
                        anchorCircle.setAttribute("stroke-width", "1.2");
                        anchorCircle.setAttribute("stroke-dasharray", "2,2");
                        anchorCircle.setAttribute("opacity", "0.85");
                        ghostGroup.appendChild(anchorCircle);

                        const anchorRivet = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        anchorRivet.setAttribute("cx", n.x.toString());
                        anchorRivet.setAttribute("cy", n.y.toString());
                        anchorRivet.setAttribute("r", "2.8");
                        anchorRivet.setAttribute("fill", isValid ? "#fbbf24" : "#ef4444");
                        anchorRivet.setAttribute("stroke", "#78350f");
                        anchorRivet.setAttribute("stroke-width", "0.6");
                        ghostGroup.appendChild(anchorRivet);
                    });

                    // Tooltip indicador de Monolito 2x2
                    const tooltipGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                    const pillBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    const pillText = document.createElementNS("http://www.w3.org/2000/svg", "text");

                    const centerX = (minX + maxX) / 2;
                    const tooltipY = minY - stoneRadius * 1.4;
                    const isEn = getLanguage() === 'en';
                    const label = isEn ? 'Monolith (2x2)' : 'Monolito (2x2)';
                    const pillWidth = 100;
                    const pillHeight = 18;

                    pillBg.setAttribute("x", (centerX - pillWidth / 2).toString());
                    pillBg.setAttribute("y", (tooltipY - pillHeight / 2).toString());
                    pillBg.setAttribute("width", pillWidth.toString());
                    pillBg.setAttribute("height", pillHeight.toString());
                    pillBg.setAttribute("rx", "9");
                    pillBg.setAttribute("fill", "rgba(10, 15, 26, 0.92)");
                    pillBg.setAttribute("stroke", isValid ? "#f59e0b" : "#ef4444");
                    pillBg.setAttribute("stroke-width", "1.2");
                    pillBg.setAttribute("filter", "drop-shadow(0 2px 6px rgba(0,0,0,0.5))");

                    pillText.setAttribute("x", centerX.toString());
                    pillText.setAttribute("y", (tooltipY + 4).toString());
                    pillText.setAttribute("text-anchor", "middle");
                    pillText.setAttribute("fill", isValid ? "#fbbf24" : "#fca5a5");
                    pillText.setAttribute("font-size", "10.5");
                    pillText.setAttribute("font-weight", "800");
                    pillText.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
                    pillText.textContent = label;

                    tooltipGroup.appendChild(pillBg);
                    tooltipGroup.appendChild(pillText);
                    ghostGroup.appendChild(tooltipGroup);
                }
            }

            // C. Piedra Germinante (1x1)
            if (polyType === 'sprouting') {
                for (const nid of targetNodeIds) {
                    const targetNode = board.nodes.get(nid);
                    if (targetNode) {
                        const ghostCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        ghostCircle.setAttribute("cx", targetNode.x.toString());
                        ghostCircle.setAttribute("cy", targetNode.y.toString());
                        ghostCircle.setAttribute("r", stoneRadius.toString());
                        ghostCircle.setAttribute("fill", isValid ? gradFill : "rgba(239, 68, 68, 0.45)");
                        ghostCircle.setAttribute("stroke", isValid ? "#10b981" : "#ef4444");
                        ghostCircle.setAttribute("stroke-width", "1.6");
                        ghostCircle.setAttribute("opacity", isValid ? "0.9" : "0.6");
                        ghostCircle.setAttribute("filter", "url(#stone-shadow)");
                        if (!isValid) ghostCircle.setAttribute("stroke-dasharray", "3,3");
                        ghostGroup.appendChild(ghostCircle);

                        const sproutText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                        sproutText.setAttribute("x", targetNode.x.toString());
                        sproutText.setAttribute("y", (targetNode.y + stoneRadius * 0.32).toString());
                        sproutText.setAttribute("text-anchor", "middle");
                        sproutText.setAttribute("font-size", (stoneRadius * 0.72).toString());
                        sproutText.setAttribute("fill", "#10b981");
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

                const pillWidth = 90;
                const pillHeight = 18;
                pillBg.setAttribute("x", (avgX - pillWidth / 2).toString());
                pillBg.setAttribute("y", (tooltipY - pillHeight / 2).toString());
                pillBg.setAttribute("width", pillWidth.toString());
                pillBg.setAttribute("height", pillHeight.toString());
                pillBg.setAttribute("rx", "9");
                pillBg.setAttribute("fill", "rgba(10, 15, 26, 0.92)");
                pillBg.setAttribute("stroke", isValid ? polyStroke : "#ef4444");
                pillBg.setAttribute("stroke-width", "1.2");
                pillBg.setAttribute("filter", "drop-shadow(0 2px 6px rgba(0,0,0,0.5))");

                pillText.setAttribute("x", avgX.toString());
                pillText.setAttribute("y", (tooltipY + 4).toString());
                pillText.setAttribute("text-anchor", "middle");
                pillText.setAttribute("fill", isValid ? polyStroke : "#fca5a5");
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

        // Preview Estándar con Piedra 3D
        const isCaptiveNode = state.captives?.some(c => (c.nodeId === node.id || c.nodeIds?.includes(node.id)) && !c.isCaptured);
        if (node.stone !== null || isCaptiveNode) return;

        // Comprobar si el movimiento es legal bajo las reglas de Go (Suicidio, Ko, etc.)
        const legality = RulesEngine.isMoveLegal(board, state, node.id, state.currentPlayer);
        if (!legality.isLegal) {
            // Mostrar indicador de jugada prohibida (cruz roja suave)
            const forbiddenCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            forbiddenCircle.setAttribute("cx", node.x.toString());
            forbiddenCircle.setAttribute("cy", node.y.toString());
            forbiddenCircle.setAttribute("r", (stoneRadius * 0.55).toString());
            forbiddenCircle.setAttribute("fill", "rgba(239, 68, 68, 0.25)");
            forbiddenCircle.setAttribute("stroke", "#ef4444");
            forbiddenCircle.setAttribute("stroke-width", "1.5");

            const forbiddenText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            forbiddenText.setAttribute("x", node.x.toString());
            forbiddenText.setAttribute("y", (node.y + 4).toString());
            forbiddenText.setAttribute("text-anchor", "middle");
            forbiddenText.setAttribute("font-size", "13px");
            forbiddenText.setAttribute("font-weight", "bold");
            forbiddenText.setAttribute("fill", "#ef4444");
            forbiddenText.textContent = "✕";

            ghostGroup.appendChild(forbiddenCircle);
            ghostGroup.appendChild(forbiddenText);
            svgElement.appendChild(ghostGroup);
            return;
        }

        const ghostCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ghostCircle.setAttribute("cx", node.x.toString());
        ghostCircle.setAttribute("cy", node.y.toString());
        ghostCircle.setAttribute("r", stoneRadius.toString());
        ghostCircle.setAttribute("fill", gradFill);
        ghostCircle.setAttribute("opacity", "0.75");
        ghostCircle.setAttribute("filter", "url(#stone-shadow)");
        if (mappedColor !== 1) {
            ghostCircle.setAttribute("stroke", mappedColor === 2 ? '#b0a99c' : (mappedColor === 3 ? '#047857' : '#6d28d9'));
            ghostCircle.setAttribute("stroke-width", "0.75");
        }

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
                const strokeColor = mode === 'dragon_burn_2' ? '#ef4444' : (mode === 'convert_enemy' ? '#0ea5e9' : '#f59e0b');
                halo.setAttribute("stroke", strokeColor);
                halo.setAttribute("stroke-width", "2");
                halo.setAttribute("stroke-dasharray", "4,4");
                overlayGroup.appendChild(halo);
            }
        }
        svgElement.appendChild(overlayGroup);
    }
}
