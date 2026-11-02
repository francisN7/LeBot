# Estado atual

## Sessão

- **Atual:** S12a — build no GitHub Actions + permissões/`allowBackup` + estante
  cheia. Spec em `docs/sessions/S12a-ci-github-e-estante-cheia.md`.
- **Última concluída:** S12 — release interno v0.2.0 (APK assinado instalado no
  Android). A performance da estante cheia não bateu o aceite e virou S12a.
- **Publicação:** `v0.2.0` em
  <https://github.com/francisN7/LeBot/releases/tag/v0.2.0>, com o asset
  `lebot-0.2.0.apk` (54 MB, SHA-256
  `f09271eb0b74126c20fe4dad6ed080d8166625c0bb7806811e8d1e1314203671`) e as
  notas em `docs/release-notes-v0.2.0.md`.

## O que a S12 entregou

- APK **54 MB**, `com.francisN7.lebot`, `0.2.0` (`versionCode 1`),
  `arm64-v8a` + `armeabi-v7a`, minSdk 24 / targetSdk 36, assinado com o keystore
  de release (SHA-256 `43:59:2A:…:02:BD`). Instalado no Realme C67 (RMX3890,
  Android 15) fora do Expo Go; abriu frio em 1,8 s com SQLite real.
- Launcher: **LêBot**, ícone adaptativo rosa/creme e splash conferidos.
- Fumaça: livro novo, troca de status pela roda, leitura registrada, exportar
  backup e restaurar 200 livros (ficou com 201).
- Medições no release (Realme C67): **5 livros** 4,4% janky / mediana 20 ms;
  **201 livros** 36% (stress) e **77%** (rolagem normal) / mediana 53 ms,
  p95 300 ms. Limite de aceite não atendido: foi para a S12a.
- `plugins/with-release-signing.js` corrigido: trocava a assinatura do `debug`
  e deixava o release na chave de debug. Agora troca antes de injetar e falha se
  o release não usar `signingConfigs.release`; conferência obrigatória com
  `apksigner`.
- `docs/release.md` reescrito para o build em **WSL2/Ubuntu**;
  `docs/release-notes-v0.2.0.md` criado; ADR 0025 ganhou adendo.

## Como o build roda hoje (WSL2)

- Ubuntu 26.04 no WSL2, 4 GB de RAM + 6 GB de swap (`.wslconfig`).
- JDK 17, Node 22, Android SDK Linux em `~/android-sdk`
  (`platforms;android-37.0`, `build-tools;37.0.0`, `ndk;27.1.12297006`,
  `cmake;3.22.1`), `ANDROID_HOME`/`JAVA_HOME` exportados.
- Código sincronizado para `~/lebot` (nunca em `/mnt/c`); `HUSKY=0 npm ci`.
- `~/.lebot/release.properties` com
  `storeFile=/mnt/c/Users/francis/.lebot/lebot-release.keystore`.
- `npx expo prebuild --platform android --clean --no-install` +
  `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
  --no-daemon --max-workers=2 --no-parallel` (heap 1,5 GB). Build completo:
  ~11 min com cache.
- Saída: `~/lebot/android/app/build/outputs/apk/release/app-release.apk`; cópia
  em `C:\Users\francis\Downloads\lebot-0.2.0.apk`.
- `adb` é o do Windows (`C:\Users\francis\android-sdk\platform-tools\adb.exe`).
- `gh` 2.103.3 instalado no Windows (fora do PATH da sessão atual; chamar por
  `C:\Program Files\GitHub CLI\gh.exe` ou abrir terminal novo).

## Próximo passo (S12a)

1. Workflow `release.yml` por tag, keystore em secrets, APK anexado ao Release.
2. Bloquear `RECORD_AUDIO`/`SYSTEM_ALERT_WINDOW` e `android.allowBackup=false`.
3. Estante cheia: reduzir cards animados montados (`windowSize`, sombra,
   animações fora da tela) e medir de novo com 200 livros.
4. Regenerar o fixture de 200 livros em UTF-8 (o `lebot-backup-cheio.zip` da S11
   tem texto duplicado: `Breve RelÃ³gio`) e versionar o gerador.
5. Limpeza do que sobrou da tentativa no Windows e atualizar docs/AGENTS.
6. ADR 0026 (build em CI + secrets) e spec da S13.

## Pendências conhecidas

- Manifesto do APK pede `RECORD_AUDIO` e `SYSTEM_ALERT_WINDOW` (herdados do
  template do Expo) e está com `allowBackup=true` (Android pode enviar o SQLite
  para o backup da nuvem). Corrigir na S12a.
- `lebot-backup-cheio.zip` (S11) tem o texto duplicado no próprio JSON; não é
  bug do app, mas invalida a conferência visual de acentos.
- Estante com centenas de livros abaixo de 60 fps no release.

## Armadilhas

- **Assinatura:** o template do Expo assina release com debug; o plugin precisa
  rodar na ordem certa (troca antes da injeção) e o APK precisa ser conferido com
  `apksigner`, nunca só pela existência do arquivo.
- **Memória:** 4 GB no WSL não aguentam Gradle + Kotlin + C++ em paralelo. Usar
  `--max-workers=2 --no-parallel`, heap 1,5 GB e não rodar outro build junto.
- **WSL sob carga** deixa de responder a `wsl -d Ubuntu -- ...`; para inspecionar
  o build use `\\wsl.localhost\Ubuntu\root\...` e `/proc/meminfo`.
- **`prebuild` reescreve** `npm run android` no `package.json` do clone Linux;
  nunca copie esse arquivo de volta.
- **`prebuild --clean`** apaga `android/`, mas os objetos C++ dos módulos ficam em
  `node_modules/*/android/build` e o rebuild cai para ~11 min.
- Keystore perdido impede atualizar quem já instalou; backup no gerenciador de
  senhas.

## Arquivos-chave

- `app.config.ts`, `plugins/with-release-signing.js`, `package.json`
- `docs/release.md`, `docs/release-notes-v0.2.0.md`,
  `docs/adr/0025-*`, `docs/sessions/S12-release-interno.md`,
  `docs/sessions/S12a-ci-github-e-estante-cheia.md`

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```

Build do APK: ver `docs/release.md` (WSL2).
