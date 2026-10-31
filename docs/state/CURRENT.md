# Estado atual

## Sessão

- **Atual:** nenhuma aberta (S3.2 entregue; falta conferir no Android)
- **Última concluída:** S3.2 — gêneros personalizados e cores por tema
- **Próxima:** aceite da S3.2 no device; depois S4
  (`docs/sessions/S04-identidade-3d.md`).

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
- 139 testes em 30 suítes; lint, typecheck, doctor e export Android verdes.
  Docs: ADR 0010, modelo, arquitetura, design system, brand, testes, privacidade
  e CHANGELOG.

## Revisar no Android antes da S4

1. `Terror`, `Voltar` e título longo terminando em "r" inteiros em chip, botão e
   lombada.
2. Capa arredondada e borda 2 px sem vazar; fita visível sobre capa clara.
3. Contraste real dos 10 presets na lombada.
4. Criar gênero (preset e custom), renomear e repintar a Estante; excluir sem
   livros, em uso (mensagem com contagem) e o último.
5. ISBN: máscara ao digitar (8535 → 85-35; 97885359027 → 978-85-359-027),
   teclado numérico e X final; Ajustes → Gêneros → editar → voltar.

## Decisões abertas

- NativeWind v4 sem suporte oficial à SDK 58 (ADR 0006).
- Tema escuro: pares prontos; falta toggle, superfícies e contraste.
- Ícone e splash ainda são placeholders (S4).
- `cover_uri` é absoluto: o backup (S11) decide entre referência e imagem.
- Máscara do ISBN fixa no padrão brasileiro (sem tabela de ranges): outro grupo
  pode ganhar hífen no lugar errado; o valor gravado é só dígitos.
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
