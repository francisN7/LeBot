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
- `sizes.bookmark` = 18×28 (fita sobre a capa); `sizes.genreSwatch` = 48×32
  (par de cores na lista/formulário de gênero).
- `sizes.chart` = prateleira de "Meu ritmo": `plotHeight` 96, `barMinHeight` 6,
  `barWidth` 32 (4 semanas) e `barWidthCompact` 18 (12 semanas/ano).
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

Regra de folga (S3): `lineHeight >= fontSize * 1.15` em `xl`, `xxl` e
`display`, senão o Android corta descendentes (`p`, `g`, `J`). Hoje:
`display` 52/64, `xxl` 36/44, `xl` 28/34. O teste
`src/theme/typography.test.ts` trava a proporção.

Regra de largura justa (S3.2): `label` **não** usa `letterSpacing`. Com
`letterSpacing`, o Android mede a linha sem o espaçamento final e quebra a
última letra em containers shrink-to-fit ("Terro/r", "Volta/r"). Todo texto
dentro de chip, botão ou etiqueta usa `numberOfLines={1}` e folga horizontal;
título longo na lombada pode quebrar em duas linhas.

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

`variant`: `primary` (pink), `secondary` (branco), `ghost` e `danger` (coral,
para ações destrutivas); `size`: `sm` | `md`; aceita `disabled`, `onPress`,
`className`, `testID`.

```tsx
<Button label="Começar" onPress={start} />
<Button label="Depois" size="sm" variant="secondary" />
<Button label="Excluir" size="sm" variant="danger" />
```

### `ConfirmDialog`

Confirmação no visual do app (fundo navy translúcido + `Card` central), no
lugar do `Alert` do sistema. `cancelLabel` e `confirmLabel` são configuráveis;
o confirmar usa a variante `danger`.

```tsx
<ConfirmDialog
  confirmLabel="Excluir"
  message="O livro sai da estante."
  onCancel={() => setOpen(false)}
  onConfirm={deleteBook}
  title="Excluir livro?"
  visible={open}
/>
```

### `BackButton`

Voltar de tela cheia (texto "Voltar", alinhado à esquerda). Ocupa a largura
toda de propósito: com largura justa o Android quebrava o rótulo em
"Volta"/"r". Usa `numberOfLines={1}`.

```tsx
<BackButton onPress={() => router.back()} />
```

### `Card`

Superfície branca, contorno navy 2px, raio `lg`, padding `lg`, `gap-sm`.
`className` passa por `twMerge`, então overrides como `gap-xs` e `bg-pink`
funcionam. `style` existe para o que não cabe em classe — sombra/profundidade da
grade da Estante, por exemplo.

```tsx
<Card className="bg-pink">{/* ... */}</Card>
```

### `Chip`

Etiqueta compacta. Com `onPress` vira filtro selecionável (`selected`). Com
`onLongPress` também é botão mesmo sem toque simples; `accessibilityActions` e
`accessibilityHint` servem para ações de leitor de tela.

```tsx
<Chip label="Lendo" selected onPress={() => setFilter('reading')} />

<Chip
  accessibilityHint="Segure para trocar o status"
  delayLongPress={500}
  label="Lendo"
  onLongPress={openMenu}
/>
```

### `RatingStars`

Estrelas da resenha. Com `onChange` vira entrada (cada estrela é um botão com
rótulo "N de 5 estrelas" e estado selecionado); sem `onChange`, é leitura, com o
rótulo acessível "Nota: N de 5 estrelas". `size="sm"` é o selo da Estante;
`md` é o formulário.

```tsx
<RatingStars onChange={setRating} value={rating} />
<RatingStars size="sm" value={review.rating} />
```

### `StatusWheelTrigger` + `StatusWheelOverlay`

