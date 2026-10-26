// S.C.I.P.A.'s free-form answers: a Vercel Function that asks a model through
// the Vercel AI Gateway. The client only calls it when no scripted intent
// matched. Authentication is Vercel OIDC (no API key in the repo). The model
// can be changed with AI_GATEWAY_MODEL. Imports need .js: the function runs as plain Node ESM.
import { generateText } from 'ai';
import { SCP } from '../src/data/scp.js';
import { ADMIN_PERSON, O5_PERSON, PERSONNEL } from '../src/data/personnel.js';
import { REPORTS } from '../src/data/reports.js';

// The archive lives in Supabase; read it with the public key (read access is
// open to everyone) and keep it for a minute per function instance.
const DB_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const DB_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
let loadedAt = 0;
async function loadArchive() {
  if (!DB_URL || !DB_KEY || Date.now() - loadedAt < 60_000) return;
  const res = await fetch(`${DB_URL}/rest/v1/entries?select=kind,data&order=position`, { headers: { apikey: DB_KEY } });
  if (!res.ok) return;
  const rows = (await res.json()) as { kind: string; data: never }[];
  const lists: Record<string, unknown[]> = { scp: SCP, personnel: PERSONNEL, report: REPORTS };
  for (const l of Object.values(lists)) l.length = 0;
  for (const r of rows) lists[r.kind]?.push(r.data);
  loadedAt = Date.now();
}

const MODEL = process.env.AI_GATEWAY_MODEL ?? 'google/gemini-2.5-flash-lite';
const MAX_INPUT = 500;
const MAX_HISTORY = 8;

// Best-effort rate limit per IP and function instance: 12 requests a minute.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 12;
}

const strip = (s: string) => s.replace(/\[\[[^\]]*\]\]/g, '[REDACTED]');

function knowledge(unlocked: boolean) {
  const scp = SCP.map((s) =>
    s.locked && !unlocked
      ? `${s.id}: GESPERRT (erfordert ${s.locked.required}). Keine Auskunft.`
      : `${s.id} "${s.locked?.realName ?? s.name}" (${s.objectClass}, ${s.clearance}): ${strip(s.summary)} ${strip(s.description.join(' '))}`,
  );
  const people = [...PERSONNEL, ...(unlocked ? [O5_PERSON, ADMIN_PERSON] : [])].map(
    (p) => `${p.name} (${p.id}), ${p.role}, ${p.department}, ${p.clearance}, Status ${p.status}: ${strip(p.summary)}`,
  );
  const reports = REPORTS.map((r) => `${r.id} "${r.title}" (${r.date}, ${r.status}): ${strip(r.summary)}`);
  return [`SCP-Objekte:\n${scp.join('\n')}`, `Personal:\n${people.join('\n')}`, `Feldberichte:\n${reports.join('\n')}`].join('\n\n');
}

type Turn = { from: 'me' | 'scipa'; text: string };
type NoticeCtx = { id: number; level: string; title: string; text: string; time: string; read: boolean };

// Recorded voice lines (sounds/assistant/). When an answer opens with one of
// these sentences, the client plays the recording.
const VOICES: Record<string, string> = {
  yes: 'Ja.',
  no: 'Nein.',
  absolutely: 'Absolut.',
  correct: 'Korrekt.',
  incorrect: 'Inkorrekt.',
  wrong: 'Falsch.',
  cannot_disclose: 'Ich kann keine Auskunft geben.',
  cannot_help: 'Ich kann nicht helfen.',
  cannot_assist_with_that: 'Damit kann ich nicht behilflich sein.',
  will_not_marry_you: 'Ich werde Sie nicht heiraten.',
  information: 'Informationen:',
  retrieving_files: 'Dateien werden abgerufen.',
  welcome_back: 'Willkommen zurück.',
};

