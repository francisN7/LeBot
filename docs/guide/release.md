# Release

**O que responde:** gerar, conferir, instalar e publicar o APK. **O que não
responde:** rodar em desenvolvimento ([`setup.md`](setup.md)) nem testar
([`testing.md`](testing.md)).

O build roda **no GitHub Actions** (ADR 0026), nunca na máquina do dono. Não há
EAS: keystore e senhas ficam no backup do dono e nos secrets do repositório.
Play Store e iOS estão fora de escopo.

## Requisitos e secrets

- **`adb`** (só `platform-tools`: pacote `android-tools` da distro ou o SDK) e
  **`gh`** autenticado (`gh auth login`); Node 26. **Nada de JDK, Gradle, NDK ou
  WSL** — um `android/` na raiz é resto de `prebuild` e deve ser apagado.
- Três secrets alimentam a assinatura (`Settings → Secrets and variables →
  Actions`), criados com `gh secret set` lendo de arquivo, nunca com `echo`:
  `KEYSTORE_BASE64` (keystore em base64), `STORE_PASSWORD` e `KEY_PASSWORD`. O
  workflow mascara os três com `::add-mask::` e falha se algum faltar.

## Assinatura

O keystore **nunca** entra no Git, no bundle ou no Release: fica em
`~/.lebot/lebot-release.keystore`, as senhas em `~/.lebot/release.properties`, e
a cópia do CI no secret. Alias `lebot`, RSA 4096, validade 10.000 dias.
Impressão SHA-256 do certificado (pública; o workflow compara e **reprova** se
não bater):

```text
43:59:2A:0D:F3:BD:69:21:BD:58:DB:C5:EE:C3:BB:7C:BC:C8:6E:93:71:F1:AA:93:37:D6:97:B9:E7:50:02:BD
```

O `/android` é gerado no runner, então `plugins/with-release-signing.js` injeta
`signingConfigs.release` no `build.gradle`; o Gradle lê o
`release.properties` em tempo de build e nenhum segredo vai para `android/`.
**Perder o keystore = não conseguir atualizar o app instalado.**

## Gerar o APK

O build é só manual, pelo Actions (`.github/workflows/release.yml`, ADR 0026):
**`workflow_dispatch`** compila, confere e deixa o APK como artefato por 30 dias.
Com o campo `tag`, também anexa ao Release informado (criando-o se preciso), sem
sobrescrever APK já anexado. Criar uma tag **não** dispara build.

```bash
gh workflow run release.yml
gh run watch
gh run download --name lebot-apk
```

Compila só `arm64-v8a`/`armeabi-v7a` e sai em
`android/app/build/outputs/apk/release/app-release.apk`.

## Conferir e instalar

O workflow já confere e reprova se divergir: `apksigner` compara o SHA-256 do
certificado; `aapt2 dump permissions` garante que `RECORD_AUDIO` e
`SYSTEM_ALERT_WINDOW` não estão no APK; `aapt2 dump xmltree` exige
`allowBackup="false"`. Se aparecer `CN=Android Debug`, **não publique**.

```bash
gh release download v0.3.0 --pattern "lebot-*.apk" --dir /tmp/lebot
adb install -r "$(ls /tmp/lebot/lebot-*.apk | tail -1)"
adb shell am start -n com.francisN7.lebot/.MainActivity
```

`-r` preserva os dados: a assinatura é a mesma, então o app atualiza por cima.
Sem cabo: baixe do Release no celular e permita "instalar apps de fontes
desconhecidas". Permissões no aparelho (não deve devolver nada):

```bash
adb shell dumpsys package com.francisN7.lebot | grep -E "RECORD_AUDIO|SYSTEM_ALERT_WINDOW"
```

## Fumaça e medição

1. Cadastrar um livro, trocar o status pela roda (toque longo no chip) e registrar
   leitura.
2. Ajustes → exportar e restaurar um backup (o seletor é o ponto mais sensível
   fora do Expo Go).
3. Medir: `adb shell dumpsys gfxinfo com.francisN7.lebot reset`, usar a Estante
   por ~10 s e repetir sem `reset`; olhe `Janky frames` e o percentil 90/95. Para
   a estante cheia, restaure `lebot-200.zip` (`node scripts/build-200-books.mjs`)
   — **exporte o acervo real antes**.

## Publicar manualmente

Quando o APK já foi medido, publique **esse mesmo arquivo**:

```bash
gh run download <run-id> --name lebot-apk --dir /tmp/lebot-apk
gh release create vX.Y.Z --target main --title "LêBot vX.Y.Z" \
  --notes-file docs/releases/vX.Y.Z.md
gh release upload vX.Y.Z /tmp/lebot-apk/lebot-X.Y.Z.apk
```

A tag criada pela API não dispara build: o asset anexado é exatamente o APK
medido. Para publicar sem medição prévia, use
`gh workflow run release.yml -f tag=vX.Y.Z`, que compila e anexa.

As notas em `docs/releases/vX.Y.Z.md` **começam no texto**, sem `#` — o título do
Release já aparece acima do corpo.

## Subir a versão e limpar

1. `app.config.ts`: `version` e `android.versionCode` (só cresce); `package.json`
   com a mesma `version`.
2. Commit e push; a tag nasce na publicação (`gh release create`, acima) e não
   dispara build.
3. Cada execução deixa um artefato de ~25 MB (30 dias) e caches de Gradle de
   ~1,6 GB por hash do lockfile. Apague os velhos:

```bash
gh api repos/francisN7/LeBot/actions/artifacts --paginate --jq '.artifacts[].id' |
  xargs -I{} gh api -X DELETE "repos/francisN7/LeBot/actions/artifacts/{}"
gh cache list --repo francisN7/LeBot   # apague os hashes velhos com `gh cache delete`
```

## Versões publicadas

| Versão | Data | Build | SHA-256 do APK |
|---|---|---|---|
| `v0.2.0` | 02/11/2026 | local (S12) | `f09271…3671` |
| `v0.2.1` | 04/11/2026 | `2d66d62` | `e44b2c…3ab6` |

O build de referência medido foi `e6738dd` (SHA `1D4AE0…D838`); a tag rebuildou
o asset como `e44b2c…`. A medição do asset atual será refeita.

O SHA-256 é o do `.apk` anexado ao Release. O CI confere assinatura, permissões e
`allowBackup` antes de publicar; desde a S13f a tag não rebuilda o asset.