A troca rápida da Estante vive em `src/features/library/`. O `StatusWheelTrigger`
envolve o chip com um `Pan` da RNGH que só ativa depois de 500 ms parado
(`activateAfterLongPress`); o mesmo toque continua sendo rastreado. A
`StatusWheelOverlay` é um overlay na mesma janela (sem `Modal`) centrado no
toque, com as quatro opções (`Lendo`, `Quero ler`, `Pausado`, `Concluído`) em
círculo. As opções abrem do centro com mola, o setor sob o dedo ganha destaque e
o rosto da lombada/capa acompanha a prévia; soltar grava, voltar ao miolo ou
tocar fora cancela. `status-wheel-geometry.ts` converte ângulo em status e faz o
clamp na tela. O chip expõe a ação "Trocar status" e cada opção é botão, então o
leitor de tela consegue abrir e escolher sem o gesto.

### `TextField`

Campo de texto com rótulo, dica e erro por campo (borda coral quando há erro).
Aceita as props do `TextInput` (`keyboardType`, `autoCapitalize`, `value`,
`onChangeText`…). O rótulo também vira `accessibilityLabel`, então os testes
usam `getByLabelText('Título')`. Com `multiline`, ganha altura mínima e
`textAlignVertical: 'top'` — é o padrão da resenha, da citação e dos campos
extras.

```tsx
<TextField
  error={errors.title}
  label="Título"
  onChangeText={setTitle}
  value={title}
/>
```

### `Spine`

Lombada do livro. A arte é vetorial e paramétrica (`docs/design/assets-3d.md`):
a **cor** vem do gênero (`genreById.get(book.genreId)?.colorLight`, com
`navyMuted` quando o gênero não existe mais) e a **expressão** do status de
leitura. Sem `status` — ou com hex inválido — fica o bloco 2D chapado, que é o
fallback. Com `onPress` vira botão acessível; use `showLabel={false}` quando o
título já aparece ao lado (Ordem, detalhe e cards da Estante). Quando o livro tem
capa, o card usa `BookCover` no lugar da lombada.

Movimento: o toque inclina com mola e `animated` liga a flutuação contínua —
reserve para telas com um livro só (detalhe), não para a grade.

```tsx
<Spine
  animated
  color={genre.colorLight}
  status={book.status}
  title={book.title}
/>
```

O desenho do rosto e das faixas fica em `SpineArtwork` (interno); a etiqueta de
título continua sobre `cream/95` para o texto pequeno não perder contraste.

### `Mascot`

LêBot em SVG com os seis estados da marca (`neutral`, `reading`, `happy`,
`sleepy`, `thinking`, `celebrating`). A respiração e a piscada usam Reanimated;
os acessórios (zzz e confete) pulsam e a troca de estado tem fade. `size` é a
largura e a altura segue a proporção. O wrapper anuncia `mascotLabel[state]` —
passe `accessibilityLabel` para um texto específico.

```tsx
<Mascot size={72} state="thinking" />
```

Use com moderação: um mascote por tela.

### `BookCover`

Capa com o mesmo acabamento dos cards: `overflow: hidden`, borda navy de 2 px
(por dentro do tamanho do token) e raio `radii.md`; `resizeMode="cover"`. O
rótulo fica no wrapper (`Capa de <título>`), então a imagem não é lida duas
vezes pelo leitor de tela. Aceita `onPress` e `accessibilityLabel` próprio (o
preview do formulário usa "Capa escolhida").

Desde a S4c a capa é tratada como livro físico: bloco de páginas na direita,
brilho diagonal e, com `status`, um selo com o rosto da lombada. `animated` faz
o brilho atravessar (use no detalhe). Sem `status`, o selo não aparece — é o
caso do preview no formulário.

```tsx
<BookCover
  animated
  genreColor={genre.colorLight}
  status={book.status}
  title={book.title}
  uri={book.coverUri}
/>
```

### `Bookmark`

Fita de marca-página em SVG (`react-native-svg`): retângulo com entalhe em "V"
na base, contorno navy e preenchimento na cor do gênero. Fica no canto superior
esquerdo da capa, colada no topo, com margem `spacing.sm` à esquerda. É
decorativa (`accessibilityElementsHidden`): a cor não substitui informação
textual.

