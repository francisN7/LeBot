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

## Gêneros e cores

Desde a S3.2 o gênero é dado do dono, não enum: ele cria, renomeia, recolore e
exclui. Cada gênero guarda um par de hexes (claro + escuro) escolhido de uma
paleta de 10 ou digitado à mão.

| # | Preset | Claro | Escuro |
|---|---|---|---|
| 0 | purple | `#7B69EE` | `#B3A7FF` |
| 1 | coral | `#FF6B5B` | `#FF9A8F` |
| 2 | teal | `#34C6B8` | `#6FE3D6` |
| 3 | navy | `#2A2340` | `#8B84A8` |
| 4 | gold | `#FFC145` | `#FFD980` |
| 5 | pink | `#FF8FA3` | `#FFB3C1` |
| 6 | blue | `#4C7DFF` | `#8FAFFF` |
| 7 | green | `#3FA45B` | `#7DD99A` |
| 8 | orange | `#FF9F43` | `#FFC182` |
| 9 | plum | `#A65CC9` | `#D19AEB` |

Os 6 gêneros de fábrica repetem as cores da marca: fantasia = purple,
romance = coral, não-ficção = teal, clássico = navy, infantojuvenil = gold,
terror = pink. A cor vira fundo da lombada e da fita sobre a capa; o contorno
segue navy. Mudar a paleta no código **não** repinta gêneros já salvos.

O tema escuro ainda não existe: o par escuro fica guardado e entra no backlog.
Contraste: textos seguem em navy sobre creme; o teste da paleta exige 3:1
contra o creme ou contra o navy.

## Lombadas 3D

Sistema de ícone de livro:

- **Cor = gênero** (do banco: a escolhida na S3.2, com padrão por preset).
- **Expressão = status** (lendo = feliz, quero ler = neutro, pausado =
  sonolento, concluído = brilho).
- Sem capa cadastrada, a lombada vira a capa padrão; com capa, a fita do gênero
  aparece no canto superior esquerdo.
- Formato de runtime: **SVG paramétrico** (`react-native-svg`), não imagem. A
  sombra e o brilho vêm da cor do gênero, então qualquer hex personalizado
  funciona. Detalhes em `docs/design/assets-3d.md` (ADR 0011).

## Voz e tom

- Fala em primeira pessoa, curta: "Hoje são 18 páginas. Dá tempo."
- Nunca usa "você falhou"; usa "vamos ajustar".
- Nada de culpa por abandonar um livro (DNF é uma escolha válida).

## Pipeline de assets

1. **Marca e personagem:** código vetorial. Lombada em
   `src/features/library/spine-art.ts` + `SpineArtwork`; mascote em
   `Mascot.tsx`. Mudar o desenho é mudar código e rodar os testes.
2. **Ícone, adaptativo, monocromático, splash e favicon:** fonte em
   `brand/source/mark.svg` / `mark-mono.svg`, export para `assets/images/` com
   `node scripts/build-icons.mjs` (sharp em dev, compressão 9, sem metadados).
3. **Arte-fonte de referência:** `brand/source/*.png` continua versionado, mas
   não vai para o bundle.
4. Nomes ASCII e minúsculos: `mark`, `mark-mono`, `icon`, `splash-icon`.
