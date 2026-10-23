export type Route =
  | { view: 'overview' }
  | { view: 'personnel' }
  | { view: 'person'; id: string }
  | { view: 'admin' }
  | { view: 'reports' }
  | { view: 'report'; id: string }
  | { view: 'comms' }
  | { view: 'thread'; id: string };

export type Go = (r: Route) => void;
