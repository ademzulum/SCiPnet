export type Route =
  | { view: 'overview' }
  | { view: 'personnel' }
  | { view: 'person'; id: string }
  | { view: 'admin' }
  | { view: 'reports' }
  | { view: 'report'; id: string }
  | { view: 'archive' }
  | { view: 'scp'; id: string }
  | { view: 'assistant' }
  | { view: 'comms' }
  | { view: 'thread'; id: string };

export type Go = (r: Route) => void;
