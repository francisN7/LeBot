#!/usr/bin/env bash
# Mede a rolagem da Estante com `dumpsys gfxinfo` (protocolo da S12b).
#
# Cada rodada reinicia o app, espera o aquecimento, zera o contador e dá
# `--flings` arrastos com pausa. Desconsidere a primeira rodada ao comparar:
# o app ainda está montando fontes e carregando os livros.
#
# Saída: ${TMPDIR:-/tmp}/lebot-measure/<label>/roundN.txt (+ summary.csv e
# framestats.txt). Requisitos: `adb` no PATH, aparelho em `adb devices`, tela
# ligada e destravada, mesmo brilho e mesma orientação entre as comparações.

set -euo pipefail

usage() {
  cat <<'EOF'
Uso: bash scripts/measure-gfx.sh [opções]

  --label NOME       pasta da medição (padrão: medicao)
  --rounds N         rodadas (padrão: 3)
  --flings N         arrastos por rodada (padrão: 6)
  --warmup S         segundos de aquecimento (padrão: 8)
  --package ID       pacote Android (padrão: com.francisN7.lebot)
  --framestats       salva também `gfxinfo framestats` no fim
  -h, --help         mostra esta ajuda

Exemplos:
  bash scripts/measure-gfx.sh --label antes --rounds 3
  bash scripts/measure-gfx.sh --label depois --rounds 3 --framestats
EOF
}

package='com.francisN7.lebot'
label='medicao'
rounds=3
flings=6
warmup=8
framestats=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --label) label="${2:?--label precisa de valor}"; shift 2 ;;
    --rounds) rounds="${2:?--rounds precisa de valor}"; shift 2 ;;
    --flings) flings="${2:?--flings precisa de valor}"; shift 2 ;;
    --warmup) warmup="${2:?--warmup precisa de valor}"; shift 2 ;;
    --package) package="${2:?--package precisa de valor}"; shift 2 ;;
    --framestats) framestats=1; shift ;;
    -h | --help) usage; exit 0 ;;
    *) echo "opção desconhecida: $1" >&2; usage >&2; exit 2 ;;
  esac
done

for value in "$rounds" "$flings" "$warmup"; do
  if ! [[ $value =~ ^[0-9]+$ ]]; then
    echo "esperava número inteiro, recebi: $value" >&2
    exit 2
  fi
done

if ! command -v adb > /dev/null 2>&1; then
  echo 'adb não encontrado no PATH (instale o platform-tools)' >&2
  exit 1
fi

if ! adb devices | grep -qE $'\tdevice$'; then
  echo 'nenhum aparelho conectado em `adb devices`' >&2
  exit 1
fi

directory="${TMPDIR:-/tmp}/lebot-measure/$label"
mkdir -p "$directory"

# Primeiro grupo capturado de uma regex estendida, ou vazio.
grab() {
  sed -nE "s/.*$2.*/\\1/p" <<< "$1" | head -n 1
}

summary="$directory/summary.csv"
echo '"Round","Frames","Janky","P50","P90","P95","P99"' > "$summary"
printf '%-6s %-7s %-6s %-4s %-4s %-4s %-4s\n' Round Frames Janky P50 P90 P95 P99

for ((round = 1; round <= rounds; round++)); do
  adb shell am force-stop "$package" > /dev/null
  adb shell am start -n "$package/.MainActivity" > /dev/null
  sleep "$warmup"
  adb shell dumpsys gfxinfo "$package" reset > /dev/null

  for ((fling = 1; fling <= flings; fling++)); do
    adb shell input swipe 540 1700 540 600 180 > /dev/null
    sleep 1.5
  done

  sleep 2

  dump="$(adb shell dumpsys gfxinfo "$package" | tr -d '\r')"
  printf '%s\n' "$dump" > "$directory/round$round.txt"

  frames="$(grab "$dump" 'Total frames rendered: ([0-9]+)')"
  janky="$(grab "$dump" 'Janky frames: [0-9]+ \(([0-9.]+)%\)')"
  p50="$(grab "$dump" '50th percentile: ([0-9]+)ms')"
  p90="$(grab "$dump" '90th percentile: ([0-9]+)ms')"
  p95="$(grab "$dump" '95th percentile: ([0-9]+)ms')"
  p99="$(grab "$dump" '99th percentile: ([0-9]+)ms')"

  printf '"%s","%s","%s","%s","%s","%s","%s"\n' \
    "$round" "$frames" "$janky" "$p50" "$p90" "$p95" "$p99" >> "$summary"
  printf '%-6s %-7s %-6s %-4s %-4s %-4s %-4s\n' \
    "$round" "$frames" "$janky" "$p50" "$p90" "$p95" "$p99"
done

if [[ $framestats -eq 1 ]]; then
  adb shell dumpsys gfxinfo "$package" framestats | tr -d '\r' > "$directory/framestats.txt"
fi

echo "dumps em $directory"
