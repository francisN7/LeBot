# S04a — Identidade 3D vetorial: lombadas e mascote

## Objetivo

Dar identidade própria à Estante e à Hoje sem depender de binários: lombada 3D
**paramétrica** (cor do gênero + status) e mascote LêBot com os seis estados,
desenhados em `react-native-svg`, mais ícone/splash definitivos gerados por
script. Qualquer hex de gênero personalizado (S3.2) funciona.

## Decisão de arte (ADR 0011)

A spec original pedia 24 lombadas (`spine-<cor>-<expressao>.webp`) e 6 mascotes
raster. Desde a S3.2 o gênero tem hex livre: um gênero personalizado nunca teria
asset. A arte passa a ser **vetorial e paramétrica**:

- a cor base vem de `colorLight` do gênero; sombra e brilho são derivados por
  mistura com `navy` e `cream` (`src/lib/color-mix.ts`);
- a expressão vem do status (`spine-art.ts`);
- o mascote é desenhado uma vez, com estado por prop;
- raster só para `assets/images/` (ícone, adaptativo, monocromático, splash,
  favicon), gerado de um SVG-fonte por `scripts/build-icons.mjs`.

Ganho: bundle praticamente sem crescimento, zero EXIF/alpha, nenhum fallback
"gênero desconhecido" para cor. A lombada 2D continua existindo para quando o
componente é usado sem status.

## Fora de escopo

- Tabela oficial do ISBN, require cycle, aviso de `ImageBackground` e capa na
  Fila → **S4b** (`docs/sessions/S04b-isbn-avisos-fila.md`).
- Motor do plano, progresso de leitura e fila automática (S5–S8).
- Física/3D real e rig do mascote: SVG + Reanimated bastam.
- Tema escuro e paleta nova.
- Publicação de loja e screenshots (S12).

## Antes de começar

1. Spec dividida; S4 no roadmap virou S4a + S4b.
2. `react-native-svg` (15.16) e `react-native-reanimated` (4.7.1) já instalados.

## Tarefas

1. `docs/design/assets-3d.md`: grade de tamanhos, estados do mascote,
   combinação cor × expressão, pipeline vetorial e o passo raster do ícone.
2. `src/lib/color-mix.ts`: `parseHex`, `mixHex`, `shadeHex`, `tintHex` puros,
   com fallback para hex inválido.
3. `src/features/library/spine-art.ts`: mapa **cor do gênero + status** →
   `expression` (`happy` | `sleepy` | `shine` | `neutral`) + `palette`
   (`base`, `shade`, `highlight`, `ink`), com `kind: 'fallback'` quando não há
   status ou o hex é inválido.
4. `Spine` ganha `status` opcional: com status desenha a lombada 3D em SVG
   (capa, brilho, etiqueta opaca de título e rosto); sem status mantém a lombada
   2D atual. Preserva `onPress`, `accessibilityLabel`, tokens e modo compacto.
5. `Mascot` em `src/components/ui/`: `state`, `size`, `accessibilityLabel`;
   Reanimated para respiração e piscada; usa na Hoje (saudação) e no estado
   vazio da Estante.
6. Estante: profundidade discreta (sombra navy deslocada por camada), capa real
   quando existir, lombada 3D com status quando não, e transição suave ao trocar
   filtro/busca.
7. Ícone e splash definitivos: `brand/source/icon.svg` (robô da marca) +
   `scripts/build-icons.mjs` (sharp, desenvolvimento) gerando `icon.png`,
   `android-icon-foreground/background/monochrome.png`, `splash-icon.png` e
   `favicon.png`; `app.config.ts` ajustado se preciso.
8. Testes: `color-mix`, `spine-art` (status→expressão, hex personalizado,
   inválido, tema escuro), `Spine` com e sem status, `Mascot` por estado,
   Estante com e sem capa e no estado vazio. Sem snapshot de imagem.
9. Docs: `design-system.md`, `architecture.md`, `brand.md`, `CHANGELOG.md`.

## Aceite

- [x] Estante usa lombada 3D por gênero+status e capa real quando cadastrada.
- [x] Lombada funciona com hex personalizado, sem asset nem lista fixa.
- [x] Nenhum placeholder do template em ícone/splash/estante.
- [x] Mascote aparece na Hoje e no estado vazio da Estante com o estado certo.
- [x] Assets raster só em `assets/images/`, opacos/monocromáticos corretos e
      sem metadados; fonte SVG versionada em `brand/source/`.
- [x] Bundle Android não cresce mais que ~300 KB (nenhuma arte entra no bundle).
- [x] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes.
- [ ] Conferido no Android pelo dono.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `docs/brand.md`,
`docs/design/design-system.md`, `src/theme/`, `src/features/library/`,
`src/features/today/`, `src/components/ui/{Spine,BookCover,Bookmark}.tsx`,
`app.config.ts`, `brand/source/`.

## Riscos

- **Legibilidade:** rosto e brilho atrás do texto pequeno; a etiqueta de título
  continua sobre superfície opaca (`cream`).
- **Reanimated no Jest:** o mock precisa existir no setup; se travar, a animação
  fica atrás de `reduceMotion` e o teste cobre só o estado estático.
- **Hex inválido:** gênero corrompido no banco não pode quebrar a lista; o mapa
  cai na lombada 2D com `navyMuted`.
- **Monocromático do Android:** o ícone precisa ser silhueta com alpha; conferir
  no launcher, não só no arquivo.
- **`sharp` como devDependency:** usado só no script; não entra no bundle. Se o
  download falhar, os PNGs já commitados continuam válidos.
- **Tema escuro:** `resolveGenreColor(..., 'dark')` já é aceito pelo mapa, mas a
  UI continua no claro até o backlog.

## Próximo depois desta

S4b — ISBN oficial, avisos do terminal e capa na Fila
(`docs/sessions/S04b-isbn-avisos-fila.md`).
