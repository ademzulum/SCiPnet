// Fictional identity shown on the SCiPnet login after the intro sequence.
export const STOLEN = {
  user: 'dr.d.maynard',
  name: 'Dr. Duncan Maynard',
  password: 'Ky7#vQ2!mN0x',
  clearance: 'RAISA',
  site: 'Site-80',
  personnelId: 'P-80-0117',
};

export const AGENT = 'Special Agent Corvus Finch';

// Second account, available after the brute-force minigame is won.
export const ADMIN = {
  user: 'administrator',
  name: 'Der Administrator',
  clearance: 'Stufe 6',
  site: 'Site-80',
  personnelId: 'A-00-0000',
};

export type Account = 'maynard' | 'admin';
export const ACCOUNTS = { maynard: STOLEN, admin: ADMIN } as const;
