import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Dropdown, { optLabel, optValue, type Opt } from './Dropdown';
import { askConfirm, setLeaveGuard } from './Confirm';
import { CONTAINMENT, SECONDARY, ESOTERIC, type AcsClass } from '../data/acsClasses';
import { AnimatePresence, motion } from 'motion/react';
import { AcsIcon } from './Acs';
import { DISRUPTION, RISK, SCP } from '../data/scp';
import { PERSONNEL } from '../data/personnel';
import { REPORTS, TEMPLATES, type ReportTemplate } from '../data/reports';
import { MTFS } from '../data/mtf';
import { insigniaUrl, photoUrl, reportImageUrl } from '../data/photos';
import { cachedAccounts, deleteEntry, listAccounts, references, saveEntry, uploadImage, type Kind, type Kinds } from '../data/store';
import { useAccount } from './session';
import type { Go, Route } from './routes';

// The Administrator's editor: one form per entry type, built from the field
// lists below. Fields the form doesn't know (e.g. an SCP's lock) are kept as
// they are. Text fields accept [[...]] for redacted passages, as everywhere.

type Field =
  | { k: string; label: string; t: 'text' | 'area' | 'date' | 'number'; req?: boolean; hint?: string }
  | { k: string; label: string; t: 'select'; options: () => Opt[]; empty?: string; apply?: (entry: Obj, v: string) => Obj; hint?: string }
  | { k: string; label: string; t: 'paras' | 'tags' | 'check' | 'classes'; hint?: string }
  | { k: string; label: string; t: 'multi'; options: () => Opt[] }
  | { k: string; label: string; t: 'accounts'; hint?: string }
  | { k: string; label: string; t: 'slider'; hint?: string }
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
      { k: 'acs.secondary', label: 'Sekundärklasse', t: 'classes' },
      { k: 'acs.disruption', label: 'Störungsklasse', t: 'select', options: () => DISRUPTION },
      { k: 'acs.risk', label: 'Risikoklasse', t: 'select', options: () => RISK },
      { k: 'acs.status', label: 'Status', t: 'text' },
      { k: 'acs.subclass', label: 'Unterklasse', t: 'text' },
      { k: 'clearance', label: 'Freigabe', t: 'select', options: () => LEVELS },
      { k: 'mtf', label: 'Zugewiesene Mobile Task Forces', t: 'multi', options: units },
      { k: 'antimemetic', label: 'Antimemetisch', t: 'check', hint: 'Beschreibung verblasst' },
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
      ...ACCESS(false),
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
          { k: 'value', label: 'Prozent', t: 'slider' },
        ],
      },
      { k: 'psych.text', label: 'Psychologische Einschätzung', t: 'paras' },
      { k: 'incidents', label: 'Vorfälle', t: 'paras', hint: '„Keine …“ zählt nicht als Vorfall.' },
      ...ACCESS(true),
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
      {
        k: 'template',
        label: 'Vorlage',
        t: 'select',
        empty: 'Keine',
        options: () => Object.entries(TEMPLATES).map(([k, t]): Opt => [k, t.label]),
        apply: applyTemplate,
        hint: 'Fügt die Eckdaten und Abschnitte der Vorlage hinzu. Nichts wird gelöscht.',
      },
      { k: 'id', label: 'Kennung', t: 'text', req: true, hint: 'z. B. FB-80-2026-040' },
      { k: 'title', label: 'Titel', t: 'text', req: true },
      { k: 'date', label: 'Datum', t: 'date' },
      { k: 'author', label: 'Verfasst von', t: 'select', options: people },
      { k: 'location', label: 'Einsatzort', t: 'text' },
      {
        k: 'classification',
        label: 'Freigabe',
        t: 'select',
        options: () => [
          ['Uneingeschränkt', 'Level 1 · Uneingeschränkt'],
          ['Eingeschränkt', 'Level 2 · Eingeschränkt'],
          ['Vertraulich', 'Level 3 · Vertraulich'],
          ['Geheim', 'Level 4 · Geheim'],
          ['Streng geheim', 'Level 5 · Streng geheim'],
        ],
      },
      { k: 'status', label: 'Status', t: 'select', options: () => ['Offen', 'Abgeschlossen'] },
      { k: 'summary', label: 'Zusammenfassung', t: 'area', req: true },
      {
        k: 'facts',
        label: 'Eckdaten',
        t: 'rows',
        blank: { label: '', value: '' },
        fields: [
          { k: 'label', label: 'Bezeichnung', t: 'text' },
          { k: 'value', label: 'Wert', t: 'text' },
        ],
      },
      { k: 'objects', label: 'Betroffene Objekte', t: 'multi', options: () => SCP.map((s): Opt => [s.id, `${s.id} · ${s.name}`]) },
      { k: 'units', label: 'Beteiligte Mobile Task Forces', t: 'multi', options: units },
      { k: 'situation', label: 'Ausgangslage', t: 'paras' },
      {
        k: 'sections',
        label: 'Weitere Abschnitte',
        t: 'rows',
        blank: { title: '', body: [] },
        fields: [
          { k: 'title', label: 'Überschrift', t: 'text' },
          { k: 'body', label: 'Text', t: 'paras' },
        ],
      },
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
      ...ACCESS(false),
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
      {
        k: 'readiness',
        label: 'Bereitschaft',
        t: 'slider',
        hint: 'Wie schnell und vollständig die Einheit einsetzbar ist: Personal, Ausrüstung und Erholung nach dem letzten Einsatz. Erscheint als Anzeige in der Akte und auf der Karte.',
      },
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
      ...ACCESS(true),
    ],
  },
};

