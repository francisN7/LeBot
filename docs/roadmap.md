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
| S7.1 | [x] | Ajustes da revisão | Registrar retoma livro pausado; Hoje antes da Ordem; Fila → Ordem; blocos com ação explícita; conferido no Android | `sessions/S07.1-ajustes-hoje-ordem.md` |
| S8 | [x] | Ordem real e sugestão anti-ressaca | Ordem automática por status, principal = primeiro Lendo, setas ok; drop via alça com glitch estético no backlog | `sessions/S08-ordem-real.md` |
| S8a | [ ] | Troca rápida de status na Estante | Segurar o chip de status abre uma roda; o rosto da lombada muda em tempo real ao deslizar e o status persiste ao soltar | `sessions/S08a-troca-rapida-status.md` |
| S9 | [ ] | Conclusão + resenha | Livro finalizado gera resenha completa | — |
| S10 | [ ] | Estatísticas e insights | Tela com dados reais | — |
| S11 | [ ] | Configurações + backup JSON | Meta diária editável, backup JSON com round-trip e estados explícitos para lembrete/tema; escopo fechado na abertura | — |
| S12 | [ ] | Release interno | APK instalável no Android; ícone, splash e camada adaptativa conferidos no launcher | — |
| S13 | [ ] | Documentação final + limpeza | Sub-sessões no padrão Xa/Xb; backlog reordenado pela prioridade do dono; itens descartados removidos dos docs; docs revisados e changelog fechado | `sessions/S13-documentacao-final.md` |

## Backlog pós-MVP

> A ordem abaixo é provisória: a S13 reordena pela prioridade do dono e remove
> o que não entra mais.

- **Ordem — drop via alça:** ao soltar, as linhas ainda piscam/animam antes de
  se alocar; as setas estão ok. Reavaliar com uma lista de drag dedicada ou
  posições absolutas. Não bloqueia a S8.
- **Multisseleção na Estante:** selecionar vários livros e aplicar uma edição
  por vez — status, gênero, remoção de capa ou exclusão. Remover capa e excluir
  exigem confirmação dupla, com contagem visível de 5 s no segundo passo. O
  toque longo no chip continua sendo a roda de status (S8a).
- **Ajustes com opções inertes:** Meta diária, Lembrete, Aparência e Backup
  aparecem como cards sem ação; só “Gerenciar gêneros” funciona. Fechar no S11:
  meta editável e backup entram; tema escuro segue no backlog; lembrete precisa
  de `expo-notifications` ou sai da UI até existir. Até lá, marcar “em breve”
  para não parecer quebrado.
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
