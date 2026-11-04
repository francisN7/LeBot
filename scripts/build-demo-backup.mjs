// Gera `lebot-demo.zip`, o acervo fictício usado nas capturas do README.
//
// Uso:
//   node scripts/build-demo-backup.mjs
//   node scripts/build-demo-backup.mjs --out=lebot-demo.zip
//
// As datas são relativas ao momento da geração para a tela "Hoje" e as
// estatísticas fazerem sentido no dia da captura. Nenhum dado real entra aqui:
// títulos, autores e resenhas são inventados e as capas ficam vazias (a lombada
// é a identidade do app).

import { writeFileSync } from 'node:fs';

import { strToU8, unzipSync, zipSync } from 'fflate';

const DEFAULT_OUT = 'lebot-demo.zip';
const FORMAT_VERSION = 1;
const APP_VERSION = '0.2.1';

const GENRES = [
  ['fantasy', 'Fantasia', '#7B69EE', '#B3A7FF', 0],
  ['romance', 'Romance', '#FF6B5B', '#FF9A8F', 1],
  ['nonfiction', 'Não-ficção', '#34C6B8', '#6FE3D6', 2],
  ['classic', 'Clássico', '#2A2340', '#8B84A8', 3],
  ['children', 'Infantojuvenil', '#FFC145', '#FFD980', 4],
  ['horror', 'Terror', '#FF8FA3', '#FFB3C1', 5],
];

const FIELDS = [
  ['field-personagens', 'Personagens', 0],
  ['field-trecho', 'Trecho favorito', 1],
];

/** `daysAgo` no horário local; a UI mostra a hora local da sessão. */
function at(daysAgo, hour = 20, minute = 30) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

const BOOKS = [
  {
    id: 'book-01',
    title: 'O Jardim do Meio-Dia',
    author: 'Clarice Nogueira',
    genre: 'fantasy',
    status: 'reading',
    pages: 320,
    read: 148,
    created: 300,
  },
  {
    id: 'book-02',
    title: 'Cartas ao Mar',
    author: 'Rafael Cordeiro',
    genre: 'romance',
    status: 'reading',
    pages: 280,
    read: 90,
    created: 295,
  },
  {
    id: 'book-03',
    title: 'O Último Inverno',
    author: 'Íris Tavares',
    genre: 'classic',
    status: 'reading',
    pages: 410,
    read: 320,
    created: 290,
  },
  {
    id: 'book-04',
    title: 'Pequenas Coisas',
    author: 'Tomás Araújo',
    genre: 'nonfiction',
    status: 'queued',
    pages: 240,
    read: 0,
    created: 285,
  },
  {
    id: 'book-05',
    title: 'A Casa Amarela',
    author: 'Cecília Fróes',
    genre: 'romance',
    status: 'queued',
    pages: 352,
    read: 0,
    created: 280,
  },
  {
    id: 'book-06',
    title: 'Noites de Vidro',
    author: 'Otávio Sá',
    genre: 'horror',
    status: 'queued',
    pages: 288,
    read: 0,
    created: 275,
  },
  {
    id: 'book-07',
    title: 'O Menino e o Vento',
    author: 'Benedita Alves',
    genre: 'children',
    status: 'queued',
    pages: 96,
    read: 0,
    created: 270,
  },
  {
    id: 'book-08',
    title: 'Um Verão em Lisboa',
    author: 'Lúcia Bragança',
    genre: 'romance',
    status: 'paused',
    pages: 300,
    read: 120,
    created: 265,
  },
  {
    id: 'book-09',
    title: 'A Sombra do Norte',
    author: 'Sebastião Vidal',
    genre: 'horror',
    status: 'paused',
    pages: 340,
    read: 80,
    created: 260,
  },
  {
    id: 'book-10',
    title: 'Histórias do Quintal',
    author: 'João Pessoa',
    genre: 'children',
    status: 'paused',
    pages: 72,
    read: 30,
    created: 255,
  },
  {
    id: 'book-11',
    title: 'O Relógio de Areia',
    author: 'Ágata Muniz',
    genre: 'fantasy',
    status: 'finished',
    pages: 256,
    read: 256,
    created: 250,
  },
  {
    id: 'book-12',
    title: 'Maré Alta',
    author: 'Manoel de Barros',
    genre: 'classic',
    status: 'finished',
    pages: 380,
    read: 380,
    created: 245,
  },
  {
    id: 'book-13',
    title: 'Tudo que Ficou',
    author: 'Clarice Nogueira',
    genre: 'nonfiction',
    status: 'finished',
    pages: 210,
    read: 210,
    created: 240,
  },
  {
    id: 'book-14',
    title: 'A Última Carta',
    author: 'Rafael Cordeiro',
    genre: 'romance',
    status: 'finished',
    pages: 298,
    read: 298,
    created: 235,
  },
];

