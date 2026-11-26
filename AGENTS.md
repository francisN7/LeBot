# AGENTS.md — LêBot

App mobile pessoal para catalogar livros, organizar a fila de leitura e gerar um
plano diário que evite ressaca literária.

**Stack:** Expo (React Native) + TypeScript + Expo Router + SQLite (Drizzle) +
NativeWind.

## Protocolo de contexto

1. Abertura (skill `session-start`): leia **só** este arquivo,
   `docs/state/CURRENT.md` e a spec em `docs/sessions/`.
2. Outro assunto: ache a **seção** em `docs/README.md` e leia só ela. Nunca
   despeje arquivo grande no contexto; prefira `grep`/`glob` e leituras parciais.
3. Docs 👤 (`README`, `CHANGELOG`, `docs/releases/`) são para humanos: não
   carregue por iniciativa (matriz em `docs/README.md`).
4. Fim da sessão (skill `session-start`, encerramento):
   - rodar lint, typecheck, testes e docs (tabela abaixo);
   - atualizar `CURRENT.md`; marcar a sessão em `docs/roadmap/main.md` com
     entrega e aceite; tirar a spec concluída (`git rm`);
   - `CHANGELOG.md`: só mudança visível ao usuário, em `Unreleased`;
   - criar/atualizar um ADR se a decisão for relevante;
   - escrever a spec da próxima sessão;
   - commitar com `SNN: resumo curto`, numeração conforme
     `docs/roadmap/README.md` (push só com OK do dono).
5. Contexto cheio no meio da sessão: salve o estado em `CURRENT.md` e recomece.
6. Revisão profunda de todos os `.md` é a skill `docs-review`: só sob pedido
   explícito. Criar ou migrar a estrutura é a `project-context-init`.

Estado: `docs/state/CURRENT.md` · futuro: `docs/roadmap/main.md` · decisões:
`docs/adr/` · mapa: `docs/README.md`.

## Entrega final

Toda resposta que conclui trabalho termina com um selo: **Sessão fechada**
(encerramento aplicado), **Sessão aberta** (peça "encerrar sessão") ou **Sem
sessão** (ajuste que não mexe em `CURRENT` nem no roadmap). Nunca esconder
validação vermelha atrás do selo.

## Estrutura

- `src/app/` — rotas (Expo Router), sem lógica de negócio.
- `src/features/<nome>/` — UI, hooks e serviços; expõe `index.ts`
  (`library`, `genres`, `planner`, `queue`, `reading`, `reviews`, `settings`,
  `stats`, `today`). O motor puro do plano vive em `planner/engine/`.
- `src/db/` — schema, client, migrações, seed e repositórios.
- `src/components/ui/` — componentes e arte vetorial; `src/theme/` — tokens;
  `src/lib/` — utilitários puros; `src/test-utils/` — banco e repositórios fake.
- `docs/` — `guide/` (como fazer), `reference/` (como é), `adr/` (por quê),
  `sessions/` (escopo atual), `state/` e `roadmap/`.
- `drizzle/` — SQL gerado (não editar); `scripts/` — geradores e medição;
  `brand/` — arte-fonte; `assets/images/` — ícone, splash e camada adaptativa.

## Convenções

- Código e identificadores em inglês; UI e documentação em PT-BR. Caminhos ASCII.
- Sem `any`. Validação de borda com Zod.
- Telas não falam SQL: sempre via repositório.
- Lógica do plano é determinística e testada; nada de IA no MVP.
- Arquivos gerados não são editados à mão: `src/lib/isbn-ranges.ts`,
  `drizzle/*.sql` e `drizzle/migrations.js`.
- Commits pequenos, um por sessão.

## Comandos

| Ação | Comando |
|---|---|
| dev | `npm start` |
| lint | `npm run lint` |
| typecheck | `npm run typecheck` |
| test | `npm run test` |
| docs | `npm run docs:check` |
| doctor | `npm run doctor` |
| build | `gh workflow run release.yml` (o APK nunca é gerado na máquina local) |

Requer Node 26 (`.nvmrc`) e `npm ci`. Lista completa em
[`docs/guide/setup.md`](docs/guide/setup.md).

## Dependências

Sem Dependabot de versão (ADR 0005); patch de segurança chega pelo *Dependabot
security updates*. Em sessão de release: `npx expo install --check`,
`npx expo install --fix` e a tríade de validação.

## Definition of Done

- [ ] lint, typecheck, testes e docs verdes
- [ ] funciona no Android (Expo Go ou APK)
- [ ] docs afetados atualizados
- [ ] `CURRENT.md` e roadmap atualizados; `CHANGELOG.md` se houve mudança visível
- [ ] commit feito (push só com OK do dono)

## Segurança (repo público)

- Nunca commitar `.env`, keystore, `google-services.json`, backups ou dados reais.
- Dados pessoais vivem só no SQLite do aparelho; segredos de build, só nos
  Secrets do GitHub.
- Screenshots e seeds usam dados fictícios.
