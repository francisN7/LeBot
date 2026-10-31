# 0005 — Sem Dependabot de versão; só alertas de segurança

- **Data:** 2026-10-31
- **Status:** aceita

## Contexto

O Dependabot de versões abriu 7 PRs em poucas horas de vida do repositório
(atualizações de `react`, `react-dom`, grupo Expo, TypeScript 7 e três
Actions). Para um projeto solo em fundação isso gerou custo sem retorno:
PRs incompreensíveis, um deles quebrado por subir `react-dom` sem `react`, e
falhas de CI herdadas de um workflow antigo.

Além disso, o ecossistema Expo **não** se atualiza pacote a pacote: a versão é
amarrada ao SDK (`npx expo install --check`), então o bot não consegue propor o
bump correto de qualquer forma.

## Decisão

- Remover `.github/dependabot.yml`: nenhum PR automático de versão.
- Manter no GitHub, em *Settings → Code security*: **Dependabot alerts**,
  **Dependabot security updates**, **secret scanning** e **push protection**.
- Atualizar dependências de forma deliberada, por sessão de release (S12 e
  adiante), com `npx expo install --check` + `npm run lint/typecheck/test`.

## Consequências

- A `main` fica sem PRs de bot; nenhum ruído no painel.
- Patches de segurança continuam chegando: o GitHub abre PR só quando há CVE
  que afeta uma dependência direta.
- O projeto pode ficar alguns meses atrás no patch mais recente — risco aceito,
  coberto por release manual e pelo escopo pessoal do app.
- Se entrar um segundo mantenedor, reavaliar (Renovate ou Dependabot agrupado).
