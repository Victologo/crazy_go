import fs from 'fs';

const html = fs.readFileSync('./index.html', 'utf8');

// Find elements with text content that do NOT have data-i18n
const tagRegex = /<([a-zA-Z0-9]+)([^>]*)>([^<]+)<\/\1>/g;
let m;
const unlocalized = [];

while ((m = tagRegex.exec(html)) !== null) {
  const tag = m[1];
  const attrs = m[2];
  const text = m[3].trim();

  if (['script', 'style', 'noscript', 'defs', 'line', 'circle', 'rect', 'path', 'title'].includes(tag)) continue;
  if (!text || text.startsWith('<!--') || /^[0-9\s.,:\-+*/%()➔←→↑↓▲▼⚔️🌿🌅🌙🌌🌸🌋🎲➕🕳️🪨⏹️🔺⬡⚫⚪🟣🟢💎🏆✨⭐🔥⚡🛡️📜🧙🎁⏳☄️☯️🀄🧱🤖👁️🏠🔄🔁▶📋⚙️🇪🇸🇬🇧⌨️✖]+$/.test(text)) continue;

  if (!attrs.includes('data-i18n') && !attrs.includes('data-i18n-html')) {
    unlocalized.push({ tag, attrs: attrs.trim(), text });
  }
}

console.log(`Found ${unlocalized.length} potentially unlocalized text nodes in index.html:`);
unlocalized.forEach((item, i) => {
  console.log(`[${i+1}] <${item.tag} ${item.attrs}> -> "${item.text}"`);
});
