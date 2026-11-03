# Estado atual

## Sessão

- **Atual:** S12b — otimização rápida da estante no 0.2.0 (sem nova versão).
  Spec em `docs/sessions/S12b-otimizacao-estante.md`. Depois dela vem a S12a
  (build no GitHub Actions), cuja spec já está pronta.
- **Última concluída:** S12 — release interno v0.2.0 (2026-11-02), em
  <https://github.com/francisN7/LeBot/releases/tag/v0.2.0> (`lebot-0.2.0.apk`,
  54 MB, SHA-256 `f09271eb…4203671`).

## Entrega da S12

- APK `com.francisN7.lebot` 0.2.0 (`versionCode 1`), arm64 + armv7, minSdk 24 /
  targetSdk 36, keystore de release (SHA-256 `43:59:2A:…:02:BD`), instalado no
  Realme C67 (Android 15) fora do Expo Go: abre frio em 1,8 s.
- Launcher **LêBot** (ícone adaptativo e splash) e fumaça conferidos: livro
  novo, troca de status pela roda, leitura, exportar e restaurar backup.
- Medições no release: **5 livros** 4,4% janky/20 ms; **201 livros** 36%
  (stress) e **77%**/53 ms (normal). Não atendeu o aceite: foi para a S12b.
- `plugins/with-release-signing.js` corrigido: assinava o `debug` com a chave de
  release; agora troca antes de injetar e falha se o `release` não usar a config.
- `docs/release.md` reescrito para WSL2; README e notas com a dedicatória à
  esposa do dono, idealizadora do app; ADR 0025 com adendo.

## Build atual (WSL2)

- Ubuntu 26.04, 4 GB de RAM + 6 GB de swap (`.wslconfig`); JDK 17, Node 22 e
  Android SDK Linux em `~/android-sdk` (`platforms;android-37.0`,
  `build-tools;37.0.0`, `ndk;27.1.12297006`, `cmake;3.22.1`).
- Código em `~/lebot` (nunca em `/mnt/c`); `HUSKY=0 npm ci`;
  `~/.lebot/release.properties` com `storeFile=/mnt/c/Users/francis/.lebot/lebot-release.keystore`.
- `npx expo prebuild --platform android --clean --no-install` +
  `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
  --no-daemon --max-workers=2 --no-parallel`: ~11 min com cache. APK em
  `~/lebot/android/app/build/outputs/apk/release/app-release.apk`; `adb` é o do
  Windows. `gh` autenticado como `francisN7`.

## Próximo passo (S12b)

1. Gerar `lebot-200.zip` em UTF-8 com `scripts/build-200-books.mjs` (o fixture
   da S11 tem `Breve RelÃ³gio`) e medir a linha de base com 200 livros.
2. `windowSize` 5→3 e `React.memo` no card (extrair `BookCard`, props estáveis),
   **sem tocar nas animações** — a lombada anima na grade.
3. Um build (~11 min) e medição antes/depois com `dumpsys gfxinfo` (protocolo na
   spec). ≤ 5% janky é meta registrada, não bloqueio: vale o ganho real.
4. Publicar só se compensar (instalar por cima + `gh release upload --clobber`,
   `apksigner` conferido); fechar docs e commitar. A S12a (CI) vem depois.

## Depois (S12a)

- CI por tag, permissões/`allowBackup` e limpeza do WSL. Spec pronta em
  `docs/sessions/S12a-ci-github-e-estante-cheia.md`.

## Armadilhas

- Assinatura: o template do Expo assina release com debug; conferir com
  `apksigner` (DN `CN=LeBot`, SHA-256 acima), nunca só pela existência do APK.
  Keystore perdido impede atualizar quem já instalou: backup no gerenciador.
- Memória: 4 GB no WSL não aguentam Gradle + Kotlin + C++ em paralelo
  (`--max-workers=2 --no-parallel`, heap 1,5 GB, um build por vez). Sob carga,
  `wsl -d Ubuntu -- ...` para de responder: use `\\wsl.localhost\Ubuntu\...`.
- `prebuild` reescreve `npm run android` no clone Linux (não copiar de volta);
  `--clean` apaga `android/`, mas os objetos C++ ficam em `node_modules`.

## Arquivos-chave

- `app.config.ts`, `plugins/with-release-signing.js`, `package.json`
- `docs/release.md`, `docs/release-notes-v0.2.0.md`, `docs/adr/0025-*`
- `docs/sessions/S12-release-interno.md`,
  `docs/sessions/S12a-ci-github-e-estante-cheia.md`,
  `docs/sessions/S12b-otimizacao-estante.md`

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```

