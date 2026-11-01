# S08b — Multisseleção na Estante

## Objetivo

Selecionar vários livros na Estante e aplicar **uma edição por vez** a toda a
seleção: status, gênero, remoção de capa ou exclusão. As duas ações destrutivas
(excluir e remover capa) pedem confirmação dupla, e a segunda confirmação tem
uma espera visível de **5 segundos** antes de liberar o botão.

## Fora de escopo

- Editar título, autor, páginas ou ISBN em lote.
- Reordenar a Ordem em lote (S8) ou pela roda de status (S8a).
- Desfazer em lote: ações destrutivas não têm undo; a espera é a proteção.
- Backfill de gênero excluído ou limpeza de sessões órfãs (S9/S11).

## Decisões a confirmar na abertura

1. **Entrar no modo de seleção:** recomendo toque longo no card (fora do chip) +
   botão "Selecionar" no cabeçalho, para o modo ser descobrível. O toque longo
   no chip continua abrindo a roda da S8a; o evento do chip precisa vencer.
2. **Seleção:** toque no card alterna o livro; checkbox/overlay visível;
   "Selecionar visíveis" pega o resultado do filtro e da busca atuais;
   contador no cabeçalho e "Cancelar".
3. **Uma edição por vez:** carregar os selecionados numa ação; ao concluir,
   sair do modo. A barra inferior tem Status, Gênero, Remover capa e Excluir.
4. **Status em lote:** lista dos quatro status (pode reaproveitar a roda/lógica
   da S8a, sem prévia obrigatória). Sem mudar progresso ou páginas.
5. **Gênero em lote:** escolher um gênero existente do `useGenres` e aplicar a
   todos. Gênero em uso não pode ser excluído, então a seleção não fica órfã.
6. **Remover capa:** só se aplica a livros com capa (`hasCover`); se nenhum
   selecionado tiver, desabilitar a ação. Usa o `CoverService` para apagar o
   arquivo e zera `cover_uri` na mesma ação.
7. **Confirmação dupla:** o primeiro diálogo explica o efeito e o número de
   livros; o segundo mostra a contagem **5 → 0** na tela e mantém o botão
   desabilitado até zerar. Cancelar em qualquer etapa aborta tudo. Vale para
   Excluir **e** Remover capa.
8. **Falha parcial:** se apagar uma capa ou excluir um livro falhar, os demais
   continuam e a tela informa o que falhou; nunca mostrar tudo como aplicado.
9. **Efeito colateral:** excluir livro apaga a capa do disco e deixa as sessões
   de leitura órfãs (sem FK, conhecido). O texto da confirmação avisa que a
   ação é destrutiva.

## Tarefas

1. **Estado de seleção** na Estante: `Set<string>`, entrar/sair, alternar,
   "selecionar visíveis" e limpeza automática ao mudar filtro, busca ou lista.
2. **UI do modo de seleção:** overlay/checkbox no card, cabeçalho com
   "N selecionados" + "Cancelar" e barra de ações com os quatro botões.
3. **Aplicação em lote:** status e gênero via repositório (idealmente numa
   transação só, como a ordem da S8); capa e exclusão via `CoverService` +
   `useBooks().remove`, reportando falhas por livro.
4. **Confirmação com espera:** componente reutilizável
   `DestructiveConfirm`/`HoldCountdown` com o primeiro aviso e o segundo passo
   contando 5 s na tela (texto acessível, botão bloqueado até 0), testável com
   fake timers. Reutilizar em excluir e remover capa.
5. **Status/gênero:** seletor simples sobre os dados existentes; aplicar e
   fechar.
6. **Testes:** entrar/sair da seleção, selecionar visíveis, aplicar status e
   gênero a todos, remover capa só de quem tem, excluir vários, contagem de 5 s
   bloqueando a confirmação, cancelar em cada etapa, falha parcial e limpeza da
   seleção ao trocar filtro/busca.
7. **Docs:** `docs/architecture.md`, `docs/design/design-system.md` (checkbox,
   barra de ações e padrão destrutivo), `docs/testing.md`, `CURRENT.md`,
   `roadmap.md`, `CHANGELOG.md` e ADR nova se a espera de 5 s virar padrão do
   app.

## Aceite

- [ ] Entrar no modo de seleção, marcar vários livros e ver o contador;
      "Selecionar visíveis" respeita filtro e busca.
- [ ] Status aplicado a toda a seleção, com a estante atualizando na hora.
- [ ] Gênero aplicado a toda a seleção.
- [ ] Remover capa apaga o arquivo e limpa `cover_uri` só dos que tinham capa.
- [ ] Excluir remove todos os selecionados e suas capas; a lista atualiza.
- [ ] Excluir e remover capa exigem confirmação dupla, com contagem visível de
      5 s e botão bloqueado até o fim.
- [ ] Cancelar em qualquer etapa não altera nada.
- [ ] Falha parcial é informada e não deixa a tela mentindo.
- [ ] Seleção é limpa ao mudar filtro, busca ou ao sair da aba.
- [ ] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes; conferido no
      Android.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec,
`src/features/library/EstanteScreen.tsx`, `src/features/library/use-books.tsx`,
`src/features/library/cover-context.tsx`, `src/lib/covers.ts`,
`src/features/genres/`, `src/components/ui/ConfirmDialog.tsx`,
`src/components/ui/Chip.tsx`, `docs/data-model.md` e ADR 0010.

## Arquivos prováveis

- `src/features/library/EstanteScreen.tsx` e `SelectionBar`/`BookSelectable`
- `src/components/ui/DestructiveConfirm.tsx` + testes
- `src/features/library/batch-edit.ts` (ações em lote puras/agrupadas)
- `src/db/repositories/books.ts` (se entrar atualização em lote transacional)
- `src/test-utils/render.tsx` (fake do `CoverService`)
- `docs/architecture.md`, `docs/design/design-system.md`, `docs/testing.md`

## Riscos

- **Sobreposição com a S8a:** toque longo no chip (roda) × toque longo no card
  (seleção). Testar no chip, no título e na arte; o gesto do chip deve ganhar.
- **Meia-exclusão:** DB e disco podem divergir. Excluir o livro e depois a capa
  (ou o contrário) precisa de ordem e relatório claros.
- **Fake timers:** a contagem de 5 s em RNTL precisa de `jest.useFakeTimers` e
  avanço controlado; não usar sleeps reais.
- **Seleção invisível:** livro selecionado que sai do filtro não pode ser
  editado às cegas; limpar a seleção ao mudar filtro/busca.
- **Capa em uso:** apagar o arquivo enquanto a imagem ainda renderiza; limpar o
  estado antes de remover do disco e deixar o fallback de lombada assumir.
- **Sessões órfãs:** excluir em lote herda o problema conhecido; não prometer
  limpeza que não existe.

## Próximo depois desta

**S9** — conclusão + resenha.
