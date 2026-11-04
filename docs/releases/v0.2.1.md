> **Para você, minha amada esposa.**
>
> A estante cheia era o único lugar onde o LêBot ainda pesava. Nesta versão ela
> aprendeu a se comportar: as lombadas só se mexem quando estão à vista, e
> descansam enquanto você rola. O resto é arrumação — o app agora declara menos
> permissões e não deixa o Android copiar seus dados sem você pedir.
>
> ~ ☀️🌸.

Correção de desempenho e limpeza do release **interno**: sem Play Store, sem iOS
e sem conta na nuvem — o APK assinado fica no GitHub Releases.

## O que mudou desde o 0.2.0

- **Estante mais leve.** Só as lombadas visíveis animam (brilho, piscada, “zzz” e
  tassel); as de fora da tela ficam paradas e as animações pausam durante a
  rolagem, voltando suavemente quando você solta.
- **Ordem paginada.** A Ordem mostra **10 livros por página**, com "Anterior" e
  "Próxima" — montar a lista inteira travava o app com a estante cheia. As setas
  continuam movendo (inclusive para a página anterior/seguinte) e o arrasto fica
  dentro da página.
- **Menos permissões.** O APK não declara mais `RECORD_AUDIO` nem
  `SYSTEM_ALERT_WINDOW` — as duas vinham de bibliotecas e não eram usadas.
- **Backup automático do Android desligado.** Seus dados continuam só no
  aparelho: o backup manual em `.zip` (Ajustes) segue funcionando normalmente.
- **Build 100% no GitHub Actions**, com conferência de assinatura, permissões e
  `allowBackup` antes de publicar. O computador não compila mais o APK.
- **Bibliotecas alinhadas** com o Expo Doctor (patches de `expo`, `expo-router`,
  `expo-splash-screen`, `expo-constants` e `react-native-safe-area-context`).

## Como instalar

1. Baixe o `lebot-0.2.1.apk` nos assets deste release.
2. No Android, permita "instalar apps de fontes desconhecidas" para o navegador
   ou gerenciador de arquivos usado no download.
3. Abra o APK e instale **por cima** do 0.2.0 — a assinatura é a mesma e seus
   livros, fila e resenhas continuam lá.

Requisitos: Android 7.0+ (o app é arm-only: `arm64-v8a` e `armeabi-v7a`).

## Limitações conhecidas

- Sem Play Store e sem iOS nesta versão.
- Backup é manual; não há sincronização entre aparelhos.
- Lembrete e Aparência aparecem em Ajustes como "Em breve".
- Perder o keystore de assinatura impede atualizações futuras de quem já
  instalou o app.
