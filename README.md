# LêBot

App mobile pessoal para catalogar livros, organizar a fila de leitura e receber
um plano diário que evita ressaca literária.

> **Status:** em desenvolvimento. S0, S1 e S2 concluídas: o app abre com as 4
> abas, dados no SQLite do aparelho, migrações no boot e seed de exemplo.
> Cadastro, busca e edição de livro chegam na S3.

## O que é

- **Estante:** catálogo dos seus livros, com capa, gênero e status.
- **Fila:** ordem de leitura pensada para alternar ritmos e não cansar.
- **Hoje:** plano do dia com poucas páginas por vez e ajuste quando a vida
  acontece.
- **Sem culpa:** livro abandonado é escolha válida, não falha.

O plano é calculado por um motor determinístico e testado (a partir da S6).
Nada de IA no MVP.

## Stack

- [Expo](https://expo.dev) (SDK 58) + React Native + TypeScript strict
- [Expo Router](https://docs.expo.dev/router/introduction/) (rotas em `src/app/`)
- SQLite + [Drizzle ORM](https://orm.drizzle.team/) no aparelho, com migrações
  versionadas
- [Zod](https://zod.dev/) para validar a borda dos dados
- [Biome](https://biomejs.dev/) para lint e formatação
- Jest + Testing Library para testes

## Como rodar

Requisitos: Node 22 LTS ou superior, npm e o app **Expo Go** no celular.

```bash
npm install
npm start
```

Leia o QR code com o Expo Go (Android). Para mirar um emulador já aberto:

```bash
npm run android
```

Outros comandos:

```bash
npm run lint        # Biome
npm run typecheck   # tsc --noEmit
npm run test        # Jest
npm run doctor      # expo-doctor
npx drizzle-kit generate   # migração depois de mudar src/db/schema.ts
```

## Estrutura

```
src/app/            rotas (Expo Router), sem lógica de negócio
src/features/       UI, hooks e serviços por feature
src/db/             schema, client, seed e repositórios
src/components/ui/  componentes genéricos
src/theme/          tokens de design
src/lib/            utilitários puros
drizzle/            migrações SQL geradas (não editar à mão)
types/              declarações globais versionadas
brand/              arte-fonte (fora do bundle)
assets/             ícone e splash
```

## Privacidade

Seus dados ficam **só no aparelho**, no SQLite local. Não há conta, telemetria
nem servidor. O plano de leitura é calculado offline.

Detalhes em [`docs/security-privacy.md`](docs/security-privacy.md).

## Documentação

| Documento | Para quê |
|---|---|
| [`AGENTS.md`](AGENTS.md) | regras de contribuição e protocolo de contexto |
| [`docs/state/CURRENT.md`](docs/state/CURRENT.md) | onde paramos e o próximo passo |
| [`docs/roadmap.md`](docs/roadmap.md) | sessões e critérios de aceite |
| [`docs/brand.md`](docs/brand.md) | identidade visual |
| [`docs/architecture.md`](docs/architecture.md) | camadas e fluxo de dados |
| [`docs/data-model.md`](docs/data-model.md) | tabelas, migrações e seed |
| [`docs/testing.md`](docs/testing.md) | como testar |
| [`docs/INDEX.md`](docs/INDEX.md) | índice completo |

## Licença

[MIT](LICENSE) — código e arte inclusos. A marca e o mascote LêBot são
identidade do projeto; forks devem trocar nome e identidade visual.
