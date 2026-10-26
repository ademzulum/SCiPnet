import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Dropdown, { optLabel, optValue, type Opt } from './Dropdown';
import { askConfirm, setLeaveGuard } from './Confirm';
import { CONTAINMENT, SECONDARY, ESOTERIC, type AcsClass } from '../data/acsClasses';
import { AnimatePresence, Reorder, motion, useDragControls } from 'motion/react';
import { AcsIcon, CLEARANCE, classInfo } from './Acs';
import { LevelPill } from './Pips';
import { REPORT_LEVEL, levelOf } from '../data/access';
import { DISRUPTION, RISK, SCP } from '../data/scp';
import { PERSONNEL } from '../data/personnel';
import { REPORTS, TEMPLATES, factHint, sectionHint, type ReportTemplate } from '../data/reports';
import { MTFS } from '../data/mtf';
import { insigniaUrl, photoUrl, reportImageUrl } from '../data/photos';
import { cachedAccounts, deleteEntry, listAccounts, references, saveEntry, uploadImage, type Kind, type Kinds } from '../data/store';
import { useAccount } from './session';
import EntityPicker, { type PickWhat } from './EntityPicker';
import type { Go, Route } from './routes';

// The Administrator's editor: one form per entry type, built from the field
// lists below. Fields the form doesn't know (e.g. an SCP's lock) are kept as
// they are. Text fields accept [[...]] for redacted passages, as everywhere.

// `when` shows a field inside a row only when the row needs it
type Field = (
  | { k: string; label: string; t: 'text' | 'area' | 'date' | 'number'; req?: boolean; hint?: string; ph?: (row: Obj) => string | undefined }
  | { k: string; label: string; t: 'group'; hint?: string }
  | { k: string; label: string; t: 'select'; options: () => Opt[]; empty?: string; apply?: (entry: Obj, v: string) => Obj; hint?: string; level?: (v: string) => number }
  | { k: string; label: string; t: 'paras' | 'tags' | 'check'; hint?: string; ph?: (row: Obj) => string | undefined }
  | { k: string; label: string; t: 'classes'; set: ClassSet; hint?: string }
  | { k: string; label: string; t: 'multi'; options: () => Opt[]; hint?: string }
  | { k: string; label: string; t: 'accounts'; hint?: string }
  | { k: string; label: string; t: 'pick'; what: PickWhat; single?: boolean; hint?: string }
  | { k: string; label: string; t: 'slider'; hint?: string }
  | { k: string; label: string; t: 'image'; folder: 'personnel' | 'reports' | 'mtf'; preview: (v?: string) => string | undefined }
  | { k: string; label: string; t: 'rows'; fields: Field[]; blank: Record<string, unknown>; hint?: string; compact?: boolean }
  | { k: string; label: string; t: 'lines'; hint?: string }
  | { k: string; label: string; t: 'addenda'; hint?: string }
) & { when?: (row: Obj) => boolean };

