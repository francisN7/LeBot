# S11b — Tassel animado (balanço como vento)

## Objetivo

Fazer o tassel da lombada balançar **para a esquerda**, como se uma rajada de
vento o empurrasse, depois de pesquisar referência real, montar modelos e
aprovar intensidade e ritmo com o dono.

## Contexto

- O tassel T1 está no canto superior esquerdo da lombada B (64×128 / 52×104):
  corda saindo do topo, corpo, pescoço, franja de seis fios, gradiente dourado e
  sombra. O desenho foi aprovado na S11a.
- **O balanço não animou no Android.** A tentativa com `AnimatedG` do
  `react-native-svg` + `rotation` animado pelo Reanimated não produziu movimento
  perceptível. O código do `swing`/`AnimatedG` ainda está em `SpineArtwork` e
  deve ser investigado e substituído.
- O pedido é um movimento **assimétrico para a esquerda** (para fora da
  lombada), como vento — não um pêndulo simétrico. A franja pode ter atraso
  (follow-through), mas o corpo do tassel manda no movimento.
- A S11a fechou com o desenho e a capa; esta sessão mexe **só** no movimento.

## Fora de escopo

- Redesenhar a lombada B, a etiqueta, o rosto, a capa S2, a paleta ou os
  tamanhos.
- Animar o mascote, a grade ou outras telas.
- `useReducedMotion`/acessibilidade de movimento (backlog; só se o dono pedir).
- S12 (release interno).

## Tarefas

1. **Pesquisar** referência real de tassel/fita ao vento e princípios de
   animação (antecipação, follow-through, overshoot, curva assimétrica).
   Registrar 3–4 links e o que se aplica a 64/52 px.
2. **Diagnosticar** por que `AnimatedG` + `rotation` não animou no Android.
   Testar cedo um protótipo mínimo no aparelho antes de investir nos modelos.
   Alternativas a avaliar:
   - `Animated.View` nativo envolvendo um SVG só do tassel;
   - animar `transform` (matriz/rotação) no wrapper, não no `G`;
   - `useAnimatedProps` em um `Path`/`G` com `transform` serializado;
   - outro componente/abordagem que rode no UI thread.
3. **Modelos em `.temp/s11b-tassel/`**: 3 opções de balanço **para a esquerda**
   com amplitudes, durações e curvas diferentes; mostrar no 64×128 e no 52×104,
   em 2–3 gêneros, com o tassel + sombra + franja. Incluir:
   - uma opção contida (vento fraco);
   - uma com follow-through na franja;
   - uma mais perceptível, mas ainda sutil.
   O dono aprova uma (ou pede ajuste).
4. **Implementar** a opção aprovada em `SpineArtwork`/`Spine` sem mudar o
   layout nem o toque. O ciclo deve ir para a esquerda, voltar e repetir; a
   sombra acompanha ou fica no corpo conforme o modelo aprovado. Manter o
   `testID` do tassel e a piscada/zzz intactos.
5. **Testes**: config pura do movimento (amplitude/duração/pausa) se houver;
   montagem do componente; **não** afirmar sobre frames. Ajustar
   `Spine.test.tsx` se o componente animado mudar de tipo.
6. **Docs**: `assets-3d.md` (movimento), `design-system.md`, `testing.md`,
   `CURRENT.md`, `roadmap.md`, `CHANGELOG.md`; ADR 0023 (ou adendo à 0022) para a
   técnica que funciona no Android.
7. **Conferir no Android:** o tassel balança para a esquerda de forma visível e
   sutil, no cheio e no compacto, em todos os status/gêneros; sem queda de frame
   e sem mexer no layout/toque.

## Aceite

- [ ] Pesquisa registrada com 3–4 referências e o diagnóstico do `AnimatedG`.
- [ ] 3 modelos de balanço para a esquerda em `.temp/s11b-tassel/`; um aprovado.
- [ ] O tassel balança para a esquerda e volta em loop, no 64 e no 52, com a
      sombra coerente; não é um pêndulo simétrico.
- [ ] Sem mudança de layout/toque; o resto da lombada fica igual.
- [ ] Testes, lint, typecheck, doctor e export verdes; conferido no Android.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `docs/design/assets-3d.md`,
`docs/adr/0022-lombada-e-capa-em-svg.md`, `src/components/ui/SpineArtwork.tsx`,
`Spine.tsx`, `SpineFace.tsx` e `.temp/README.md`.

## Arquivos prováveis

- `src/components/ui/SpineArtwork.tsx`, `Spine.tsx`, `Spine.test.tsx`
- `docs/design/assets-3d.md`, `docs/design/design-system.md`, `docs/testing.md`
- `docs/adr/0022-lombada-e-capa-em-svg.md` (adendo) ou
  `docs/adr/0023-animacao-tassel.md`
- `.temp/s11b-tassel/` (modelos, ignorado)

## Riscos

- **Reanimated + react-native-svg:** `rotation` no `G` pode não animar no
  Android; testar um protótipo mínimo no aparelho antes dos modelos. Se o `G`
  não funcionar, o tassel pode virar um SVG separado dentro de um
  `Animated.View`.
- **Tassel pequeno:** no 52×104 o movimento pode virar ruído; reduzir amplitude
  no compacto ou simplificar a franja.
- **Vento ≠ pêndulo:** o pedido é para a esquerda; usar uma rajada com retorno
  mais lento/curva assimétrica, não uma oscilação simétrica.
- **Sombra:** uma sombra estática pode denunciar o movimento; decidir no modelo
  se ela acompanha.
- **Performance:** várias lombadas na grade; só `transform`/opacity, sem
  layout, sem loops caros.
- **Acessibilidade:** movimento contínuo; `useReducedMotion` fica no backlog, a
  menos que o dono peça.

## Próximo depois desta

**S12** — release interno, com a spec em `docs/sessions/S12-release-interno.md`.
