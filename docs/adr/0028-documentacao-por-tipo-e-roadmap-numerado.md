# ADR 0028 - Documentação por tipo, roadmap numerado e orçamento de contexto

## Contexto

O MVP fechou com 73 arquivos Markdown e ~7.400 linhas. Guias, referência e
histórico de sessão estavam misturados: `testing.md` tinha 311 linhas de
"Cobertura da SXX"; `architecture.md` repetia a lista de ADRs; `brand.md` e
`assets-3d.md` se sobrepunham; o `CHANGELOG` tinha 628 linhas de implementação.
Cada sessão nova pagava esse custo em contexto, e os nomes `S3.2`/`S7.1`
quebravam o padrão.

## Decisão

1. **Documento por tipo**, não por sessão:
   - `docs/guide/` — como fazer (setup, testing, release);
   - `docs/reference/` — como as coisas são (arquitetura, dados, design, marca,
     plano, privacidade);
   - `docs/adr/` — por que uma decisão foi tomada;
   - `docs/roadmap/` — o que vem agora;
   - `docs/state/` — onde paramos;
   - `docs/releases/` — notas usadas no GitHub.
2. **Mapa com atalho por seção** em `docs/README.md`: a pergunta leva ao arquivo
   e à seção, não ao arquivo inteiro.
3. **Roadmap numerado:** `main.md` é sempre o roadmap ativo. Quando um ciclo
   fecha, ele é renomeado para `NNNN-titulo.md` (quatro dígitos) e um novo
   `main.md` começa. O `README.md` do diretório é o índice.
4. **Orçamento de contexto com CI:** `scripts/check-docs.mjs` valida links
   relativos (inclusive `<img src>`), limita `AGENTS.md` a 100 linhas,
   `CURRENT.md` a 60 e specs a 90, e proíbe histórico em `reference/`.
5. **História não se reescreve:** `CHANGELOG`, `ADRs`, `docs/releases/` e specs
   antigas são registro. Ao fechar uma fase, as specs saem do working tree (o
   Git guarda) e uma página em `roadmap/NNNN-*.md` resume as entregas.
6. **Protocolo de leitura:** `AGENTS.md` + `CURRENT.md` + a spec; qualquer outro
   assunto custa uma seção.

## Consequências

- Docs vivos caíram de 2.732 para **1.300 linhas**; o total, de 7.428 para
  ~4.100, com o mesmo conteúdo útil.
- Sessões novas leem ~200 linhas antes de codar; o mapa por seção evita abrir
  arquivos de 400 linhas para uma regra.
- Link quebrado e orçamento estourado passam a reprovar o CI.
- Custo único: mover arquivos quebrou links externos (README, ADRs) e exigiu
  atualizar as referências; links antigos em ADRs/specs ficam como história.

## Alternativas descartadas

- **Docs planos com prefixos** (`guide-*.md`): não separa "como" de "por quê" e
  volta a misturar histórico.
- **Um roadmap por fase** (`mvp.md`, `next.md`): o nome muda a cada ciclo; com
  dez roadmaps o diretório fica ambíguo. `main.md` + numeração é estável.
- **Sem orçamento automatizado:** a documentação volta a crescer na primeira
  sessão apressada.
