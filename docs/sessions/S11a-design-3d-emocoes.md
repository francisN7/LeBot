# S11a — Lombada B, tassel e capa com profundidade

## Objetivo

Fazer a lombada e a capa lerem como **objetos de livro**, com a anatomia da
capa dura, um tassel de verdade e uma capa que mantém a foto inteira.

## Diagnóstico

- A primeira tentativa (52×128, face lateral chapada e bloco de páginas por cima
  da foto) foi reprovada na conferência visual: lia como fita/tijolo, o bloco
  parecia recorte e o tassel era uma ponta escura.
- A lombada de frente é um **cilindro**: o volume vem do gradiente curvo, das
  headband/tailband e das nervuras, não de uma faixa lateral.
- O tassel é **corda + corpo + pescoço + franja**; o “zzz” do sono deve flutuar
  na diagonal; em “Lendo” os olhos ficam um pouco mais afastados.
- A capa precisa de profundidade **sobre a própria foto** (sombra e luz), sem
  cobrir a arte com páginas.

## Decisões fechadas (revisão 2, aprovada em 2026-11-01)

1. **Lombada B**, 64×128 no cheio e 52×104 no compacto (proporção 1:2 exata).
   Capa 88×128 / 72×104. Mini-lombada de “Meu ritmo” 30×60.
2. **Corpo cilíndrico** com gradiente horizontal `edge → base → light → edge` e
   sombra vertical discreta nas pontas. Sem face lateral.
3. **Headband/tailband** listradas (7 e 111 px) e **duas nervuras** (52 e
   103 px), com sombra acima e luz abaixo.
4. **Etiqueta de título** creme no topo (15–59 × 18–45), **só com o título,
   centralizado**, em até duas linhas. É uma View do `Spine` com `AppText`, não
   texto no SVG. O autor/título completo continuam no card abaixo.
   `showLabel={false}` esconde a etiqueta (mini-lombadas).
5. **Tassel T1 no canto superior esquerdo**, preso ao headband: argola cortada
   pelo topo, corda, corpo, pescoço e franja de seis fios dourados com contorno
   navy. Estático; a argola cortada sugere que sai de dentro.
6. **Capa S2:** foto inteira + sombra de vinco à esquerda (preto 38%), fio de
   luz creme (13–20%), sombra de borda à direita (42%) e na base (30%), fio de
   luz no topo/esquerda. Sem páginas e sem faixa lateral. A fita do gênero
   continua fita; o selo fica por cima da sombra.
7. **Rosto compartilhado:** `SpineFace` na lombada e no selo; `happy` com spread
   10 e as outras expressões com 8; piscada só em `happy`/`neutral`; “zzz” de
   três letras na diagonal, opacidade 1→0,3 e `translateY` 0→−2 px.
8. **Sombra de contato** nativa (`contactShadow`) no wrapper; o corpo ocupa 126
   dos 128 px. O `Pressable` da arte pinta o fundo com a cor do gênero e não
   desenha borda: o contorno navy vem do SVG. O fallback 2D continua chapado.

## Tarefas

1. **Tamanhos:** `cover` 88×128, `coverCompact` 72×104, `spine` 64×128,
   `spineCompact` 52×104; `BookArt` escolhe o par por `hasCover`; a capa mantém a
   altura. Mini-lombada 30×60.
2. **Paleta:** `SpinePalette` com `base`, `edge`, `light`, `shadow`, `highlight`,
   `ink` e `gradient` (`[edge, base, light, edge]`); remover `side` e `accent`.
   Contraste do rosto ≥ 3:1; fallback 2D intacto.
3. **Lombada (`SpineArtwork`):** viewBox 64×128; gradiente/sombra vertical;
   headband/tailband; nervuras; rosto; “zzz”; tassel T1; sombra de contato
   nativa no `Spine`. O viewBox compacto é o mesmo, escalado por 52/64.
4. **Etiqueta (`Spine`):** View creme com borda navy, posição/tamanho
   proporcionais (15–59 × 18–45), `AppText` com o título centralizado,
   `numberOfLines={2}`, `ellipsizeMode="tail"`, oculta da árvore de
   acessibilidade (o `Pressable` já anuncia “Lombada de …”). As telas principais
   deixam de passar `showLabel={false}`; a mini-lombada mantém `false`.
