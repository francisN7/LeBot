# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Cada sessão é uma entrada; a mais recente vem primeiro.

## [Unreleased]

### Added

- S8a: troca rápida de status na Estante. Segurar o chip (~500 ms) abre uma
  roda radial flutuante na mesma tela, centrada no toque do chip; as quatro
  opções abrem em círculo com mola e a opção sob o dedo ganha destaque. Deslizar
  só pré-visualiza (o rosto/capa e o chip mudam) e soltar grava via `useBooks`;
  voltar ao miolo ou tocar fora cancela. O gesto é um `Pan` da RNGH com
  `activateAfterLongPress(500)`, e a roda fica na mesma janela (sem `Modal`) para
  o toque continuar. A geometria ângulo → status é pura
  (`status-wheel-geometry.ts`); o chip expõe a ação "Trocar status" e as opções
  são botões no leitor de tela. Concluir agora preenche as páginas lidas no
  repositório de livros (formulário e roda), com a mesma regra no repositório em
  memória (ADR 0018). 20 testes novos (350 na suíte); lint, typecheck, test,
  doctor e export verdes; conferido no Android em 2026-11-01.
- S8: Ordem automática e persistida em `queue_items` (migração aditiva `0005`):
  todo livro não concluído entra; `reading` forma o bloco "Lendo agora", com o
  primeiro coroado como principal, e `queued`/`paused` ficam em "Depois" com
  aviso. O status é a entrada/saída — sem adicionar/remover. Reordenar pela alça
  de três barras (toque longo, brilho e prévia; RNGH + Reanimated) ou por setas
  maiores com transição animada, sem cruzar blocos; "Sugerir ordem" alterna
  gênero por bloco. O motor usa o primeiro Lendo como principal (Hobbit 11 +
  Sapiens 7), não a sessão mais recente. `Screen` adota o `ScrollView` do gesture
  handler e o app monta `GestureHandlerRootView`; ADR 0016 e 0017. 17 testes
  novos (330 na suíte). Conferido no Android; o glitch de animação no drop via
  alça (setas ok) ficou no backlog.
- S7.1: registrar leitura retoma livro `paused`/`queued` como `reading` e
  conclui em `finished` (ADR 0015); Hoje ganha "Plano do dia" e "Lido hoje" com
  páginas e hora, meta batida sem fração acima de 100% e botão explícito em cada
  bloco ("Registrar leitura"/"Registrar mais"). A antiga Fila vira **Ordem**
  (rota `/ordem`, `QueueScreen`) somente leitura, e as abas passam a Estante,
  Hoje, Ordem, Ajustes. O selo "sugestão" agora segue o status: aparece em
  Pretendo Ler (`queued`) no plano, mesmo como bloco principal, e não em livro
  Lendo. 18 testes novos (313 na suíte). Conferido no Android em 2026-11-01.
- S7: tela Hoje com o plano real do motor: meta com volta leve, blocos por
  livro (capa/lombada, gênero, páginas e estado feito/agora/depois), sugestão
  com selo, registro a partir do bloco e vazio com CTA para a Fila. Plano
  recalculado a cada abertura (ADR 0014), `useRecentSessions` com janela de 7
  dias + sessão mais recente, `latest()` no repositório de sessões e `BookArt`
  compartilhado com a Fila. 13 testes novos (295 na suíte).
- S6: motor puro do plano diário em `src/features/planner/engine/`
  (`buildPlan`), com meta 3–200, volta leve após 3 dias, livro ativo em 7 dias,
  teto flexível de 60% a partir de meta 10, alternância de gênero e sugestão
  paralela da fila. 75 testes novos (282 na suíte), `docs/planner-algorithm.md`
  e ADR 0013.

### Changed

- S7 (revisão no Android): a tela foi aprovada e o dono abriu a **S7.1** —
  registrar leitura retoma livro pausado/fila (ADR 0015), Hoje antes da Ordem,
  Fila → Ordem (somente leitura) e blocos com ação explícita. A legenda da
  Ordem fica para a abertura da S7.1; o botão (i) com o mascote confuso ficou
  para depois da S12.
- Auditoria de documentação: `README.md`, `AGENTS.md`, `docs/INDEX.md`,
  `docs/architecture.md`, `docs/data-model.md`, `docs/testing.md`,
  `docs/design/*`, `docs/brand.md` e `brand/README.md` alinhados ao código da
  S5. Saíram referências a `src/assets/` e ao ícone/splash como placeholder; a
  UI do plano ficou marcada como S7 (o motor é S6). Os aceites das specs S3 e
  S4c, já entregues, foram marcados.

