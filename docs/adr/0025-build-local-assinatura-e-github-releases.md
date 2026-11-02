# ADR 0025 — Build local, assinatura fora do repo e GitHub Releases

- **Status:** aceito
- **Data:** 2026-11-01
- **Sessão:** S12
- **Relacionada:** revê o `applicationId` da ADR 0002; o canal de distribuição é
  interno (a Play Store continua fora de escopo)

## Contexto

A S12 precisava do primeiro APK instalável fora do Expo Go. Três decisões não
eram óbvias:

1. **Onde buildar.** O projeto nunca teve `android/` nem `eas.json`, e a máquina
   de desenvolvimento não tinha JDK nem Android SDK. EAS dispensaria o toolchain
   local, mas colocaria a chave de assinatura na nuvem e exigiria conta Expo.
2. **Onde vive a assinatura.** `/android` é gerado pelo `prebuild` e ignorado
   pelo Git; qualquer coisa escrita à mão nele desaparece no próximo
   `prebuild --clean` — inclusive o `signingConfig` de release.
3. **Como distribuir.** O dono quer instalar e compartilhar o APK sem publicar
   na Play Store, e o repositório é público.

## Decisão

### 1. Build local, sem EAS

`npx expo prebuild --platform android` + `gradlew assembleRelease`. O custo é
um toolchain de ~3 GB (JDK 17 + Android SDK + NDK; o NDK é obrigatório porque
Reanimated, Worklets e SVG compilam C++). Em troca: nada de conta, fila ou
credencial na nuvem, e o `adb` fica disponível para instalar e medir.

O build roda no **WSL2 (Ubuntu)**, não no Windows. O C++ do Reanimated achata o
caminho absoluto de `node_modules` nos objetos do CMake e o `ninja` do SDK
estoura o limite de 260 caracteres do Windows, mesmo com `LongPathsEnabled=1`;
`subst` não resolve (o CMake expande o drive) e `CMAKE_OBJECT_PATH_MAX` é
ignorado pelo Ninja. No Linux o limite é `PATH_MAX` (4096) e o problema
desaparece. O código é sincronizado para `~/lebot` (fora de `/mnt/c`, pelo I/O
do 9p) e o `adb` continua sendo o do Windows, que enxerga o USB.

### 2. Assinatura por config plugin, segredo fora do repositório

`plugins/with-release-signing.js` injeta `signingConfigs.release` no
`android/app/build.gradle` gerado e faz o `buildTypes.release` usá-la — o
template do Expo assina release com a chave de debug.

O keystore e as senhas ficam em `~/.lebot/` (`lebot-release.keystore` e
`release.properties`), lidos pelo **Gradle em tempo de build**. Assim:

- nenhum segredo é escrito em `android/`, no bundle ou no Git;
- o build continua repetível do zero (`prebuild --clean` não perde a
  assinatura);
- o backup é responsabilidade do dono (gerenciador de senhas). Keystore perdido
  impede atualizar quem já instalou.

### 3. GitHub Releases como canal interno

O APK assinado vai como **asset** de uma tag `vX.Y.Z`; o repositório não recebe
binários (`*.apk` e `*.aab` seguem no `.gitignore`). Atualização só instala por
cima com a mesma assinatura, então o keystore é permanente.

### 4. `applicationId` = `com.francisN7.lebot`

Troca de `com.francis.lebot` (ADR 0002) para combinar com o GitHub do dono. Sem
migração: nenhum APK tinha sido publicado, então não há app instalado com o id
antigo. `ios.bundleIdentifier` acompanha para os dois não divergirem.

Versão do primeiro release: **0.2.0**, `versionCode` **1**.

## Consequências

- O `prebuild` reescreve `npm run android` para `expo run:android`; o script é
  revertido antes do commit e o `expo start --android` (Expo Go) continua sendo
  o caminho de desenvolvimento.
- No Windows, o C++ do Reanimated gera caminhos de objeto acima de 260 caracteres
  e o `ninja` falha mesmo com `LongPathsEnabled=1`; `subst` não ajuda (o CMake
  expande o drive). Por isso o build passou a ser no **WSL2** com o projeto em
  `~/lebot`; o `node_modules` do Windows (`C:\nm` + junction) deixou de ser
  necessário. O fluxo de sincronização (`rsync` + `npm ci`), a memória do WSL
  (`.wslconfig`) e o `release.properties` com `storeFile=/mnt/c/...` estão em
  `docs/release.md`.
- O APK é arm-only (`arm64-v8a` + `armeabi-v7a`) para cortar build e download;
  emulador x86 exige o build universal documentado em `docs/release.md`.
- Publicar uma nova versão é manual (`gh release create`); automatizar em CI
  exigiria keystore em secrets, o que foi descartado por ora.
- O `versionCode` precisa crescer a cada release; a regra está em
  `docs/release.md`.

## Adendo (S12, durante o build)

O primeiro APK saiu assinado com a chave de **debug**. Causa: o
`with-release-signing` injetava o bloco `signingConfigs.release` antes de trocar
a linha do `buildTypes.release`; o `release {` recém-inserido era o primeiro do
arquivo e o regex acabava alterando o `debug`. A ordem foi invertida (troca
primeiro, injeção depois) e o plugin agora falha se o release não usar a config
de release. A conferência passou a ser obrigatória no `apksigner` pelo SHA-256 do
certificado, não só pela existência do APK.

Também ficaram para a S12a: bloquear `RECORD_AUDIO`/`SYSTEM_ALERT_WINDOW`
(herdados do template), desligar `allowBackup` e corrigir a Estante com centenas
de livros.
