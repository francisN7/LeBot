# ADR 0018 — Concluir preenche as páginas lidas

- **Status:** aceito
- **Data:** 2026-11-01
- **Sessão:** S8a

## Contexto

A S8a adiciona a troca rápida de status: segurar o chip da Estante abre uma roda
e escolher "Concluído" grava `finished` sem passar por uma sessão de leitura.
Até aqui, só o repositório de leitura levava o progresso ao total; a edição manual
do livro (formulário ou, agora, a roda) podia deixar um livro "Concluído" com
`pages_read` menor que `pages`.

Na abertura da S8a, o dono definiu a regra: concluir, em qualquer parte do app,
deve preencher as páginas lidas.

## Decisão

O repositório de livros normaliza o livro ao criar e ao atualizar: se
`status = 'finished'`, `pages_read` recebe `pages`. A regra vale para o
formulário, para a roda de status e para qualquer chamada futura ao
repositório; a tela não precisa lembrar de mandar as páginas.

O histórico de leitura continua mandando no piso: a normalização acontece antes
da checagem de `applied_pages`, então concluir nunca fica abaixo das sessões
registradas.

## Consequências

- "Concluído" sempre significa 100% na Estante, no detalhe, na Ordem e no plano.
- Escolher "Concluído" na roda não abre diálogo nem pede confirmação.
- Trocar de `finished` para outro status mantém o progresso cheio; para voltar a
  ler de onde parou, o caminho é desfazer sessões ou editar "Páginas lidas".
- O repositório em memória usado nos testes de tela repete a regra, senão a
  Estante e o SQLite divergiriam.
- Testes novos no repositório de livros: criar concluído, atualizar para
  concluído e trocar para outro status sem mexer no progresso.

## Alternativas descartadas

- **Só preencher na roda:** o formulário continuaria permitindo "Concluído" com
  progresso parcial.
- **Preencher na UI:** cada tela repetiria a regra e uma chamada direta ao
  repositório a furaria.
- **Pedir confirmação:** a decisão de concluir já é explícita na roda; um
  diálogo extra atrapalharia a troca rápida.
