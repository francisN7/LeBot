# Arte 3D — lombadas e mascote

Sistema de identidade da Estante e da Hoje. Fonte da verdade visual:
`docs/brand.md`; decisão de formato: ADR 0011.

## Formato

- **Runtime:** vetorial (`react-native-svg`). Nenhuma imagem de lombada ou
  mascote entra no bundle.
- **Fonte da arte:** código — `src/features/library/spine-art.ts` (mapa puro) e
  `src/components/ui/{SpineArtwork,Mascot}.tsx` (desenho).
- **Raster:** só ícone, camada adaptativa, monocromático, splash e favicon, em
  `assets/images/`, gerados de `brand/source/mark.svg` e `mark-mono.svg`.
- **Nada de rede em runtime.** Baixar asset não existe neste app.

## Grade de tamanhos

| Peça | Token/tamanho | Onde |
|---|---|---|
| Lombada cheia | `sizes.spine` — 88×128 | Estante, detalhe |
| Lombada compacta | `sizes.spineCompact` — 72×104 | Fila (próxima parada e "Depois") |
| Mascote pequeno | 72 px de largura | Card "LêBot diz" na Hoje |
| Mascote médio | 96 px | Estado vazio da Estante |
| Mascote grande | 120 px (padrão) | estados de destaque; nenhuma tela usa hoje |
| Fita de gênero | `sizes.bookmark` — 18×28 | Sobre a capa |

O desenho usa `viewBox` fixo (100×140 na lombada, 120×130 no mascote) e escala
com o tamanho pedido; não há asset por tamanho.

## Lombada: cor × expressão

A cor vem do gênero (`color_light` até existir tema escuro) e a expressão do
status. Não existe combinação fixa: qualquer hex gera uma lombada.

| Status | Expressão | Rosto |
|---|---|---|
| `reading` — Lendo | `happy` | olhos em arco e sorriso |
| `queued` — Quero ler | `neutral` | olhos redondos e boca oval |
| `paused` — Pausado | `sleepy` | olhos fechados e "z" |
| `finished` — Concluído | `shine` | olhos em estrela e sorriso aberto |

Paleta derivada (`spine-art.ts`):

- `base` = hex do gênero, normalizado;
- `shade` = mistura com navy (fundo claro) ou preto (fundo escuro), 30–35%;
- `highlight` = mistura com creme, 28–60%, para as faixas e o brilho lateral;
- `ink` = navy quando o contraste com a base é ≥ 3:1, senão creme. Garante rosto
  visível no preset `navy` e em cores personalizadas escuras.

Sem status, ou com hex inválido, a UI usa a lombada 2D chapada em `navyMuted`.

## Mascote: estados

| Estado | Quando usar | Diferença no desenho |
|---|---|---|
| `neutral` | telas padrão, estado vazio | olhos redondos, piscada |
| `reading` | sessão de leitura ativa | olhos baixos, livro aberto |
| `happy` | meta batida, sequência | olhos em estrela, sorriso |
| `sleepy` | pausa, dia de descanso | olhos fechados e "z" |
| `thinking` | dicas do plano, busca sem resultado | balão de pensamento |
| `celebrating` | livro concluído, resenha | boca aberta e confete |

Animação (Reanimated): respiração de 1,0 a 1,025 em 1,8 s (ida e volta) e
piscada de 90 ms a cada ~2,6 s nos estados de olhos redondos. Sem física 3D, sem
laço de animação por estado.

Acessibilidade: o wrapper anuncia o estado (`mascotLabel`); o SVG é decorativo
(`accessibilityElementsHidden`). Para mudar o texto, use
`accessibilityLabel`.

## Ícone e splash

| Arquivo | Tamanho | Regra |
|---|---|---|
| `icon.png` | 1024² | fundo pink cheio, marca a 86% (o SO arredonda) |
| `android-icon-background.png` | 1024² | pink sólido |
| `android-icon-foreground.png` | 1024² | marca a 80%, transparente |
| `android-icon-monochrome.png` | 1024² | silhueta preta com olhos vazados |
| `splash-icon.png` | 768² | marca a 90%, transparente, sobre creme |
| `favicon.png` | 64² | fundo pink, marca a 80% |

Gerar de novo:

```bash
node scripts/build-icons.mjs
```

O script rasteriza já no tamanho final (redimensionar depois deixa halo claro no
contorno), usa compressão 9 e não grava metadados.

## Movimento

Regra: a **grade** reage (toque, status, entrada); o **detalhe** respira (loop
contínuo, porque há um livro só).

| Elemento | Gesto | Onde |
|---|---|---|
| Lombada | mola de escala 0,97 e inclinação −2° no toque | grade e detalhe |
| Lombada | piscada: olhos somem por 70 ms a cada ~2,9 s | `happy`, `neutral` |
| Lombada | brilho varre o corpo a cada ~3,3 s | todas |
| Lombada | "z" pulsa entre 1 e 0,3 | `sleepy` |
| Lombada | flutuação de 3% e −2,4 px, ida e volta em 4,4 s | só `animated` (detalhe) |
| Capa | mola de escala 0,97 e inclinação −1,5° no toque | grade e detalhe |
| Capa | brilho diagonal atravessa a capa em 1,7 s | só `animated` (detalhe) |
| Grade | `FadeInDown` com 45 ms de atraso por card (máx. 6) | troca de filtro/busca |
| Mascote | respiração 1,04 e −2 px, 4 s ida e volta | sempre |
| Mascote | piscada de 90 ms a cada ~2,8 s | estados de olhos redondos |
| Mascote | acessórios pulsam entre 1 e 0,35 | `sleepy`, `celebrating` |
| Mascote | fade de 200 ms ao trocar de estado | sempre |

Todas as animações usam `transform` e `opacity`, no UI thread; nenhuma mexe em
layout. Sem `useReducedMotion` por enquanto — fica no backlog de acessibilidade.

## Capa personalizada como livro

Uma foto recortada parece um card; para parecer o mesmo objeto da lombada ela
recebe três camadas:

1. **Bloco de páginas** na borda direita: faixa creme de 7% da largura, com três
   linhas finas (`navyMuted` a 30%).
2. **Brilho diagonal** (banda branca a 18%) atravessando o canto superior
   esquerdo; no detalhe ele varre a capa.
3. **Selo de status** no canto inferior direito: quadrado creme com borda navy e
   o rosto da lombada (mesmo `SpineFace`). Largura `width * 0.26` limitada a
   18–26 px, para não dominar o 72×104.

A fita do gênero continua no topo esquerdo. Sem `status` (preview do formulário),
o selo não aparece.

## Cache e performance

- Não há cache de imagem: o SVG é recalculado por render. `resolveSpineArt` é
  uma função pura e barata (duas misturas de hex + um contraste).
- Evite chamar `resolveSpineArt` em laço de animação; a paleta é estável por
  livro.
- O `Mascot` anima só `transform` e o raio dos olhos — propriedades que não
  disparam layout.

## Contraste e legibilidade

- Etiqueta de título sempre sobre `cream/95`, nunca direto sobre a cor.
- Rosto com contraste ≥ 3:1 contra a base.
- A fita de gênero sobre a capa usa o mesmo par de cores do gênero.
- O teste da paleta continua exigindo 3:1 contra creme **ou** navy.
