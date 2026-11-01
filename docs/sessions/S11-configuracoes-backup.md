# S11 — Configurações + backup JSON

## Objetivo

Ajustes deixa de ter cards inertes: a meta diária passa a ser editável (e a Hoje
reflete na hora) e o dono exporta e restaura todo o banco em JSON, com
round-trip testado. Lembrete e Aparência ganham estado explícito em vez de
parecerem quebrados.

## Fora de escopo

- Tema escuro completo (toggle, tokens de superfície e revisão de contraste) —
  segue no backlog.
- Notificações reais: sem `expo-notifications`, o card não promete lembrete.
- Backup/sync na nuvem e multi-dispositivo.
- Imagens de capa no backup: `cover_uri` é caminho absoluto do aparelho e não é
  portátil. Reimportar capas fica no backlog.
- Edição manual do plano (S7.2 continua opcional).

## Decisões a confirmar na abertura

1. **Formato:** JSON versionado (`formatVersion`, `exportedAt`, tabelas
   `books`, `genres`, `reading_sessions`, `queue_items`, `reviews`,
   `review_fields`, `settings`), validado com Zod na importação. Recomendo
   aceitar só a versão atual no MVP e recusar o resto com mensagem clara.
2. **Restauração:** substituir tudo (transação: apaga e insere) depois de
   confirmação dupla, com contagem nas duas etapas como a multisseleção do
   backlog. Recomendo não mesclar no MVP: mesclar ISBNs e `book_id` gera conflito
   de resenha e de histórico.
3. **Capas:** exportar só o caminho (sem arquivo) e avisar na UI que a capa não
   acompanha o backup. Confirmar.
4. **Lembrete:** sem `expo-notifications`, o card sai da UI ou vira "em breve"
   com explicação curta. Recomendo "em breve", sem campo de hora falso.
5. **Aparência:** card "em breve" até o tema escuro existir.
6. **Meta diária:** editar `goal.pages` com o mesmo intervalo do motor (3–200);
   salvar avisa `useSettings` e a Hoje recalcula. Sem tela nova: o card vira um
   campo no próprio Ajustes.
7. **Exportar/importar:** `expo-sharing` para exportar e
   `expo-document-picker` para importar. Confirmar as duas dependências Expo
   (e o custo de mais uma sessão se o picker complicar).
8. **Backup automático:** `backup.enabled` já existe, mas sem agendador no MVP;
   manter manual e não gravar uma promessa que o app não cumpre.

## Tarefas

1. **`settings` na UI:** card Meta diária com validação 3–200 e salvamento pelo
   `useSettings`; Lembrete e Aparência como "em breve".
2. **Serializador puro:** `src/features/settings/backup.ts` monta o JSON a partir
   das linhas e valida/parseia na volta. Sem React Native, banco ou relógio.
   Versão de formato explícita e mensagens de erro por campo.
3. **Exportação:** gera o arquivo com `expo-file-system` e abre o
   compartilhamento; nome com a data (`lebot-backup-YYYY-MM-DD.json`).
4. **Importação:** lê o arquivo escolhido, valida e restaura numa transação;
   confirmação dupla mostra quantos livros/sessões/resenhas serão apagados.
5. **Repositório:** operação `replaceAll` por tabela ou `restoreAll` no client,
   com testes no SQLite e no fake.
6. **Testes:** round-trip completo (exportar → limpar → importar → mesmos
   dados), JSON inválido/versão errada/arquivo vazio, meta fora do intervalo,
   confirmação dupla da importação e reflexo da meta na Hoje.
7. **Docs:** `architecture.md`, `data-model.md` (se surgir operação nova),
   `design-system.md` (cards e estados "em breve"), `testing.md`, `CURRENT.md`,
   `roadmap.md`, `CHANGELOG.md` e ADR para formato/restauração.

## Aceite

