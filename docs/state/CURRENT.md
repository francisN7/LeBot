# Estado atual

## Sessão

- **Atual:** nenhuma; S11a concluída em 2026-11-01, com o **balanço do tassel
  pendente**.
- **Última concluída:** S11a (lombada B + etiqueta + capa S2), conferida no
  Android. O desenho foi aprovado; o tassel **não animou**.
- **Próxima:** **S11b — tassel animado**, spec em
  `docs/sessions/S11b-tassel-animado.md`; depois S12 (release interno).

## Pronto (S11a)

- Lombada **B**: 64×128 (`spine`) e 52×104 (`spineCompact`), 1:2; capa 88×128 /
  72×104; mini-lombada 30×60. Corpo cilíndrico, headband/tailband e duas
  nervuras. `Pressable` transparente: o contorno navy é o do SVG, sem retângulo
  de fundo nos cantos.
- Etiqueta centralizada (11–53 × 19–38), baixa, só o título, Fredoka 600 com
  `fitSpineTitle` (7→5; depois ellipsis). As telas principais mostram; a
  mini-lombada usa `showLabel={false}`.
- Tassel T1 no canto superior esquerdo: sem argola, corda saindo do topo,
  corpo/pescoço/franja em gradiente dourado, aresta escura e sombra desfocada.
  O balanço foi tentado com `AnimatedG`/`rotation` e **não animou no Android**;
  a S11b vai pesquisar/modelar/aprovar/refazer.
- Rosto: olhos de “Lendo” mais afastados (10; outras 8), piscada compartilhada e
  “zzz” diagonal flutuante no pausado.
- Capa **S2**: foto inteira, vinco de lombada e sombra de borda sobre a foto,
  sem páginas/faixa lateral; fita e selo continuam.
- `SpinePalette` com `edge`, `light`, `shadow`, `highlight`, `gradient`;
  `side`/`accent` saíram. 510 testes em 66 arquivos; lint, typecheck, test,
  doctor e export verdes. Sem migração. ADR 0022.

## Decisões abertas

- **S11b:** pesquisar referência real, diagnosticar o `AnimatedG`, montar 3
  modelos para a esquerda e aprovar um; só depois implementar.
- S12: decidir build local (prebuild + Gradle) × EAS antes do APK.
- Backlog: galeria de citações, `finished_at`, grid ajustável, animações do
  mascote, tema escuro e temas extras.

## Arquivos-chave

- `src/components/ui/SpineArtwork.tsx`, `SpineFace.tsx`, `Spine.tsx`,
  `BookCover.tsx`, `BookArt.tsx`
- `src/features/library/spine-art.ts`, `spine-label.ts` (+ testes),
  `BookFormScreen.tsx`
- `src/theme/sizes.ts`, `src/theme/shadows.ts`
- `src/features/stats/FinishedStrip.tsx`
- `docs/design/assets-3d.md`, `docs/design/design-system.md`, ADR 0022
- `docs/sessions/S11a-design-3d-emocoes.md`,
  `docs/sessions/S11b-tassel-animado.md`, `docs/sessions/S12-release-interno.md`
- `.temp/` (vazio; reservado para os modelos da S11b; ignorado)

## Armadilhas

- **Tassel não animou** com `AnimatedG` + `rotation`/Reanimated no Android. O
  `swing`/`AnimatedG` está no código, mas não é confiável: a S11b deve testar um
  protótipo mínimo no aparelho antes dos modelos. Não repita a mesma técnica sem
  diagnóstico.
- O `Pressable` da arte é transparente; o fundo na cor do gênero virava um
  retângulo nos cantos. Não volte a preencher o fundo.
- A etiqueta é uma View, fora da árvore de acessibilidade (o `Pressable` anuncia
  “Lombada de …”); em teste, consulte com `{ includeHiddenElements: true }`.
  Título: 11–53 × 19–38, `fitSpineTitle` (7→5), depois ellipsis.
- `showLabel={false}` esconde a etiqueta; as telas principais não passam false
  (só a mini-lombada).
- O tassel não tem argola; a corda começa em y=0, cortada pelo topo. A sombra é
  um `Ellipse` desfocado. Não volte ao contorno navy de “sticker”.
- A capa S2 é sombra sobre a foto; não volte ao bloco de páginas/faixa lateral.
  O selo usa `viewBox="14 70 36 32"`.
- O viewBox é 64×128; o rosto tem olhos em y=80 e boca em 92. A mini-lombada
  30×60 mantém 1:2.
- `.temp/` está no `.gitignore`; os mockups da S11a foram apagados e o
  diretório ficou reservado para a S11b.

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```
