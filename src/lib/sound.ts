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
import notify from '../../sounds/new_notify.mp3';
import receivedMessage from '../../sounds/recieved_message.mp3';
import sentMessage from '../../sounds/sent_message.mp3';
import terminalNoise from '../../sounds/uiu_terminal_background_noise.mp3';
import uiuSuccess from '../../sounds/uiu_success.wav';

const URLS = { biometric, click, commsLogin, enter, error, memetic, negative, notify, receivedMessage, selfDestruct, sentMessage, startup, terminalNoise, uiuSuccess };
export type SoundName = keyof typeof URLS;

let ctx: AudioContext | null = null;
const buffers = new Map<SoundName, AudioBuffer>();

let loading: Promise<void> = Promise.resolve();

// Browsers (Safari especially) keep audio suspended until a gesture they
// accept. Retry on every click, tap and key press so audio always unlocks.
const unlock = () => {
  if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
};
for (const ev of ['pointerdown', 'touchend', 'click', 'keydown']) {
  window.addEventListener(ev, unlock, { capture: true, passive: true });
}

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

// Returns a function that stops the sound early, optionally fading out over `fadeMs`.
export function play(name: SoundName, volume = 1, loop = false): (fadeMs?: number) => void {
  const buf = buffers.get(name);
  if (!ctx || !buf) return () => {};
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  const audio = ctx;
  const src = audio.createBufferSource();
  const gain = audio.createGain();
  gain.gain.value = volume;
  src.buffer = buf;
  src.loop = loop;
  src.connect(gain).connect(audio.destination);
  src.start();
  return (fadeMs = 0) => {
    try {
      const end = audio.currentTime + fadeMs / 1000;
      gain.gain.setValueAtTime(gain.gain.value, audio.currentTime);
      gain.gain.linearRampToValueAtTime(0, end);
      src.stop(end);
    } catch {
      // already ended
    }
  };
}
