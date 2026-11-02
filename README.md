# LêBot

App mobile pessoal para catalogar livros, organizar a ordem de leitura e receber
um plano diário que evita ressaca literária.

> **Para a minha amada esposa.** O LêBot nasceu de uma ideia sua: uma estante
> que respeita o ritmo de quem lê, uma ordem que não pesa e um plano diário que
> evita a ressaca literária. Você idealizou tudo isso; eu só escrevi o código.
> Este app é, antes de tudo, para você — e para quem mais quiser ler sem culpa.

> **Status:** v0.2.0 — primeiro APK instalável (release interno). Estante com
> gêneros e capas, plano diário, Ordem, resenha, estatísticas e backup manual em
> `.zip`. Publicação na Play Store e iOS ainda fora de escopo.

## O que é

- **Estante:** catálogo dos seus livros, com capa, gênero e status.
- **Hoje:** plano do dia com poucas páginas por vez, registro da leitura e o
  que já foi lido hoje.
- **Ordem:** a sequência é sua: o que ler depois do livro atual, sem registrar
  leitura aqui.
- **Sem culpa:** livro abandonado é escolha válida, não falha.

O plano é calculado por um motor determinístico e testado (S6) e exibido na tela
Hoje desde a S7. Nada de IA no MVP.

## Stack

- [Expo](https://expo.dev) (SDK 58) + React Native + TypeScript strict
- [Expo Router](https://docs.expo.dev/router/introduction/) (rotas em `src/app/`)
- SQLite + [Drizzle ORM](https://orm.drizzle.team/) no aparelho, com migrações
  versionadas
- [NativeWind](https://www.nativewind.dev/) 4 + Tailwind CSS 3, com tokens em
  `src/theme/`
- [Zod](https://zod.dev/) para validar a borda dos dados
- [Reanimated](https://docs.swmansion.com/react-native-reanimated/) e
  `react-native-svg` para movimento e arte vetorial
- [Biome](https://biomejs.dev/) para lint e formatação
- Jest + Testing Library para testes

## Como rodar

Requisitos: Node 22 LTS (veja `.nvmrc`), npm e o app **Expo Go** no celular.

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
npm run lint:fix    # Biome com correção automática
npm run typecheck   # tsc --noEmit
npm run test        # Jest
npm run test:watch
npm run doctor      # expo-doctor
npx expo export --platform android --output-dir dist   # bundle de verificação

npx drizzle-kit generate           # migração depois de mudar src/db/schema.ts
node scripts/build-icons.mjs       # ícone/splash a partir de brand/source/mark.svg
node scripts/build-isbn-ranges.mjs # tabela de faixas do ISBN
```

## Estrutura

```
src/app/            rotas (Expo Router), sem lógica de negócio
src/features/       UI, hooks e serviços por feature
src/components/ui/  componentes genéricos e arte vetorial
src/db/             schema, client, seed, migrações e repositórios
src/theme/          tokens de design
src/lib/            utilitários puros
src/test-utils/     banco sql.js e repositórios em memória para testes
drizzle/            migrações SQL geradas (não editar à mão)
scripts/            geradores de ícone/splash e de faixas do ISBN
types/              declarações globais versionadas
brand/              arte-fonte (fora do bundle)
assets/             ícone, splash e camada adaptativa
docs/               documentação do projeto
```

## Privacidade

Seus dados ficam **só no aparelho**, no SQLite local. Não há conta, telemetria
nem servidor. O plano de leitura é calculado offline.

Detalhes em [`docs/security-privacy.md`](docs/security-privacy.md).

## Documentação

| Documento | Para quê |
|---|---|
| [`AGENTS.md`](AGENTS.md) | regras de contribuição e protocolo de contexto |
| [`docs/INDEX.md`](docs/INDEX.md) | índice completo da documentação |
| [`docs/state/CURRENT.md`](docs/state/CURRENT.md) | onde paramos e o próximo passo |
| [`docs/roadmap.md`](docs/roadmap.md) | sessões e critérios de aceite |
| [`docs/brand.md`](docs/brand.md) | identidade visual |
| [`docs/design/design-system.md`](docs/design/design-system.md) | tokens e componentes |
| [`docs/architecture.md`](docs/architecture.md) | camadas e fluxo de dados |
| [`docs/data-model.md`](docs/data-model.md) | tabelas, migrações e seed |
| [`docs/testing.md`](docs/testing.md) | como testar |
| [`docs/adr/`](docs/adr/) | decisões registradas |

## Licença

[MIT](LICENSE) — código e arte inclusos. A marca e o mascote LêBot são
identidade do projeto; forks devem trocar nome e identidade visual.
