// Mobile Task Forces on file at Site-80. Missions after the SCP Wiki's task force
// list (scp-wiki.wikidot.com/task-forces); insignias in images/mtf (CC BY-SA 3.0).
import alpha1 from '../../images/mtf/alpha1.png';
import beta43 from '../../images/mtf/beta43.png';
import epsilon11 from '../../images/mtf/epsilon11.png';
import eta10 from '../../images/mtf/eta10.png';
import gamma5 from '../../images/mtf/gamma5.png';
import gamma6 from '../../images/mtf/gamma6.png';
import omega1 from '../../images/mtf/omega1.png';

export type MtfStatus = 'Einsatzbereit' | 'Im Einsatz' | 'Bereitschaft' | 'Klassifiziert';

export type Mtf = {
  id: string; // route id, e.g. 'epsilon-11'
  code: string; // 'Epsilon-11'
  nickname: string; // the unit's name, kept in English as on file
  insignia: string;
  status: MtfStatus;
  base: string;
  strength: string;
  lead: string;
  mission: string[];
  specialty: string[];
};

export const MTFS: Mtf[] = [
  {
    id: 'alpha-1',
    code: 'Alpha-1',
    nickname: 'Red Right Hand',
    insignia: alpha1,
    status: 'Klassifiziert',
    base: '[DATEN GELÖSCHT]',
    strength: '[DATEN GELÖSCHT]',
    lead: 'Berichtet direkt an den O5-Rat',
    mission: [
      'Spezialeinheit des O5-Rats für Lagen, die strengste operative Geheimhaltung verlangen.',
      'Besteht aus den fähigsten und loyalsten Einsatzkräften der Foundation.',
      'Weitere Informationen über MTF Alpha-1 sind als Stufe 5 eingestuft.',
    ],
    specialty: ['Sonderoperationen', 'O5-Schutz', 'Geheimhaltung'],
  },
  {
    id: 'epsilon-11',
    code: 'Epsilon-11',
    nickname: 'Nine-Tailed Fox',
    insignia: epsilon11,
    status: 'Bereitschaft',
    base: 'Site-80, Bereitschaftsraum Sektor 1',
    strength: '3 Züge',
    lead: 'Unter Aufsicht von MTF Alpha-1',
    mission: [
      'Innere Sicherheit der Foundation. Wird an Standorte verlegt, wenn Standardprotokolle versagen und mehrere Ausbrüche drohen.',
      'Die meisten Einsätze sind klassifiziert.',
    ],
    specialty: ['Eindämmungsbruch', 'Standortsicherung', 'Rückeroberung'],
  },
  {
    id: 'eta-10',
    code: 'Eta-10',
    nickname: 'See No Evil',
    insignia: eta10,
    status: 'Einsatzbereit',
    base: 'Site-80, Sektor 14',
    strength: '12 Einsatzkräfte',
    lead: 'Cpt. [GESCHWÄRZT]',
    mission: [
      'Untersuchung, Bergung und Ersteindämmung von Objekten mit visuellen Kognitogefahren oder visuellen memetischen Wirkstoffen.',
      'Arbeitet ausschließlich mit indirekter Beobachtung: Kameras, Spiegel, abgedunkelte Visiere.',
    ],
    specialty: ['Visuelle Kognitogefahren', 'Indirekte Beobachtung'],
  },
  {
    id: 'gamma-6',
    code: 'Gamma-6',
    nickname: 'Deep Feeders',
    insignia: gamma6,
    status: 'Im Einsatz',
    base: 'Research Site-45, Außenstelle Bodensee',
    strength: '2 Tauchteams',
    lead: 'Lt. [GESCHWÄRZT]',
    mission: [
      'Untersuchung und Verfolgung von Anomalien in der Tiefsee und in großen Gewässern.',
      'Für Site-80 zuständig für Bergungen aus Binnenseen im süddeutschen Raum.',
    ],
    specialty: ['Tauchbergung', 'Gewässeranomalien'],
  },
  {
    id: 'gamma-5',
    code: 'Gamma-5',
    nickname: 'Red Herrings',
    insignia: gamma5,
    status: 'Im Einsatz',
    base: 'Mobil',
    strength: '[DATEN GELÖSCHT]',
    lead: 'Abteilung Desinformation',
    mission: [
      'Verhindert die Verbreitung von Wissen über anomale Ereignisse, wenn die erste Unterdrückung nicht ausgereicht hat.',
      'Entwickelt und setzt experimentelle Amnestika sowie Erinnerungsfälschungen ein.',
    ],
    specialty: ['Desinformation', 'Amnestika', 'Medienkontrolle'],
  },
  {
    id: 'beta-43',
    code: 'Beta-43',
    nickname: 'Con-Trollers',
    insignia: beta43,
    status: 'Bereitschaft',
    base: 'Site-43, Verbindungsbüro Site-80',
    strength: '8 Einsatzkräfte',
    lead: 'Abteilung Memetik',
    mission: ['Spezialisiert auf memetische Abwehr.', 'Unterstützt Site-80 bei Objekten mit antimemetischer Wirkung.'],
    specialty: ['Memetische Abwehr', 'Antimemetik'],
  },
  {
    id: 'omega-1',
    code: 'Omega-1',
    nickname: "Law's Left Hand",
    insignia: omega1,
    status: 'Klassifiziert',
    base: '[DATEN GELÖSCHT]',
    strength: '[DATEN GELÖSCHT]',
    lead: 'Berichtet ausschließlich an das Ethikkomitee',
    mission: [
      'Befugt, ranghohes Foundation-Personal abzusetzen oder zu exekutieren, wenn es unethisch handelt.',
      'Gegenstück zur "Red Right Hand" des O5-Rats.',
    ],
    specialty: ['Interne Ermittlungen', 'Ethikvollzug'],
  },
];

export const mtfById = (id: string) => MTFS.find((m) => m.id === id);