### Security

- CI: `actions/checkout`, `actions/setup-node` e `gitleaks/gitleaks-action`
  fixadas por SHA completo, com `persist-credentials: false` no checkout.
- `.gitignore` cobre keystore, bancos SQLite, logs, cobertura, `.idea/` e builds
  `.apk`/`.aab`, reduzindo o risco de um `git add -A` publicar dado local.
- Auditoria do repositório: nenhum segredo, PII ou credencial encontrada no
  HEAD ou no histórico. Os advisories moderados do `npm audit` são de toolchain
  e ficam no backlog do roadmap; `npm audit fix --force` rebaixaria o Expo para
  51 e não deve ser usado.

A S6 está concluída; a próxima sessão é a S7.

## S5.1 — Progresso não desce abaixo do histórico

### Added

- `reading_sessions.applied_pages` (migração aditiva `0004_clever_turbo.sql`):
  guarda quanto de cada sessão entrou em `books.pages_read`. Linhas antigas com
  `NULL` valem como `pages`.

### Changed

- `validateBookForm` recebe as páginas já registradas e recusa "Páginas lidas"
  abaixo delas; o formulário mostra "Já registradas: N" no campo.
- `update` do repositório de livros repete a guarda, mesmo se a UI for
  contornada.

### Fixed

- Desfazer sessão clampada desconta só o que entrou no progresso, não o valor
  digitado.
- ADR 0012 e `docs/data-model.md` descrevem o piso e a coluna nova.

## S5 — Registro de leitura e progresso

### Added

- `reading_sessions` (`src/db/schema.ts`, migração aditiva
  `0003_cloudy_pretty_boy.sql`): histórico de páginas por livro e por dia, com
  índice em `book_id` e `CHECK (pages > 0)`.
- `src/db/repositories/reading-sessions.ts`: `create` grava a sessão e soma em
  `books.pages_read` na mesma transação, com teto no total e `finished`
  automático; `remove` desconta (nunca abaixo de 0) e devolve o status para
  `reading` quando o livro deixa de estar concluído. `listByBook` e
  `listBetween` alimentam a UI e a futura tela de estatísticas.
- `src/features/reading/`: `useReadingSessions(bookId)`, `ReadingForm` (modal com
  páginas, +1/+10, aviso de clamp) e `ReadingProgressCard` (barra, páginas
  lidas, últimas leituras e desfazer).
- Detalhe do livro ganhou o card "Progresso"; o "Começar" da Fila abre o mesmo
  registro com as páginas do plano em vez do aviso "Em breve".
- ADR 0012 (histórico × coluna, clamp com aviso, status automático).

### Changed

- `useBooks` exporta `notifyBooksChanged`; `useReadingSessions` avisa o
  repositório de livros para o progresso aparecer na hora em todas as telas.
- `renderWithProviders` injeta `ReadingSessionsRepositoryProvider` e um
  repositório de leitura em memória ligado ao de livros.
- `docs/data-model.md`, `docs/architecture.md` e `docs/testing.md` cobrem a
  tabela, o fluxo e os testes da S5.

### Validated

- `lint`, `typecheck`, 203 testes, `expo-doctor` (20/20) e `expo export`
  (Android) verdes. Conferido no Android pelo dono junto com a S5.1 (207
  testes).

## S4b — ISBN oficial, avisos do terminal e capa na Fila

### Added

- `src/lib/isbn-ranges.ts`: tabela oficial de faixas do ISBN, gerada por
  `scripts/build-isbn-ranges.mjs` a partir do XML da International ISBN Agency
  (287 grupos, 1889 faixas), com serial e data no cabeçalho. O app não
  consulta a rede.
- `formatIsbnInput` resolve grupo, registrante e publicação pela tabela: cobre
  `978-0-306-40615-7`, `978-85-359-0277-8`, `978-3-16-148410-0` e
  `979-10-90636-07-1`, e não "pula" com poucos dígitos.
- Fila: capa real (`BookCover` 72×104) na próxima parada e em "Depois", com
  lombada de fallback, fita do gênero e posição na fila.

### Changed

- `GenresScreen` e `FilaScreen` importam `@/features/library/use-books` e
  `/genre` direto, cortando o require cycle `library ↔ genres`.
