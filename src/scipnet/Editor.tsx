import { useEffect, useRef, useState } from 'react';
import Dropdown, { optLabel, optValue, type Opt } from './Dropdown';
import { askConfirm, setLeaveGuard } from './Confirm';
import { CONTAINMENT, SECONDARY, ESOTERIC } from '../data/acsClasses';
import { DISRUPTION, RISK, SCP } from '../data/scp';
import { PERSONNEL } from '../data/personnel';
import { REPORTS } from '../data/reports';
import { MTFS } from '../data/mtf';
import { insigniaUrl, photoUrl, reportImageUrl } from '../data/photos';
import { deleteEntry, references, saveEntry, uploadImage, type Kind, type Kinds } from '../data/store';
import { useAccount } from './session';
import type { Go, Route } from './routes';

// The Administrator's editor: one form per entry type, built from the field
// lists below. Fields the form doesn't know (e.g. an SCP's lock) are kept as
// they are. Text fields accept [[...]] for redacted passages, as everywhere.

type Field =
  | { k: string; label: string; t: 'text' | 'area' | 'date' | 'number'; req?: boolean; hint?: string }
  | { k: string; label: string; t: 'select'; options: () => Opt[]; empty?: string }
  | { k: string; label: string; t: 'paras' | 'tags' | 'check'; hint?: string }
  | { k: string; label: string; t: 'multi'; options: () => Opt[] }
  | { k: string; label: string; t: 'image'; folder: 'personnel' | 'reports' | 'mtf'; preview: (v?: string) => string | undefined }
  | { k: string; label: string; t: 'rows'; fields: Field[]; blank: Record<string, unknown> };

const LEVELS = ['Stufe 1', 'Stufe 2', 'Stufe 3', 'Stufe 4', 'Stufe 5'];
const TONES: Opt[] = [
  ['ok', 'Unauffällig'],
  ['warn', 'Auffällig'],
  ['bad', 'Kritisch'],
];
// pick lists show who or what an id stands for
const people = () => PERSONNEL.map((p): Opt => [p.id, `${p.name} · ${p.id}`]);
const units = () => MTFS.map((m): Opt => [m.id, `MTF ${m.code} „${m.nickname}“`]);
const reports = () => REPORTS.map((r): Opt => [r.id, `${r.id} · ${r.title}`]);
const secondary = () => [...SECONDARY, ...ESOTERIC].map((c) => c.name);

