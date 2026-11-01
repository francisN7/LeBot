# S11a — Design 3D da lombada e emoções

## Objetivo

Fazer a lombada e a capa parecerem **objetos com volume**, não retângulos com
sombra. Refazer o detalhe lateral da capa e dar vida ao selo de emoção, com as
mesmas expressões da lombada sem capa.

## Diagnóstico

- A lombada atual (`SpineArtwork.tsx`) é um retângulo arredondado com uma faixa
  escura vertical à direita (`SHADE_PATH`, x 76–100) — **24% da largura**. Isso
  lê como um livro muito grosso/tijolo, além de ser uma mancha chapada: o olho
  vê "2D com sombra", não uma face lateral.
- A capa (`BookCover.tsx`) tenta virar livro com um bloco creme fixo de 7% na
  borda direita e três linhas horizontais. É estreito demais para parecer
  páginas e não tem perspectiva nem texto.
- O selo de emoção da capa (`SpineFace` dentro de `BookCover`) é estático. A
  lombada pisca (`SpineArtwork` anima `eyesProps`), mas a capa não.
- O preview de capa no formulário (`BookFormScreen`) não passa `status`, então o
  selo nem aparece ali.

## Decisões fechadas

1. **Volume no SVG**, com frente e lateral; sem `rotateY`/`perspective` nativo.
   A face lateral fica em **8–10%** da largura (hoje 24%), o que resolve a
   sensação de livro grosso sem mudar os slots de 88×128 e 72×104.
2. **"Muito grossa" = profundidade/silhueta**, não a largura do card. Os slots
   continuam iguais para não quebrar grade, Ordem, Hoje e detalhe. Se o dono
   quiser a lombada fisicamente mais estreita que o slot, isso vira uma decisão
   separada de layout.
3. **Tassel/marcador:** fita fina saindo da base da lombada, com ponta em V, na
   cor de destaque do gênero. É a pista de "livro" que a capa já tem com o
   `Bookmark`; sem física, com um balanço sutil opcional (sem mexer em layout).
4. **Lateral da capa:** face de páginas em trapézio, **10–12%** da largura, com
   **linhas que parecem texto** (segmentos de larguras variadas, em duas
   colunas), vinco escuro na divisa com a foto e canto externo arredondado. O
   formato final tem que conversar com a lombada sem capa.
5. **Sombra de contato** curta sob o objeto, na grade e no detalhe, sem aumentar
   o card.
6. **Piscada:** só os olhos, em `happy` (Lendo) e `neutral` (Quero ler);
   `sleepy` já fecha os olhos e `shine` tem estrelas.
7. **Fonte única de expressão:** `expressionByStatus` para lombada e capa —
   Lendo = feliz, Quero ler = neutro, Pausado = sonolento, Concluído = brilho.
   O preview do formulário passa a receber `status` e mostra o selo.

**Pergunta restante na abertura:** confirmar que "grossa" é a profundidade
(recomendado) e não a largura total da lombada. Se for a largura, paramos para
redesenhar os slots e o impacto na grade antes de codar.

## Tarefas

1. **Paleta:** estender `SpinePalette` (`spine-art.ts`) com `side`, `edge`,
   `shadow` e paradas do gradiente, derivadas do hex do gênero; manter `ink` e o
   contraste ≥ 3:1. Testes puros da paleta e do fallback 2D.
2. **Lombada:** refazer `SpineArtwork` no mesmo `viewBox` 100×140:
   - frente com gradiente horizontal (borda escura → base → luz → borda);
   - lateral direita visível em **8–10%** da largura, com topo/base em
     perspectiva (arestas inclinadas), sem a faixa de 24% atual;
   - vinco/charneira à esquerda, sem o filete vertical atual;
   - faixas de topo/base acompanhando a perspectiva;
   - **tassel** na base, com ponta em V, na cor de destaque do gênero, com
     `testID` próprio e balanço sutil opcional;
   - sombra de contato sob o objeto, dentro do slot (sem estourar o layout);
   - rosto na frente, centralizado, com a mesma piscada/brilho/"z".
   O fallback sem status continua chapado.
3. **Capa:** refazer a lateral de `BookCover`:
   - remover o bloco de 7% com três linhas;
   - desenhar a face de páginas como trapézio creme de **10–12%**, com
     **linhas que parecem texto** (duas colunas de segmentos com larguras
     variadas), vinco escuro na divisa e canto externo arredondado;
   - manter fita do gênero, brilho diagonal e selo;
   - garantir que o selo não encoste na face de páginas;
   - sombra de contato sob a capa, no mesmo vocabulário da lombada.
4. **Selo animado:** extrair a boca/olhos animáveis para um componente
   compartilhado (`SpineFaceArtwork` ou `SpineFace` com `animated`/`blink`),
   reutilizado pela lombada e pelo selo. A piscada anima só a opacidade dos
   olhos (1 → 0 → 1, ~70/90 ms) a cada ~2,6 s; boca e acessórios ficam parados.
5. **Preview do formulário:** passar `status` ao `BookCover` do
   `BookFormScreen`; o selo acompanha o chip de status escolhido.
6. **Testes:**
   - paleta/expressões puras (`spine-art.test.ts`): side/shade, ink, fallback;
   - `Spine.test.tsx` / `BookCover.test.tsx`: presença do selo por status,
     `expressionByStatus` igual nos dois, ausência de selo sem status, tassel na
     lombada e face de páginas com `testID` na capa;
   - `BookFormScreen.test.tsx`: preview com selo e troca de expressão ao mudar o
     chip;
   - não afirmar sobre frames de animação; validar montagem e props.
7. **Docs:** `docs/design/assets-3d.md` (formato, faces, movimento), 
   `docs/design/design-system.md` (`Spine`, `BookCover`, `RatingStars` sem
   mudança), `docs/testing.md`, `CURRENT.md`, `roadmap.md`, `CHANGELOG.md` e ADR
   0020 para a técnica de volume (SVG com faces × perspectiva nativa).

## Aceite

- [ ] A lombada lê como objeto de volume e **não** como livro grosso: face
      lateral fina, frente com gradiente e tassel visível na base, em 88×128 e
      72×104, para os 4 status e qualquer cor de gênero.
- [ ] A lateral da capa parece um bloco de páginas com texto, não uma etiqueta;
      a foto continua legível e o selo não a cobre. O formato conversa com a
      lombada sem capa.
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
- **Tamanho compacto:** a face lateral fina pode virar um risco em 72×104; o
  tassel e a sombra não podem estourar o slot nem cobrir o rosto. Testar na
  Ordem e na Hoje.
- **Cores escuras:** sombra/lateral precisam manter contraste e o rosto legível;
  não usar preto fixo.
- **Tassel:** se balançar, usar só `transform`; se atrapalhar o toque ou o
  card, deixar estático.
- **Selo pequeno:** a piscada não pode fazer o rosto "sumir" no tamanho de 18–26
  px; testar no aparelho.
- **Regressão de toque:** qualquer wrapper novo não pode roubar o `Pressable` da
  lombada/capa.
- **Animação duplicada:** a piscada do selo e da lombada deve compartilhar o
  mesmo componente, para não divergirem com o tempo.

## Próximo depois desta

**S11** — configurações + backup JSON (ou S10, conforme prioridade do dono).
