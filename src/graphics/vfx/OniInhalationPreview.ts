// graphics/vfx/OniInhalationPreview.ts - Visualizador Dinámico de Vectores de Inhalación y Devoración Oni
import { GraphBoard } from '../../core/GraphBoard';
import { getLanguage } from '../../i18n/i18n';

export class OniInhalationPreview {
    public static isVisible = false;

    public static show(board: GraphBoard, svgElement: SVGSVGElement | null) {
        if (!svgElement || board.shape !== 'oni') return;
        this.isVisible = true;

        this.hide(svgElement); // Limpiar cualquier capa previa

        const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        layer.setAttribute('id', 'oni-inhalation-preview-layer');
        layer.setAttribute('class', 'oni-inhalation-preview-layer');
        layer.style.pointerEvents = 'none';

        const mouthX = 12;
        const mouthY = 17;
        const spacing = 24;
        const stoneRadius = 18;
        const isEn = getLanguage() === 'en';

        const isInsideMouthCavity = (c: number, r: number) => {
            return (c >= 8 && c <= 16 && (r === 16 || r === 17)) || (c >= 9 && c <= 15 && r === 18);
        };

        // 1. Identificar todas las cadenas pesadas (4+ piedras) para excluirlas de flechas y ruido
        const heavyChainNodeIds = new Set<string>();
        const heavyChains: Set<string>[] = [];
        const evaluatedChains = new Set<string>();

        for (const [nodeId, node] of board.nodes.entries()) {
            if (!node.stone || node.terrain === 'DESTROYED' || evaluatedChains.has(nodeId)) continue;

            const chain = board.getChain(nodeId);
            for (const id of chain) evaluatedChains.add(id);

            if (chain.size >= 4) {
                heavyChains.push(chain);
                for (const id of chain) {
                    heavyChainNodeIds.add(id);
                }
            }
        }

        // 2. Campo de Vectores Gravitacionales (Flechas de Viento alineadas a las aristas ortogonales)
        const vectorFieldGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        vectorFieldGroup.setAttribute('class', 'oni-vector-field');

        for (let r = 2; r <= 22; r += 2) {
            for (let c = 2; c <= 22; c += 2) {
                const nodeId = `${c},${r}`;
                const node = board.nodes.get(nodeId);
                // Si no existe, está destruido, es la boca o pertenece a un grupo inmune: NO dibujar flechas
                if (!node || node.terrain === 'DESTROYED' || isInsideMouthCavity(c, r) || heavyChainNodeIds.has(nodeId)) {
                    continue;
                }

                const dc = mouthX - c;
                const dr = mouthY - r;
                if (dc === 0 && dr === 0) continue;

                // Determinar dirección ortogonal estricta a lo largo de las aristas del tablero
                let stepC = 0;
                let stepR = 0;
                if (Math.abs(dr) >= Math.abs(dc)) {
                    stepR = dr > 0 ? 1 : -1;
                } else {
                    stepC = dc > 0 ? 1 : -1;
                }

                const arrowLen = 13;
                const startX = node.x - stepC * 5;
                const startY = node.y - stepR * 5;
                const endX = node.x + stepC * (arrowLen - 5);
                const endY = node.y + stepR * (arrowLen - 5);

                // Línea de sombra de alto contraste para visibilidad sobre la madera y líneas urushi
                const shadowLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                shadowLine.setAttribute('x1', startX.toString());
                shadowLine.setAttribute('y1', startY.toString());
                shadowLine.setAttribute('x2', endX.toString());
                shadowLine.setAttribute('y2', endY.toString());
                shadowLine.setAttribute('stroke', 'rgba(15, 23, 42, 0.85)');
                shadowLine.setAttribute('stroke-width', '3.5');
                shadowLine.setAttribute('stroke-linecap', 'round');
                vectorFieldGroup.appendChild(shadowLine);

                // Línea de neón magenta vibrante
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', startX.toString());
                line.setAttribute('y1', startY.toString());
                line.setAttribute('x2', endX.toString());
                line.setAttribute('y2', endY.toString());
                line.setAttribute('stroke', '#e879f9');
                line.setAttribute('stroke-width', '2');
                line.setAttribute('stroke-linecap', 'round');
                vectorFieldGroup.appendChild(line);

                // Punta de flecha triangular nítida
                const headLen = 4.5;
                const headWidth = 3.5;
                let p1X = 0, p1Y = 0, p2X = 0, p2Y = 0;

                if (stepR !== 0) {
                    // Vertical (hacia arriba o hacia abajo)
                    p1X = endX - headWidth;
                    p1Y = endY - stepR * headLen;
                    p2X = endX + headWidth;
                    p2Y = endY - stepR * headLen;
                } else {
                    // Horizontal (hacia izquierda o hacia derecha)
                    p1X = endX - stepC * headLen;
                    p1Y = endY - headWidth;
                    p2X = endX - stepC * headLen;
                    p2Y = endY + headWidth;
                }

                const head = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                head.setAttribute('points', `${endX},${endY} ${p1X},${p1Y} ${p2X},${p2Y}`);
                head.setAttribute('fill', '#fdf4ff');
                head.setAttribute('stroke', '#e879f9');
                head.setAttribute('stroke-width', '1');
                vectorFieldGroup.appendChild(head);
            }
        }
        layer.appendChild(vectorFieldGroup);

        // 3. Resaltado de las Fauces del Abismo (Zona de Devoración Inmediata)
        const mouthGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        mouthGroup.setAttribute('class', 'oni-mouth-glow-zone');

        const mouthGlow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        mouthGlow.setAttribute('cx', (12 * spacing).toString());
        mouthGlow.setAttribute('cy', (17 * spacing).toString());
        mouthGlow.setAttribute('rx', (5.2 * spacing).toString());
        mouthGlow.setAttribute('ry', (1.8 * spacing).toString());
        mouthGlow.setAttribute('fill', 'rgba(220, 38, 38, 0.28)');
        mouthGlow.setAttribute('stroke', '#ef4444');
        mouthGlow.setAttribute('stroke-width', '2.5');
        mouthGlow.setAttribute('stroke-dasharray', '6,4');
        mouthGroup.appendChild(mouthGlow);

        const mouthLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        mouthLabel.setAttribute('x', (12 * spacing).toString());
        mouthLabel.setAttribute('y', (17 * spacing + 4).toString());
        mouthLabel.setAttribute('text-anchor', 'middle');
        mouthLabel.setAttribute('font-family', 'sans-serif');
        mouthLabel.setAttribute('font-size', '11px');
        mouthLabel.setAttribute('font-weight', '900');
        mouthLabel.setAttribute('fill', '#fecaca');
        mouthLabel.setAttribute('filter', 'drop-shadow(0 2px 5px rgba(0,0,0,0.95))');
        mouthLabel.textContent = isEn ? '🕳️ MAW (DEVOURS STONES)' : '🕳️ FAUCES (DEVORA PIEDRAS)';
        mouthGroup.appendChild(mouthLabel);

        layer.appendChild(mouthGroup);

        // 4. Renderizado de Grupos Inmunes Compartidos (Cadenas Pesadas >= 4 piedras)
        // Máscara azul cian continua unificada sin solapes internos
        const heavyGroupsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        heavyGroupsLayer.setAttribute('class', 'oni-heavy-groups-layer');

        for (const chain of heavyChains) {
            const chainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

            const nodesInChain: { id: string; c: number; r: number; x: number; y: number }[] = [];
            for (const id of chain) {
                const node = board.nodes.get(id);
                if (!node) continue;
                const parts = id.split(',');
                const c = parseInt(parts[0], 10);
                const r = parseInt(parts[1], 10);
                nodesInChain.push({ id, c, r, x: node.x, y: node.y });
            }

            // A) Relleno suave unificado mediante cápsulas conectadas
            for (const item of nodesInChain) {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', item.x.toString());
                circle.setAttribute('cy', item.y.toString());
                circle.setAttribute('r', (stoneRadius * 1.18).toString());
                circle.setAttribute('fill', 'rgba(14, 165, 233, 0.22)');
                chainGroup.appendChild(circle);
            }

            for (let i = 0; i < nodesInChain.length; i++) {
                for (let j = i + 1; j < nodesInChain.length; j++) {
                    const a = nodesInChain[i];
                    const b = nodesInChain[j];
                    if (Math.abs(a.c - b.c) + Math.abs(a.r - b.r) === 1) {
                        const conn = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        conn.setAttribute('x1', a.x.toString());
                        conn.setAttribute('y1', a.y.toString());
                        conn.setAttribute('x2', b.x.toString());
                        conn.setAttribute('y2', b.y.toString());
                        conn.setAttribute('stroke', 'rgba(14, 165, 233, 0.22)');
                        conn.setAttribute('stroke-width', (stoneRadius * 2.36).toString());
                        conn.setAttribute('stroke-linecap', 'round');
                        chainGroup.appendChild(conn);
                    }
                }
            }

            // B) Borde Exterior Unificado (Perímetro Exterior Compartido sin líneas internas)
            const cellHalf = spacing / 2;
            for (const item of nodesInChain) {
                const hasTop = chain.has(`${item.c},${item.r - 1}`);
                const hasRight = chain.has(`${item.c + 1},${item.r}`);
                const hasBottom = chain.has(`${item.c},${item.r + 1}`);
                const hasLeft = chain.has(`${item.c - 1},${item.r}`);

                const drawExteriorEdge = (x1: number, y1: number, x2: number, y2: number) => {
                    const edgeLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    edgeLine.setAttribute('x1', x1.toString());
                    edgeLine.setAttribute('y1', y1.toString());
                    edgeLine.setAttribute('x2', x2.toString());
                    edgeLine.setAttribute('y2', y2.toString());
                    edgeLine.setAttribute('stroke', '#38bdf8');
                    edgeLine.setAttribute('stroke-width', '2.5');
                    edgeLine.setAttribute('stroke-linecap', 'round');
                    edgeLine.setAttribute('stroke-dasharray', '5,3');
                    edgeLine.setAttribute('filter', 'drop-shadow(0 0 5px rgba(56, 189, 248, 0.75))');
                    chainGroup.appendChild(edgeLine);
                };

                if (!hasTop) drawExteriorEdge(item.x - cellHalf, item.y - cellHalf, item.x + cellHalf, item.y - cellHalf);
                if (!hasRight) drawExteriorEdge(item.x + cellHalf, item.y - cellHalf, item.x + cellHalf, item.y + cellHalf);
                if (!hasBottom) drawExteriorEdge(item.x - cellHalf, item.y + cellHalf, item.x + cellHalf, item.y + cellHalf);
                if (!hasLeft) drawExteriorEdge(item.x - cellHalf, item.y - cellHalf, item.x - cellHalf, item.y + cellHalf);
            }

            // C) Badge Centrado de Fortaleza Inmune
            const avgX = nodesInChain.reduce((sum, n) => sum + n.x, 0) / nodesInChain.length;
            const avgY = nodesInChain.reduce((sum, n) => sum + n.y, 0) / nodesInChain.length;

            const badgeBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            const badgeW = isEn ? 120 : 135;
            badgeBg.setAttribute('x', (avgX - badgeW / 2).toString());
            badgeBg.setAttribute('y', (avgY - 11).toString());
            badgeBg.setAttribute('width', badgeW.toString());
            badgeBg.setAttribute('height', '22');
            badgeBg.setAttribute('rx', '11');
            badgeBg.setAttribute('fill', 'rgba(15, 23, 42, 0.92)');
            badgeBg.setAttribute('stroke', '#38bdf8');
            badgeBg.setAttribute('stroke-width', '1.5');
            badgeBg.setAttribute('filter', 'drop-shadow(0 2px 6px rgba(0,0,0,0.85))');
            chainGroup.appendChild(badgeBg);

            const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            badgeText.setAttribute('x', avgX.toString());
            badgeText.setAttribute('y', (avgY + 4).toString());
            badgeText.setAttribute('text-anchor', 'middle');
            badgeText.setAttribute('font-family', 'sans-serif');
            badgeText.setAttribute('font-size', '10px');
            badgeText.setAttribute('font-weight', 'bold');
            badgeText.setAttribute('fill', '#bae6fd');
            badgeText.textContent = isEn ? `🛡️ Immune (${chain.size} stones)` : `🛡️ Inmune (${chain.size} piedras)`;
            chainGroup.appendChild(badgeText);

            heavyGroupsLayer.appendChild(chainGroup);
        }
        layer.appendChild(heavyGroupsLayer);

        // 5. Análisis de Grupos Ligeros en Peligro (1 a 3 piedras)
        // Flechas con puntas prominentes a lo largo de las aristas exactas y halos de peligro
        const lightStonesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        lightStonesGroup.setAttribute('class', 'oni-light-stones-zone');

        for (const [nodeId, node] of board.nodes.entries()) {
            if (!node.stone || node.terrain === 'DESTROYED' || heavyChainNodeIds.has(nodeId)) continue;

            const parts = nodeId.split(',');
            const c = parseInt(parts[0], 10);
            const r = parseInt(parts[1], 10);
            if (isNaN(c) || isNaN(r)) continue;

            const dc = mouthX - c;
            const dr = mouthY - r;
            const stepC = dc === 0 ? 0 : dc > 0 ? 1 : -1;
            const stepR = dr === 0 ? 0 : dr > 0 ? 1 : -1;

            // Determinar casilla destino ortogonal exacta según el algoritmo del juego
            let targetC = c;
            let targetR = r;
            let moveStepC = 0;
            let moveStepR = 0;

            if (Math.abs(dr) >= Math.abs(dc)) {
                targetR += stepR;
                moveStepR = stepR;
            } else {
                targetC += stepC;
                moveStepC = stepC;
            }

            const willBeDevoured = isInsideMouthCavity(targetC, targetR);

            // Halo circular de peligro sobre la piedra
            const pullHalo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            pullHalo.setAttribute('cx', node.x.toString());
            pullHalo.setAttribute('cy', node.y.toString());
            pullHalo.setAttribute('r', (stoneRadius * 1.25).toString());
            pullHalo.setAttribute('fill', willBeDevoured ? 'rgba(239, 68, 68, 0.28)' : 'rgba(217, 70, 239, 0.2)');
            pullHalo.setAttribute('stroke', willBeDevoured ? '#ef4444' : '#d946ef');
            pullHalo.setAttribute('stroke-width', '2.5');
            pullHalo.setAttribute('stroke-dasharray', '4,2');
            pullHalo.setAttribute('filter', `drop-shadow(0 0 6px ${willBeDevoured ? '#ef4444' : '#d946ef'})`);
            lightStonesGroup.appendChild(pullHalo);

            // Flecha ortogonal a lo largo de la arista hacia la casilla destino
            const targetNode = board.nodes.get(`${targetC},${targetR}`);
            const targetX = targetNode ? targetNode.x : (targetC * spacing);
            const targetY = targetNode ? targetNode.y : (targetR * spacing);

            // Sombra de contraste de la flecha de la piedra
            const trajShadow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            trajShadow.setAttribute('x1', node.x.toString());
            trajShadow.setAttribute('y1', node.y.toString());
            trajShadow.setAttribute('x2', targetX.toString());
            trajShadow.setAttribute('y2', targetY.toString());
            trajShadow.setAttribute('stroke', 'rgba(15, 23, 42, 0.9)');
            trajShadow.setAttribute('stroke-width', '5');
            trajShadow.setAttribute('stroke-linecap', 'round');
            lightStonesGroup.appendChild(trajShadow);

            // Línea principal de la trayectoria
            const trajLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            trajLine.setAttribute('x1', node.x.toString());
            trajLine.setAttribute('y1', node.y.toString());
            trajLine.setAttribute('x2', targetX.toString());
            trajLine.setAttribute('y2', targetY.toString());
            trajLine.setAttribute('stroke', willBeDevoured ? '#ff1e1e' : '#f43f5e');
            trajLine.setAttribute('stroke-width', '3.2');
            trajLine.setAttribute('stroke-linecap', 'round');
            lightStonesGroup.appendChild(trajLine);

            // Punta de flecha prominente en la casilla de destino
            const headLen = 7;
            const headWidth = 5;
            let hp1X = 0, hp1Y = 0, hp2X = 0, hp2Y = 0;

            if (moveStepR !== 0) {
                hp1X = targetX - headWidth;
                hp1Y = targetY - moveStepR * headLen;
                hp2X = targetX + headWidth;
                hp2Y = targetY - moveStepR * headLen;
            } else {
                hp1X = targetX - moveStepC * headLen;
                hp1Y = targetY - headWidth;
                hp2X = targetX - moveStepC * headLen;
                hp2Y = targetY + headWidth;
            }

            const trajHead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            trajHead.setAttribute('points', `${targetX},${targetY} ${hp1X},${hp1Y} ${hp2X},${hp2Y}`);
            trajHead.setAttribute('fill', willBeDevoured ? '#ff1e1e' : '#f43f5e');
            trajHead.setAttribute('stroke', '#ffffff');
            trajHead.setAttribute('stroke-width', '1.2');
            trajHead.setAttribute('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))');
            lightStonesGroup.appendChild(trajHead);

            // Indicador de calavera si va a ser devorada por la boca
            if (willBeDevoured) {
                const skull = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                skull.setAttribute('x', node.x.toString());
                skull.setAttribute('y', (node.y + 4.5).toString());
                skull.setAttribute('text-anchor', 'middle');
                skull.setAttribute('font-size', '14px');
                skull.setAttribute('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))');
                skull.textContent = '💀';
                lightStonesGroup.appendChild(skull);
            }
        }

        layer.appendChild(lightStonesGroup);
        svgElement.appendChild(layer);
    }

    public static hide(svgElement: SVGSVGElement | null) {
        this.isVisible = false;
        if (!svgElement) return;
        const layer = svgElement.querySelector('#oni-inhalation-preview-layer');
        if (layer) layer.remove();
    }
}