const FIELDS: { [K in Kind]?: { title: string; fields: Field[]; blank: () => Kinds[K] } } = {
  scp: {
    title: 'SCP-Objekt',
    blank: () => ({
      id: '',
      name: '',
      objectClass: 'Pending',
      clearance: 'Stufe 2',
      summary: '',
      containment: [],
      description: [],
      acs: { disruption: 'Dark', risk: 'Notice', status: 'Eingedämmt' },
      addenda: [],
    }),
    fields: [
      { k: 'id', label: 'Kennung', t: 'text', req: true, hint: 'z. B. SCP-8050' },
      { k: 'name', label: 'Name', t: 'text', req: true },
      { k: 'objectClass', label: 'Eindämmungsklasse', t: 'select', options: () => CONTAINMENT.map((c) => c.name) },
      { k: 'acs.secondary', label: 'Sekundärklasse', t: 'select', options: secondary, empty: 'Keine' },
      { k: 'acs.disruption', label: 'Störungsklasse', t: 'select', options: () => DISRUPTION },
      { k: 'acs.risk', label: 'Risikoklasse', t: 'select', options: () => RISK },
      { k: 'acs.status', label: 'Status', t: 'text' },
      { k: 'acs.subclass', label: 'Unterklasse', t: 'text' },
      { k: 'clearance', label: 'Freigabe', t: 'select', options: () => LEVELS },
      { k: 'mtf', label: 'Zugewiesene Mobile Task Force', t: 'select', options: units, empty: 'Keine' },
      { k: 'antimemetic', label: 'Antimemetisch (Beschreibung verblasst)', t: 'check' },
      { k: 'warning', label: 'Warnhinweis', t: 'text' },
      { k: 'summary', label: 'Kurzbeschreibung', t: 'area', req: true },
      { k: 'containment', label: 'Sicherheitsmaßnahmen', t: 'paras' },
      { k: 'description', label: 'Beschreibung', t: 'paras' },
      {
        k: 'addenda',
        label: 'Addenda',
        t: 'rows',
        blank: { kind: 'note', title: '', body: [] },
        fields: [
          { k: 'kind', label: 'Art', t: 'select', options: () => [
              ['recovery', 'Bergung'],
              ['test', 'Testprotokoll'],
              ['interview', 'Befragung'],
              ['incident', 'Vorfall'],
              ['note', 'Vermerk'],
            ] },
          { k: 'title', label: 'Titel', t: 'text' },
          { k: 'body', label: 'Text', t: 'paras', hint: 'Im Protokoll eine Zeile je Aussage: „Name: Text“, Regieanweisung in <…>.' },
          { k: 'sign', label: 'Unterzeichnet', t: 'text' },
        ],
      },
      { k: 'reports', label: 'Feldberichte', t: 'multi', options: reports },
    ],
  },
  personnel: {
    title: 'Personalakte',
    blank: () => ({
      id: '',
      name: '',
      role: '',
      department: '',
      clearance: 'Stufe 2',
      status: 'Aktiv',
      since: String(new Date().getFullYear()),
      summary: '',
      notes: [],
      timeline: [],
      psych: { access: 'granted', text: [] },
      incidents: [],
    }),
    fields: [
      { k: 'id', label: 'Kennung', t: 'text', req: true, hint: 'z. B. P-80-0420' },
      { k: 'name', label: 'Name', t: 'text', req: true },
      { k: 'role', label: 'Funktion', t: 'text' },
      { k: 'department', label: 'Abteilung', t: 'text' },
      { k: 'clearance', label: 'Freigabe', t: 'select', options: () => [...LEVELS, 'RAISA', 'Extern'] },
      { k: 'status', label: 'Status', t: 'select', options: () => ['Aktiv', 'Beurlaubt', 'Beobachtung', 'Vermisst'] },
      { k: 'since', label: 'Im Dienst seit', t: 'text' },
      { k: 'photo', label: 'Foto', t: 'image', folder: 'personnel', preview: photoUrl },
      { k: 'quote', label: 'Zitat', t: 'text' },
      { k: 'summary', label: 'Zusammenfassung', t: 'area', req: true },
      { k: 'notes', label: 'Vermerke', t: 'paras' },
      {
        k: 'timeline',
        label: 'Werdegang',
        t: 'rows',
        blank: { year: '', text: '' },
        fields: [
          { k: 'year', label: 'Jahr', t: 'text' },
          { k: 'text', label: 'Station', t: 'text' },
        ],
      },
      { k: 'psych.access', label: 'Psychologisches Profil', t: 'select', options: () => [['granted', 'Freigegeben'], ['denied', 'Gesperrt']] },
      { k: 'psych.required', label: 'Erforderliche Freigabe (wenn gesperrt)', t: 'select', options: () => LEVELS, empty: 'Keine' },
      { k: 'psych.verdict.label', label: 'Gesamtbeurteilung', t: 'text' },
      { k: 'psych.verdict.tone', label: 'Einstufung der Beurteilung', t: 'select', options: () => TONES },
      { k: 'psych.date', label: 'Datum der Beurteilung', t: 'date' },
      {
        k: 'psych.metrics',
        label: 'Messwerte (0–100)',
        t: 'rows',
        blank: { label: '', value: 50 },
        fields: [
          { k: 'label', label: 'Wert', t: 'text' },
          { k: 'value', label: 'Prozent', t: 'number' },
        ],
      },
      { k: 'psych.text', label: 'Psychologische Einschätzung', t: 'paras' },
      { k: 'incidents', label: 'Vorfälle', t: 'paras', hint: '„Keine …“ zählt nicht als Vorfall.' },
    ],
  },
  report: {
    title: 'Feldbericht',
    blank: () => ({
      id: '',
      title: '',
      date: new Date().toISOString().slice(0, 10),
      author: PERSONNEL[0]?.id ?? '',
      location: '',
      classification: 'Vertraulich',
      status: 'Offen',
      summary: '',
      situation: [],
      assessment: [],
    }),
    fields: [
      { k: 'id', label: 'Kennung', t: 'text', req: true, hint: 'z. B. FB-80-2026-040' },
      { k: 'title', label: 'Titel', t: 'text', req: true },
      { k: 'date', label: 'Datum', t: 'date' },
      { k: 'author', label: 'Verfasst von', t: 'select', options: people },
      { k: 'location', label: 'Einsatzort', t: 'text' },
      { k: 'classification', label: 'Einstufung', t: 'select', options: () => ['Vertraulich', 'Geheim', 'Streng geheim'] },
      { k: 'status', label: 'Status', t: 'select', options: () => ['Offen', 'Abgeschlossen'] },
      { k: 'summary', label: 'Zusammenfassung', t: 'area', req: true },
      { k: 'situation', label: 'Ausgangslage', t: 'paras' },
      {
        k: 'timeline',
        label: 'Verlauf',
        t: 'rows',
        blank: { time: '', text: '' },
        fields: [
          { k: 'time', label: 'Zeit', t: 'text' },
          { k: 'text', label: 'Ereignis', t: 'text' },
        ],
      },
      { k: 'measures', label: 'Maßnahmen', t: 'paras' },
      { k: 'assessment', label: 'Bewertung und Empfehlung', t: 'paras' },
      {
        k: 'images',
        label: 'Bilder',
        t: 'rows',
        blank: { caption: '' },
        fields: [
          { k: 'src', label: 'Bild', t: 'image', folder: 'reports', preview: reportImageUrl },
          { k: 'caption', label: 'Bildunterschrift', t: 'text' },
        ],
      },
      { k: 'involved', label: 'Beteiligtes Personal', t: 'multi', options: people },
    ],
  },
  mtf: {
    title: 'Mobile Task Force',
    blank: () => ({
      id: '',
      code: '',
      nickname: '',
      motto: '',
      insignia: '',
      status: 'Einsatzbereit',
      base: '',
      strength: '',
      lead: '',
      mission: [],
      specialty: [],
      readiness: 80,
      log: [],
    }),
    fields: [
      { k: 'id', label: 'Kennung (URL)', t: 'text', req: true, hint: 'z. B. alpha-9' },
      { k: 'code', label: 'Bezeichnung', t: 'text', req: true, hint: 'z. B. Alpha-9' },
      { k: 'nickname', label: 'Name', t: 'text', req: true, hint: 'Englisch, z. B. Last Hope' },
      { k: 'motto', label: 'Leitsatz', t: 'text' },
      { k: 'insignia', label: 'Abzeichen', t: 'image', folder: 'mtf', preview: insigniaUrl },
      { k: 'status', label: 'Status', t: 'select', options: () => ['Einsatzbereit', 'Im Einsatz', 'Bereitschaft', 'Klassifiziert'] },
      { k: 'readiness', label: 'Bereitschaft (%)', t: 'number' },
      { k: 'base', label: 'Stationierung', t: 'text' },
      { k: 'strength', label: 'Stärke', t: 'text' },
      { k: 'lead', label: 'Führung', t: 'text' },
      { k: 'specialty', label: 'Spezialgebiete', t: 'tags', hint: 'Durch Komma getrennt' },
      { k: 'mission', label: 'Auftrag', t: 'paras' },
      {
        k: 'log',
        label: 'Einsatzprotokoll',
        t: 'rows',
        blank: { date: '', text: '', tone: 'ok' },
        fields: [
          { k: 'date', label: 'Datum', t: 'text' },
          { k: 'text', label: 'Eintrag', t: 'text' },
          { k: 'tone', label: 'Bewertung', t: 'select', options: () => TONES },
        ],
      },
    ],
  },
};

