# S13f — Manutenção: CI verde, release só manual e medição em bash

## Objetivo

O CI volta a ficar verde no Node 26, criar uma tag não dispara mais build e a
medição da Estante roda no Linux — **sem mudar o comportamento do app**.

## Fora de escopo

- Subir de SDK (só os patches do SDK 58 que o Expo Doctor pede).
- `npm audit fix --force` ou atualizar dependências fora do que o `--fix` mexe.
- Publicar release, remedir o `v0.2.1` ou tocar no keystore/secrets.
- Code tour e refactors (S14a em diante).

## Tarefas

1. **Expo Doctor:** `npx expo install --fix` (10 pacotes `expo*` e `jest-expo`
   em patch); conferir o diff do `package.json`/lock e rodar a tríade.
2. **Release só manual:** em `.github/workflows/release.yml`, tirar
   `on: push: tags` e o caminho `github.ref_type == 'tag'` do job `publicar`,
   que passa a depender de `workflow_dispatch` com `tag`. Manter a guarda que
   não sobrescreve APK já anexado. Atualizar o cabeçalho do workflow.
3. **Docs do release:** `docs/guide/release.md` (seções **Gerar o APK** e
   **Publicar manualmente**, sem o aviso do rebuild pela tag) e adendo na
   ADR 0026 com a decisão e o porquê (incidente do `v0.2.1`).
4. **Medição em bash:** portar `scripts/measure-gfx.ps1` para
   `scripts/measure-gfx.sh` com os mesmos parâmetros (`label`, `rounds`,
   `flings`, `framestats`) e a mesma saída (`roundN.txt`, `summary.csv`);
   `adb` vem do `PATH`; saída em `${TMPDIR:-/tmp}/lebot-measure/<label>/`.
   Remover o `.ps1` e atualizar `docs/guide/setup.md` (Scripts).
5. **Husky:** `npx husky` para recriar os hooks executáveis; conferir que o
   pre-commit roda.
6. `lint`, `typecheck`, `test`, `docs:check` e `doctor` verdes.

## Aceite

- [ ] `npm run doctor` 20/20 e o job **Expo Doctor** verde no CI.
- [ ] `release.yml` sem gatilho de tag; `workflow_dispatch` com `tag` ainda
      publica e respeita a guarda (conferido pela leitura do workflow; o build
      real fica para a próxima release).
- [ ] `bash scripts/measure-gfx.sh --help` mostra o uso; `shellcheck` limpo, se
      disponível. A medição real só com aparelho conectado.
- [ ] ADR 0026 com adendo; `guide/release.md` e `guide/setup.md` sem PowerShell.
- [ ] commit `S13f: ...`.

## Orçamento de contexto (≤400 linhas)

`AGENTS.md`, `CURRENT.md`, esta spec, `release.yml` (gatilhos e job
`publicar`), as seções citadas de `guide/release.md` e o `measure-gfx.ps1`.

## Arquivos prováveis

`package.json`, `package-lock.json`, `.github/workflows/release.yml`,
`docs/guide/release.md`, `docs/guide/setup.md`, `docs/adr/0026-*.md`,
`scripts/measure-gfx.sh`, `scripts/measure-gfx.ps1` (sai).

## Riscos

- **`--fix` puxar mais que patch:** conferir que só a terceira casa mudou no
  diff; se algo maior vier, parar e perguntar.
- **npm 12 bloqueia install scripts:** se um patch depender de `postinstall`,
  a suíte acusa; rodar `npm run test` duas vezes (a primeira, sem cache, é lenta).
- **Workflow sem teste local:** a mudança é só de gatilho; revisar o YAML com
  atenção e rodar um `workflow_dispatch` sem `tag` se o dono autorizar.
- **Porte divergente:** comparar a saída do `.sh` com o protocolo descrito no
  `.ps1` antes de apagá-lo.

## Próximo depois desta

S14a — code tour, convenções e code report (`docs/sessions/S14a-code-tour.md`).
