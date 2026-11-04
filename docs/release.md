# Release interno

Como transformar o código em um **APK assinado**, instalar no Android e publicar
no GitHub Releases. Vale para o canal interno: Play Store continua fora de
escopo (ADR 0025).

O build roda **no GitHub Actions**, não na máquina do dono (ADR 0026): o C++ de
Reanimated/Worklets não cabe em 4 GB de RAM com margem e ocupava ~20 GB de disco
entre WSL, Gradle e `node_modules`. O runner tem 4 núcleos, 16 GB e libera o
espaço do SDK pré-instalado antes de compilar.

Não há EAS: o keystore e as senhas ficam só no backup do dono e nos secrets do
repositório.

## O que a máquina precisa ter

- **`adb`** (Android SDK enxuto em `C:\Users\<você>\android-sdk`, só
  `platform-tools`) — instalar e medir no aparelho.
- **`gh`** autenticado (`winget install GitHub.cli`, `gh auth login`).
- Node 22+ para lint, tipos e testes.
- **Nada de JDK, Gradle, NDK ou WSL.** Se aparecer um `android/` na raiz, ele é
  resto de `prebuild` e deve ser apagado — o build nunca é local.

## Secrets do repositório

Três secrets alimentam a assinatura (`Settings → Secrets and variables →
Actions`), todos criados por `gh secret set` lendo de arquivo, **nunca** com
`echo` do valor:

| Secret | Conteúdo |
|---|---|
| `KEYSTORE_BASE64` | keystore em base64 (`base64 -w0`) |
| `STORE_PASSWORD` | senha do keystore |
| `KEY_PASSWORD` | senha da chave `lebot` |

O workflow mascara os três com `::add-mask::` antes de qualquer uso e falha se
algum estiver vazio.

## Assinatura

O keystore **nunca** entra no Git, no bundle ou no Release:

| Arquivo | Onde | Backup |
|---|---|---|
| keystore | `~/.lebot/lebot-release.keystore` (fora do repo) | gerenciador de senhas (anexo) |
| senhas | `~/.lebot/release.properties` | gerenciador de senhas (texto) |
| cópia no CI | secret `KEYSTORE_BASE64` | secreto do GitHub |

Alias `lebot`, RSA 4096, validade 10.000 dias. Impressão SHA-256 do certificado
(é informação pública; o workflow compara com ela e **reprova** o build se não
bater):

```text
43:59:2A:0D:F3:BD:69:21:BD:58:DB:C5:EE:C3:BB:7C:BC:C8:6E:93:71:F1:AA:93:37:D6:97:B9:E7:50:02:BD
```

O `/android` é gerado no runner e ignorado pelo Git, então a assinatura só
sobrevive ao `prebuild` por causa do `plugins/with-release-signing.js`: ele
injeta `signingConfigs.release` no `android/app/build.gradle` e faz o release
usar essa config em vez da chave de debug. O Gradle lê
`~/.lebot/release.properties` em tempo de build — nenhum segredo é escrito em
`android/`. O workflow reconstrói esse arquivo a partir dos secrets e confere
que o `build.gradle` ficou com `signingConfigs.release` antes de compilar.

**Perder o keystore = não conseguir atualizar o app instalado.** Quem já tem o
APK antigo precisa desinstalar para aceitar um APK com outra assinatura.

## Gerar o APK

Dois caminhos, ambos pelo Actions (`.github/workflows/release.yml`):

- **Tag `v*`** → compila, confere e anexa ao Release, sem intervenção manual.
- **`workflow_dispatch`** → compila e deixa o APK como artefato por 30 dias
  (bom para testar sem publicar). Campo `tag` opcional publica no Release
  informado.

```powershell
# só compilar e baixar o artefato
gh workflow run release.yml
gh run watch
gh run download --name lebot-apk

# release de verdade
git tag v0.3.0
git push origin v0.3.0
```

O job compila só `arm64-v8a`/`armeabi-v7a` (cobre praticamente todo Android e
corta metade do tempo). Saída:
`android/app/build/outputs/apk/release/app-release.apk`.

## Conferir o APK

O workflow já faz, e reprova o build se algo divergir:

1. `apksigner verify --print-certs` e comparação do SHA-256 com o do keystore.
2. `aapt2 dump permissions` garantindo que `RECORD_AUDIO` e
   `SYSTEM_ALERT_WINDOW` não estão no APK.
3. `aapt2 dump xmltree` garantindo `android:allowBackup="false"` explícito.

Se aparecer `CN=Android Debug`, o `release.properties` não foi lido —
**não publique**.

## Instalar e conferir