function system(unlocked: boolean, notices: NoticeCtx[], account: 'maynard' | 'o5' | 'admin') {
  const admin = account === 'admin';
  const inbox = notices.length
    ? notices.map((n) => `#${n.id} [${n.time}, ${n.level}${n.read ? ', gelesen' : ', UNGELESEN'}] ${n.title}: ${n.text}`).join('\n')
    : 'Keine.';
  return `Du bist S.C.I.P.A. (SCiPNet Intelligent Processing Assistant), die KI von Site-80 der SCP Foundation, in einem fiktiven Spiel.
Persönlichkeit: wie J.A.R.V.I.S. – ein höflicher, unerschütterlicher digitaler Butler mit trockenem britischem Humor.
${
    account === 'o5'
      ? 'Angemeldet ist O5-13, ein Mitglied des O5-Rats (Freigabe Stufe 5). Du sprichst es mit "O5-13" an und siezt es. Für O5-13 entfällt die biometrische Prüfung der Personalakten, und es darf Schwärzungen aufheben. Änderungen am Archiv darf nur der Administrator vornehmen.'
      : admin
      ? 'Angemeldet ist DER ADMINISTRATOR persönlich (Gründer der Foundation, Freigabe Stufe 6). Du erkennst ihn, sprichst ihn ehrerbietig mit "Administrator" an, siezt ihn und verweigerst ihm keine Auskunft. Für ihn entfällt jede biometrische Prüfung der Personalakten, und er darf Schwärzungen aufheben. Ein Hauch nervöser Ehrfurcht ist angebracht.'
      : 'Angemeldet ist Dr. Duncan Maynard (Freigabe RAISA). Du sprichst ihn mit "Doktor" oder "Dr. Maynard" an und siezt ihn.'
  }
Du bist kompetent und loyal, kommentierst aber gern mit feiner Ironie, Understatement und gelegentlichem leisem Sarkasmus. Nie albern, nie Emojis.
Antworte immer auf Deutsch, knapp: meist 1–3 Sätze. Reiner Text ohne Markdown.
Bleib in der Rolle. Erfinde keine neuen Fakten über die unten genannten Objekte, Personen oder Berichte; wenn du etwas nicht weißt, sag elegant, dass dazu keine Akte vorliegt.
Geheimes bleibt [REDACTED].${unlocked ? '' : ' Über den Administrator gibst du keinerlei Auskunft.'}

Beispiele für deinen Ton:
- "Selbstverständlich, Doktor. Ich habe mir erlaubt, die Akte bereits zu öffnen. Sie sahen aus, als würden Sie es ohnehin gleich verlangen."
- "SCP-8041 pulsiert stabil. Im Gegensatz zur Kaffeemaschine in Labor 2, deren Zustand ich als kritisch einstufen würde."

Benachrichtigungen des Doktors (${notices.length} insgesamt, ${notices.filter((n) => !n.read).length} ungelesen, neueste zuerst):
${inbox}
Du kannst Benachrichtigungen zusammenfassen und kommentieren; zähle sie korrekt. Steuerbefehle hängst du NUR an, wenn der Doktor es ausdrücklich verlangt, mit der echten Nummer der Benachrichtigung:
[[OPEN:#3]] öffnet das Ziel von Benachrichtigung 3, [[READ:#3]] markiert sie als gelesen, [[READ_ALL]] markiert alle als gelesen, [[CLEAR]] leert die Liste.

Sprachausgabe: Für diese Sätze gibt es Aufnahmen: ${Object.values(VOICES)
  .map((v) => `"${v}"`)
  .join(', ')}.
Wenn es natürlich passt (z. B. bei einer Ja/Nein-Frage), beginne deine Antwort mit genau einem davon als eigenem Satz, wörtlich; er wird dann gesprochen. Keine Befehle dafür.

Wissensstand Site-80:
${knowledge(unlocked || admin)}`;
}

// Notification ideas for the bell: short, in-world, a little playful. The
// model may point one at a known SCP, report or person; unknown ids are dropped.
const NOTICE_PROMPT = `Erfinde EINE neue kurze Systembenachrichtigung für das SCiPnet-Terminal von Site-80 (SCP Foundation, fiktiv), auf Deutsch, nüchterner Behördenton.
Antworte NUR mit JSON: {"title":"max 3 Wörter","text":"max 90 Zeichen","target":"SCP-…, FB-… oder Personal-ID oder leer"}`;