export const EDITABLE: Kind[] = ['scp', 'personnel', 'report', 'mtf'];
const LISTS: Partial<Record<Kind, { id: string }[]>> = { scp: SCP, personnel: PERSONNEL, report: REPORTS, mtf: MTFS };
// where an entry and its list are shown
const VIEW: Record<string, (id?: string) => Route> = {
  scp: (id) => (id ? { view: 'scp', id } : { view: 'scps' }),
  personnel: (id) => (id ? { view: 'person', id } : { view: 'personnel' }),
  report: (id) => (id ? { view: 'report', id } : { view: 'reports' }),
  mtf: (id) => (id ? { view: 'mtf', id } : { view: 'departments' }),
};

type Obj = Record<string, unknown>;
const get = (o: Obj, path: string): unknown => path.split('.').reduce<unknown>((v, k) => (v as Obj | undefined)?.[k], o);
// Sets a value along a dot path; empty values remove optional keys, and an
// object left empty by that is removed too.
function set(o: Obj, path: string, value: unknown): Obj {
  const [k, ...rest] = path.split('.');
  const next = { ...o };
  const v = rest.length ? set((o[k] as Obj) ?? {}, rest.join('.'), value) : value;
  const empty = v === '' || v === undefined || v === false || (Array.isArray(v) && !v.length) || (rest.length && !Object.keys(v as Obj).length);
  if (empty) delete next[k];
  else next[k] = v;
  return next;
}
// Arrays the types require stay present even when empty.
const REQUIRED_LISTS: Record<string, string[]> = {
  scp: ['containment', 'description', 'addenda'],
  personnel: ['notes', 'timeline', 'incidents', 'psych.text'],
  report: ['situation', 'assessment'],
  mtf: ['mission', 'specialty', 'log'],
};

