# Expo para quem vem de React

Notas curtas para reduzir o custo de troca de contexto entre sessões.

## Mapa mental

| React (web) | Expo / React Native |
|---|---|
| `div`, `span`, `p` | `View`, `Text` |
| CSS, classes | NativeWind (`className`) + `StyleSheet` para estilo dinâmico |
| `onClick` | `onPress` |
| `img` | `Image` (`expo-image` para cache e placeholders) |
| React Router | `expo-router` com arquivos em `src/app/` |
| `localStorage` | SQLite (`expo-sqlite` + Drizzle); sem chave-valor síncrono |

## Regras que evitam bugs

1. **Todo texto precisa estar dentro de `<Text>`.** Texto solto em `View`
   quebra no Android.
2. **Não existe `gap` em versões antigas?** Existe desde a RN 0.71; usamos sem
   medo.
3. **Flexbox é o padrão.** `flexDirection` já é `column`; não existe float.
4. **`position: 'fixed'` não existe.** Para sobreposição, `absolute` + insets.
5. **Sombras:** `boxShadow` funciona no RN novo; `elevation` é o legado Android.
6. **Safe area:** use `useSafeAreaInsets` (já envolto em `SafeAreaProvider` no
   layout raiz).
7. **Nada de `window`/`document`.** Só roda no web.

## Expo Router

- Arquivos em `src/app/` são rotas. `_layout.tsx` é o layout que envolve as
  rotas irmãs.
- `index.tsx` é a rota `/`.
- Rotas tipadas (`experiments.typedRoutes`) dão autocomplete em `href`.
- Para abrir uma rota: `router.push('/livro/123')` ou `<Link href="...">`.

## Fluxo de desenvolvimento

```bash
npm start          # Metro + QR code para o Expo Go
npm run android    # abre no emulador/dispositivo conectado
```

- Recarregar: `r` no terminal ou agitar o aparelho.
- Se o bundle travar: `npx expo start -c` (limpa cache do Metro).
- Uma dependência nativa nova pede `npx expo install <pacote>` — nunca
  `npm install` direto, para casar a versão com o SDK.

## Testes

Jest roda com o preset `jest-expo`. Componentes usam
`@testing-library/react-native` com repositórios em memória; repositórios usam
`sql.js` com as migrações reais. Funções puras em `src/lib/` e o motor do plano
não importam nada de React Native. Detalhes em `docs/testing.md`.
