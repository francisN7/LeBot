# MVP — o que foi entregue (S0 a S12b)

Uma linha por sessão, com a entrega e o critério de aceite. O histórico completo
está no Git (`git log -- docs/sessions`); as specs saíram do working tree na
S13c. A fase de documentação e o release (`S13a`–`S13e`) ficam em
[`next.md`](next.md).

| Sessão | Entrega | Aceite |
|---|---|---|
| S0 | Fundação pública + onboarding Expo | App abre no Expo Go; CI e gitleaks verdes |
| S1 | Design system + shell | 4 abas navegáveis com dados fake |
| S2 | Persistência SQLite + Drizzle | CRUD via repositório testado |
| S3 | Biblioteca (cadastro, ISBN, capas) | Cadastrar → achar → editar |
| S3a | Gêneros personalizados + cores | CRUD de gênero com par claro/escuro; conferido no Android |
| S4a | Identidade 3D vetorial | Lombada por gênero e status, com hex livre |
| S4b | ISBN oficial + avisos + capa na Fila | Máscara pela tabela oficial; capa na Fila; conferido |
| S4c | Movimento e vida | Mola, cascata, detalhe animado e capa como livro |
| S5 | Registro de leitura | Sessão grava progresso e status na hora; piso travado |
| S6 | Motor do plano (funções puras) | Meta 3–200, volta leve, principal, teto e 75 testes |
| S7 | Plano na UI + tela Hoje | Plano real, sugestão com selo e registro pelo bloco |
| S7a | Ajustes da revisão | Registrar retoma pausado; Hoje antes da Ordem |
| S8 | Ordem real e anti-ressaca | Ordem automática por status; drop por alça |
| S8a | Troca rápida de status | Roda radial com prévia e gravação ao soltar |
| S9 | Conclusão + resenha | Nota, texto, citação e campos extras |
| S10 | Estatísticas e insights | Períodos civis, linha do tempo e drill-down |
| S11 | Configurações + backup ZIP | Meta editável, backup com capas, fila saneada |
| S11a | Design 3D da lombada | Lombada B, etiqueta e tassel |
| S11b | Tassel animado | Balanço C no cheio e no compacto |
| S11c | Estante fluida | Lombada em camadas + FlatList; 84 fps em dev |
| S12 | Release interno (v0.2.0) | APK assinado instalado fora do Expo Go; backup ok |
| S12a | Build no Actions + limpeza | Assinatura/permissões conferidas; ~22,6 GB livres |
| S12b | Estante cheia + Ordem paginada (v0.2.1) | 71,5% → ~5% janky; Ordem sem ANR; APK medido |

**Resultado do MVP:** estante, plano diário determinístico, Ordem, registro e
resenha, estatísticas, backup `.zip` e um APK instalável — tudo offline, sem
conta e sem servidor.
