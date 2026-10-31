# 0004 — E-mail `noreply` do GitHub em todos os commits

- **Data:** 2026-10-31
- **Status:** aceita

## Contexto

O commit inicial foi publicado com o e-mail pessoal do autor. Git grava
autor e committer dentro do objeto do commit; em repositório público esse dado
fica visível na página do commit, na API e em qualquer clone.

## Decisão

- `git config --global user.email` aponta para
  `99262638+francisN7@users.noreply.github.com`.
- Ativar no GitHub *Keep my email addresses private* e *Block command line
  pushes that expose my email*.
- O commit inicial foi reescrito (`--reset-author`) e republicado com
  `--force-with-lease`.

## Consequências

- Nenhum e-mail pessoal novo entra no histórico.
- O GitHub bloqueia pushes acidentais com e-mail real, em qualquer repositório.
- Reescrever história exige force-push: aceitável enquanto o repo tem um único
  autor e nenhum fork. A partir da S1, histórico é imutável.
- Commits antigos podem continuar acessíveis por SHA em cache do GitHub por um
  tempo; não há dado sensível neles além do e-mail.
