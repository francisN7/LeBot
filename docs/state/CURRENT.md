# Estado atual

## Sessão

- **Última concluída:** S12a — build no GitHub Actions e limpeza do PC
  (2026-11-03).
- **Próxima:** S12b — otimização da estante, medida com o APK do CI.
  Spec em `docs/sessions/S12b-otimizacao-estante.md` (já ajustada).

## Entrega da S12a

- `.github/workflows/release.yml`: tag `v*` publica no Release;
  `workflow_dispatch` gera artefato. JDK 17, Node 22, SDK/NDK/CMake fixos,
  cache de npm e Gradle, ~15 GB liberados no runner.
- Build validado no run `41755444978` (17 min, ~13 min compilando; artefato de
  54 MB). `apksigner` conferiu o SHA-256, `aapt2` não achou `RECORD_AUDIO` nem
  `SYSTEM_ALERT_WINDOW` e `apkanalyzer` confirmou `allowBackup="false"`.
- `app.config.ts`: `blockedPermissions` das duas permissões e
  `allowBackup: false`.
- Keystore em secrets (`KEYSTORE_BASE64`, `STORE_PASSWORD`, `KEY_PASSWORD`),
  mascarados no log. Impressão do certificado documentada em `docs/release.md`.
- Patches do Expo alinhados (58.0.23 etc.) para o Doctor passar; CI verde nos
  3 jobs.
- `docs/release.md` reescrito para o caminho CI; ADR 0026 criada.

## Limpeza do PC (feita)

- Removidos: distro WSL e `ext4.vhdx` (13,68 GB), runtime do WSL (1,14 GB),
  JDK 17 (0,30 GB), `.gradle` (0,85 GB), `.wslconfig`, `C:\nm`.
- `node_modules` sem artefatos C++: 5,73 GB → 0,86 GB. Total ~22,6 GB.
- Mantidos: `C:\Users\francis\android-sdk` (adb) e `~/.lebot` (keystore).
- Windows reiniciado: WSL e VirtualMachinePlatform desabilitadas, sem distro,
  sem `ext4.vhdx`, sem `wsl.exe` funcional. Entrada "Linux" do Explorer
  (`HKLM\...\Desktop\NameSpace\{B2B4A4D1-…}`) removida — é chave de máquina que
  o Windows não limpa sozinho.

## Adiado por decisão do dono

- **Não instalar no aparelho e não publicar agora.** O asset do `v0.2.0`
  continua o da S12. Instalar o APK do CI por cima e, se a S12b compensar,
  trocar o asset ficam para a S12b.

## Próximo passo (S12b)

1. Gerar `lebot-200.zip` em UTF-8 com `scripts/build-200-books.mjs` (o fixture
   da S11 tem `Breve RelÃ³gio`).
2. Instalar o APK do CI por cima do 0.2.0 (`adb install -r`) e confirmar dados
   intactos — é o aceite pendente da S12a.
3. Medir a linha de base com 200 livros; animar só os cards visíveis
   (`onViewableItemsChanged`/`viewabilityConfig` estáveis) e pausar os loops na
   rolagem (`onScrollBeginDrag` → `onMomentumScrollEnd`), sem tirar a animação.
4. Build de medição via `gh workflow run release.yml` (~17 min) e comparar com
   `dumpsys gfxinfo` (protocolo na spec). ≤ 5% janky é a referência.
5. Publicar só se compensar (`gh release upload v0.2.0 ... --clobber`) e fechar
   docs.

## Armadilhas

- **Build local não existe mais**: sem JDK, Gradle ou NDK na máquina. Não rodar
  `prebuild` para "testar" — ele reescreve `npm run android` para
  `expo run:android` (reverter e apagar `android/`).
- O hook local (`lint-staged`) só cobre `*.ts/tsx/js/json`: YAML e Markdown só
  são verificados pelo CI. Rodar `npm run lint` antes de push.
- `expo-doctor` quebra sozinho quando o Expo publica patch; `npx expo install
  --fix` resolve.
- Assinatura: conferir o SHA-256, nunca só a existência do APK. Keystore perdido
  impede atualizar quem já instalou.
- Sem `android/` no repo e sem `dist/` commitado.

## Arquivos-chave

- `.github/workflows/release.yml`, `app.config.ts`,
  `plugins/with-release-signing.js`
- `docs/release.md`, `docs/adr/0026-build-no-github-actions.md`
- `docs/sessions/S12a-ci-github-e-estante-cheia.md`,
  `docs/sessions/S12b-otimizacao-estante.md`

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
gh workflow run release.yml   # APK de release (CI)
```
