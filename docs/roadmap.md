# Roadmap

Status: `[ ]` pendente · `[~]` em andamento · `[x]` concluída.

Uma sessão = uma entrega vertical + testes + documentação + commit. A spec da próxima sessão é escrita no fim da sessão anterior.

| Sessão | Status | Entrega | Critério de aceite | Spec |
|---|---|---|---|---|
| S0 | [x] | Fundação pública + onboarding Expo | App abre no Expo Go; CI verde; gitleaks limpo | `sessions/S00-fundacao.md` |
| S1 | [x] | Design system + shell | 4 abas navegáveis com dados fake | `sessions/S01-design-system.md` |
| S2 | [x] | Persistência (SQLite + Drizzle) | CRUD via repositório testado | `sessions/S02-persistencia.md` |
| S3 | [x] | Biblioteca (cadastro, ISBN, capas) | Cadastrar → achar → editar | `sessions/S03-biblioteca.md` |
| S3.2 | [x] | Gêneros personalizados + cores por tema | Criar/editar/excluir gênero com par claro/escuro; conferido no Android | `sessions/S03.2-generos.md` |
| S4a | [~] | Identidade 3D vetorial (mascote + lombadas) | Estante com identidade própria, lombada por gênero+status e qualquer hex | `sessions/S04a-identidade-3d.md` |
| S4c | [~] | Movimento e vida | Mola no toque, cascata na grade, detalhe com animação contínua e capa tratada como livro | `sessions/S04c-movimento.md` |
| S4b | [ ] | ISBN oficial + avisos + capa na Fila | Máscara pela tabela oficial; terminal limpo; capa na Fila | `sessions/S04b-isbn-avisos-fila.md` |
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

- Tema escuro: os gêneros já guardam o par claro/escuro (S3.2); falta o toggle,
  os tokens de superfície e revisar contraste em todas as telas.
- Sync multi-dispositivo (Supabase ou similar).
- Compartilhar resenhas.
- Importação Goodreads.
- Widget de progresso diário.
- Recomendações com IA (sempre via proxy, nunca chave no app).
- Audiobook tracking e OCR de capa.
