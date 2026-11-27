# ADR 0029 — Orçamento de desempenho e animação com hora para acabar

- **Status:** aceito
- **Data:** 2026-11-26
- **Sessão:** S14b
- **Relacionada:** revê o "loop por lombada montada" das ADRs 0024 e 0027;
  mantém o stack da ADR 0001 (Expo + React Native)

## Contexto

A S14b mediu o APK `v0.2.1` em aparelho real
([`reference/performance.md`](../reference/performance.md)). O que pesa é:

- **animações `withRepeat(-1)` que nunca param**, inclusive em abas
  escondidas: Ajustes, com 0 quadros na tela, gasta 90% de um núcleo na
  thread de UI;
- a **lombada SVG animada** custando ~4× a capa na Estante parada;
- trabalho **O(n)** na 1ª montagem da Ordem (2,3 s com 1.000 livros).

GPU, tamanho do acervo na Estante e framework não são o gargalo.

## Decisão

1. **O stack fica.** O caminho é ajustar dentro do Expo/React Native (caminho
   A do relatório). Trocar peças (Skia, `FlashList`) só entra se a rolagem com
   200 livros não atingir o orçamento depois de A. Reescrever em outro
   framework está descartado: as causas são de desenho do app e se repetiriam.
2. **Animação tem hora para acabar.** Ela anima ao entrar, ao tocar ou num
   evento, e para. Loop infinito só com a tela em foco, num elemento por tela,
   e nenhum com "reduzir movimento" ligado. Tela fora de foco não anima.
3. **Orçamento de release** (aparelho de referência, fixture de 200 livros):
   - aba parada há 3 s: ≤ 30 quadros em 10 s e ≤ 5% de CPU;
   - aba escondida: 0%;
   - boot: ≤ 1,3 s;
   - 1ª visita a uma aba (1.000 livros): ≤ 400 ms;
   - rolagem: ≤ 5% janky e P95 ≤ 25 ms;
   - PSS pós-uso: ≤ 250 MiB.

   Mudança de animação ou de lista é medida contra esse teto.

## Consequências

- As sessões de leveza (S14c e S14d) cortam os loops perpétuos, pausam fora de
  foco, tiram o O(n) da Ordem, encurtam o fade da splash e geram um APK por
  ABI.
- A análise de vida (S14e) desenha movimento dentro dessas regras.
- A lombada continua com a mesma arte: muda **quando** ela anima, não o
  desenho.
- Os medidores da S14b viram scripts no repo para que "antes" e "depois" usem
  o mesmo protocolo.

## Alternativas descartadas

- **Manter os loops e só otimizar o SVG:** reduz o custo por quadro, mas não
  zera o gasto de tela parada nem o de aba escondida.
- **Skia ou `FlashList` já:** mais custo e uma dependência nativa nova antes de
  saber se A basta.
- **Flutter ou Kotlin/Compose:** custo XL, perda dos 517 testes e mesmo
  problema se o design continuar igual.

## Adendo — S14c (2026-11-26): vida em intervalos e prova com Skia

A S14c cumpriu a regra 2 ao pé da letra: toda animação toca uma vez e para.
No APK, nenhuma aba parada desenha quadro e a rolagem da f200 caiu para 4% janky
/ P95 de 20 ms ([`reference/performance.md`](../reference/performance.md),
seção **Depois da animação com fim**). Mas o app perdeu a vida, e o dono quer **mais** animação, não
menos. Duas medições também mudam o orçamento:

- A CPU parada não desce de ~10%: é o `FabricEventDispatcher` do RN 0.88,
  que agenda um callback a cada quadro enquanto o app está aberto. Nenhum app
  RN fica em "≤ 5%" neste aparelho.
- "≤ 30 quadros em 10 s" proíbe qualquer vida ambiente: um único brilho de
  1,5 s a 120 Hz já passa disso.

Revisão:

1. **Regra 2:** animação ambiente vive **em intervalos**, uma por vez por
   tela, só `transform`/`opacity` (ou Skia), só com a tela em foco e nunca com
   "reduzir movimento". Loop contínuo segue proibido.
2. **Parado:** CPU ≤ custo fixo do RN + 3 p.p. (~13% neste aparelho). O teto
   de quadros sai para tela com vida ambiente. Aba escondida: nenhum custo além
   do fixo.
3. **Caminho B antecipado:** a S14d faz uma prova com Skia (lombada 3D
   flutuante, A/B com a de SVG no mesmo APK). Se a CPU do pior caso cair a
   ≤ metade, sem piora de rolagem nem PSS acima de 250 MiB, lombadas e capas
   migram e o resultado vira a ADR 0030. ~6 MB por ABI no APK são aceitos.
4. **Mascote:** Rive (MCP oficial só no editor desktop Windows/macOS; runtime
   fora do Expo Go) ou Skia, decidido antes da sessão do mascote.

Os demais tetos (boot, 1ª visita, rolagem, PSS) ficam como estão.
