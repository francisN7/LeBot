# Funções comuns aos medidores `scripts/measure-*.sh` (protocolo da S14b).
#
# Uso: `source "$(dirname "$0")/lib/measure-common.sh"` depois de ler as opções.
# Espera `package` e `label` definidos; cria `directory` para a saída.

# Encerra com erro se faltar `adb` ou aparelho.
require_device() {
  if ! command -v adb > /dev/null 2>&1; then
    echo 'adb não encontrado no PATH (instale o platform-tools)' >&2
    exit 1
  fi

  if ! adb devices | grep -qE $'\tdevice$'; then
    echo 'nenhum aparelho conectado em `adb devices`' >&2
    exit 1
  fi
}

# Encerra com erro se o valor não for inteiro não negativo.
require_int() {
  local value
  for value in "$@"; do
    if ! [[ $value =~ ^[0-9]+$ ]]; then
      echo "esperava número inteiro, recebi: $value" >&2
      exit 2
    fi
  done
}

# Pasta de saída: ${TMPDIR:-/tmp}/lebot-measure/<label>/.
prepare_output() {
  directory="${TMPDIR:-/tmp}/lebot-measure/$label"
  mkdir -p "$directory"
}

# Reinicia o app a frio e espera `$1` segundos.
cold_start() {
  adb shell am force-stop "$package" > /dev/null
  adb shell am start -n "$package/.MainActivity" > /dev/null
  sleep "$1"
}

# PID do app em execução (vazio se não estiver rodando).
app_pid() {
  adb shell pidof "$package" | tr -d '\r' | awk '{ print $1 }'
}

# Ticks de CPU (utime + stime) do processo; campos 14 e 15 de /proc/<pid>/stat.
# O nome do processo pode ter espaço, então corta tudo até o último ")".
process_ticks() {
  adb shell cat "/proc/$1/stat" | tr -d '\r' | sed -E 's/.*\) //' |
    awk '{ print $12 + $13 }'
}

# Ticks por segundo do kernel do aparelho (quase sempre 100).
clock_ticks() {
  local ticks
  ticks="$(adb shell getconf CLK_TCK 2> /dev/null | tr -d '\r')"
  echo "${ticks:-100}"
}

# Total de quadros desde o último `gfxinfo reset`.
gfx_frames() {
  adb shell dumpsys gfxinfo "$package" | tr -d '\r' |
    sed -nE 's/.*Total frames rendered: ([0-9]+).*/\1/p' | head -n 1
}

# Centro "x y" do elemento cujo texto ou content-desc começa com `$1`, lido do
# `uiautomator dump` (as abas: Estante, Hoje, Ordem, Ajustes).
ui_center() {
  adb shell uiautomator dump /sdcard/lebot-ui.xml > /dev/null
  adb exec-out cat /sdcard/lebot-ui.xml |
    node "$(dirname "${BASH_SOURCE[0]}")/ui-center.mjs" "$1"
}

# Toca no centro do elemento rotulado `$1`.
tap_label() {
  local point
  point="$(ui_center "$1")"
  if [[ -z $point ]]; then
    echo "não achei \"$1\" na tela (uiautomator)" >&2
    exit 1
  fi
  # shellcheck disable=SC2086 # "x y" vira dois argumentos de propósito.
  adb shell input tap $point
}
