# Estado atual

## Sessão

- **Atual:** nenhuma sessão aberta; S7.1 encerrada em 2026-11-01.
- **Última concluída:** S7.1 (conferida no Android). Antes: S7.
- **Próxima:** S8 (`docs/sessions/S08-ordem-real.md`): Ordem persistida,
  adicionar/remover/reordenar por arrastar (dentro da própria S8) e sugestão
  anti-ressaca.
- **Depois:** S8a (`S08a-troca-rapida-status.md`) e S9 (conclusão + resenha).

## Pronto (S7.1)

- Registrar leitura coloca o livro em `reading` quando ele estava `queued` ou
  `paused`, e em `finished` quando fecha o livro (ADR 0015). Desfazer não
  restaura o status anterior.
- Hoje: subtítulo "Seu plano de hoje", seções "Plano do dia" e "Lido hoje"
  (título, páginas e `HH:mm`), meta batida sem fração acima de 100% e botão
  explícito em cada bloco ("Registrar leitura"/"Registrar mais").
- "Fila" virou **Ordem** na UI, na rota (`/ordem`, `ordem.tsx`) e na tela
  (`QueueScreen`); abas: Estante, Hoje, Ordem, Ajustes.
- Ordem somente leitura: legenda "A sequência é sua: o que ler depois do livro
  atual.", posições, chip "Pausado" e a nota da S8; sem páginas ou modal.
- O selo "sugestão" segue o status: `queued` (Pretendo Ler) leva o selo, mesmo
  como bloco principal; `reading` não leva, porque já é decisão.
- 313 testes (41 arquivos); lint, typecheck, test, doctor e export verdes;
  conferido no Android em 2026-11-01.

## Decisões abertas

- S8: modelo da Ordem (`queue_items` × coluna em `books`), o que entra e como
  arrastar (setas como alternativa acessível) — decidir na abertura.
- S8a: onde a roda aparece, quando grava e o livro com capa (sem rosto de
  lombada) — decidir na abertura.
- Rótulo de `queued`: a UI diz "Quero ler"; o dono chama de "Pretendo ler".
  Alinhar antes da S8, se for para mudar.
- Multisseleção da Estante está no backlog pós-MVP; se virar sessão, a entrada
  no modo e a espera de 5 s são decididas lá.
- S7.2 (opcional): persistir o plano + edição manual.
- Excluir livro deixa `reading_sessions` órfãs (sem FK). Limpeza na S9/S11.

## Arquivos-chave

- `src/features/today/` (`use-daily-plan.ts`, `plan-view.ts`, `format.ts`,
  `HojeScreen.tsx`)
- `src/features/queue/` (`QueueScreen.tsx`, `use-queue.ts`, fixture até a S8)
- `src/db/repositories/reading-sessions.ts`, `src/test-utils/repositories.ts`
- `src/app/(tabs)/{_layout.tsx,hoje.tsx,ordem.tsx}`
- `docs/architecture.md`, ADR 0013, ADR 0014, ADR 0015

## Armadilhas

- O motor devolve o plano **bruto**: não desconta o lido hoje; `buildPlanView`
  compara e monta `sessionsToday` pelo dia local (nunca `toISOString()`).
- Ativo = `reading` com sessão em 0–6 dias; volta leve = ≥ 3 dias (última sessão
  de qualquer livro). Por isso `listBetween` + `latest()`.
- Registrar em livro pausado/`queued` muda o status para `reading` e pode trocar
  o ativo do plano: a sessão mais recente vence. É a regra do motor, não bug.
- Desfazer não restaura o status anterior; pausar de novo é ajuste manual.
- Corte de arredondamento 0,7; conta inteira (`percentOf`). Teto de 60% só com
  ativo e meta ≥ 10; meta < 10 é um livro só.
- `pages_read` tem `CHECK`: só o repositório de leitura escreve, na mesma
  transação. `create` recusa livro concluído e chama `notifyBooksChanged`.
- RNTL 14 é assíncrono; com sessões, passe `booksRepository` +
  `readingRepository` ao `renderWithProviders`.
- Rota tipada: `.expo/types/router.d.ts` é gerado. Depois de renomear rota,
  rodar `npx expo start --offline` antes do typecheck.
- Import entre features: caminho direto, nunca o barril (require cycle).
- `isbn-ranges.ts`, `drizzle/*.sql` e `drizzle/migrations.js` são gerados: não
  editar à mão; depois de `drizzle-kit generate`, rodar `npm run lint:fix`.

## Como rodar

```bash
npm install && npm start      # Expo Go
npm run lint && npm run typecheck && npm run test
npm run doctor && npx expo export --platform android --output-dir dist
npx drizzle-kit generate      # depois de mudar src/db/schema.ts
npm run lint:fix              # normaliza migrations.js e o snapshot
```
