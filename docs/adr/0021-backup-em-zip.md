# ADR 0021 — Backup manual em ZIP com JSON e capas

- **Status:** aceito
- **Data:** 2026-11-01
- **Sessão:** S11

## Contexto

Os dados vivem só no SQLite do aparelho e as capas são arquivos em
`documentDirectory/covers/<id>.jpg`; o banco guarda apenas o caminho absoluto.
Sem conta e sem nuvem, o dono precisa de um jeito de levar o histórico inteiro
para outro aparelho ou recuperar depois de limpar o app.

A spec da S11 propunha um JSON puro. Ao revisar Ajustes, o dono pediu que o
backup também levasse as capas e que a tela cobrisse o que o plano original não
cobria: seções, data do último backup, cópia do estado atual antes de restaurar
e a correção da fila ao excluir um livro. O ZIP foi escolhido para não inflar
imagens em base64 e preservar a qualidade original.

## Decisão

1. **Um arquivo `.zip`** com `backup.json` na raiz e uma capa por livro em
   `covers/<bookId>.jpg`. O JSON continua sendo o contrato versionado; o ZIP é
   só o recipiente. `fflate` monta e abre o arquivo; `Directory.pickDirectoryAsync`
   escolhe a pasta no export e `File.pickFileAsync` escolhe o ZIP na importação,
   ambos do `expo-file-system`. Não entraram `expo-sharing` nem
   `expo-document-picker`.
2. **Formato v1**, validado com Zod na importação: `formatVersion: 1`,
   `appVersion`, `exportedAt` e `data` com `genres`, `review_fields`, `books`,
   `reading_sessions`, `queue_items`, `reviews` e `settings`. Tabelas em
   snake_case, datas ISO UTC e `cover_uri` relativo ao ZIP (`covers/<id>.jpg`
   ou `null`). Só a versão 1 é aceita; versão diferente é recusada com
   mensagem clara.
3. **Substituir, nunca mesclar.** A importação apaga todas as tabelas e insere
   o backup numa única transação. A validação acontece em memória antes; se
   algo falhar, o banco atual fica intacto. A confirmação é dupla e mostra as
   contagens do arquivo e do aparelho. Antes de continuar, o dono pode exportar
   uma cópia do estado atual.
4. **Validação rigorosa:** ids únicos e seguros, ISBNs válidos e sem repetição,
   nomes normalizados de gênero/campo sem repetição, gênero do livro existente,
   resenha e item da ordem apontando para livro existente, livro concluído fora
   da ordem, `pages_read` coerente, sessões com `applied_pages` dentro do lido,
   meta 3–200 e capa nos dois sentidos (todo `cover_uri` tem arquivo e todo
   arquivo pertence a um livro). Sessão órfã continua permitida: o app já a
   aceita, e ela só conta páginas nas estatísticas.
5. **Capa que sumiu do aparelho aborta o export.** O export lê os arquivos
   referenciados; se um `cover_uri` aponta para arquivo inexistente ou vazio, o
   backup não é gerado e a UI diz quais livros precisam de capa nova. Assim o
   arquivo nunca perde uma capa em silêncio. Na importação, as capas são
   preparadas numa pasta de cache, o banco é substituído e só então os arquivos
   vão para `covers/`; se uma gravação falhar, o livro fica com `cover_uri`
   nulo. Arquivos antigos fora do backup são limpos.
6. **Fila consistente.** `books.remove` passou a apagar `queue_items` na mesma
   transação. O export descarta linhas de livro concluído/excluído e renumera a
   ordem visível; a importação recusa item de livro inexistente ou concluído.
7. **Atualização imediata.** `useSettings` ganhou o mesmo padrão de assinatura
   dos outros hooks: salvar a meta em Ajustes atualiza a Hoje sem reiniciar. A
   restauração troca o banco inteiro; ao fechar o aviso de sucesso, a navegação
   remonta por uma `key` de versão de dados, e todos os hooks releem o banco.
   Não foi criado um barramento global de eventos.
8. **`backup.last_exported_at`** em `settings`, em ISO, mostrado no card como
   "Último backup". As chaves `reminder.time`, `appearance.theme` e
   `backup.enabled` continuam no banco e no backup para os recursos futuros, mas
   os cards de Lembrete e Aparência mostram "Em breve" e não exibem valores
   falsos.

## Consequências

- Backup manual, local e opt-in; nenhum upload, conta ou sync. O arquivo contém
  histórico e capas pessoais e a UI avisa.
- O JSON inteiro e as capas ficam na memória durante o export/import. O arquivo
  é limitado a 128 MB, o conteúdo descompactado a 256 MB e cada capa a 20 MB;
  para uma biblioteca pessoal é folgado, mas não é um backup incremental.
- Capas não são redimensionadas: o ZIP preserva o arquivo original, ao custo de
  tamanho. Exportar de novo no mesmo dia cria outro arquivo se o nome já existir
  (o app tenta um sufixo de hora); nenhum backup anterior é apagado. Cancelar a
  seleção de pasta não grava nada nem atualiza a data do último backup.
- O ZIP não tem checksum nem migração de formato. Um v2 precisará de uma
  conversão explícita.
- A restauração pode falhar depois do banco trocado se a gravação de uma capa
  falhar; nesse caso o dado textual está correto e o livro perde só a capa.
- Restaurar um backup de outro aparelho reescreve os caminhos das capas; o
  caminho absoluto do aparelho antigo não vaza para o novo banco.

## Alternativas descartadas

- **JSON com base64:** ~33% maior e com pico de memória alto para fotos de
  capa; o JSON deixaria de ser legível sem decodificar.
- **JSON com capas reduzidas:** exigiria `expo-image-manipulator` e processar
  cada capa no export; perde qualidade e não resolve o caso de muitas capas.
- **`expo-document-picker`:** `File.pickFileAsync` do `expo-file-system` 58 já
  tem paridade com o picker; uma dependência a menos.
- **`expo-sharing` no export:** abre o share sheet e não deixa escolher a pasta;
  o dono teria que escolher um app que salvasse o arquivo. O
  `Directory.pickDirectoryAsync` é o mesmo gesto da importação e escreve direto
  no destino escolhido.
- **Mesclar na importação:** conflito de ISBN, `book_id` e histórico; a resenha
  e a ordem não têm chave natural para combinar.
- **Evento global para atualizar as telas:** mais código em cada feature e mais
  chance de esquecer um hook; a remontagem por versão de dados é menor e cobre
  estatísticas, ordem e detalhes.
- **Apagar tudo em Ajustes:** ficou fora da S11; importar um backup vazio já
  substitui os dados, com as mesmas confirmações.
