# Design system

**O que responde:** tokens, tipografia, classes e componentes de `src/theme/` e
`src/components/ui/`. **O que não responde:** a identidade e a arte
([`brand.md`](brand.md)) nem o desenho de cada tela
([`architecture.md`](architecture.md)).

## Stack

- **NativeWind 4.2.7** com Tailwind CSS 3.4 sobre Expo SDK 58.
- Tokens em TypeScript (`src/theme/`). O `tailwind.config.ts` **importa** esses
  tokens; não existe uma segunda paleta no CSS.
- Fontes: Fredoka (600/700) para títulos e Nunito (400/600/700) para corpo,
  carregadas com `expo-font` no layout raiz.
- Configuração: `babel.config.js` (`jsxImportSource: nativewind`),
  `metro.config.js` (`withNativeWind`), `global.css` e `nativewind-env.d.ts`.

## Tokens

### Cores (`src/theme/colors.ts`)

| Token | Hex | Uso |
|---|---|---|
| `cream` | `#FFF6E8` | fundo de tela |
| `surface` | `#FFFFFF` | cards e tab bar |
| `pink` | `#FF8FA3` | ação primária, destaque |
| `pinkSoft` | `#FFB1BF` | gradientes e estados |
| `navy` | `#2A2340` | texto, contorno, ícone ativo |
| `navyMuted` | `#6E687F` | rótulo/ícone inativo (contraste no creme) |
| `gold` | `#FFC145` | olhos do robô, infantojuvenil |
| `goldDeep` | `#F4B43A` | moldura do livro |
| `coral` | `#FF6B5B` | alerta, romance |
| `teal` | `#34C6B8` | sucesso, não-ficção |
| `purple` | `#7B69EE` | fantasia, estados "pensando" |

`navyMuted` é derivada do navy e existe só para estados inativos.

### Espaçamento (`src/theme/spacing.ts`)

`none` 0 · `xs` 4 · `sm` 8 · `md` 12 · `lg` 16 · `xl` 24 · `xxl` 32 · `xxxl` 48.

### Raios (`src/theme/radii.ts`)

`sm` 8 · `md` 12 · `lg` 20 · `xl` 28 · `pill` 999.

### Tamanhos e opacidade (`src/theme/sizes.ts`)

- `cover` 88×128 e `coverCompact` 72×104 (capa com foto).
- `spine` 64×128 e `spineCompact` 52×104 (lombada sem capa, proporção 1:2).
- `bookmark` 18×28; `genreSwatch` 48×32.
- `chart`: `plotHeight` 96, `barMinHeight` 6, `barWidth` 32 (4 semanas) e
  `barWidthCompact` 18 (12 semanas/ano).
- `borderWidths`: `hairline` 1, `strong` 2.
- `opacities`: `decor` 0.25, `disabled` 0.5, `muted` 0.7.

### Tipografia (`src/theme/typography.ts`)

| Família | Peso | Uso |
|---|---|---|
| `Fredoka_700Bold` | 700 | display e títulos grandes |
| `Fredoka_600SemiBold` | 600 | subtítulos |
| `Nunito_400Regular` | 400 | corpo |
| `Nunito_600SemiBold` | 600 | corpo com ênfase |
| `Nunito_700Bold` | 700 | rótulos, botões, tab bar |

Nunca combine `fontFamily` de peso com `fontWeight`: o peso já está no arquivo.
Escala em `fontSize` (`xs` 12 → `display` 52) e `lineHeight`.

- **Folga:** `lineHeight >= fontSize * 1.15` em `xl`, `xxl` e `display`, senão o
  Android corta descendentes. Hoje: `display` 52/64, `xxl` 36/44, `xl` 28/34;
  `typography.test.ts` trava a proporção.
- **Largura justa:** `label` não usa `letterSpacing` — o Android mede a linha sem
  o espaçamento final e quebra a última letra ("Terro/r"). Texto em chip, botão
  ou etiqueta usa `numberOfLines={1}` e folga horizontal.

## Classes no Tailwind

`tailwind.config.ts` expõe `bg-cream`, `text-navy`, `border-navy`, `bg-pink`,
`p-lg`, `gap-md`, `rounded-pill`, `font-display`…`font-body-bold` e
`text-xs`…`text-display`.

```tsx
<View className="gap-md rounded-lg border-2 border-navy bg-surface p-lg">
  <AppText variant="subtitle">O Hobbit</AppText>
  <AppText variant="caption" tone="muted">J. R. R. Tolkien</AppText>
</View>
```

## Componentes