```powershell
gh release download v0.3.0 --pattern "lebot-*.apk" --dir $env:TEMP
adb install -r (Get-ChildItem $env:TEMP\lebot-*.apk | Select-Object -Last 1).FullName
adb shell am start -n com.francisN7.lebot/.MainActivity
```

`-r` preserva os dados: a assinatura é a mesma, então o app atualiza por cima.
Sem cabo: baixar o APK do Release no celular e permitir "instalar apps de fontes
desconhecidas" para o navegador.

No launcher: nome **LêBot**, ícone adaptativo (fundo creme/pink, foreground sem
corte e monocromático) e splash. O `applicationId` é `com.francisN7.lebot`.

Conferir permissões no aparelho:

```powershell
adb shell dumpsys package com.francisN7.lebot | Select-String "RECORD_AUDIO|SYSTEM_ALERT_WINDOW"
```

O comando não deve devolver nada.

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

Olhar `Janky frames` (quanto menor, melhor) e o percentil 90/95. Para a estante
cheia, restaurar a fixture de 200 livros: `node scripts/build-200-books.mjs`
gera `lebot-200.zip` (UTF-8, sem capas, acentos corretos), que se restaura pelo
próprio Ajustes → Backup. **Exporte o acervo real antes** — restaurar troca o
banco inteiro. Cada medição custa um build de CI: use `workflow_dispatch` e baixe
o artefato.

## Publicar manualmente

O caminho normal é a tag. Quando o APK já foi medido no aparelho, publique
**esse mesmo arquivo** em vez de compilar de novo (S12b):

```powershell
# 1. o artefato do workflow_dispatch vira o APK do Release
gh run download <run-id> --name lebot-apk --dir $env:TEMP
# 2. cria a tag e o Release com as notas do projeto (sem H1 no corpo)
gh release create vX.Y.Z --target main --title "LêBot vX.Y.Z" `
  --notes-file docs/release-notes-vX.Y.Z.md
# 3. anexa exatamente o APK que passou no aparelho
gh release upload vX.Y.Z "$env:TEMP\lebot-apk\lebot-X.Y.Z.apk"
```

A tag criada pela API não dispara o `on: push: tags`, então não há um segundo
build de 15 min e o asset publicado é o mesmo que foi medido.

Notas ficam em `docs/release-notes-vX.Y.Z.md` e **começam no texto**, sem `#`:
o título do Release já aparece acima do corpo (no 0.2.0 ele saiu duas vezes).
Tag nova sem Release é criada pelo workflow com notas automáticas; edite depois
se quiser o texto do projeto.

## Subir a versão

1. `app.config.ts`: `version` (visível ao usuário) e `android.versionCode`
   (inteiro que **só cresce**; a Play Store recusa repetido).
2. `package.json`: `version` igual, para o projeto não divergir.
3. Commit, `git tag vX.Y.Z` e `git push origin vX.Y.Z`. O `versionCode` entra no
   APK pelo `prebuild` no runner.

## Limpeza de artefatos e caches

Cada `workflow_dispatch` deixa um `lebot-apk` (~25 MB, 30 dias) e um
`apk-verificacao` (~5 KB, 7 dias); o CI também sobe um `gitleaks-results.sarif`
por execução (~7 KB). O cache de Gradle é o que pesa: **~1,6 GB por hash de
`package-lock.json`** (Gradle ~1,34 GB + npm ~0,29 GB), e o limite do repositório
é **10 GB** (o mais antigo é descartado sozinho quando estoura, o que derruba a
velocidade do build).

```powershell
# ver o que existe
gh api repos/francisN7/LeBot/actions/artifacts --paginate |
  ConvertFrom-Json | Select-Object -ExpandProperty artifacts |
  Select-Object name,size_in_bytes,created_at
gh api repos/francisN7/LeBot/actions/caches | ConvertFrom-Json |
  Select-Object -ExpandProperty actions_caches | Select-Object key,size_in_bytes

# apagar tudo que é de execuções antigas (guardar o artefato que vai ser medido)
gh api repos/francisN7/LeBot/actions/artifacts --paginate |
  ConvertFrom-Json | ForEach-Object { $_.artifacts.id } |
  ForEach-Object { gh api -X DELETE "repos/francisN7/LeBot/actions/artifacts/$_" }

# apagar caches de hashes antigos do lockfile (manter o atual)
gh cache list --repo francisN7/LeBot
gh cache delete <id> --repo francisN7/LeBot
```

Feito na S12b: 82 artefatos removidos (71,7 MB) e caches de 5,36 GB → 1,59 GB.

## O que nunca entra no Git

- `android/`, `ios/` e `dist/` (gerados)
- `*.apk`, `*.aab`
- `*.keystore`, `*.jks`, `release.properties`
- backups do app, bancos SQLite, `.env`
- a pasta de saída de exportação de capas/backups
