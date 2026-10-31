# ADR 0011 — Arte vetorial paramétrica (lombadas e mascote)

- **Status:** aceito
- **Data:** 2026-10-31
- **Sessão:** S4a

## Contexto

A S4 nasceu com uma lista fixa de assets: 24 lombadas
(`spine-<cor>-<expressao>.webp`, 6 gêneros × 4 status) e 6 mascotes raster, com
fallback 2D quando a combinação não existisse.

Duas coisas mudaram o problema:

1. Na S3.2 o gênero virou dado do dono, com hex livre (`color_light` /
   `color_dark`). Um gênero personalizado nunca teria asset, então o fallback
   deixaria de ser exceção e viraria o caso comum.
2. As lombadas da marca são formas simples — corpo arredondado, faixa de sombra,
   duas faixas claras e um rosto. Isso cabe em SVG, sem perda perceptível.

Restrições: Android antigo com WebP, peso do bundle (critério de ~1,5 MB),
legibilidade de texto sobre a arte, nada de rede em runtime.

## Decisão

**A lombada e o mascote são vetoriais e paramétricos, desenhados em
`react-native-svg`.** Raster existe só em `assets/images/` (ícone, camada
adaptativa, monocromático, splash e favicon), gerado de um SVG-fonte.

- `src/features/library/spine-art.ts` é um mapa puro
  `cor + status → { expression, palette }`; a paleta deriva sombra e brilho da
  cor do gênero (`mixHex`) e escolhe a cor do rosto por contraste WCAG.
- `Spine` renderiza a arte quando recebe `status` e mantém o bloco 2D chapado
  quando não recebe (fallback para status desconhecido ou hex inválido).
- `Mascot` desenha os seis estados da marca em um único SVG; Reanimated cuida da
  respiração e da piscada.
- `brand/source/mark.svg` e `mark-mono.svg` são a fonte do ícone;
  `scripts/build-icons.mjs` (sharp, devDependency) gera os PNGs e remove
  metadados.

## Consequências

- Qualquer hex de gênero funciona; não há matriz de assets para manter.
- Bundle praticamente não cresce; `react-native-svg` já estava no app desde a
  S3.2.
- Zero EXIF/alpha: o problema de "WebP com transparência no Android antigo"
  deixa de existir.
- A arte é testável como função pura (`spine-art`, `color-mix`) e como
  componente (`Spine`, `Mascot`), sem snapshot de imagem.
- Ajustar o desenho é mudar código, não reexportar PNG.
- `sharp` só roda no desenvolvimento; os PNGs são commitados e o script pode
  ser reexecutado.
- O critério "assets com alpha/nomes ASCII" da spec original foi substituído por
  "fonte SVG versionada + PNGs sem metadados".

## Alternativas descartadas

- **24 WebP + 6 mascotes raster:** cobre só os presets, pesa no bundle e exige
  fallback justamente para o caso que o dono mais usa (cor personalizada).
- **Híbrido (lombada vetorial, mascote raster):** dois pipelines e dois jeitos
  de ajustar arte, sem ganho visual.
- **Renderizar SVG em tempo de build:** perde a cor do banco; a lombada depende
  de dado, não de asset estático.
- **3D real (three.js / rig):** escopo e peso incompatíveis com um app offline
  de leitura.
