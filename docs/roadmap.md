# Roadmap

Status: `[ ]` pendente · `[~]` em andamento · `[x]` concluída.

Uma sessão = uma entrega vertical + testes + documentação + commit. A spec da próxima sessão é escrita no fim da sessão anterior.

> A S4c foi implementada antes da S4b por decisão do dono; a tabela segue a numeração das sessões, e não a ordem em que foram executadas.
>
> Antes da S6, uma auditoria de documentação conferiu README, AGENTS e docs
> vivos contra o código da S5 (sem antecipar o motor do plano).

| Sessão | Status | Entrega | Critério de aceite | Spec |
|---|---|---|---|---|
| S0 | [x] | Fundação pública + onboarding Expo | App abre no Expo Go; CI verde; gitleaks limpo | `sessions/S00-fundacao.md` |
| S1 | [x] | Design system + shell | 4 abas navegáveis com dados fake | `sessions/S01-design-system.md` |
| S2 | [x] | Persistência (SQLite + Drizzle) | CRUD via repositório testado | `sessions/S02-persistencia.md` |
| S3 | [x] | Biblioteca (cadastro, ISBN, capas) | Cadastrar → achar → editar | `sessions/S03-biblioteca.md` |
| S3.2 | [x] | Gêneros personalizados + cores por tema | Criar/editar/excluir gênero com par claro/escuro; conferido no Android | `sessions/S03.2-generos.md` |
| S4a | [x] | Identidade 3D vetorial (mascote + lombadas) | Estante com identidade própria, lombada por gênero+status e qualquer hex | `sessions/S04a-identidade-3d.md` |
| S4b | [x] | ISBN oficial + avisos + capa na Fila | Máscara pela tabela oficial; require cycle cortado; aviso do `ImageBackground` decidido; capa na Fila; conferido no Android | `sessions/S04b-isbn-avisos-fila.md` |
| S4c | [x] | Movimento e vida | Mola no toque, cascata na grade, detalhe com animação contínua e capa tratada como livro | `sessions/S04c-movimento.md` |
| S5 | [x] | Registro de leitura | Registrar sessão e ver progresso na hora; piso do progresso travado; conferido no Android | `sessions/S05-registro-leitura.md` |
| S6 | [x] | Motor do plano (funções puras) | Meta 3–200, volta leve, ativo em 7 dias, teto flexível e 75 testes; algoritmo documentado | `sessions/S06-motor-plano.md` |
| S7 | [x] | Plano na UI + tela Hoje | Plano real na Hoje, sugestão com selo e registro a partir do bloco; revisão no Android gerou a S7.1 | `sessions/S07-plano-na-ui.md` |
| S7.1 | [ ] | Ajustes da revisão | Registrar retoma livro pausado; Hoje antes da Ordem; Fila → Ordem; blocos com ação explícita | `sessions/S07.1-ajustes-hoje-ordem.md` |
| S8 | [ ] | Ordem real e sugestão anti-ressaca | Sequência persistida, adicionar/remover/reordenar e sugestão automática | `sessions/S08-ordem-real.md` |
| S9 | [ ] | Conclusão + resenha | Livro finalizado gera resenha completa | — |
| S10 | [ ] | Estatísticas e insights | Tela com dados reais | — |
| S11 | [ ] | Configurações + backup JSON | Round-trip de export/import testado | — |
| S12 | [ ] | Release interno | APK instalável no Android; ícone, splash e camada adaptativa conferidos no launcher | — |
| S13 | [ ] | Documentação final | Docs revisados e changelog fechado | — |

## Backlog pós-MVP

- Botão **(i)** de ajuda em cada aba, com explicação curta do papel da tela e o
  LêBot "confuso" atrás do i (interrogação diagonal, como quem inspeciona),
  com animação. Depois da S12. O mascote ainda não tem esse estado: criar um
  novo ou reaproveitar "pensando".
- Atualizar a toolchain para zerar os advisories moderados do `npm audit`
  (`minimatch`, `glob`, Jest e Expo CLI). **Não** usar `npm audit fix --force`:
  ele rebaixa o Expo para 51. Reavaliar junto com a próxima atualização de SDK.
- Migrar para NativeWind 5 (Tailwind 4) quando a 5.0 for estável e o SDK/RN
  suportados forem os nossos — resolve o aviso de `ImageBackground` e tira o
  projeto do par não suportado. Custo medido na ADR 0006 (adendo S4b): uma
  sessão, quase toda de configuração.
- Tema escuro: os gêneros já guardam o par claro/escuro (S3.2); falta o toggle,
  os tokens de superfície e revisar contraste em todas as telas.
- Sync multi-dispositivo (Supabase ou similar).
- Compartilhar resenhas.
- Importação Goodreads.
- Widget de progresso diário.
- Recomendações com IA (sempre via proxy, nunca chave no app).
- Audiobook tracking e OCR de capa.