```tsx
<Bookmark color={genre.colorLight} />
```

### `StatsIcon`

Três barras de livro em SVG, decorativas (`accessibilityElementsHidden`). É o
ícone do atalho "Meu ritmo" na Estante; o rótulo fica no botão ao redor.

```tsx
<StatsIcon size={16} color={colors.navyMuted} />
```

### `Meu ritmo` (S10)

A tela não é um dashboard: é uma página de diário. A ordem é cartão do LêBot →
três números → ritmo → gêneros → concluídos → notas. Um mascote por tela (no
cartão ou no vazio).

- **Cartão do LêBot:** mascote de 64 px + uma frase calculada em `subtitle`.
  O humor vem da mesma regra da frase (sequência, conclusão, nota alta, silêncio
  recente). A sequência ≥ 2 ganha um adesivo `gold` com borda navy e rotação de
  −3°, nunca emoji.
- **Períodos:** 1 semana (últimos 7 dias, uma barra por dia), 1 mês (mês civil,
  uma barra por bloco de 7 dias), 3 meses (mês atual + 2 anteriores, uma barra
  por mês) e 1 ano (ano civil jan→dez, uma barra por mês, futuro vazio). O chip
  é curto; o subtítulo da tela diz a janela ("Novembro de 2026", "2026").
- **Números:** um `Card` com três colunas (páginas, dias ativos, dias seguidos)
  separadas por um filete navy a 15%. Número em `variant="title"`; abaixo,
  "Média de N páginas por dia com leitura, em M dias do período.".
