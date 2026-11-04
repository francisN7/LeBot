# AGENTS.md — LêBot

App mobile pessoal para catalogar livros, organizar a fila de leitura e gerar um plano diário que evite ressaca literária.

**Stack:** Expo (React Native) + TypeScript + Expo Router + SQLite (Drizzle) + NativeWind.

## Protocolo de contexto (ler antes de agir)

1. No início de cada sessão, leia somente:
   - este arquivo;
   - `docs/state/CURRENT.md`;
   - a spec da sessão atual em `docs/sessions/`.
2. Use `docs/INDEX.md` para localizar um documento específico. Não leia o repositório inteiro.
3. Prefira `grep`/`glob` e leituras parciais. Nunca despeje arquivos grandes no contexto.
4. No fim da sessão, obrigatoriamente:
   - rodar `npm run lint`, `npm run typecheck` e `npm run test`;
   - atualizar `docs/state/CURRENT.md`;
   - marcar a sessão em `docs/roadmap.md`;
   - adicionar uma linha em `CHANGELOG.md`;
   - criar/atualizar um ADR se tomou decisão relevante;
   - escrever a spec da próxima sessão em `docs/sessions/`;
   - commitar com `SXX: resumo curto`.
5. Se o contexto encher no meio da sessão, salve o estado em `CURRENT.md` e recomece em outro chat.

## Estado

- Agora: `docs/state/CURRENT.md`
- Roadmap e critérios de aceite: `docs/roadmap.md`
- Decisões: `docs/adr/`

## Skills

- `session-start` — abrir/encerrar a sessão e carregar o contexto mínimo.
- `project-context-init` — criar ou auditar esta estrutura em outros projetos.

## Estrutura

- `src/app/` — rotas (Expo Router), sem lógica de negócio.
- `src/features/<nome>/` — UI, hooks e serviços da feature; expõe `index.ts`
  (`library`, `genres`, `planner`, `queue`, `reading`, `settings`, `today`).
- `src/features/planner/engine/` — algoritmo puro do plano diário, sem React
  Native, banco ou relógio global (S6).
- `src/db/` — schema, client, migrações, seed e repositórios.
- `drizzle/` — SQL das migrações gerado pelo `drizzle-kit` (não editar à mão).
- `src/components/ui/` — componentes genéricos e arte vetorial.
- `src/theme/` — tokens de design.
- `src/lib/` — utilitários puros.
- `src/test-utils/` — banco `sql.js` e repositórios em memória para testes.
- `scripts/` — geradores de ícone/splash e da tabela de faixas do ISBN.
- `types/` — declarações globais versionadas (`expo/types`, `*.sql`).
- `brand/` — arte-fonte (não vai para o bundle).
- `assets/images/` — ícone, splash e camada adaptativa referenciados no
  `app.config.ts`.
- `docs/` — estado, roadmap, specs, ADRs e documentação de referência.

## Convenções

- Código e identificadores em inglês; UI e documentação em PT-BR.
- Caminhos de arquivo: ASCII, minúsculo, sem espaço ou acento.
- Sem `any`. Validação de borda com Zod.
- Telas não falam SQL: sempre via repositório.
- Lógica de plano é determinística e testada; nada de IA no MVP.
- Arquivos gerados (`src/lib/isbn-ranges.ts`, `drizzle/*.sql` e
  `drizzle/migrations.js`) não são editados à mão.
- Commits pequenos, um por sessão.

## Comandos

```bash
npm run start        # Expo
npm run android      # app no Android
npm run lint         # Biome
npm run lint:fix     # Biome com correção automática
npm run typecheck
npm run test
npm run test:watch
npm run doctor       # expo-doctor
npx expo export --platform android --output-dir dist   # bundle de verificação
gh workflow run release.yml         # APK de release no CI (nunca buildar local)
npx drizzle-kit generate   # nova migração depois de mudar src/db/schema.ts
node scripts/build-icons.mjs        # regera ícone/splash de brand/source/mark.svg
node scripts/build-isbn-ranges.mjs  # regera src/lib/isbn-ranges.ts do XML oficial
```

> Ajustar se os scripts mudarem (revisado na auditoria de documentação).

## Dependências

Sem Dependabot de versão (ADR 0005). Atualizar em sessão de release:

```bash
npx expo install --check   # mostra o que diverge do SDK
npx expo install --fix     # alinha os pacotes Expo/React Native
npm run lint && npm run typecheck && npm run test
```

Patch de segurança chega pelo GitHub (*Dependabot security updates*), não por
`dependabot.yml`.

## Definition of Done

- [ ] lint, typecheck e testes verdes
- [ ] funciona no Android (Expo Go ou dev build)
- [ ] docs afetados atualizados
- [ ] `CURRENT.md`, `roadmap.md` e `CHANGELOG.md` atualizados
- [ ] commit feito e enviado

## Segurança (repo público)

- Nunca commitar `.env`, keystore, `google-services.json`, backups ou dados reais.
- Dados pessoais vivem só no SQLite do aparelho.
- Segredos de build apenas em variáveis do EAS.
- Screenshots e seeds usam dados fictícios.
