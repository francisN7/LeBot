# S12b — Otimização rápida da estante (0.2.0)

## Objetivo

Corrigir a performance da Estante no APK 0.2.0 **sem nova versão**: com 200
livros, a rolagem normal precisa ficar em 60 fps (≤ 5% de frames janky). Nada de
redesenho, funcionalidade nova ou troca de biblioteca.

> Roda **antes** da S12a: a performance é medida com build local (WSL2), como na
> S12, e só depois o build migra para o GitHub Actions.

## Fora de escopo

- Mudar o layout da grade, o número de colunas ou a arte da lombada.
- Novas telas, novos estados do mascote, tema escuro.
- Migrar o build para CI (S12a), permissões e `allowBackup` (S12a).
- Trocar de lista (FlashList), de versão do RN/Expo ou de biblioteca de animação.
- Frases do mascote (backlog pós-MVP).

## Estado de partida

Medições no release 0.2.0 (Realme C67, Android 15, `dumpsys gfxinfo`):

| Cenário | Frames | Janky | Mediana | p95 |
|---|---|---|---|---|
| 5 livros | 1.280 | 4,4% | 20 ms | 44 ms |
| 201 livros, stress (8 idas e voltas) | 777 | 36,2% | 34 ms | 69 ms |
| 201 livros, rolagem normal (6 flings) | 357 | 77,0% | 53 ms | 300 ms |

O que já existe no código:

- `EstanteScreen.tsx` já usa `FlatList` com `numColumns={2}`,
  `windowSize={5}`, `removeClippedSubviews`, lote inicial e `maxToRenderPerBatch`.
  Ou seja: **`windowSize` não está no padrão 21** — ainda assim vale testar 3.
- `SpineArtwork` já é `memo` e o corpo/faixas/nervuras são um SVG estático
  (S11c). O custo restante está nas **quatro animações contínuas por card**
  (`sheen`, `blink`/`useBlink`, `asleep`/“zzz” e o tassel com `body`, `fringe` e
  `shadow`), que rodam em todos os cards montados, mesmo fora da tela.
- Cada chip monta o `Pan` do `StatusWheelTrigger`, e cada card leva
  `contactShadow` + `shelfDepth` (camadas empilhadas).
- `renderBook` é uma função inline recriada a cada render; não há `memo` no card
  nem na `Spine`.

## Tarefas

Ordem de ataque: **um lote de mudanças por build**, medir, manter o que ganhou e
só então partir para o lote seguinte. Cada build local custa ~11 min.

1. **Fixture UTF-8 + linha de base.** Criar `scripts/build-200-books.mjs`
   (versionado) que gera `lebot-200.zip` com o schema atual e acentos corretos
   (o `lebot-backup-cheio.zip` da S11 tem texto duplicado: `Breve RelÃ³gio`).
   Restaurar no aparelho e medir a linha de base com o protocolo abaixo antes de
   mexer no código.
2. **Lote 1 — grade estática (maior ganho, menor risco).**
   - `Spine`/`SpineArtwork`: prop `lively` (padrão `true`). Na grade a lombada
     fica **parada**: sem brilho, piscada, “zzz” nem tassel animado; o toque
     continua inclinando com mola. O detalhe do livro mantém tudo (os docs já
     mandam reservar animação para telas de um livro só).
   - `windowSize` 5 → 3 e revisar `initialNumToRender`/`maxToRenderPerBatch`
     para não abrir buraco branco.
   - `React.memo` no card (extrair `BookCard`/`renderBook` para fora do render) e
     na `Spine`.
3. **Lote 2 — peso por card.**
   - Na grade, trocar `contactShadow`/`shelfDepth` por borda simples (profundidade
     completa só no detalhe) e testar `renderToHardwareTextureAndroid` só no SVG
     estático.
   - `StatusWheelTrigger`: montar o `Pan` só depois do primeiro toque no chip.
4. **Lote 3 — dados e busca.** Conferir `useBooks` (carrega tudo?), pôr
   `useMemo` no filtro/ordenação e debounce (~250 ms) na busca; medir a digitação
   com a estante cheia.
5. **Plano B, só se o lote 1+2 não chegar na meta.**
   - Congelar animações durante a rolagem (`onScrollBeginDrag` pausa,
     `onMomentumScrollEnd` retoma) **ou** animar só os itens visíveis com
     `onViewableItemsChanged`.
   - Um único relógio (`useSharedValue`) compartilhado para todas as piscadas, em
     vez de um por card.
6. **Medir e registrar.** Duas rodadas por cenário, ficar com a melhor; anotar
   frames, janky, mediana e p95 no `docs/state/CURRENT.md` e na spec.
7. **Publicar o 0.2.0 corrigido.** Manter `0.2.0`/`versionCode 1`, instalar por
   cima (`adb install -r`, mesma assinatura) e substituir o asset do release
   `v0.2.0` (`gh release upload v0.2.0 ... --clobber`) com a conferência do
   `apksigner` antes.
8. **Fechar.** `CURRENT.md`, `roadmap.md`, `CHANGELOG.md` (entrada `S12b`) e
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
- Não comparar rodada com o app ainda aquecendo: a primeira é descartada.
- Mesmo aparelho, mesma orientação, brilho automático desligado.

## Aceite

- [ ] Estante com 200 livros, rolagem normal: **≤ 5% janky** (ou 60 fps) e
      mediana ≤ 16 ms.
- [ ] 5 livros sem regressão perceptível (referência: 4,4% / 20 ms).
- [ ] Rolagem sem card em branco e sem “pulo” de layout.
- [ ] Detalhe do livro continua com todas as animações; toque na lombada ainda
      responde.
- [ ] `lebot-200.zip` abre com acentos corretos e o gerador está em `scripts/`.
- [ ] APK novo instala por cima do 0.2.0 (mesma assinatura) e o asset do
      release `v0.2.0` fica com o build corrigido.
- [ ] lint, typecheck, test, doctor e `expo export` verdes.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, `docs/sessions/S12-release-interno.md`,
`docs/design/assets-3d.md`, `src/features/library/EstanteScreen.tsx`,
`src/components/ui/spine.tsx`, `src/components/ui/SpineArtwork.tsx`,
`src/features/library/use-books.ts`, `src/features/library/status-wheel-trigger.tsx`.

## Arquivos prováveis

- `src/features/library/EstanteScreen.tsx`
- `src/components/ui/spine.tsx`, `src/components/ui/SpineArtwork.tsx`
- `src/features/library/status-wheel-trigger.tsx`, `use-books.ts`
- `scripts/build-200-books.mjs`
- `docs/release.md` (troca de asset), `docs/sessions/S12b-*.md`

## Riscos

- **Trocar jank por buraco branco:** `windowSize`/`removeClippedSubviews` baixos
  demais aparecem como área vazia. Conferir rolagem longa, não só uma tela.
- **Perder a identidade:** o tassel e a piscada são a graça da lombada; tirar da
  grade é aceitável, tirar do detalhe não é.
- **`renderToHardwareTextureAndroid`** aumenta o uso de memória por camada; é
  para o SVG estático, nunca para a camada animada.
- **Ruído de medição do `adb input swipe`:** varia entre rodadas; repetir e
  comparar mediana, não um único número.
- **Custo do build:** 11 min por iteração; agrupar mudanças e não buildar a cada
  linha alterada.
- **Mesma versão:** sem bump de `versionCode`, quem já instalou só atualiza por
  `adb install -r` (não há update automático no 0.2.0). Se preferir um release
  novo, decidir antes de publicar: `0.2.1`/`versionCode 2`.