/** Sessões somam exatamente `book.read`; as de hoje alimentam a tela Hoje. */
const SESSIONS = [
  [
    'book-01',
    [
      [0, 8],
      [1, 14],
      [2, 12],
      [4, 20],
      [7, 18],
      [10, 26],
      [14, 28],
      [18, 22],
    ],
  ],
  [
    'book-02',
    [
      [0, 4],
      [1, 10],
      [3, 12],
      [6, 16],
      [9, 18],
      [13, 30],
    ],
  ],
  [
    'book-03',
    [
      [1, 30],
      [5, 28],
      [8, 32],
      [12, 40],
      [16, 45],
      [20, 50],
      [25, 55],
      [30, 40],
    ],
  ],
  [
    'book-08',
    [
      [6, 30],
      [11, 40],
      [17, 50],
    ],
  ],
  [
    'book-09',
    [
      [9, 30],
      [15, 50],
    ],
  ],
  ['book-10', [[12, 30]]],
  [
    'book-11',
    [
      [40, 100],
      [38, 156],
    ],
  ],
  [
    'book-12',
    [
      [60, 200],
      [55, 180],
    ],
  ],
  ['book-13', [[70, 210]]],
  [
    'book-14',
    [
      [80, 150],
      [78, 148],
    ],
  ],
];

const REVIEWS = [
  {
    bookId: 'book-11',
    rating: 5,
    text: 'Um livro sobre esperar o tempo certo. A Lia ficou comigo por semanas.',
    quote: 'O relógio não andava; o mundo é que se movia.',
    extras: { 'field-personagens': 'Lia e o avô' },
  },
  {
    bookId: 'book-12',
    rating: 4,
    text: 'Maré alta, prosa firme. Um clássico que não pesa.',
    quote: null,
    extras: {},
  },
  {
    bookId: 'book-13',
    rating: 5,
    text: null,
    quote: 'Ficar também é uma forma de escolher.',
    extras: {},
  },
  {
    bookId: 'book-14',
    rating: 3,
    text: 'Começa devagar, termina bem.',
    quote: null,
    extras: {},
  },
];

function buildBackup() {
  const genres = GENRES.map(
    ([id, name, colorLight, colorDark, paletteIndex], index) => ({
      id,
      name,
      color_light: colorLight,
      color_dark: colorDark,
      palette_index: paletteIndex,
      is_default: true,
      sort_order: index,
      created_at: at(400),
      updated_at: at(400),
    }),
  );

  const books = BOOKS.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    genre: book.genre,
    status: book.status,
    pages: book.pages,
    pages_read: book.read,
    isbn: null,
    cover_uri: null,
    created_at: at(book.created, 10, 0),
    updated_at: at(book.status === 'finished' ? 38 : 0, 20, 30),
  }));

  const readingSessions = [];
  for (const [bookId, sessions] of SESSIONS) {
    sessions.forEach(([daysAgo, pages], index) => {
      readingSessions.push({
        id: `session-${bookId.slice(-2)}-${String(index).padStart(2, '0')}`,
        book_id: bookId,
        pages,
        applied_pages: pages,
        read_at: at(daysAgo, daysAgo === 0 ? 8 : 20, daysAgo === 0 ? 30 : 30),
        created_at: at(daysAgo, daysAgo === 0 ? 8 : 20, 30),
        updated_at: at(daysAgo, daysAgo === 0 ? 8 : 20, 30),
      });
    });
  }

  const queued = books.filter(
    (book) => book.status !== 'finished' && book.status !== 'paused',
  );
  const paused = books.filter((book) => book.status === 'paused');
  const ordered = [...queued, ...paused];

  const queueItems = ordered.map((book, index) => ({
    book_id: book.id,
    position: index,
    note: null,
    created_at: at(30),
    updated_at: at(30),
  }));

  const reviews = REVIEWS.map((review) => {
    const book = books.find((row) => row.id === review.bookId);
    return {
      book_id: review.bookId,
      rating: review.rating,
      text: review.text,
      quote: review.quote,
      extras: review.extras,
      created_at: book.updated_at,
      updated_at: book.updated_at,
    };
  });

  const exportedAt = new Date().toISOString();

  return {
    formatVersion: FORMAT_VERSION,
    appVersion: APP_VERSION,
    exportedAt,
    data: {
      genres,
      review_fields: FIELDS.map(([id, name, sortOrder]) => ({
        id,
        name,
        sort_order: sortOrder,
        created_at: at(200),
        updated_at: at(200),
      })),
      books,
      reading_sessions: readingSessions,
      queue_items: queueItems,
      reviews,
      settings: [
        { key: 'appearance.theme', value: 'light' },
        { key: 'backup.enabled', value: 'false' },
        { key: 'backup.last_exported_at', value: exportedAt },
        { key: 'goal.pages', value: '18' },
        { key: 'reminder.time', value: '20:00' },
        { key: 'seed.books.version', value: '1' },
      ],
    },
  };
}

