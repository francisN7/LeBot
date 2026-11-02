# S12a — Build no GitHub Actions e estante cheia

## Objetivo

Tirar o build do APK da máquina local: um workflow do GitHub Actions disparado
por tag gera o APK assinado e o anexa ao Release. De quebra, corrigir o que o
v0.2.0 revelou: permissões desnecessárias, `allowBackup` ligado e a Estante
lenta com centenas de livros.

> Pré-requisito: S12 concluída (APK v0.2.0 instalado e release publicado).

## Fora de escopo

- Play Store, iOS e ficha de loja.
- Trocar SDK/dependências.
- Sincronização entre aparelhos ou backup automático.
- Refazer o design da Estante; só performance e flags de build.

## Tarefas

1. **Workflow `release.yml`** em `.github/workflows/`:
   - gatilho em tag `v*` (e `workflow_dispatch` para teste);
   - Ubuntu, Node 22, JDK 17, Android SDK com `platforms;android-37.0`,
     `build-tools;37.0.0`, `ndk;27.1.12297006` e `cmake;3.22.1`;
   - cache do Gradle e do `node_modules` (chave pelo `package-lock.json`);
   - recriar `~/.lebot/release.properties` a partir dos secrets
     (`KEYSTORE_BASE64`, `STORE_PASSWORD`, `KEY_PASSWORD`), com `keyAlias`
     `lebot` e `storeFile` no runner;
   - `npx expo prebuild --platform android --clean --no-install` +
     `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a`;
   - conferir a assinatura com `apksigner` (falhar se o SHA-256 não for o do
     keystore) e subir o APK como artefato do Release.
2. **Secrets e documentação:** criar os secrets no repositório e reescrever a
   seção de build do `docs/release.md` para o caminho CI, deixando o WSL como
   fallback local. Nunca imprimir valores no log.
3. **Permissões e backup:** no `app.config.ts`, bloquear `RECORD_AUDIO` e
   `SYSTEM_ALERT_WINDOW` e desligar `android.allowBackup`; conferir no
   `aapt2 dump badging`/manifesto final que sumiram.
4. **Estante cheia:** reduzir o custo dos cards montados (ex.: `windowSize` 3,
   sem `elevation`/sombra por card, animações paradas fora da tela) e medir com
   200 livros via `dumpsys gfxinfo`. Meta: ≤ 5% janky ou 60 fps na rolagem.
5. **Fixture de 200 livros:** regenerar `lebot-200.zip` em UTF-8 (o
   `lebot-backup-cheio.zip` da S11 tem texto duplicado: `Breve RelÃ³gio`) e
   versionar o gerador em `scripts/` para repetir a medição.
6. **Limpeza:** remover o que sobrou da tentativa no Windows (junction `C:\nm`
   se existir), decidir o que fica no WSL e atualizar `docs/release.md` e
   `AGENTS.md` se os comandos mudarem.
7. **Fechar:** `CURRENT.md`, `roadmap.md`, `CHANGELOG.md`, ADR 0026 (build em
   CI e keystore em secrets) e spec da S13.

## Aceite

- [ ] Push de uma tag gera o APK assinado no Actions e o anexa ao Release sem
      intervenção manual.
- [ ] `apksigner` do workflow confere o SHA-256 do keystore de release.
- [ ] APK do CI instala por cima do v0.2.0 (mesma assinatura).
- [ ] Manifesto final sem `RECORD_AUDIO`/`SYSTEM_ALERT_WINDOW` e com
      `allowBackup=false`.
- [ ] Estante com 200 livros: ≤ 5% frames janky (ou 60 fps) na rolagem.
- [ ] `lebot-200.zip` abre com acentos corretos e o gerador está no repo.
- [ ] lint, typecheck, test, doctor e `expo export` verdes; nenhum segredo no
      Git, no log ou no artefato.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, `docs/release.md`, ADR 0025,
`docs/sessions/S12-release-interno.md`, `app.config.ts`,
`src/features/library/EstanteScreen.tsx`, `src/components/ui/spine.tsx`,
`plugins/with-release-signing.js` e `.github/workflows/`.

## Arquivos prováveis

- `.github/workflows/release.yml`, `docs/release.md`, ADR 0026
- `app.config.ts`, `EstanteScreen.tsx`, `spine.tsx`
- `scripts/build-200-books.mjs` (ou equivalente)

## Riscos

- **Secrets no CI:** qualquer `echo` do keystore ou da senha vaza no log
  público. Usar `::add-mask::` e nunca imprimir o conteúdo.
- **Assinatura:** o APK do CI precisa usar o mesmo keystore do v0.2.0; conferir
  o SHA-256 antes de publicar.
- **Tempo do runner:** primeiro build sem cache leva ~20 min; cache mal
  configurado pode não economizar nada.
- **Performance:** mexer em `windowSize`/sombras pode trocar jank por cards em
  branco; medir com `gfxinfo` e conferir visualmente a rolagem.
- **Custo de rebuild:** cada iteração de performance exige um APK novo; agrupar
  as mudanças antes de buildar.
