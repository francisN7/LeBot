# S01 — Design system + shell

## Objetivo

Ter o app com a cara do LêBot: tokens de design aplicados, tipografia própria e
4 abas navegáveis (`Estante`, `Fila`, `Hoje`, `Ajustes`) alimentadas por dados
fake — sem banco de dados.

## Fora de escopo

- SQLite, Drizzle, repositórios.
- Cadastro de livro, ISBN, capas reais.
- Motor do plano e cálculo de páginas.
- Ícone/splash finais (S4).

## Tarefas

1. Instalar NativeWind com `npx expo install` e configurar `tailwind.config.ts`
   + `global.css` mapeando a paleta de `docs/brand.md`.
2. Carregar Fredoka (600/700) e Nunito (400/600/700) com `expo-font`, com
   splash controlado até as fontes estarem prontas.
3. `src/theme/`: cores, espaçamento, raios e tipografia como tokens tipados.
4. `src/components/ui/`: `Screen`, `AppText`, `Button`, `Card`, `Chip`, `Spine`
   (placeholder 2D da lombada).
5. `src/app/(tabs)/_layout.tsx` com as 4 abas, ícones e estados ativos.
6. Conteúdo fake em `src/features/<nome>/__fixtures__/` e telas montadas com os
   componentes novos.
7. Testes: render das 4 telas e de `Button`/`Spine` com React Testing Library.
8. Docs: `docs/design/design-system.md` com tokens e exemplos.

## Aceite

- [x] 4 abas navegam no Expo Go sem warning de fonte.
- [x] Nenhum estilo hardcoded fora de `src/theme/` e do NativeWind.
- [x] `npm run lint`, `npm run typecheck` e `npm run test` verdes.
- [x] `docs/design/design-system.md` publicado e `docs/INDEX.md` atualizado.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `docs/brand.md`,
`docs/architecture.md`.

## Arquivos prováveis

`tailwind.config.ts`, `global.css`, `src/theme/*`, `src/components/ui/*`,
`src/app/(tabs)/*`, `src/features/*/__fixtures__/*`, `docs/design/design-system.md`.

## Riscos

- NativeWind + Expo Router: precisa de `jsxImportSource` e do `global.css`
  importado no layout raiz; validar cedo no Android.
- Fontes com acento PT-BR: testar `Lê`, `ç`, `ã` na tela antes de seguir.
- `Spine` pode virar um componente complexo demais — nesta sessão é só um bloco
  2D colorido por gênero.
