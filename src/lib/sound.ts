// Small Web Audio player: buffers are decoded once, every play is a fresh
// source so rapid clicks can overlap. Audio unlocks on the first key/click.
// sounds/ui: generic interface feedback
import click from '../../sounds/ui/click.mp3';
import enter from '../../sounds/ui/enter.wav';
import error from '../../sounds/ui/error.wav';
import negative from '../../sounds/ui/negative.mp3';
import notify from '../../sounds/ui/notification.mp3';
import receivedMessage from '../../sounds/ui/message_received.mp3';
import sentMessage from '../../sounds/ui/message_sent.mp3';
// sounds/uiu_terminal: the FBI field terminal and the breach
import anthemUrl from '../../sounds/uiu_terminal/national_anthem.mp3';
import frequencyFound from '../../sounds/uiu_terminal/frequency_found.mp3';
import memetic from '../../sounds/uiu_terminal/memetic_agent_detected.wav';
import terminalNoise from '../../sounds/uiu_terminal/background_noise.mp3';
import triangulate from '../../sounds/uiu_terminal/triangulating_search.mp3';
import uiuSuccess from '../../sounds/uiu_terminal/breach_success.wav';
// sounds/scipnet: SCiPnet itself
import biometric from '../../sounds/scipnet/biometric_scan.mp3';
import commsLogin from '../../sounds/scipnet/comms_login.wav';
import selfDestruct from '../../sounds/scipnet/self_destruct.mp3';
import startup from '../../sounds/scipnet/startup.mp3';
// sounds/tabs: one per dock section
import tabArchive from '../../sounds/tabs/archive.mp3';
import tabComms from '../../sounds/tabs/communications.mp3';
import tabOverview from '../../sounds/tabs/overview.mp3';
import tabPersonnel from '../../sounds/tabs/personnel_files.mp3';
import tabReports from '../../sounds/tabs/field_reports.mp3';

const URLS = { biometric, click, commsLogin, enter, error, frequencyFound, memetic, negative, notify, receivedMessage, selfDestruct, sentMessage, startup, tabArchive, tabComms, tabOverview, tabPersonnel, tabReports, terminalNoise, triangulate, uiuSuccess };
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
  // Resolves when the anthem has played to the end (or is not playing).
  ended(): Promise<void> {
    const el = anthemEl;
    if (!el || el.ended || el.paused) return Promise.resolve();
    return new Promise((res) => el.addEventListener('ended', () => res(), { once: true }));
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
