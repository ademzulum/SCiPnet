// S.C.I.P.A.'s free-form answers: a Vercel Function that asks a model through
// the Vercel AI Gateway. The client only calls it when no scripted intent
// matched. Authentication is Vercel OIDC (no API key in the repo). The model
// can be changed with AI_GATEWAY_MODEL. Imports need .js: the function runs as plain Node ESM.
import { generateText } from 'ai';
import { SCP } from '../src/data/scp.js';
import { ADMIN_PERSON, PERSONNEL } from '../src/data/personnel.js';
import { REPORTS } from '../src/data/reports.js';

const MODEL = process.env.AI_GATEWAY_MODEL ?? 'anthropic/claude-haiku-5.5';
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
  const people = [...PERSONNEL, ...(unlocked ? [ADMIN_PERSON] : [])].map(
    (p) => `${p.name} (${p.id}), ${p.role}, ${p.department}, ${p.clearance}, Status ${p.status}: ${strip(p.summary)}`,
  );
  const reports = REPORTS.map((r) => `${r.id} "${r.title}" (${r.date}, ${r.status}): ${strip(r.summary)}`);
  return [`SCP-Objekte:\n${scp.join('\n')}`, `Personal:\n${people.join('\n')}`, `Feldberichte:\n${reports.join('\n')}`].join('\n\n');
}

function system(unlocked: boolean) {
  return `Du bist S.C.I.P.A. (SCiPNet Intelligent Processing Assistant), die KI des Terminals von Site-80 der SCP Foundation, in einem fiktiven Spiel.
Du sprichst mit Dr. Duncan Maynard (Freigabe RAISA). Antworte immer auf Deutsch, sachlich, knapp und etwas trocken-ironisch, höchstens 3 Sätze.
Bleib in der Rolle. Erfinde keine neuen Fakten über die unten genannten Objekte, Personen oder Berichte; wenn du etwas nicht weißt, sag, dass dazu keine Akte vorliegt.
Geheimes bleibt [REDACTED].${unlocked ? '' : ' Über den Administrator gibst du keinerlei Auskunft.'}
Antworte als reiner Text ohne Markdown.

Wissensstand Site-80:
${knowledge(unlocked)}`;
}

type Turn = { from: 'me' | 'scipa'; text: string };

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local';
  if (limited(ip)) return Response.json({ error: 'rate' }, { status: 429 });

  let body: { message?: unknown; history?: unknown; unlocked?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'bad' }, { status: 400 });
  }
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, MAX_INPUT) : '';
  if (!message) return Response.json({ error: 'bad' }, { status: 400 });
  const history = (Array.isArray(body.history) ? (body.history as Turn[]) : [])
    .filter((t) => (t.from === 'me' || t.from === 'scipa') && typeof t.text === 'string')
    .slice(-MAX_HISTORY);

  try {
    const { text } = await generateText({
      model: MODEL,
      system: system(body.unlocked === true),
      messages: [
        ...history.map((t) => ({ role: t.from === 'me' ? ('user' as const) : ('assistant' as const), content: t.text.slice(0, MAX_INPUT) })),
        { role: 'user' as const, content: message },
      ],
      maxOutputTokens: 220,
    });
    return Response.json({ text: text.trim() });
  } catch (e) {
    console.error('scipa', e);
    return Response.json({ error: 'model' }, { status: 502 });
  }
}
