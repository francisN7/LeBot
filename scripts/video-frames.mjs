#!/usr/bin/env node
// Analisa vídeos do `adb shell screenrecord` quadro a quadro (protocolo da S14b).
//
// O ffmpeg entrega os quadros em cinza e reduzidos (`rawvideo`); o ffprobe dá o
// instante de cada um (o screenrecord grava com taxa variável). Um quadro
// "muda" quando a fração de pixels com diferença > 24 níveis passa do limiar.
//
//   boot <video>  do 1º quadro que muda até o quadro a partir do qual a tela já
//                 é a final (ignora a barra de status no topo)
//   taps <video>  para cada toque na barra de abas (bolinha do show_touches),
//                 do toque até a última mudança grande do conteúdo antes do
//                 próximo toque
//
// Requisitos: ffmpeg e ffprobe no PATH. Saída em ms, uma linha por medida.

import { spawnSync } from 'node:child_process';

const HELP = `Uso: node scripts/video-frames.mjs <boot|taps> <video.mp4> [opções]

  --top F          fração do topo ignorada (barra de status; padrão 0.05)
  --bar F          início da barra de abas, fração da altura (padrão 0.9)
  --share F        fração de pixels para "mudança grande" (padrão 0.02)
  --touch-share F  fração da barra para detectar o toque (padrão 0.003)
  --width N        largura da análise em px (padrão 120)
  -h, --help       mostra esta ajuda`;

const PIXEL_DELTA = 24;
/** Barra parada por este tempo antes de um toque novo contar. */
const CALM_MS = 500;

function parseArgs(argv) {
  const options = {
    top: 0.05,
    bar: 0.9,
    share: 0.02,
    touchShare: 0.003,
    width: 120,
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      const value = Number(argv[++index]);
      if (!Number.isFinite(value)) {
        fail(`${arg} precisa de número`);
      }
      return value;
    };

    if (arg === '-h' || arg === '--help') {
      console.log(HELP);
      process.exit(0);
    } else if (arg === '--top') options.top = next();
    else if (arg === '--bar') options.bar = next();
    else if (arg === '--share') options.share = next();
    else if (arg === '--touch-share') options.touchShare = next();
    else if (arg === '--width') options.width = next();
    else positional.push(arg);
  }

  return { options, mode: positional[0], video: positional[1] };
}

function fail(message) {
  console.error(message);
  console.error(HELP);
  process.exit(2);
}

function run(command, args, maxBuffer = 64 * 1024 * 1024) {
  const result = spawnSync(command, args, { maxBuffer });
  if (result.error) {
    fail(`${command}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${command} falhou: ${result.stderr.toString()}`);
  }
  return result.stdout;
}

/** Quadros em cinza (`Uint8Array` por quadro) e instantes em ms. */
function readFrames(video, width) {
  const [sourceWidth, sourceHeight] = run('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height',
    '-of',
    'csv=p=0',
    video,
  ])
    .toString()
    .trim()
    .split(',')
    .map(Number);
  // Altura par: alguns filtros do ffmpeg exigem.
  const height = Math.round((sourceHeight * width) / sourceWidth / 2) * 2;

  const times = run('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'frame=pts_time',
    '-of',
    'csv=p=0',
    video,
  ])
    .toString()
    .trim()
    .split('\n')
    .map((line) => Number(line) * 1000);

  const raw = run(
    'ffmpeg',
    [
      '-v',
      'error',
      '-i',
      video,
      '-fps_mode',
      'passthrough',
      '-vf',
      `scale=${width}:${height},format=gray`,
      '-f',
      'rawvideo',
      'pipe:1',
    ],
    1024 * 1024 * 1024,
  );

  const size = width * height;
  const count = Math.min(times.length, Math.floor(raw.length / size));
  const frames = [];
  for (let index = 0; index < count; index += 1) {
    frames.push(raw.subarray(index * size, (index + 1) * size));
  }

  return { frames, times: times.slice(0, count), width, height };
}

/** Fração de pixels diferentes entre as linhas [from, to). */
function changedShare(first, second, width, from, to) {
  let changed = 0;
  for (let offset = from * width; offset < to * width; offset += 1) {
    if (Math.abs(first[offset] - second[offset]) > PIXEL_DELTA) {
      changed += 1;
    }
  }
  return changed / ((to - from) * width);
}

function boot({ frames, times, width, height }, options) {
  const from = Math.round(height * options.top);
  const last = frames[frames.length - 1];
  const differs = (a, b) =>
    changedShare(a, b, width, from, height) > options.share;

  const start = frames.findIndex((frame) => differs(frame, frames[0]));
  if (start < 0) {
    fail('nenhum quadro mudou: o vídeo pegou o app já aberto?');
  }

  let stable = frames.length - 1;
  while (stable > start && !differs(frames[stable - 1], last)) {
    stable -= 1;
  }

  console.log(`inicio_ms=${Math.round(times[start])}`);
  console.log(`estavel_ms=${Math.round(times[stable] - times[start])}`);
}

function taps({ frames, times, width, height }, options) {
  const top = Math.round(height * options.top);
  const bar = Math.round(height * options.bar);
  const touches = [];
  let calmSince = times[0];

  for (let index = 1; index < frames.length; index += 1) {
    const barShare = changedShare(
      frames[index],
      frames[index - 1],
      width,
      bar,
      height,
    );
    if (barShare <= options.touchShare) {
      continue;
    }
    if (times[index] - calmSince >= CALM_MS) {
      touches.push(index);
    }
    calmSince = times[index];
  }

  if (touches.length === 0) {
    fail('nenhum toque achado na barra: show_touches ligado? --bar certo?');
  }

  touches.forEach((touch, order) => {
    const end = touches[order + 1] ?? frames.length;
    let settle = touch;
    for (let index = touch + 1; index < end; index += 1) {
      if (
        changedShare(frames[index], frames[index - 1], width, top, bar) >
        options.share
      ) {
        settle = index;
      }
    }
    console.log(
      `toque=${order + 1} em_ms=${Math.round(times[touch])} assentou_ms=${Math.round(times[settle] - times[touch])}`,
    );
  });
}

const { options, mode, video } = parseArgs(process.argv.slice(2));

if (!video || (mode !== 'boot' && mode !== 'taps')) {
  fail('informe o modo (boot ou taps) e o vídeo');
}

const data = readFrames(video, options.width);
if (data.frames.length < 2) {
  fail('vídeo com menos de 2 quadros');
}

(mode === 'boot' ? boot : taps)(data, options);
