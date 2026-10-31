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
- `src/features/<nome>/` — UI, hooks e serviços da feature; expõe `index.ts`.
- `src/db/` — schema, migrations e repositórios.
- `src/components/ui/` — componentes genéricos.
- `src/theme/` — tokens de design.
- `src/lib/` — utilitários puros.
- `src/features/planner/engine/` — algoritmo puro, sem React Native.
- `brand/` — arte-fonte (não vai para o bundle).
- `assets/` — ícone/splash referenciados no `app.config.ts`.
- `src/assets/` — imagens importadas pelos componentes.

## Convenções

- Código e identificadores em inglês; UI e documentação em PT-BR.
- Caminhos de arquivo: ASCII, minúsculo, sem espaço ou acento.
- Sem `any`. Validação de borda com Zod.
- Telas não falam SQL: sempre via repositório.
- Lógica de plano é determinística e testada; nada de IA no MVP.
- Commits pequenos, um por sessão.

## Comandos

```bash
npm run start        # Expo
npm run android      # app no Android
npm run lint         # Biome
npm run typecheck
npm run test
npm run doctor       # expo-doctor
```

> Ajustar se os scripts mudarem (revisado na S0).

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