- [ ] Meta diária editável em Ajustes, com 3–200, refletida na Hoje sem reiniciar.
- [ ] Exportar gera um JSON com todas as tabelas, incluindo resenhas, campos
      extras e ordem.
- [ ] Importar um backup exportado pelo próprio app restaura os mesmos dados.
- [ ] JSON inválido, versão desconhecida ou arquivo vazio não apagam nada.
- [ ] Lembrete e Aparência têm estado explícito ("em breve"), sem ação falsa.
- [ ] Round-trip coberto por teste no SQLite e no repositório em memória.
- [ ] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes; conferido no
      Android.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `src/features/settings/`,
`src/db/schema.ts`, `src/db/repositories/` (todos), `src/db/client.ts`,
`src/app/_layout.tsx`, `src/features/today/use-daily-plan.ts`,
`docs/architecture.md`, `docs/data-model.md`, ADRs 0007 e 0019.

## Arquivos prováveis

- `src/features/settings/SettingsScreen.tsx` (ou `AjustesScreen`)
- `src/features/settings/backup.ts`, `backup-service.ts`, `BackupCard.tsx`
- `src/db/repositories/backup.ts` (ou `restoreAll` no client)
- `src/app/ajustes.tsx` / `src/app/(tabs)/ajustes.tsx` (rota)
- `src/test-utils/repositories.ts`
- `docs/architecture.md`, `docs/testing.md`, `docs/design/design-system.md`

## Riscos

- **Perda de dados:** a importação apaga antes de inserir. Validar tudo em
  memória antes de abrir a transação; abortar mantém o banco intacto.
- **Dados pessoais:** o JSON tem histórico e resenhas — nunca commitar e avisar
  na UI que o arquivo é pessoal.
- **Capas quebradas:** caminho absoluto do outro aparelho não abre; a UI precisa
  mostrar o fallback da lombada sem erro.
- **Versão futura:** sem `formatVersion` o backup de hoje vira lixo no próximo
  schema.
- **Dependências novas:** `expo-document-picker` e `expo-sharing` precisam de
  `npx expo install`; o `doctor` é quem confirma.
- **Confirmação dupla:** não reaproveitar o `ConfirmDialog` simples sem a
  contagem visível; é o mesmo padrão da multisseleção no backlog.

## Próximo depois desta

**S11a** — design 3D da lombada e emoções (spec pronta). Depois, **S12** —
release interno.

## Resultado (2026-11-01)

Entregue com as decisões fechadas na abertura e registradas na ADR 0021. O que
mudou em relação ao plano original:

- **Capas entram no backup.** O arquivo é um `.zip` com `backup.json` (formato
  1) e `covers/<bookId>.jpg`; o JSON guarda o caminho relativo e a importação
  reescreve para o caminho do aparelho. Export aborta se uma capa referenciada
  sumiu do disco.
- **Nenhuma dependência nativa nova.** A pasta do export é escolhida com
  `Directory.pickDirectoryAsync` e o arquivo da importação com
  `File.pickFileAsync`, ambos do `expo-file-system` 58; `expo-sharing` e
  `expo-document-picker` não entraram. O ZIP usa `fflate` (JS puro). Cancelar a
  pasta não grava nem muda a data do último backup.
- **Ajustes em quatro seções** (Leitura, Organização, Dados e Sobre), com a data
  do último backup, a cópia opcional do estado atual antes de restaurar e as
  contagens só nos diálogos de confirmação.
- **`books.remove` apaga `queue_items`** na mesma transação; o export descarta
  da fila o que não é livro válido e renumera.
- **`useSettings` ganhou assinatura**, então a meta salva em Ajustes atualiza a
  Hoje sem reiniciar. Depois de restaurar, a versão de dados remonta a navegação
  e todos os hooks releem o banco.
- Sem migração. 49 testes novos (486 em 64 arquivos); lint, typecheck, test,
  doctor e export verdes. Falta a conferência manual no Android da escolha de
  pasta e de arquivo, da restauração de capas e do modal em tela pequena.
