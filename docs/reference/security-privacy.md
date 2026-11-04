# Segurança e privacidade

**O que responde:** o que o app guarda, o que ele nunca faz e o que nunca entra
no repositório público. **O que não responde:** o formato do backup
([`data-model.md`](data-model.md#backup)) nem o modelo de ameaças (não há um).

## Princípio

**Os dados são do leitor e ficam no aparelho.** Sem conta, sem servidor, sem
telemetria no MVP.

## O que fica no aparelho

| Dado | Onde |
|---|---|
| Livros, gêneros, status, ISBN e preferências | SQLite local |
| Cores dos gêneros (par claro/escuro) | SQLite local |
| Sessões de leitura, progresso e resenhas | SQLite local |
| Capa escolhida | `documentDirectory/covers/` (só o caminho fica no banco) |

A capa é copiada para a área privada do app; apagar o app apaga banco e capas.
O backup é manual: um **ZIP** com `backup.json` e as capas, que o usuário escolhe
onde guardar. Nenhum upload automático. O arquivo contém histórico, resenhas e
imagens pessoais: não deve ser commitado nem compartilhado sem querer. Na
importação, o app valida tudo antes de apagar o banco atual.

## O que o app não faz

- Não pede login nem e-mail.
- Não acessa contatos, localização, microfone ou câmera.
- Não envia analytics, crash reporting ou advertising ID.
- Não lê arquivos além do que o usuário selecionar.

## Permissões Android

Alvo: **nenhuma permissão perigosa**. A capa vem do seletor do sistema, sem acesso
amplo à biblioteca de arquivos. O app **não consulta ISBN online**; se isso
entrar, será só a pedido do usuário, com `INTERNET` e enviando apenas o ISBN.

## Repositório público

Nunca commitar `.env`, keystores (`*.jks`, `*.keystore`), `google-services.json`,
bancos reais, exports de backup ou screenshots com dados reais. Commits usam o
e-mail noreply do GitHub. Proteções ativas: `.gitignore` cobre credenciais e
builds; `gitleaks` roda no CI com histórico completo; o hook local é opcional; o
Dependabot só abre alertas de segurança (sem PRs de versão).

## Dados fictícios

Seeds, testes, screenshots e documentação usam livros e nomes inventados. Nunca
usar a estante real de ninguém em exemplo público.

## LGPD (visão rápida)

- Não há tratamento por terceiros: sem backend, não há controlador de dados de
  usuários remotos.
- O usuário controla export, import e exclusão (apagar o app apaga o banco).
- Se um dia houver sync, será opt-in, com aviso claro e exclusão real.

## Direitos e contato

Dúvidas ou pedidos: use o canal privado de [`SECURITY.md`](../../SECURITY.md).
Nunca anexe banco, backup ou dado pessoal real.
