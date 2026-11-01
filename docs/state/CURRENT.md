# Estado atual

## Sessão

- **Atual:** S4b implementada; falta só a conferência no Android pelo dono.
- **Última concluída:** S4b (ISBN oficial, avisos do terminal, capa na Fila).
- **Próxima:** S5 (`docs/sessions/S05-registro-leitura.md`): registrar sessão de
  leitura e ver progresso.

## Pronto (S4b — ISBN, avisos e Fila)

- `src/lib/isbn-ranges.ts` gerado por `node scripts/build-isbn-ranges.mjs [xml]`
  do `export_rangemessage.xml` (287 grupos, 1889 faixas, serial e data no
  cabeçalho). O script baixa o XML quando não recebe caminho; quebra se a agência
  mandar faixas com lacuna.
- `formatIsbnInput` resolve grupo (prefixo mais longo), registrante (faixa
  exata com 7 dígitos) e publicação; com pouco dígito só entra hífen quando as
  faixas candidatas concordam — nada de "pulo". ISBN-10 usa o grupo do 978.
- Require cycle `library ↔ genres` cortado: `GenresScreen` e `FilaScreen` usam
  `@/features/library/use-books` e `@/features/library/genre`, não o barril.
- `ImageBackground is deprecated` é do RN 0.88 (`warnOnce` no getter do
  `react-native/index.js`) disparado pelo `remapProps` do
  `react-native-css-interop@0.2.7` no boot. Decisão: aceitar e documentar
  (adendo na ADR 0006), sem `LogBox.ignoreLogs`.
- Fila: `BookCover` 72×104 na próxima parada e em "Depois", com `Spine` de
  fallback, fita do gênero e `status`; testes com e sem capa.

## Pronto (S4a/S4c, resumo)

- Lombada 3D paramétrica (cor + status → expressão/paleta), mascote de 6 estados,
  ícone/splash de `brand/source/` e movimento (piscada, brilho, mola, cascata).
  Detalhes no git e em `docs/sessions/S04a-identidade-3d.md` / `S04c-movimento.md`.

## Decisões abertas

- Ícone, splash e camada monocromática só aparecem em build nativo (S12).
- Transição compartilhada Estante → detalhe e contagem animada da meta ficaram
  para depois do S7.
- `useReducedMotion` (acessibilidade) ainda não é usado; backlog.
- Tema escuro: `resolveGenreColor(..., 'dark')` já é aceito, mas a UI usa claro.
- `cover_uri` é absoluto: o backup (S11) decide entre referência e imagem.
- Se o NativeWind 5 estabilizar, a migração resolve o aviso de
  `ImageBackground` de vez (revisar na S12).

## Arquivos-chave

- `scripts/build-isbn-ranges.mjs`, `src/lib/isbn-ranges.ts`, `src/lib/isbn.ts`
- `src/features/queue/FilaScreen.tsx` (+ teste)
- `src/features/genres/GenresScreen.tsx` (import direto)
- `docs/adr/0006-design-system-nativewind.md` (adendo S4b)

## Armadilhas

- `isbn-ranges.ts` é gerado: nunca editar à mão. O script emite a mesma forma
  que o Biome formata (valor na linha de baixo quando passa de 80 colunas).
- `debug` da máscara: o grupo 979 não tem grupo de 1 dígito; `9791` fica sem
  hífen até o `0` fechar `979-10`.
- Reanimated no Jest só funciona com `"resolver":
  "react-native-reanimated/jest/resolver"` no `package.json`.
- Dois `useAnimatedStyle` que definem `transform` no mesmo `View` se
  sobrescrevem: combine num único estilo.
- `accessibilityElementsHidden` esconde o elemento das queries do RTL: `testID`
  de arte vai no `View` que envolve o SVG, não no `<Svg>`.
- `sharp` é devDependency e não entra no bundle; os PNGs são commitados.
- Rota nova só tipa depois de gerar `.expo/types/router.d.ts` (`npm start`).
- `expo-sqlite`, `expo-image-picker` e `expo-file-system` não rodam no Jest;
  banco por `sql.js`, capa por contexto.
- Metro avisa require cycle quando uma feature importa o barril de outra: dentro
  de `src/features/`, importe caminho direto.
- Fontes: família com peso, nunca `fontWeight`; `lineHeight` < 1.15× corta
  descendentes; `label` **não** leva `letterSpacing`.

## Como rodar

```bash
npm install && npm start      # Expo Go
npm run lint && npm run typecheck && npm run test
npm run doctor && npx expo export --platform android --output-dir dist
node scripts/build-icons.mjs         # regera ícone/splash
node scripts/build-isbn-ranges.mjs   # regera a tabela do ISBN (baixa o XML)
```
