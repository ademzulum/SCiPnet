import { PERSONNEL, personById } from '../data/personnel';
import { masked } from './cardAccess';
import { REPORTS } from '../data/reports';
import { SCP } from '../data/scp';
import { useAccount } from './session';
import type { Go } from './routes';
import { classKey } from './ReportList';
import { initials } from './Comms';
import Redacted from './Redacted';
import Globe, { useGeo } from './Globe';
import HumeMeter from './HumeMeter';

import { useEffect, useRef, useState } from 'react';
import { NOTICES, type Notice } from '../data/messages';
import { deleteEntry, saveEntry } from '../data/store';
import { askConfirm, setLeaveGuard } from './Confirm';
import Dropdown from './Dropdown';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';

const LEVEL_LABEL = { info: 'Info', warn: 'Hinweis', alert: 'Dringend' };

// The Administrator writes and deletes notices here; newest first.
function NoticeForm({ onClose }: { onClose: () => void }) {
  const [level, setLevel] = useState<Notice['level']>('info');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const filled = useRef(false);
  filled.current = !!(title.trim() || text.trim());
  useEffect(() => {
    setLeaveGuard(() => filled.current);
    return () => setLeaveGuard(null);
  }, []);
  const cancel = async () => {
    if (filled.current && !(await askConfirm({ title: 'Mitteilung verwerfen?', text: 'Der Entwurf geht verloren.', yes: 'VERWERFEN', danger: true }))) return;
    onClose();
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await askConfirm({ title: 'Mitteilung veröffentlichen?', text: 'Die Mitteilung erscheint für alle Konten in der Übersicht.', yes: 'VERÖFFENTLICHEN' }))) return;
    const time = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    const err = await saveEntry('notice', { id: `N-${Date.now()}`, time, level, title: title.trim(), text: text.trim() });
    if (err) return setError(err);
    filled.current = false;
    onClose();
  };
  // a small window over the page; a click beside it cancels (asking if there is a draft)
  return createPortal(
    <motion.div className="admin-login-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onPointerDown={(e) => e.target === e.currentTarget && cancel()}>
      <motion.form className="box admin-login notice-form" initial={{ y: 12 }} animate={{ y: 0 }} onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && cancel()}>
        <div className="label">Administrator · Übersicht</div>
        <h2>Neue Mitteilung</h2>
        <label>
          <span className="label">Stufe</span>
          <Dropdown value={level} options={Object.entries(LEVEL_LABEL) as [string, string][]} onChange={(v) => setLevel(v as Notice['level'])} />
        </label>
        <label>
          <span className="label">Titel</span>
          <input className="search" autoFocus required maxLength={40} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          <span className="label">Text</span>
          <textarea className="search" required rows={3} maxLength={200} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        {error && <span className="ed-error small">{error}</span>}
        <div className="admin-login-actions">
          <button type="button" className="card action ghost" onClick={cancel}>
            ABBRECHEN
          </button>
          <button className="card action">VERÖFFENTLICHEN</button>
        </div>
      </motion.form>
    </motion.div>,
    document.querySelector('.shell') ?? document.body,
  );
}

const fmt = (d: string) => new Date(d).toLocaleDateString('de-DE');
const daysAgo = (d: string) => Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 864e5));

