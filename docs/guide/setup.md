# Como rodar

**O que responde:** instalar, rodar, testar e resolver os tropeços comuns de
Expo/React Native. **O que não responde:** publicar o APK
([`release.md`](release.md)) nem as regras de teste ([`testing.md`](testing.md)).

## Requisitos

- **Node 22 LTS** (veja `.nvmrc`) e npm.
- **Expo Go** no Android para desenvolvimento. Para medir desempenho use o APK de
  release — o Expo Go exagera e não serve para `gfxinfo`.
- `adb` (platform-tools) só se for instalar ou medir no aparelho.

## Primeiro uso

```bash
npm install
npm start          # Metro + QR code
```

Leia o QR com o Expo Go. Com um emulador/aparelho já aberto: `npm run android`.

## Scripts

| Comando | Para quê |
|---|---|
| `npm start` · `npm run android` · `npm run web` | Metro (QR, Android, web) |
| `npm run lint` · `npm run lint:fix` · `npm run format` | Biome |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` · `npm run test:watch` | Jest |
| `npm run doctor` | `expo-doctor` |
| `npx expo install --check` · `--fix` | alinhar pacotes ao SDK |
| `npx drizzle-kit generate` | migração depois de mudar o schema |
| `node scripts/build-icons.mjs` | ícone/splash de `brand/source/*.svg` |
| `node scripts/build-isbn-ranges.mjs` | tabela oficial de faixas do ISBN |
| `node scripts/build-200-books.mjs` | fixture de 200 livros para medir |
| `powershell -File scripts/measure-gfx.ps1` | protocolo de medição da Estante |
| `gh workflow run release.yml` | APK no GitHub Actions |

## Mapa mental Expo

| React (web) | Expo / React Native |
|---|---|
| `div`, `span`, `p` | `View`, `Text` |
| CSS, classes | NativeWind (`className`) + `StyleSheet` para estilo dinâmico |
| `onClick` | `onPress` |
| `img` | `Image` (`expo-image` para cache e placeholder) |
| React Router | `expo-router` com arquivos em `src/app/` |
| `localStorage` | SQLite (`expo-sqlite` + Drizzle); sem chave-valor síncrono |

## Regras que evitam bugs

1. **Todo texto precisa estar dentro de `<Text>`.** Texto solto em `View` quebra
   no Android.
2. **Flexbox é o padrão.** `flexDirection` já é `column`; não existe float.
3. **`position: 'fixed'` não existe.** Para sobreposição, `absolute` + insets.
4. **Sombras:** `boxShadow` no RN novo; `elevation` é o legado Android.
5. **Safe area:** `useSafeAreaInsets` (já há `SafeAreaProvider` no layout raiz).
6. **Nada de `window`/`document`.** Só roda no web.
7. **`gap` existe desde a RN 0.71** e é usado sem medo.

## Expo Router

- Arquivos em `src/app/` são rotas; `_layout.tsx` envolve as irmãs e `index.tsx`
  é a rota `/`.
- Rotas tipadas (`experiments.typedRoutes`) dão autocomplete em `href`.
- Navegar: `router.push('/livro/123')` ou `<Link href="...">`.

## Fluxo de desenvolvimento

- Recarregar: `r` no terminal ou agitar o aparelho.
- Bundle travado: `npx expo start -c` (limpa o cache do Metro).
- Dependência nativa nova: `npx expo install <pacote>`, nunca `npm install`
  direto, para casar a versão com o SDK.

## Problemas comuns

- **Ícone/splash não aparecem:** só em build nativo; o Expo Go não os exibe.
- **Teste falhando só no CI:** confira a versão do Node (22) e rode a suíte inteira.
- **Mudou o schema e o app abre vazio:** faltou `npx drizzle-kit generate` e o
  bundle das migrações (`drizzle/migrations.js`).

## Testes

Jest com `jest-expo`; telas usam `@testing-library/react-native` com repositórios
em memória; banco usa `sql.js` com as migrações reais. Detalhes em
[`testing.md`](testing.md).