// Paragraph lists are edited as one text, paragraphs separated by a blank line.
const fromParas = (s: string) =>
  s
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

function Input({ f, value, onChange }: { f: Field; value: unknown; onChange: (v: unknown) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  switch (f.t) {
    case 'text':
    case 'date':
      return <input className="search" type={f.t} required={f.req} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'number':
      return (
        <input
          className="search"
          type="number"
          min={0}
          max={100}
          value={(value as number) ?? 0}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        />
      );
    case 'area':
      return <textarea className="search" rows={3} required={f.req} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'paras':
      return <ParasInput value={(value as string[]) ?? []} onChange={onChange} />;
    case 'tags':
      return <TagsInput value={(value as string[]) ?? []} onChange={onChange} />;
    case 'check':
      return <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />;
    case 'select':
      return <Dropdown value={(value as string) ?? ''} options={f.options()} empty={f.empty} onChange={onChange} />;
    case 'multi': {
      const picked = (value as string[]) ?? [];
      return (
        <div className="chips ed-multi">
          {f.options().map((opt) => {
            const o = optValue(opt);
            return (
              <button
                key={o}
                type="button"
                className={picked.includes(o) ? 'chip active' : 'chip'}
                onClick={() => onChange(picked.includes(o) ? picked.filter((p) => p !== o) : [...picked, o])}
              >
                {optLabel(opt)}
              </button>
            );
          })}
        </div>
      );
    }
    case 'image': {
      const src = f.preview(value as string);
      return (
        <div className="ed-image">
          {src ? <img src={src} alt="" /> : <span className="dim small">Kein Bild</span>}
          <label className="card action">
            {busy ? 'LÄDT…' : 'HOCHLADEN'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                setErr(null);
                const r = await uploadImage(file, f.folder);
                setBusy(false);
                if (r.url) onChange(r.url);
                else setErr(r.error ?? null);
              }}
            />
          </label>
          {!!value && (
            <button type="button" className="link" onClick={() => onChange('')}>
              Entfernen
            </button>
          )}
          {err && <span className="ed-error small">{err}</span>}
        </div>
      );
    }
    case 'rows': {
      const rows = (value as Obj[]) ?? [];
      const put = (i: number, r: Obj) => onChange(rows.map((x, j) => (j === i ? r : x)));
      return (
        <div className="ed-rows">
          {rows.map((r, i) => (
            <div key={i} className="ed-row">
              {f.fields.map((sub) => (
                <label key={sub.k} className={`ed-field t-${sub.t}`}>
                  <span className="label">{sub.label}</span>
                  <Input f={sub} value={get(r, sub.k)} onChange={(v) => put(i, set(r, sub.k, v))} />
                </label>
              ))}
              <div className="ed-row-tools">
                <button type="button" className="link" disabled={!i} onClick={() => onChange(rows.map((x, j) => (j === i - 1 ? r : j === i ? rows[i - 1] : x)))}>
                  Nach oben
                </button>
                <button type="button" className="link" onClick={() => onChange(rows.filter((_, j) => j !== i))}>
                  Entfernen
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="card action ghost" onClick={() => onChange([...rows, { ...f.blank }])}>
            + HINZUFÜGEN
          </button>
        </div>
      );
    }
  }
}

// Kept as typed text while editing, so blank lines and commas don't vanish
// under the cursor.
function ParasInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(() => value.join('\n\n'));
  return (
    <textarea
      className="search"
      rows={Math.min(14, Math.max(3, text.split('\n').length + 1))}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(fromParas(e.target.value));
      }}
    />
  );
}
function TagsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(() => value.join(', '));
  return (
    <input
      className="search"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(
          e.target.value
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        );
      }}
    />
  );
}

