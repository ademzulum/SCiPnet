// Tiny scripted-terminal engine. A script is a list of steps that the runner
// plays back against a Ctx (which the React component wires to state).
import type { SoundName } from './sound';

export type Line = { id: number; text: string; cls?: string; prompt?: string };

export type Step =
  | { t: 'cmd'; text: string; prompt?: string; speed?: number } // typed by the "agent"
  | { t: 'line'; text: string; cls?: string; delay?: number } // instant output
  | { t: 'lines'; lines: string[]; cls?: string; gap?: number }
  | { t: 'wait'; ms: number }
  | { t: 'progress'; label: string; ms: number; cls?: string }
  | { t: 'scramble'; label: string; value: string; ms: number; cls?: string }
  | { t: 'hex'; rows: number; gap?: number }
  | { t: 'alert'; on: boolean }
  | { t: 'sound'; name: SoundName; volume?: number }
  | { t: 'clear' }
  // Interactive steps (wait for the player):
  | { t: 'tune'; label: string } // find the signal with ←/→, lock with Enter
  | { t: 'choice'; options: ChoiceOption[] }; // pick by key; `retry` options ask again afterwards

export type ChoiceOption = { key: string; label: string; steps: Step[]; retry?: boolean };

export interface Ctx {
  push(line: Omit<Line, 'id'>): void;
  set(line: Omit<Line, 'id'>): void; // replace last line
  clear(): void;
  alert(on: boolean): void;
  sound(name: SoundName, volume?: number): void;
  sleep(ms: number): Promise<void>;
  // Resolves once `handler` returns true for a key press. `pads` are offered
  // as on-screen buttons for touch screens; each sends its key.
  key(handler: (e: KeyboardEvent) => boolean, pads?: Pad[]): Promise<void>;
}

export type Pad = { key: string; label: string };

export const CANCEL = Symbol('cancel');

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@*+=?<>/\\';
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const glyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
const hexByte = () => ((Math.random() * 256) | 0).toString(16).padStart(2, '0');

export const DEFAULT_PROMPT = 'uiu@ws07:~$ ';

function bar(pct: number, width = 32) {
  const full = Math.round((pct / 100) * width);
  return '[' + '█'.repeat(full) + '░'.repeat(width - full) + ']';
}

export async function run(steps: Step[], ctx: Ctx) {
  for (const s of steps) {
    switch (s.t) {
      case 'cmd': {
        const prompt = s.prompt ?? DEFAULT_PROMPT;
        ctx.push({ text: '', prompt, cls: 'cmd' });
        await ctx.sleep(rand(250, 500));
        for (let i = 1; i <= s.text.length; i++) {
          ctx.set({ text: s.text.slice(0, i), prompt, cls: 'cmd' });
          await ctx.sleep(rand(18, 60) * (s.speed ?? 1));
        }
        await ctx.sleep(rand(200, 380));
        break;
      }
      case 'line':
        ctx.push({ text: s.text, cls: s.cls });
        await ctx.sleep(s.delay ?? 45);
        break;
      case 'lines':
        for (const text of s.lines) {
          ctx.push({ text, cls: s.cls });
          await ctx.sleep(s.gap ?? 35);
        }
        break;
      case 'wait':
        await ctx.sleep(s.ms);
        break;
      case 'progress': {
        const render = (p: number) => `${s.label.padEnd(28)}${bar(p)} ${String(p).padStart(3)}%`;
        let pct = 0;
        ctx.push({ text: render(0), cls: s.cls });
        const tick = 40;
        const avg = 100 / (s.ms / tick);
        while (pct < 100) {
          await ctx.sleep(tick);
          // uneven increments + occasional stalls feel more "real"
          pct = Math.min(100, pct + (Math.random() < 0.15 ? 0 : Math.round(rand(0.3, 1.9) * avg)));
          ctx.set({ text: render(pct), cls: s.cls });
        }
        await ctx.sleep(120);
        break;
      }
      case 'scramble': {
        const tick = 35;
        const total = Math.max(1, Math.round(s.ms / tick));
        ctx.push({ text: s.label, cls: s.cls });
        for (let f = 0; f <= total; f++) {
          const revealed = Math.floor((f / total) * s.value.length);
          let out = s.value.slice(0, revealed);
          for (let i = revealed; i < s.value.length; i++) out += s.value[i] === ' ' ? ' ' : glyph();
          ctx.set({ text: s.label + out, cls: s.cls });
          await ctx.sleep(tick);
        }
        break;
      }
      case 'hex':
        for (let r = 0; r < s.rows; r++) {
          const addr = '0x' + ((0x7f3a0000 + r * 16) >>> 0).toString(16);
          const bytes = Array.from({ length: 16 }, hexByte);
          const ascii = bytes
            .map((b) => {
              const c = parseInt(b, 16);
              return c > 32 && c < 127 ? String.fromCharCode(c) : '.';
            })
            .join('');
          ctx.push({ text: `${addr}  ${bytes.join(' ')}  |${ascii}|`, cls: 'dim' });
          await ctx.sleep(s.gap ?? 22);
        }
        break;
      case 'alert':
        ctx.alert(s.on);
        break;
      case 'sound':
        ctx.sound(s.name, s.volume);
        break;
      case 'clear':
        ctx.clear();
        await ctx.sleep(60);
        break;
      case 'tune': {
        const W = 33;
        const target = 4 + ((Math.random() * (W - 8)) | 0);
        let pos = target > W / 2 ? 1 : W - 2;
        const render = (msg = '') => {
          const dist = Math.abs(pos - target);
          const strength = Math.max(0, 6 - dist);
          const scale = Array.from({ length: W }, (_, i) => (i === pos ? '▲' : i % 4 === 0 ? '┼' : '─')).join('');
          const meter = '▮'.repeat(strength) + '▯'.repeat(6 - strength);
          ctx.set({
            text: `${s.label.padEnd(18)}${scale}  ${(400 + pos * 1.37).toFixed(1)} MHz  ${meter}${msg}`,
            cls: dist === 0 ? 'hi' : undefined,
          });
        };
        ctx.push({ text: '' });
        render();
        await ctx.key((e) => {
          if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') pos = Math.max(0, pos - 1);
          else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') pos = Math.min(W - 1, pos + 1);
          else if (e.key === 'Enter') {
            if (pos === target) {
              ctx.sound('enter', 0.8);
              return true;
            }
            ctx.sound('negative', 0.7);
            render('  SIGNAL ZU SCHWACH');
            return false;
          } else return false;
          if (pos === target) ctx.sound('frequencyFound', 0.8);
          render();
          return false;
        }, [
          { key: 'ArrowLeft', label: '◀' },
          { key: 'ArrowRight', label: '▶' },
          { key: 'Enter', label: 'FIXIEREN' },
        ]);
        render('  FIXIERT');
        await ctx.sleep(400);
        break;
      }
      case 'choice': {
        ctx.push({ text: s.options.map((o) => `[${o.key.toUpperCase()}] ${o.label}`).join('     '), cls: 'hi' });
        for (;;) {
          const picked: { o?: ChoiceOption } = {};
          await ctx.key((e) => {
            picked.o = s.options.find((o) => o.key.toLowerCase() === e.key.toLowerCase());
            return !!picked.o;
          }, s.options.map((o) => ({ key: o.key, label: `[${o.key.toUpperCase()}] ${o.label}` })));
          ctx.sound('click', 0.6);
          ctx.push({ text: `> ${picked.o!.label}`, cls: 'dim' });
          await run(picked.o!.steps, ctx);
          if (!picked.o!.retry) break;
        }
        break;
      }
    }
  }
}
