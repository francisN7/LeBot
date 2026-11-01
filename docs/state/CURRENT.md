# Estado atual

## Sessão

- **Atual:** nenhuma sessão aberta; S8a encerrada em 2026-11-01.
- **Última concluída:** S8a (roda radial conferida no Android).
- **Próxima:** S9 (conclusão + resenha), depois S10 (estatísticas).

## Pronto (S8a)

- Segurar o chip de status (~500 ms) abre a roda radial flutuante na mesma tela,
  centrada no toque do chip. As quatro opções abrem em círculo com mola;
  deslizar o dedo escolhe pelo ângulo, o rosto/capa e o chip acompanham a prévia
  e soltar grava. Voltar ao miolo, tocar fora ou a ação de cancelar descartam.
- O gesto é um `Pan` da RNGH com `activateAfterLongPress(500)`: o mesmo toque
  continua sendo rastreado depois de a roda abrir, sem roubar a rolagem antes
  do toque longo. A geometria (ângulo → status, clamp na tela) é pura em
  `status-wheel-geometry.ts`.
- A roda é um overlay na mesma janela (sem `Modal`), com entrada/saída animadas
  e destaque por mola na opção selecionada. A11y: o chip expõe a ação "Trocar
  status" e a roda oferece as quatro opções como botões.
- Concluir preenche as páginas lidas no repositório de livros (formulário e
  roda), com a mesma regra no repositório em memória (ADR 0018).
- 20 testes novos (350 em 45 arquivos); lint, typecheck, test, doctor e export
  verdes; conferida no Android em 2026-11-01.

## Pronto (S8)

- `queue_items` com migração aditiva `0005`; a Ordem nasce vazia e o `sync`
  materializa todo livro não concluído. Status é a entrada/saída (ADR 0017).
- Dois blocos: `reading` em "Lendo agora" (primeiro = principal e bloco `active`
  do plano) e `queued`/`paused` em "Depois". Arrastar/setas não cruzam blocos.
- Repositório com `list`/`sync`/`move`/`replaceAll` em transação; os hooks
  sincronizam quando a estante muda e reordenar atualiza a Hoje.
- Drop via alça ainda pisca/animar antes de alocar (setas ok) — no backlog.

## Decisões abertas

- Rótulo de `queued`: a UI diz "Quero ler"; o dono chama de "Pretendo ler".
- Multisseleção da Estante no backlog pós-MVP; entrada e espera de 5 s ficam lá.
- S7.2 (opcional): persistir o plano + edição manual.
- Livro excluído deixa `reading_sessions`/`queue_items` órfãs; limpeza S9/S11.

## Arquivos-chave

- `src/features/library/EstanteScreen.tsx`, `status-wheel-trigger.tsx`,
  `status-wheel-overlay.tsx`, `status-wheel-geometry.ts` + testes
- `src/components/ui/Chip.tsx`
- `src/db/repositories/books.ts`, `src/test-utils/repositories.ts`
- `src/db/repositories/queue.ts`, `drizzle/0005_*.sql`, `src/features/queue/`
- `src/features/today/use-daily-plan.ts`, `planner/engine/selection.ts`
- `src/components/ui/Screen.tsx`, `src/app/_layout.tsx`, ADR 0017 e 0018

## Armadilhas

- A ordem tem dois blocos: `reading` no topo e o resto abaixo. `move` nunca deixa
  cruzar; não normalize a lista só por posição. `sync` é o gatilho de livro
  novo/status mudado; não remova.
- Posição nunca com empate/buraco: `move`/`replaceAll` reescrevem a lista toda;
  `list()` deriva se faltar linha. Concluído/órfão só sai na próxima escrita.
- Arrastar exige toque longo e bloqueia a rolagem nativa; o drop via alça ainda
  pisca (setas ok). `Screen` precisa do `ScrollView` do RNGH e o app do
  `GestureHandlerRootView`; no Jest, `react-native-worklets` vai para o mock.
- A roda separa prévia de escrita: `onUpdate`/`onPreview` não podem chamar
  `update`; só `onSettle`/`onSelect` grava. A prévia vive na Estante.
- A roda não pode ser `Modal`: abrir outra janela cancela o `Pan` em andamento.
  Ela é um overlay irmão do `Screen`, na mesma janela; `absoluteX/Y` são
  relativas à raiz da tela.
- O chip de status não tem `onLongPress`; quem segura é o `StatusWheelTrigger`
  (wrapper com o `Pan`). Não desabilite o chip: a ação acessível depende dele.
- Concluir (`finished`) sempre leva `pagesRead` ao total no repositório; trocar
  de volta para outro status mantém o progresso cheio.
- A Ordem não registra leitura nem muda status; o toque abre o detalhe.
- O motor devolve o plano **bruto**; `buildPlanView` compara com o lido hoje.
- Principal = primeiro Lendo da ordem; sem Lendo, o primeiro elegível leva o dia
  inteiro. Volta leve usa a última sessão (≥ 3 dias).
- Corte 0,7; conta inteira (`percentOf`). Teto de 60% só com principal e meta
  ≥ 10; meta < 10 é um livro só.
- `pages_read` tem `CHECK`: só o repositório de leitura escreve páginas lidas
  (fora a normalização de concluir, que usa o total).
- RNTL 14 é assíncrono; passe `booksRepository`, `queueRepository` e
  `readingRepository` ao `renderWithProviders`.
- Rota tipada: `.expo/types/router.d.ts` é gerado; renomeou rota? rode
  `npx expo start --offline`. Import entre features: caminho direto, não o barril.
- `isbn-ranges.ts`, `drizzle/*.sql` e `migrations.js` são gerados; `lint:fix`
  depois do generate.
