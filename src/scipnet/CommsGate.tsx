import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAccount } from './session';
import { THREADS } from '../data/threads';
import { play } from '../lib/sound';

// Login in front of the communications hub: the channel key fills in, the
// user tunes the receiver to the Site-80 frequency (slider or arrow keys),
// connects (button or Enter), a short handshake runs, then the hub opens
// with the communications_hub_login sound.

type Phase = 'filling' | 'tuning' | 'ready' | 'handshake' | 'ok';

const KEY = 'KX-80-7F3A-91C2-E04D';
const HANDSHAKE = ['Kanal öffnen', 'Schlüssel austauschen', 'Identität bestätigen'];
const STEP_MS = 520;
const TARGET = 80.17; // MHz, "Site-80"
const MIN_F = 76;
const MAX_F = 84;
const LOCK = 0.12; // close enough to snap onto the signal
const BARS = 24;
const CHANNELS = [
  { name: 'Site-80 · Intern', note: `${THREADS.length} Kanäle`, open: true },
  { name: 'RAISA-Verbindung', note: 'nur lesend', open: true },
  { name: 'O5-Rat', note: 'gesperrt', open: false },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function CommsGate({ onDone }: { onDone: () => void }) {
  const me = useAccount();
  const [phase, setPhase] = useState<Phase>('filling');
  const [key, setKey] = useState('');
  const [steps, setSteps] = useState(0);
  const [freq, setFreq] = useState(77.4);
  const signal = phase === 'filling' ? 0 : Math.max(0, 1 - Math.abs(freq - TARGET) / 3); // 0..1
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const done = useRef(onDone);
  done.current = onDone;
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    (async () => {
      await wait(450);
      for (let i = 1; i <= KEY.length && alive.current; i++) {
        setKey(KEY.slice(0, i));
        await wait(28 + Math.random() * 30);
      }
      if (alive.current) setPhase('tuning');
    })();
    return () => {
      alive.current = false;
    };
  }, []);

  const tune = (f: number) => {
    if (phaseRef.current !== 'tuning') return;
    if (Math.abs(f - TARGET) <= LOCK) {
      setFreq(TARGET);
      phaseRef.current = 'ready';
      setPhase('ready');
      play('frequencyFound', 0.6);
    } else setFreq(f);
  };

  const connect = async () => {
    if (phaseRef.current !== 'ready') return;
    phaseRef.current = 'handshake';
    setPhase('handshake');
    for (let i = 1; i <= HANDSHAKE.length; i++) {
      await wait(STEP_MS);
      if (!alive.current) return;
      setSteps(i);
    }
    await wait(200);
    if (!alive.current) return;
    play('commsLogin');
    setPhase('ok');
    await wait(1300);
    if (alive.current) done.current();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || phaseRef.current !== 'ready') return;
      play('enter', 0.8);
      connect();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="page cg-layout">
      <TrafficLog phase={phase} freq={freq} />
      <div className={`commsgate box cg-${phase}`}>
        <div className="cg-emblem" aria-hidden>
          <span className="cg-wave w1" />
          <span className="cg-wave w2" />
          <span className="cg-wave w3" />
          <span className="cg-core">{phase === 'ok' ? '✓' : '⌁'}</span>
        </div>

        <div className="label">Kommunikationszentrale · Site-80</div>
        <h2>Kanalanmeldung</h2>
        <p className="dim">Für den Zugriff auf interne Kanäle ist ein gültiger Kanalschlüssel erforderlich.</p>

        <div className="cg-grid">
          <div>
            <div className="cg-fields">
              <label>
                <span className="label">Teilnehmer</span>
                <span className="cg-value">{me.user}</span>
              </label>
              <label>
                <span className="label">Kanalschlüssel</span>
                <span className="cg-value mono">
                  {key}
                  {phase === 'filling' && <span className="cursor" />}
                </span>
              </label>
            </div>

            <div className={`cg-tuner${phase === 'ready' || phase === 'handshake' || phase === 'ok' ? ' locked' : ''}`}>
              <div className="cg-tuner-head">
                <span className="label">Empfänger</span>
                <span className="cg-freq">{freq.toFixed(2)} MHz</span>
              </div>
              <div className="cg-scope" style={{ '--sig': signal } as CSSProperties} aria-hidden>
                {Array.from({ length: BARS }, (_, i) => (
                  <span key={i} style={{ animationDelay: `${(i * 137) % 900}ms` }} />
                ))}
              </div>
              <input
                type="range"
                className="cg-slider"
                min={MIN_F}
                max={MAX_F}
                step={0.01}
                value={freq}
                disabled={phase !== 'tuning'}
                onChange={(e) => tune(Number(e.target.value))}
                aria-label="Frequenz abstimmen"
              />
              <div className="cg-tuner-foot small">
                <span>{MIN_F} MHz</span>
                <span className={phase === 'tuning' || phase === 'filling' ? 'dim' : 'ok-text'}>
                  {phase === 'filling'
                    ? 'Warte auf Schlüssel…'
                    : phase === 'tuning'
                      ? `Signal ${Math.round(signal * 100)}% · auf Site-80 abstimmen`
                      : 'SIGNAL GEFUNDEN'}
                </span>
                <span>{MAX_F} MHz</span>
              </div>
            </div>
          </div>

          <ul className="cg-channels">
            <li className="label">Verfügbare Kanäle</li>
            {CHANNELS.map((c) => (
              <li key={c.name} className={c.open ? '' : 'closed'}>
                <span className={c.open ? 'live-dot' : 'cg-lock'} aria-hidden>
                  {c.open ? '' : '⬢'}
                </span>
                <span>{c.name}</span>
                <span className="dim small">{c.note}</span>
              </li>
            ))}
            <li className="cg-meta dim small">Verschlüsselung AES-512 · Relais Site-80 · Teilnehmer {me.personnelId}</li>
          </ul>
        </div>

        <AnimatePresence mode="wait">
          {phase === 'filling' || phase === 'tuning' || phase === 'ready' ? (
            <motion.button
              key="btn"
              className={`card action cg-connect ${phase === 'ready' ? 'pulse' : ''}`}
              disabled={phase !== 'ready'}
              onClick={connect}
              exit={{ opacity: 0, y: -6 }}
            >
              {phase === 'ready' ? (
                <>
                  VERBINDEN<span className="key-hint">  [ENTER]</span>
                </>
              ) : phase === 'tuning' ? (
                'FREQUENZ ABSTIMMEN'
              ) : (
                'SCHLÜSSEL WIRD GELADEN…'
              )}
            </motion.button>
          ) : (
            <motion.ul key="steps" className="cg-steps" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              {HANDSHAKE.map((h, i) => (
                <li key={h} className={i < steps ? 'ok' : i === steps && phase === 'handshake' ? 'busy' : ''}>
                  <span className="mod-dot" />
                  {h}
                </li>
              ))}
              {phase === 'ok' && (
                <motion.li className="cg-ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  VERBINDUNG HERGESTELLT
                </motion.li>
              )}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      <Relays locked={phase === 'ready' || phase === 'handshake' || phase === 'ok'} />
    </div>
  );
}

