# Estado atual

## Sessão

- **Atual:** S11a revisão 3 implementada em 2026-11-01; falta **conferir no
  Android**.
- **Última concluída:** S11 (configurações + backup ZIP), conferida no Android.
- **Próxima:** conferir a S11a no aparelho; depois S12 (release interno), spec em
  `docs/sessions/S12-release-interno.md`.

## Pronto (S11a)

- Lombada **B** aprovada: 64×128 (`spine`) e 52×104 (`spineCompact`), proporção
  1:2. Capa 88×128 (`cover`) e 72×104 (`coverCompact`). Mini-lombada 30×60.
- Corpo cilíndrico com gradiente de quatro paradas, headband/tailband listradas
  e duas nervuras (52 e 103 px). Sem face lateral chapada e **sem retângulo de
  fundo**: o `Pressable` da arte é transparente e o contorno navy vem do SVG.
- Etiqueta de título **centralizada** (11–53 × 19–38 no viewBox 64×128), mais
  baixa, só com o título. Fonte **Fredoka 600** com tamanho dinâmico
  (`fitSpineTitle`: máx. 7, mín. 5; depois ellipsis em duas linhas). As telas
  principais mostram a etiqueta; a mini-lombada usa `showLabel={false}`.
- Tassel **T1** no canto superior esquerdo: **sem argola**; a corda sai do topo,
  encontra corpo e pescoço e termina na franja de seis fios. Gradiente dourado,
  aresta escura e sombra desfocada no corpo; balança ±3° em 1,7 s.
- Rosto: olhos de “Lendo” mais afastados (spread 10; as outras expressões 8);
  piscada compartilhada no `SpineFace`; “zzz” de três letras na diagonal com
  opacidade e `translateY` animados no pausado.
- Capa **S2**: foto inteira, sombra de vinco à esquerda, fio de luz creme,
  sombra de borda à direita/base e fio de luz no topo. Sem páginas e sem faixa
  lateral; fita do gênero continua fita; selo por cima da sombra.
- `SpinePalette` com `edge`, `light`, `shadow`, `highlight` e `gradient`;
  `side`/`accent` saíram. O tassel usa o dourado da marca.
- 510 testes em 66 arquivos; lint, typecheck, test e export verdes. Sem migração.
  ADR 0022 atualizada; `docs/release.md` entra na S12.

## Decisões abertas

- Conferir no Android: tassel no compacto e o balanço, etiqueta em 5–7 px com
  títulos longos, “zzz” diagonal, sombra S2 em fotos claras/escuras e
  alinhamento da grade em 64 px.
- Backlog: galeria de citações, `finished_at`, grid ajustável na Estante,
  refinamento das animações do mascote, tema escuro e temas extras.
- S12: decidir build local (prebuild + Gradle) × EAS antes de gerar o APK.

## Arquivos-chave

- `src/components/ui/SpineArtwork.tsx`, `SpineFace.tsx`, `Spine.tsx`,
  `BookCover.tsx`, `BookArt.tsx`
- `src/features/library/spine-art.ts`, `spine-label.ts` (+ testes),
  `BookFormScreen.tsx`
- `src/theme/sizes.ts`, `src/theme/shadows.ts`
- `src/features/stats/FinishedStrip.tsx`
- `docs/design/assets-3d.md`, `docs/design/design-system.md`, ADR 0022
- `docs/sessions/S11a-design-3d-emocoes.md`, `docs/sessions/S12-release-interno.md`
- `.temp/` (mockups da sessão; ignorado; apagar no fim)

## Armadilhas

- O `Pressable` da arte é **transparente**; o fundo na cor do gênero atrás do
  corpo virava um retângulo nos cantos. Não volte a preencher o fundo.
- A etiqueta é uma View, não texto no SVG; está fora da árvore de acessibilidade
  (`accessibilityElementsHidden`) e o `Pressable` anuncia o título. Em teste,
  consulte com `{ includeHiddenElements: true }`.
- A etiqueta fica em 11–53 × 19–38 (64×128) e centralizada; o título encolhe via
  `fitSpineTitle` até 5 e depois usa ellipsis. Não fixe o fontSize em 8.
- `showLabel={false}` esconde a etiqueta; as telas principais **não** passam
  false (só a mini-lombada). Não reintroduza o false sem revisar o layout.
- O tassel não tem argola: a corda começa em y=0 e é cortada pelo topo. A sombra
  é um `Ellipse` desfocado; o grupo gira ±3° em torno de (6, 0). Não volte à
  argola nem ao contorno navy de “sticker”.
- O viewBox é 64×128; não reuse o 100×140 nem o 52×128 antigo sem redesenhar o
  rosto (olhos em y=80, boca em 92).
- A capa S2 é sombra sobre a foto; não volte a colocar bloco de páginas/faixa
  lateral. O selo usa `viewBox="14 70 36 32"` do rosto novo.
- A mini-lombada 30×60 mantém 1:2; não volte ao 30×74.
- O `.temp/` está no `.gitignore`; apagar os mockups no fim da sessão
  (`.temp/README.md` tem a lista e o comando).

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```
