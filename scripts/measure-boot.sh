#!/usr/bin/env bash
# Mede o boot frio por vídeo (protocolo da S14b, `reference/performance.md`).
#
# Cada rodada: `am force-stop`, tela inicial, `screenrecord` e `am start -W`.
# `am` é o `TotalTime` (1º quadro da activity); `estavel` é do 1º quadro que
# muda até o quadro que já é a Estante final (`scripts/video-frames.mjs boot`).
#
# Saída: ${TMPDIR:-/tmp}/lebot-measure/<label>/boot-N.mp4 + boot.csv.
# Requisitos: adb, ffmpeg e node no PATH; aparelho destravado na tomada.

set -euo pipefail

usage() {
  cat <<'EOF'
Uso: bash scripts/measure-boot.sh [opções]

  --label NOME       pasta da medição (padrão: medicao)
  --rounds N         rodadas (padrão: 7; compare a mediana)
  --record S         segundos de vídeo por rodada (padrão: 6)
  --package ID       pacote Android (padrão: com.francisN7.lebot)
  -h, --help         mostra esta ajuda

Exemplo:
  bash scripts/measure-boot.sh --label s14c-f200
EOF
}

package='com.francisN7.lebot'
label='medicao'
rounds=7
record=6

while [[ $# -gt 0 ]]; do
  case "$1" in
    --label) label="${2:?--label precisa de valor}"; shift 2 ;;
    --rounds) rounds="${2:?--rounds precisa de valor}"; shift 2 ;;
    --record) record="${2:?--record precisa de valor}"; shift 2 ;;
    --package) package="${2:?--package precisa de valor}"; shift 2 ;;
    -h | --help) usage; exit 0 ;;
    *) echo "opção desconhecida: $1" >&2; usage >&2; exit 2 ;;
  esac
done

source "$(dirname "$0")/lib/measure-common.sh"
require_int "$rounds" "$record"
require_device
prepare_output

summary="$directory/boot.csv"
echo '"Round","am_ms","estavel_ms"' > "$summary"
printf '%-6s %-7s %-9s\n' Round am estavel

for ((round = 1; round <= rounds; round++)); do
  adb shell am force-stop "$package" > /dev/null
  adb shell input keyevent KEYCODE_HOME > /dev/null
  sleep 2

  adb shell screenrecord --time-limit "$record" /sdcard/lebot-boot.mp4 &
  recorder=$!
  sleep 1
  total="$(adb shell am start -W -n "$package/.MainActivity" | tr -d '\r' |
    sed -nE 's/^TotalTime: ([0-9]+)/\1/p')"
  wait "$recorder" || true

  video="$directory/boot-$round.mp4"
  adb pull /sdcard/lebot-boot.mp4 "$video" > /dev/null
  stable="$(node "$(dirname "$0")/video-frames.mjs" boot "$video" |
    sed -nE 's/^estavel_ms=([0-9]+)/\1/p')"

  printf '"%s","%s","%s"\n' "$round" "$total" "$stable" >> "$summary"
  printf '%-6s %-7s %-9s\n' "$round" "$total" "$stable"
done

echo "vídeos e boot.csv em $directory"
