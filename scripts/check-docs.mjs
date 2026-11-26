#!/usr/bin/env node
/**
 * Confere a saúde da documentação, sem dependências (Node >= 18):
 *
 * 1. links relativos e <img src> entre `.md` (ignora http(s), mailto, #âncora
 *    e blocos de código);
 * 2. orçamento de linhas: AGENTS.md, CURRENT.md e specs de sessão;
 * 3. {{PLACEHOLDER}} esquecido em qualquer .md (exceto docs/sessions/_TEMPLATE.md);
 * 4. histórico disfarçado de referência ("## Cobertura da SXX") em docs/reference/.
 *
 * Escopo: *.md na raiz e em docs/. Sem checagem de link nos históricos:
 * CHANGELOG.md, docs/releases/, o corpo dos ADRs e docs/sessions/ (a spec cita
 * arquivos que ainda vão existir). O índice docs/adr/README.md é checado.
 *
 * Gêmeo em Python: scripts/check_docs.py (mesmas regras, mesma saída).
 *
 * Uso: node scripts/check-docs.mjs
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SKIP_DIRS = new Set([
  '.git',
  '.venv',
  '.pytest_cache',
  '.temp',
  'backups',
  'build',
  'dist',
  'node_modules',
  'output',
  'tmp',
]);
const SKIP_LINKS = [
  'CHANGELOG.md',
  'docs/releases/',
  'docs/sessions/',
];
const NO_PLACEHOLDER_CHECK = ['docs/sessions/_TEMPLATE.md'];
const BUDGETS = [
  { file: 'AGENTS.md', max: 100 },
  { file: 'docs/state/CURRENT.md', max: 60 },
];
const SESSION_MAX = 90;
const PLACEHOLDER = /\{\{[A-Z][A-Z0-9_/]*\}\}/;

const errors = [];
let checkedFiles = 0;
let checkedLinks = 0;

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name))
        files.push(...walk(path.join(dir, entry.name)));
    } else if (entry.name.endsWith('.md')) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

function collect() {
  const files = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => path.join(root, e.name));
  const docs = path.join(root, 'docs');
  if (existsSync(docs)) files.push(...walk(docs));
  return files;
}

const relative = (file) => path.relative(root, file).replaceAll('\\', '/');

function lineCount(file) {
  const text = readFileSync(file, 'utf8').replace(/\r?\n$/, '');
  return text.split(/\r?\n/).length;
}

function safeDecode(target) {
  try {
    return decodeURI(target);
  } catch {
    return target;
  }
}

function checkLinks(file) {
  const rel = relative(file);
  if (SKIP_LINKS.some((skip) => rel === skip || rel.startsWith(skip))) return;
  if (rel.startsWith('docs/adr/') && rel !== 'docs/adr/README.md') return;

  const linkPattern = /\]\(([^)\s]+)\)/g;
  const imagePattern = /<img[^>]+src="([^"]+)"/gi;
  let inFence = false;

  const checkTarget = (target, lineNumber) => {
    if (/^(https?:|mailto:|#|<)/.test(target)) return;
    checkedLinks += 1;
    const clean = safeDecode(target.split('#')[0].split('?')[0]);
    if (!clean) return;
    if (!existsSync(path.resolve(path.dirname(file), clean))) {
      errors.push(`${rel}:${lineNumber} link quebrado -> ${target}`);
    }
  };

  readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line, index) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return;
      }
      if (inFence) return;
      for (const m of line.matchAll(linkPattern)) checkTarget(m[1], index + 1);
      for (const m of line.matchAll(imagePattern)) checkTarget(m[1], index + 1);
    });
}

function checkBudget(file) {
  const rel = relative(file);
  const budget = BUDGETS.find((item) => item.file === rel);
  if (budget) {
    const lines = lineCount(file);
    if (lines > budget.max)
      errors.push(`${rel}: ${lines} linhas (máx. ${budget.max})`);
  }
  if (rel.startsWith('docs/sessions/') && !rel.endsWith('_TEMPLATE.md')) {
    const lines = lineCount(file);
    if (lines > SESSION_MAX)
      errors.push(`${rel}: ${lines} linhas (spec máx. ${SESSION_MAX})`);
  }
}

function checkPlaceholders(file) {
  const rel = relative(file);
  if (NO_PLACEHOLDER_CHECK.includes(rel)) return;
  readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line, index) => {
      const m = line.match(PLACEHOLDER);
      if (m)
        errors.push(`${rel}:${index + 1} placeholder esquecido -> ${m[0]}`);
    });
}

function checkReferenceHistory(file) {
  const rel = relative(file);
  if (!rel.startsWith('docs/reference/')) return;
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(
    /^##+\s+(Cobertura da S.+|S\d+[a-z]?\b.*)$/gim,
  )) {
    errors.push(`${rel}: heading de histórico -> "${m[0].trim()}"`);
  }
}

for (const file of collect()) {
  checkedFiles += 1;
  checkLinks(file);
  checkBudget(file);
  checkPlaceholders(file);
  checkReferenceHistory(file);
}

if (errors.length > 0) {
  console.error(
    `docs: ${errors.length} problema(s) em ${checkedFiles} arquivos`,
  );
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const openingBytes = ['AGENTS.md', 'docs/state/CURRENT.md']
  .map((f) => path.join(root, f))
  .filter((f) => existsSync(f))
  .reduce((sum, f) => sum + statSync(f).size, 0);

console.log(
  `docs ok: ${checkedFiles} arquivos, ${checkedLinks} links; ` +
    `abertura (AGENTS+CURRENT) ≈ ${Math.round(openingBytes / 4)} tokens`,
);