- `isbn.test.ts` cobre os grupos da tabela e a digitação parcial.
- `docs/data-model.md`, `docs/architecture.md` e `docs/testing.md` explicam a
  máscara pela tabela oficial.
- `/tmp/` no `.gitignore` (XML baixado pelo script).

### Fixed

- Aviso `ImageBackground is deprecated`: causa rastreada (getter do RN 0.88
  tocado pelo `react-native-css-interop` do NativeWind 4) e decisão registrada
  na ADR 0006 — aceitar e documentar, sem `LogBox.ignoreLogs`.

### Verified

- Conferido no Android pelo dono: capa × lombada na Fila, máscara do ISBN e o
  layout da linha em "Depois".

## S4c — Movimento e vida

### Added

- Lombada animada: piscada (olhos somem no visor), brilho que atravessa o corpo,
  "z" pulsando no sono e mola de toque (`withSpring`) em vez de inclinação seca.
- `Spine` com `animated`: flutuação contínua para o detalhe do livro.
- Estante com entrada em cascata (`FadeInDown` por card) ao trocar filtro/busca.
- Detalhe com animação contínua: lombada flutuando e capa com brilho varrendo.
- `BookCover` como livro físico: bloco de páginas na borda direita, brilho
  diagonal, selo com o rosto do status e mola no toque.
- `Mascot`: pulso nos acessórios, fade na troca de estado e respiração mais
  visível.
- Hoje com entrada em cascata dos cards.
- Spec `S04c-movimento.md` e seção de movimento em `docs/design/assets-3d.md`.

### Changed

- `BookCover` recebe `status` (selo) e `animated` (brilho no detalhe).
- `Spine` concentra flutuação e toque em um único estilo animado, evitando que
  os dois `transform` se sobrescrevam.

### Validated

- S4a e S4c conferidas no Android pelo dono; ícone, splash e monocromático só
  entram em build nativo e ficam para o APK da S12.

## S4a — Identidade 3D vetorial

### Added

- `src/lib/color-mix.ts`: `parseHex` e `mixHex` puros, base da paleta da
  lombada (sombra e brilho derivados da cor do gênero).
- `src/features/library/spine-art.ts`: mapa **cor do gênero + status** →
  expressão (`happy`, `sleepy`, `shine`, `neutral`) + paleta; rosto navy ou
  creme conforme o contraste; fallback 2D sem status/hex inválido.
- `SpineArtwork` (SVG) e `Spine` com `status`: corpo com faixa de sombra,
  brilho, faixas superior/inferior e rosto por status; tamanho cheio e compacto.
- `Mascot` em SVG com os seis estados da marca, respiração e piscada em
  Reanimated, `accessibilityLabel` por estado.
- Mascote na Hoje (card "LêBot diz") e no estado vazio da Estante.
- Estante com profundidade discreta (sombra por coluna) e transição `FadeIn`
  ao trocar filtro/busca.
- `brand/source/mark.svg` e `mark-mono.svg` + `scripts/build-icons.mjs` (sharp,
  devDependency): ícone, camadas adaptativas, monocromático com olhos vazados,
  splash e favicon definitivos em `assets/images/`.
- ADR 0011, `docs/design/assets-3d.md` e docs de design system, brand,
  arquitetura e testes atualizados.

### Changed

- `app.config.ts`: splash aponta para `splash-icon.png` (200 px de largura).
- `Card` aceita `style` para sombra/profundidade.
- Jest usa o resolver oficial do Reanimated; nenhum mock manual.
- A arte deixou de ser WebP (spec original) e passou a vetorial paramétrica:
  qualquer hex de gênero funciona e o bundle quase não cresce.

### Fixed

- Detalhe do livro mostrava a lombada 2D: agora passa `status` e usa a arte 3D
  como a Estante.
- Toque na lombada e na capa inclina o livro (feedback de "sair da prateleira").
- Respiração do mascote mais visível (escala 1,04 e leve flutuação).

## S3.2 — Gêneros personalizados e cores por tema

### Added

- Migração `drizzle/0002_slow_pepper_potts.sql`: tabela `genres` (nome, par de
  cores, preset, ordem e timestamps) com os 6 gêneros de fábrica, sem recriar
  `books` nem alterar `books.genre`.
- `src/theme/genre-colors.ts`: paleta de 10 pares claro/escuro,
  `resolveGenreColor` e `paletteEntryAt`; o gênero guarda a cópia dos hexes.
- `src/lib/genre-color.ts`: validação `#RRGGBB`, normalização e contraste WCAG;
  par claro = escuro é recusado.
