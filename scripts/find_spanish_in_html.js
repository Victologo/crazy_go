import fs from 'fs';

const html = fs.readFileSync('./index.html', 'utf8');

const spanishKeywords = [
  'Jugar', 'Atrás', 'Siguiente', 'Comenzar', 'Cancelar', 'Partida',
  'Modo', 'Opciones', 'Dificultad', 'Fácil', 'Medio', 'Difícil', 'Extremo',
  'Jugadores', 'Jugador', 'Reglas', 'Clásico', 'Territorio', 'Komi',
  'Piedras', 'Especiales', 'Habilitado', 'Desactivado', 'Activo', 'Deshacer',
  'Rehacer', 'Pergamino', 'Hechizo', 'Magatamas', 'Santuario', 'Mercader',
  'Cofre', 'Monje', 'Espíritu', 'Victoria', 'Derrota', 'Empate', 'Guardar',
  'Cerrar', 'Mundo', 'Capítulo', 'Lección', 'Misión', 'Intersecciones'
];

const lines = html.split('\n');
const matches = [];

lines.forEach((line, idx) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('<!--') || trimmed.startsWith('*') || trimmed.startsWith('//')) return;
  for (const word of spanishKeywords) {
    // Only if it's text content, not part of a tag name
    if (line.includes(word)) {
      matches.push({ lineNum: idx + 1, text: trimmed, word });
      break;
    }
  }
});

console.log(`Found ${matches.length} matches in index.html:`);
matches.forEach(m => {
  console.log(`L${m.lineNum}: [${m.word}] -> ${m.text.slice(0, 100)}`);
});
