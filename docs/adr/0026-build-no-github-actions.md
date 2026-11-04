# ADR 0026 — Build no GitHub Actions, keystore em secrets e pacote mínimo

- **Status:** aceito
- **Data:** 2026-11-03
- **Sessão:** S12a
- **Relacionada:** substitui o item 1 e a consequência "publicar é manual" da
  ADR 0025; mantém a assinatura por config plugin e o GitHub Releases como
  canal interno

## Contexto

A ADR 0025 levou o build para o WSL2 porque o C++ de Reanimated estoura o limite
de caminho do Windows. O v0.2.0 provou que funciona, mas o custo apareceu:

1. **Disco:** WSL (13,7 GB de disco virtual), `node_modules` com artefatos C++
   (5,7 GB), cache do Gradle, NDK e JDK somavam ~20 GB na máquina do dono.
2. **Memória:** 4 GB para o WSL, com swap, não davam margem. Qualquer processo a
   mais (navegador, editor, antivírus) podia derrubar o build no meio — e
   derrubou.
3. **Tempo:** ~11 min por build com cache, mais `prebuild` e cópia do APK.
4. **Reprodutibilidade:** o toolchain vivia só naquela máquina; a assinatura
   dependia de um `release.properties` local.

O repositório é público e já tinha os secrets do GitHub disponíveis para o
workflow de CI.

## Decisão

### 1. O build de release só existe no GitHub Actions

`.github/workflows/release.yml` compila em `ubuntu-latest` com JDK 17, Node 22 e
SDK/NDK/CMake nas versões do projeto. Dispara de duas formas:

- **tag `v*`** → compila, confere e anexa ao Release (cria o Release se a tag
  ainda não tiver um);
- **`workflow_dispatch`** → compila e publica o APK como artefato por 30 dias.

A máquina do dono fica só com `adb` (`platform-tools`) para instalar e medir.
Não há JDK, Gradle, NDK nem WSL.

O runner tem ~14 GB livres; o workflow apaga o SDK Android pré-instalado e
toolchains não usados antes de instalar as versões exatas, e cacheia Gradle e
npm. Build sem cache leva ~40 min; com cache, ~15 min.

### 2. Keystore em secrets, conferido por impressão digital

Três secrets: `KEYSTORE_BASE64`, `STORE_PASSWORD` e `KEY_PASSWORD`. O job
reconstrói `~/.lebot/release.properties` no runner antes do `prebuild`, com
`::add-mask::` em todos os valores, e falha se algum estiver vazio.

A assinatura não fica só na confiança: o workflow roda `apksigner
verify --print-certs` e compara o SHA-256 com a impressão pública do certificado
(`43:59:2A:…:50:02:BD`). Divergência reprova o build antes de publicar. Também
confere que o `build.gradle` gerado usa `signingConfigs.release` — o template do
Expo assina release com debug.

### 3. Pacote mínimo

`app.config.ts` passa a bloquear `RECORD_AUDIO` e `SYSTEM_ALERT_WINDOW`
(herdados de bibliotecas) e a desligar `android.allowBackup`. O workflow valida
o APK final com `aapt2 dump permissions` e `aapt2 dump xmltree`: permissão
indesejada ou `allowBackup` ausente/ligado reprovam o build.

## Consequências

- Cada build ou medição custa um run de CI e o download do APK. A S12b
  (performance da Estante) passa a usar `workflow_dispatch` como fonte de APK.
- Sem build local, não há como testar uma alteração nativa sem publicar um run —
  aceitável porque o app não tem código nativo próprio.
- O keystore continua insubstituível: perdê-lo impede atualizar quem já instalou.
  A cópia no gerenciador de senhas e no secret são as duas únicas cópias.
- O `versionCode` segue crescendo a cada release e é definido no `app.config.ts`;
  a tag não substitui essa regra.
- A máquina do dono recupera ~22,6 GB. `docs/release.md` foi reescrito para o
  caminho CI; o WSL deixou de ser pré-requisito e foi removido.
- Instalar o APK do CI no aparelho e trocar o asset do `v0.2.0` foram **adiados
  para a S12b** por decisão do dono: o release segue com o build da S12 até a
  medição de performance fechar.
