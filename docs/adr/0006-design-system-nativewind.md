# ADR 0006 — Design system com NativeWind v4 e tokens em TypeScript

- **Status:** aceito
- **Data:** 2026-10-31
- **Sessão:** S1

## Contexto

A S1 precisava de estilos consistentes em 4 abas, sem repetir cores e medidas em
cada tela. O `src/theme/colors.ts` já existia desde a S0, mas só era consumido
via `StyleSheet`. A spec da S1 pedia NativeWind + tokens tipados.

Opções avaliadas:

1. **NativeWind 4.2.7 (stable, Tailwind 3.4).** Documentado para Expo SDK 57,
   mas o bundle Android da SDK 58 exportou sem erro no teste da S1.
2. **NativeWind 5.0.0-rc.0 (Tailwind 4).** Mais alinhado ao futuro, porém RC,
   com par fixo `react-native-css@3.1.0-rc.0` e alvo testado na SDK 57.
3. **Só `StyleSheet` com tokens.** Zero dependência nova, mas mais verboso e
   longe do que a spec pedia.

## Decisão

Adotar **NativeWind 4.2.7 + Tailwind CSS 3.4**, mantendo os tokens como fonte da
verdade em `src/theme/`.

- O `tailwind.config.ts` importa `colors`, `spacing`, `radii`, `typography` de
  `src/theme/`; não há paleta duplicada.
- `className` é o caminho padrão para layout e cor. Estilo dinâmico (safe area,
  cor por gênero, tamanho de lombada) usa tokens via `style`.
- Componentes que aceitam `className` passam a string por `tailwind-merge`
  para que overrides (`gap-xs`, `bg-pink`) vençam a base do componente.
- Fontes Fredoka/Nunito entram por `@expo-google-fonts/*` + `expo-font`, com
  splash controlado no layout raiz.

## Consequências

- Build Android de `expo export` cobre a integração Metro/Babel do NativeWind;
  validar visualmente no Expo Go continua sendo manual.
- NativeWind v4 não declara suporte oficial à SDK 58. Se o upgrade para SDK 59
  quebrar, o caminho é migrar para NativeWind 5 (Tailwind 4) e revisar
  `global.css`/`postcss`.
- `tailwind-merge` vira dependência de runtime pequena e sem código nativo.
- Testes de UI usam a API assíncrona do RTL 14 (`await render`).

## Alternativas descartadas

- **NativeWind 5 RC:** risco de RC + par de versões fixas sem ganho imediato.
- **StyleSheet puro:** contraria a spec e aumenta o custo de manter 4 telas.

## Adendo S4b — aviso de `ImageBackground` no terminal

O `npx expo start` mostra `ImageBackground is deprecated and will be removed in
a future release`. Não é código do app (não há `ImageBackground` em `src/`):

1. `react-native/index.js` expõe `ImageBackground` por um getter que chama
   `warnOnce('image-background-deprecated', …)` — a depreciação é do React
   Native 0.88, não do NativeWind.
2. `react-native-css-interop@0.2.7` (par do NativeWind 4.2.7) toca essa
   propriedade no boot, em `dist/runtime/components.js`, ao chamar
   `remapProps(ImageBackground, …)`, e dispara o aviso uma vez.

**Decisão: aceitar e documentar.** O aviso é de desenvolvimento, não afeta o
bundle de produção nem o comportamento, e `LogBox.ignoreLogs` só esconderia o
sintoma — inclusive se o app um dia usar o componente de verdade.

- **Patchear** (`patch-package`/`pnpm patch`) exigiria editar `node_modules` e
  quebraria a cada atualização do par css-interop/NativeWind.
- **Migrar para NativeWind 5** é o destino, mas fica no backlog pós-MVP
  (`docs/roadmap.md`), para quando a 5.0 for estável e o SDK/RN compatíveis
  forem os nossos — **não** é tarefa de release. A migração resolve o aviso
  junto, sem gambiarra.
- Gatilho de retomada: NativeWind 5.0 estável **e** compatibilidade declarada
  com o Expo SDK em uso (a RC atual só foi testada com Expo 57/RN 0.86; em
  2026-10-31 o `latest` no npm ainda era `4.2.7`).

**Custo medido da migração (S4b, para não superestimar depois):** 86
`className` em 18 arquivos, 7 componentes usando `tailwind-merge` (já na v3),
**zero** uso de `cssInterop`, `remapProps`, `vars()` ou `placeholderClassName`.
O trabalho é de configuração: dependências, `global.css` com `@theme`, o
`tailwind.config.ts` atual (tokens → CSS), tirar `nativewind/babel` e o
`jsxImportSource`, e o Metro sem `input`. Depois, diff visual de `rounded-sm`
(semântica mudou no Tailwind 4) e das sombras (`boxShadow`). Uma sessão deve
bastar; o risco é o estado RC do pacote, não o tamanho do código.