- **Ritmo:** `RhythmChart` desenha uma lombada por dia/semana/mês sobre uma linha
  navy de 2 px. Altura ∝ páginas (`barHeight`), topo arredondado, rosa; o
  dia/semana/mês corrente é `gold`. O subtítulo segue a unidade ("Páginas por
  dia/semana/mês"). As colunas dividem a largura disponível; o valor compacto
  (`1k`) fica acima e o rótulo embaixo (dia da semana, dia do mês ou `jan`).
  Cada coluna é acessível com o intervalo e o total por extenso.
- **Gêneros:** `GenreBars` em barras horizontais na cor do gênero, ordenadas por
  páginas, top 5 + "Outros". Cada linha mostra "N páginas · M concluídos".
- **Concluídos:** `FinishedStrip` com mini-lombadas (`Spine` 30×44, sem rótulo,
  status `finished`) clicáveis e o mês abreviado embaixo. Sem concluídos, o card
  não aparece.
- **Notas:** `RatingSummary` com média, `RatingStars` de leitura e distribuição
  5→1 em barrinhas douradas. Média e distribuição são de todas as resenhas; o
  cartão diz isso. Tocar numa nota troca o cartão pelos títulos daquela nota
  (autor e estrelas), com "Voltar às notas" acima; o livro abre no detalhe.
- **Vazio:** mascote `thinking`, frase e "Ir para Hoje"; nenhum gráfico zerado.
- **"Ver tudo":** cartão fixo no fim da tela (aparece até com o período vazio)
  com o botão que abre `/linha-do-tempo`. A tela da linha do tempo tem
  `BackButton`, "Desde outubro de 2025", três números (páginas, dias com
  leitura, concluídos) e um cartão por ano com a grade jan→dez. Meses sem
  leitura ficam com a barra em creme; o mês corrente, dourado. Sem histórico,
  mascote e frase, como no vazio das estatísticas.

## Gêneros e cores

- `src/theme/genre-colors.ts` tem 10 pares claro/escuro. O gênero grava os hexes,
  então alterar a paleta não repinta escolhas antigas.
- `resolveGenreColor(genre, scheme = 'light')`; a UI usa `light` até o tema
  escuro existir.
- `src/lib/genre-color.ts` valida `#RRGGBB`, normaliza para maiúsculo e calcula
  contraste (WCAG). Par com claro = escuro é recusado.
- O teste da paleta exige 3:1 contra o creme **ou** contra o navy: o bloco
  colorido sempre aparece sobre um dos dois.
- Hex baixo contraste em cor personalizada só gera aviso no formulário; a
  escolha é do dono.

## Ajustes e backup (S11)

- A tela é dividida em quatro seções com título `subtitle`: **Leitura**,
  **Organização**, **Dados** e **Sobre**. Os cards continuam `Card` com título
  `bodyStrong`, dica em `caption`/`muted` e chip quando há um número curto.
- **Meta diária:** o card tem o valor atual em chip, um `TextField` numérico
  ("Páginas por dia"), o botão "Salvar meta" e a mensagem de erro do próprio
  campo. O intervalo é 3–200; salvar atualiza a Hoje na hora.
- **Em breve:** `ComingSoonCard` mostra o título, o chip `Em breve` e uma frase
  curta do porquê. Não há botão nem valor falso; Lembrete e Aparência usam esse
  estado.
- **Backup:** card com chip `Local`, a data do último backup (ou "Nenhum backup
  ainda."), "Exportar backup" e "Restaurar backup". Exportar abre a **seleção de
  pasta** e grava o `.zip` nela; restaurar abre a **seleção de arquivo**.
  Enquanto trabalha, mostra "Salvando o backup...", "Lendo o arquivo..." ou
  "Restaurando..." e desabilita os botões. Erros e o nome do arquivo salvo
  aparecem em `caption`; cancelar a pasta não grava nem muda a data.
- **Importação:** `RestoreBackupDialog` segue o visual do `ConfirmDialog`
  (fundo navy translúcido + `Card` central), em três passos:
  1. arquivo, data, versão, contagens do arquivo e do aparelho, aviso de que a
     restauração substitui tudo, botão "Exportar cópia atual" (opcional, abre a
     seleção de pasta) e "Continuar";
  2. confirmação final com "Voltar" e "Restaurar" em `danger`;
  3. "Backup restaurado" com as contagens, aviso de capas que falharam e
     "Ver estante", que remonta o app.
- Contagens sempre no formato "N livros, N sessões e N resenhas"; não há
  contagem fixa no card.
- Depois de restaurar, a tela não fica com dados velhos: a navegação remonta pela
  versão de dados, então a Estante e a Hoje abrem com o banco novo.

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
6. Arte de personagem/lombada é vetorial (ADR 0011); raster só em
   `assets/images/`, gerado por `scripts/build-icons.mjs`.

## Ícones e splash

`assets/images/` não é mais placeholder: `icon.png`,
`android-icon-{foreground,background,monochrome}.png`, `splash-icon.png` e
`favicon.png` saem de `brand/source/mark.svg` e `mark-mono.svg`.

```bash
node scripts/build-icons.mjs   # sharp, só no desenvolvimento
```

Tamanhos, regra de safe zone e compressão estão em `docs/design/assets-3d.md`.

## Testes

`@testing-library/react-native` 14 (API assíncrona): sempre `await render(...)`
e `await fireEvent.press(...)`. Use `renderWithProviders` de
`src/test-utils/render.tsx`, que injeta o `SafeAreaProvider` e repositórios em
memória.

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
- Rotas fora das abas: `/livro/novo`, `/livro/[id]` e `/livro/[id]/editar`
  (S3); `/generos`, `/generos/novo` e `/generos/[id]/editar` (S3.2);
  `/livro/[id]/resenha` (S9) e `/estatisticas` (S10). Elas passam callbacks
  (`onBack`, `onEdit`, `onDone`) para a tela, que continua sem depender do
  router nos testes.
- Livros, gêneros, ordem, preferências, sessões de leitura e estatísticas vêm do
  SQLite via `useBooks`/`useGenres`/`useQueue`/`useSettings`/
  `useReadingSessions`/`useRecentSessions`/`useStats`; não há fixture de dados
  reais.
- A Ordem usa `react-native-gesture-handler` + Reanimated para arrastar; o
  `Screen` adota o `ScrollView` do gesture handler.
- As 4 abas atuais, nesta ordem: Estante, Hoje, Ordem, Ajustes.