function verify(archive) {
  const files = unzipSync(archive);
  const json = files['backup.json'];

  if (!json) throw new Error('o .zip não tem backup.json na raiz');

  const text = new TextDecoder('utf-8', { fatal: true }).decode(json);
  if (text.includes('Ã') || text.includes('Â')) {
    throw new Error('o JSON tem caracteres de mojibake');
  }

  const backup = JSON.parse(text);
  const books = backup.data.books;
  const ids = new Set(books.map((book) => book.id));

  if (books.length !== BOOKS.length) {
    throw new Error(
      `esperava ${BOOKS.length} livros, encontrei ${books.length}`,
    );
  }
  if (ids.size !== books.length) throw new Error('há ids de livro repetidos');

  const fieldIds = new Set(backup.data.review_fields.map((field) => field.id));
  const bookById = new Map(books.map((book) => [book.id, book]));

  for (const book of books) {
    if (book.status === 'finished' && book.pages_read !== book.pages) {
      throw new Error(`"${book.title}" está concluído sem chegar ao fim`);
    }
    if (book.pages_read > book.pages) {
      throw new Error(`"${book.title}" tem mais páginas lidas que o total`);
    }
  }

  for (const item of backup.data.queue_items) {
    const book = bookById.get(item.book_id);
    if (!book) throw new Error(`item de ordem sem livro: ${item.book_id}`);
    if (book.status === 'finished') {
      throw new Error(`"${book.title}" está na ordem e concluído`);
    }
  }

  for (const session of backup.data.reading_sessions) {
    if (!bookById.has(session.book_id)) {
      throw new Error(`sessão sem livro: ${session.book_id}`);
    }
    if (session.applied_pages > session.pages) {
      throw new Error('sessão com applied_pages maior que pages');
    }
  }

  for (const review of backup.data.reviews) {
    if (!bookById.has(review.book_id)) {
      throw new Error(`resenha sem livro: ${review.book_id}`);
    }
    for (const key of Object.keys(review.extras)) {
      if (!fieldIds.has(key))
        throw new Error(`extra de campo inexistente: ${key}`);
    }
  }

  const goal = backup.data.settings.find((row) => row.key === 'goal.pages');
  if (!goal || Number(goal.value) < 3 || Number(goal.value) > 200) {
    throw new Error('meta diária fora de 3–200');
  }

  return { books: books.length, sessions: backup.data.reading_sessions.length };
}

function option(name, fallback) {
  const found = process.argv.find((argument) =>
    argument.startsWith(`--${name}=`),
  );
  return found ? found.slice(name.length + 3) : fallback;
}

const out = option('out', DEFAULT_OUT);
const backup = buildBackup();
const archive = zipSync(
  { 'backup.json': [strToU8(JSON.stringify(backup, null, 2)), { level: 6 }] },
  { mtime: new Date(backup.exportedAt) },
);

const report = verify(archive);
writeFileSync(out, archive);

console.log(`ok: ${out}`);
console.log(`  livros: ${report.books}`);
console.log(`  sessões: ${report.sessions}`);
console.log(`  tamanho: ${(archive.length / 1024).toFixed(1)} KB`);
