export type Route =
  | { view: 'overview' }
  | { view: 'personnel' }
  | { view: 'person'; id: string }
  | { view: 'admin' }
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
  | { view: 'thread'; id: string };

export type Go = (r: Route) => void;