- Repositório `genres` (`list`, `findById`, `create`, `update`, `remove`,
  `countBooks`, `nameExists`) com nome único sem acento/caixa e bloqueio de
  exclusão para gênero em uso e para o último gênero.
- `useGenres` com repositório injetável e mapa `genreById` compartilhado por
  Estante, Fila, Detalhe e Formulário.
- Telas `/generos` (lista com contagem), `/generos/novo` e
  `/generos/[id]/editar`; Ajustes ganhou "Gerenciar gêneros".
- Formulário de gênero com grade de 10 presets, cor personalizada em dois hexes,
  preview e aviso de contraste baixo.
- `BookCover` e `Bookmark` (`react-native-svg`): capa com raio e borda dos cards
  e fita na cor do gênero, no canto superior esquerdo.
- ISBN no formulário de livro aceita dígitos puros, aplica a máscara enquanto
  digita (`85-359-0277-2` / `978-85-359-0277-2`), normaliza o valor gravado e
  mostra "ISBN válido"/"ISBN inválido" antes de salvar.
- ADR 0010 e docs de modelo, arquitetura, testes, design system, brand e
  privacidade atualizados.

### Changed

- `books.genre` passa a guardar `genres.id`; `Book.genre` virou `genreId` e o
  enum `BookGenre` saiu do schema e da UI.
- `AppText` `label` perdeu o `letterSpacing`: era a causa do "Terro/r" e do
  "Volta/r" em containers de largura justa.
- Estante, detalhe e preview do formulário usam `BookCover` no lugar da `Image`
  solta; `resolveGenreColor(genre, 'dark')` já está coberto por teste, mas a UI
  segue clara.
- `react-native-svg` entra como dependência.

### Validated

- Conferido no Android pelo dono: gêneros e cores, capa com fita, máscara do
  ISBN e o "r" final.

## S3 — Biblioteca: cadastrar, buscar e editar

### Added

- Migração `drizzle/0001_conscious_hannibal_king.sql`: `books.isbn` (único
  quando presente) e `books.cover_uri`, sem recriar a tabela.
- `src/lib/isbn.ts`: normalização e dígito verificador de ISBN-10/13; o
  repositório grava normalizado, recusa ISBN inválido e repetido.
- `src/lib/book-search.ts`: busca sem acento e sem caixa; a Estante filtra a
  lista já carregada (ADR 0009).
- Telas `BookDetailScreen` e `BookFormScreen`, com rotas `/livro/novo`,
  `/livro/[id]` e `/livro/[id]/editar`; excluir pede confirmação.
- `TextField` em `src/components/ui/` com rótulo, dica e erro por campo;
  `ConfirmDialog` próprio no lugar do `Alert` do sistema e variante `danger`
  no `Button`.
- Campo "Páginas lidas" no formulário: dá para cadastrar um livro que já estava
  em andamento e editar o progresso manualmente.
- Capa: `expo-image-picker` + `expo-file-system`, copiada para
  `documentDirectory/covers/<id>.jpg`; `CoverService` injetável isola o módulo
  nativo dos testes (ADR 0009).
- `useBooks` ganhou `create`, `update` e `remove`, e avisa as outras telas que
  usam o mesmo repositório.
- ADR 0009; docs de modelo, arquitetura, testes, design system e privacidade
  atualizados.

### Changed

- Tipografia: `display` passa a 52/64 e `xxl` a 36/44; teste trava
  `lineHeight >= fontSize * 1.15` em `xl`, `xxl` e `display`.
- Estante ganhou campo de busca e botão "Novo livro"; tocar na lombada abre o
  detalhe. A capa cadastrada aparece no card e o título saiu de dentro da
  lombada (linha única abaixo dela).
- `expo-image-picker` e `expo-file-system` entram como dependências; o plugin
  de permissão de fotos fica no `app.config.ts`.

### Fixed

- Textos `display` (`Hoje`, `Ajustes`, "18 páginas") não cortam mais
  descendentes no Android.
- Voltar do formulário para a estante/detalhe mostra os dados novos, não os
  antigos.
- Toque duplo durante a animação não empilha mais telas iguais
  (`createNavigationGuard`).
- Fila conta só os livros que ainda existem e abre o detalhe ao tocar no livro
  (antes o item ficava inerte).
- Detalhe não repete o título dentro da lombada; rótulo longo trunca com
  reticências em vez de quebrar no meio da palavra.
