# Estado atual

## Sessão

- **Atual:** S5 implementada e validada no desktop; falta conferir no Android.
- **Última concluída:** S4b (ISBN oficial, avisos do terminal, capa na Fila).
- **Próxima:** fechar a S5 no Android e abrir a S6
  (`docs/sessions/S06-motor-plano.md`), motor puro do plano diário.

## Pronto (S5 — registro de leitura)

- `reading_sessions` em `src/db/schema.ts` + migração aditiva
  `drizzle/0003_cloudy_pretty_boy.sql` (índice em `book_id`, `pages > 0`).
- `src/db/repositories/reading-sessions.ts`: `create` grava a sessão e soma em
  `books.pages_read` na mesma transação, com teto no total e `finished`
  automático; `remove` desconta (nunca negativo) e devolve `finished` →
  `reading`; `listByBook` (recente primeiro) e `listBetween` (base da S10).
- `src/features/reading/`: `useReadingSessions`, `ReadingForm` (modal, +1/+10,
  aviso de clamp) e `ReadingProgressCard` (barra, últimas leituras, desfazer).
- Detalhe tem o card "Progresso"; o "Começar" da Fila abre o registro com
  `plannedPages` como valor sugerido (o detalhe sugere 1).
- `useBooks` exporta `notifyBooksChanged`; registrar atualiza Estante, detalhe
  e Fila sem reiniciar.
- Testes: repositório (soma, teto, `finished`, desfazer, Zod, faixa de datas),
  `ReadingForm`, detalhe e Fila. 203 testes no total.
- Validação desktop: `lint`, `typecheck`, `test`, `doctor` (20/20) e
  `expo export --platform android` verdes.

## Decisões abertas

- ADR 0012 fixa: clamp com aviso na UI e `finished` automático (desfazer volta
  para `reading`). Se o dono não gostar da volta automática, é uma linha no
  repositório.
- Excluir livro deixa `reading_sessions` órfãs (sem FK). Limpeza na S9/S11.
- `queued`/`paused` não viram `reading` ao registrar páginas; só `reading` vira
  `finished`. Ajustar na S9 se incomodar.
- S6: porcentagens do anti-ressaca na spec são proposta — confirmar antes de
  codar.

## Arquivos-chave

- `src/db/schema.ts`, `drizzle/0003_cloudy_pretty_boy.sql`, `drizzle/migrations.js`
- `src/db/repositories/reading-sessions.ts` (+ teste)
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
