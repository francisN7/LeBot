# AGENTS.md — LêBot

App mobile pessoal para catalogar livros, organizar a fila de leitura e gerar um
plano diário que evite ressaca literária.

**Stack:** Expo (React Native) + TypeScript + Expo Router + SQLite (Drizzle) +
NativeWind.

## Protocolo de contexto

1. No início da sessão, leia **só**: este arquivo, `docs/state/CURRENT.md` e a
   spec da sessão em `docs/sessions/`.
2. Para qualquer outro assunto, ache a **seção** em `docs/README.md` e leia só
   ela. Nunca despeje um arquivo grande no contexto.
3. Prefira `grep`/`glob` e leituras parciais (`offset`/`limit`).
4. No fim da sessão, obrigatoriamente:
   - rodar `npm run lint`, `npm run typecheck`, `npm run test` e
     `npm run docs:check`;
   - atualizar `CURRENT.md`, marcar a sessão no roadmap e escrever uma linha no
     `CHANGELOG.md`;
   - criar/atualizar um ADR se a decisão for relevante;
   - escrever a spec da próxima sessão;
   - commitar com `SXX: resumo curto`.
5. Se o contexto encher no meio, salve o estado em `CURRENT.md` e recomece.

Estado: `docs/state/CURRENT.md` · futuro: `docs/roadmap.md` · decisões:
`docs/adr/`.

Skills: `session-start` (abrir/encerrar), `project-context-init` (criar a
estrutura) e `public-repo-audit` (segredos, dados e licença).

## Estrutura

- `src/app/` — rotas (Expo Router), sem lógica de negócio.
- `src/features/<nome>/` — UI, hooks e serviços; expõe `index.ts`
  (`library`, `genres`, `planner`, `queue`, `reading`, `reviews`, `settings`,
  `stats`, `today`). O motor puro do plano vive em `planner/engine/`.
- `src/db/` — schema, client, migrações, seed e repositórios.
- `src/components/ui/` — componentes e arte vetorial; `src/theme/` — tokens;
  `src/lib/` — utilitários puros; `src/test-utils/` — banco e repositórios fake.
- `docs/` — `guide/` (como fazer), `reference/` (como é), `adr/` (por quê),
  `sessions/` (escopo atual), `state/` e `roadmap.md`.
- `drizzle/` — SQL gerado (não editar); `scripts/` — geradores e medição;
  `brand/` — arte-fonte; `assets/images/` — ícone, splash e camada adaptativa.

## Convenções

- Código e identificadores em inglês; UI e documentação em PT-BR. Caminhos ASCII.
- Sem `any`. Validação de borda com Zod.
- Telas não falam SQL: sempre via repositório.
- Lógica do plano é determinística e testada; nada de IA no MVP.
- Arquivos gerados (`src/lib/isbn-ranges.ts`, `drizzle/*.sql`,
  `drizzle/migrations.js`) não são editados à mão.
- Commits pequenos, um por sessão.

## Comandos

Sessão: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run
docs:check` e `npm run doctor`.

Build: `gh workflow run release.yml` (o APK nunca é gerado na máquina local).
A lista completa de scripts está em [`docs/guide/setup.md`](docs/guide/setup.md).

## Dependências

Sem Dependabot de versão (ADR 0005); patch de segurança chega pelo *Dependabot
security updates*. Em sessão de release: `npx expo install --check`,
`npx expo install --fix` e a tríade de validação.

## Definition of Done

- [ ] lint, typecheck, testes e `docs:check` verdes
- [ ] funciona no Android (Expo Go ou APK)
- [ ] docs afetados atualizados
- [ ] `CURRENT.md`, `roadmap.md` e `CHANGELOG.md` atualizados
- [ ] commit feito e enviado

## Segurança (repo público)

- Nunca commitar `.env`, keystore, `google-services.json`, backups ou dados reais.
- Dados pessoais vivem só no SQLite do aparelho; segredos de build, só nos
  Secrets do GitHub.
- Screenshots e seeds usam dados fictícios.