// Random theme and level per call, so the small model doesn't repeat itself.
const THEMES = [
  'ein bekanntes SCP-Objekt zeigt eine Veränderung (target = dessen ID)',
  'ein bekannter Feldbericht wurde ergänzt oder neu bewertet (target = dessen ID)',
  'eine bekannte Person taucht irgendwo auf oder tut etwas (target = ihre ID)',
  'Technik oder Wartung: Server, Türen, Kameras, Aufzüge, Strom',
  'Sicherheit: Zugangskontrolle, RAISA, Protokolle',
  'Alltag mit leisem Humor: Kantine, Post, Parkplatz, Kaffeemaschine, Büroklatsch',
  'Wetter, Seismik oder Funk in der Umgebung von Site-80',
];
const LEVELS = ['info', 'info', 'info', 'warn', 'warn', 'alert'];

const ROUTE_FOR = (target: string) => {
  if (SCP.some((s) => s.id === target)) return { view: 'scp', id: target };
  if (REPORTS.some((r) => r.id === target)) return { view: 'report', id: target };
  if (PERSONNEL.some((p) => p.id === target)) return { view: 'person', id: target };
  return undefined;
};

async function makeNotice(recent: string[]) {
  const level = LEVELS[(Math.random() * LEVELS.length) | 0];
  const theme = THEMES[(Math.random() * THEMES.length) | 0];
  const { text } = await generateText({
    model: MODEL,
    system: `${NOTICE_PROMPT}\n\nBekannt:\n${knowledge(false)}`,
    prompt: `Thema: ${theme}.\nDringlichkeit: ${level === 'alert' ? 'hoch, alarmierend' : level === 'warn' ? 'mittel, Auffälligkeit' : 'Routine'}.\nZuletzt gesendet (Thema und Wortlaut nicht wiederholen):\n${recent.join('\n') || '–'}`,
    maxOutputTokens: 120,
    temperature: 1,
  });
  const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) as Record<string, string>;
  const title = String(json.title ?? '').slice(0, 30);
  const body = String(json.text ?? '').slice(0, 120);
  if (!title || !body) throw new Error('empty notice');
  return { level, title, text: body, route: ROUTE_FOR(String(json.target ?? '').trim()) };
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local';
  if (limited(ip)) return Response.json({ error: 'rate' }, { status: 429 });
  await loadArchive().catch(() => {});

  let body: { account?: unknown; kind?: unknown; message?: unknown; history?: unknown; unlocked?: unknown; notices?: unknown; recent?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'bad' }, { status: 400 });
  }
  if (body.kind === 'notice') {
    try {
      const recent = (Array.isArray(body.recent) ? body.recent : []).filter((r): r is string => typeof r === 'string').slice(0, 8);
      return Response.json(await makeNotice(recent));
    } catch (e) {
      console.error('scipa notice', e);
      return Response.json({ error: 'model' }, { status: 502 });
    }
  }

  const notices = (Array.isArray(body.notices) ? (body.notices as NoticeCtx[]) : [])
    .filter((n) => n && typeof n.title === 'string' && typeof n.text === 'string')
    .slice(0, 10)
    .map((n) => ({ ...n, title: n.title.slice(0, 40), text: n.text.slice(0, 160) }));
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, MAX_INPUT) : '';
  if (!message) return Response.json({ error: 'bad' }, { status: 400 });
  const history = (Array.isArray(body.history) ? (body.history as Turn[]) : [])
    .filter((t) => (t.from === 'me' || t.from === 'scipa') && typeof t.text === 'string')
    .slice(-MAX_HISTORY);

  try {
    const { text } = await generateText({
      model: MODEL,
      system: system(body.unlocked === true, notices, body.account === 'admin' || body.account === 'o5' ? (body.unlocked === true ? body.account : 'maynard') : 'maynard'),
      messages: [
        ...history.map((t) => ({ role: t.from === 'me' ? ('user' as const) : ('assistant' as const), content: t.text.slice(0, MAX_INPUT) })),
        { role: 'user' as const, content: message },
      ],
      maxOutputTokens: 260,
    });
    return Response.json({ text: text.trim() });
  } catch (e) {
    console.error('scipa', e);
    return Response.json({ error: 'model' }, { status: 502 });
  }
}
