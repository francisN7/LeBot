# S04 — Identidade 3D: mascote e lombadas

## Objetivo

Trocar os placeholders de lombada e de ícone por uma identidade própria:
lombadas 3D por gênero/status, mascote do LêBot nos estados previstos e a
Estante com sensação de profundidade — sem perder legibilidade nem o offline.

## Fora de escopo

- Motor do plano, progresso de leitura e fila automática (S5–S8).
- Animações de física/3D real (`react-native-svg` + Reanimated bastam; o
  mascote ganha animação de estado, não um rig 3D).
- Tema escuro e nova paleta (o token set da S1 continua valendo).
- Publicação de loja e screenshots de marketing (S12).

## Antes de começar

1. Confirmar no Android o aceite da S3 (tipografia, cadastro, busca, edição,
   exclusão e capa) e da S3.2 (gêneros e cores).
2. Marcar S3/S3.2 como `[x]` em `docs/roadmap.md` e atualizar
   `docs/state/CURRENT.md`.

## Tarefas

1. Criar `docs/design/assets-3d.md`: grid de tamanhos, estados do mascote,
   combinações cor×expressão da lombada, pipeline de export (WebP com alpha,
   sem EXIF) e política de cache.
2. Produzir a arte-fonte em `brand/source/` e exportar o mínimo viável:
   - lombadas para os 6 gêneros × 4 status (`spine-<cor>-<expressao>.webp`);
   - mascote neutro, lendo, feliz, sonolento, pensando e comemorando.
3. `src/features/library/spine-art.ts`: mapa puro **cor do gênero + status** →
   asset, com fallback para a lombada 2D atual quando o asset não existir e
   para capa cadastrada (`cover_uri`) quando houver. A cor vem do par
   `color_light`/`color_dark` do gênero (S3.2), não de uma lista fixa.
4. Atualizar `Spine` (ou criar `SpineArt`) para renderizar o asset, preservando
   `onPress`, `accessibilityLabel`, tamanhos do token e o modo compacto.
5. `Mascot` em `src/components/ui/`: props `state` e `size`, `accessibilityLabel`
   descritivo. Animações discretas com Reanimated: respiração/idle, piscada e
   transição suave ao trocar de estado (sem física 3D). Usar na tela Hoje
   (saudação) e no estado vazio da Estante.
6. Estante: grade com profundidade discreta (sombra/offset por camada), capa
   real quando existir e transição suave ao trocar filtro/busca.
7. Ícone e splash definitivos em `assets/images/` (adaptativo Android,
   monocromático, safe zone); atualizar `app.config.ts` se preciso.
8. Testes: mapa lógico de `spine-art` (fallback, gênero/status desconhecidos),
   `Mascot` por estado, Estante com e sem capa. Sem snapshot de imagem.
9. Docs: `design-system.md`, `architecture.md`, `brand.md` e `CHANGELOG.md`.

## Aceite

- [ ] Estante usa lombada 3D por gênero+status e capa real quando cadastrada.
- [ ] Nenhum placeholder do template em ícone/splash/estante.
- [ ] Mascote aparece na Hoje e no estado vazio da Estante com o estado certo.
- [ ] Assets com alpha, sem metadados e com nomes ASCII.
- [ ] Bundle Android não cresce mais que ~1,5 MB com os assets novos.
- [ ] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes.
- [ ] Conferido no Android pelo dono.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `docs/brand.md`,
`docs/design/design-system.md`, `docs/security-privacy.md`,
`src/features/library/`, `src/components/ui/Spine.tsx`, `app.config.ts`.

## Riscos

- **Peso do bundle:** 24 lombadas + 6 mascotes em WebP pode estourar; medir com
  `expo export` e cortar estados não usados.
- **Legibilidade:** arte 3D atrás de texto pequeno prejudica contraste; manter
  a etiqueta de título sobre superfície opaca.
- **Estados sem asset:** o fallback 2D precisa continuar bonito e coberto por
  teste.
- **Assets no repo público:** nada de foto real, marca de terceiro ou fonte
  sem licença; arte é do projeto (MIT).
- **Android antigo:** WebP com alpha é suportado, mas conferir no device antes
  de remover o fallback.
- **Gênero personalizado (S3.2):** a cor vem do par claro/escuro do gênero. A
  arte precisa funcionar com qualquer hex (ou cair no fallback 2D quando a
  combinação não existir), sem assumir as 6 cores fixes da S1.

## Próximo depois desta

S5 — registro de leitura (`docs/sessions/S05-registro-de-leitura.md`).
