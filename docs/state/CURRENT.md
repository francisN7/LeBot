# Estado atual

## Sessão

- **Atual:** S11a revisão 2 implementada em 2026-11-01; falta **conferir no
  Android**.
- **Última concluída:** S11 (configurações + backup ZIP), conferida no Android.
- **Próxima:** conferir a S11a no aparelho; depois S12 (release interno), spec em
  `docs/sessions/S12-release-interno.md`.

## Pronto (S11a)

- Lombada **B** aprovada: 64×128 (`spine`) e 52×104 (`spineCompact`), proporção
  1:2. Capa 88×128 (`cover`) e 72×104 (`coverCompact`). Mini-lombada 30×60.
- Corpo cilíndrico com gradiente de quatro paradas, headband/tailband listradas
  e duas nervuras (52 e 103 px). Sem face lateral chapada.
- Etiqueta de título no topo (15–59 × 18–45), **só o título, centralizado**, em
  até duas linhas, como View/`AppText` (não texto no SVG). As telas principais
  mostram a etiqueta; a mini-lombada usa `showLabel={false}`.
- Tassel **T1** no canto superior esquerdo: argola cortada pelo topo, corda,
  corpo, pescoço e franja de seis fios dourados com contorno navy. Estático.
- Rosto: olhos de “Lendo” mais afastados (spread 10; as outras expressões 8);
  piscada compartilhada no `SpineFace`; “zzz” de três letras na diagonal com
  opacidade e `translateY` animados no pausado.
- Capa **S2**: foto inteira, sombra de vinco à esquerda, fio de luz creme,
  sombra de borda à direita/base e fio de luz no topo. Sem páginas e sem faixa
  lateral; fita do gênero continua fita; selo por cima da sombra.
- `SpinePalette` ganhou `edge`, `light`, `shadow`, `highlight` e `gradient`;
  `side` e `accent` saíram. O `Pressable` da arte pinta o fundo com a cor do
  gênero e o contorno navy vem do SVG.
- 505 testes em 65 arquivos; lint, typecheck, test e export verdes. Sem migração.
  ADR 0022 atualizada; `docs/release.md` entra na S12.

## Decisões abertas

- Conferir no Android: tassel no compacto, etiqueta em 8/6,5 px com títulos
  longos, “zzz” diagonal, sombra S2 em fotos claras/escuras e alinhamento da
  grade em 64 px.
- Backlog: galeria de citações, `finished_at`, grid ajustável na Estante,
  refinamento das animações do mascote, tema escuro e temas extras.
- S12: decidir build local (prebuild + Gradle) × EAS antes de gerar o APK.

## Arquivos-chave

- `src/components/ui/SpineArtwork.tsx`, `SpineFace.tsx`, `Spine.tsx`,
  `BookCover.tsx`, `BookArt.tsx`
- `src/features/library/spine-art.ts` (+ teste), `BookFormScreen.tsx`
- `src/theme/sizes.ts`, `src/theme/shadows.ts`
- `src/features/stats/FinishedStrip.tsx`
- `docs/design/assets-3d.md`, `docs/design/design-system.md`, ADR 0022
- `docs/sessions/S11a-design-3d-emocoes.md`, `docs/sessions/S12-release-interno.md`
- `.temp/` (mockups da sessão; ignorado; apagar no fim)

## Armadilhas

- A etiqueta é uma View, não texto no SVG; está fora da árvore de acessibilidade
  (`accessibilityElementsHidden`) e o `Pressable` anuncia o título. Em teste,
  consulte com `{ includeHiddenElements: true }`.
- `showLabel={false}` esconde a etiqueta; as telas principais **não** passam
  false (só a mini-lombada). Não reintroduza o false sem revisar o layout.
- O `Pressable` da arte usa a cor do gênero como fundo e não desenha borda; o
  contorno navy é o stroke do corpo no SVG. Não duplique a borda.
- O tassel T1 usa coordenadas no topo (argola em y≈0,8, franja até y≈23) e é
  desenhado fora do clip; a argola é cortada pelo topo de propósito.
- O viewBox é 64×128; não reuse o 100×140 nem o 52×128 antigo sem redesenhar o
  rosto (olhos em y=80, boca em 92).
- A capa S2 é sombra sobre a foto; não volte a colocar bloco de páginas/faixa
  lateral. O selo usa `viewBox="14 70 36 32"` do rosto novo.
- `SpinePalette` não tem mais `side`/`accent`; o tassel usa `colors.gold` e
  `colors.goldDeep`.
- A mini-lombada 30×60 mantém 1:2; não volte ao 30×74.
- O `.temp/` está no `.gitignore`; apagar os mockups no fim da sessão
  (`.temp/README.md` tem a lista e o comando).

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```
