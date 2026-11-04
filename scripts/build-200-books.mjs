// Gera `lebot-200.zip`, o backup fictício usado para medir a Estante cheia.
//
// O fixture da S11 saiu com acentuação quebrada (`Breve RelÃ³gio`), porque foi
// escrito sem cuidar do encoding. Aqui o JSON é serializado em UTF-8 de ponta a
// ponta e o próprio script confere o resultado depois de descompactar.
//
// Uso:
//   node scripts/build-200-books.mjs
//   node scripts/build-200-books.mjs --count=50 --out=lebot-50.zip
//
// O .zip segue o formato do app (`src/features/settings/backup`): `backup.json`
// na raiz e nenhuma capa, para a grade renderizar só as lombadas animadas.

import { writeFileSync } from 'node:fs';

import { strToU8, unzipSync, zipSync } from 'fflate';

const DEFAULT_COUNT = 200;
const DEFAULT_OUT = 'lebot-200.zip';

/** Versão do formato de backup do app (`BACKUP_FORMAT_VERSION`). */
const FORMAT_VERSION = 1;
const APP_VERSION = '0.2.1';
const EXPORTED_AT = '2026-11-03T12:00:00.000Z';

/** Os seis gêneros de fábrica, iguais aos da migração `0002`. */
const GENRES = [
  ['fantasy', 'Fantasia', '#7B69EE', '#B3A7FF', 0],
  ['romance', 'Romance', '#FF6B5B', '#FF9A8F', 1],
  ['nonfiction', 'Não-ficção', '#34C6B8', '#6FE3D6', 2],
  ['classic', 'Clássico', '#2A2340', '#8B84A8', 3],
  ['children', 'Infantojuvenil', '#FFC145', '#FFD980', 4],
  ['horror', 'Terror', '#FF8FA3', '#FFB3C1', 5],
];

const ADJECTIVES = [
  'Breve',
  'Último',
  'Silencioso',
  'Invisível',
  'Doce',
  'Amargo',
  'Lunar',
  'Antigo',
  'Sereno',
  'Inquieto',
  'Perdido',
  'Dourado',
];

const NOUNS = [
  'Relógio',
  'Jardim',
  'Coração',
  'Silêncio',
  'Açúcar',
  'Inverno',
  'Caminho',
  'Abismo',
  'Espelho',
  'Verão',
  'Cartas',
  'Raízes',
];

const PLACES = [
  'de Lisboa',
  'do Sertão',
  'em Copacabana',
  'do Norte',
  'da Ilha',
  'de São Paulo',
  'do Interior',
  '',
];

const AUTHORS = [
  'Clarice Nogueira',
  'João Pessoa',
  'Ágata Muniz',
  'Rafael Cordeiro',
  'Íris Tavares',
  'Manoel de Barros',
  'Cecília Fróes',
  'Tomás Araújo',
  'Lúcia Bragança',
  'Otávio Sá',
  'Benedita Alves',
  'Sebastião Vidal',
];

const STATUSES = [
  'queued',
  'queued',
  'queued',
  'reading',
  'reading',
  'paused',
  'finished',
];

const goalPages = 18;

/** PRNG determinístico: o mesmo comando gera exatamente o mesmo arquivo. */
function createRandom(seed = 20261103) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

function day(offset) {
  return new Date(Date.UTC(2026, 0, 5) + offset * 86_400_000).toISOString();
}

