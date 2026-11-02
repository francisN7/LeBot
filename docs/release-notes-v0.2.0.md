# LêBot v0.2.0 — primeiro APK instalável

Primeiro build fora do Expo Go. Ainda é um release **interno**: sem Play Store,
sem iOS e sem conta na nuvem — o APK assinado fica no GitHub Releases.

## O que tem no app

- **Estante** com lombadas 3D por gênero e status, capa real, busca sem acento e
  filtros por gênero e status.
- **Hoje** com o plano diário calculado no aparelho: meta de páginas, volta
  leve, alternância de gênero e sugestão da Ordem.
- **Ordem** de leitura persistida, com blocos "Lendo agora" e "Depois",
  reordenação por alça ou setas e "Sugerir ordem".
- **Registro de leitura** com páginas, histórico por livro e conclusão
  automática; troca rápida de status pela roda (segurar o chip na Estante).
- **Conclusão com resenha**: nota de 1 a 5, texto, citação e campos extras
  configuráveis.
- **Meu ritmo**: páginas, dias com leitura, sequência, gêneros, notas e linha do
  tempo, por semana, mês, 3 meses ou ano.
- **Ajustes** com meta diária editável, gêneros personalizados e **backup
  manual** em `.zip` (exportar e restaurar, capas incluídas).
- Tudo local: SQLite no aparelho, nenhuma conta e nenhuma chamada de rede.

## Como instalar

1. Baixe o `app-release.apk` nos assets deste release.
2. No Android, permita "instalar apps de fontes desconhecidas" para o navegador
   ou gerenciador de arquivos usado no download.
3. Abra o APK e instale. Para atualizar depois, instale por cima — a assinatura
   é a mesma.

Requisitos: Android 7.0+ (o app é arm-only: `arm64-v8a` e `armeabi-v7a`).

## Limitações conhecidas

- Sem Play Store e sem iOS nesta versão.
- Backup é manual; não há sincronização entre aparelhos.
- Lembrete e Aparência aparecem em Ajustes como "Em breve".
- A Estante pode ficar lenta com centenas de livros; a correção está na próxima
  versão.
- Perder o keystore de assinatura impede atualizações futuras de quem já
  instalou o app.