export default function Editor({ kind, id, go }: { kind: Kind; id?: string; go: Go }) {
  const spec = FIELDS[kind];
  const editor = useAccount().editor;
  const existing = id ? LISTS[kind]?.find((e) => e.id === id) : undefined;
  const [entry, setEntry] = useState<Obj>(() => structuredClone((existing ?? spec?.blank()) as Obj));
  const [start] = useState(() => JSON.stringify(entry));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // unsaved changes: Shell asks before leaving, the browser before closing
  const dirty = useRef(false);
  dirty.current = JSON.stringify(entry) !== start;
  useEffect(() => {
    setLeaveGuard(() => dirty.current);
    const unload = (e: BeforeUnloadEvent) => dirty.current && e.preventDefault();
    window.addEventListener('beforeunload', unload);
    return () => {
      setLeaveGuard(null);
      window.removeEventListener('beforeunload', unload);
    };
  }, []);
  if (!spec || !editor) return <p className="page">Kein Zugriff.</p>;
  if (id && !existing) return <p className="page">Eintrag nicht gefunden.</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = { ...entry, id: String(entry.id ?? '').trim() };
    if (!/^[\w.-]{1,64}$/.test(clean.id)) return setError('Die Kennung darf nur Buchstaben, Ziffern, Punkt, Binde- und Unterstrich enthalten.');
    let out: Obj = clean;
    for (const k of REQUIRED_LISTS[kind] ?? []) if (get(out, k) === undefined) out = setPath(out, k, []);
    const ok = await askConfirm({
      title: id ? 'Änderungen speichern?' : 'Eintrag anlegen?',
      text: id ? `Die Änderungen an ${id} werden in die Datenbank übernommen.` : `${clean.id} wird neu in die Datenbank aufgenommen.`,
      yes: 'SPEICHERN',
    });
    if (!ok) return;
    setBusy(true);
    const err = await saveEntry(kind, out as never, id);
    setBusy(false);
    if (err) return setError(err);
    dirty.current = false;
    setLeaveGuard(null);
    go(VIEW[kind](clean.id));
  };
  const remove = async () => {
    const refs = references(kind, id!);
    const ok = await askConfirm({
      title: 'Eintrag löschen?',
      text:
        `${id} wird endgültig aus der Datenbank gelöscht. Das lässt sich nicht rückgängig machen.` +
        (refs.length ? ` Noch verknüpft mit: ${refs.join(', ')}. Diese Verweise zeigen danach [DATEN BESCHÄDIGT].` : ''),
      yes: 'ENDGÜLTIG LÖSCHEN',
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    const err = await deleteEntry(kind, id!);
    setBusy(false);
    if (err) return setError(err);
    setLeaveGuard(null);
    go(VIEW[kind]());
  };

  return (
    <div className="page page-top">
      <button className="link back" onClick={() => go(VIEW[kind](id))}>
        ← Abbrechen
      </button>
      <form className="box editor" onSubmit={submit}>
        <div className="editor-head">
          <div>
            <div className="label">Administrator · {id ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}</div>
            <h2>
              {spec.title}
              {id ? ` ${id}` : ''}
            </h2>
          </div>
          <span className="dim small">Geschwärzte Passagen in [[doppelte eckige Klammern]].</span>
        </div>
        <div className="ed-grid">
          {spec.fields.map((f) => (
            <label key={f.k} className={`ed-field t-${f.t}`}>
              <span className="label">
                {f.label}
                {'req' in f && f.req ? ' *' : ''}
              </span>
              <Input f={f} value={get(entry, f.k)} onChange={(v) => setEntry((o) => set(o, f.k, v))} />
              {'hint' in f && f.hint && <span className="dim small">{f.hint}</span>}
            </label>
          ))}
        </div>
        {error && <p className="ed-error">{error}</p>}
        <div className="editor-actions">
          {id && (
            <button type="button" className="card action danger" disabled={busy} onClick={remove}>
              LÖSCHEN
            </button>
          )}
          <button type="button" className="card action ghost" onClick={() => go(VIEW[kind](id))}>
            ABBRECHEN
          </button>
          <span className="editor-spacer" />
          <button type="submit" className="card action" disabled={busy}>
            {busy ? 'SPEICHERT…' : 'SPEICHERN'}
          </button>
        </div>
      </form>
    </div>
  );
}
// set() without the removal of empty values, for required lists
function setPath(o: Obj, path: string, value: unknown): Obj {
  const [k, ...rest] = path.split('.');
  return { ...o, [k]: rest.length ? setPath((o[k] as Obj) ?? {}, rest.join('.'), value) : value };
}

// "Neuer Eintrag" / "Bearbeiten" for the Administrator; nothing for anyone else.
export function EditButton({ kind, id, go, label }: { kind: Kind; id?: string; go: Go; label?: string }) {
  const editor = useAccount().editor;
  if (!editor) return null;
  return (
    <button className="card action edit-btn" onClick={() => go({ view: 'edit', kind, id })}>
      {label ?? (id ? 'BEARBEITEN' : '+ NEUER EINTRAG')}
    </button>
  );
}
