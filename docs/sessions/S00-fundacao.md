# S00 — Fundação pública + onboarding Expo

## Objetivo
Ter um repositório público saudável, um app Expo mínimo rodando no Android e a documentação-base — sem nenhuma funcionalidade de biblioteca.

## Fora de escopo
- Telas do app, banco de dados, plano de leitura, ícones finais.
- Qualquer dado pessoal real.

## Tarefas
1. `git init` e configuração de identidade com e-mail `noreply` do GitHub.
2. `.gitignore`, `.gitattributes`, `LICENSE` (MIT) e `SECURITY.md`.
3. `brand/README.md` (arte já movida para `brand/source/`).
4. Criar app Expo Router com TypeScript strict.
5. Biome, scripts npm e Husky + lint-staged + gitleaks.
6. `app.config.ts`: name `LêBot`, slug/scheme `lebot`, package `com.francis.lebot`.
7. CI em `.github/workflows/ci.yml`: typecheck, lint, test, gitleaks (`fetch-depth: 0`) e `expo-doctor`; `permissions: contents: read`.
8. Docs: `README.md`, `docs/architecture.md` (esqueleto), `docs/security-privacy.md`, `docs/learn/expo-for-react-devs.md`.
9. `CHANGELOG.md`, Dependabot e branch protection na `main`.
10. Primeiro push.

## Aceite
- [ ] `npm run lint`, `npm run typecheck` e `npm run test` passam.
- [ ] App abre no Android via Expo Go.
- [ ] `gitleaks detect` limpo no histórico.
- [ ] CI verde no GitHub.
- [ ] README público com descrição, stack, como rodar, privacidade e licença.
- [ ] Nenhum segredo, dado pessoal ou arte com metadados no commit.

## Contexto necessário
`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `brand/README.md`.

## Arquivos prováveis
`.gitignore`, `.gitattributes`, `LICENSE`, `SECURITY.md`, `package.json`, `app.config.ts`, `biome.json`, `tsconfig.json`, `.github/workflows/ci.yml`, `README.md`, `docs/*`.

## Riscos
- Conflito entre `create-expo-app` e uma pasta não vazia: criar em subpasta temporária e mover, se necessário.
- Husky + gitleaks no Windows: validar o hook antes do primeiro commit.
