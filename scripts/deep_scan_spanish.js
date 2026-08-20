import fs from 'fs';
import path from 'path';

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.html')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walkDir('./src').concat(['./index.html']);

// Words commonly indicating Spanish text in UI / messages
const spanishWords = [
  'Paso ', 'Atrás', 'Siguiente', 'Cancelar', 'Comenzar', 'Jugar',
  'Victoria', 'Derrota', 'Empate', 'Jugador', 'Turno', 'Hechizo',
  'Piedras', 'Deshacer', 'Rehacer', 'Partida', 'Elegir', 'Continuar',
  'Cerrar', 'Guardar', 'Reglas', 'Puntuación', 'Dificultad', 'Fácil',
  'Medio', 'Difícil', 'Extremo', 'Mundo', 'Capítulo', 'Misión',
  'Recompensa', 'Mercader', 'Santuario', 'Tesoro', 'Combate', 'Especiales',
  'Habilitado', 'Desactivado', 'Activo', 'Sin Límite', 'Intersecciones',
  'Cuadrado', 'Erosionado', 'Islas', 'Cruz', 'Triangular', 'Hexagonal',
  'Procedural', 'Pradera', 'Atardecer', 'Lago', 'Vacío', 'Jardín',
  'Guarida', 'Dragón', 'Pergamino', 'Duplicidad', 'Germinante', 'Monolito',
  'Reloj', 'Temporizador', 'Prisioneros', 'Territorio', 'Komi', 'Suicidio',
  'Invasión', 'Captura', 'Piedra Sagrada', 'Escudo Divino', 'Lluvia',
  'Reina Chamana', 'Espíritu Zorro', 'Espadachín', 'Alquimista'
];

console.log('=== SCANNING FOR HARDCODED SPANISH STRINGS ===\n');

for (const file of files) {
  if (file.includes('translations.ts') || file.includes('translations_') || file.includes('audit_')) continue;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const found = [];

  lines.forEach((line, idx) => {
    // Ignore comments
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    
    for (const word of spanishWords) {
      if (line.includes(word)) {
        found.push({ lineNum: idx + 1, text: line.trim(), word });
        break;
      }
    }
  });

  if (found.length > 0) {
    console.log(`\nFILE: ${file} (${found.length} matches)`);
    found.slice(0, 15).forEach(m => {
      console.log(`  L${m.lineNum}: [${m.word}] -> ${m.text.slice(0, 100)}`);
    });
    if (found.length > 15) {
      console.log(`  ... and ${found.length - 15} more`);
    }
  }
}
