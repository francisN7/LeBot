# Política de segurança

## Versões suportadas

Projeto pessoal em desenvolvimento. Apenas a `main` recebe correções.

## Como reportar

Não abra issue pública para vulnerabilidades. Use o recurso **Report a
vulnerability** do GitHub (aba *Security* → *Advisories*) ou envie um e-mail
para o endereço listado no perfil do mantenedor.

Retorno em até 7 dias. Se o relato envolver dados pessoais, descreva apenas o
necessário — nunca anexe bancos de dados reais.

## Escopo

Interessam especialmente:

- vazamento de segredos (chaves, tokens, keystores) no código ou no histórico;
- exposição de dados pessoais em seeds, docs, screenshots ou fixtures;
- falhas no parsing de arquivos externos (backup JSON, ISBN, importação);
- permissões Android além do necessário.

## Práticas do repositório

- Segredos só em variáveis do EAS; nada em `.env` versionado.
- `gitleaks` roda no CI (histórico completo) e opcionalmente no hook local.
- Dependabot mensal para npm e GitHub Actions.
- CI com `permissions: contents: read`.
