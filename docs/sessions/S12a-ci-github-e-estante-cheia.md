# S12a — Build no GitHub Actions e ajustes de release

## Objetivo

Tirar o build do APK da máquina local: um workflow do GitHub Actions disparado
por tag gera o APK assinado e o anexa ao Release. Junto, fechar o que o v0.2.0
revelou no pacote: permissões desnecessárias e `allowBackup` ligado.

> Pré-requisito: **S12b** concluída (estante otimizada, APK 0.2.0 reinstalado e
> asset do release atualizado). A performance saiu daqui: medir com build local
> antes de trocar o caminho de build evita caçar dois problemas ao mesmo tempo.

## Fora de escopo

- Play Store, iOS e ficha de loja.
- Trocar SDK/dependências.
- Sincronização entre aparelhos ou backup automático.
- Performance da Estante, `windowSize`, animações e fixture de 200 livros (S12b).
- Refazer o design; só flags de build e permissões.

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
     keystore) e anexar o APK ao Release.
2. **Secrets e documentação:** criar os secrets no repositório e reescrever a
   seção de build do `docs/release.md` para o caminho CI, deixando o WSL como
   fallback local. Nunca imprimir valores no log.
3. **Permissões e backup:** no `app.config.ts`, bloquear `RECORD_AUDIO` e
   `SYSTEM_ALERT_WINDOW` e desligar `android.allowBackup`; conferir no
   `aapt2 dump badging`/manifesto final que sumiram.
4. **Publicar o build da CI:** trocar o asset do release `v0.2.0` pelo APK gerado
   no Actions (`gh release upload v0.2.0 ... --clobber`) e instalar por cima no
   aparelho para confirmar que o comportamento é o mesmo da S12b.
5. **Limpeza:** remover o que sobrou da tentativa no Windows (junction `C:\nm`
   se existir), decidir o que fica no WSL e atualizar `docs/release.md` e
   `AGENTS.md` se os comandos mudarem.
6. **Fechar:** `CURRENT.md`, `roadmap.md`, `CHANGELOG.md`, ADR 0026 (build em
   CI e keystore em secrets) e spec da S13.

## Aceite

- [x] Push de uma tag gera o APK assinado no Actions e o anexa ao Release sem
      intervenção manual. (Fluxo implementado; `workflow_dispatch` validado com
      artefato. Publicação por tag será exercitada na próxima release.)
- [x] `apksigner` do workflow confere o SHA-256 do keystore de release.
- [ ] APK do CI instala por cima do v0.2.0 (mesma assinatura) e abre com os
      mesmos dados. **Adiado para a S12b por decisão do dono** (não instalar nem
      publicar agora).
- [x] Manifesto final sem `RECORD_AUDIO`/`SYSTEM_ALERT_WINDOW` e com
      `allowBackup=false`.
- [x] lint, typecheck, test, doctor e `expo export` verdes; nenhum segredo no
      Git, no log ou no artefato.

## Resultado (2026-11-03)

- Build verde no run `41751795698` (primeiro com todas as conferências):
  `Compilar APK` ~16 min em runner frio; APK `lebot-0.2.0.apk` com 54 MB.
- Rebuild do commit final (`4114f93`) no run `41755444978`: 17 min no total
  (~13 min compilando, com cache do Gradle restaurado), mesmas conferências
  aprovadas. O artefato ficou no Actions; **nada foi publicado nem instalado**.
- `apksigner`: `SHA-256` igual ao do keystore; `aapt2`: sem `RECORD_AUDIO` e
  `SYSTEM_ALERT_WINDOW`; `apkanalyzer`: `allowBackup="false"`.
- CI (`ci.yml`) verde nos 3 jobs depois de alinhar o Biome do YAML e os patches
  do SDK exigidos pelo Expo Doctor.
- Limpeza: 13,68 GB (WSL), 1,14 GB (runtime), 0,30 GB (JDK), 0,85 GB (Gradle),
  4,87 GB (`node_modules`) + caches. ~22,6 GB devolvidos; `adb` e keystore
  mantidos.
- Instalar no aparelho e trocar o asset do `v0.2.0` ficaram para a S12b, junto
  com a medição de performance.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, `docs/release.md`, ADR 0025,
`docs/sessions/S12-release-interno.md`, `docs/sessions/S12b-otimizacao-estante.md`,
`app.config.ts`, `plugins/with-release-signing.js` e `.github/workflows/`.

## Arquivos prováveis

- `.github/workflows/release.yml`, `docs/release.md`, ADR 0026
- `app.config.ts`

## Riscos

- **Secrets no CI:** qualquer `echo` do keystore ou da senha vaza no log
  público. Usar `::add-mask::` e nunca imprimir o conteúdo.
- **Assinatura:** o APK do CI precisa usar o mesmo keystore do v0.2.0; conferir
  o SHA-256 antes de publicar.
- **Tempo do runner:** primeiro build sem cache leva ~20 min; cache mal
  configurado pode não economizar nada.
- **`prebuild` no runner:** o plugin de assinatura depende de
  `~/.lebot/release.properties` existir **antes** do Gradle; se o arquivo faltar,
  o build assina com debug — e o aceite tem que falhar, não publicar.
