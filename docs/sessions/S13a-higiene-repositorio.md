# S13a — Higiene e auditoria do repositório

## Objetivo

Deixar o repositório público apresentável e sem peso morto: nada sensível
versionado, `.gitignore` cobrindo o que é gerado, GitHub configurado e o disco
local sem artefatos regeneráveis — **sem** tocar no acervo real do dono.

## Estado de partida

- Tag de retorno: `pre-s13` (`7da3c88`).
- APK medido na S12b copiado para `C:\Users\francis\Apps\Codes\lebot-artifacts\`
  com SHA-256 `1D4AE065…FEADD838` (conferido em 04/11/2026).
- `backups/` tem 2 backups reais (2,4 MB): **não apagar, não commitar**.

## Fora de escopo

- Mudar código do app, dependências ou versão.
- Publicar o `v0.2.1` (S13e) ou reescrever os docs (S13b/S13c).
- Limpar o histórico do Git: ele tem 3,1 MB e nenhum blob grande.

## Tarefas

1. **Baseline:** `npm run lint && npm run typecheck && npm run test` verdes
   (517 casos). Qualquer falha para a sessão e vira registro em `CURRENT.md`.
2. **Auditoria de repo público:** rodar a skill `public-repo-audit` cobrindo
   segredos no código e no histórico, dados pessoais (seeds, fixtures, docs,
   screenshots), licença, superfície e workflows. Registrar os achados; não
   corrigir o que pertence a outra sessão.
3. **O que já está versionado:** `git ls-files` + `git log --diff-filter=A
   --name-only`; conferir que `backups/`, `.env*`, `*.jks`, `*.keystore`,
   `google-services.json` e `lebot-*.zip` nunca entraram.
4. **Limpeza local (só o que é gerado):** remover `dist/`, `dist-web/`, `tmp/`,
   `.temp/`, `.expo/` e `lebot-200.zip` (regenerável por
   `node scripts/build-200-books.mjs`). Manter `node_modules/` e `backups/`.
5. **`.gitignore`:** trocar `lebot-200.zip` por `lebot-*.zip` (cobre demo e
   medição) e acrescentar `.fleet/`, `.history/`, `*.hprof`, `*.heapsnapshot`,
   `.expo-shared/`, `docs/.obsidian/`. Conferir cada regra com
   `git check-ignore -v <caminho>`.
6. **GitHub:** description, topics (`expo`, `react-native`, `typescript`,
   `sqlite`, `drizzle-orm`, `offline-first`, `books`, `android`, `pt-br`),
   desligar **Issues** e **Wiki** (decisão do dono: projeto pessoal, sem
   contribuição por enquanto). Social preview entra na S13d.
7. **Licença e marca:** confirmar que o `LICENSE` fica MIT puro e que a nota de
   marca (o MIT cobre o desenho, não concede a identidade do LêBot) entra no
   README na S13d. Não reescrever o texto do MIT.
8. Fechar `CURRENT.md` e commitar.

## Aceite

- [ ] Auditoria sem achado crítico; achados menores registrados em `CURRENT.md`.
- [ ] Nenhum arquivo sensível ou gerado versionado; `git status` limpo.
- [ ] `.gitignore` novo validado por `git check-ignore` em cada padrão.
- [ ] `dist/`, `dist-web/`, `tmp/`, `.temp/`, `.expo/` e `lebot-200.zip` fora do disco.
- [ ] `backups/` intacto (2 arquivos) e APK durável com o SHA-256 conferido.
- [ ] GitHub com topics e Issues/Wiki desligados.
- [ ] `lint`, `typecheck` e `test` verdes; commit `S13a: ...`.

## Orçamento de contexto (≤350 linhas)

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `.gitignore`, `SECURITY.md` e
`.github/workflows/ci.yml`. Não abrir `src/`.

## Arquivos prováveis

`.gitignore`, `docs/state/CURRENT.md`, `SECURITY.md`, `.github/workflows/ci.yml`
(só leitura) e, se a auditoria pedir, `LICENSE`.

## Riscos

- **Apagar `backups/`:** perda de dados reais. Só remover o que a tarefa 4 lista.
- **`git clean -fd`:** apaga untracked (fixture, APK local). Revisar com
  `git clean -nd` antes de qualquer execução.
- **Desligar Issues:** fecha o canal público de relato; o `SECURITY.md` continua
  apontando para o Advisory privado, que é o caminho correto.
- **Auditoria achar dado pessoal em doc antigo:** não corrigir aqui; anotar para
  a S13b/S13c, que removem o histórico.

## Próximo depois desta

S13b — mapa e poda dos docs vivos.
