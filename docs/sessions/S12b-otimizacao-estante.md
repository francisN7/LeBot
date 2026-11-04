# S12b — Otimização rápida da estante (0.2.0)

## Objetivo

Atacar o custo real da grade sem tirar a animação: **animar só os cards visíveis**
e **pausar as animações durante a rolagem**. Medir antes e depois com 200 livros
e registrar os números.

> Roda **depois** da S12a: o build local saiu de cena (ADR 0026), então o APK de
> medição vem de um `workflow_dispatch` do `release.yml` (artefato, sem
> publicar). A lombada continua animada na grade (decisão do dono): o que muda é
> **quantas** animam por vez e **quando**.

## Fora de escopo

- Deixar a lombada estática, remover piscada/tassel/brilho/“zzz” ou trocar a arte.
- `windowSize`, sombras/`shelfDepth`, gesto do `StatusWheelTrigger` e debounce da
  busca (ficam para depois; se a meta não bater, entram como reforço).
- Trocar de lista (FlashList), de versão do RN/Expo ou de biblioteca.
- Migrar o build para CI, permissões e `allowBackup` (S12a).
- Novas telas, tema escuro, frases do mascote.

## Estado de partida

Medições no release 0.2.0 (Realme C67, Android 15, `dumpsys gfxinfo`):

| Cenário | Frames | Janky | Mediana | p95 |
|---|---|---|---|---|
| 5 livros | 1.280 | 4,4% | 20 ms | 44 ms |
| 201 livros, stress (8 idas e voltas) | 777 | 36,2% | 34 ms | 69 ms |
| 201 livros, rolagem normal (6 flings) | 357 | 77,0% | 53 ms | 300 ms |

O que existe hoje (`EstanteScreen.tsx`, `spine.tsx`, `SpineArtwork.tsx`):

- `FlatList` com `numColumns={2}`, `windowSize={5}`, `removeClippedSubviews`.
- Cada card montado roda quatro animações em loop (`sheen`, piscada, “zzz” e o
  tassel com `body`/`fringe`/`shadow`), inclusive fora da tela.
- `SpineArtwork` já é `memo` e o corpo é SVG estático (S11c); o custo é por
  frame, não por re-render.

## Tarefas

1. **Fixture UTF-8 + linha de base.** Criar `scripts/build-200-books.mjs`
   (versionado) gerando `lebot-200.zip` com o schema atual e acentos corretos (o
   `lebot-backup-cheio.zip` da S11 tem texto duplicado: `Breve RelÃ³gio`).
   A linha de base sai do **0.2.0 que já está no aparelho** — o APK da S12a tem o
   mesmo código de animação, então não vale um build só para reconferir números.
   O aceite de instalar por cima (mesma assinatura, dados intactos) migra para o
   APK da v0.2.1. Antes de restaurar a fixture, exportar o backup do acervo real
   do dono e restaurá-lo no fim.
2. **Animar só o visível.**
   - `onViewableItemsChanged` + `viewabilityConfig` (ex.:
     `itemVisiblePercentThreshold: 20`) guardando só os IDs visíveis num `Set`.
   - O `onViewableItemsChanged` e o `viewabilityConfig` precisam ser **estáveis**
     ( `useRef`): a `FlatList` lança erro se mudam entre renders.
   - Atualizar o estado **só quando o conjunto de IDs muda** (comparar tamanho e
     conteúdo) para não re-renderizar a tela a cada frame de rolagem.
   - Propagar para a `Spine`/`SpineArtwork` uma flag (ex.: `animating`) que
     **não monta** os quatro loops quando falsa, mantendo a arte parada no lugar.
     Sem remover a lombada nem trocar o visual.
   - Margem de uma tela acima/abaixo para a animação não “acender” tarde demais
     ao entrar no campo de visão; ajustar o `viewabilityConfig` se ficar estranho.
3. **Pausar durante a rolagem.**
   - `onScrollBeginDrag` → pausa; `onMomentumScrollEnd` (e `onScrollEndDrag` sem
     inércia) → retoma. Guardar em `ref`, não em estado, para não re-renderizar a
     lista a cada evento.
   - Pausa = parar os loops e voltar ao repouso (`sheen` fora, olhos abertos,
     tassel reto); retomada = religar os `withRepeat`. Evitar reiniciar com
     “salto” visível.
   - Segurança: se o evento de fim não chegar (fim abrupto do gesto), religar
     depois de ~300 ms.
   - Combinação final: `animating = visível && !rolando`.
4. **Medir e comparar.** Mesmo protocolo para 200 e 5 livros, duas rodadas cada.
   Registrar frames, janky, mediana e p95 na spec e no `CURRENT.md`.
