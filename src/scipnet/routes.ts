export type Route =
  | { view: 'overview' }
  | { view: 'personnel' }
  | { view: 'person'; id: string }
  | { view: 'reports' }
  | { view: 'report'; id: string };

export type Go = (r: Route) => void;
