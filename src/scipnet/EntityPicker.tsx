import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { PERSONNEL, personById } from '../data/personnel';
import { REPORTS } from '../data/reports';
import { REPORT_LEVEL } from '../data/access';
import { LevelPill } from './Pips';
import { MTFS } from '../data/mtf';
import { SCP } from '../data/scp';
import { photoUrl } from '../data/photos';
import { initials } from './Comms';
import { AcsIcon } from './Acs';
import { ClassBadge } from './Archive';
import { MtfInsignia } from './Departments';
import Picture from './Picture';

// Picking personnel, task forces or objects in the editor: the field shows
// what is picked, a button opens a window with a search over ids and names
// and one card per entry, like its card elsewhere on the site.
export type PickWhat = 'person' | 'mtf' | 'scp' | 'report';

type Item = { id: string; text: string; card: React.ReactNode; chip: React.ReactNode };

function items(what: PickWhat): Item[] {
  if (what === 'person')
    return PERSONNEL.map((p) => {
      const face = (
        <span className="pk-face" aria-hidden>
          {p.photo ? <Picture src={photoUrl(p.photo)} alt="" censored={false} cover /> : initials(p.name)}
        </span>
      );
      return {
        id: p.id,
        text: `${p.id} ${p.name} ${p.role}`,
        card: (
          <>
            {face}
            <strong>{p.name}</strong>
            <span className="dim small">{p.id}</span>
          </>
        ),
        chip: (
          <>
            {face}
            {p.name}
          </>
        ),
      };
    });
  if (what === 'mtf')
    return MTFS.map((m) => ({
      id: m.id,
      text: `${m.id} ${m.code} ${m.nickname}`,
      card: (
        <>
          <MtfInsignia m={m} size={72} />
          <strong>{m.code}</strong>
          <span className="dim small">„{m.nickname}“</span>
        </>
      ),
      chip: (
        <>
          <MtfInsignia m={m} size={20} />
          {m.code}
        </>
      ),
    }));
  if (what === 'report')
    return REPORTS.map((r) => {
      const n = REPORT_LEVEL[r.classification] ?? 3;
      return {
        id: r.id,
        text: `${r.id} ${r.title} ${personById(r.author)?.name ?? ''}`,
        card: (
          <>
            <span className="pk-scp-top">
              <strong>{r.id}</strong>
              <span className="dim small">{new Date(r.date).toLocaleDateString('de-DE')}</span>
            </span>
            <span className="pk-scp-name">{r.title}</span>
            <span className="pk-rep-foot">
              <LevelPill n={n} of={5} label={`Level ${n}`} />
              <span className="dim small">{r.status}</span>
            </span>
          </>
        ),
        chip: <>{r.id}</>,
      };
    });
  return SCP.map((s) => ({
    id: s.id,
    text: `${s.id} ${s.name}`,
    card: (
      <>
        <span className="pk-scp-top">
          <AcsIcon name={s.acs.containment ?? s.objectClass} />
          <strong>{s.id}</strong>
          <ClassBadge c={s.objectClass} />
        </span>
        <span className="pk-scp-name">{s.name}</span>
      </>
    ),
    chip: <>{s.id}</>,
  }));
}

const TITLE: Record<PickWhat, string> = { person: 'Personal wählen', mtf: 'Mobile Task Force wählen', scp: 'Objekte wählen', report: 'Feldberichte wählen' };

export default function EntityPicker({
  what,
  value,
  onChange,
  single,
}: {
  what: PickWhat;
  value: string[] | string | undefined;
  onChange: (v: string[] | string) => void;
  single?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  // a single id (older entries) counts as a list of one
  const picked = Array.isArray(value) ? value : value ? [value] : [];
  const all = items(what);
  const needle = q.trim().toLowerCase();
  const shown = needle ? all.filter((i) => i.text.toLowerCase().includes(needle)) : all;
  const toggle = (id: string) => {
    if (single) {
      onChange(id);
      setOpen(false);
    } else onChange(picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id]);
  };
  const close = () => {
    setOpen(false);
    setQ('');
  };
  return (
    <>
      <div className="pk-field">
        {picked.map((id) => {
          const it = all.find((i) => i.id === id);
          return (
            <span key={id} className={`pk-chip${it ? '' : ' broken-ref'}`}>
              {it ? it.chip : `${id} · [DATEN BESCHÄDIGT]`}
              {!single && (
                <button type="button" aria-label="Entfernen" onClick={() => onChange(picked.filter((p) => p !== id))}>
                  ×
                </button>
              )}
            </span>
          );
        })}
        <button type="button" className="card action ghost pk-open" onClick={() => setOpen(true)}>
          {single ? (picked.length ? 'ÄNDERN' : 'AUSWÄHLEN') : '+ AUSWÄHLEN'}
        </button>
      </div>
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
              <motion.div className="box cp pk" role="dialog" aria-label={TITLE[what]} initial={{ y: 12 }} animate={{ y: 0 }} exit={{ y: 12 }}>
                <div className="cp-head">
                  <h2>{TITLE[what]}</h2>
                  <button type="button" className="card action" onClick={close}>
                    FERTIG
                  </button>
                </div>
                <input className="search" autoFocus placeholder="Kennung oder Name suchen…" value={q} onChange={(e) => setQ(e.target.value)} />
                <div className="cp-scroll">
                  <div className={`pk-grid pk-${what}`}>
                    {shown.map((i) => (
                      <button key={i.id} type="button" className={`card pk-card${picked.includes(i.id) ? ' on' : ''}`} onClick={() => toggle(i.id)}>
                        {i.card}
                      </button>
                    ))}
                  </div>
                  {!shown.length && <p className="dim">Nichts gefunden.</p>}
                </div>
                <div className="cp-info dim small">
                  {single ? 'Ein Eintrag; die Auswahl schließt das Fenster.' : `${picked.length} ausgewählt. Erneut anklicken, um die Auswahl aufzuheben.`}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.querySelector('.shell') ?? document.body,
      )}
    </>
  );
}
