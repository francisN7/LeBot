# Brand — arquivos-fonte

Arte original do LêBot. **Não vai para o bundle do app**; exports finais vivem em `assets/images/` (ícone, splash e camada adaptativa) e a arte de runtime é vetorial em `src/components/ui/`.

## Originais

| Arquivo | Conteúdo |
|---|---|
| `source/lebot-robo@2x.png` | mascote robô com livro + lombadas |
| `source/lebot-selos@2x.png` | 6 variações de selo/ícone |

## Regras

- Nomes ASCII, minúsculos, sem acento ou espaço.
- Não editar os originais: criar export em `assets/images/` com
  `node scripts/build-icons.mjs`.
- Remover EXIF/metadados dos exports.
- Guia visual completo: `docs/reference/brand.md`.

## Licença da arte

- **MIT, junto do código** (decidido na S0). Vale para os originais em
  `brand/source/` e para os exports.
- A licença cobre o uso do arquivo, não a identidade do projeto: forks devem
  trocar nome, wordmark e mascote.
- Autoria: francisN7.
