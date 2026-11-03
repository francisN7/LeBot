# S12b — Otimização rápida da estante (0.2.0)

## Objetivo

Duas correções cirúrgicas de performance na Estante do **0.2.0**, sem versão
nova e **sem mexer nas animações**: `windowSize` menor e `React.memo` no card.
Medir antes e depois com 200 livros e registrar os números.

> Roda antes da S12a. A lombada continua animada na grade (decisão do dono);
> qualquer otimização que exija card estático, relógio compartilhado ou pausar
> animação **não** entra aqui.

## Fora de escopo

- Deixar a lombada estática, congelar animação na rolagem ou animar só os
  visíveis — a animação fica como está.
- Sombras, `shelfDepth`, gesto do `StatusWheelTrigger` e debounce da busca.
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

O que já existe no código (`EstanteScreen.tsx`):

- `FlatList` com `numColumns={2}`, `windowSize={5}`, `removeClippedSubviews`,
  lote inicial e `maxToRenderPerBatch`. **`windowSize` já não é o padrão 21** —
  o teste aqui é descer para 3, não “sair do padrão”.
- `renderBook` é uma função inline: o card é recriado a cada render da tela
  (busca, filtro, roda de status). Não há `memo` no card.
- As animações (`sheen`, piscada, “zzz”, tassel) rodam em todos os cards
  montados; `windowSize` menor reduz quantos ficam vivos de uma vez — é o ganho
  que buscamos sem tocar na lombada.

## Tarefas

1. **Fixture UTF-8 + linha de base.** Criar `scripts/build-200-books.mjs`
   (versionado) gerando `lebot-200.zip` com o schema atual e acentos corretos (o
   `lebot-backup-cheio.zip` da S11 tem texto duplicado: `Breve RelÃ³gio`).
   Restaurar no aparelho e medir a linha de base antes de mexer no código.
2. **`windowSize` 5 → 3.** Revisar `initialNumToRender`/`maxToRenderPerBatch`
   para não abrir buraco branco e medir. Se 3 piorar (área vazia) ou não mudar,
   ficar com 4 e registrar a decisão.
3. **`React.memo` no card.** Extrair o card para um componente próprio
   (`BookCard`) com props primitivas/estáveis, `useCallback` nos handlers e
   `memo` com comparação padrão. Conferir que:
   - o card não re-renderiza quando outro card muda de status/preview;
   - as animações **não reiniciam** a cada render (deps dos `useEffect`).
4. **Medir e comparar.** Mesmo protocolo para 200 e 5 livros, duas rodadas cada.
   Registrar frames, janky, mediana e p95 na spec e no `CURRENT.md`.
5. **Publicar só se compensar.** Se a rolagem com 200 livros melhorar de forma
   perceptível, gerar o APK (mesma assinatura), instalar por cima e trocar o
   asset do `v0.2.0` (`gh release upload v0.2.0 ... --clobber`), com
   `apksigner` conferido. Se não houver ganho real, não publicar: registrar a
   medição e deixar a mudança seguir no próximo build da S12a.
6. **Fechar.** `CURRENT.md`, `roadmap.md`, `CHANGELOG.md` (entrada `S12b`) e
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

- [ ] `windowSize` em 3 (ou 4, com o motivo registrado) e `React.memo` no card,
      sem card em branco e sem animação reiniciando ao rolar.
- [ ] 5 livros sem regressão (referência: 4,4% / 20 ms).
- [ ] Medição de 200 livros feita antes e depois, com os números registrados.
- [ ] A lombada continua animada na grade, como no 0.2.0.
- [ ] `lebot-200.zip` abre com acentos corretos e o gerador está em `scripts/`.
- [ ] Se publicar: APK instala por cima do 0.2.0 (mesma assinatura) e o asset do
      `v0.2.0` fica com o build corrigido.
- [ ] lint, typecheck, test, doctor e `expo export` verdes.

> Nota: com só essas duas mudanças, a meta de ≤ 5% janky provavelmente **não**
> será atingida (a linha de base é 77%). O compromisso da sessão é medir com
> honestidade e registrar o ganho real, não forçar o número.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, `docs/sessions/S12-release-interno.md`,
`src/features/library/EstanteScreen.tsx`, `src/features/library/use-books.ts`.

## Arquivos prováveis

- `src/features/library/EstanteScreen.tsx` (ou `BookCard.tsx` novo)
- `scripts/build-200-books.mjs`
- `docs/sessions/S12b-otimizacao-estante.md`, `docs/state/CURRENT.md`

## Riscos

- **`windowSize` baixo demais:** aparece área branca antes do card montar.
  Conferir rolagem longa, não só uma tela.
- **`memo` que não memoiza:** se as props do card mudarem a cada render (objeto
  de gênero, review, callbacks inline), o `memo` não faz nada. Medir o número de
  renders antes de comemorar.
- **Animação reiniciando:** mover o card para um componente pode remontar a
  lombada (piscada/tassel voltam do zero a cada rolagem). Conferir visualmente.
- **Ruído do `adb input swipe`:** repetir e comparar mediana, não um número só.
- **Custo do build:** ~11 min por iteração; agrupar as duas mudanças em um build.
