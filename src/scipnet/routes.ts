import type { Kind } from '../data/store';

export type Route =
  | { view: 'overview' }
  | { view: 'personnel' }
  | { view: 'person'; id: string }
  | { view: 'o5' } // O5-13's file, after the minigame
  | { view: 'admin' } // the Administrator's file, after the real login
  | { view: 'hack' }
  | { view: 'reports' }
  | { view: 'report'; id: string }
  | { view: 'archive' } // hub: SCP objects, departments, groups of interest
  | { view: 'scps' }
  | { view: 'scp'; id: string }
  | { view: 'departments' }
  | { view: 'mtf'; id: string }
  | { view: 'gois' }
  | { view: 'goi'; id: string }
  | { view: 'assistant'; ask?: string } // ask: a question sent on arrival (side rail)
  | { view: 'comms' }
  | { view: 'thread'; id: string }
  | { view: 'admin-chat' } // the Administrator's one-way channel to Dr. Maynard
  | { view: 'edit'; kind: Kind; id?: string }; // the Administrator's editor; no id: new entry

export type Go = (r: Route) => void;