// Access, the same for every kind: open (by clearance), corrupted, closed or
// for chosen accounts. Personnel and task forces get their own access level;
// SCPs and reports use their clearance and classification.
function ACCESS(level: boolean): Field[] {
  return [
    {
      k: 'access.mode',
      label: 'Zugriff',
      t: 'select',
      empty: 'Offen (nach Freigabe)',
      options: () => [
        ['corrupt', 'Korrumpiert (wirft Leser hinaus)'],
        ['closed', 'Verschlossen (nur Ersteller)'],
        ['readers', 'Ausgewählte Konten'],
      ],
    },
    ...(level
      ? [{ k: 'access.level', label: 'Zugriffsfreigabe', t: 'select', empty: 'Keine', options: () => [1, 2, 3, 4, 5].map((n): Opt => [String(n), `Level ${n}`]) } as Field]
      : []),
    { k: 'access.readers', label: 'Ausgewählte Konten', t: 'accounts', hint: 'Nur bei „Ausgewählte Konten“. Der Ersteller sieht die Akte immer.' },
  ];
}

// Adds a template's key data and sections that are not there yet.
function applyTemplate(entry: Obj, v: string): Obj {
  const t = TEMPLATES[v as ReportTemplate];
  if (!t) return entry;
  const facts = [...((entry.facts as { label: string }[]) ?? [])];
  for (const label of t.facts) if (!facts.some((f) => f.label === label)) facts.push({ label });
  const sections = [...((entry.sections as { title: string }[]) ?? [])];
  for (const title of t.sections) if (!sections.some((s) => s.title === title)) sections.push({ title, body: [] } as never);
  return { ...entry, ...(facts.length ? { facts } : {}), ...(sections.length ? { sections } : {}) };
}

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
  const fileRef = useRef<HTMLInputElement>(null);
  switch (f.t) {
    case 'text':
      // one line of text that wraps instead of scrolling sideways; Enter adds no line break
      return (
        <AutoArea
          required={f.req}
          value={(value as string) ?? ''}
          onChange={onChange}
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          oneLine
        />
      );
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
    case 'slider': {
      const v = Number(value ?? 0);
      return (
        <span className="ed-slider" style={{ '--v': `${v}%` } as React.CSSProperties}>
          <input type="range" min={0} max={100} step={1} value={v} onChange={(e) => onChange(Number(e.target.value))} />
          <strong>{v}%</strong>
        </span>
      );
    }
    case 'area':
      return <AutoArea required={f.req} value={(value as string) ?? ''} onChange={onChange} />;
    case 'paras':
      return <ParasInput value={(value as string[]) ?? []} onChange={onChange} />;
    case 'tags':
      return <TagsInput value={(value as string[]) ?? []} onChange={onChange} />;
    case 'accounts':
      return <AccountsInput value={(value as string[]) ?? []} onChange={onChange} />;
    case 'classes':
      return <ClassPicker value={(value as string) ?? ''} onChange={onChange} />;
    case 'check':
      return (
        <button type="button" role="switch" aria-checked={!!value} className={`search ed-toggle${value ? ' on' : ''}`} onClick={() => onChange(!value)}>
          <span className="ed-switch" aria-hidden />
          {value ? 'Ja' : 'Nein'}
          {'hint' in f && f.hint && <span className="dim small">{f.hint}</span>}
        </button>
      );
    case 'select':
      return <Dropdown value={(value as string) ?? ''} options={f.options()} empty={f.empty} onChange={onChange} />;
    case 'multi': {
      // a single id (older entries) counts as a list of one
      const picked = Array.isArray(value) ? (value as string[]) : value ? [value as string] : [];
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
          {/* a real button opens the hidden file input, so only the button itself does */}
          <button type="button" className="card action" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? 'LÄDT…' : 'HOCHLADEN'}
          </button>
          <input
              ref={fileRef}
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
                e.target.value = '';
              }}
            />
          {!!value && (
            <button type="button" className="card action ghost" onClick={() => onChange('')}>
              ENTFERNEN
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
                <div key={sub.k} className={`ed-field t-${sub.t}`}>
                  <span className="label">{sub.label}</span>
                  <Input f={sub} value={get(r, sub.k)} onChange={(v) => put(i, set(r, sub.k, v))} />
                </div>
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

// Secondary classes are too many for a list: a button opens a window with
// every class icon; hovering one shows its explanation.
function ClassPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<AcsClass | null>(null);
  const current = [...SECONDARY, ...ESOTERIC].find((c) => c.name === value);
  const shown = hover ?? current;
  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };
  const tile = (c: AcsClass) => (
    <button
      key={c.name}
      type="button"
      className={`cp-tile sec-${c.name}${c.name === value ? ' on' : ''}`}
      onPointerEnter={() => setHover(c)}
      onFocus={() => setHover(c)}
      onClick={() => pick(c.name)}
    >
      <AcsIcon name={c.name} />
      <span>{c.name}</span>
    </button>
  );
  return (
    <>
      <button type="button" className="search dd-btn cp-btn" onClick={() => setOpen(true)}>
        {current ? (
          <span className={`cp-current sec-${current.name}`}>
            <AcsIcon name={current.name} /> {current.name}
          </span>
        ) : (
          <span className="dim">Keine</span>
        )}
        <span className="dim small">Auswählen…</span>
      </button>
      {createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            className="admin-login-back"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onPointerDown={(e) => e.target === e.currentTarget && setOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          >
            <motion.div className="box cp" role="dialog" aria-label="Sekundärklasse wählen" initial={{ y: 12 }} animate={{ y: 0 }} exit={{ y: 12 }}>
              <div className="cp-head">
                <h2>Sekundärklasse</h2>
                <button type="button" className="card action ghost" onClick={() => pick('')}>
                  KEINE
                </button>
              </div>
              <div className="cp-scroll">
                <div className="label">Offizielle Klassen</div>
                <div className="cp-grid">{SECONDARY.map(tile)}</div>
                <div className="label">Esoterische Klassen</div>
                <div className="cp-grid">{ESOTERIC.map(tile)}</div>
              </div>
              <div className="cp-info">
                {shown ? (
                  <>
                    <strong>{shown.name}</strong> <span className="dim">{shown.info}</span>
                  </>
                ) : (
                  <span className="dim">Mit dem Mauszeiger über eine Klasse fahren, um ihre Bedeutung zu sehen.</span>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      // outside the field's <label>, so a click on the backdrop doesn't reopen it
      document.querySelector('.shell') ?? document.body,
      )}
    </>
  );
}

// Supabase accounts to share a closed entry with, by name.
function AccountsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [list, setList] = useState(cachedAccounts);
  useEffect(() => {
    void listAccounts().then(setList);
  }, []);
  if (!list.length) return <span className="dim small">Keine Konten verfügbar (supabase/003_access.sql ausgeführt?).</span>;
  return (
    <div className="chips ed-multi">
      {list.map((a) => (
        <button
          key={a.id}
          type="button"
          className={value.includes(a.id) ? 'chip active' : 'chip'}
          onClick={() => onChange(value.includes(a.id) ? value.filter((v) => v !== a.id) : [...value, a.id])}
        >
          {a.name}
        </button>
      ))}
    </div>
  );
}

// Kept as typed text while editing, so blank lines and commas don't vanish
// under the cursor.
function ParasInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(() => value.join('\n\n'));
  return (
    <AutoArea
      value={text}
      onChange={(v) => {
        setText(v);
        onChange(fromParas(v));
      }}
    />
  );
}

