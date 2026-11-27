#!/usr/bin/env node
// Lê um `uiautomator dump` da entrada padrão e imprime o centro "x y" do
// primeiro nó cujo `content-desc` nomeia o rótulo (o botão da aba vem como
// ", Estante" ou "Estante, tab, 1 of 4"); sem nenhum, o primeiro cujo `text`
// começa com ele.
// O content-desc vem antes porque o título da tela repete o nome da aba.
//
// Uso: adb exec-out cat /sdcard/ui.xml | node scripts/lib/ui-center.mjs Estante

import { readFileSync } from 'node:fs';

const label = process.argv[2];

if (!label) {
  console.error('uso: node scripts/lib/ui-center.mjs <rótulo> < dump.xml');
  process.exit(2);
}

const xml = readFileSync(0, 'utf8');
const nodes = xml.match(/<node\b[^>]*>/g) ?? [];

function attribute(node, name) {
  const match = node.match(new RegExp(`\\b${name}="([^"]*)"`));
  return match ? match[1] : '';
}

// O botão da aba pode vir como "Estante, tab, 1 of 4" ou ", Estante".
const namesTab = (description) =>
  description.startsWith(label) || description.endsWith(`, ${label}`);

const matches = [
  ...nodes.filter((node) => namesTab(attribute(node, 'content-desc'))),
  ...nodes.filter((node) => attribute(node, 'text').startsWith(label)),
];

for (const node of matches) {
  const bounds = attribute(node, 'bounds').match(
    /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/,
  );

  if (!bounds) {
    continue;
  }

  const [left, top, right, bottom] = bounds.slice(1).map(Number);
  console.log(
    `${Math.round((left + right) / 2)} ${Math.round((top + bottom) / 2)}`,
  );
  process.exit(0);
}

process.exit(1);
