// The archive lives in Supabase (table public.entries, see supabase/). It is
// loaded once before the app starts and copied into the lists in src/data/*.ts,
// so pages keep reading SCP, PERSONNEL, ... as before. Writes go through
// saveEntry / deleteEntry and only succeed for the Administrator: the database
// checks the role, the interface only hides the buttons.
import { useSyncExternalStore } from 'react';
import { supabase } from '../lib/supabase';
import { SCP, type ScpObject } from './scp';
import { PERSONNEL, type Person } from './personnel';
import { REPORTS, type Report } from './reports';
import { MTFS, type Mtf } from './mtf';
import { GOIS, type Goi } from './gois';
import { MESSAGES, NOTICES, type AdminMessage, type Notice } from './messages';

export type Kinds = { scp: ScpObject; personnel: Person; report: Report; mtf: Mtf; goi: Goi; notice: Notice; message: AdminMessage };
export type Kind = keyof Kinds;
const LISTS: { [K in Kind]: Kinds[K][] } = { scp: SCP, personnel: PERSONNEL, report: REPORTS, mtf: MTFS, goi: GOIS, notice: NOTICES, message: MESSAGES };

let version = 0;
const listeners = new Set<() => void>();
const changed = () => {
  version++;
  listeners.forEach((l) => l());
};
// Re-renders a component whenever an entry was saved or deleted.
export const useEntriesVersion = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
  );

// Loads every entry; returns an error text when the database can't be reached.
export async function loadEntries(): Promise<string | null> {
  if (!supabase) return 'Die Datenbank ist nicht eingerichtet (VITE_SUPABASE_URL fehlt).';
  // read without the login, so a broken or expired session never blocks the archive
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const res = await fetch(`${url}/rest/v1/entries?select=kind,data&order=position,id`, { headers: { apikey: key } }).catch(() => null);
  if (!res?.ok) return 'Die Datenbank ist nicht erreichbar.';
  const data = await res.json();
  for (const list of Object.values(LISTS)) list.length = 0;
  for (const row of data as { kind: Kind; data: never }[]) LISTS[row.kind]?.push(row.data);
  changed();
  return null;
}

// Reloads one kind (e.g. new messages from the Administrator) without a page
// reload; the pages re-render only when something changed.
export async function refreshKind(kind: Kind): Promise<void> {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  if (!url || !key) return;
  const res = await fetch(`${url}/rest/v1/entries?select=data&kind=eq.${kind}&order=position,id`, { headers: { apikey: key } }).catch(() => null);
  if (!res?.ok) return;
  const rows = (await res.json()) as { data: never }[];
  const list = LISTS[kind] as unknown[];
  const next = rows.map((r) => r.data);
  if (JSON.stringify(next) === JSON.stringify(list)) return;
  list.splice(0, list.length, ...next);
  changed();
}

// Creates or replaces an entry. `oldId` is the id before editing, so a
// renamed entry replaces its old row. Returns an error text or null.
export async function saveEntry<K extends Kind>(kind: K, entry: Kinds[K], oldId?: string): Promise<string | null> {
  if (!supabase) return 'Keine Verbindung zur Datenbank.';
  const list = LISTS[kind] as Kinds[K][];
  const at = list.findIndex((e) => e.id === (oldId ?? entry.id));
  if (oldId !== entry.id && list.some((e) => e.id === entry.id)) return `Die Kennung ${entry.id} ist schon vergeben.`;
  const position = at >= 0 ? at : list.length;
  const { error } = await supabase.from('entries').upsert({ kind, id: entry.id, position, data: entry });
  if (error)
    return error.code === '42501'
      ? 'Keine Berechtigung.'
      : error.code === '23514'
        ? 'Die Datenbank kennt diese Art Eintrag noch nicht. Bitte supabase/002_messages.sql ausführen.'
        : `Speichern fehlgeschlagen: ${error.message}`;
  if (oldId && oldId !== entry.id) await supabase.from('entries').delete().match({ kind, id: oldId });
  if (at >= 0) list[at] = entry;
  else list.push(entry);
  changed();
  return null;
}

// Entries that point at this one and break when it is deleted.
export function references(kind: Kind, id: string): string[] {
  if (kind === 'personnel')
    return REPORTS.filter((r) => r.author === id || r.involved?.includes(id)).map((r) => `${r.id} (${r.author === id ? 'Verfasser' : 'Beteiligte'})`);
  if (kind === 'report') return SCP.filter((s) => s.reports?.includes(id)).map((s) => `${s.id} (Feldberichte)`);
  if (kind === 'mtf') return SCP.filter((s) => s.mtf === id).map((s) => `${s.id} (Mobile Task Force)`);
  return [];
}

export async function deleteEntry(kind: Kind, id: string): Promise<string | null> {
  if (!supabase) return 'Keine Verbindung zur Datenbank.';
  const { error, count } = await supabase.from('entries').delete({ count: 'exact' }).match({ kind, id });
  if (error || !count) return 'Löschen fehlgeschlagen oder keine Berechtigung.';
  const list = LISTS[kind] as { id: string }[];
  list.splice(
    list.findIndex((e) => e.id === id),
    1,
  );
  changed();
  return null;
}

// Uploads a picture to the public "images" bucket and returns its URL.
export async function uploadImage(file: File, folder: 'personnel' | 'reports' | 'mtf'): Promise<{ url?: string; error?: string }> {
  if (!supabase) return { error: 'Keine Verbindung zur Datenbank.' };
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('images').upload(path, file, { contentType: file.type });
  if (error) return { error: 'Hochladen fehlgeschlagen oder keine Berechtigung.' };
  return { url: supabase.storage.from('images').getPublicUrl(path).data.publicUrl };
}
