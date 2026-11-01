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

## Decisões confirmadas na abertura (2026-11-01, revisadas na conferência)

> A primeira versão abriu uma folha modal. Na conferência, o dono rejeitou a
> folha ("nem é, nem nunca vai ser uma roda") e pediu a roda radial flutuante na
> própria tela. As decisões abaixo refletem a revisão.

1. **Onde a roda aparece.** Roda radial flutuante na mesma tela, centrada no
   toque do chip; as quatro opções abrem em círculo ao redor do dedo. Nada de
   folha, tela nova ou modal.
2. **Quando grava.** Grava ao soltar o dedo, com o status do setor em que ele
   parou. Voltar ao miolo cancela; tocar fora cancela. Sem botão "Salvar".
3. **Descoberta.** Só toque longo (~500 ms) seguido de arraste abre e controla a
   roda; o toque simples continua sem trocar status. Para leitor de tela, o chip
   expõe a ação "Trocar status" e a roda oferece as quatro opções como botões.
4. **Gesto.** `Pan` do `react-native-gesture-handler` com
   `activateAfterLongPress(500)`: o mesmo toque continua sendo rastreado depois
   de a roda abrir. A roda é um overlay irmão do `Screen` (sem `Modal`, que
   cancelaria o gesto); a geometria ângulo → status e o clamp ficam puros em
   `status-wheel-geometry.ts`. Entrada/saída e destaque usam Reanimated.
5. **Livro com capa.** O card mantém a capa e o selo de status acompanha a
   prévia; sem capa, o rosto da lombada muda em tempo real.
6. **Concluir sem ler tudo.** O dono decidiu que concluir, em qualquer lugar do
   app, preenche as páginas lidas (ADR 0018). A roda grava `finished`, o
   repositório leva `pagesRead` ao total e não há aviso extra.

## Tarefas

1. **Trigger:** `StatusWheelTrigger` envolve o chip, aceita o `Pan` com
   `activateAfterLongPress` e expõe `accessibilityHint` + ação acessível.
2. **Geometria pura:** `status-wheel-geometry.ts` converte ângulo/dedo em status,
   define raio/opções e faz o clamp na tela; testes cobrem setores, fronteiras,
   miolo e bordas.
3. **Roda:** `StatusWheelOverlay` desenha anel e quatro opções
   (`Lendo`, `Quero ler`, `Pausado`, `Concluído`), destaca a selecionada com
   mola, anima a entrada/saída e fecha ao soltar.
4. **Estante:** o chip abre a roda; a grade e a lombada/capa usam `preview`
   enquanto aberta; soltar grava pelo `useBooks().update(id, { status })`.
5. **Testes:** geometria pura; gesto (abrir, prévia, soltar, miolo); a11y
   (ação + opção); tocar fora; status atual sem escrita; concluir preenche
   páginas. Usar o controller do RNGH no teste de gesto.
6. **Docs:** `docs/architecture.md`, `docs/design/design-system.md`,
   `docs/testing.md`, `CURRENT.md`, `roadmap.md`, `CHANGELOG.md` e ADR 0018.

## Aceite

- [x] Segurar o chip de status (~500 ms) abre a roda radial flutuante ao redor
      do chip; toque simples continua sem trocar status.
- [x] Deslizar o dedo na roda muda o rosto da lombada/capa em tempo real,
      destacando a opção, sem gravar no banco.
- [x] Soltar grava o status e o chip da Estante muda na hora.
- [x] Voltar ao miolo, tocar fora ou cancelar mantém o status anterior.
- [x] Registro em livro `paused`/`queued` continua mudando para `reading` pela
      Hoje/detalhe; a roda é só uma edição manual.
- [x] A roda é operável por leitor de tela (ação no chip + opções botão).
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
- `src/features/library/status-wheel-trigger.tsx`,
  `status-wheel-overlay.tsx`, `status-wheel-geometry.ts` + teste
- `src/components/ui/Chip.tsx`
- `src/test-utils/render.tsx` (se precisar de provider novo)
- `docs/architecture.md`, `docs/design/design-system.md`, `docs/testing.md`

## Riscos

- **Gesto roubado:** o toque longo no chip não pode abrir o detalhe do livro nem
  filtrar a estante. Testar no card inteiro e na borda do chip.
- **Modal cancela o gesto:** a roda fica na mesma janela; abrir um `Modal`
  interromperia o `Pan` em andamento. Não volte atrás sem testar no Android.
- **Coordenadas:** a roda usa `absoluteX/Y` e é posicionada na raiz da tela;
  conferir em telas com tab bar, status bar e densidades diferentes.
- **Prévia que grava:** separar `preview` (estado local) de `commit`
  (repositório). Nada de `update` durante o arraste.
- **Capa sem rosto:** livro com capa não tem a expressão da lombada; o selo e a
  prévia do chip mostram o status.
- **Testes frágeis:** o `runOnJS` do mock é microtask; envolver o controller do
  gesto em `await act(async …)`. Não depender de frames do Reanimated; afirmar
  sobre props, rótulos e o repositório em memória.

## Próximo depois desta

**S9** — conclusão + resenha.
