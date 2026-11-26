# S14c — Leveza I: animação com hora para acabar

## Objetivo

Zerar o gasto de tela parada e de aba escondida: nenhuma animação roda fora de
foco nem em loop sem fim. O resultado é medido no APK de release contra o
orçamento da ADR 0029.

## Fora de escopo

- Ordem O(n), fade da splash, custo da célula na rolagem e APK por ABI: são da
  S14d.
- Arte nova, ou trocar SVG por Skia ou `FlashList` (caminho B).
- Refactor de tamanho de `SpineArtwork` (fica na S14g+); aqui só muda
  **quando** anima.

## Tarefas

1. **Medidores no repo.** Promover a `scripts/` os medidores da S14b: boot por
   vídeo, abas, parado por aba, roda de status e CPU por thread, seguindo
   `reference/performance.md` → **Como cada número foi tirado**. Usar bash +
   Node (análise de quadros lendo o `rawvideo` do `ffmpeg`), sem Python. Os
   protótipos da S14b não ficaram no repo.
2. **Foco.** Pausar as animações quando a tela perde o foco (`useIsFocused`
   ou `freezeOnBlur` nas abas) e retomar ao voltar.
3. **Loops com fim.** Em `Mascot` (respiração, piscada, acessório),
   `SpineArtwork` e `SpineFace` (balanço, brilho, sono, piscada), `BookCover`
   e `QueueRow` (brilho), animar ao entrar, ao tocar ou num evento, e parar.
   Loop só com a tela em foco, num elemento por tela.
4. **Reduzir movimento.** Com a opção do sistema ligada, nenhum loop (usar
   `useReducedMotion` do Reanimated).
5. **Testes** para a regra de pausa e de "reduzir movimento" nos componentes.
6. **Medir** no APK de release (`workflow_dispatch` sem `tag`), com f200, e
   acrescentar a coluna "S14c" em `reference/performance.md`.

## Aceite

- [ ] Medidores em `scripts/` com `--help`, citados em `guide/setup.md`.
- [ ] f200: qualquer aba parada há 3 s fica em ≤ 30 quadros em 10 s e ≤ 5% de
  CPU; aba escondida em 0%. Hash do APK anotado.
- [ ] Rolagem e roda sem piora contra a S14b.
- [ ] lint, typecheck, testes e docs verdes; commit `S14c: ...`.

## Orçamento de contexto (≤ 400 linhas)

`AGENTS.md`, `CURRENT.md`, esta spec, a ADR 0029 e `reference/performance.md`
→ **Como cada número foi tirado** e **Orçamento**. Código: os `useEffect` com
`withRepeat` (`grep -rn withRepeat src`) e `src/app/(tabs)/_layout.tsx`.

## Arquivos prováveis

`src/components/ui/{Mascot,SpineArtwork,SpineFace,BookCover}.tsx`,
`src/features/queue/QueueRow.tsx`, `src/features/library/EstanteScreen.tsx`,
`src/app/(tabs)/_layout.tsx` e `scripts/measure-*.sh`.

## Riscos

- **Perder a vida do app:** a arte continua; muda só quando ela anima. Conferir
  com o dono no aparelho.
- **Retomar errado ao voltar de foco** (lombada congelada no meio do balanço):
  usar o `SETTLE_MS` que já existe.
- **Medir no Expo Go:** não vale; só APK de release.
- **Acervo do aparelho:** restaurar o fixture apaga o real; pedir backup ao dono.

## Próximo depois desta

S14d — Leveza II: Ordem sem O(n), splash, rolagem e APK por ABI.
