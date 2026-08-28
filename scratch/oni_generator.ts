    static generateOniGrid(board: GraphBoard, size: number = 9): void {
        board.shape = 'oni';
        board.size = size;
        const spacing = size === 19 ? 28 : size === 13 ? 36 : 46;
        const starPoints = this.getStarPoints(size);

        const excluded = new Set<string>();

        if (size === 9) {
            // Barbilla
            excluded.add('0,7'); excluded.add('0,8'); excluded.add('1,8');
            excluded.add('8,7'); excluded.add('8,8'); excluded.add('7,8');
            // Cuernos (frente central hendida)
            excluded.add('4,0');
            // Ojos
            excluded.add('2,3'); excluded.add('6,3');
            // Boca
            excluded.add('3,6'); excluded.add('4,6'); excluded.add('5,6');
        } else if (size === 13) {
            // Barbilla
            ['0,10','0,11','0,12','1,11','1,12','2,12'].forEach(id => excluded.add(id));
            ['12,10','12,11','12,12','11,11','11,12','10,12'].forEach(id => excluded.add(id));
            // Cuernos (frente central)
            ['5,0','6,0','7,0', '6,1'].forEach(id => excluded.add(id));
            // Ojos
            ['3,4','4,4', '3,5','4,5'].forEach(id => excluded.add(id));
            ['8,4','9,4', '8,5','9,5'].forEach(id => excluded.add(id));
            // Boca
            ['5,9','6,9','7,9'].forEach(id => excluded.add(id));
        } else {
            // size === 19
            // Barbilla (corte escalonado)
            for(let x=0; x<=4; x++) {
                for(let y=18; y>=18-x; y--) { excluded.add(\,\); excluded.add(\,\); }
            }
            // Frente central
            for(let x=7; x<=11; x++) { excluded.add(\,0\); }
            for(let x=8; x<=10; x++) { excluded.add(\,1\); }
            // Ojos (3x2)
            for(let x=4; x<=6; x++) { excluded.add(\,5\); excluded.add(\,6\); }
            for(let x=12; x<=14; x++) { excluded.add(\,5\); excluded.add(\,6\); }
            // Boca
            for(let x=7; x<=11; x++) { excluded.add(\,13\); }
            for(let x=8; x<=10; x++) { excluded.add(\,14\); }
        }

        // Crear Nodos
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const id = \,\;
                if (excluded.has(id)) continue;
                
                const x = col * spacing;
                const y = row * spacing;
                const isStar = starPoints.some(p => p.x === col && p.y === row);
                
                board.addNode(id, x, y, isStar);
            }
        }

        // Conectar vecinos
        const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const id = \,\;
                if (excluded.has(id)) continue;

                for (const [dx, dy] of directions) {
                    const nx = col + dx;
                    const ny = row + dy;
                    if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                        const nId = \,\;
                        if (!excluded.has(nId)) {
                            board.addEdge(id, nId);
                        }
                    }
                }
            }
        }

        this.calculateBounds(board);
    }
