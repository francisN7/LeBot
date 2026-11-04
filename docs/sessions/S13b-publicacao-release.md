# S13b — Publicar o v0.2.1 (fim do MVP)

## Objetivo

Publicar o Release `v0.2.1` no GitHub com o **mesmo APK medido na S12b**, as
notas de `docs/release-notes-v0.2.1.md` e a documentação já fechada pela S13a.

## Fora de escopo

- Mudar código do app: o build publicado é o da S12b (run `41766015381`). Se
  houver qualquer mudança depois dele, rebuild e nova medição antes de publicar.
- Trocar o asset do `v0.2.0` — ele fica como está, é a versão anterior.
- Play Store, iOS e qualquer passo de loja.

## Tarefas

1. **Conferir o artefato.** `gh run view 41766015381` e baixar `lebot-apk`;
   comparar o SHA-256 com
   `1D4AE065C6C76497FABCDAE2595347EF1A8F1492E0CC627948E89183FEADD838`.
   Se o artefato expirou (30 dias), rodar `gh workflow run release.yml` no
   **mesmo commit** e refazer a medição curta antes de publicar.
2. **Criar o Release** com o título no campo certo (o corpo não repete):
   `gh release create v0.2.1 --target main --title "LêBot v0.2.1" --notes-file docs/release-notes-v0.2.1.md`
   e anexar o APK medido com `gh release upload v0.2.1 <arquivo>`. A tag criada
   pela API não dispara um build novo.
3. **Conferir o asset publicado:** baixar do Release e checar `versionCode 2`,
   ausência de `RECORD_AUDIO`/`SYSTEM_ALERT_WINDOW` e `allowBackup="false"`
   (o CI já faz; aqui é a conferência do que ficou no GitHub).
4. **Instalar o asset publicado** por cima do aparelho (mesma assinatura) e abrir
   Estante, Hoje e Ordem uma vez.
5. **Fechar docs:** `CURRENT.md`, `roadmap.md`, `CHANGELOG.md` com a data da
   publicação e o SHA-256 do asset em `docs/release.md`.

## Aceite

- [ ] Release `v0.2.1` publicado, sem título duplicado no corpo.
- [ ] Asset `lebot-0.2.1.apk` presente e com o SHA-256 do APK medido.
- [ ] APK baixado do Release instala por cima do 0.2.0 com os dados intactos.
- [ ] `CURRENT`/`roadmap`/`CHANGELOG` fechados e commit `S13b: ...`.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, `docs/release.md`,
`docs/release-notes-v0.2.1.md` e `docs/sessions/S13a-documentacao-final.md`.

## Arquivos prováveis

- `docs/state/CURRENT.md`, `docs/roadmap.md`, `CHANGELOG.md`, `docs/release.md`

## Riscos

- **Artefato expirado:** o APK vale 30 dias; se expirar, rebuild no mesmo commit
  e medição curta — não publicar algo diferente do medido sem avisar.
- **Tag errada:** `v0.2.1` precisa apontar para o commit do build medido.
- **Assinatura:** keystore perdido impede atualizar quem já instalou; o CI
  compara o SHA-256 do certificado e reprova antes de publicar.
- **Ordem invertida:** publicar antes da S13a deixa as docs sem o fechamento;
  a sequência é S13a → S13b.