// ---- side panels on wide screens: live radio traffic and the relay network ----

const CHATTER = [
  'RELAIS SÜD · Paket 4F2A quittiert',
  'MTF Delta-5 · Statusmeldung empfangen',
  'Site-19 · Routinesynchronisation',
  'Archiv 7 · Zugriff verweigert',
  'RAISA · Prüfsumme gültig',
  'Wachdienst Sektor 14 · Rundgang abgeschlossen',
  'Unbekannte Quelle · Träger 79.3 MHz',
  'O5-Büro · verschlüsselt, nicht lesbar',
  'Site-80 Intern · Heartbeat',
  'Feldteam Kiruna · Verbindung schwach',
];
const stamp = () => new Date().toLocaleTimeString('de-DE');

function TrafficLog({ phase, freq }: { phase: Phase; freq: number }) {
  const [lines, setLines] = useState<{ t: string; text: string; warn?: boolean }[]>(() =>
    CHATTER.slice(0, 5).map((text) => ({ t: stamp(), text })),
  );
  const freqRef = useRef(freq);
  freqRef.current = freq;
  useEffect(() => {
    const id = setInterval(() => {
      const text = CHATTER[(Math.random() * CHATTER.length) | 0];
      const line = { t: stamp(), text, warn: /Unbekannt|verweigert|schwach/.test(text) };
      setLines((l) => [line, ...l].slice(0, 12));
    }, 1600 + Math.random() * 900);
    return () => clearInterval(id);
  }, []);
  // the gate's own steps show up in the log too
  useEffect(() => {
    const msg: Partial<Record<Phase, string>> = {
      tuning: 'Kanalschlüssel geladen · Empfänger aktiv',
      ready: `Träger gefunden · ${freqRef.current.toFixed(2)} MHz`,
      handshake: 'Handshake mit Site-80 Intern',
      ok: 'Teilnehmer authentifiziert',
    };
    if (msg[phase]) setLines((l) => [{ t: stamp(), text: msg[phase]!, warn: false }, ...l].slice(0, 12));
  }, [phase]);
  return (
    <aside className="box cg-side cg-log" aria-label="Funkverkehr">
      <div className="box-head">
        <h3>Funkverkehr</h3>
        <span className="small">
          <span className="live-dot" /> LIVE
        </span>
      </div>
      <ol>
        {lines.map((l, i) => (
          <li key={l.t + l.text + i} className={l.warn ? 'warn' : ''}>
            <time>{l.t}</time>
            <span>{l.text}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

const RELAYS = [
  { name: 'Site-80 Intern', base: 12 },
  { name: 'Relais Süd', base: 28 },
  { name: 'Site-19', base: 64 },
  { name: 'RAISA-Knoten', base: 41 },
  { name: 'O5-Netz', base: 0 },
];

function Relays({ locked }: { locked: boolean }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((n) => n + 1), 1200);
    return () => clearInterval(id);
  }, []);
  return (
    <aside className="box cg-side cg-relays" aria-label="Relaisstationen">
      <div className="box-head">
        <h3>Relaisstationen</h3>
        <span className="small dim">{locked ? 'Route steht' : 'Suche Route'}</span>
      </div>
      <ul>
        {RELAYS.map((r, i) => {
          const off = !r.base;
          const ping = off ? 0 : Math.round(r.base + Math.abs(Math.sin(t * 0.9 + i * 2)) * r.base * 0.4);
          const q = off ? 0 : Math.max(1, 4 - Math.floor(ping / 25));
          return (
            <li key={r.name} className={`${off ? 'off' : ''}${locked && i === 0 ? ' route' : ''}`}>
              <span className="gf-bars" aria-hidden>
                {[0, 1, 2, 3].map((b) => (
                  <i key={b} className={b < q ? 'on' : ''} />
                ))}
              </span>
              <span className="cg-relay-name">{r.name}</span>
              <span className="cg-relay-ping">{off ? 'gesperrt' : `${ping} ms`}</span>
            </li>
          );
        })}
      </ul>
      <div className="cg-relay-foot small dim">Verschlüsselung AES-512 · 5 Knoten</div>
    </aside>
  );
}
