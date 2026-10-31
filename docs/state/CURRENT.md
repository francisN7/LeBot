# Estado atual

> Handoff entre sessões. Atualizar no fim de toda sessão. Manter < 80 linhas.

## Sessão
- **Atual:** S1 — Design system + shell (`docs/sessions/S01-design-system.md`)
- **Última concluída:** S0 — Fundação pública + onboarding Expo (`5d2900c`)
- **Próxima:** S1 — 4 abas navegáveis com dados fake

## Pronto
- App Expo SDK 58 (React Native 0.88, TypeScript strict) rodando com Expo Router
  em `src/app/`; bundle Android exporta sem erro.
- `app.config.ts` com `LêBot`, slug/scheme `lebot`, package `com.francis.lebot`.
- Tooling: Biome (lint + format), Jest (`jest-expo`), Husky + lint-staged.
- CI (`.github/workflows/ci.yml`): lint, typecheck, test, expo-doctor, gitleaks
  com `fetch-depth: 0` e `permissions: contents: read`. **Verde** em `main`.
- `gitleaks` limpo no histórico completo.
- Docs: `README.md`, `SECURITY.md`, `docs/architecture.md`,
  `docs/security-privacy.md`, `docs/learn/expo-for-react-devs.md`.
- Licença MIT (código + arte) e e-mail `noreply` do GitHub nos commits.
- Dependabot desligado para versões (só alertas de segurança) e `.nvmrc` com
  Node 22.

## Próximo passo
Executar a S1: design system (tokens, tipografia Fredoka/Nunito) e shell com
4 abas usando dados fake.

## Pendências manuais (dono)
- Fechar os 7 PRs antigos do Dependabot (botão *Close*); a config já foi removida.
- Ligar em *Settings → Code security*: Dependabot alerts, security updates,
  secret scanning e push protection.
- Ruleset na `main`: *restrict deletions* + *block force pushes* (bypass admin).
- Abrir o app no Expo Go (`npm start`) e confirmar a tela da S0 no aparelho.

## Decisões abertas
- NativeWind: entrou na S1 (ainda não instalado).
- Ícone e splash ainda são placeholders do template do Expo (S1/S4).
- Branch protection na `main`: ativar manualmente no GitHub (não há `gh` local).
- `brand/source/*.png` ainda têm metadados: limpar no primeiro export.

## Arquivos-chave
- `src/app/_layout.tsx`, `src/app/index.tsx`
- `src/theme/colors.ts` (paleta de `docs/brand.md`)
- `app.config.ts`, `biome.json`, `tsconfig.json`
- `.github/workflows/ci.yml`, `.husky/pre-commit`

## Armadilhas
- Node local 26 vs CI 22: rode `nvm use` antes de investigar falha de CI.
- Biome formata Markdown; `*.md` está excluído para não gerar churn.
- `npx expo install <pkg>` sempre, nunca `npm install` direto para libs nativas.
- `expo-env.d.ts` é gerado e ignorado: não commitar.
- Repo é público: nada de dados pessoais em seeds, screenshots ou docs.

## Como rodar
```bash
npm install
npm start            # QR code para o Expo Go
npm run lint && npm run typecheck && npm run test
npm run doctor
```
