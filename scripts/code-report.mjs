#!/usr/bin/env node
/**
 * Relatório do tamanho do código, sem dependências (Node >= 18):
 *
 * 1. maiores arquivos de `src/` e os que passam do limite soft de linhas;
 * 2. contagem de arquivos e linhas por pasta (cada feature conta sozinha);
 * 3. imports entre features, marcando os que furam o `index.ts` da outra.
 *
 * Ignora testes (`*.test.*`), `src/test-utils/` e gerados
 * (`src/lib/isbn-ranges.ts`); `drizzle/`, `scripts/` e `node_modules` ficam
 * fora porque só `src/` é lido. O limite é aviso, não bloqueio: sai com 0.
 *
 * Uso: node scripts/code-report.mjs [--top N] [--max-lines N]
 */

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src');
const GENERATED = new Set(['src/lib/isbn-ranges.ts']);
const SKIP_DIRS = new Set(['test-utils', '__tests__', 'node_modules']);
const CODE = /\.(ts|tsx|js|jsx|mjs)$/;
const TEST = /\.test\.[jt]sx?$/;

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? Number.NaN : Number(process.argv[index + 1]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

const TOP = option('--top', 10);
const MAX_LINES = option('--max-lines', 250);

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) files.push(...walk(full));
    } else if (CODE.test(entry.name) && !TEST.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const rel = (file) => path.relative(root, file).split(path.sep).join('/');

/** `src/features/<nome>/...` → nome; outra pasta → null. */
function featureOf(file) {
  const match = /^src\/features\/([^/]+)\//.exec(file);
  return match ? match[1] : null;
}

/** Pasta de agrupamento: a feature, ou o primeiro nível de `src/`. */
function groupOf(file) {
  const feature = featureOf(file);
  if (feature) return `src/features/${feature}`;
  const parts = file.split('/');
  return parts.length > 2 ? parts.slice(0, 2).join('/') : 'src';
}

/** Converte o especificador em caminho `src/...` (alias `@/` ou relativo). */
function resolveSpecifier(fromFile, specifier) {
  if (specifier.startsWith('@/')) return `src/${specifier.slice(2)}`;
  if (specifier.startsWith('.')) {
    return rel(path.resolve(root, path.dirname(fromFile), specifier));
  }
  return null;
}

// Pega `from '...'`, `import '...'`, `import('...')` e `require('...')`.
const IMPORT = /(?:from\s+|import\s*\(?\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;

const files = walk(SRC)
  .map((full) => {
    const file = rel(full);
    const text = readFileSync(full, 'utf8');
    return { file, text, lines: text.split('\n').length };
  })
  .filter(({ file }) => !GENERATED.has(file));

// 1. Tamanho
const bySize = [...files].sort((a, b) => b.lines - a.lines);
const over = bySize.filter((f) => f.lines > MAX_LINES);
const total = files.reduce((sum, f) => sum + f.lines, 0);

console.log(`# Code report (src/, sem testes nem gerados)\n`);
console.log(`${files.length} arquivos, ${total} linhas.\n`);
console.log(`## Top ${TOP} por linhas\n`);
for (const f of bySize.slice(0, TOP)) {
  console.log(`${String(f.lines).padStart(5)}  ${f.file}`);
}
console.log(`\n## Acima de ${MAX_LINES} linhas: ${over.length}\n`);
for (const f of over) console.log(`${String(f.lines).padStart(5)}  ${f.file}`);

// 2. Por pasta
const groups = new Map();
for (const f of files) {
  const key = groupOf(f.file);
  const group = groups.get(key) ?? { files: 0, lines: 0 };
  group.files += 1;
  group.lines += f.lines;
  groups.set(key, group);
}
console.log('\n## Por pasta\n');
console.log('arquivos  linhas  pasta');
for (const [key, g] of [...groups].sort((a, b) => b[1].lines - a[1].lines)) {
  console.log(
    `${String(g.files).padStart(8)}  ${String(g.lines).padStart(6)}  ${key}`,
  );
}

// 3. Imports entre features
const edges = new Map();
for (const f of files) {
  const from = featureOf(f.file);
  if (!from) continue;
  for (const [, specifier] of f.text.matchAll(IMPORT)) {
    const target = resolveSpecifier(f.file, specifier);
    if (!target) continue;
    const to = featureOf(`${target}/`);
    if (!to || to === from) continue;
    // Pelo index: o alvo é a própria pasta da feature (ou o index dela).
    const viaIndex = /^src\/features\/[^/]+(\/index(\.[jt]sx?)?)?$/.test(
      target,
    );
    const key = `${from} → ${to}`;
    const edge = edges.get(key) ?? { index: 0, deep: new Set() };
    if (viaIndex) edge.index += 1;
    else edge.deep.add(target.replace(/^src\/features\//, ''));
    edges.set(key, edge);
  }
}
const deepTotal = [...edges.values()].reduce((n, e) => n + e.deep.size, 0);
console.log(
  `\n## Imports entre features: ${edges.size} pares, ${deepTotal} alvos furando o index\n`,
);
for (const [key, e] of [...edges].sort(([a], [b]) => a.localeCompare(b))) {
  const deep = [...e.deep].sort();
  const parts = [];
  if (e.index) parts.push(`index ×${e.index}`);
  if (deep.length) parts.push(`profundo: ${deep.join(', ')}`);
  console.log(`- ${key}: ${parts.join('; ')}`);
}