| Componente | O que faz | Props principais |
|---|---|---|
| `Screen` | casca com creme, safe area e padding lateral | `scroll`, `contentContainerClassName` |
| `AppText` | texto com tipografia e tom | `variant`, `tone` |
| `Button` | ação com rótulo | `variant` (primary/secondary/ghost/danger), `size`, `disabled` |
| `ConfirmDialog` | confirmação no visual do app, no lugar do `Alert` | `title`, `message`, `confirmLabel`, `cancelLabel`, `visible` |
| `BackButton` | voltar de tela cheia, largura toda | `onPress` |
| `Card` | superfície branca, contorno navy 2 px, raio `lg` | `className` (passa por `twMerge`) |
| `Chip` | etiqueta; com `onPress` é filtro, com `onLongPress` é botão | `selected`, `accessibilityHint` |
| `RatingStars` | estrelas de leitura ou entrada | `value`, `onChange`, `size` (sm/md) |
| `TextField` | campo com rótulo, dica e erro | props do `TextInput` + `label`, `error` |
| `Bookmark` | fita SVG decorativa na capa | `color` |
| `StatsIcon` | três barras SVG decorativas | `size`, `color` |

### `Spine`

Lombada vetorial e paramétrica (ADR 0011): a **cor** vem do gênero
(`colorLight`, com `navyMuted` quando o gênero não existe) e a **expressão** do
status. Sem `status` (ou com hex inválido) fica o bloco 2D chapado, que é o
fallback; com `onPress` vira botão acessível. Quando o livro tem capa, o card usa
`BookCover`.

- Modelo **B**, 64×128 (52×104 compacta), viewBox 64×128: corpo cilíndrico em
  gradiente, headband/tailband, duas nervuras, etiqueta de título no topo
  (Fredoka 600, 7→5 px, até duas linhas, ellipsis) e tassel T1 no canto superior
  esquerdo balançando para a esquerda (ADR 0023). O corpo é estático; brilho,
  piscada, "zzz" e tassel são camadas separadas (`SpineArtwork`/`SpineFace`).
- `animated` liga a flutuação contínua: use em tela com um livro só (detalhe),
  nunca na grade. `showLabel` controla a etiqueta; a mini-lombada (30×60) desliga.

### `Mascot`

LêBot em SVG com seis estados (`neutral`, `reading`, `happy`, `sleepy`,
`thinking`, `celebrating`). Respiração e piscada com Reanimated; acessórios
pulsam e a troca tem fade. `size` é a largura; `accessibilityLabel` sobrepõe o
rótulo do estado. Um mascote por tela.

### `BookCover`

Capa com `overflow: hidden`, borda navy de 2 px, raio `md` e `resizeMode="cover"`.
O rótulo fica no wrapper (`Capa de <título>`), então a imagem não é lida duas
vezes. `animated` faz o brilho atravessar (detalhe).

- Profundidade S2 sobre a foto: vinco à esquerda (preto 38%), fio de luz creme em
  13–20%, sombra à direita (42%) e na base (30%).
- O selo do status fica no canto inferior direito e usa `SpineFace`; a fita do
  gênero continua no topo esquerdo.

## Gêneros e cores

- `src/theme/genre-colors.ts` tem 10 pares claro/escuro; o gênero grava os hexes,
  então mudar a paleta não repinta escolhas antigas.
- `resolveGenreColor(genre, scheme = 'light')`; a UI usa `light` até o tema
  escuro existir.
- `src/lib/genre-color.ts` valida `#RRGGBB`, normaliza e calcula contraste
  (WCAG). Par com claro = escuro é recusado.
- O teste da paleta exige 3:1 contra o creme **ou** o navy. Hex de baixo
  contraste em cor personalizada só gera aviso no formulário.

## Regras

1. Nenhuma cor, espaçamento ou fonte hardcoded fora de `src/theme/` e das classes.
2. Estilo dinâmico (safe area, cor por gênero, tamanho) usa tokens, não números.
3. Componente com `className` passa a string por `twMerge`.
4. Texto sempre com `AppText`; nada de `fontWeight` no lugar da família.
5. Todo componente novo entra em `src/components/ui/index.ts` e ganha teste.
6. Arte de personagem/lombada é vetorial (ADR 0011); raster só em
   `assets/images/`, gerado por `scripts/build-icons.mjs`.

## Ícones e splash

`assets/images/` tem `icon.png`, `android-icon-{foreground,background,monochrome}.png`,
`splash-icon.png` e `favicon.png`, gerados de `brand/source/mark.svg` e
`mark-mono.svg`:

```bash
node scripts/build-icons.mjs   # sharp, só no desenvolvimento
```

Tamanhos, safe zone e compressão estão em [`brand.md`](brand.md).
