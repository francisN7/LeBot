# Design system

Tokens, tipografia e componentes base do LêBot. Fonte da verdade da marca:
`docs/brand.md`. Este documento explica como usar o que existe em `src/theme/` e
`src/components/ui/`.

## Stack

- **NativeWind 4.2.7** com Tailwind CSS 3.4 sobre Expo SDK 58.
- Tokens em TypeScript (`src/theme/`). O `tailwind.config.ts` **importa** esses
  tokens; não existe uma segunda paleta no CSS.
- Fontes: Fredoka (600/700) para títulos, Nunito (400/600/700) para corpo,
  carregadas com `expo-font` no layout raiz.

Arquivos de configuração: `babel.config.js` (`jsxImportSource: nativewind`),
`metro.config.js` (`withNativeWind` + `global.css`), `global.css`,
`nativewind-env.d.ts`.

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

| Token | px |
|---|---|
| `none` | 0 |
| `xs` | 4 |
| `sm` | 8 |
| `md` | 12 |
| `lg` | 16 |
| `xl` | 24 |
| `xxl` | 32 |
| `xxxl` | 48 |

### Raios (`src/theme/radii.ts`)

`sm` 8 · `md` 12 · `lg` 20 · `xl` 28 · `pill` 999.

### Tamanhos e opacidade (`src/theme/sizes.ts`)

- `sizes.spine` = 88×128; `sizes.spineCompact` = 72×104.
- `borderWidths.hairline` 1 · `strong` 2.
- `opacities.decor` 0.25 · `disabled` 0.5 · `muted` 0.7.

### Tipografia (`src/theme/typography.ts`)

| Família | Peso | Uso |
|---|---|---|
| `Fredoka_700Bold` | 700 | display e títulos grandes |
| `Fredoka_600SemiBold` | 600 | subtítulos |
| `Nunito_400Regular` | 400 | corpo |
| `Nunito_600SemiBold` | 600 | corpo com ênfase |
| `Nunito_700Bold` | 700 | rótulos, botões, tab bar |

Nunca combine `fontFamily` de peso com `fontWeight`: o peso já está no arquivo.
Escala de tamanhos em `fontSize` (`xs` 12 → `display` 52) e `lineHeight`.

## Classes no Tailwind

O `tailwind.config.ts` expõe:

- cores: `bg-cream`, `text-navy`, `border-navy`, `bg-pink` etc.;
- espaçamento: `p-lg`, `gap-md`, `mt-sm`, `m-xxl`;
- raio: `rounded-md`, `rounded-lg`, `rounded-pill`;
- tipografia: `font-display`, `font-heading`, `font-body`, `font-body-medium`,
  `font-body-bold`, `text-xs`…`text-display`.

```tsx
<View className="gap-md rounded-lg border-2 border-navy bg-surface p-lg">
  <AppText variant="subtitle">O Hobbit</AppText>
  <AppText variant="caption" tone="muted">
    J. R. R. Tolkien
  </AppText>
</View>
```

## Componentes (`src/components/ui/`)

### `Screen`

Casca de tela: fundo creme, safe area e padding lateral.

```tsx
<Screen>{/* conteúdo */}</Screen>
<Screen scroll={false} contentContainerClassName="gap-xl">{/* ... */}</Screen>
```

### `AppText`

`variant`: `display` | `title` | `subtitle` | `body` | `bodyStrong` |
`caption` | `label`. `tone`: `default` | `muted` | `inverse` | `accent`.

```tsx
<AppText variant="display">Estante</AppText>
<AppText tone="muted">5 livros</AppText>
```

### `Button`

`variant`: `primary` (pink), `secondary` (branco), `ghost`; `size`: `sm` |
`md`; aceita `disabled`, `onPress`, `className`, `testID`.

```tsx
<Button label="Começar" onPress={start} />
<Button label="Depois" size="sm" variant="secondary" />
```

### `Card`

Superfície branca, contorno navy 2px, raio `lg`, padding `lg`, `gap-sm`.
`className` passa por `twMerge`, então overrides como `gap-xs` e `bg-pink`
funcionam.

```tsx
<Card className="bg-pink">{/* ... */}</Card>
```

### `Chip`

Etiqueta compacta. Com `onPress` vira filtro selecionável (`selected`).

```tsx
<Chip label="Lendo" selected onPress={() => setFilter('reading')} />
```

### `Spine`

Placeholder 2D da lombada: bloco colorido por gênero com etiqueta do título.
Cor sempre vem de `colorForGenre()` em `src/features/library/genre.ts`. Com
`onPress` vira botão acessível; use `showLabel={false}` quando o título já
aparece ao lado (caso da área principal da Fila).

```tsx
<Spine color={colorForGenre(book.genre)} title={book.title} />
```

## Regras

1. Nenhum valor de cor, espaçamento ou fonte hardcoded fora de `src/theme/` e
   das classes Tailwind.
2. Estilo dinâmico (safe area, cor por gênero, tamanho de lombada) usa tokens,
   não números soltos.
3. Componente com `className` deve passar a string por `twMerge` para permitir
   override previsível.
4. Texto sempre com `AppText`; não use `fontWeight` no lugar da família certa.
5. Todo componente novo entra em `src/components/ui/index.ts` e ganha teste em
   `Componente.test.tsx`.

## Testes

`@testing-library/react-native` 14 (API assíncrona): sempre `await render(...)`
e `await fireEvent.press(...)`. Use `renderWithProviders` de
`src/test-utils/render.tsx`, que injeta o `SafeAreaProvider`.

```tsx
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test-utils/render';

it('mostra a estante', async () => {
  await renderWithProviders(<EstanteScreen />);
  expect(screen.getByText('Estante')).toBeOnTheScreen();
});
```

## Estrutura das telas

- Rotas em `src/app/(tabs)/` só reexportam a tela da feature.
- Telas vivem em `src/features/<nome>/<Nome>Screen.tsx`.
- Dados fake ficam em `src/features/<nome>/__fixtures__/`.
- As 4 abas atuais: Estante, Fila, Hoje, Ajustes.
