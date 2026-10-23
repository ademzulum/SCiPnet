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
  | { t: 'clear' };

export interface Ctx {
  push(line: Omit<Line, 'id'>): void;
  set(line: Omit<Line, 'id'>): void; // replace last line
  clear(): void;
  alert(on: boolean): void;
  sound(name: SoundName, volume?: number): void;
  sleep(ms: number): Promise<void>;
}

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
        ctx.sound('enter', 0.6);
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
    }
  }
}
