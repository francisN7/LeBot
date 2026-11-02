# Release interno

Como transformar o código em um **APK assinado**, instalar no Android e publicar
no GitHub Releases. Vale para o canal interno: Play Store continua fora de
escopo (ADR 0025).

O build é **local** e roda no **WSL2 (Ubuntu)**, não no Windows. Motivo: o C++ do
Reanimated achata o caminho absoluto de `node_modules` nos objetos do CMake e
estoura os 260 caracteres do `ninja` no Windows; no Linux o limite é `PATH_MAX`
(4096) e o problema não existe. O `adb` continua sendo o do Windows, que é quem
enxerga o aparelho pelo USB.

Não há EAS: o keystore e as senhas ficam só nesta máquina e no backup do dono.

## Pré-requisitos

### Windows (host)

- **WSL2** com Ubuntu: `wsl --install -d Ubuntu` e conferir `wsl -l -v`
  (`VERSION 2`).
- `C:\Users\<você>\.wslconfig` com memória suficiente para Gradle + Hermes:

  ```ini
  [wsl2]
  memory=4GB
  swap=3GB
  processors=10
  ```

  Depois de editar: `wsl --shutdown` (o limite só vale no próximo boot).
- **Android SDK** enxuto em `C:\Users\<você>\android-sdk` só com
  `platform-tools` — é o `adb` usado para instalar e medir.

### Dentro do WSL

- **JDK 17**: `sudo apt install openjdk-17-jdk`; conferir `java -version`.
- **Node 22** (o `.nvmrc` pede 22): `sudo apt install nodejs npm`; conferir
  `node -v`.
- `unzip`, `curl`, `git` e `rsync`.
- **Android SDK Linux** em `~/android-sdk`:

  ```bash
  curl -L -o clt.zip \
    https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip
  unzip -q clt.zip -d ~/android-sdk/cmdline-tools
  mv ~/android-sdk/cmdline-tools/cmdline-tools ~/android-sdk/cmdline-tools/latest
  ```

  Exporte no `~/.bashrc` (ou num script que você dá `source` antes do build):

  ```bash
  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
  export ANDROID_HOME=$HOME/android-sdk
  export ANDROID_SDK_ROOT=$ANDROID_HOME
  export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
  ```

  Aceite as licenças: `yes | sdkmanager --licenses`.

- Pacotes do SDK (o Gradle também baixa o que faltar, mas explicitando evita
  surpresa no meio do build):

  ```bash
  sdkmanager "platform-tools" "platforms;android-37.0" "build-tools;37.0.0" \
    "ndk;27.1.12297006" "cmake;3.22.1"
  ```

  O NDK não é opcional: Reanimated, Worklets e SVG compilam C++ no release.

## Código no Linux, não em `/mnt/c`

O projeto precisa estar no sistema de arquivos do Linux (`~/lebot`) — em
`/mnt/c` o I/O do 9p deixa o Gradle e o Metro lentos e o caminho volta a ficar
longo. O repositório do Windows continua sendo a fonte da verdade; sincronize
antes de cada build:

```bash
rsync -a --delete \
  --exclude node_modules --exclude android --exclude ios \
  --exclude .git --exclude dist --exclude .expo --exclude tmp \
  /mnt/c/Users/<você>/Apps/Codes/lebot/ ~/lebot/

cd ~/lebot && HUSKY=0 npm ci
```

`HUSKY=0` evita o hook de pre-commit no clone sem `.git`.

## Assinatura

O keystore **nunca** entra no Git, no bundle ou no Release:

| Arquivo | Onde | Backup |
|---|---|---|
| keystore | `~/.lebot/lebot-release.keystore` | gerenciador de senhas (anexo) |
| senhas | `~/.lebot/release.properties` | gerenciador de senhas (texto) |

No WSL, o `~` é o home do Linux, mesmo com o keystore no Windows:

```properties
storeFile=/mnt/c/Users/<você>/.lebot/lebot-release.keystore
storePassword=...
keyAlias=lebot
keyPassword=...
```

```bash
mkdir -p ~/.lebot && chmod 600 ~/.lebot/release.properties
```

Alias `lebot`, RSA 4096, validade 10.000 dias. Impressão SHA-256 do
certificado (confira com `keytool -list -v` antes de publicar):

```text
43:59:2A:0D:F3:BD:69:21:BD:58:DB:C5:EE:C3:BB:7C:BC:C8:6E:93:71:F1:AA:93:37:D6:97:B9:E7:50:02:BD
```

O `/android` é gerado e ignorado pelo Git, então a assinatura sobrevive ao
`prebuild` por causa do `plugins/with-release-signing.js`: ele injeta
`signingConfigs.release` no `android/app/build.gradle` e faz o release usar
essa config em vez da chave de debug. O Gradle lê o `release.properties` em
tempo de build — nenhum segredo é escrito em `android/`.