const LEVELS = ['Stufe 1', 'Stufe 2', 'Stufe 3', 'Stufe 4', 'Stufe 5'];
const TONES: Opt[] = [
  ['ok', 'Unauffällig'],
  ['warn', 'Auffällig'],
  ['bad', 'Kritisch'],
];
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
      { k: 'objectClass', label: 'Eindämmungsklasse', t: 'classes', set: 'containment' },
      { k: 'acs.secondary', label: 'Sekundärklasse', t: 'classes', set: 'secondary' },
      { k: 'acs.disruption', label: 'Störungsklasse', t: 'classes', set: 'disruption' },
      { k: 'acs.risk', label: 'Risikoklasse', t: 'classes', set: 'risk' },
      { k: 'acs.status', label: 'Status', t: 'text' },
      { k: 'acs.subclass', label: 'Subklasse', t: 'text' },
      { k: 'clearance', label: 'Freigabe', t: 'select', options: () => LEVELS, level: levelOf },
      { k: 'mtf', label: 'Zugewiesene Mobile Task Forces', t: 'pick', what: 'mtf' },
      { k: 'antimemetic', label: 'Antimemetisch', t: 'check', hint: 'Beschreibung verblasst' },
      { k: 'warning', label: 'Warnhinweis', t: 'text' },
      { k: 'summary', label: 'Kurzbeschreibung', t: 'area', req: true },
      { k: 'containment', label: 'Besondere Eindämmungsmaßnahmen', t: 'paras' },
      { k: 'description', label: 'Beschreibung', t: 'paras' },
      {
        k: 'addenda',
        label: 'Addenda',
        t: 'addenda',
        hint: 'Kopf „Addendum 8041/I · Art“, Beginn und Ende des Transkripts und „Ende Addendum …“ setzt die Akte selbst.',
      },
      { k: 'reports', label: 'Verknüpfte Feldberichte', t: 'multi', options: reports },
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
      { k: 'clearance', label: 'Freigabe', t: 'select', options: () => [...LEVELS, 'RAISA', 'Extern'], level: levelOf },
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
      { k: 'psych.access', label: 'Psychologie', t: 'select', options: () => [['granted', 'Freigegeben'], ['denied', 'Gesperrt']] },
      { k: 'psych.required', label: 'Erforderliche Freigabe (wenn gesperrt)', t: 'select', options: () => LEVELS, empty: 'Keine', level: levelOf },
      { k: 'psych.verdict.label', label: 'Gesamtbeurteilung', t: 'text' },
      { k: 'psych.verdict.tone', label: 'Einstufung der Beurteilung', t: 'select', options: () => TONES },
      { k: 'psych.date', label: 'Datum der Beurteilung', t: 'date' },
      {
        k: 'psych.metrics',
        label: 'Kennwerte (0–100)',
        t: 'rows',
        blank: { label: '', value: 50 },
        fields: [
          { k: 'label', label: 'Wert', t: 'text' },
          { k: 'value', label: 'Prozent', t: 'slider' },
        ],
      },
      { k: 'psych.text', label: 'Beobachtungen', t: 'paras' },
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
      { k: '_head', label: 'Kopfdaten', t: 'group', hint: 'Steht oben in der Akte und auf der Karte in der Übersicht.' },
      { k: 'id', label: 'Kennung', t: 'text', req: true, hint: 'Aktenzeichen, z. B. FB-80-2026-040.' },
      { k: 'title', label: 'Titel', t: 'text', req: true, hint: 'Kurz und sachlich.' },
      { k: 'date', label: 'Datum', t: 'date' },
      { k: 'author', label: 'Verfasst von', t: 'pick', what: 'person', single: true, hint: 'Unterzeichnet den Bericht.' },
      { k: 'location', label: 'Einsatzort', t: 'text', hint: 'Wo der Bericht spielt.' },
      {
        k: 'classification',
        label: 'Freigabe',
        t: 'select',
        options: () => Object.keys(REPORT_LEVEL),
        level: (v) => REPORT_LEVEL[v] ?? 0,
      },
      { k: 'status', label: 'Status', t: 'select', options: () => ['Offen', 'Abgeschlossen'], hint: 'Offen, solange noch ermittelt oder nachgetragen wird.' },
      { k: 'summary', label: 'Zusammenfassung', t: 'area', req: true, hint: 'Ein bis zwei Sätze, erscheinen auch auf der Karte.' },
      { k: '_facts', label: 'Eckdaten und Beteiligte', t: 'group', hint: 'Die Tabelle unter dem Kopf der Akte. Leere Werte erscheinen als „–“; nicht benötigte Zeilen entfernen.' },
      {
        k: 'facts',
        label: 'Zeilen',
        t: 'rows',
        compact: true,
        blank: { label: '', value: '' },
        fields: [
          { k: 'label', label: 'Bezeichnung', t: 'text' },
          { k: 'value', label: 'Wert', t: 'text', ph: (r) => factHint(r.label as string) },
        ],
      },
      { k: 'objects', label: 'Betroffene Objekte', t: 'pick', what: 'scp', hint: 'Erscheinen verlinkt in der Akte.' },
      { k: 'units', label: 'Beteiligte Mobile Task Forces', t: 'pick', what: 'mtf' },
      { k: 'involved', label: 'Beteiligtes Personal', t: 'pick', what: 'person' },
      { k: '_body', label: 'Inhalt', t: 'group', hint: 'Jeder Teil wird in der Akte ein nummerierter Abschnitt. Leere Teile werden nicht angezeigt. Absätze durch eine Leerzeile trennen.' },
      { k: 'situation', label: 'Ausgangslage', t: 'paras', hint: 'Was vorher war: Anlass und Lage.' },
      {
        k: 'sections',
        label: 'Abschnitte der Vorlage',
        t: 'rows',
        blank: { title: '', body: [] },
        fields: [
          { k: 'title', label: 'Überschrift', t: 'text' },
          { k: 'body', label: 'Text', t: 'paras', ph: (r) => sectionHint(r.title as string) },
        ],
      },
      {
        k: 'timeline',
        label: 'Verlauf',
        t: 'rows',
        blank: { time: '', text: '' },
        hint: 'Optional: der Ablauf mit Uhrzeit, je Ereignis eine Zeile.',
        fields: [
          { k: 'time', label: 'Zeit', t: 'text', ph: () => 'z. B. 02:14' },
          { k: 'text', label: 'Ereignis', t: 'text' },
        ],
      },
      { k: 'measures', label: 'Maßnahmen', t: 'paras', hint: 'Was getan wurde oder getan werden muss, je Absatz eine Maßnahme.' },
      { k: 'assessment', label: 'Bewertung und Empfehlung', t: 'paras', hint: 'Fazit und weiteres Vorgehen.' },
      {
        k: 'images',
        label: 'Bildmaterial',
        t: 'rows',
        blank: { caption: '' },
        fields: [
          { k: 'src', label: 'Bild', t: 'image', folder: 'reports', preview: reportImageUrl },
          { k: 'caption', label: 'Bildunterschrift', t: 'text' },
        ],
      },
      { k: '_access', label: 'Zugriff', t: 'group', hint: 'Wer den Bericht lesen darf.' },
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
      ? [{ k: 'access.level', label: 'Zugriffsfreigabe', t: 'select', empty: 'Keine', options: () => [1, 2, 3, 4, 5].map((n): Opt => [String(n), CLEARANCE[n - 1].name]), level: Number } as Field]
      : []),
    { k: 'access.readers', label: 'Ausgewählte Konten', t: 'accounts', hint: 'Nur bei „Ausgewählte Konten“. Der Ersteller sieht die Akte immer.' },
  ];
}

