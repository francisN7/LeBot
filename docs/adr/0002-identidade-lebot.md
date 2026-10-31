# ADR 0002 — Identidade LêBot

- **Status:** aceito
- **Data:** 2026-10-31

## Decisão

- **Nome de exibição:** LêBot (com acento).
- **Identificadores técnicos:** `lebot` (slug, scheme, repo, pacote npm).
- **Android package / iOS bundle:** `com.francis.lebot`.
- **Arte-fonte:** `brand/source/` (não vai para o bundle).
- **Exports do app:** `assets/` (ícone/splash, referenciados no `app.config.ts`) e `src/assets/` (mascote, lombadas, fontes).
- **Ícone do launcher:** apenas o robô com o livro, sem wordmark (legibilidade em 48px).
- **Splash/README:** lockup completo com wordmark.
- **Wordmark:** asset SVG, não texto, para preservar a anteninha no "ê".
- **Tipografia:** Fredoka (títulos) + Nunito (corpo), ambas com acentos PT-BR.
- **Sistema de lombadas:** cor = gênero, expressão = status. É o "ícone 3D" padrão de cada livro e também a capa fallback.

## Paleta

| Token | Hex |
|---|---|
| `cream` | `#FFF6E8` |
| `pink` | `#FF8FA3` |
| `pink-soft` | `#FFB1BF` |
| `navy` | `#2A2340` |
| `gold` | `#FFC145` |
| `gold-deep` | `#F4B43A` |
| `coral` | `#FF6B5B` |
| `teal` | `#34C6B8` |
| `purple` | `#7B69EE` |

## Consequências

- Um único sistema visual cobre todos os livros sem gerar arte por título.
- O mascote pode virar o "coach" do app (dicas do plano, celebração de streak).
- A arte é suficiente para o MVP; não há dependência de renderização 3D em tempo real.

## Pendências

- Licença da arte (MIT junto do código ou CC BY para a arte) — resolver na S0.
- Vetorização da wordmark e dos 6 selos para exports limpos.
