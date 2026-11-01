# ADR 0019 — Resenha com campos extras configuráveis

- **Status:** aceito
- **Data:** 2026-11-01
- **Sessão:** S9

## Contexto

A S9 fecha o ciclo do livro: ao concluir, o dono registra nota e resenha. A spec
original previa só `rating`, `text` e `quote` numa tabela `reviews`. Na abertura,
o dono pediu campos extras **globais** criados em Ajustes (ex.: "O que
melhorar?", "Que repertório me deu?"), opcionais na resenha e abertos por chip.
Pediu também manter a citação e deixar uma futura galeria de citações no backlog.

Isso levanta três escolhas: onde guardar os valores variáveis, como tratar a
citação e em que momento a resenha abre.

## Decisão

1. **Tabela `reviews`**, uma linha por livro (`book_id` PK), com `rating` 1–5
   (`CHECK`), `text`, `quote`, `extras` JSON e timestamps. Sem FK física, como as
   demais tabelas; a integridade fica no repositório.
2. **`quote` é coluna própria**, não um campo extra: a futura galeria consulta
   `reviews.quote` direto, sem varrer JSON.
3. **`review_fields`** guarda os campos globais (`id`, `name`, `sort_order`),
   criados em Ajustes e ordenados pela criação. Excluir o campo limpa a chave
   dele nos `extras` de todas as resenhas, na mesma operação.
4. **Valores em `extras` JSON** (`{ "<field_id>": "texto" }`), validados com
   Zod e sem chaves de valor vazio. O backup (S11) leva `reviews` e
   `review_fields` como linhas; um import antigo recupera até chaves de campos
   excluídos. Uma tabela de valores perderia esses textos na exclusão do campo e
   exigiria join na exportação.
5. **A resenha abre pela sessão de leitura** que leva o livro ao fim. Concluir
   pela roda ou pela edição mostra o CTA "Escrever resenha" no detalhe, sem
   abrir outra camada em cima do gesto. Reconcluir abre preenchida.
6. **Reabrir o livro preserva a resenha**: ela fica oculta enquanto o status não
   é `finished` e volta na próxima conclusão; salvar é upsert por `book_id`.
7. **Excluir o livro apaga a resenha** dentro da transação de `books.remove`.
   As sessões de leitura continuam órfãs (limpeza no backlog).
8. **UI**: nota obrigatória; texto e citação opcionais; chips dos campos abaixo
   do texto, em acordeão (abrir um recolhe o anterior); a Estante mostra
   `★★★★` só em livro concluído com resenha.

## Consequências

- Resenha e campos têm ciclo próprio; `books` continua sendo só a ficha.
- Salvar sem tocar em nenhum chip funciona; campo vazio não grava linha.
- O JSON não é consultável por campo ("todos os livros com repertório"); nesta
  escala, não é necessário. Citação e nota, que precisam de consulta, ficam em
  colunas.
- Orfandade é controlada em dois pontos: livro → resenha (transação do livro) e
  campo → valores (limpeza nos extras). Sem FK, os testes cobrem os dois.
- O backup inclui as duas tabelas novas; o repositório em memória dos testes
  repete upsert, cascata e limpeza de campo para não divergir do SQLite.
- Trocar o nome de um campo mantém o `id`, então os textos já escritos seguem
  ligados a ele.

## Alternativas descartadas

- **Colunas em `books`:** reabrir e editar a resenha passaria a mexer na ficha e
  cada campo novo viraria migração.
- **Tabela `review_field_values`:** mais íntegra, mas perde valores ao excluir o
  campo, exige join no backup e complica o caso de uso pessoal.
- **Citação como campo extra:** a galeria teria de varrer JSON de todas as
  resenhas para listar trechos.
- **Campos por livro:** o dono pediu globais; repetir a configuração por livro
  não escala.
- **Abrir a resenha também pela roda:** criaria duas camadas sobre o gesto e dois
  gatilhos para a mesma ação.
