# Roadmap

Status: `[ ]` pendente · `[~]` em andamento · `[x]` concluída.

Uma sessão = uma entrega vertical + testes + documentação + commit. A spec da próxima sessão é escrita no fim da sessão anterior.

| Sessão | Status | Entrega | Critério de aceite | Spec |
|---|---|---|---|---|
| S0 | [x] | Fundação pública + onboarding Expo | App abre no Expo Go; CI verde; gitleaks limpo | `sessions/S00-fundacao.md` |
| S1 | [x] | Design system + shell | 4 abas navegáveis com dados fake | `sessions/S01-design-system.md` |
| S2 | [ ] | Persistência (SQLite + Drizzle) | CRUD via repositório testado | `sessions/S02-persistencia.md` |
| S3 | [ ] | Biblioteca (cadastro, ISBN, capas) | Cadastrar → achar → editar | — |
| S4 | [ ] | Identidade 3D (mascote + lombadas) | Estante fluida com identidade própria | — |
| S5 | [ ] | Registro de leitura | Registrar sessão e ver progresso | — |
| S6 | [ ] | Motor do plano (funções puras) | 25+ testes e algoritmo documentado | — |
| S7 | [ ] | Plano na UI + tela Hoje | Plano diário ponta a ponta | — |
| S8 | [ ] | Fila e ordem anti-ressaca | Sugestão automática + reordenação | — |
| S9 | [ ] | Conclusão + resenha | Livro finalizado gera resenha completa | — |
| S10 | [ ] | Estatísticas e insights | Tela com dados reais | — |
| S11 | [ ] | Configurações + backup JSON | Round-trip de export/import testado | — |
| S12 | [ ] | Release interno | APK instalável no Android | — |
| S13 | [ ] | Documentação final | Docs revisados e changelog fechado | — |

## Backlog pós-MVP

- Sync multi-dispositivo (Supabase ou similar).
- Compartilhar resenhas.
- Importação Goodreads.
- Widget de progresso diário.
- Recomendações com IA (sempre via proxy, nunca chave no app).
- Audiobook tracking e OCR de capa.
