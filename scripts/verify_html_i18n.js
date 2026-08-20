import fs from 'fs';

const html = fs.readFileSync('./index.html', 'utf8');

// Check all elements with data-i18n or data-i18n-html or data-i18n-placeholder
const i18nMatches = [...html.matchAll(/data-i18n(?:-html|-placeholder|-title)?="([^"]+)"/g)].map(m => m[1]);

console.log(`Found ${i18nMatches.length} i18n hooks in index.html.`);

// Read translations.ts
const transFile = fs.readFileSync('./src/i18n/translations.ts', 'utf8');

const missingInTranslations = [];
for (const key of i18nMatches) {
  if (!transFile.includes(`"${key}":`)) {
    missingInTranslations.push(key);
  }
}

if (missingInTranslations.length > 0) {
  console.log(`WARNING: ${missingInTranslations.length} keys in index.html not found in translations.ts:`, missingInTranslations);
} else {
  console.log('SUCCESS: All data-i18n keys in index.html are present in translations.ts!');
}