**Perder o keystore = não conseguir atualizar o app instalado.** Quem já tem o
APK antigo precisa desinstalar para aceitar um APK com outra assinatura.

## Gerar o APK

```bash
cd ~/lebot
npx expo prebuild --platform android --clean --no-install
```

> O `prebuild` reescreve `npm run android` para `expo run:android` no
> `package.json` do clone Linux. **Não copie esse `package.json` de volta**: no
> repositório o script continua `expo start --android` (Expo Go). O
> `prebuild --no-install` não mexe no `node_modules`.

O Gradle precisa saber onde está o SDK (o `prebuild` não cria o arquivo):

```bash
printf 'sdk.dir=%s\n' "$ANDROID_HOME" > android/local.properties
```

```bash
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
```

- Só `arm64-v8a`/`armeabi-v7a` cobre praticamente todo celular Android e corta
  metade do tempo de build. Para um APK universal (inclui emuladores x86), use
  `-PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64`.
- Saída: `android/app/build/outputs/apk/release/app-release.apk`.
- O release usa Hermes, R8 (`enableMinifyInReleaseBuilds`) e PNG crunch; os
  primeiros builds baixam dependências do Gradle e demoram bem mais.
- Se faltar memória, crie `~/.gradle/gradle.properties` com
  `org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m`.

Se o Gradle reclamar de SDK ausente, aceite as licenças com
`sdkmanager --licenses` e repita — não instale o Android Studio só para isso.

## Conferir a assinatura

Antes de instalar ou publicar, confirme que o APK saiu com o keystore de
release — **não** com a chave de debug (o template do Expo assina release com
debug; é o plugin que troca):

```bash
bt=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
"$bt/apksigner" verify --print-certs android/app/build/outputs/apk/release/app-release.apk \
  | grep 'SHA-256 digest'
```

O SHA-256 do certificado precisa ser
`43:59:2A:0D:F3:BD:69:21:BD:58:DB:C5:EE:C3:BB:7C:BC:C8:6E:93:71:F1:AA:93:37:D6:97:B9:E7:50:02:BD`
e o `DN` deve começar com `CN=LeBot`. Se aparecer `CN=Android Debug`, o
`with-release-signing` não rodou ou o `release.properties` não foi lido —
**não publique**.

## Instalar e conferir

Do **Windows** (é o `adb` que vê o USB):

```powershell
adb devices
adb install -r \\wsl$\Ubuntu\root\lebot\android\app\build\outputs\apk\release\app-release.apk
adb shell am start -n com.francisN7.lebot/.MainActivity
```

Se o caminho `\\wsl$` não funcionar, copie o APK para o Windows antes:

```bash
cp ~/lebot/android/app/build/outputs/apk/release/app-release.apk \
  /mnt/c/Users/<você>/Downloads/
```

No launcher: nome **LêBot**, ícone adaptativo (fundo creme/pink, foreground sem
corte e monocromático) e splash. O `applicationId` é `com.francisN7.lebot`.

Alternativa sem cabo: baixar o APK do Release no celular e permitir "instalar
apps de fontes desconhecidas" para o navegador/gerenciador de arquivos.

## Fumaça no release

1. Abrir o app e cadastrar um livro.
2. Trocar o status pela roda (toque longo no chip da lombada).
3. Registrar leitura e ver o progresso.
4. Abrir Ajustes, exportar um backup e restaurá-lo — o seletor de pasta/arquivo
   é o ponto mais sensível fora do Expo Go.

## Medir a Estante no release

O monitor de fps do menu de dev **não existe no release**. Use o contador de
quadros do Android:

```powershell
adb shell dumpsys gfxinfo com.francisN7.lebot reset
# usar a Estante por ~10 s
adb shell dumpsys gfxinfo com.francisN7.lebot
```

Olhar `Janky frames` (quanto menor, melhor) e o percentil 90/95. Para a
estante cheia, restaurar um backup fictício com 200 livros.

## Publicar no GitHub Releases

```powershell
gh release create v0.2.0 <caminho>\app-release.apk `
  --title "LêBot v0.2.0" --notes-file docs/release-notes-v0.2.0.md
```

O APK vai como **asset** do Release; o repositório continua sem binários.
Se `gh` não estiver instalado: `winget install GitHub.cli` e `gh auth login`.

## Subir a versão

1. `app.config.ts`: `version` (visível ao usuário) e `android.versionCode`
   (inteiro que **só cresce**; a Play Store recusa repetido).
2. `package.json`: `version` igual, para o projeto não divergir.
3. Sincronizar o clone do WSL (`rsync`), repetir `prebuild` + build — o
   `versionCode` entra no APK pelo `prebuild`.

## O que nunca entra no Git

- `android/`, `ios/` e `dist/` (gerados)
- `*.apk`, `*.aab`
- `*.keystore`, `*.jks`, `release.properties`
- backups do app, bancos SQLite, `.env`
- a pasta de saída de exportação de capas/backups