function buildBackup(count) {
  const random = createRandom();

  const genres = GENRES.map(
    ([id, name, colorLight, colorDark, paletteIndex], index) => ({
      id,
      name,
      color_light: colorLight,
      color_dark: colorDark,
      palette_index: paletteIndex,
      is_default: true,
      sort_order: index,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    }),
  );

  const books = Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    const status = STATUSES[index % STATUSES.length];
    const pages = 120 + (index % 9) * 48;
    const pagesRead =
      status === 'finished'
        ? pages
        : status === 'queued'
          ? 0
          : 12 + ((index * 37) % (pages - 40));
    const title =
      index === 0
        ? 'Breve Relógio'
        : `${pick(random, ADJECTIVES)} ${pick(random, NOUNS)} ${pick(random, PLACES)}`.trim();

    return {
      id: `book-${String(number).padStart(3, '0')}`,
      title,
      author: pick(random, AUTHORS),
      genre: GENRES[index % GENRES.length][0],
      status,
      pages,
      pages_read: pagesRead,
      isbn: null,
      cover_uri: null,
      created_at: day(index % 240),
      updated_at: day((index % 240) + 1),
    };
  });

  const reviews = books
    .filter((book) => book.status === 'finished')
    .slice(0, 12)
    .map((book, index) => ({
      book_id: book.id,
      rating: (index % 5) + 1,
      text: index % 3 === 0 ? 'Uma leitura que ficou comigo.' : null,
      quote: null,
      extras: {},
      created_at: book.updated_at,
      updated_at: book.updated_at,
    }));

  return {
    formatVersion: FORMAT_VERSION,
    appVersion: APP_VERSION,
    exportedAt: EXPORTED_AT,
    data: {
      genres,
      review_fields: [],
      books,
      reading_sessions: [],
      queue_items: [],
      reviews,
      settings: [
        { key: 'appearance.theme', value: 'light' },
        { key: 'backup.enabled', value: 'false' },
        { key: 'goal.pages', value: String(goalPages) },
        { key: 'reminder.time', value: '20:00' },
        { key: 'seed.books.version', value: '1' },
      ],
    },
  };
}

/** Confere o arquivo como o app vai ler: descompacta, faz parse e valida. */
function verify(archive, expectedCount) {
  const files = unzipSync(archive);
  const json = files['backup.json'];

  if (!json) {
    throw new Error('o .zip não tem backup.json na raiz');
  }

  const text = new TextDecoder('utf-8', { fatal: true }).decode(json);
  const parsed = JSON.parse(text);
  const books = parsed.data.books;

  if (books.length !== expectedCount) {
    throw new Error(
      `esperava ${expectedCount} livros, encontrei ${books.length}`,
    );
  }

  if (text.includes('Ã') || text.includes('Â')) {
    throw new Error('o JSON ainda tem caracteres de mojibake');
  }

  const ids = new Set(books.map((book) => book.id));

  if (ids.size !== books.length) {
    throw new Error('há ids de livro repetidos');
  }

  for (const book of books) {
    if (book.status === 'finished' && book.pages_read !== book.pages) {
      throw new Error(`"${book.title}" está concluído sem chegar ao fim`);
    }

    if (!GENRES.some(([id]) => id === book.genre)) {
      throw new Error(`"${book.title}" aponta para gênero inexistente`);
    }
  }

  const sample = books.slice(0, 3).map((book) => book.title);

  return { bytes: archive.length, sample };
}

function option(name, fallback) {
  const found = process.argv.find((argument) =>
    argument.startsWith(`--${name}=`),
  );

  return found ? found.slice(name.length + 3) : fallback;
}

const count = Number(option('count', DEFAULT_COUNT));
const out = option('out', DEFAULT_OUT);

if (!Number.isInteger(count) || count < 1) {
  throw new Error(`--count inválido: ${count}`);
}

const backup = buildBackup(count);
const archive = zipSync(
  { 'backup.json': [strToU8(JSON.stringify(backup, null, 2)), { level: 6 }] },
  { mtime: new Date(EXPORTED_AT) },
);

const report = verify(archive, count);

writeFileSync(out, archive);

console.log(`ok: ${out}`);
console.log(`  livros: ${count}`);
console.log(`  tamanho: ${(report.bytes / 1024).toFixed(1)} KB`);
console.log(`  primeiros títulos: ${report.sample.join(' · ')}`);
