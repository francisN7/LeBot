# Estado atual

## Sessão

- **Atual:** nenhuma aberta (S4a e S4c concluídas e validadas no Android)
- **Última concluída:** S4a (identidade 3D vetorial) e S4c (movimento e vida)
- **Próxima:** S4b (`docs/sessions/S04b-isbn-avisos-fila.md`): tabela oficial do
  ISBN, require cycle, aviso de `ImageBackground` e capa na Fila. A S4c foi
  executada antes dela, por decisão do dono.

## Pronto (S4a — identidade)

- Arte vetorial paramétrica (ADR 0011), sem WebP: `color-mix.ts` mistura hexes;
  `spine-art.ts` mapeia cor + status → expressão (`happy`, `sleepy`, `shine`,
  `neutral`) e paleta (base, sombra, brilho, rosto por contraste); fallback 2D
  sem status ou com hex inválido.
- `SpineArtwork` + `SpineFace` (olhos/boca separados) e `Spine` com `status`,
  nos tamanhos 88×128 e 72×104. Etiqueta de título sobre `cream/95`.
- `Mascot` com os 6 estados e `mascotLabel`; na Hoje e no estado vazio da
  Estante (neutro vazio / pensando sem resultado).
- Estante com profundidade (`Card` aceita `style`) e capa real quando existe.
- Ícone/splash definitivos de `brand/source/{mark,mark-mono}.svg` via
  `node scripts/build-icons.mjs` (sharp em dev); ~87 KB no total.
- Detalhe do livro passou a usar a lombada 3D (correção após print do dono).

## Pronto (S4c — movimento)

- Lombada: piscada, brilho varrendo o corpo, "z" pulsando no sono e mola de
  toque; `animated` liga a flutuação contínua (só no detalhe).
- Estante: `FadeInDown` em cascata por card ao trocar filtro/busca.
- Detalhe: lombada flutuando e capa com brilho atravessando.
- `BookCover` como livro: bloco de páginas, brilho diagonal, selo do status
  (proporcional ao tamanho) e mola no toque.
- `Mascot`: acessórios pulsando, fade na troca de estado, respiração mais visível.
- Hoje: entrada em cascata dos dois cards principais.

## Decisões abertas

- Ícone, splash e camada monocromática só aparecem em build nativo: o Expo Go
  mostra a própria tela de download. Conferir no APK da S12 (critério de aceite
  já atualizado lá).
- Transição compartilhada Estante → detalhe ("voo" da lombada) e contagem
  animada da meta ficaram para depois do S7 (plano real).
- `useReducedMotion` (acessibilidade) ainda não é usado; backlog.
- `ImageBackground is deprecated` (NativeWind 4) segue aberto para a S4b.
- Tema escuro: `resolveGenreColor(..., 'dark')` já é aceito, mas a UI usa claro.
- `cover_uri` é absoluto: o backup (S11) decide entre referência e imagem.

## Arquivos-chave

- `src/lib/color-mix.ts`, `src/features/library/spine-art.ts`
- `src/components/ui/{Spine,SpineArtwork,SpineFace,Mascot,BookCover}.tsx`
- `src/features/library/{EstanteScreen,BookDetailScreen}.tsx`,
  `src/features/today/HojeScreen.tsx`
- `brand/source/{mark,mark-mono}.svg`, `scripts/build-icons.mjs`,
  `assets/images/*`

## Armadilhas

- Reanimated no Jest só funciona com `"resolver":
  "react-native-reanimated/jest/resolver"` no `package.json`; sem ele o import
  explode em `loadUnpackersWithCode`. Não precisa de mock.
- Dois `useAnimatedStyle` que definem `transform` no mesmo `View` se
  sobrescrevem: combine num único estilo (caso da flutuação + toque no `Spine`).
- `accessibilityElementsHidden` esconde o elemento das queries do RTL: `testID`
  de arte vai no `View` que envolve o SVG, não no `<Svg>`. O selo da capa não usa
  esse atributo justamente para o teste alcançar.
- `sharp` é devDependency e não entra no bundle; os PNGs são commitados. O
  script rasteriza já no tamanho final (resize depois deixa halo claro).
- Rota nova só tipa depois de gerar `.expo/types/router.d.ts`
  (`npm start` ou `npx expo start --offline`).
- `expo-sqlite`, `expo-file-system` e `expo-image-picker` não rodam no Jest;
  banco por `sql.js`, capa por contexto.
- Metro avisa require cycle quando uma feature importa o barril de outra (S4b
  corrige com import direto).
- Fontes: família com peso, nunca `fontWeight`; `lineHeight` < 1.15× corta
  descendentes; `label` **não** leva `letterSpacing`.

## Como rodar

```bash
npm install && npm start      # Expo Go
npm run lint && npm run typecheck && npm run test
npm run doctor && npx expo export --platform android --output-dir dist
node scripts/build-icons.mjs  # regera ícone/splash
```
