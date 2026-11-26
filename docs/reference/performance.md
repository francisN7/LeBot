# Desempenho

Por que o LêBot parece pesado, com números do APK de release, e o caminho
para deixá-lo leve. Medido na S14b (2026-11-26). Um resultado novo entra como
**coluna nova**; os números antigos não são reescritos.

## Resumo

- O peso **não vem da quantidade de livros**. De 200 para 1.000 livros, os
  números ficam iguais, dentro do ruído: a virtualização da Estante funciona.
- Ele vem de **animações perpétuas que nunca param**. Mascote, lombadas,
  brilho das capas e linhas da Ordem rodam `withRepeat(-1)` na thread de UI.
  Também rodam **com a aba escondida**: em Ajustes, com zero quadros na
  tela, a thread de UI gasta **90% de um núcleo**.
- A **lombada SVG animada** custa muito mais que a capa. Com o mesmo número
  de livros (3), a Estante parada passa de 49 para 855 quadros em 10 s e de
  20% para 82% de CPU.
- A **rolagem com a Estante cheia** trava: P95 de ~109 ms e 11% de quadros
  perdidos. O gargalo é a CPU (JS 63–69% e UI 50%); a GPU fica em 3 ms.
- A **1ª visita à Ordem** cresce com o acervo: 0,16 s com 3 livros, 1,9 s
  com 200 e 2,3 s com 1.000.
- O **boot** tem um fade fixo de 400 ms da splash, cerca de 25% do tempo
  percebido.
- **Caminho recomendado:** ajustes dentro do stack atual (seção
  **Caminhos**). Trocar de framework não resolveria a causa.

## Protocolo

| Item | Valor |
|---|---|
| Aparelho | Motorola edge 50 ultra, Android 17, arm64-v8a, 12 GB, tela de 1220×2712 a 120 Hz (taxa variável de 60 a 144) |
| APK | `v0.2.1` (versionCode 2), asset atual do Release, build `2d66d62`, SHA-256 `e44b2cf08544446e37cf43559404a3d1b6055cc5d5344897a03afb9f50fd3ab6` (lido do aparelho com `adb shell pm path` + `sha256sum`) |
| Acervos | **real3**: 3 livros reais com capa (os dados não saem do aparelho). **f3**, **f200**, **f1000**: `node scripts/build-200-books.mjs --count=N`, fictícios e sem capa, ou seja, só lombadas |
| Condições | Na tomada, tela travada ligada, animações do sistema em 1×, bateria entre 22% e 48%, de 37 °C a 40 °C |
| Repetições | Boot 7×; abas 3 voltas; roda 3×; rolagem 4 rodadas (a 1ª descartada); parado: 10 s por aba; CPU por thread: 10 s por cenário |

Ruído: entre rodadas, o boot varia ±5%. Entre acervos, o f1000 deu boot
~10% **menor** que o f200, o que só se explica por ruído térmico ou de
carga. Comparações abaixo de ~15% não sustentam conclusão.

### Como cada número foi tirado

- **Boot frio:** `am force-stop`, tela inicial, `screenrecord` e
  `am start -W`. `am` é o `TotalTime` (1º quadro da activity). **Estável** é
  o tempo do 1º quadro que muda até o quadro que já é a Estante final,
  calculado por diferença de quadros do vídeo, ignorando a barra de status e
  as notificações.
- **Abas:** com `show_touches`, grava cada toque na barra de abas e mede do
  toque até a tela assentar. A 1ª visita é a primeira depois do boot; a 2ª é
  com a aba já montada.
- **Parado:** em cada aba, 4 s de espera e depois 10 s contando quadros
  (`gfxinfo`) e ticks de CPU do processo (`/proc/<pid>/stat`).
- **CPU por thread:** delta de `/proc/<pid>/task/*/stat` em 10 s; 100% é um
  núcleo inteiro.
- **Rolagem:** `bash scripts/measure-gfx.sh --rounds 4 --framestats`.
- **Roda de status:** `input motionevent`: toque longo no 1º chip, duas
  voltas pela roda e soltar no miolo (cancela sem gravar).
- **Memória:** `dumpsys meminfo` 8 s após o boot e de novo após toda a
  bateria (pós-uso).

Os scripts de boot, abas, parado, roda e threads ficaram fora do repo nesta
sessão. O item **Medidores no repo** do backlog os promove a `scripts/`.

## Medições

### Boot frio (mediana de 7, em ms)

| | real3 | f3 | f200 | f1000 |
|---|---|---|---|---|
| `am` TotalTime | 586 | 771 | 1.280 | 1.093 |
| Até a Estante estável | 1.044 | 1.189 | 1.757 | 1.573 |

