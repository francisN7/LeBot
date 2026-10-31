# Estado atual

## Sessão

- **Atual:** S4a implementada; falta a conferência do dono no Android
- **Última concluída:** S3.2 — gêneros personalizados e cores por tema
- **Próxima:** conferir a S4a no aparelho e abrir a S4b
  (`docs/sessions/S04b-isbn-avisos-fila.md`): tabela oficial do ISBN, require
  cycle, aviso de `ImageBackground` e capa na Fila.

## Pronto (S4a)

- Spec dividida: `S04a-identidade-3d.md` (identidade) e
  `S04b-isbn-avisos-fila.md` (ISBN/avisos/Fila). Roadmap com as duas linhas.
- **Arte vetorial paramétrica** (ADR 0011), sem WebP: `color-mix.ts` mistura
  hexes; `spine-art.ts` mapeia cor + status → expressão (`happy`, `sleepy`,
  `shine`, `neutral`) e paleta (base, sombra, brilho, rosto por contraste);
  fallback 2D sem status ou com hex inválido.
- `SpineArtwork` (SVG) e `Spine` com `status`: corpo, faixa de sombra, brilho,
  faixas superior/inferior e rosto; funciona nos 88×128 e 72×104. Etiqueta de
  título sobre `cream/95`.
- `Mascot` em SVG com os 6 estados, respiração e piscada (Reanimated) e
  `mascotLabel` para leitor de tela. Na Hoje (card "LêBot diz") e no estado
  vazio da Estante (neutro vazio / pensando sem resultado).
- Estante: sombra por coluna (`Card` ganhou `style`), `FadeIn` ao trocar
  filtro/busca, capa real quando existe.
- Ícone/splash definitivos a partir de `brand/source/mark.svg` e `mark-mono.svg`
  com `node scripts/build-icons.mjs` (sharp em dev): ícone, adaptativo,
  monocromático com olhos vazados, splash e favicon. ~87 KB no total.
- 176 testes em 33 suítes; lint, typecheck, doctor e `expo export` verdes.
  Docs: ADR 0011, `design/assets-3d.md`, design system, brand, arquitetura,
  testes, AGENTS (comando do ícone) e CHANGELOG.

## Decisões abertas

- S4a marcada `[~]` no roadmap até o dono conferir no Android.
- `ImageBackground is deprecated` (NativeWind 4) segue aberto para a S4b.
- NativeWind v4 sem suporte oficial à SDK 58 (ADR 0006).
- Tema escuro: `resolveGenreColor(..., 'dark')` já é aceito, mas a UI usa claro.
- `cover_uri` é absoluto: o backup (S11) decide entre referência e imagem.
- DNF (S9), metadados em `brand/source/*.png` (limpar no primeiro export real).

## Arquivos-chave

- `src/lib/color-mix.ts`, `src/features/library/spine-art.ts`
- `src/components/ui/{Spine,SpineArtwork,Mascot}.tsx`, `Mascot.test.tsx`
- `src/features/library/EstanteScreen.tsx`, `src/features/today/HojeScreen.tsx`
- `brand/source/{mark,mark-mono}.svg`, `scripts/build-icons.mjs`,
  `assets/images/*`

## Armadilhas

- Reanimated no Jest só funciona com `"resolver":
  "react-native-reanimated/jest/resolver"` no `package.json`; sem ele o import
  explode em `loadUnpackersWithCode`. Não precisa de mock.
- `accessibilityElementsHidden` esconde o SVG das queries do RTL: `testID` de
  arte vai no `View` que envolve o SVG, não no `<Svg>`.
- Arte da lombada é `StyleSheet.absoluteFill` com `pointerEvents="none"`; a
  etiqueta é renderizada depois, então fica por cima.
- `sharp` é devDependency e não entra no bundle; os PNGs são commitados. O
  script rasteriza já no tamanho final (resize depois deixa halo claro).
- Snap das rotas continua: rota nova só tipa depois de gerar
  `.expo/types/router.d.ts` (`npm start` ou `npx expo start --offline`).
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
