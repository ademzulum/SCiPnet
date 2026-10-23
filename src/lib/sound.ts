// Small Web Audio player: buffers are decoded once, every play is a fresh
// source so rapid clicks can overlap. Audio unlocks on the first key/click.
import biometric from '../../sounds/biometric.mp3';
import click from '../../sounds/click.mp3';
import enter from '../../sounds/enter.wav';
import error from '../../sounds/error.wav';
import loginSuccess from '../../sounds/login_success.wav';
import memetic from '../../sounds/memetic_agent_detected.wav';
import selfDestruct from '../../sounds/self_destruct.mp3';
import startup from '../../sounds/scipnet_startup.mp3';
import negative from '../../sounds/ui_negative.mp3';
import uiuSuccess from '../../sounds/uiu_success.wav';

const URLS = { biometric, click, enter, error, loginSuccess, memetic, negative, selfDestruct, startup, uiuSuccess };
export type SoundName = keyof typeof URLS;

let ctx: AudioContext | null = null;
const buffers = new Map<SoundName, AudioBuffer>();

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  ctx = new AudioContext();
  for (const [name, url] of Object.entries(URLS) as [SoundName, string][]) {
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((data) => ctx!.decodeAudioData(data))
      .then((buf) => buffers.set(name, buf))
      .catch(() => {});
  }
}

// Returns a function that stops the sound early.
export function play(name: SoundName, volume = 1): () => void {
  const buf = buffers.get(name);
  if (!ctx || !buf) return () => {};
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.buffer = buf;
  src.connect(gain).connect(ctx.destination);
  src.start();
  return () => {
    try {
      src.stop();
    } catch {
      // already ended
    }
  };
}
