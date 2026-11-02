# Estado atual

## Sessão

- **Atual:** S12a — build no GitHub Actions, permissões/`allowBackup` e estante
  cheia. Spec em `docs/sessions/S12a-ci-github-e-estante-cheia.md`.
- **Última concluída:** S12 — release interno v0.2.0, em 2026-11-02.
- **Publicação:** <https://github.com/francisN7/LeBot/releases/tag/v0.2.0>
  (`lebot-0.2.0.apk`, 54 MB, SHA-256 `f09271eb…4203671`).

## Entrega da S12

- APK `com.francisN7.lebot` 0.2.0 (`versionCode 1`), `arm64-v8a` +
  `armeabi-v7a`, minSdk 24 / targetSdk 36, assinado com o keystore de release
  (SHA-256 `43:59:2A:…:02:BD`). Instalado no Realme C67 (RMX3890, Android 15)
  fora do Expo Go; abriu frio em 1,8 s com SQLite real.
- Launcher: **LêBot**, ícone adaptativo rosa/creme e splash conferidos.
- Fumaça: livro novo, troca de status pela roda, leitura registrada, exportar
  backup e restaurar 200 livros (ficou com 201).
- Medições no release: **5 livros** 4,4% janky/20 ms; **201 livros** 36%
  (stress) e **77%**/53 ms (normal). Não atendeu o aceite: foi para a S12a.
- `plugins/with-release-signing.js` corrigido: trocava a assinatura do `debug` e
  deixava o release na chave de debug. Agora troca antes de injetar e falha se o
  release não usar `signingConfigs.release`; conferir sempre com `apksigner`.
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
  --no-daemon --max-workers=2 --no-parallel` (heap 1,5 GB): ~11 min com cache.
- Saída em `~/lebot/android/app/build/outputs/apk/release/app-release.apk`;
  cópia em `C:\Users\francis\Downloads\lebot-0.2.0.apk`. `adb` é o do Windows.
- `gh` 2.103.3 no Windows, autenticado como `francisN7`.

## Próximo passo (S12a)

1. Workflow `release.yml` por tag: keystore em secrets, APK assinado anexado ao
   Release e conferência do SHA-256 com `apksigner`.
2. `app.config.ts`: bloquear `RECORD_AUDIO`/`SYSTEM_ALERT_WINDOW` e
   `android.allowBackup=false`.
3. Estante cheia: reduzir cards animados montados (`windowSize`, sombra,
   animações fora da tela) e medir com 200 livros.
4. Regenerar o fixture de 200 livros em UTF-8 (o `lebot-backup-cheio.zip` da S11
   tem texto duplicado: `Breve RelÃ³gio`) e versionar o gerador.
5. Limpeza do que sobrou da tentativa no Windows; ADR 0026 e spec da S13.

## Armadilhas

- Assinatura: o template do Expo assina release com debug; conferir com
  `apksigner` (DN `CN=LeBot` e SHA-256 acima), nunca só pela existência do APK.
- Memória: 4 GB no WSL não aguentam Gradle + Kotlin + C++ em paralelo. Usar
  `--max-workers=2 --no-parallel`, heap 1,5 GB e um build por vez.
- WSL sob carga para de responder a `wsl -d Ubuntu -- ...`; inspecionar por
  `\\wsl.localhost\Ubuntu\root\...` e `/proc/meminfo`.
- `prebuild` reescreve `npm run android` no clone Linux (não copiar de volta);
  `--clean` apaga `android/`, mas os objetos C++ ficam em `node_modules`.
- Keystore perdido impede atualizar quem já instalou; backup no gerenciador.

## Arquivos-chave

- `app.config.ts`, `plugins/with-release-signing.js`, `package.json`
- `docs/release.md`, `docs/release-notes-v0.2.0.md`, `docs/adr/0025-*`
- `docs/sessions/S12-release-interno.md`,
  `docs/sessions/S12a-ci-github-e-estante-cheia.md`

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```