- Chip e rótulo de gênero ficam em uma linha só (o "Terror" quebrava em
  "Terro/r" no formulário e na Estante).
- "Voltar" não corta mais o "r": virou `BackButton` com largura total, no lugar
  do botão fantasma de largura justa.

## S2 — Persistência com SQLite + Drizzle

### Added

- Banco local com `expo-sqlite` + `drizzle-orm`, migração
  `drizzle/0000_aspiring_unicorn.sql` e schema tipado em `src/db/schema.ts`
  (`books` e `settings`).
- `src/db/client.ts` com abertura lazy, WAL e `foreign_keys = ON`.
- Migrações no boot (`useMigrations`) com tela de erro `DatabaseError`; seed de
  5 livros fictícios e 4 preferências só em banco vazio.
- Repositórios `books` (list/findById/create/update/remove) e `settings`
  (get/all/set/remove) com validação Zod.
- Hooks `useBooks` e `useSettings` com repositório injetável; Estante, Fila e
  Ajustes passam a ler do SQLite e Hoje lê a meta diária.
- `docs/data-model.md`, `docs/testing.md`, ADR 0007 e ADR 0008.
- Testes de CRUD, constraints, seed idempotente e migração repetida com
  `sql.js`; telas testadas com repositórios em memória (29 testes).
- Conferido no Android: seed de 5 livros aparece no primeiro uso e permanece
  após fechar/reabrir o app.

### Changed

- Fixtures de livros e de preferências removidas; `queue` e `daily-plan`
  continuam fictícios até S8 e S6/S7.
- `babel.config.js` usa `babel-plugin-inline-import` e `metro.config.js` inclui
  `sql` em `sourceExts`.

### Fixed

- CI (`Lint, tipos e testes`) falhava no `typecheck` desde `9e650d8`: o arquivo
  gerado `expo-env.d.ts` não existe no runner. `types/expo-types.d.ts` versiona
  a referência a `expo/types` (declaração de `*.css`).

## S1 — Design system + shell

### Added

- Design system com NativeWind 4.2.7 + Tailwind 3.4 e tokens em `src/theme/`
  (cores, espaçamento, raios, tipografia, tamanhos e opacidade).
- Componentes base `Screen`, `AppText`, `Button`, `Card`, `Chip` e `Spine`,
  com testes de render e interação.
- Shell com 4 abas (`Estante`, `Fila`, `Hoje`, `Ajustes`) e dados fake em
  `src/features/*/__fixtures__/`.
- Fontes Fredoka (600/700) e Nunito (400/600/700) carregadas com `expo-font` e
  splash controlado.
- `docs/design/design-system.md` e ADR
  `docs/adr/0006-design-system-nativewind.md`.
- Shell validado no Expo Go: 4 abas navegam e fontes PT-BR renderizam.

### Changed

- Rotas de `src/app/` só reexportam as telas das features; a tela da S0 virou
  a aba Estante.

## S0 — Fundação pública + onboarding Expo

### Added

- App Expo SDK 58 com Expo Router em `src/app/`, TypeScript strict e tela
  inicial.
- `app.config.ts` com identidade `LêBot` (slug/scheme `lebot`, package
  `com.francis.lebot`).
- Biome (lint + formatação), Jest com `jest-expo` e testes da paleta.
- Husky + lint-staged no pre-commit, com varredura opcional de `gitleaks`.
- CI no GitHub Actions: lint, typecheck, testes, `expo-doctor` e gitleaks no
  histórico completo.
- `LICENSE` MIT (código e arte), `SECURITY.md`, `.gitattributes` e `.nvmrc`.
- Documentação: `README.md`, `docs/architecture.md`,
  `docs/security-privacy.md`, `docs/learn/expo-for-react-devs.md`.
- Scaffolding de contexto entre sessões (`AGENTS.md`, `docs/state/CURRENT.md`,
  `docs/INDEX.md`, `docs/roadmap.md`, specs e ADRs).
- Identidade LêBot documentada (`docs/brand.md`,
  `docs/adr/0002-identidade-lebot.md`).
- Arte-fonte organizada em `brand/source/`.
- Skills globais `session-start` (handoff) e `project-context-init` (estrutura
  em novos projetos).

### Changed

- Commits passam a usar o e-mail `noreply` do GitHub; commit inicial reescrito
  e republicado.
- Dependabot deixa de abrir PRs de versão; só alertas de segurança
  (`docs/adr/0005-sem-dependabot-de-versao.md`).
