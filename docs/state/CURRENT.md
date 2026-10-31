# Estado atual

> Handoff entre sessões. Atualizar no fim de toda sessão. Manter < 80 linhas.

## Sessão
- **Atual:** S2 — Persistência SQLite + Drizzle (`docs/sessions/S02-persistencia.md`)
- **Última concluída:** S1 — Design system + shell (`9e650d8`)
- **Próxima:** S2 — CRUD via repositório testado, telas lendo do banco

## Pronto
- NativeWind 4.2.7 + Tailwind 3.4 (SDK 58) com `babel.config.js`,
  `metro.config.js`, `global.css` e `nativewind-env.d.ts`.
- Tokens em `src/theme/`: cores (inclui `surface` e `navyMuted`), espaçamento,
  raios, tipografia, tamanhos, bordas e opacidades. `tailwind.config.ts` importa
  os tokens — sem paleta duplicada.
- Fontes Fredoka (600/700) e Nunito (400/600/700) via `expo-font`, com splash
  controlado no layout raiz.
- `src/components/ui/`: `Screen`, `AppText`, `Button`, `Card`, `Chip`, `Spine`
  (placeholder 2D por gênero) + `index.ts`. `className` passa por `twMerge`.
- Shell com 4 abas (`src/app/(tabs)/`): Estante, Fila, Hoje, Ajustes. Rotas só
  reexportam telas de `src/features/*/`.
- Fixtures fictícias em `src/features/*/__fixtures__/` (5 livros, fila, plano e
  ajustes).
- 12 testes (4 telas + Button + Spine + paleta) com RTL 14 assíncrono.
- Docs: `docs/design/design-system.md`, ADR 0006, `INDEX`, `architecture`,
  roadmap e changelog atualizados.
- Validação: lint, typecheck, test (12/12), `expo-doctor` (20/20) e
  `expo export --platform android` (bundle 3.8 MB) verdes.
- Conferido no Expo Go pelo dono: 4 abas navegam e `Lê/ç/ã` renderizam sem
  warning de fonte.

## Próximo passo
Executar a S2: instalar `expo-sqlite` + Drizzle, schema/migração inicial,
repositórios e seed, trocando as fixtures pelo banco.

## Pendências manuais (dono)
- Fechar os 7 PRs antigos do Dependabot (a config já foi removida).
- Ligar em *Settings → Code security*: Dependabot alerts, security updates,
  secret scanning e push protection.
- Ruleset na `main`: *restrict deletions* + *block force pushes* (bypass admin).

## Decisões abertas
- NativeWind v4 não declara suporte oficial à SDK 58 (ADR 0006): bundle passou;
  se SDK 59 quebrar, migrar para NativeWind 5 + Tailwind 4.
- Ícone e splash ainda são placeholders do template (S4).
- Estratégia de teste do SQLite no Jest será fechada na S2 (driver em memória
  vs. fake).
- `brand/source/*.png` ainda têm metadados: limpar no primeiro export real.

## Arquivos-chave
- `tailwind.config.ts`, `global.css`, `babel.config.js`, `metro.config.js`
- `src/theme/{colors,spacing,radii,typography,sizes}.ts`
- `src/components/ui/{Screen,AppText,Button,Card,Chip,Spine}.tsx`
- `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`
- `src/features/{library,queue,today,settings}/`
- `docs/design/design-system.md`, `docs/adr/0006-design-system-nativewind.md`

## Armadilhas
- `global.css` está na raiz: importe `../../global.css` a partir de
  `src/app/_layout.tsx`.
- Componente com `className` deve usar `twMerge`; sem isso, classes base do
  Tailwind vencem o override (ex.: `bg-surface` sobre `bg-pink`).
- RTL 14 é assíncrono: `await render(...)` e `await fireEvent.press(...)`.
- Fontes: use a família com peso (`Fredoka_700Bold`), nunca `fontWeight`.
- Node local 26 vs CI 22: rode `npm run test` antes de culpar o código.
- Biome não formata Markdown: `*.md` está excluído.
- `npx expo install <pkg>` sempre; nunca `npm install` direto para libs nativas.
- `expo-env.d.ts` é gerado e ignorado; não commitar.
- Repo é público: nada de dados pessoais em seeds, screenshots ou docs.

## Como rodar
```bash
npm install
npm start            # QR code para o Expo Go
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```