// Switches a report to a template: the old template's key data and sections
// that are still empty go, the new one's that are missing are added. Anything
// already written stays.
function applyTemplate(entry: Obj, v: ReportTemplate): Obj {
  const t = TEMPLATES[v];
  const old = TEMPLATES[entry.template as ReportTemplate];
  type Fact = { label: string; value?: string };
  type Sec = { title: string; body?: string[] };
  const facts = ((entry.facts as Fact[]) ?? []).filter((f) => f.value || !old?.facts.some(([n]) => n === f.label));
  for (const [label] of t.facts) if (!facts.some((f) => f.label === label)) facts.push({ label });
  const sections = ((entry.sections as Sec[]) ?? []).filter((s) => s.body?.length || !old?.sections.some(([n]) => n === s.title));
  for (const [title] of t.sections) if (!sections.some((s) => s.title === title)) sections.push({ title, body: [] });
  const out: Obj = { ...entry, template: v, facts, sections };
  if (!facts.length) delete out.facts;
  if (!sections.length) delete out.sections;
  return out;
}

// The first step of a new report, and the switch later on: one card per
// template with what it is for and what it asks for.
function TemplatePicker({ value, onPick, onClose }: { value?: string; onPick: (t: ReportTemplate) => void; onClose?: () => void }) {
  return (
    <div className="tpl-pick">
      <div className="tpl-pick-head">
        <div>
          <h3>Welche Art von Bericht?</h3>
          <p className="dim small">
            Die Vorlage legt fest, welche Eckdaten und Abschnitte vorbereitet werden. Alles lässt sich danach ergänzen oder entfernen; die Vorlage kann jederzeit gewechselt werden, ohne dass Geschriebenes verloren geht.
          </p>
        </div>
        {onClose && (
          <button type="button" className="link" onClick={onClose}>
            Abbrechen
          </button>
        )}
      </div>
      <div className="tpl-grid">
        {(Object.entries(TEMPLATES) as [ReportTemplate, (typeof TEMPLATES)[ReportTemplate]][]).map(([k, t]) => (
          <button key={k} type="button" className={`card tpl-card${value === k ? ' active' : ''}`} onClick={() => onPick(k)}>
            <strong>{t.label}</strong>
            <span className="tpl-use">{t.use}</span>
            <span className="tpl-ex dim small">z. B. „{t.example}“</span>
            {t.facts.length + t.sections.length > 0 ? (
              <span className="tpl-parts small">
                {t.facts.length > 0 && (
                  <span>
                    <em>Eckdaten</em> {t.facts.map(([n]) => n).join(' · ')}
                  </span>
                )}
                {t.sections.length > 0 && (
                  <span>
                    <em>Abschnitte</em> {t.sections.map(([n]) => n).join(' · ')}
                  </span>
                )}
              </span>
            ) : (
              <span className="tpl-parts small">
                <span>Nur die Grundfelder, frei gestaltbar.</span>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
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
  // a [label, value] pair stays a pair: its empty cells stay as ''
  if (Array.isArray(o) && !rest.length) return Object.assign([...o], { [k]: value ?? '' }) as unknown as Obj;
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

function Input({ f, value, onChange, row }: { f: Field; value: unknown; onChange: (v: unknown) => void; row?: Obj }) {
  const ph = 'ph' in f && f.ph && row ? f.ph(row) : undefined;
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
          placeholder={ph}
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
      return <ParasInput value={(value as string[]) ?? []} onChange={onChange} placeholder={ph} />;
    case 'tags':
      return <TagsInput value={(value as string[]) ?? []} onChange={onChange} />;
    case 'accounts':
      return <AccountsInput value={(value as string[]) ?? []} onChange={onChange} />;
    case 'classes':
      return <ClassPicker set={f.set} value={(value as string) ?? ''} onChange={onChange} />;
    case 'check':
      return (
        <button type="button" role="switch" aria-checked={!!value} className={`search ed-toggle${value ? ' on' : ''}`} onClick={() => onChange(!value)}>
          <span className="ed-switch" aria-hidden />
          {value ? 'Ja' : 'Nein'}
          {'hint' in f && f.hint && <span className="dim small">{f.hint}</span>}
        </button>
      );
    case 'pick':
      return <EntityPicker what={f.what} single={f.single} value={value as string[] | string} onChange={onChange} />;
    case 'select':
      if (f.level) return <LevelChooser value={(value as string) ?? ''} options={f.options()} empty={f.empty} level={f.level} onChange={onChange} />;
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
    case 'addenda':
      return <AddendaInput value={(value as Obj[]) ?? []} onChange={onChange} />;
    case 'lines':
      return <LinesInput value={(value as string[]) ?? []} onChange={onChange} transcript={row?.kind === 'interview'} />;
    case 'rows':
      return <RowsInput f={f} rows={(value as Obj[]) ?? []} onChange={onChange} />;
  }
}

// Addendum kinds, after the old fixed addenda: the header rows each kind
// starts with (Vorwort as a row, as in the old files) and a typical title.
const ADDENDUM_KINDS: Record<string, { label: string; use: string; example: string; meta: string[] }> = {
  recovery: { label: 'Bergungsprotokoll', use: 'Wie das Objekt gefunden und gesichert wurde.', example: 'z. B. Bergung aus dem Hafenbecken Kiel', meta: ['Datum', 'Fundort', 'Bergungsteam', 'Vorwort'] },
  test: { label: 'Testprotokoll', use: 'Ein Versuch mit dem Objekt und sein Ergebnis.', example: 'z. B. Test 8041-03: Schallquelle unter Wasser', meta: ['Datum', 'Testleitung', 'Proband', 'Vorwort'] },
  interview: { label: 'Transkript (Befragung)', use: 'Ein Gespräch, Zeile für Zeile mit Sprechern und Handlungen.', example: 'z. B. Interview mit Archivarin L. Hofstetter', meta: ['Befragte', 'Befragt durch', 'Datum', 'Vorwort'] },
  incident: { label: 'Vorfallbericht', use: 'Ein Zwischenfall rund um das Objekt.', example: 'z. B. Vorfall 8041-1: Ausfall der Sonaranlage', meta: ['Datum', 'Ort', 'Vorwort'] },
  note: { label: 'Notiz', use: 'Ein kurzer Vermerk, unterzeichnet.', example: 'z. B. Anmerkung der Standortdirektion', meta: [] },
};
const META_HINT: Record<string, string> = {
  Datum: 'z. B. 14.09.2026',
  Fundort: 'Wo das Objekt geborgen wurde',
  Bergungsteam: 'z. B. MTF Eta-11',
  Testleitung: 'z. B. Dr. Kessler',
  Proband: 'z. B. D-80312',
  Befragte: 'Name und Funktion, z. B. L. Hofstetter, Archiv 7',
  'Befragt durch': 'z. B. Dr. D. Maynard',
  Ort: 'z. B. Sektor B, Zelle 12',
  Vorwort: 'Ein, zwei Sätze zur Lage vor dem Protokoll',
};
// A new kind adds its header rows that are missing; rows with an entry stay.
function addendumKind(row: Obj, v: string): Obj {
  const meta = ((row.meta as [string, string][]) ?? []).filter(([k, val]) => val || ADDENDUM_KINDS[v]?.meta.includes(k));
  for (const k of ADDENDUM_KINDS[v]?.meta ?? []) if (!meta.some(([m]) => m === k)) meta.push([k, '']);
  return { ...row, meta };
}

// Addendum content line by line: a speaker's line, an action in <…> or plain
// text. Stored as the strings the file reads („Name: Text“, „<Handlung>“).
type Line = { type: 'say' | 'stage' | 'text'; who?: string; text?: string };
const toLine = (s: string): Line => {
  const stage = s.match(/^<(.*)>$/);
  if (stage) return { type: 'stage', text: stage[1] };
  const say = s.match(/^([^:]{1,30}):\s(.*)$/);
  return say ? { type: 'say', who: say[1], text: say[2] } : { type: 'text', text: s };
};
const fromLine = (l: Line) => (l.type === 'stage' ? `<${l.text ?? ''}>` : l.type === 'say' ? `${l.who ?? ''}: ${l.text ?? ''}` : (l.text ?? ''));
// Clearance choices, the same in every editor: every level as its pill in a
// row (pips and level number), the chosen one lit, the others
// faint. Without a level (Extern, Keine) the choice is a plain chip.
// Levels go by number; a name that is more than its level (RAISA) is kept.
const levelName = (n: number, name: string) => (/^(Stufe \d|Uneingeschränkt|Eingeschränkt|Vertraulich|Geheim|Streng geheim)$/.test(name) ? `Level ${n}` : `Level ${n} · ${name}`);
function LevelChooser({ value, options, empty, level, onChange }: { value: string; options: Opt[]; empty?: string; level: (v: string) => number; onChange: (v: string) => void }) {
  const all: Opt[] = empty ? [['', empty], ...options] : options;
  return (
    <div className="lvl-choose" role="radiogroup">
      {all.map((o) => {
        const v = optValue(o);
        const n = v ? level(v) : 0;
        return (
          <button key={v || '-'} type="button" role="radio" aria-checked={v === value} className={`lvl-opt${v === value ? ' on' : ''}`} onClick={() => onChange(v)}>
            {n > 0 ? <LevelPill n={n} of={5} label={levelName(n, optLabel(o))} /> : <span className="lvl-plain">{optLabel(o)}</span>}
          </button>
        );
      })}
    </div>
  );
}

// Stable keys for a list edited in place, so inputs that hold their text
// (paragraphs) move with their row. Rows added or removed from outside (a
// template) get or lose keys at the end.
function useKeys(n: number) {
  const next = useRef(0);
  const [keys, setKeys] = useState<number[]>(() => Array.from({ length: n }, () => next.current++));
  const ks = keys.length === n ? keys : [...keys.slice(0, n), ...Array.from({ length: Math.max(0, n - keys.length) }, () => next.current++)];
  if (ks !== keys) setKeys(ks);
  return { ks, setKeys, fresh: () => next.current++ };
}

// A list sorted by dragging at a grip: the grip is a real button (the hover
// frame takes it), a press on it lifts the row, the others make room as it
// moves, and it settles where it is let go.
function SortList<T>({
  items,
  keys,
  onOrder,
  className,
  render,
}: {
  items: T[];
  keys: number[];
  onOrder: (items: T[], keys: number[]) => void;
  className?: string;
  render: (item: T, i: number, grip: React.ReactNode) => React.ReactNode;
}) {
  return (
    <Reorder.Group
      as="div"
      axis="y"
      className={className}
      values={keys}
      onReorder={(order: number[]) => onOrder(order.map((k) => items[keys.indexOf(k)]), order)}
    >
      {items.map((it, i) => (
        <SortItem key={keys[i]} value={keys[i]}>
          {(grip) => render(it, i, grip)}
        </SortItem>
      ))}
    </Reorder.Group>
  );
}
function SortItem({ value, children }: { value: number; children: (grip: React.ReactNode) => React.ReactNode }) {
  const controls = useDragControls();
  const grip = (
    <button
      type="button"
      className="ed-grip"
      title="Ziehen zum Verschieben"
      aria-label="Ziehen zum Verschieben"
      style={{ touchAction: 'none' }}
      onPointerDown={(e) => {
        e.preventDefault();
        controls.start(e);
      }}
    >
      <svg viewBox="0 0 10 16" aria-hidden>
        <circle cx="3" cy="3" r="1.3" />
        <circle cx="7" cy="3" r="1.3" />
        <circle cx="3" cy="8" r="1.3" />
        <circle cx="7" cy="8" r="1.3" />
        <circle cx="3" cy="13" r="1.3" />
        <circle cx="7" cy="13" r="1.3" />
      </svg>
    </button>
  );
  return (
    <Reorder.Item
      as="div"
      value={value}
      dragListener={false}
      dragControls={controls}
      className="ed-sort"
      whileDrag={{ scale: 1.01, zIndex: 5, boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}
      transition={{ duration: 0.18 }}
    >
      {children(grip)}
    </Reorder.Item>
  );
}

// A list of rows, sorted by dragging at the grip.
function RowsInput({ f, rows, onChange }: { f: Extract<Field, { t: 'rows' }>; rows: Obj[]; onChange: (v: Obj[]) => void }) {
  const { ks, setKeys, fresh } = useKeys(rows.length);
  const put = (i: number, r: Obj) => onChange(rows.map((x, j) => (j === i ? r : x)));
  return (
    <div className={`ed-rows${f.compact ? ' compact' : ''}`}>
      <SortList
        items={rows}
        keys={ks}
        className="ed-sort-list"
        onOrder={(r, k) => {
          setKeys(k);
          onChange(r);
        }}
        render={(r, i, grip) => (
          <div className="ed-row">
            {grip}
            {f.fields
              .filter((sub) => !sub.when || sub.when(r))
              .map((sub) => (
                <div key={sub.k} className={`ed-field t-${sub.t}`}>
                  <span className="label">{sub.label}</span>
                  <Input
                    f={sub}
                    value={get(r, sub.k)}
                    row={r}
                    onChange={(v) => put(i, 'apply' in sub && sub.apply ? sub.apply(set(r, sub.k, v), v as string) : set(r, sub.k, v))}
                  />
                  {'hint' in sub && sub.hint && sub.t !== 'check' && <span className="dim small ed-hint">{sub.hint}</span>}
                </div>
              ))}
            <div className="ed-row-tools">
              <button
                type="button"
                className="link"
                onClick={() => {
                  setKeys(ks.filter((_, j) => j !== i));
                  onChange(rows.filter((_, j) => j !== i));
                }}
              >
                Entfernen
              </button>
            </div>
          </div>
        )}
      />
      <button
        type="button"
        className="card action ghost"
        onClick={() => {
          setKeys([...ks, fresh()]);
          onChange([...rows, structuredClone(f.blank)]);
        }}
      >
        + HINZUFÜGEN
      </button>
    </div>
  );
}

// Addendum content line by line. Each line is a speaker's line, an action or
// a paragraph; a button per kind adds one, a small switch changes it.
const LINE_KINDS: [Line['type'], string][] = [
  ['say', 'Aussage'],
  ['stage', 'Handlung'],
  ['text', 'Absatz'],
];
const LINE_PH: Record<Line['type'], string> = {
  say: 'Was gesagt wird',
  stage: 'Was geschieht, z. B. Hofstetter schlägt das Notizbuch auf.',
  text: 'Ein Absatz',
};
function LinesInput({ value, onChange, transcript }: { value: string[]; onChange: (v: string[]) => void; transcript: boolean }) {
  // kept as rows while editing, so a line keeps its kind while still empty
  const [lines, setLines] = useState<Line[]>(() => value.map(toLine));
  const { ks, setKeys, fresh } = useKeys(lines.length);
  const emit = (l: Line[]) => {
    setLines(l);
    onChange(l.filter((x) => x.text?.trim()).map(fromLine));
  };
  const put = (i: number, patch: Partial<Line>) => emit(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  return (
    <div className="ed-lines">
      {lines.length > 0 && (
        <SortList
          items={lines}
          keys={ks}
          className="ed-sort-list"
          onOrder={(l, k) => {
            setKeys(k);
            emit(l);
          }}
          render={(l, i, grip) => (
            <div className={`ed-line line-${l.type}`}>
              {grip}
              <div className="ed-line-kind" role="radiogroup" aria-label="Art der Zeile">
                {LINE_KINDS.map(([t, label]) => (
                  <button key={t} type="button" role="radio" aria-checked={l.type === t} className={l.type === t ? 'on' : ''} onClick={() => put(i, { type: t })}>
                    {label}
                  </button>
                ))}
              </div>
              {l.type === 'say' && (
                <AutoArea className="search ed-line-who" oneLine placeholder="Sprecher" value={l.who ?? ''} onChange={(v) => put(i, { who: v })} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
              )}
              <AutoArea className="search ed-line-text" rows={1} placeholder={LINE_PH[l.type]} value={l.text ?? ''} onChange={(v) => put(i, { text: v })} />
              <button
                type="button"
                className="ed-line-del"
                aria-label="Zeile entfernen"
                title="Zeile entfernen"
                onClick={() => {
                  setKeys(ks.filter((_, j) => j !== i));
                  emit(lines.filter((_, j) => j !== i));
                }}
              >
                ×
              </button>
            </div>
          )}
        />
      )}
      {!lines.length && <p className="dim small">Noch keine Zeilen.</p>}
      <div className="ed-line-add">
        {LINE_KINDS.map(([t, label]) => (
          <button
            key={t}
            type="button"
            className="card action ghost"
            onClick={() => {
              setKeys([...ks, fresh()]);
              // a new speaker's line takes the speaker two lines up: interviews alternate
              const who = t === 'say' ? [...lines].reverse().filter((x) => x.type === 'say')[1]?.who : undefined;
              emit([...lines, { type: t, who }]);
            }}
          >
            + {label.toUpperCase()}
          </button>
        ))}
      </div>
      <span className="dim small ed-hint">
        {transcript
          ? '„Beginn Transkript“ und „Ende Transkript“ werden automatisch gesetzt.'
          : 'Die Zeilen stehen in dieser Reihenfolge in der Akte.'}
      </span>
    </div>
  );
}

// Addenda: one card per addendum, folded to its head (number, kind, title);
// one opens at a time. A new addendum starts with the choice of its kind.
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
function AddendaInput({ value, onChange }: { value: Obj[]; onChange: (v: Obj[]) => void }) {
  const { ks, setKeys, fresh } = useKeys(value.length);
  const [open, setOpen] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const put = (i: number, a: Obj) => onChange(value.map((x, j) => (j === i ? a : x)));
  const meta = (a: Obj) => (a.meta as [string, string][]) ?? [];
  return (
    <div className="ed-addenda">
      <SortList
        items={value}
        keys={ks}
        className="ed-sort-list"
        onOrder={(v, k) => {
          setKeys(k);
          onChange(v);
        }}
        render={(a, i, grip) => {
          const isOpen = open === ks[i];
          const kind = ADDENDUM_KINDS[a.kind as string];
          return (
            <div className={`ed-add${isOpen ? ' open' : ''}`}>
              <div className="ed-add-head">
                {grip}
                <button type="button" className="ed-add-toggle" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : ks[i])}>
                  <span className="label">
                    Addendum {ROMAN[i] ?? i + 1} · {kind?.label ?? 'Notiz'}
                  </span>
                  <strong>{(a.title as string) || <span className="dim">Ohne Titel</span>}</strong>
                  <svg className="rep-chev" viewBox="0 0 12 12" aria-hidden>
                    <path d="M2 4.5l4 4 4-4" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="link"
                  onClick={async () => {
                    if (!(await askConfirm({ title: 'Addendum entfernen?', text: `Addendum ${ROMAN[i] ?? i + 1} und sein Inhalt werden aus dem Formular entfernt.`, yes: 'ENTFERNEN', danger: true }))) return;
                    setKeys(ks.filter((_, j) => j !== i));
                    onChange(value.filter((_, j) => j !== i));
                  }}
                >
                  Entfernen
                </button>
              </div>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    className="ed-add-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <div className="ed-add-step">
                      <span className="ed-add-num">1</span>
                      <div className="ed-add-grid">
                        <div className="ed-field">
                          <span className="label">Art</span>
                          <Dropdown
                            value={(a.kind as string) ?? 'note'}
                            options={Object.entries(ADDENDUM_KINDS).map(([k, x]): Opt => [k, x.label])}
                            onChange={(v) => put(i, addendumKind({ ...a, kind: v }, v))}
                          />
                        </div>
                        <div className="ed-field">
                          <span className="label">Titel</span>
                          <AutoArea className="search" oneLine placeholder={kind?.example} value={(a.title as string) ?? ''} onChange={(v) => put(i, { ...a, title: v })} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
                        </div>
                      </div>
                    </div>
                    <div className="ed-add-step">
                      <span className="ed-add-num">2</span>
                      <div className="ed-field">
                        <span className="label">Kopfzeilen</span>
                        <span className="dim small ed-hint">Stehen über dem Inhalt, z. B. „Befragte: L. Hofstetter“. Leere Zeilen erscheinen nicht.</span>
                        <div className="ed-meta">
                          {meta(a).map(([k, v], m) => (
                            <div key={m} className="ed-meta-row">
                              <AutoArea className="search" oneLine placeholder="Bezeichnung" value={k} onChange={(x) => put(i, { ...a, meta: meta(a).map((p, j) => (j === m ? [x, p[1]] : p)) })} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
                              <AutoArea className="search" rows={1} placeholder={META_HINT[k] ?? 'Eintrag'} value={v} onChange={(x) => put(i, { ...a, meta: meta(a).map((p, j) => (j === m ? [p[0], x] : p)) })} />
                              <button type="button" className="ed-line-del" aria-label="Kopfzeile entfernen" title="Kopfzeile entfernen" onClick={() => put(i, { ...a, meta: meta(a).filter((_, j) => j !== m) })}>
                                ×
                              </button>
                            </div>
                          ))}
                          <button type="button" className="card action ghost" onClick={() => put(i, { ...a, meta: [...meta(a), ['', '']] })}>
                            + KOPFZEILE
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="ed-add-step">
                      <span className="ed-add-num">3</span>
                      <div className="ed-field">
                        <span className="label">Inhalt</span>
                        <LinesInput value={(a.body as string[]) ?? []} onChange={(v) => put(i, { ...a, body: v })} transcript={a.kind === 'interview'} />
                      </div>
                    </div>
                    {a.kind === 'note' && (
                      <div className="ed-add-step">
                        <span className="ed-add-num">4</span>
                        <div className="ed-field">
                          <span className="label">Unterzeichnet</span>
                          <AutoArea className="search" oneLine placeholder="z. B. Dr. I. Brandt, Standortdirektion" value={(a.sign as string) ?? ''} onChange={(v) => put(i, set(a, 'sign', v))} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        }}
      />
      {adding ? (
        <div className="ed-add-pick">
          <div className="ed-add-pick-head">
            <strong>Welche Art von Addendum?</strong>
            <button type="button" className="link" onClick={() => setAdding(false)}>
              Abbrechen
            </button>
          </div>
          <div className="ed-add-kinds">
            {Object.entries(ADDENDUM_KINDS).map(([k, x]) => (
              <button
                key={k}
                type="button"
                className="card tpl-card"
                onClick={() => {
                  const key = fresh();
                  setKeys([...ks, key]);
                  onChange([...value, addendumKind({ kind: k, title: '', body: [] }, k)]);
                  setOpen(key);
                  setAdding(false);
                }}
              >
                <strong>{x.label}</strong>
                <span className="dim small">{x.use}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button type="button" className="card action ghost" onClick={() => setAdding(true)}>
          + NEUES ADDENDUM
        </button>
      )}
    </div>
  );
}

// Class pickers: a button opens a window with every class icon of the set and
// a search over names and meanings; hovering a class shows its explanation.
type ClassSet = 'containment' | 'secondary' | 'disruption' | 'risk';
type PickClass = { name: string; info: string; cls: string; color?: string };
const asPick = (c: AcsClass): PickClass => ({ name: c.name, info: c.info, cls: `sec-${c.name}`, color: c.color });
const CLASS_SETS: Record<ClassSet, { title: string; none: boolean; groups: { label?: string; items: PickClass[] }[] }> = {
  containment: { title: 'Eindämmungsklasse', none: false, groups: [{ items: CONTAINMENT.map(asPick) }] },
  secondary: {
    title: 'Sekundärklasse',
    none: true,
    groups: [
      { label: 'Offizielle Klassen', items: SECONDARY.map(asPick) },
      { label: 'Esoterische Klassen', items: ESOTERIC.map(asPick) },
    ],
  },
  disruption: { title: 'Störungsklasse', none: false, groups: [{ items: DISRUPTION.map((d) => ({ name: d, info: classInfo(d), cls: `dis-${d}` })) }] },
  risk: { title: 'Risikoklasse', none: false, groups: [{ items: RISK.map((r) => ({ name: r, info: classInfo(r), cls: `risk-${r}` })) }] },
};

function ClassPicker({ set: which, value, onChange }: { set: ClassSet; value: string; onChange: (v: string) => void }) {
  const spec = CLASS_SETS[which];
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hover, setHover] = useState<PickClass | null>(null);
  const all = spec.groups.flatMap((g) => g.items);
  const current = all.find((c) => c.name === value);
  const shown = hover ?? current;
  const needle = q.trim().toLowerCase();
  const match = (c: PickClass) => !needle || c.name.toLowerCase().includes(needle) || c.info.toLowerCase().includes(needle);
  const close = () => {
    setOpen(false);
    setQ('');
  };
  const pick = (v: string) => {
    onChange(v);
    close();
  };
  const tile = (c: PickClass) => (
    <button
      key={c.name}
      type="button"
      className={`cp-tile ${c.cls}${c.name === value ? ' on' : ''}`}
      style={c.color ? ({ '--c': c.color } as React.CSSProperties) : undefined}
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
          <span className={`cp-current ${current.cls}`} style={current.color ? ({ '--c': current.color } as React.CSSProperties) : undefined}>
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
            onPointerDown={(e) => e.target === e.currentTarget && close()}
            onKeyDown={(e) => e.key === 'Escape' && close()}
          >
            <motion.div className="box cp cp-search" role="dialog" aria-label={`${spec.title} wählen`} initial={{ y: 12 }} animate={{ y: 0 }} exit={{ y: 12 }}>
              <div className="cp-head">
                <h2>{spec.title}</h2>
                {spec.none && (
                  <button type="button" className="card action ghost" onClick={() => pick('')}>
                    KEINE
                  </button>
                )}
              </div>
              <input className="search" autoFocus placeholder="Klasse oder Bedeutung suchen…" value={q} onChange={(e) => setQ(e.target.value)} />
              <div className="cp-scroll">
                {spec.groups.map((g) => {
                  const items = g.items.filter(match);
                  if (!items.length) return null;
                  return (
                    <div key={g.label ?? 'all'} className="cp-group">
                      {g.label && <div className="label">{g.label}</div>}
                      <div className="cp-grid">{items.map(tile)}</div>
                    </div>
                  );
                })}
                {!all.some(match) && <p className="dim">Keine Klasse gefunden.</p>}
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
function ParasInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState(() => value.join('\n\n'));
  return (
    <AutoArea
      value={text}
      placeholder={placeholder}
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
  className,
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
      className={`search ed-auto${oneLine ? ' one-line' : ''}${className ? ` ${className.replace(/search/, '').trim()}` : ''}`}
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
  // a new report starts with the choice of template
  const [picking, setPicking] = useState(kind === 'report' && !id);
  const tpl = kind === 'report' ? TEMPLATES[entry.template as ReportTemplate] : undefined;
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
        {picking ? (
          <TemplatePicker
            value={entry.template as string}
            onClose={id || entry.template ? () => setPicking(false) : undefined}
            onPick={(t) => {
              setEntry((o) => applyTemplate(o, t));
              setPicking(false);
            }}
          />
        ) : (
          <>
            {kind === 'report' && (
              <div className="tpl-current">
                <div>
                  <span className="label">Vorlage</span>
                  <strong>{tpl?.label ?? 'Keine Vorlage'}</strong>
                  <span className="dim small">{tpl?.use ?? 'Ältere Berichte haben keine Vorlage. Eine Vorlage ergänzt passende Eckdaten und Abschnitte.'}</span>
                </div>
                <button type="button" className="card action ghost" onClick={() => setPicking(true)}>
                  {tpl ? 'VORLAGE WECHSELN' : 'VORLAGE WÄHLEN'}
                </button>
              </div>
            )}
            <div className="ed-grid">
              {spec.fields.map((f) => {
                const hint = (tpl?.std as Record<string, string> | undefined)?.[f.k] ?? ('hint' in f ? f.hint : undefined);
                if (f.t === 'group')
                  return (
                    <div key={f.k} className="ed-group">
                      <h3>{f.label}</h3>
                      {hint && <span className="dim small">{hint}</span>}
                    </div>
                  );
                return (
                  <div key={f.k} className={`ed-field t-${f.t}${'level' in f && f.level ? ' t-level' : ''}`}>
                    <span className="label">
                      {f.label}
                      {'req' in f && f.req ? ' *' : ''}
                    </span>
                    <Input
                      f={f}
                      value={get(entry, f.k)}
                      onChange={(v) => setEntry((o) => ('apply' in f && f.apply ? f.apply(set(o, f.k, v), v as string) : set(o, f.k, v)))}
                    />
                    {hint && f.t !== 'check' && <span className="dim small ed-hint">{hint}</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}
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
