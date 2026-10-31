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
10. ISBN com a tabela oficial de ranges (substitui a máscara fixa da S3.2):
    - baixar `https://www.isbn-international.org/export_rangemessage.xml`
      (International ISBN Agency) e gerar `src/lib/isbn-ranges.ts` com prefixo
      EAN, grupo e as regras `range → tamanho`; guardar
      `MessageSerialNumber`/`MessageDate` no cabeçalho;
    - script Node puro (`scripts/build-isbn-ranges.mjs`) para regenerar a
      tabela a partir do XML; roda no desenvolvimento, nada de rede em runtime;
    - `formatIsbnInput` resolve grupo/registrant/publicação pela tabela e
      continua funcionando na digitação parcial (10 ou 13 dígitos);
    - testes com grupos diferentes: `978-0-306-40615-7`,
      `978-85-359-0277-8`, `978-3-16-148410-0`, `979-10-90636-07-1` e ISBN-10;
    - atualizar `docs/data-model.md` (o banco continua sem hífen) e a
      documentação da máscara.
11. Avisos do terminal:
    - **Require cycle** (`library/index → BookDetailScreen → genres/index →
      GenresScreen → library/index`): trocar import de barril por caminho
      direto (`@/features/library/use-books`, `@/features/library/genre`) em
      `GenresScreen` e `FilaScreen`; conferir `npx expo start` limpo.
    - **`ImageBackground is deprecated`**: vem do `react-native-css-interop`
      (NativeWind 4), que registra `ImageBackground` no boot; não é código do
      app. Confirmar, registrar em ADR 0006 e decidir entre aceitar, migrar
      para NativeWind 5 ou patchear. Não esconder com `LogBox.ignoreLogs`.
12. Capa na Fila: usar `BookCover` no card "Próxima parada" e nas linhas de
    "Depois" (tamanho compacto), com fallback `Spine` e a fita do gênero;
    manter `onOpenBook`; testar com e sem capa.

## Aceite

- [ ] Estante usa lombada 3D por gênero+status e capa real quando cadastrada.
- [ ] Nenhum placeholder do template em ícone/splash/estante.
- [ ] Mascote aparece na Hoje e no estado vazio da Estante com o estado certo.
- [ ] Assets com alpha, sem metadados e com nomes ASCII.
- [ ] Bundle Android não cresce mais que ~1,5 MB com os assets novos.
- [ ] Máscara do ISBN usa a tabela oficial e acerta grupos diferentes (0, 85,
      3, 979), gerada por script com a data do XML.
- [ ] `npx expo start` sem require cycle; o aviso de `ImageBackground` está
      explicado e decidido (não escondido).
- [ ] Fila mostra a capa real na próxima parada e em "Depois", caindo na
      lombada quando não há capa.
- [ ] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes.
- [ ] Conferido no Android pelo dono.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `docs/brand.md`,
`docs/design/design-system.md`, `docs/security-privacy.md`,
`src/features/library/`, `src/features/queue/`, `src/components/ui/Spine.tsx`,
`src/lib/isbn.ts`, `app.config.ts`.

`react-native-svg` já entrou na S3.2 (`Bookmark`); não instalar de novo.

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
- **Tabela de ISBN:** o XML oficial tem milhares de regras e muda com
  frequência; compactar por grupo, gerar com script e fixar a data/serial. Não
  consultar a rede em runtime.
- **Aviso do `ImageBackground`:** é de dependência (NativeWind 4); patch pode
  quebrar atualização do pacote. Preferir aceitar documentado ou migrar.
- **Capa na Fila em tamanho compacto:** conferir raio/borda e a fita no
  72×104, onde a margem da fita pesa mais.

## Próximo depois desta

S5 — registro de leitura (`docs/sessions/S05-registro-de-leitura.md`).
