# Marca e arte

**O que responde:** identidade, paleta, gêneros, lombada, mascote, ícone/splash,
movimento e pipeline de assets. **O que não responde:** tokens e componentes do
dia a dia ([`design-system.md`](design-system.md)) nem o fluxo das telas
([`architecture.md`](architecture.md)).

## Origem

`brand/source/` guarda os PNGs originais (2200 px, fundo `#FFF6E8`): o robô com
lombadas (`lebot-robo@2x.png`) e os seis selos (`lebot-selos@2x.png`).

## Logo

- **Lockup principal:** robô + wordmark `LêBot` (selos 1, 2, 4 e 5).
- **Ícone isolado:** robô com livro, sem texto, para launcher e avatar.
- **Monocromático:** versão clara/escura para fundos e Material You. Não recriar a
  wordmark com fonte: a anteninha no "ê" é parte da marca.

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

Contraste: texto sempre em `navy` sobre `cream`; nunca texto pequeno em `gold` ou
`pink`.

## Tipografia

Fredoka (600/700) para títulos, Nunito (400/600/700) para corpo, ambas do Google
Fonts e com acentos PT-BR. Números usam `tabular-nums` quando disponível.

## Mascote

Nome: LêBot. Personalidade: otimista, levemente nerd, nunca culpabiliza o leitor.

| Estado | Quando usar | Desenho |
|---|---|---|
| `neutral` | telas padrão, vazio | olhos redondos, piscada |
| `reading` | sessão de leitura ativa | olhos baixos, livro aberto |
| `happy` | meta batida, sequência | olhos em estrela, sorriso |
| `sleepy` | pausa, dia de descanso | olhos fechados e "z" |
| `thinking` | dicas do plano, busca vazia | balão de pensamento |
| `celebrating` | livro concluído, resenha | boca aberta e confete |

Respiração de 1,0 a 1,025 em 1,8 s e piscada de 90 ms a cada ~2,6 s nos estados
de olhos redondos. O wrapper anuncia o estado (`mascotLabel`); o SVG é decorativo.
Voz: primeira pessoa, curta, sem culpa — "Hoje são 18 páginas. Dá tempo.", nunca
"você falhou"; abandonar um livro é escolha válida.

## Gêneros e cores

O gênero é dado do dono: ele cria, renomeia, recolore e exclui. Cada gênero
guarda um par de hexes (claro + escuro) de uma paleta de 10 ou digitado à mão.

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

Os 6 gêneros de fábrica repetem a marca: fantasia = purple, romance = coral,
não-ficção = teal, clássico = navy, infantojuvenil = gold, terror = pink. A cor
vira fundo da lombada e da fita sobre a capa; o contorno segue navy. Mudar a
paleta no código **não** repinta gêneros já salvos.

O tema escuro ainda não existe: o par escuro fica guardado e entra no backlog. O
teste da paleta exige 3:1 contra o creme ou contra o navy.

## Lombada

Sistema de ícone de livro:

- **Cor = gênero** (do banco, com padrão por preset).
- **Expressão = status:** `reading` feliz, `queued` neutro, `paused` sonolento,
  `finished` brilho.
- Sem capa, a lombada é a capa padrão; com capa, a fita do gênero fica no canto
  superior esquerdo.
- Runtime **SVG paramétrico** (`react-native-svg`), sem imagem no bundle; sombra
  e brilho vêm da cor, então qualquer hex funciona (ADR 0011).

Tamanhos em [`design-system.md`](design-system.md) (tokens). A lombada é sempre
**1:2** (64×128, 52×104 e mini 30×60) e tem a mesma altura da capa
(88×128/72×104). Ela é mais estreita que a capa de propósito: lê como livro ao
lado da foto, sem parecer fita, e mantém o alinhamento de cards, Ordem, Hoje e
detalhe.

### Cores da lombada (`spine-art.ts`)

- `base` = hex do gênero; `edge` = vinco/arestas (mistura 20–28%); `light` = luz
  do gradiente (16–20% de creme); `shadow` = contato (55%); `highlight` = faixas
  e brilho (28–60% de creme). `gradient` = `[edge, base, light, edge]`.
- `ink` = navy quando o contraste com a base é ≥ 3:1, senão creme — garante rosto
  visível no preset navy e em cores escuras personalizadas.
- Sem status ou com hex inválido, usa a lombada 2D chapada em `navyMuted`.

### Modelo B (64×128)

- **Corpo:** gradiente horizontal de quatro paradas, sombra vertical discreta,
  headband/tailband listradas (7 e 111 px) e duas nervuras (52 e 103 px).
