# S08a — Troca rápida de status pela roda

## Objetivo

Na Estante, pressionar e segurar o chip de status de um livro abre uma roda com
os quatro status. Enquanto o dedo desliza, a lombada do livro muda de rosto em
tempo real (prévia); ao soltar/confirmar, o status é gravado e todas as telas
refletem a mudança na hora.

## Fora de escopo

- Multisseleção e edição em lote → **backlog pós-MVP** (não é sessão).
- Editar título, autor, gênero, páginas ou capa por esse caminho.
- Redesenhar a arte da lombada ou criar expressões novas.
- Haptics: `expo-haptics` não está instalado; fica para depois, se o dono pedir.

## Decisões confirmadas na abertura (2026-11-01)

1. **Onde a roda aparece.** Folha modal (bottom sheet) com a capa/lombada
   grande, o título e a roda logo abaixo.
2. **Quando grava.** Grava ao soltar o dedo (ou tocar numa opção), com a folha
   fechando em seguida; tocar fora ou em "Cancelar" cancela. Sem botão "Salvar".
3. **Descoberta.** Só o toque longo (~500 ms) abre a folha; o toque simples
   continua sem trocar status. O chip expõe `accessibilityHint` e a ação
   "Trocar status" para leitor de tela.
4. **Roda.** `ScrollView` vertical com `snapToInterval` e `onScrollEndDrag` /
   `onMomentumScrollEnd`, sem dependência nova. A conta "offset → status" fica
   em `status-from-offset.ts`, pura e testada.
5. **Livro com capa.** A folha usa `BookArt` (capa real quando existe) e mantém
   a prévia de rosto só para quem está sem capa; a capa mostra o selo do status.
6. **Concluir sem ler tudo.** O dono decidiu que concluir, em qualquer lugar do
   app, preenche as páginas lidas (ADR 0018). A roda grava `finished`, o
   repositório leva `pagesRead` ao total e não há aviso extra.

## Tarefas

1. **Chip:** aceitar `onLongPress`/`delayLongPress` sem alterar o toque simples
   e expor `accessibilityHint` (ex.: "Segure para trocar o status") e uma ação
   acessível que abra a mesma folha.
2. **Conta pura:** `status-from-offset.ts` em `src/features/library/` recebe o
   offset da roda e devolve o status central (com clamp nas pontas), testada
   com os quatro status e offsets fora da faixa.
3. **Roda:** componente `StatusWheel` com os quatro rótulos
   (`Lendo`, `Quero ler`, `Pausado`, `Concluído`), item central destacado,
   `onPreview(status)` a cada mudança e `onSettle(status)` ao parar.
4. **Folha:** `QuickStatusSheet` recebe o livro, mostra `BookArt`/`Spine` com
   `status={preview}` e grava pelo `useBooks().update(id, { status })`, que já
   avisa as outras telas.
5. **Estante:** o `onLongPress` do chip abre a folha do livro; a grade usa
   `preview` enquanto a folha estiver aberta (para a lombada do card também
   mudar, se não estiver coberta).
6. **Testes:** conta pura; long-press abre e toque simples não; deslizar muda o
   rótulo/rosto de prévia; confirmar grava e atualiza o chip; cancelar não
   grava; escolher o status atual não escreve de novo.
7. **Docs:** `docs/architecture.md` (Estante + roda), `docs/design/design-system.md`
   (interação do chip), `docs/testing.md`, `CURRENT.md`, `roadmap.md` e
   `CHANGELOG.md`. Sem ADR, salvo se a interação mudar de forma relevante.

## Aceite

- [x] Segurar o chip de status (~500 ms) abre a roda; toque simples continua
      sem trocar status.
- [x] Deslizar a roda muda o rosto da lombada em tempo real, passando pelos
      quatro status, sem gravar no banco.
- [x] Soltar/confirmar grava o status e o chip da Estante muda na hora.
- [x] Cancelar mantém o status anterior.
- [x] Registro em livro `paused`/`queued` continua mudando para `reading` pela
      Hoje/detalhe; a roda é só uma edição manual.
- [x] A folha é operável por leitor de tela (ação + roda ajustável).
- [ ] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes; conferido no
      Android.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec,
`src/features/library/EstanteScreen.tsx`, `src/components/ui/Chip.tsx`,
`src/components/ui/Spine.tsx`, `src/components/ui/BookArt.tsx`,
`src/features/library/spine-art.ts`, `src/features/library/use-books.tsx`,
`docs/design/assets-3d.md` e ADR 0011.

## Arquivos prováveis

- `src/features/library/EstanteScreen.tsx`
- `src/features/library/quick-status-sheet.tsx`,
  `src/features/library/status-wheel.tsx`, `status-from-offset.ts` + testes
- `src/components/ui/Chip.tsx`
- `src/test-utils/render.tsx` (se precisar de provider novo)
- `docs/architecture.md`, `docs/design/design-system.md`, `docs/testing.md`

## Riscos

- **Gesto roubado:** o toque longo no chip não pode abrir o detalhe do livro nem
  filtrar a estante. Testar no card inteiro e na borda do chip.
- **Prévia que grava:** separar `preview` (estado local) de `commit`
  (repositório). Nada de `update` durante o deslize.
- **Snap no Android:** a roda pode tremer ou parar entre itens; testar em
  densidades diferentes e com 4 itens.
- **Capa sem rosto:** livro com capa não tem a expressão da lombada; usar
  `BookArt` e deixar claro que a prévia visual é a capa.
- **Testes frágeis:** não depender de frames do Reanimated; afirmar sobre props,
  rótulos e o repositório em memória.

## Próximo depois desta

**S9** — conclusão + resenha.