5. **Capa (`BookCover`):** remover o bloco de páginas; adicionar a camada S2 de
   sombra/luz sobre a foto; manter a fita, o brilho diagonal (`animated`), o selo
   e a sombra de contato. O selo usa `viewBox="14 70 36 32"` do novo rosto.
6. **Rosto (`SpineFace`):** coordenadas 64×128 (olhos em y=80, boca em 92);
   `happy` com spread 10, as outras com 8; piscada compartilhada; “zzz” com
   `testID` próprio.
7. **Preview do formulário:** manter `status` no `BookCover` do `BookFormScreen`;
   o selo acompanha o chip.
8. **Testes:** paleta sem side/accent; `BookArt` 64/52 e 88/72; etiqueta no topo;
   tassel no topo; “zzz” no pausado; capa com `-depth`; selo por status; preview.
   Não afirmar sobre frames; validar montagem e props.
9. **Docs:** `assets-3d.md`, `design-system.md`, `testing.md`, `CURRENT.md`,
   `roadmap.md`, `CHANGELOG.md`, ADR 0022 e esta spec.

## Aceite

- [ ] A lombada B tem 64×128 (52×104 compacta), lê como cilindro com
      headband/tailband e nervuras, não como fita/tijolo.
- [ ] O título aparece na etiqueta do topo, centralizado, em até duas linhas;
      o autor continua no card. A mini-lombada não mostra etiqueta.
- [ ] O tassel T1 fica no canto superior esquerdo, com argola cortada, corda,
      corpo, pescoço e franja dourada; é reconhecível como tassel no cheio e no
      compacto.
- [ ] Em “Lendo” os olhos estão mais afastados; em “Pausado” o “zzz” flutua na
      diagonal.
- [ ] A capa mantém a foto inteira e ganha profundidade S2 (vinco + sombra de
      borda + luz), sem páginas nem faixa lateral; o selo e a fita continuam.
- [ ] O preview do formulário mostra o selo do status escolhido.
- [ ] Fallback 2D, contraste do rosto e toque no objeto continuam funcionando;
      a altura dos cards/linhas não muda e a capa mantém 88/72.
- [ ] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes; conferido no
      Android.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `docs/design/assets-3d.md`,
`docs/design/design-system.md`, `docs/adr/0011-arte-vetorial-parametrica.md`,
`src/components/ui/Spine.tsx`, `SpineArtwork.tsx`, `SpineFace.tsx`,
`BookCover.tsx`, `BookArt.tsx`, `src/features/library/spine-art.ts`,
`src/features/library/BookFormScreen.tsx` e `src/theme/sizes.ts`.

## Arquivos prováveis

- `src/components/ui/SpineArtwork.tsx`, `SpineFace.tsx`, `Spine.tsx`,
  `BookCover.tsx`, `BookArt.tsx`
- `src/features/library/spine-art.ts` + testes
- `src/features/library/BookFormScreen.tsx` + teste
- `src/components/ui/Spine.test.tsx`, `BookCover.test.tsx`, `BookArt.test.tsx`
- `src/features/stats/FinishedStrip.tsx`
- `docs/design/assets-3d.md`, `docs/design/design-system.md`, `docs/testing.md`
- ADR 0022

## Riscos

- **Tassel pequeno:** a argola/corda/franja em 52×104 pode virar um borrão;
  conferir no aparelho e, se preciso, simplificar a franja no compacto.
- **Etiqueta legível:** o título em 8/6,5 px pode ficar apertado; testar títulos
  longos e o truncamento em duas linhas.
- **Sombra da capa:** em fotos muito escuras a sombra preta some; o fio de luz
  creme no topo/esquerda é o que mantém a profundidade.
- **Capa × lombada:** a lombada 64 ainda é mais estreita que a capa 88; conferir
  lado a lado que a diferença é intencional.
- **Cores escuras:** as nervuras/faixas usam `edge`/`highlight` derivados; não
  usar preto/creme fixos.
- **Acessibilidade:** a etiqueta está fora da árvore; o `Pressable` precisa
  continuar anunciando “Lombada de <título>”.
- **Regressão de toque:** o `Pressable` transparente da arte não pode perder o
  toque; a etiqueta e o SVG são `pointerEvents="none"`.

## Próximo depois desta

**S12** — release interno, com a spec em `docs/sessions/S12-release-interno.md`.
A conferência visual da S11a no Android é o único item pendente.
