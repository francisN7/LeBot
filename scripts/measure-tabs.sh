#!/usr/bin/env bash
# Mede a troca de abas por vídeo (protocolo da S14b, `reference/performance.md`).
#
# Liga `show_touches`, reinicia o app e grava `--laps` voltas pelas abas Hoje,
# Ordem, Ajustes e Estante. Cada toque vira uma linha com o tempo do toque até
# a tela assentar (`scripts/video-frames.mjs taps`). A 1ª volta é a 1ª visita
# depois do boot; as seguintes, com a aba já montada.
#
# Saída: ${TMPDIR:-/tmp}/lebot-measure/<label>/tabs.mp4 + tabs.txt.
# Requisitos: adb, ffmpeg e node no PATH; aparelho destravado na tomada.

set -euo pipefail

usage() {
  cat <<'EOF'
Uso: bash scripts/measure-tabs.sh [opções]

  --label NOME       pasta da medição (padrão: medicao)
  --laps N           voltas pelas quatro abas (padrão: 3)
  --warmup S         segundos depois do boot (padrão: 8)
  --gap S            segundos entre toques (padrão: 3)
  --bar F            início da barra de abas no vídeo (padrão: 0.9)
  --package ID       pacote Android (padrão: com.francisN7.lebot)
  -h, --help         mostra esta ajuda

Exemplo:
  bash scripts/measure-tabs.sh --label s14c-f1000 --laps 3
EOF
}

package='com.francisN7.lebot'
label='medicao'
laps=3
warmup=8
gap=3
bar=0.9

while [[ $# -gt 0 ]]; do
  case "$1" in
    --label) label="${2:?--label precisa de valor}"; shift 2 ;;
    --laps) laps="${2:?--laps precisa de valor}"; shift 2 ;;
    --warmup) warmup="${2:?--warmup precisa de valor}"; shift 2 ;;
    --gap) gap="${2:?--gap precisa de valor}"; shift 2 ;;
    --bar) bar="${2:?--bar precisa de valor}"; shift 2 ;;
    --package) package="${2:?--package precisa de valor}"; shift 2 ;;
    -h | --help) usage; exit 0 ;;
    *) echo "opção desconhecida: $1" >&2; usage >&2; exit 2 ;;
  esac
done

source "$(dirname "$0")/lib/measure-common.sh"
require_int "$laps" "$warmup" "$gap"
require_device
prepare_output

tabs=(Hoje Ordem Ajustes Estante)
cold_start "$warmup"

# Coordenadas lidas uma vez, antes de gravar: o dump leva ~1 s.
declare -A points
for tab in "${tabs[@]}"; do
  points[$tab]="$(ui_center "$tab")"
  [[ -n ${points[$tab]} ]] || { echo "aba \"$tab\" não achada" >&2; exit 1; }
done

seconds=$((laps * ${#tabs[@]} * gap + 2))
if ((seconds > 180)); then
  echo "o screenrecord para em 180 s; reduza --laps ou --gap" >&2
  exit 2
fi

adb shell settings put system show_touches 1
trap 'adb shell settings put system show_touches 0' EXIT

adb shell screenrecord --time-limit "$seconds" /sdcard/lebot-tabs.mp4 &
recorder=$!
sleep 1

for ((lap = 1; lap <= laps; lap++)); do
  for tab in "${tabs[@]}"; do
    # shellcheck disable=SC2086 # "x y" vira dois argumentos de propósito.
    adb shell input tap ${points[$tab]}
    sleep "$gap"
  done
done

wait "$recorder" || true
video="$directory/tabs.mp4"
adb pull /sdcard/lebot-tabs.mp4 "$video" > /dev/null

node "$(dirname "$0")/video-frames.mjs" taps "$video" --bar "$bar" |
  tee "$directory/tabs.txt"
echo "ordem dos toques: ${tabs[*]} (× $laps); vídeo em $directory"
