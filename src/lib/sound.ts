// Small Web Audio player: buffers are decoded once, every play is a fresh
// source so rapid clicks can overlap. Audio unlocks on the first key/click.
import biometric from '../../sounds/biometric.mp3';
import click from '../../sounds/click.mp3';
import enter from '../../sounds/enter.wav';
import error from '../../sounds/error.wav';
import commsLogin from '../../sounds/communications_hub_login.wav';
import memetic from '../../sounds/memetic_agent_detected.wav';
import selfDestruct from '../../sounds/self_destruct.mp3';
import startup from '../../sounds/scipnet_startup.mp3';
import negative from '../../sounds/ui_negative.mp3';
import uiuSuccess from '../../sounds/uiu_success.wav';

const URLS = { biometric, click, commsLogin, enter, error, memetic, negative, selfDestruct, startup, uiuSuccess };
export type SoundName = keyof typeof URLS;

let ctx: AudioContext | null = null;
const buffers = new Map<SoundName, AudioBuffer>();

let loading: Promise<void> = Promise.resolve();

// Resolves once every sound is decoded (or failed to load).
export function initAudio(): Promise<void> {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return loading;
  }
  ctx = new AudioContext();
  loading = Promise.all(
    (Object.entries(URLS) as [SoundName, string][]).map(([name, url]) =>
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((data) => ctx!.decodeAudioData(data))
        .then((buf) => void buffers.set(name, buf))
        .catch(() => {}),
    ),
  ).then(() => {});
  return loading;
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
