import fs from 'fs';

const translationsFile = fs.readFileSync('./src/i18n/translations.ts', 'utf8');

function extractKeys(lang) {
  const match = translationsFile.match(new RegExp(`${lang}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},?\\n\\s*(?:en:|};)`, 'm'));
  if (!match) return new Set();
  const content = match[1];
  const keys = new Set();
  const keyRegex = /"([^"]+)":/g;
  let m;
  while ((m = keyRegex.exec(content)) !== null) {
    keys.add(m[1]);
  }
  return keys;
}

const esKeys = extractKeys('es');
const enKeys = extractKeys('en');

console.log(`ES keys: ${esKeys.size}, EN keys: ${enKeys.size}`);

const missingInEn = [...esKeys].filter(k => !enKeys.has(k));
const missingInEs = [...enKeys].filter(k => !esKeys.has(k));

if (missingInEn.length > 0) {
  console.log('MISSING IN EN:', missingInEn);
} else {
  console.log('All ES keys are in EN!');
}

if (missingInEs.length > 0) {
  console.log('MISSING IN ES:', missingInEs);
} else {
  console.log('All EN keys are in ES!');
}
