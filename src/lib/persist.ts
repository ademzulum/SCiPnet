// SCiPnet login survives reloads for 15 minutes, then the session expires and
// the site starts again at the UIU terminal. Storage can be unavailable
// (private mode etc.), so every access is guarded.

const KEY = 'scipnet.session';
export const SESSION_MS = 15 * 60 * 1000;

type Saved = { expiresAt: number; route?: unknown; state?: unknown };

function read(): Saved | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Saved | null;
    return s && s.expiresAt > Date.now() ? s : null;
  } catch {
    return null;
  }
}

function write(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // storage unavailable: session just won't survive a reload
  }
}

export const savedSession = {
  active: () => read() !== null,
  expiresAt: () => read()?.expiresAt ?? 0,
  route: () => read()?.route,
  start: () => write({ expiresAt: Date.now() + SESSION_MS }),
  // Push the expiry 15 minutes out again; returns the new expiry time.
  extend: () => {
    const s = read();
    const expiresAt = Date.now() + SESSION_MS;
    if (s) write({ ...s, expiresAt });
    return expiresAt;
  },
  setRoute: (route: unknown) => {
    const s = read();
    if (s) write({ ...s, route });
  },
  // Progress inside SCiPnet (scans, comms login, chats); only kept while the session lives.
  state: () => read()?.state,
  setState: (state: unknown) => {
    const s = read();
    if (s) write({ ...s, state });
  },
  end: () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  },
};
