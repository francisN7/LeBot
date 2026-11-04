# S13e — Publicar o v0.2.1 (fim do MVP)

## Objetivo

Publicar o Release `v0.2.1` no GitHub com o **mesmo APK medido na S12b**, as
notas de `docs/releases/v0.2.1.md` e a documentação já fechada — encerrando o
MVP.

## Estado de partida

- APK durável em `C:\Users\francis\Apps\Codes\lebot-artifacts\lebot-0.2.1.apk`
  (cópia da S13a) e artefato `lebot-apk` do run `41766015381`.
- SHA-256 medido: `1D4AE065C6C76497FABCDAE2595347EF1A8F1492E0CC627948E89183FEADD838`.
- Código congelado em `7da3c88` (S12b). Os commits da S13 são só documentação.

## Fora de escopo

- Mudar código do app: qualquer alteração depois de `7da3c88` exige rebuild e
  nova medição antes de publicar.
- Trocar o asset do `v0.2.0`; Play Store; iOS.

## Tarefas

1. **Conferir o artefato.** `gh run view 41766015381` e/ou a cópia durável;
   comparar o SHA-256 com o medido. Se o artefato expirou, rodar
   `gh workflow run release.yml` no commit `7da3c88`, refazer a medição curta da
   Estante e só então publicar.
2. **Notas:** confirmar `docs/releases/v0.2.1.md` sem H1 (o título do Release não
   se repete no corpo) e com a linha `Build: 7da3c88`.
3. **Criar o Release:**
   `gh release create v0.2.1 --target main --title "LêBot v0.2.1" --notes-file docs/releases/v0.2.1.md`
   e anexar o APK medido com `gh release upload v0.2.1 <arquivo>`. A tag criada
   pela API não dispara um build novo.
4. **Conferir o asset publicado:** baixar do Release, comparar o SHA-256,
   conferir `versionCode 2`, ausência de `RECORD_AUDIO`/`SYSTEM_ALERT_WINDOW` e
   `allowBackup="false"`.
5. **Instalar o asset do Release** por cima do aparelho (mesma assinatura) e
   abrir Estante, Hoje e Ordem uma vez; dados intactos.
6. **Fechar docs:** entrada `0.2.1` no `CHANGELOG.md`, `CURRENT.md`, `mvp` com a
   S13e marcada e o SHA-256 em `guide/release.md`. Conferir que o badge do README
   já aponta para o novo Release (é dinâmico; não editar).
7. Commitar `S13e: ...` e encerrar o MVP.

## Aceite

- [ ] Release `v0.2.1` publicado, sem título duplicado no corpo.
- [ ] Asset `lebot-0.2.1.apk` presente e com o SHA-256 do APK medido.
- [ ] APK baixado do Release instala por cima do 0.2.0 com os dados intactos.
- [ ] `CHANGELOG`, `CURRENT`, `mvp` e `release.md` fechados.
- [ ] `lint`, `typecheck`, `test` e `docs:check` verdes.

## Orçamento de contexto (≤250 linhas)

`AGENTS.md`, `CURRENT.md`, esta spec, `guide/release.md`,
`docs/releases/v0.2.1.md`. Não abrir `src/`.

## Arquivos prováveis

`docs/state/CURRENT.md`, `docs/roadmap/mvp.md`, `CHANGELOG.md`,
`guide/release.md`, `docs/releases/v0.2.1.md`.

## Riscos

- **Artefato expirado:** o Actions guarda 30 dias; a cópia durável é a rede.
  Sem ela, rebuild no `7da3c88` + medição curta — nunca publicar outro build.
- **Tag errada:** o Release precisa apontar para `main` com as docs fechadas, e
  o corpo deve registrar o commit do build (`7da3c88`).
- **Assinatura:** keystore perdido impede atualizar quem já instalou; o CI
  compara o SHA-256 do certificado e reprova antes de publicar.
- **Publicar antes das docs:** a sequência é S13a → S13d antes desta; se algo
  atrasar, adiar o Release em vez de publicar com link quebrado.

## Depois do MVP

Fase 14 — Código: S14a (code tour + convenções) e as sessões de refactor por
feature, na ordem definida em `roadmap/next.md`.
