# Arquitetura

Esqueleto criado na S0. Cresce conforme as sessões entregam camadas.

## Camadas

```
src/app/          rotas (Expo Router) — só orquestram telas
src/features/*/   UI + hooks + serviços de uma feature
src/db/           schema Drizzle, migrations e repositórios
src/lib/          funções puras, sem React Native
src/components/ui componentes genéricos (Screen, AppText, Button, Card, Chip, Spine)
src/theme/        tokens (cor, espaçamento, raio, tipografia, tamanhos)
```

Regras:

1. Tela não fala SQL: chama repositório.
2. Repositório não conhece React.
3. Motor do plano (`src/features/planner/engine/`) é puro e testável fora do
   React Native.
4. `src/app/` só compõe: sem regra de negócio, sem acesso a dados.
5. Sem `any`; validação de borda com Zod.
6. Estilo usa `className` (NativeWind) e tokens de `src/theme/`; nada de cor ou
   espaçamento solto no componente.

## Fluxo de dados (alvo)

```
SQLite (Drizzle) → repositório → serviço/hook da feature → tela
```

## Decisões

- Stack: [`docs/adr/0001-stack-e-arquitetura.md`](adr/0001-stack-e-arquitetura.md)
- Identidade: [`docs/adr/0002-identidade-lebot.md`](adr/0002-identidade-lebot.md)
- Design system: [`docs/adr/0006-design-system-nativewind.md`](adr/0006-design-system-nativewind.md)

## Pendências conhecidas

- Ícones e splash ainda são placeholders do template do Expo até a S4.
- Persistência (SQLite + Drizzle) entra na S2; as telas usam fixtures.