export default function Overview({ go }: { go: Go }) {
  const me = useAccount();
  const geo = useGeo();
  const [writing, setWriting] = useState(false);
  const removeNotice = async (n: Notice) => {
    if (await askConfirm({ title: 'Mitteilung löschen?', text: `„${n.title}“ wird für alle Konten entfernt.`, yes: 'LÖSCHEN', danger: true }))
      await deleteEntry('notice', n.id);
  };
  const open = REPORTS.filter((r) => r.status === 'Offen');
  const active = PERSONNEL.filter((p) => p.status === 'Aktiv').length;
  const flagged = PERSONNEL.filter((p) => p.status !== 'Aktiv');
  const latest = [...REPORTS].sort((x, y) => y.date.localeCompare(x.date));
  const keter = SCP.filter((o) => o.objectClass === 'Keter').length;
  const stats = [
    {
      label: 'Aktives Personal',
      value: `${active}/${PERSONNEL.length}`,
      sub: `${flagged.length} mit Statusvermerk`,
      onClick: () => go({ view: 'personnel' }),
    },
    {
      label: 'Offene Vorgänge',
      value: open.length,
      sub: `${open.filter((r) => r.classification === 'Streng geheim').length} streng geheim`,
      onClick: () => go({ view: 'reports' }),
    },
    {
      label: 'Erfasste Objekte',
      value: SCP.length,
      sub: `${keter} Keter`,
      onClick: () => go({ view: 'scps' }),
    },
    {
      label: 'Letzter Bericht',
      value: latest[0] ? `vor ${daysAgo(latest[0].date)} T` : '–',
      sub: latest[0]?.id ?? '',
      onClick: latest[0] ? () => go({ view: 'report', id: latest[0].id }) : undefined,
    },
  ];

  return (
    <div className="page">
      <div className="box hero">
        <div>
          <div className="label">Sitzung aktiv</div>
          <h2>Willkommen, {me.name.replace(/^Der /, '')}</h2>
          <p className="dim">
            {me.site} · Freigabe {me.clearance}
            {geo?.city ? ` · Terminal in ${geo.city}` : ''}
          </p>
        </div>
        <span className="live">
          <span className="live-dot" /> VERBUNDEN
        </span>
      </div>

      <div className="overview-top">
        <Globe geo={geo} />
        <HumeMeter />
      </div>

      <div className="stats">
        {stats.map((s) => (
          <button key={s.label} className="card stat" onClick={s.onClick} disabled={!s.onClick}>
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">{s.value}</span>
            <span className="stat-sub">{s.sub}</span>
          </button>
        ))}
      </div>

      <div className="overview-grid">
        <section className="box">
          <div className="box-head">
            <h3>Neueste Feldberichte</h3>
            <button className="link" onClick={() => go({ view: 'reports' })}>
              Alle anzeigen
            </button>
          </div>
          <div className="notice-list">
            {latest.slice(0, 3).map((r) => (
              <button
                key={r.id}
                className={`notice ov-card ov-report cl-${classKey(r.classification)}`}
                onClick={() => go({ view: 'report', id: r.id })}
              >
                <span className="notice-top">
                  <span className="notice-level">{r.classification}</span>
                  <span className={`status status-${r.status}`}>{r.status}</span>
                </span>
                <strong>{masked('report', r, r.title)}</strong>
                <span className="dim ov-summary">{r.summary}</span>
                <span className="ov-foot">
                  <span className="avatar sm">{initials(personById(r.author)?.name ?? '?')}</span>
                  <span className="dim small">
                    {r.id} · {fmt(r.date)} · <Redacted text={r.location} />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="box">
          <div className="box-head">
            <h3>Mitteilungen</h3>
            {me.editor && !writing && (
              <button className="link" onClick={() => setWriting(true)}>
                + Neue Mitteilung
              </button>
            )}
          </div>
          {/* four notices tall, then it scrolls */}
          <div className="notice-list notice-scroll">
            {writing && <NoticeForm onClose={() => setWriting(false)} />}
            {[...NOTICES].reverse().map((n) => (
              <div key={n.id} className={`notice notice-${n.level}`}>
                <div className="notice-top">
                  <span className="notice-level">{LEVEL_LABEL[n.level]}</span>
                  <span className="dim small">
                    {n.time}
                    {me.editor && (
                      <button className="link notice-del" onClick={() => removeNotice(n)}>
                        Löschen
                      </button>
                    )}
                  </span>
                </div>
                <strong>{n.title}</strong>
                <span className="dim">{n.text}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="overview-grid even">
        <section className="box">
          <div className="box-head">
            <h3>Personal mit Statusvermerk</h3>
            <button className="link" onClick={() => go({ view: 'personnel' })}>
              Personalakten
            </button>
          </div>
          <div className="notice-list">
            {flagged.length ? (
              flagged.map((p) => (
                <button key={p.id} className={`notice ov-card ov-person ps-${p.status}`} onClick={() => go({ view: 'person', id: p.id })}>
                  <span className="avatar sm">{initials(p.name)}</span>
                  <span className="ov-person-info">
                    <strong>{masked('personnel', p, p.name)}</strong>
                    <span className="dim small">
                      {p.id} · {p.role}
                    </span>
                  </span>
                  <span className={`status status-${p.status}`}>{p.status}</span>
                </button>
              ))
            ) : (
              <p className="dim">Keine Vermerke.</p>
            )}
          </div>
        </section>

        <section className="box">
          <div className="box-head">
            <h3>Eindämmung</h3>
            <button className="link" onClick={() => go({ view: 'scps' })}>
              Zum Archiv
            </button>
          </div>
          <div className="notice-list">
            {SCP.slice(0, 4).map((o) => (
              <button key={o.id} className={`notice ov-card ov-scp class-edge-${o.objectClass}`} onClick={() => go({ view: 'scp', id: o.id })}>
                <span className="notice-top">
                  <span className="notice-level">{o.objectClass}</span>
                  <span className="dim small">{o.id}</span>
                </span>
                <strong>{o.locked ? '[GESPERRT]' : masked('scp', o, o.name)}</strong>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
