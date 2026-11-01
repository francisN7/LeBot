# S04c — Movimento e vida

## Objetivo

Transformar a identidade da S4a em sensação de objeto: lombada que sai da
prateleira, luz que atravessa a capa, rosto que pisca, mascote que reage e a
tela de detalhe com animação contínua (lá existe um livro só).

## Fora de escopo

- Transição compartilhada entre Estante e detalhe ("voo" da lombada): exige
  layout compartilhado e é a próxima evolução, junto com o S7.
- Contagem animada da meta na Hoje: a meta é estática hoje; só faz sentido
  quando o plano virar dado real (S7).
- Som, háptica e animação 3D de verdade.
- Motor do plano, progresso e fila (S5–S8).

## Regra de movimento

- **Grade:** movimento curto e reativo — mola no toque, piscada ocasional, brilho
  no concluído, entrada em cascata ao trocar filtro/busca. Nada flutuando ao
  mesmo tempo em seis cards.
- **Detalhe (um livro):** animação contínua — flutuação lenta, piscada, brilho
  atravessando a capa. É o único lugar com loop permanente.
- Tudo em Reanimated, só `transform` e `opacity` (sem layout a cada frame).

## Tarefas

1. `SpineArtwork`: piscada (olhos desaparecem no visor navy quando fecham),
   brilho varrendo a lombada e "z" pulsando no sono, com `expression` guiando.
2. `Spine`: mola de toque (escala + inclinação) e `animated` para a flutuação
   contínua do detalhe.
3. Estante: entrada em cascata por card (`FadeInDown` com atraso por índice) e
   `status` também na capa.
4. Detalhe: lombada com `animated` e capa com `animated`.
5. `BookCover` como livro físico: bloco de páginas na borda direita, brilho
   diagonal, selo com o rosto do status e mola no toque.
6. `Mascote`: pulso nos acessórios (zzz e confete), fade na troca de estado e
   respiração mais visível.
7. Hoje: entrada em cascata dos dois cards principais.
8. Testes de regressão (selo com/sem status, arte no detalhe) e docs.

## Aceite

- [x] Lombada inclina e volta com mola ao toque; capa idem.
- [x] Estante entra em cascata ao trocar filtro/busca.
- [x] Detalhe tem flutuação contínua e a micro-animação do status.
- [x] Capa personalizada usa bloco de páginas, brilho e selo do status.
- [x] Mascote pulsa os acessórios e troca de estado com fade.
- [x] Nenhuma animação contínua na grade além de piscada/brilho do status.
- [x] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes.
- [x] Conferido no Android pelo dono. Ícone e splash só aparecem em build
      nativo (Expo Go mostra a tela dele); conferir no APK da S12.

## Contexto necessário

`docs/design/assets-3d.md`, `docs/design/design-system.md`,
`src/components/ui/{Spine,SpineArtwork,SpineFace,Mascot,BookCover}.tsx`,
`src/features/library/{EstanteScreen,BookDetailScreen}.tsx`,
`src/features/today/HojeScreen.tsx`.

## Riscos

- **Bateria:** seis lombadas animando em loop aquecem à toa; por isso o loop
  contínuo fica no detalhe.
- **Jest:** Reanimated só roda pelo resolver oficial no `package.json`; efeito
  com `withRepeat` não deve ser testado por tempo, e sim por presença de
  `testID` e pelo estado de acessibilidade.
- **Selo sobre foto escura:** o selo é creme com borda navy, nunca transparente.
- **Capa compacta:** 72×104 é o limite; o selo é proporcional (`width * 0.26`,
  entre 18 e 26 px).

## Próximo depois desta

S5 — registro de leitura (`docs/sessions/S05-registro-de-leitura.md`).
