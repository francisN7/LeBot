#!/usr/bin/env bash
# Mede a CPU por thread do app (protocolo da S14b, `reference/performance.md`).
#
# Lê `/proc/<pid>/task/*/stat` antes e depois de `--window` segundos e imprime
# as threads que mais gastaram, em % de um núcleo (100% = um núcleo inteiro).
# Cenários: `parado` (só espera) e `rolando` (arrastos durante a janela). A aba
# é escolhida com `--tab`; "aba escondida" é medir outra aba com o app aberto.
#
# Saída: ${TMPDIR:-/tmp}/lebot-measure/<label>/threads-<aba>-<cenario>.txt.
# Requisitos: adb no PATH; aparelho destravado na tomada.

set -euo pipefail

usage() {
  cat <<'EOF'
Uso: bash scripts/measure-threads.sh [opções]

  --label NOME       pasta da medição (padrão: medicao)
  --tab ABA          aba medida (padrão: Estante)
  --scenario NOME    parado ou rolando (padrão: parado)
  --window S         janela de contagem (padrão: 10)
  --top N            threads listadas (padrão: 6)
  --warmup S         segundos depois do boot (padrão: 8)
  --package ID       pacote Android (padrão: com.francisN7.lebot)
  -h, --help         mostra esta ajuda

Exemplos:
  bash scripts/measure-threads.sh --label s14c-f200 --tab Ajustes
  bash scripts/measure-threads.sh --label s14c-f200 --scenario rolando
EOF
}

package='com.francisN7.lebot'
label='medicao'
tab='Estante'
scenario='parado'
window=10
top=6
warmup=8

while [[ $# -gt 0 ]]; do
  case "$1" in
    --label) label="${2:?--label precisa de valor}"; shift 2 ;;
    --tab) tab="${2:?--tab precisa de valor}"; shift 2 ;;
    --scenario) scenario="${2:?--scenario precisa de valor}"; shift 2 ;;
    --window) window="${2:?--window precisa de valor}"; shift 2 ;;
    --top) top="${2:?--top precisa de valor}"; shift 2 ;;
    --warmup) warmup="${2:?--warmup precisa de valor}"; shift 2 ;;
    --package) package="${2:?--package precisa de valor}"; shift 2 ;;
    -h | --help) usage; exit 0 ;;
    *) echo "opção desconhecida: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ $scenario != parado && $scenario != rolando ]]; then
  echo "cenário desconhecido: $scenario (use parado ou rolando)" >&2
  exit 2
fi

source "$(dirname "$0")/lib/measure-common.sh"
require_int "$window" "$top" "$warmup"
require_device
prepare_output

cold_start "$warmup"
pid="$(app_pid)"
[[ -n $pid ]] || { echo 'o app não está rodando' >&2; exit 1; }
hz="$(clock_ticks)"

tap_label "$tab"
sleep 4

# "tid nome ticks" de cada thread; o nome vem entre parênteses e pode ter espaço.
snapshot() {
  adb shell "for f in /proc/$pid/task/*/stat; do cat \$f; echo; done" |
    tr -d '\r' | sed -nE 's/^([0-9]+) \((.*)\) (.*)$/\1|\2|\3/p' |
    awk -F'|' '{ split($3, s, " "); gsub(/ /, "_", $2); print $1, $2, s[12] + s[13] }'
}

before="$(snapshot)"
if [[ $scenario == rolando ]]; then
  end=$((SECONDS + window))
  while ((SECONDS < end)); do
    adb shell input swipe 540 1700 540 600 180 > /dev/null
    sleep 1.5
  done
else
  sleep "$window"
fi
after="$(snapshot)"

output="$directory/threads-$tab-$scenario.txt"
LC_ALL=C join <(LC_ALL=C sort <<< "$before") <(LC_ALL=C sort <<< "$after") |
  awk -v hz="$hz" -v w="$window" '{ printf "%5.0f%%  %s\n", ($5 - $3) / hz / w * 100, $2 }' |
  sort -rn | head -n "$top" | tee "$output"
echo "($tab, $scenario, $window s) em $output"
