#!/usr/bin/env bash
# Mede cada aba parada (protocolo da S14b, `reference/performance.md`).
#
# Em cada aba: toca nela, espera `--settle` segundos, zera o `gfxinfo` e conta
# por `--window` segundos os quadros desenhados e os ticks de CPU do processo
# (`/proc/<pid>/stat`). CPU em % de um núcleo. Orçamento da ADR 0029 (f200):
# ≤ 30 quadros em 10 s e ≤ 5%.
#
# Saída: ${TMPDIR:-/tmp}/lebot-measure/<label>/idle.csv.
# Requisitos: adb no PATH; aparelho destravado na tomada.

set -euo pipefail

usage() {
  cat <<'EOF'
Uso: bash scripts/measure-idle.sh [opções]

  --label NOME       pasta da medição (padrão: medicao)
  --tabs LISTA       abas separadas por vírgula (padrão: Estante,Hoje,Ordem,Ajustes)
  --settle S         espera antes de contar (padrão: 4)
  --window S         janela de contagem (padrão: 10)
  --warmup S         segundos depois do boot (padrão: 8)
  --package ID       pacote Android (padrão: com.francisN7.lebot)
  -h, --help         mostra esta ajuda

Exemplo:
  bash scripts/measure-idle.sh --label s14c-f200
EOF
}

package='com.francisN7.lebot'
label='medicao'
tab_list='Estante,Hoje,Ordem,Ajustes'
settle=4
window=10
warmup=8

while [[ $# -gt 0 ]]; do
  case "$1" in
    --label) label="${2:?--label precisa de valor}"; shift 2 ;;
    --tabs) tab_list="${2:?--tabs precisa de valor}"; shift 2 ;;
    --settle) settle="${2:?--settle precisa de valor}"; shift 2 ;;
    --window) window="${2:?--window precisa de valor}"; shift 2 ;;
    --warmup) warmup="${2:?--warmup precisa de valor}"; shift 2 ;;
    --package) package="${2:?--package precisa de valor}"; shift 2 ;;
    -h | --help) usage; exit 0 ;;
    *) echo "opção desconhecida: $1" >&2; usage >&2; exit 2 ;;
  esac
done

source "$(dirname "$0")/lib/measure-common.sh"
require_int "$settle" "$window" "$warmup"
require_device
prepare_output

cold_start "$warmup"
pid="$(app_pid)"
[[ -n $pid ]] || { echo 'o app não está rodando' >&2; exit 1; }
hz="$(clock_ticks)"

summary="$directory/idle.csv"
echo '"Aba","Quadros","CPU_%"' > "$summary"
printf '%-8s %-8s %-6s\n' Aba Quadros CPU%

IFS=',' read -r -a tabs <<< "$tab_list"
for tab in "${tabs[@]}"; do
  tap_label "$tab"
  sleep "$settle"

  adb shell dumpsys gfxinfo "$package" reset > /dev/null
  before="$(process_ticks "$pid")"
  sleep "$window"
  after="$(process_ticks "$pid")"
  frames="$(gfx_frames)"

  cpu="$(awk -v d="$((after - before))" -v hz="$hz" -v w="$window" \
    'BEGIN { printf "%.0f", d / hz / w * 100 }')"
  printf '"%s","%s","%s"\n' "$tab" "$frames" "$cpu" >> "$summary"
  printf '%-8s %-8s %-6s\n' "$tab" "$frames" "$cpu"
done

echo "idle.csv em $directory"
