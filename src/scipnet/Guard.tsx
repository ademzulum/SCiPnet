import { useEffect } from 'react';
import { SCP } from '../data/scp';
import { PERSONNEL, O5_PERSON, ADMIN_PERSON } from '../data/personnel';
import { REPORTS } from '../data/reports';
import { MTFS } from '../data/mtf';
import { canRead, requiredLevel, type Access } from '../data/access';
import type { Kind } from '../data/store';
import AccessDenied from './AccessDenied';
import { memeticKick } from './Admin';
import { useAccount } from './session';
import type { Go, Route } from './routes';

// Checks an entry before its file opens: missing (closed for this account or
// deleted), above the reader's clearance, or corrupted (the reader is thrown
// out). The Administrator opens everything; a corrupted file says so.
type Entry = { id: string; access?: Access; clearance?: string; classification?: string };
const LISTS: Partial<Record<Kind, Entry[]>> = { scp: SCP, personnel: PERSONNEL, report: REPORTS, mtf: MTFS };
const BACK: Partial<Record<Kind, [Route, string]>> = {
  scp: [{ view: 'scps' }, 'SCP-Archiv'],
  personnel: [{ view: 'personnel' }, 'Personalakten'],
  report: [{ view: 'reports' }, 'Feldberichte'],
  mtf: [{ view: 'departments' }, 'Mobile Task Forces'],
};

function Kick() {
  useEffect(() => memeticKick(), []);
  return null;
}

export default function Guard({ kind, id, go, children }: { kind: Kind; id: string; go: Go; children: React.ReactNode }) {
  const me = useAccount();
  const e = [...(LISTS[kind] ?? []), ...(kind === 'personnel' ? [O5_PERSON, ADMIN_PERSON] : [])].find((x) => x.id === id);
  const [back, backLabel] = BACK[kind]!;
  if (!e) return <AccessDenied id={id} reason="missing" back={back} backLabel={backLabel} go={go} />;
  if (e.access?.mode === 'corrupt' && !me.editor) return <Kick />;
  if (!canRead(kind, e, me.id))
    return <AccessDenied id={id} reason="level" required={requiredLevel(kind, e)} back={back} backLabel={backLabel} go={go} />;
  return (
    <>
      {e.access?.mode === 'corrupt' && <div className="box corrupt-note">Korrumpierte Akte · Andere Konten werden beim Öffnen durch einen memetischen Agenten getrennt.</div>}
      {children}
    </>
  );
}