5. **Instalar, testar e só publicar na S13.** Decisão do dono em 04/11: este
   build **não** vira release agora. O APK é instalado por cima do 0.2.0
   (`adb install -r`) e testado no aparelho; a publicação do `v0.2.1` fica para o
   fim da S13, para a tag nascer junto com a documentação fechada.
   - `package.json` e `app.config.ts` já em `0.2.1`, `versionCode: 2` (sem isso o
     Android não vê atualização).
   - `docs/release-notes-v0.2.1.md` fica pronto, **sem H1**: na S13,
     `gh release create v0.2.1 --notes-file ...` + upload do **mesmo APK medido**.
     A tag criada pela API não dispara um segundo build.
6. **Ordem paginada (10 por página).** A Ordem montava todas as `QueueRow` de
   uma vez num `ScrollView`; com 200 livros o Android abria o diálogo de "LêBot
   não está respondendo" (a S12b reproduziu em dev e no APK). Paginar em **10 por
   página** resolve com o menor risco: o arrasto fica dentro da página e as
   **setas andam na ordem inteira**, então o primeiro livro da página 2 sobe para
   a página 1 pela seta (a tela acompanha o livro). Virtualizar com drag seria
   uma reescrita maior e ficou fora.
7. **Fechar.** `CURRENT.md`, `roadmap.md`, `CHANGELOG.md` (entrada `S12b`) e
   commit `S12b: ...`.

## Protocolo de medição

```powershell
$adb='C:\Users\francis\android-sdk\platform-tools\adb.exe'
& $adb shell am force-stop com.francisN7.lebot
& $adb shell am start -n com.francisN7.lebot/.MainActivity | Out-Null
Start-Sleep -Seconds 8
& $adb shell dumpsys gfxinfo com.francisN7.lebot reset | Out-Null
1..6 | ForEach-Object {
  & $adb shell input swipe 540 1700 540 600 180
  Start-Sleep -Milliseconds 1500
}
Start-Sleep -Seconds 2
& $adb shell dumpsys gfxinfo com.francisN7.lebot
```

- Sempre com 200 livros (201 com o livro do dono) e com 5 livros.
- Descartar a primeira rodada (app ainda aquecendo) e comparar medianas.
- Mesmo aparelho, orientação e brilho.

## Aceite

- [ ] Com 200 livros, só os cards visíveis animam; os de fora ficam parados.
- [ ] APK do CI da S12a instalado por cima do 0.2.0 (mesma assinatura) com os
      dados intactos.
- [ ] Durante o fling as animações pausam e voltam ao parar; nada de lombada
      “congelada” depois da rolagem.
- [ ] 5 livros sem regressão (referência: 4,4% / 20 ms) e sem animação piscando
      fora de hora.
- [ ] Medição de 200 livros antes e depois, com frames/janky/mediana/p95
      registrados.
- [ ] `lebot-200.zip` abre com acentos corretos e o gerador está em `scripts/`.
- [ ] APK da v0.2.1 instalado por cima do 0.2.0 (mesma assinatura) com os dados
      intactos; a publicação do Release fica para a S13 (decisão do dono), com
      `docs/release-notes-v0.2.1.md` já pronto.
- [ ] Ordem com 200 livros abre sem ANR, mostra 10 por página e o primeiro da
      página 2 sobe para a página 1 pela seta.
- [ ] lint, typecheck, test, doctor e `expo export` verdes.

> Meta de referência: ≤ 5% janky com 200 livros. Se não bater, registrar o ganho
> real e decidir na hora se vale somar `windowSize` 3 + `React.memo` no mesmo
> release.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, `docs/sessions/S12-release-interno.md`,
`docs/sessions/S11c-estante-performance.md`, `src/features/library/EstanteScreen.tsx`,
`src/components/ui/spine.tsx`, `src/components/ui/SpineArtwork.tsx`.

## Arquivos prováveis

- `src/features/library/EstanteScreen.tsx`
- `src/components/ui/spine.tsx`, `src/components/ui/SpineArtwork.tsx`
- `scripts/build-200-books.mjs`
- `docs/sessions/S12b-otimizacao-estante.md`, `docs/state/CURRENT.md`

## Riscos

- **`onViewableItemsChanged` instável:** a `FlatList` reclama em dev e o custo
  de JS pode anular o ganho. Usar `useRef` e atualizar o `Set` só quando muda.
- **Re-render por scroll:** `setState` a cada evento de visibilidade derruba a
  performance. Comparar antes de atualizar (e, se preciso, throttle).
- **Animação “piscando” ao entrar/sair da tela:** ajustar a margem do
  `viewabilityConfig`; a lombada deve nascer parada e começar suave.
- **Pausa sem retomada:** se o evento de fim não vier, as lombadas ficam
  congeladas; o timer de segurança cobre isso.
- **Ruído do `adb input swipe`:** repetir e comparar mediana, não um número só.
- **Custo do build:** cada iteração custa um run de CI (~15 min com cache) mais
  o download do APK. Agrupar as duas mudanças em um build e usar
  `workflow_dispatch` (artefato) em vez de tag.
