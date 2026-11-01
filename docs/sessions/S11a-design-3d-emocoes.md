# S11a — Design 3D da lombada e emoções

## Objetivo

Fazer a lombada e a capa parecerem **objetos com volume**, não retângulos com
sombra. Refazer o detalhe lateral da capa e dar vida ao selo de emoção, com as
mesmas expressões da lombada sem capa.

## Diagnóstico

- A lombada atual (`SpineArtwork.tsx`) é um retângulo arredondado com uma faixa
  escura vertical à direita (`SHADE_PATH`, x 76–100), um filete claro à esquerda
  (x 10) e faixas no topo/base. São manchas chapadas: o olho lê "2D com sombra",
  não uma face lateral.
- A capa (`BookCover.tsx`) tenta virar livro com um bloco creme fixo na borda
  direita (7% da largura) e três linhas horizontais. No tamanho real isso lê como
  uma etiqueta/barcode colada na foto, sem relação com páginas nem com a
  perspectiva da lombada.
- O selo de emoção da capa (`SpineFace` dentro de `BookCover`) é estático. A
  lombada pisca (`SpineArtwork` anima `eyesProps`), mas a capa não.
- O preview de capa no formulário (`BookFormScreen`) não passa `status`, então o
  selo nem aparece ali.

## Decisões a confirmar na abertura

1. **Como fazer o volume.** Recomendo desenhar o volume no próprio SVG, com
   **duas faces** (frente + lateral direita) e gradiente horizontal, em vez de
   `rotateY`/`perspective` do React Native. O SVG é previsível no Android, não
   distorce o toque nem o layout e mantém a arte paramétrica. Confirmar se o
   dono quer algo mais "isométrico" (arestas retas) ou mais "fotográfico"
   (gradiente suave). Recomendo isométrico suave.
2. **Detalhe lateral da capa.** Recomendo **refazer** o bloco de páginas como
   uma face lateral em perspectiva (trapézio creme com linhas finas e vinco
   escuro na divisa com a foto), não remover. Se o dono preferir mais limpo,
   removemos o bloco e deixamos só a sombra de contato. **Perguntar antes.**
3. **Piscada do selo.** Recomendo piscar **só os olhos**, como na lombada, nos
   estados `happy` (Lendo) e `neutral` (Quero ler); `sleepy` já tem olhos
   fechados e `shine` (Concluído) tem estrelas — nesses dois, nada pisca.
4. **Selos e expressões.** Manter uma fonte única (`expressionByStatus`) para
   lombada e capa: Lendo = feliz, Quero ler = neutro, Pausado = sonolento,
   Concluído = brilho. Passar `status` ao preview do formulário para o selo
   aparecer também ao escolher a capa.
5. **Sombra de contato.** Recomendo uma sombra curta sob o livro (elipse/faixa
   com opacidade baixa) no detalhe e na grade, sem aumentar o card. Confirmar se
   o dono quer sombra também na grade ou só no detalhe.

## Tarefas

1. **Paleta:** estender `SpinePalette` (`spine-art.ts`) com `side`, `edge`,
   `shadow` e paradas do gradiente, derivadas do hex do gênero; manter `ink` e o
   contraste ≥ 3:1. Testes puros da paleta e do fallback 2D.
2. **Lombada:** refazer `SpineArtwork` no mesmo `viewBox` 100×140:
   - frente com gradiente horizontal (borda escura → base → luz → borda);
   - lateral direita visível, com topo/base em perspectiva (arestas inclinadas);
   - vinco/charneira à esquerda, sem o filete vertical atual;
   - faixas de topo/base acompanhando a perspectiva;
   - sombra de contato sob o objeto;
   - rosto na frente, centralizado, com a mesma piscada/brilho/"z".
   O fallback sem status continua chapado.
3. **Capa:** refazer a lateral de `BookCover`:
   - remover o bloco de 7% com três linhas;
   - desenhar a face de páginas como trapézio creme com linhas finas, vinco
     escuro na divisa e canto externo arredondado;
   - manter fita do gênero, brilho diagonal e selo;
   - garantir que o selo não encoste na face de páginas;
   - sombra de contato sob a capa.
