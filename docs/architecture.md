# Arquitetura

Esqueleto criado na S0. Cresce conforme as sessões entregam camadas.

## Camadas

```
src/app/          rotas (Expo Router) — só orquestram telas
src/features/*/   UI + hooks + serviços de uma feature
src/db/           schema Drizzle, migrations e repositórios
src/lib/          funções puras, sem React Native
src/components/ui componentes genéricos
src/theme/        tokens (cor, espaçamento, tipografia)
```

Regras:

1. Tela não fala SQL: chama repositório.
2. Repositório não conhece React.
3. Motor do plano (`src/features/planner/engine/`) é puro e testável fora do
   React Native.
4. `src/app/` só compõe: sem regra de negócio, sem acesso a dados.
5. Sem `any`; validação de borda com Zod.

## Fluxo de dados (alvo)

```
SQLite (Drizzle) → repositório → serviço/hook da feature → tela
```

## Decisões

- Stack: [`docs/adr/0001-stack-e-arquitetura.md`](adr/0001-stack-e-arquitetura.md)
- Identidade: [`docs/adr/0002-identidade-lebot.md`](adr/0002-identidade-lebot.md)

## Pendências conhecidas

- NativeWind entra na S1, junto do design system.
- Ícones e splash ainda são placeholders do template do Expo até a S1/S4.