- **Etiqueta:** retângulo creme com borda navy, centralizado (11–53 × 19–38),
  só o título, até duas linhas. Fredoka 600 de 7 a 5 px via `fitSpineTitle`;
  abaixo disso, ellipsis. É uma View com texto real, não texto no SVG;
  `showLabel` esconde (mini-lombadas).
- **Tassel T1:** canto superior esquerdo, corda em y=2.1, corpo, pescoço e franja
  de seis fios, dourado com gradiente e sombra radial. Balança para a esquerda:
  ataque de ~400 ms até 10°, franja a 12,5° ~90 ms depois, retorno com overshoot
  de 1,6°, ciclo de 4,4 s (ADR 0023).
- **Rosto e zzz:** olhos `happy` com spread 10 (os outros, 8); "zzz" em diagonal
  no canto direito, opacidade 1 → 0,3, só em `sleepy`.
- **Camadas:** corpo, faixas e nervuras num SVG estático; brilho, piscada, "zzz"
  e tassel em Views recortadas. Só a camada que anima é invalidada por frame
  (ADR 0024). O `Pressable` é transparente: o contorno navy vem do SVG.

## Capa personalizada como livro

A foto não é coberta por páginas: a profundidade vem de sombra e luz **sobre a
própria foto**, para as cores continuarem no fundo.

- **Vinco de lombada:** preto 38% na borda esquerda (0–14%) com fio de luz creme
  em 13–20%.
- **Sombra de borda:** preto 42% à direita (76–100%) e 30% na base (88–100%), com
  fio de luz no topo/esquerda.
- **Selo de status** no canto inferior direito: quadrado creme com borda navy e
  o mesmo `SpineFace`, largura `width * 0.26` limitada a 18–26 px.

A fita do gênero fica no topo esquerdo; o brilho diagonal (`animated`) passa sob
a camada de sombra.

## Ícone e splash

| Arquivo | Tamanho | Regra |
|---|---|---|
| `icon.png` | 1024² | fundo pink cheio, marca a 86% (o SO arredonda) |
| `android-icon-background.png` | 1024² | pink sólido |
| `android-icon-foreground.png` | 1024² | marca a 80%, transparente |
| `android-icon-monochrome.png` | 1024² | silhueta preta com olhos vazados |
| `splash-icon.png` | 768² | marca a 90%, transparente, sobre creme |
| `favicon.png` | 64² | fundo pink, marca a 80% |

```bash
node scripts/build-icons.mjs
```

O script rasteriza no tamanho final (redimensionar depois deixa halo), usa
compressão 9 e não grava metadados.

## Movimento

Regra: a **grade** reage (toque, status, entrada); o **detalhe** respira (loop
contínuo, porque há um livro só).

| Elemento | Gesto | Onde |
|---|---|---|
| Lombada | mola de escala 0,97 e inclinação −2° no toque | grade e detalhe |
| Lombada | piscada: olhos somem 70 ms a cada ~2,9 s | `happy`, `neutral` |
| Lombada | brilho varre o corpo a cada ~3,3 s; "zzz" pisca em `sleepy` | todas |
| Lombada | tassel: 10° à esquerda, franja 12,5° ~90 ms depois, ciclo 4,4 s | todas |
| Lombada | flutuação de 3% e −2,4 px, ida e volta em 4,4 s | só `animated` |
| Capa | mola de escala 0,97 e inclinação −1,5°; brilho diagonal em 1,7 s | grade / detalhe |
| Capa | selo pisca como a lombada | `happy`, `neutral` |
| Grade | `FadeInDown` com 45 ms por card (máx. 6), só a primeira leva | abrir/filtrar/buscar |
| Mascote | respiração 1,04 e −2 px em 4 s; piscada de 90 ms a cada ~2,8 s | sempre |
| Mascote | acessórios pulsam entre 1 e 0,35; fade de 200 ms ao trocar de estado | `sleepy`, `celebrating` |

Piscada da lombada e do selo vivem no mesmo `SpineFace`: não duplique os tempos.
Tudo usa `transform`/`opacity` no UI thread, sem mexer em layout. Sem
`useReducedMotion` por enquanto (backlog de acessibilidade).

## Pipeline

1. **Marca e personagem:** código vetorial. Lombada em
   `src/features/library/spine-art.ts` + `SpineArtwork`; mascote em `Mascot.tsx`.
   `resolveSpineArt` é puro e barato; não o chame em laço de animação.
2. **Ícone, adaptativo, monocromático, splash e favicon:** de
   `brand/source/mark.svg` / `mark-mono.svg` para `assets/images/` com
   `node scripts/build-icons.mjs` (sharp, compressão 9, sem metadados).
3. **Arte-fonte de referência:** `brand/source/*.png` versionado, fora do bundle.
4. Nomes ASCII e minúsculos; **nada de rede em runtime**.