Fases do vídeo (real3): animação de abertura do sistema ~280 ms, splash
parada ~370 ms, **fade da splash ~380 ms** (o padrão do `expo-splash-screen`
é 400 ms). O custo cresce até 6 cards na tela (`initialNumToRender`) e para.

### Parado por aba (quadros em 10 s / CPU do processo, % de um núcleo)

| Aba | real3 | f3 | f200 | f1000 |
|---|---|---|---|---|
| Estante | 49 / 20% | 855 / 82% | 750 / 83% | 564 / 66% |
| Hoje | 908 / 87% | 911 / 84% | 607 / 76% | 607 / 73% |
| Ordem | 223 / 54% | 848 / 106% | 533 / 121% | 538 / 121% |
| Ajustes | **0** / 43% | **0** / 72% | **0** / 84% | **0** / 83% |

Uma tela sem nada se mexendo deveria ficar perto de 0 quadros e 0% de CPU.

### CPU por thread (% de um núcleo, 10 s)

| Cenário | f3 | f200 | f1000 |
|---|---|---|---|
| Estante parada | UI 46 · Render 34 | UI 47 · Render 26 | UI 47 · Render 26 |
| Estante rolando | UI 37 · Render 29 · JS 6 | **JS 69** · UI 50 · Render 16 | **JS 63** · UI 50 · Render 16 |
| Ajustes parado | UI 71 · JS 2 | **UI 90** · JS 4 | **UI 90** · JS 4 |

### Troca de abas (toque até assentar, mediana em ms)

| | real3 | f3 | f200 | f1000 |
|---|---|---|---|---|
| Hoje, 1ª visita | 378 | 391 | 433 | 702 |
| Ordem, 1ª visita | 156 | 189 | **1.940** | **2.340** |
| Ajustes, 1ª visita | 13 | 33 | 167 | 117 |
| Qualquer aba, 2ª visita (pior caso) | 0 | 23 | 81 | 98 |

Os ~0,37 s de Hoje com acervo pequeno são a animação de entrada, não espera.

### Rolagem da Estante e roda de status (`gfxinfo`, mediana das rodadas 2–4)

| | real3 | f3 | f200 | f1000 |
|---|---|---|---|---|
| Rolagem: janky % | 2,3 | 0,0 | **11,0** | **11,7** |
| Rolagem: P50 / P90 / P95 / P99 (ms) | 5 / 9 / 11 / 17 | 8 / 11 / 12 / 13 | 13 / 26 / **109** / **150** | 13 / 28 / **109** / **150** |
| Roda: janky % | 1,9 | 2,0 | 2,6 | 4,2 |
| Roda: P90 / P95 / P99 (ms) | 11 / 12 / 24 | 12 / 14 / 27 | 16 / 20 / 36 | 16 / 20 / 42 |

Com 3 livros não há o que rolar; a linha só serve de piso. Na f200, a GPU tem
P99 de 3 ms, enquanto o `gfxinfo` mostra *Slow UI thread* subindo de 2
(real3) para 54. O gargalo é CPU, não desenho. São 677 views na rolagem.

### Memória (PSS / Native Heap, MiB)

| | real3 | f3 | f200 | f1000 |
|---|---|---|---|---|
| Após o boot | 165 / 31 | 184 / 42 | 221 / 65 | 212 / 60 |
| Pós-uso | 170 / 32 | 205 / 49 | **379 / 149** | **385 / 153** |

### APK (`v0.2.1`, universal)

56,6 MB no total:

- `lib/arm64-v8a`: 26,5 MB;
- `lib/armeabi-v7a`: 18,4 MB;
- `classes.dex`: 6,6 MB;
- bundle Hermes: 4,75 MB;
- `res` + `resources.arsc`: 5 MB.

Maiores `.so` arm64: `libreactnative` 7,0 MB, `libhermesvm` 2,7 MB,
`libexpo-sqlite` 1,7 MB, `libreanimated` 1,7 MB, `libworklets` 1,3 MB e
`rnsvg` 0,8 MB. O build manda as duas ABIs no mesmo APK
(`-PreactNativeArchitectures=arm64-v8a,armeabi-v7a`). Um APK por ABI teria
~38 MB.

## Causas

Cada causa aponta para uma medição.

1. **Animações perpétuas sem pausa.** Usam `withRepeat(..., -1)`:
   `Mascot.tsx` (respiração com `scale` na view inteira, piscada por
   `animatedProps` no SVG e pulso de acessório), `SpineArtwork.tsx` (balanço,
   franja, sombra, brilho e sono), `SpineFace.tsx` (piscada), `BookCover.tsx`
   (brilho) e `QueueRow.tsx` (brilho). Nenhuma tela usa `useIsFocused` ou
   `freezeOnBlur`, e as abas ficam montadas.
   *Evidência:* Ajustes desenha 0 quadros e gasta 43–90%; Hoje parada desenha
   ~91 quadros/s.
