# S04b — ISBN oficial, avisos do terminal e capa na Fila

## Objetivo

Fechar os três itens que estavam absorvidos no fim da S4: máscara do ISBN pela
tabela oficial da International ISBN Agency, require cycle e aviso de
`ImageBackground` resolvidos/decididos, e capa real nos cards da Fila.

## Fora de escopo

- Arte, mascote, ícone/splash e Estante 3D → **S4a**
  (`docs/sessions/S04a-identidade-3d.md`).
- Consulta de metadados por ISBN na rede (continua offline no MVP).
- S5 (registro de leitura) em diante.

## Tarefas

1. Tabela oficial de ranges do ISBN:
   - baixar `https://www.isbn-international.org/export_rangemessage.xml`
     (International ISBN Agency) e gerar `src/lib/isbn-ranges.ts` com prefixo
     EAN, grupo e as regras `range → tamanho`; guardar
     `MessageSerialNumber`/`MessageDate` no cabeçalho;
   - script Node puro (`scripts/build-isbn-ranges.mjs`) para regenerar a tabela
     a partir do XML; roda no desenvolvimento, nada de rede em runtime;
   - `formatIsbnInput` resolve grupo/registrant/publicação pela tabela e
     continua funcionando na digitação parcial (10 ou 13 dígitos);
   - testes com grupos diferentes: `978-0-306-40615-7`, `978-85-359-0277-8`,
     `978-3-16-148410-0`, `979-10-90636-07-1` e ISBN-10;
   - `docs/data-model.md` (o banco continua sem hífen) e a documentação da
     máscara atualizados.
2. Require cycle (`library/index → BookDetailScreen → genres/index →
   GenresScreen → library/index`): trocar import de barril por caminho direto
   (`@/features/library/use-books`, `@/features/library/genre`) em
   `GenresScreen` e `FilaScreen`; conferir `npx expo start` limpo.
3. `ImageBackground is deprecated`: vem do `react-native-css-interop`
   (NativeWind 4), que registra `ImageBackground` no boot; não é código do app.
   Confirmar, registrar em ADR 0006 e decidir entre aceitar, migrar para
   NativeWind 5 ou patchear. Não esconder com `LogBox.ignoreLogs`.
4. Capa na Fila: usar `BookCover` no card "Próxima parada" e nas linhas de
   "Depois" (tamanho compacto), com fallback `Spine` e a fita do gênero;
   manter `onOpenBook`; testar com e sem capa.

## Aceite

- [x] Máscara do ISBN usa a tabela oficial e acerta grupos diferentes (0, 85,
      3, 979), gerada por script com a data do XML.
- [x] `npx expo start` sem require cycle; o aviso de `ImageBackground` está
      explicado e decidido (não escondido).
- [x] Fila mostra a capa real na próxima parada e em "Depois", caindo na
      lombada quando não há capa.
- [x] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes.
- [x] Conferido no Android pelo dono.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `src/lib/isbn.ts`,
`src/features/library/{BookFormScreen,form}.tsx`, `src/features/queue/`,
`src/features/genres/GenresScreen.tsx`, `docs/data-model.md`,
`docs/adr/0006-design-system-nativewind.md`.

## Riscos

- **Tabela de ISBN:** o XML oficial tem milhares de regras e muda com
  frequência; compactar por grupo, gerar com script e fixar a data/serial. Não
  consultar a rede em runtime.
- **Aviso do `ImageBackground`:** é de dependência (NativeWind 4); patch pode
  quebrar atualização do pacote. Preferir aceitar documentado ou migrar.
- **Capa na Fila em tamanho compacto:** conferir raio/borda e a fita no 72×104,
  onde a margem da fita pesa mais.
- **Digitação parcial:** a máscara não pode "pular" quando o grupo ainda é
  ambíguo; cobrir com teste de prefixo.

## Próximo depois desta

S5 — registro de leitura (`docs/sessions/S05-registro-leitura.md`).
