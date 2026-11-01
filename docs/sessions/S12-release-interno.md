# S12 — Release interno

## Objetivo

Gerar um **APK instalável** do LêBot, instalar no Android fora do Expo Go e
conferir ícone, splash e camada adaptativa no launcher — com o processo
documentado em `docs/release.md`.

> Pré-requisito: S11a (lombada/capa), S11b (tassel animado) e S11c (Estante
> fluida) concluídas.

## Fora de escopo

- Publicação na Play Store, ficha da loja, screenshots e política de privacidade
  pública.
- iOS.
- Trocar a versão do SDK ou atualizar dependências.
- Commitar keystore, `android/` ou o APK; segredos vivem só em variáveis do EAS
  ou no aparelho de build.

## Tarefas

1. **Escolher o caminho de build** com o dono antes de codar:
   - **local:** `npx expo prebuild --platform android` + Gradle, com um keystore
     de release fora do repositório; ou
   - **EAS:** `eas.json` com o perfil `preview`/`internal` e credenciais no EAS.
   Registrar a escolha numa ADR curta (0025) se ela não for óbvia.
2. **Buildar o APK** e instalar com `adb install -r <arquivo>.apk` num aparelho
   ou emulador Android. Conferir que o app abre com o banco real (SQLite) e não
   só no Expo Go.
3. **Conferir identidade no launcher:** nome "LêBot", ícone adaptativo (fundo
   creme/pink, foreground sem corte e monocromático), splash e `package`
   `com.francis.lebot`. Se algo estiver errado, ajustar `app.config.ts` e regerar
   com `node scripts/build-icons.mjs` antes de repetir o build.
4. **Fumaça no build de release:** abrir, cadastrar um livro, trocar status,
   registrar leitura, abrir Ajustes, exportar um backup e restaurá-lo. O seletor
   de pasta/arquivo do `expo-file-system` é o ponto mais sensível no release.
5. **Medir a Estante no release** com 5 livros e com a estante cheia (duplicar o
   seed no aparelho): UI/JS a 60 fps ou sem queda perceptível, com tassel,
   brilho e piscada. É o aceite que ficou pendente da S11c; registrar UI/JS em
   `CURRENT.md` antes e depois.
6. **Documentar `docs/release.md`:** pré-requisitos, comandos do build escolhido,
   onde ficam as credenciais, como instalar, como subir a versão
   (`version`/`versionCode`) e o que **nunca** entra no Git.
7. **Fechar a sessão:** `CURRENT.md`, `roadmap.md`, `CHANGELOG.md`, ADR (se
   houver decisão de assinatura/build) e spec da S13.

## Aceite

- [ ] APK instala e abre no Android sem Expo Go.
- [ ] Ícone (adaptativo e monocromático), splash e nome conferidos no launcher.
- [ ] Um ciclo exportar → restaurar backup funciona no build de release.
- [ ] Estante a 60 fps (ou sem queda perceptível) no release, com 5 livros e com
      a estante cheia, e os números registrados.
- [ ] `docs/release.md` permite repetir o build do zero.
- [ ] lint, typecheck, test, doctor e `expo export` verdes; nada de keystore,
      `android/` ou APK no Git.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, `app.config.ts`, `docs/design/assets-3d.md`
(seção de ícone/splash), `docs/security-privacy.md`, `scripts/build-icons.mjs`,
`.gitignore` e `assets/images/`.

## Arquivos prováveis

- `app.config.ts`, `eas.json` (se EAS), `docs/release.md`, ADR 0025
- `assets/images/` (só se a conferência no launcher pedir ajuste)

## Riscos

- **Assinatura:** APK de debug não serve para distribuir; keystore perdido impede
  atualizações futuras. Nunca commitar `.jks`/senhas.
- **`prebuild` mexe em `android/`:** a pasta é ignorada, mas rode em branch limpa
  e confira `git status` antes de commitar.
- **Ícone adaptativo:** o launcher recorta; conferir foreground a 80% e
  monocromático, não só o PNG no repositório.
- **Módulo nativo:** SQLite e seletores de arquivo só provam o release no
  aparelho; o Expo Go não cobre assinatura nem permissões.
- **Tamanho do bundle:** conferir se ícone/splash não inflaram o APK além do
  esperado.

## Próximo depois desta

**S13** — documentação final e limpeza, com o backlog reordenado pelo dono.
