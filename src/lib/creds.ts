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

// Second account, available after the brute-force minigame is won. It lifts
// redactions but can't change any entry.
export const O5 = {
  user: 'o5-13',
  name: 'O5-13',
  clearance: 'Stufe 5',
  site: 'Site-80',
  personnelId: 'O5-13',
};

// The real account: a Supabase login with email and password. Only this one
// may create, edit and delete entries (enforced by the database, see supabase/).
export const ADMIN = {
  user: 'administrator',
  name: 'Der Administrator',
  clearance: 'Stufe 6',
  site: 'Site-80',
  personnelId: 'A-00-0000',
};

export type Account = 'maynard' | 'o5' | 'admin';
export const ACCOUNTS = { maynard: STOLEN, o5: O5, admin: ADMIN } as const;
