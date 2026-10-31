# Estado atual

## Sessão

- **Atual:** nenhuma aberta (S3.2 concluída e validada no Android)
- **Última concluída:** S3.2 — gêneros personalizados e cores por tema
- **Próxima:** S4 — identidade 3D (`docs/sessions/S04-identidade-3d.md`), que
  absorve a tabela oficial de ranges do ISBN, os avisos do terminal e a capa na
  Fila.

## Pronto (S3.2)

- Migração `0002_slow_pepper_potts.sql` aditiva: `genres`, 2 índices e os 6
  gêneros de fábrica; `books` intacta e `books.genre` guarda `genres.id`.
- `genre-colors.ts` (10 pares, `resolveGenreColor`) e `genre-color.ts` (hex,
  contraste WCAG, par igual recusado); o gênero grava a cópia dos hexes.
- Repositório `genres` (`countBooks`, `nameExists`, nome único sem acento/caixa,
  exclusão bloqueada com livros e no último) e `useGenres` + `genreById`;
  `Book.genreId` substituiu `Book.genre` e o enum `BookGenre` saiu.
- `/generos`, `/generos/novo`, `/generos/[id]/editar`; Ajustes → "Gerenciar
  gêneros". Formulário com 10 presets, dois hexes, preview e aviso de contraste.
- `BookCover` (raio + borda navy + `overflow: hidden`) e `Bookmark` em
  `react-native-svg` (fita na cor do gênero, topo/esquerda) na Estante, no
  detalhe e no preview.
- ISBN: dígitos puros com máscara enquanto digita (`85-359-0277-2` /
  `978-85-359-0277-2`, troca pelo prefixo 978/979), "válido/inválido" antes de
  salvar; o banco grava só os dígitos. `AppText` `label` sem `letterSpacing`.
- 143 testes em 30 suítes; lint, typecheck, doctor e export Android verdes.
  Docs: ADR 0010, modelo, arquitetura, design system, brand, testes, privacidade
  e CHANGELOG.

## Decisões abertas

- NativeWind v4 sem suporte oficial à SDK 58 (ADR 0006).
- Tema escuro: pares prontos; falta toggle, superfícies e contraste.
- Ícone e splash ainda são placeholders (S4).
- `cover_uri` é absoluto: o backup (S11) decide entre referência e imagem.
- Máscara do ISBN fixa no padrão brasileiro; a S4 troca pela tabela oficial
  (`RangeMessage.xml`), mantendo o banco sem hífen.
- DNF (S9), metadados em `brand/source/*.png` (limpar no primeiro export real).

## Arquivos-chave

- `src/db/{schema.ts,repositories/genres.ts}`, `drizzle/0002_*`
- `src/theme/genre-colors.ts`, `src/lib/{genre-color,genre-name}.ts`
- `src/features/genres/*`, `src/components/ui/{BookCover,Bookmark}.tsx`,
  `src/features/library/{form.ts,use-books.tsx,BookFormScreen.tsx}`

## Armadilhas

- `expo-env.d.ts` é gerado/ignorado. Rota nova só tipa depois de gerar
  `.expo/types/router.d.ts` (`npm start` ou `npx expo start --offline`).
- `expo-sqlite`, `expo-file-system` e `expo-image-picker` não rodam no Jest;
  banco por `sql.js`, capa por contexto. SVG roda normal.
- Migração: `schema.ts` → `npx drizzle-kit generate` → revisar o SQL (os 6
  gêneros são `INSERT` à mão) → commitar `drizzle/` e `migrations.js`.
  `getDb()` é lazy; chamar no topo de um módulo quebra os testes.
- RTL 14 é assíncrono e sem `UNSAFE_getByType` (use `testID`/texto); Node 26 vs
  CI 22: rode `npm run test` antes de culpar o código.
- Metro avisa require cycle quando uma feature importa o barril de outra (S4
  corrige com import direto, ex.: `@/features/library/use-books`).
- `ImageBackground is deprecated` vem do `react-native-css-interop` (NativeWind
  4) no boot, não do app; decisão na S4.
- Fontes: família com peso, nunca `fontWeight`; `lineHeight` < 1.15× corta
  descendentes; `label` **não** leva `letterSpacing`.
- Contraste da paleta: 3:1 contra o creme **ou** o navy (navy é cor do preset
  "classic"; comparar só com navy dá 1:1).

## Como rodar

```bash
npm install && npm start      # Expo Go
npm run lint && npm run typecheck && npm run test
npm run doctor && npx expo export --platform android --output-dir dist
```
