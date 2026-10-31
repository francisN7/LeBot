# LêBot

App mobile pessoal para catalogar livros, organizar a fila de leitura e receber
um plano diário que evita ressaca literária.

> **Status:** em desenvolvimento, sessão S0 (fundação). Ainda não há
> funcionalidade de biblioteca — só o esqueleto do app rodando.

## O que é

- **Estante:** catálogo dos seus livros, com capa, gênero e status.
- **Fila:** ordem de leitura pensada para alternar ritmos e não cansar.
- **Hoje:** plano do dia com poucas páginas por vez e ajuste quando a vida
  acontece.
- **Sem culpa:** livro abandonado é escolha válida, não falha.

O plano é calculado por um motor determinístico e testado. Nada de IA no MVP.

## Stack

- [Expo](https://expo.dev) (SDK 58) + React Native + TypeScript strict
- [Expo Router](https://docs.expo.dev/router/introduction/) (rotas em `src/app/`)
- SQLite + [Drizzle ORM](https://orm.drizzle.team/) (a partir da S2)
- [Biome](https://biomejs.dev/) para lint e formatação
- Jest para testes

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
```

## Estrutura

```
src/app/            rotas (Expo Router), sem lógica de negócio
src/features/       UI, hooks e serviços por feature
src/db/             schema, migrations e repositórios
src/components/ui/  componentes genéricos
src/theme/          tokens de design
src/lib/            utilitários puros
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
| [`docs/roadmap.md`](docs/roadmap.md) | sessões e critérios de aceite |
| [`docs/brand.md`](docs/brand.md) | identidade visual |
| [`docs/architecture.md`](docs/architecture.md) | camadas e fluxo de dados |
| [`docs/INDEX.md`](docs/INDEX.md) | índice completo |

## Licença

[MIT](LICENSE) — código e arte inclusos. A marca e o mascote LêBot são
identidade do projeto; forks devem trocar nome e identidade visual.
