#!/usr/bin/env node
/**
 * Gera `src/lib/isbn-ranges.ts` a partir do XML oficial da International ISBN
 * Agency (`export_rangemessage.xml`).
 *
 * Uso:
 *   node scripts/build-isbn-ranges.mjs [caminho-do-xml]
 *
 * Sem caminho, baixa o XML do site da agência (só no desenvolvimento; o app
 * nunca consulta a rede). O arquivo gerado guarda a data e o número de série da
 * mensagem para que a tabela possa ser auditada e regerada depois.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_URL = 'https://www.isbn-international.org/export_rangemessage.xml';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(root, 'src/lib/isbn-ranges.ts');

function text(block, tag) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? match[1].trim() : '';
}

function decode(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

async function loadXml() {
  const local = process.argv[2];

  if (local) {
    return readFile(path.resolve(root, local), 'utf8');
  }

  const response = await fetch(SOURCE_URL);

  if (!response.ok) {
    throw new Error(`Falha ao baixar o XML: HTTP ${response.status}`);
  }

  return response.text();
}

function parse(xml) {
  const source = decode(text(xml, 'MessageSource'));
  const serialNumber = text(xml, 'MessageSerialNumber');
  const messageDate = text(xml, 'MessageDate');

  const eanBlock = xml.match(
    /<EAN\.UCCPrefixes>([\s\S]*?)<\/EAN\.UCCPrefixes>/,
  );
  if (!eanBlock) {
    throw new Error('XML sem EAN.UCCPrefixes');
  }

  const ean = [...eanBlock[1].matchAll(/<Prefix>([\d]+)<\/Prefix>/g)].map(
    (match) => match[1],
  );

  if (ean.length === 0) {
    throw new Error('XML sem prefixos EAN');
  }

  const groupBlock = xml.match(
    /<RegistrationGroups>([\s\S]*?)<\/RegistrationGroups>/,
  );
  if (!groupBlock) {
    throw new Error('XML sem RegistrationGroups');
  }

  const groups = [];
  let ruleCount = 0;

  for (const [, body] of groupBlock[1].matchAll(
    /<Group>([\s\S]*?)<\/Group>/g,
  )) {
    const prefix = text(body, 'Prefix');
    const [e, group] = prefix.split('-');

    if (!e || !group || !ean.includes(e)) {
      throw new Error(`Grupo com prefixo inesperado: ${prefix}`);
    }

    const rules = [...body.matchAll(/<Range>([\s\S]*?)<\/Range>/g)].map(
      (match) => match[1],
    );
    const lengths = [...body.matchAll(/<Length>([\s\S]*?)<\/Length>/g)].map(
      (match) => Number(match[1]),
    );

    if (rules.length !== lengths.length) {
      throw new Error(`Grupo ${prefix} com Range/Length desalinhados`);
    }

    const ranges = rules.map((range, index) => {
      const [start, end] = range.split('-').map(Number);
      return { start, end, length: lengths[index] };
    });

    // O código assume faixas contíguas dentro do grupo: o fim de uma é o início
    // da seguinte menos um. Se a agência mudar isso, quebre aqui em vez de gerar
    // uma tabela silenciosamente errada.
    let expected = ranges[0]?.start ?? 0;

    for (const range of ranges) {
      if (range.start !== expected) {
        throw new Error(`Grupo ${prefix} com lacuna em ${range.start}`);
      }

      if (range.length < 0 || range.length > 7) {
        throw new Error(`Grupo ${prefix} com tamanho ${range.length}`);
      }

      expected = range.end + 1;
    }

    ruleCount += ranges.length;
    groups.push({ prefix, ranges });
  }

  return { source, serialNumber, messageDate, ean, groups, ruleCount };
}

function rulesLiteral(ranges) {
  return ranges.map((range) => `${range.start}:${range.length}`).join(' ');
}

/** Aspas simples, como no resto do projeto. */
function quote(value) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function render({ source, serialNumber, messageDate, ean, groups, ruleCount }) {
  // Uma faixa por linha curta, e o valor na linha seguinte quando a entrada
  // passa de 80 colunas: é assim que o Biome formata, e o arquivo gerado não
  // pode mudar de forma ao rodar o lint.
  const entries = groups
    .map(({ prefix, ranges }) => {
      const value = quote(rulesLiteral(ranges));
      const line = `  ${quote(prefix)}: ${value},`;
      return line.length <= 80 ? line : `  ${quote(prefix)}:\n    ${value},`;
    })
    .join('\n');

  return `/**
 * GERADO — não edite à mão.
 *
 * Tabela de faixas do ISBN da International ISBN Agency, convertida do XML
 * oficial por \`node scripts/build-isbn-ranges.mjs\`. O app nunca consulta a
 * rede: esta é a única fonte de \`src/lib/isbn.ts\`.
 */

export const ISBN_RANGE_MESSAGE = {
  source: ${quote(source)},
  url: ${quote(SOURCE_URL)},
  serialNumber: ${quote(serialNumber)},
  messageDate: ${quote(messageDate)},
  eanPrefixes: [${ean.map(quote).join(', ')}],
  groups: ${groups.length},
  rules: ${ruleCount},
} as const;

/**
 * Faixas por grupo (chave \`EAN-grupo\`), no formato \`inicio:tamanho\` separado
 * por espaço, em ordem crescente. O \`inicio\` é o começo dos 7 dígitos que vêm
 * depois do grupo; o fim de cada faixa é o início da seguinte menos um (a
 * última termina em 9999999). \`tamanho\` 0 marca faixa sem registrante
 * definido, onde não entra hífen.
 */
export const ISBN_GROUP_RULES: Readonly<Record<string, string>> = {
${entries}
};
`;
}

const xml = await loadXml();
const report = parse(xml);
await writeFile(outFile, render(report), 'utf8');

console.log(
  `${report.groups.length} grupos, ${report.ruleCount} faixas — ${report.messageDate}`,
);
console.log(`serial ${report.serialNumber}`);
console.log(`→ ${path.relative(root, outFile)}`);
