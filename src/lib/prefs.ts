// Per-viewer settings (theme, notification sound and pop-ups), kept in
// localStorage across sessions. Storage can be unavailable, so every access is
// guarded and the defaults apply.
import { useSyncExternalStore } from 'react';

export type Prefs = { light: boolean; noticeSound: boolean; noticePopups: boolean };

const KEY = 'scipnet.prefs';
const DEFAULTS: Prefs = { light: false, noticeSound: true, noticePopups: true };

let prefs: Prefs = (() => {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Prefs>) };
  } catch {
    return DEFAULTS;
  }
})();

const subs = new Set<() => void>();

export const getPrefs = () => prefs;

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  prefs = { ...prefs, [key]: value };
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // not persisted; still applies for this page load
  }
  subs.forEach((f) => f());
}

export function usePrefs() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => prefs,
  );
}