// A text field that grows with its text, so nothing hides behind a scroll bar.
function AutoArea({
  value,
  onChange,
  oneLine,
  ...rest
}: { value: string; onChange: (v: string) => void; oneLine?: boolean } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  };
  useEffect(fit, [value]);
  // the width settles after fonts and the page animation; measure again then
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let w = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth !== w) {
        w = el.clientWidth;
        fit();
      }
    });
    ro.observe(el);
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, []);
  return (
    <textarea
      ref={ref}
      className={`search ed-auto${oneLine ? ' one-line' : ''}`}
      rows={oneLine ? 1 : 3}
      value={value}
      onChange={(e) => onChange(oneLine ? e.target.value.replace(/\n/g, ' ') : e.target.value)}
      {...rest}
    />
  );
}
function TagsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(() => value.join(', '));
  return (
    <AutoArea
      oneLine
      value={text}
      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
      onChange={(v) => {
        setText(v);
        onChange(
          v
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
            <div key={f.k} className={`ed-field t-${f.t}`}>
              <span className="label">
                {f.label}
                {'req' in f && f.req ? ' *' : ''}
              </span>
              <Input
                f={f}
                value={get(entry, f.k)}
                onChange={(v) => setEntry((o) => ('apply' in f && f.apply ? f.apply(set(o, f.k, v), v as string) : set(o, f.k, v)))}
              />
              {'hint' in f && f.hint && f.t !== 'check' && <span className="dim small">{f.hint}</span>}
            </div>
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
