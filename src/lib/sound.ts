// Small Web Audio player: buffers are decoded once, every play is a fresh
// source so rapid clicks can overlap. Audio unlocks on the first key/click.
import biometric from '../../sounds/biometric.mp3';
import click from '../../sounds/click.mp3';
import enter from '../../sounds/enter.wav';
import anthemUrl from '../../sounds/national_anthem.mp3';
import frequencyFound from '../../sounds/frequency_found.mp3';
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
// Section sounds (files use an uppercase .MP3 extension, so import them as URLs).
import tabArchive from '../../sounds/archive.MP3?url';
import tabComms from '../../sounds/communications_hub.MP3?url';
import tabOverview from '../../sounds/overview.MP3?url';
import tabPersonnel from '../../sounds/personell_files.MP3?url';
import tabReports from '../../sounds/field_reports.MP3?url';

const URLS = { biometric, click, commsLogin, enter, error, frequencyFound, memetic, negative, notify, receivedMessage, selfDestruct, sentMessage, startup, tabArchive, tabComms, tabOverview, tabPersonnel, tabReports, terminalNoise, uiuSuccess };
export type SoundName = keyof typeof URLS;

let ctx: AudioContext | null = null;
const buffers = new Map<SoundName, AudioBuffer>();

let loading: Promise<void> = Promise.resolve();

// Browsers (Safari especially) keep audio suspended until a gesture they
// accept. Retry on every click, tap and key press so audio always unlocks.
const unlock = () => {
  if (!ctx) initAudio();
  else if (ctx.state !== 'running') ctx.resume().catch(() => {});
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

// National anthem: a plain <audio> element so it can start directly inside a
// gesture handler without waiting for decoding. Starts with the seal on the
// power-on screen and fades out when the UIU terminal intro ends. start()
// resolves to false when the browser blocks autoplay.
let anthemEl: HTMLAudioElement | null = null;
export const anthem = {
  start(): Promise<boolean> {
    if (anthemEl && !anthemEl.paused) return Promise.resolve(true);
    anthemEl?.pause();
    const el = new Audio(anthemUrl);
    anthemEl = el;
    el.volume = 0.45;
    return el.play().then(
      () => true,
      () => false,
    );
  },
  fade(ms = 1500) {
    const el = anthemEl;
    if (!el) return;
    anthemEl = null;
    const step = el.volume / (ms / 50);
    const t = setInterval(() => {
      el.volume = Math.max(0, el.volume - step);
      if (el.volume === 0) {
        clearInterval(t);
        el.pause();
      }
    }, 50);
  },
};
