# Mede a rolagem da Estante com `dumpsys gfxinfo` (protocolo da S12b).
#
# Cada rodada reinicia o app, espera o aquecimento, zera o contador e dá
# `-Flings` arrastos com pausa. A primeira rodada é descartada no relatório:
# o app ainda está montando fontes e carregando os livros.
#
# Uso:
#   powershell -File scripts/measure-gfx.ps1 -Label antes -Rounds 3
#   powershell -File scripts/measure-gfx.ps1 -Label depois -Rounds 3 -Framestats
#
# Saída: TMP\lebot-measure\<Label>\roundN.txt (+ summary.csv e framestats.txt).
# Requisitos: aparelho conectado em `adb devices`, tela ligada e destravada,
# mesmo brilho e mesma orientação entre as comparações.

param(
  [string]$Adb = 'C:\Users\francis\android-sdk\platform-tools\adb.exe',
  [string]$Package = 'com.francisN7.lebot',
  [string]$Label = 'medicao',
  [int]$Rounds = 3,
  [int]$Flings = 6,
  [int]$WarmupSeconds = 8,
  [switch]$Framestats
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $Adb)) {
  throw "adb não encontrado em $Adb"
}

$connected = & $Adb devices | Select-String 'device$'

if (-not $connected) {
  throw 'nenhum aparelho conectado em `adb devices`'
}

$directory = Join-Path $env:TEMP "lebot-measure\$Label"
New-Item -ItemType Directory -Force -Path $directory | Out-Null

function Grab([string]$text, [string]$pattern) {
  $match = [regex]::Match($text, $pattern)

  if (-not $match.Success) {
    return ''
  }

  return $match.Groups[1].Value
}

$rows = @()

for ($round = 1; $round -le $Rounds; $round++) {
  & $Adb shell am force-stop $Package | Out-Null
  & $Adb shell am start -n "$Package/.MainActivity" | Out-Null
  Start-Sleep -Seconds $WarmupSeconds
  & $Adb shell dumpsys gfxinfo $Package reset | Out-Null

  1..$Flings | ForEach-Object {
    & $Adb shell input swipe 540 1700 540 600 180 | Out-Null
    Start-Sleep -Milliseconds 1500
  }

  Start-Sleep -Seconds 2

  $dump = & $Adb shell dumpsys gfxinfo $Package
  $dump | Out-File -Encoding utf8 (Join-Path $directory "round$round.txt")

  $text = $dump -join "`n"
  $row = [pscustomobject]@{
    Round  = $round
    Frames = Grab $text 'Total frames rendered: (\d+)'
    Janky  = Grab $text 'Janky frames: \d+ \(([\d.]+)%\)'
    P50    = Grab $text '50th percentile: (\d+)ms'
    P90    = Grab $text '90th percentile: (\d+)ms'
    P95    = Grab $text '95th percentile: (\d+)ms'
    P99    = Grab $text '99th percentile: (\d+)ms'
  }

  $rows += $row
  $row | Format-Table -AutoSize | Out-String | Write-Host
}

if ($Framestats) {
  & $Adb shell dumpsys gfxinfo $Package framestats |
    Out-File -Encoding utf8 (Join-Path $directory 'framestats.txt')
}

$rows | Format-Table -AutoSize | Out-String | Write-Host
$rows | Export-Csv (Join-Path $directory 'summary.csv') -NoTypeInformation
Write-Host "dumps em $directory"
