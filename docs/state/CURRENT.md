# Estado atual

## Sessão

- **Atual:** auditoria de documentação concluída; S5 concluída e validada no
  Android (registro de leitura + piso do progresso).
- **Última concluída:** S5 + auditoria de docs.
- **Próxima:** S6 (`docs/sessions/S06-motor-plano.md`), motor puro do plano
  diário.

## Pronto (S5 — registro de leitura + piso)

- Docs vivos revisados contra o código: README, AGENTS, INDEX, arquitetura,
  testing, design e brand; `src/assets/` saiu e ícones/splash não são placeholder.
- `reading_sessions` em `src/db/schema.ts` + migrações aditivas
  `0003_cloudy_pretty_boy.sql` (índice em `book_id`, `pages > 0`) e
  `0004_clever_turbo.sql` (`applied_pages`; `NULL` antigo vale como `pages`).
- `src/db/repositories/reading-sessions.ts`: `create` grava a sessão e soma em
  `books.pages_read` na mesma transação, com teto no total e `finished`
  automático; `remove` desconta `appliedPages` (nunca negativo) e devolve
  `finished` → `reading`; `listByBook` e `listBetween` (base da S10).
- `src/features/reading/`: `useReadingSessions`, `ReadingForm` (modal, +1/+10,
  aviso de clamp) e `ReadingProgressCard` (barra, últimas leituras, desfazer).
- Detalhe tem o card "Progresso"; o "Começar" da Fila abre o registro com
  `plannedPages` como valor sugerido (o detalhe sugere 1).
- `useBooks` exporta `notifyBooksChanged`; registrar atualiza Estante, detalhe
  e Fila sem reiniciar.
- Piso: formulário (`validateBookForm(..., recordedPages)`, aviso "Já
  registradas: N") e `update` de livros recusam progresso abaixo do histórico;
  a mensagem manda desfazer no detalhe.
- 207 testes; `lint`, `typecheck`, `test`, `doctor` (20/20) e
  `expo export --platform android` verdes. Validado no Android pelo dono.

## Decisões abertas

- Excluir livro deixa `reading_sessions` órfãs (sem FK). Limpeza na S9/S11.
- `queued`/`paused` não viram `reading` ao registrar páginas; só `reading` vira
  `finished`. Ajustar na S9 se incomodar.
- S6: porcentagens do anti-ressaca na spec são proposta — confirmar antes de
  codar.

## Arquivos-chave

- `src/db/schema.ts`, `drizzle/0003_cloudy_pretty_boy.sql`,
  `drizzle/0004_clever_turbo.sql`, `drizzle/migrations.js`
- `src/db/repositories/books.ts` (+ teste), `reading-sessions.ts` (+ teste)
- `src/features/library/form.ts`, `BookFormScreen.tsx`
- `src/features/reading/` (`ReadingForm`, `ReadingProgressCard`,
  `use-reading-sessions.tsx`, `types.ts`)
- `src/features/library/BookDetailScreen.tsx`, `src/features/queue/FilaScreen.tsx`
- `src/test-utils/repositories.ts`, `src/test-utils/render.tsx`
- `docs/adr/0012-progresso-e-status-automatico.md`

## Armadilhas

- `drizzle-kit generate` reescreve `drizzle/migrations.js` desformatado: rodar
  `npm run lint:fix` depois (ou conferir o arquivo) antes de commitar.
- O `CHECK (pages_read BETWEEN 0 AND pages)` existe no banco: qualquer soma ou
  subtração fora do repositório pode estourar como exceção.
- `create` recusa livro já concluído (`BOOK_ALREADY_FINISHED`); a UI esconde o
  botão, mas o repositório também protege.
- Sessão maior que o restante grava `session.pages` cheio e `appliedPages`
  menor: nunca exibir `appliedPages` como se fosse o digitado.
- O piso de `pages_read` é a soma de `coalesce(applied_pages, pages)`; não usar
  `sum(pages)` direto ou a UI voltaria a divergir do histórico.
- RNTL 14 é assíncrono: `await render(...)` e `await fireEvent.press(...)`.
- `renderWithProviders` injeta o repositório de leitura ligado ao de livros; um
  fake solto deixaria a barra de progresso parada nos testes.
- Import entre features: caminho direto (`@/features/reading/...`), nunca o
  barril, para não recriar require cycle.
- `isbn-ranges.ts` é gerado: nunca editar à mão.

## Como rodar

```bash
npm install && npm start      # Expo Go
npm run lint && npm run typecheck && npm run test
npm run doctor && npx expo export --platform android --output-dir dist
npx drizzle-kit generate      # depois de mudar src/db/schema.ts
npm run lint:fix              # normaliza migrations.js e o snapshot
```