2. **Lombada SVG animada como célula da grade.** Cada lombada tem vários
   valores animados, e `animatedProps` em `react-native-svg` redesenha o SVG
   inteiro a cada quadro na thread de UI.
   *Evidência:* f3 contra real3 (mesmos 3 livros) dá Estante parada 82% contra
   20%. É o mesmo patamar com 200 e com 1.000, porque só as visíveis animam
   (ADR 0024).
3. **Montar células de lombada durante a rolagem custa no JS.**
   *Evidência:* JS em 63–69% e *Slow UI thread* em 54 na f200, contra 6% de
   JS na f3. A memória nativa sobe de 65 para 149 MiB depois de rolar e não
   volta.
4. **Ordem faz trabalho O(n) na 1ª montagem.** Ela mostra 10 linhas por
   página, mas monta `booksById`, `entries` e `suggestOrder` sobre o acervo
   inteiro. *Evidência:* 0,19 → 1,94 → 2,34 s.
   *Hipótese a confirmar com profiler:* qual desses passos domina.
5. **Splash com fade de 400 ms.** *Evidência:* a fase de ~380 ms no vídeo bate
   com o padrão do `hideAsync`.
6. **Download maior que o necessário** (APK universal). *Evidência:* 18,4 MB
   de `armeabi-v7a`, que um aparelho arm64 não usa.

Não são causa:

- a GPU (P99 de 3 ms em todos os casos);
- o tamanho do acervo na Estante (200 ≈ 1.000);
- a 2ª visita às abas (≤ 98 ms).

## Caminhos

| | A — Ajustar dentro do stack | B — Trocar peças | C — Trocar framework |
|---|---|---|---|
| O quê | Pausar animação fora de foco (`useIsFocused` / `freezeOnBlur`); animações pontuais (ao entrar e ao tocar) em vez de perpétuas, respeitando "reduzir movimento"; lombada parada na grade e animada só no foco; Ordem sem trabalho O(n) na montagem; fade da splash ~150 ms; APK por ABI | Lombada e mascote em Skia (`@shopify/react-native-skia`) ou rasterizadas; `FlashList` na Estante | Reescrever em Flutter ou Kotlin/Compose |
| Ganho esperado | Parado e abas escondidas: de 43–121% para ~0%. Boot: −250 ms. Ordem: de 2,3 s para < 0,3 s. Rolagem: menos JS e UI por célula. Download: −18 MB | Rolagem e animação mais baratas por quadro (desenho no RenderThread, sem re-render de SVG) | Incerto: as causas são de **desenho do app** e se repetem em qualquer framework se o design continuar igual |
| Custo | P–M (2–3 sessões) | M–L; Skia soma ~6 MB por ABI | XL: 16 mil linhas, 517 testes e os ADRs refeitos |
| Risco | Baixo: muda o "como anima", não a arte | Médio: dependência nativa nova e arte refeita | Alto: perde a base testada e meses sem entrega |

**Recomendação:** fazer **A** já e remedir com estes mesmos scripts. Avaliar
**B** só se a rolagem com 200 livros continuar acima do orçamento. **C** fica
descartado.

## Orçamento

Este é o teto que a S14c (vida) e as próximas sessões respeitam no APK de
release, medido com f200 neste aparelho:

| Métrica | Hoje (f200) | Orçamento |
|---|---|---|
| Qualquer aba parada há 3 s | 533–750 quadros / 76–121% | ≤ 30 quadros em 10 s / ≤ 5% |
| Aba escondida | 84% | 0% |
| Boot até a Estante estável | 1.757 ms | ≤ 1.300 ms |
| 1ª visita a qualquer aba (f1000) | 2.340 ms | ≤ 400 ms |
| Rolagem: janky / P95 | 11% / 109 ms | ≤ 5% / ≤ 25 ms |
| PSS pós-uso | 379 MiB | ≤ 250 MiB |

Vida e animação nova entram **com hora para acabar**: animam ao entrar, ao
tocar ou num evento, e param. Loop infinito só com a aba em foco, num
elemento por tela.

## Decisão

O dono escolheu, em 2026-11-26:

- o **caminho A**;
- as duas sessões de leveza (S14c e S14d) **antes** da análise de vida, que
  passa a ser a S14e;
- os medidores como item de backlog.

Regras e orçamento estão na
[ADR 0029](../adr/0029-orcamento-de-desempenho-e-animacao-com-fim.md). O
stack não muda.
