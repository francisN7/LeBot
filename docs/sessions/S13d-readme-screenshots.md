# S13d — README, screenshots e logo

## Objetivo

Transformar o `README.md` na vitrine do projeto: logo, badges, telas reais com
dados fictícios, instalação para quem só quer usar e um bloco curto para quem
vai mexer no código — em PT-BR, com um resumo em inglês no fim.

## Fora de escopo

- Mudar o app, o APK ou a versão.
- Publicar o `v0.2.1` (S13e).
- Reescrever os docs de referência (S13b/S13c já fecharam).

## Tarefas

1. **Fixture de demonstração.** `scripts/build-demo-backup.mjs` gera
   `lebot-demo.zip` com 12–16 livros fictícios em PT-BR, gêneros e status
   variados, um concluído com resenha e citação — **sem capas** (a lombada é a
   identidade do app e evita imagem de terceiro). Validar com `parseBackup` e
   `validateBackup` do próprio app, como o `build-200-books.mjs` faz.
2. **Protocolo de captura (sem dado real):**
   1. exportar o backup real do aparelho para o PC, **fora do repositório**;
   2. restaurar `lebot-demo.zip` e conferir que o acervo é o fictício;
   3. limpar a status bar (`sysui_demo_allowed` + demo mode: 9:41, bateria
      cheia, sem notificação) e conferir que não há nome real na tela;
   4. `adb exec-out screencap -p` em: **Estante, Hoje, Ordem, detalhe do livro,
      Meu ritmo, Ajustes/backup**;
   5. otimizar com `sharp` (largura ≤900 px, <200 KB cada);
   6. restaurar o backup real e conferir o acervo no aparelho.
3. **Assets em `docs/assets/`:** `logo.png` gerado de `brand/source/mark.svg`,
   `screenshots/*.png` (6) e `social-preview.png` 1280×640 com a marca e a
   frase. Nada disso entra no bundle do app.
4. **README (~140 linhas):**
   - hero: logo, nome, frase, badges **dinâmicos** (CI, último Release, MIT,
     Expo SDK 58) e atalhos;
   - tabela com 3 telas e legenda de uma linha;
   - **O que é** (4 bullets, incluindo "sem culpa");
   - **Baixar:** link para `/releases` (não `/latest`), Android, tamanho, dados
     locais, instalar por cima preserva o acervo;
   - **Como funciona:** estante, Hoje (motor determinístico), Ordem, resenha e
     ritmo, backup `.zip`;
   - **Privacidade** (3 linhas) e link para `docs/reference/security-privacy.md`;
   - **Para devs:** requisitos, `npm install` + `npm start`, tabela de scripts,
     estrutura, 517 testes, "release só no CI", mapa de `docs/README.md`;
   - **Sobre:** a dedicatória, em um parágrafo;
   - **Marca e licença:** MIT cobre código e arte; a identidade do LêBot não é
     licenciada para forks (nome, mascote e logo);
   - **English:** resumo de 5 linhas.
5. **Conferência real:** executar cada comando citado no README (inclusive
   `npm run docs:check`) e corrigir o que não funcionar.
6. **GitHub:** subir o social preview e conferir a renderização do README no
   desktop e no celular.

## Aceite

- [ ] README com logo, badges e 6 telas; **nenhum dado real** nas imagens.
- [ ] Todo comando citado no README executa.
- [ ] Links de docs válidos e versão sem número fixo (badge dinâmico).
- [ ] `social-preview.png` aplicado no GitHub.
- [ ] Acervo real restaurado no aparelho e conferido.
- [ ] `lebot-demo.zip` fora do Git; imagens somando <1,5 MB.
- [ ] `lint`, `typecheck`, `test` e `docs:check` verdes; commit `S13d: ...`.

## Orçamento de contexto (≤300 linhas)

`AGENTS.md`, `CURRENT.md`, esta spec, `docs/README.md`, `reference/brand.md` e
`guide/release.md`. Não abrir `src/`.

## Arquivos prováveis

`README.md`, `scripts/build-demo-backup.mjs`, `docs/assets/**`,
`docs/state/CURRENT.md`, `package.json` (script do fixture, se fizer sentido).

## Riscos

- **Dado real nas imagens:** notificação, nome de livro ou capa real. Conferir
  cada PNG antes do commit; o fixture é a única fonte de dados.
- **Backup real perdido:** exportar e guardar **fora do repositório** antes de
  restaurar o demo; testar a restauração de volta antes de seguir.
- **Assets pesados:** 6 PNGs de 1080×2400 passam de 3 MB; redimensionar e
  otimizar antes de commitar.
- **Badge de Release apontando para o nada:** enquanto a S13e não roda, o badge
  mostra o `v0.2.0` — é o comportamento esperado, não é bug.
- **README prometer o que o app não faz:** cada bullet precisa existir na tela;
  o que for backlog fica no roadmap, não na vitrine.

## Próximo depois desta

S13e — publicar o `v0.2.1` e fechar o MVP.
