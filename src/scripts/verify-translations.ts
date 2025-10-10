/**
 * Translation Verification Script
 * Checks for missing translations between EN and ES files
 */

import enMessages from '../messages/en.json';
import esMessages from '../messages/es.json';

interface TranslationIssue {
  key: string;
  missingIn: 'en' | 'es' | 'both';
  namespace?: string;
}

function getAllKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (
      typeof obj[key] === 'object' &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

function findMissingTranslations() {
  const enKeys = new Set(getAllKeys(enMessages));
  const esKeys = new Set(getAllKeys(esMessages));

  const issues: TranslationIssue[] = [];

  // Find keys in EN but missing in ES
  for (const key of enKeys) {
    if (!esKeys.has(key)) {
      issues.push({ key, missingIn: 'es' });
    }
  }

  // Find keys in ES but missing in EN
  for (const key of esKeys) {
    if (!enKeys.has(key)) {
      issues.push({ key, missingIn: 'en' });
    }
  }

  return issues;
}

function findEmptyTranslations() {
  const emptyKeys: TranslationIssue[] = [];

  function checkEmpty(obj: any, prefix = '', lang: 'en' | 'es') {
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        checkEmpty(obj[key], fullKey, lang);
      } else if (
        obj[key] === '' ||
        obj[key] === null ||
        obj[key] === undefined
      ) {
        emptyKeys.push({ key: fullKey, missingIn: lang });
      }
    }
  }

  checkEmpty(enMessages, '', 'en');
  checkEmpty(esMessages, '', 'es');

  return emptyKeys;
}

console.log('🌐 Translation Verification Report');
console.log('==================================\n');

// Check missing translations
const missing = findMissingTranslations();

if (missing.length === 0) {
  console.log('✅ All translation keys match between EN and ES!');
} else {
  console.log(`⚠️  Found ${missing.length} missing translations:\n`);

  const missingInEs = missing.filter((m) => m.missingIn === 'es');
  const missingInEn = missing.filter((m) => m.missingIn === 'en');

  if (missingInEs.length > 0) {
    console.log(`Missing in Spanish (${missingInEs.length}):`);
    missingInEs.forEach((m) => console.log(`  - ${m.key}`));
    console.log('');
  }

  if (missingInEn.length > 0) {
    console.log(`Missing in English (${missingInEn.length}):`);
    missingInEn.forEach((m) => console.log(`  - ${m.key}`));
    console.log('');
  }
}

// Check empty translations
const empty = findEmptyTranslations();

if (empty.length === 0) {
  console.log('✅ No empty translations found!');
} else {
  console.log(`⚠️  Found ${empty.length} empty translations:\n`);
  empty.forEach((e) => console.log(`  - ${e.key} (${e.missingIn})`));
}

// Summary statistics
const enKeysCount = getAllKeys(enMessages).length;
const esKeysCount = getAllKeys(esMessages).length;

console.log('\n📊 Translation Statistics:');
console.log(`  English keys: ${enKeysCount}`);
console.log(`  Spanish keys: ${esKeysCount}`);
console.log(`  Difference: ${Math.abs(enKeysCount - esKeysCount)}`);

// Check namespaces
console.log('\n📁 Translation Namespaces:');
Object.keys(enMessages).forEach((namespace) => {
  const enCount = getAllKeys((enMessages as any)[namespace]).length;
  const esCount = getAllKeys((esMessages as any)[namespace] || {}).length;
  const status = enCount === esCount ? '✅' : '⚠️ ';
  console.log(`  ${status} ${namespace}: EN(${enCount}) ES(${esCount})`);
});

console.log('\n✨ Verification complete!');

// Exit with error if issues found
if (missing.length > 0 || empty.length > 0) {
  process.exit(1);
}

