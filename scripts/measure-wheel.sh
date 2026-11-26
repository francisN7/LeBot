#!/usr/bin/env bash
# Mede a roda de status com `gfxinfo` (protocolo da S14b, `reference/performance.md`).
#
# Cada rodada: zera o `gfxinfo`, dá um toque longo no chip (`--chip X,Y`), faz
# `--turns` voltas pela roda com `input motionevent` e solta no miolo, o que
# cancela sem gravar. O chip é o do 1º card da Estante no aparelho de
# referência; em outra tela, ache-o com `uiautomator dump`.
#
# Saída: ${TMPDIR:-/tmp}/lebot-measure/<label>/wheel.csv.
# Requisitos: adb no PATH; aparelho destravado na tomada, na Estante.

set -euo pipefail

usage() {
  cat <<'EOF'
Uso: bash scripts/measure-wheel.sh --chip X,Y [opções]

  --chip X,Y         centro do chip de status (obrigatório)
  --radius PX        raio das voltas (padrão: 220)
  --turns N          voltas por rodada (padrão: 2)
  --rounds N         rodadas (padrão: 3)
  --label NOME       pasta da medição (padrão: medicao)
  --package ID       pacote Android (padrão: com.francisN7.lebot)
  -h, --help         mostra esta ajuda

Exemplo:
  bash scripts/measure-wheel.sh --label s14c-f200 --chip 300,1180
EOF
}

package='com.francisN7.lebot'
label='medicao'
chip=''
radius=220
turns=2
rounds=3

while [[ $# -gt 0 ]]; do
  case "$1" in
    --chip) chip="${2:?--chip precisa de valor}"; shift 2 ;;
    --radius) radius="${2:?--radius precisa de valor}"; shift 2 ;;
    --turns) turns="${2:?--turns precisa de valor}"; shift 2 ;;
    --rounds) rounds="${2:?--rounds precisa de valor}"; shift 2 ;;
    --label) label="${2:?--label precisa de valor}"; shift 2 ;;
    --package) package="${2:?--package precisa de valor}"; shift 2 ;;
    -h | --help) usage; exit 0 ;;
    *) echo "opção desconhecida: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if ! [[ $chip =~ ^([0-9]+),([0-9]+)$ ]]; then
  echo '--chip X,Y é obrigatório (centro do chip, em px)' >&2
  usage >&2
  exit 2
fi
cx="${BASH_REMATCH[1]}"
cy="${BASH_REMATCH[2]}"

source "$(dirname "$0")/lib/measure-common.sh"
require_int "$radius" "$turns" "$rounds"
require_device
prepare_output

grab() {
  sed -nE "s/.*$2.*/\\1/p" <<< "$1" | head -n 1
}

summary="$directory/wheel.csv"
echo '"Round","Frames","Janky","P50","P95","P99"' > "$summary"
printf '%-6s %-7s %-6s %-4s %-4s %-4s\n' Round Frames Janky P50 P95 P99

# Pontos da volta, 16 por giro, gerados uma vez.
path="$(awk -v cx="$cx" -v cy="$cy" -v r="$radius" -v n="$turns" 'BEGIN {
  for (i = 0; i <= 16 * n; i++) {
    a = i * 3.14159265 / 8
    printf "%d %d\n", cx + r * cos(a), cy + r * sin(a)
  }
}')"

for ((round = 1; round <= rounds; round++)); do
  adb shell dumpsys gfxinfo "$package" reset > /dev/null
  adb shell input motionevent DOWN "$cx" "$cy" > /dev/null
  sleep 0.6
  while read -r x y; do
    adb shell input motionevent MOVE "$x" "$y" > /dev/null
  done <<< "$path"
  adb shell input motionevent MOVE "$cx" "$cy" > /dev/null
  adb shell input motionevent UP "$cx" "$cy" > /dev/null
  sleep 1.5

  dump="$(adb shell dumpsys gfxinfo "$package" | tr -d '\r')"
  printf '%s\n' "$dump" > "$directory/wheel-$round.txt"
  frames="$(grab "$dump" 'Total frames rendered: ([0-9]+)')"
  janky="$(grab "$dump" 'Janky frames: [0-9]+ \(([0-9.]+)%\)')"
  p50="$(grab "$dump" '50th percentile: ([0-9]+)ms')"
  p95="$(grab "$dump" '95th percentile: ([0-9]+)ms')"
  p99="$(grab "$dump" '99th percentile: ([0-9]+)ms')"

  printf '"%s","%s","%s","%s","%s","%s"\n' \
    "$round" "$frames" "$janky" "$p50" "$p95" "$p99" >> "$summary"
  printf '%-6s %-7s %-6s %-4s %-4s %-4s\n' \
    "$round" "$frames" "$janky" "$p50" "$p95" "$p99"
done

echo "wheel.csv em $directory"
