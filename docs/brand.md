# Brand — LêBot

Documento de identidade visual. Fonte da verdade para UI, README e loja.

## Origem

`brand/source/` guarda os PNGs originais (2200px de largura, fundo creme `#FFF6E8`):

| Arquivo | Conteúdo |
|---|---|
| `lebot-robo@2x.png` | mascote robô segurando um livro + 3 lombadas de teste |
| `lebot-selos@2x.png` | 6 variações de selo/ícone com a wordmark |

## Logo

- **Lockup principal:** robô + wordmark `LêBot` (selos 1, 2, 4 e 5).
- **Ícone isolado:** robô com livro, sem texto, para launcher e avatar.
- **Monocromático:** versão clara/escura para fundos e Material You.
- **Regra:** não recriar a wordmark com fonte; usar o SVG (a anteninha no "ê" é parte da marca).

## Paleta

| Token | Hex | Uso |
|---|---|---|
| `cream` | `#FFF6E8` | fundo principal |
| `pink` | `#FF8FA3` | primária / fundo do ícone |
| `pink-soft` | `#FFB1BF` | gradientes e estados |
| `navy` | `#2A2340` | texto e rosto do robô |
| `gold` | `#FFC145` | olhos e destaques |
| `gold-deep` | `#F4B43A` | moldura do livro |
| `coral` | `#FF6B5B` | alerta / lombada |
| `teal` | `#34C6B8` | sucesso / lombada |
| `purple` | `#7B69EE` | lombada / estados "pensando" |

Contraste: texto sempre em `navy` sobre `cream`; nunca texto pequeno em `gold` ou `pink`.

## Tipografia

- **Títulos:** Fredoka (600/700).
- **Corpo:** Nunito (400/600/700).
- **Números e dados:** Nunito com `font-variant-numeric: tabular-nums` quando disponível.
- Ambas do Google Fonts e com acentos PT-BR.

## Mascote

Nome: LêBot. Personalidade: otimista, levemente nerd, nunca culpabiliza o leitor.

| Estado | Quando usar |
|---|---|
| neutro | telas padrão e onboarding |
| lendo | sessão de leitura ativa |
| feliz | meta do dia batida, streak |
| sonolento | livro pausado, dia de descanso |
| pensando | dicas do plano e estatísticas |
| comemorando | livro concluído e resenha |

## Lombadas 3D

Sistema de ícone de livro:

- **Cor = gênero** (ex.: fantasia = roxo, romance = coral, não-ficção = teal, clássico = navy, infantojuvenil = gold, terror = pink).
- **Expressão = status** (lendo = feliz, pausado = sonolento, concluído = brilho, DNF = neutro).
- Sem capa cadastrada, a lombada vira a capa padrão.
- Formato de runtime: WebP com alpha, 256–512px; nome `spine-<cor>-<expressao>.webp`.

## Voz e tom

- Fala em primeira pessoa, curta: "Hoje são 18 páginas. Dá tempo."
- Nunca usa "você falhou"; usa "vamos ajustar".
- Nada de culpa por abandonar um livro (DNF é uma escolha válida).

## Pipeline de assets

1. Fonte em `brand/source/` (PNG @2x).
2. Export otimizado: WebP com alpha em `src/assets/`; PNG opaco em `assets/` para ícone/splash.
3. Remover metadados EXIF antes de commitar.
4. Nomes ASCII: `lebot-robo`, `spine-purple-happy`, `mascot-thinking`.
