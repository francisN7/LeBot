# Segurança e privacidade

LêBot é um app pessoal e offline. Este documento fixa o que é coletado, onde
fica e o que nunca deve entrar no repositório público.

## Princípio

**Os dados são do leitor e ficam no aparelho.** Sem conta, sem servidor, sem
telemetria no MVP.

## O que fica no aparelho

| Dado | Onde | Observação |
|---|---|---|
| Livros, gêneros, status | SQLite local | sem sincronização no MVP |
| Sessões de leitura e progresso | SQLite local | histórico do plano |
| Resenhas e notas | SQLite local | nunca enviadas para fora |
| Preferências | SQLite local | meta diária, ritmo |

Backup é manual: export/import de um JSON que o usuário escolhe onde guardar
(S11). Nenhum upload automático.

## O que o app não faz

- Não pede login nem e-mail.
- Não acessa contatos, localização, microfone ou câmera.
- Não envia analytics, crash reporting ou advertising ID.
- Não lê a biblioteca de arquivos além do que o usuário selecionar.

## Permissões Android

Alvo: **nenhuma permissão perigosa** no MVP. Consultas de ISBN usam rede apenas
quando o usuário pede para buscar a capa/metadados (S3), e só com `INTERNET`.

## Repositório público

Nunca commitar:

- `.env`, keystores (`*.jks`, `*.keystore`), `google-services.json`;
- bancos SQLite reais, exports de backup, screenshots com dados reais;
- e-mail pessoal em commits — use o noreply do GitHub.

Proteções ativas:

- `.gitignore` cobre credenciais, builds e backups;
- `gitleaks` roda no CI com histórico completo (`fetch-depth: 0`);
- hook local opcional (`gitleaks git --staged`) quando a ferramenta existe;
- Dependabot mensal para npm e Actions.

## Dados fictícios

Seeds, testes, screenshots e documentação usam livros e nomes inventados. Nunca
usar a estante real de ninguém em exemplo público.

## LGPD (visão rápida)

- Não há tratamento de dados por terceiros: o app não é controlador de dados
  de usuários remotos, porque não existe backend.
- O usuário controla export, import e exclusão (apagar o app apaga o banco).
- Se um dia houver sync, será opt-in, com aviso claro e exclusão real.

## Direitos e contato

Dúvidas ou pedidos: abra uma issue sem dados pessoais ou use o canal em
[`SECURITY.md`](../SECURITY.md).
