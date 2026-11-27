# S14d — Prova Skia: lombada 3D flutuante

## Objetivo

Saber, com números do APK de release, se uma lombada em Skia (3D flutuante,
mesmo rosto) custa no máximo metade da lombada SVG animada. Antes da medição, o
dono aprova o visual no aparelho.

## Fora de escopo

- Migrar a grade inteira, capas ou mascote (é a S14f/S14g).
- O "maestro" de vida em intervalos (S14f).
- Rive: só entra na decisão do mascote (S14g).

## Tarefas

1. `npx expo install @shopify/react-native-skia` (2.14.0, a versão do SDK 58).
   Conferir à mão se foi para `dependencies` e se o `jest-expo` não saiu de
   `devDependencies` (armadilha do `expo install` em `CURRENT.md`).
2. Protótipo `src/components/ui/skia/SpineCanvas.tsx` com a interface de
   `SpineArtwork` (`expression`, `palette`, `width`, `height`, `animating`):
   - corpo cilíndrico com gradiente;
   - "3D flutuante": inclinação por matriz, sombra que acompanha e leve
     oscilação;
   - rosto (`SpineEyes` e `SpineMouth` portados para paths), tassel, brilho
     e piscada;
   - valores do Reanimated passados direto à Skia, com o gate de
     `useAmbientMotion`.
3. Interruptor "Lombada experimental" em Ajustes, guardado em `settings` pelo
   repositório, trocando `SpineArtwork` por `SpineCanvas` em `Spine`. Sai na
   S14f.
4. Modo de pior caso para medir: todas as lombadas visíveis em loop, nos dois
   renderizadores (só para a prova; documentar como ligar).
5. Calibrar `scripts/measure-wheel.sh`: hoje dá só ~41 quadros por rodada,
   com 2 ou 6 voltas (`reference/performance.md` → **Depois da animação com fim**).
6. Medir na f200 (backup do dono antes): parado no pior caso, rolagem,
   threads e PSS, SVG × Skia no mesmo APK. Registrar em
   `reference/performance.md` e decidir na ADR 0030.

## Aceite

- [ ] Pior caso: CPU com Skia ≤ metade da com SVG; rolagem sem piora; PSS
  ≤ 250 MiB. Hash do APK anotado.
- [ ] Dono aprova o visual da lombada 3D no aparelho.
- [ ] ADR 0030 (migra ou não, e por quê); roadmap da S14f ajustado.
- [ ] lint, typecheck, testes e docs verdes; commit `S14d: ...`.

## Orçamento de contexto (≤ 400 linhas)

`AGENTS.md`, `CURRENT.md`, esta spec, o adendo da S14c na ADR 0029 e
`reference/performance.md` → **Depois da animação com fim** e **Animação rica
e leve**. Código:
`SpineArtwork.tsx` (só `TASSEL`, `SETTLE_MS` e os efeitos de animação),
`SpineFace.tsx` (paths do rosto) e `Spine.tsx`.

## Arquivos prováveis

`package.json`, `src/components/ui/skia/SpineCanvas.tsx`,
`src/components/ui/Spine.tsx`, `src/features/settings/`,
`src/features/library/spine-art.ts` e `scripts/measure-wheel.sh`.

## Riscos

- **Skia no Jest:** pode exigir um mock (`@shopify/react-native-skia/jestSetup`).
- **Medição injusta:** os dois renderizadores precisam do mesmo pior caso, no
  mesmo APK e na mesma sessão térmica.
- **Tamanho:** ~6 MB por ABI aceitos pelo dono; anotar o APK.
- **Acervo do aparelho:** restaurar o fixture apaga o real; pedir backup.

## Próximo depois desta

S14e — Leveza II: Ordem sem O(n), splash e APK por ABI.