4. **Selo animado:** extrair a boca/olhos animáveis para um componente
   compartilhado (`SpineFaceArtwork` ou `SpineFace` com `animated`/`blink`),
   reutilizado pela lombada e pelo selo. A piscada anima só a opacidade dos
   olhos (1 → 0 → 1, ~70/90 ms) a cada ~2,6 s; boca e acessórios ficam parados.
5. **Preview do formulário:** passar `status` ao `BookCover` do
   `BookFormScreen`; o selo acompanha o chip de status escolhido.
6. **Testes:**
   - paleta/expressões puras (`spine-art.test.ts`): side/shade, ink, fallback;
   - `Spine.test.tsx` / `BookCover.test.tsx`: presença do selo por status,
     `expressionByStatus` igual nos dois, ausência de selo sem status;
   - `BookFormScreen.test.tsx`: preview com selo e troca de expressão ao mudar o
     chip;
   - não afirmar sobre frames de animação; validar montagem e props.
7. **Docs:** `docs/design/assets-3d.md` (formato, faces, movimento), 
   `docs/design/design-system.md` (`Spine`, `BookCover`, `RatingStars` sem
   mudança), `docs/testing.md`, `CURRENT.md`, `roadmap.md`, `CHANGELOG.md` e ADR
   0020 para a técnica de volume (SVG com faces × perspectiva nativa).

## Aceite

- [ ] A lombada lê como objeto de volume: frente, lateral e topo/base coerentes
      em 88×128 e 72×104, para os 4 status e qualquer cor de gênero.
- [ ] A lateral da capa parece páginas de um livro, não uma etiqueta; a foto
      continua legível e o selo não a cobre.
- [ ] O selo da capa pisca os olhos nos estados feliz/neutro e usa as mesmas
      expressões da lombada nos quatro status.
- [ ] O preview do formulário mostra o selo do status escolhido.
- [ ] Nada muda de tamanho, posição de toque ou layout dos cards; grade e
      detalhe continuam alinhados.
- [ ] Fallback 2D e contraste do rosto continuam funcionando.
- [ ] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes; conferido no
      Android.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `docs/design/assets-3d.md`,
`docs/design/design-system.md`, `docs/adr/0011-arte-vetorial-parametrica.md`,
`src/components/ui/Spine.tsx`, `SpineArtwork.tsx`, `SpineFace.tsx`,
`BookCover.tsx`, `BookArt.tsx`, `src/features/library/spine-art.ts`,
`src/features/library/BookFormScreen.tsx` e `src/theme/sizes.ts`.

## Arquivos prováveis

- `src/components/ui/SpineArtwork.tsx`, `SpineFace.tsx`, `BookCover.tsx`
- `src/features/library/spine-art.ts` + testes
- `src/features/library/BookFormScreen.tsx` + teste
- `src/components/ui/Spine.test.tsx`, `BookCover.test.tsx`
- `docs/design/assets-3d.md`, `docs/testing.md`, ADR 0020

## Riscos

- **Parecer 3D de verdade:** duas faces chapadas podem continuar "2D com
  sombra"; o gradiente e as arestas inclinadas precisam de conferência visual no
  aparelho, não só no teste.
- **Tamanho compacto:** a face lateral de 14% do viewBox pode virar um risco
  fino em 72×104; prever escala mínima e testar na Ordem/Hoje.
- **Cores escuras:** sombra/lateral precisam manter contraste e o rosto legível;
  não usar preto fixo.
- **Selo pequeno:** a piscada não pode fazer o rosto "sumir" no tamanho de 18–26
  px; testar no aparelho.
- **Regressão de toque:** qualquer wrapper novo não pode roubar o `Pressable` da
  lombada/capa.
- **Animação duplicada:** a piscada do selo e da lombada deve compartilhar o
  mesmo componente, para não divergirem com o tempo.

## Próximo depois desta

**S11** — configurações + backup JSON (ou S10, conforme prioridade do dono).
