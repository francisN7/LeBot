# Estado atual

## Sessão

- **Atual:** nenhuma; S11 concluída e conferida no Android em 2026-11-01.
- **Última concluída:** S11 (configurações + backup ZIP), conferida no Android.
- **Próxima:** S11a (design 3D da lombada e emoções), spec em
  `docs/sessions/S11a-design-3d-emocoes.md`; depois S12 (release interno).

## Pronto (S11)

- Ajustes em quatro seções: **Leitura** (meta, lembrete, aparência),
  **Organização** (gêneros e campos de resenha), **Dados** (backup) e **Sobre**.
- Meta diária editável com campo numérico, validação 3–200 e botão Salvar.
  `useSettings` ganhou assinatura; a Hoje recalcula na hora, sem reiniciar.
- Lembrete e Aparência viraram cards "Em breve", sem horário/tema falsos. As
  chaves `reminder.time`, `appearance.theme` e `backup.enabled` continuam no
  banco e no backup para os recursos futuros.
- Backup manual em `.zip`: `backup.json` (formato 1) + `covers/<bookId>.jpg`.
  Exportar lê as sete tabelas, aborta se uma capa referenciada sumiu do aparelho,
  escolhe a pasta com `Directory.pickDirectoryAsync`, grava o arquivo e a data.
  Cancelar a pasta não grava nem muda a data.
- Importação valida em memória (formato, ids, ISBNs, referências, meta, capas),
  mostra contagens do arquivo × do aparelho, oferece exportar uma cópia do estado
  atual, pede confirmação dupla e substitui tudo numa transação. As capas são
  preparadas no cache, movidas para `covers/` depois do banco e os caminhos são
  reescritos; se uma capa falhar, o livro fica sem capa. Arquivos antigos fora do
  backup são limpos. O sucesso remonta a navegação por `DataVersionProvider`.
- `books.remove` apaga `queue_items` na mesma transação; o export descarta da
  fila livro concluído/inexistente e renumera.
- Serializador puro (`backup/format.ts`), ZIP (`archive.ts`), camada nativa
  (`service.ts`), hook (`use-backup`) e repositório (`backup.ts`). `fflate`;
  pasta/arquivo via `Directory.pickDirectoryAsync`/`File.pickFileAsync` do
  `expo-file-system`, sem `expo-sharing`/`expo-document-picker`.
- 49 testes novos (486 em 64 arquivos); lint, typecheck, test, doctor e export
  verdes. Sem migração (ADR 0021).

## Decisões abertas

- Backlog: galeria de citações, `finished_at`, grid ajustável na Estante,
  refinamento das animações do mascote, tema escuro e temas extras.

## Arquivos-chave

- `src/features/settings/` (`AjustesScreen`, `GoalCard`, `ComingSoonCard`,
  `BackupCard`, `RestoreBackupDialog`, `data-version`, `use-settings`)
- `src/features/settings/backup/` (`format`, `archive`, `service`, `use-backup`,
  `backup-context`, `types`, `labels`)
- `src/db/repositories/backup.ts`, `src/db/repositories/books.ts`
- `src/app/_layout.tsx` (providers + `AppStack` com `key`)
- `src/test-utils/backup.ts`, `src/test-utils/render.tsx`, ADR 0021

## Armadilhas

- O ZIP não é JSON puro: `backup.json` fica na raiz e as capas em `covers/`; o
  `cover_uri` do JSON é relativo (`covers/<id>.jpg`).
- Exportar **aborta** se um `cover_uri` aponta para arquivo inexistente/vazio;
  não pule essa checagem nem troque por "ignorar e seguir".
- A importação valida tudo antes da transação; abortar mantém o banco intacto.
  As capas são preparadas no cache antes do banco e só depois movidas.
- O `seed.books.version` é reposto no `replaceAll`; sem isso um backup vazio
  semearia os livros de exemplo no próximo boot.
- Restaurar troca o banco inteiro; não esqueça a remontagem por `DataVersion` ou
  as telas ficam com dados velhos.
- `useSettings` agora notifica; não volte a ler o repositório só no mount.
- A fila exportada é a visível (livro existente e não concluído), renumerada;
  item de ordem órfão/concluído é recusado na importação.
- O `backup/service.ts` importa módulos nativos; testes de tela usam o fake de
  `src/test-utils/backup.ts`.

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```
