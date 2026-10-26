// Mobile Task Forces on file at Site-80. Missions after the SCP Wiki's task force
// list (scp-wiki.wikidot.com/task-forces); insignias in images/archive/mtf (CC BY-SA 3.0).
import alpha1 from '../../images/archive/mtf/alpha1.png';
import beta43 from '../../images/archive/mtf/beta43.png';
import epsilon11 from '../../images/archive/mtf/epsilon11.png';
import eta10 from '../../images/archive/mtf/eta10.png';
import gamma5 from '../../images/archive/mtf/gamma5.png';
import gamma6 from '../../images/archive/mtf/gamma6.png';
import omega1 from '../../images/archive/mtf/omega1.png';

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
  readiness: number; // percent, shown as a gauge
  log: { date: string; text: string; tone?: 'ok' | 'warn' | 'bad' }[]; // recent deployments
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
    readiness: 100,
    log: [{ date: '[GESCHWÄRZT]', text: 'Einsatz unter O5-Befehl. Details Stufe 5.', tone: 'bad' }, { date: '[GESCHWÄRZT]', text: 'Verlegung nach Site-80. Grund nicht freigegeben.' }],
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
    readiness: 92,
    log: [{ date: '19.10.2026', text: 'Übung Eindämmungsbruch Sektor 3. Ziel nach 4 min gesichert.', tone: 'ok' }, { date: '02.09.2026', text: 'Verstärkung Zelle 14-B während Stromausfall.', tone: 'warn' }, { date: '11.07.2026', text: 'Standortsicherung nach Fehlalarm Tor B.' }],
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
    readiness: 88,
    log: [{ date: '03.10.2026', text: 'Kameraaudit Zelle 14-B. Abweichung in Kamera 3.', tone: 'warn' }, { date: '02.09.2026', text: 'Beobachtung SCP-8019 während Stromausfall. Objekt stand auf.', tone: 'bad' }, { date: '20.06.2026', text: 'Ersteindämmung SCP-8019. Keine Verluste.', tone: 'ok' }],
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
    readiness: 74,
    log: [{ date: '24.10.2026', text: 'Sonar-Kartierung Bodensee, Abschnitt Nord.' }, { date: '14.07.2026', text: 'Messsonde bei Test 80-041-T3 verloren.', tone: 'bad' }, { date: '03.06.2026', text: 'Bergung SCP-8041 aus Waldsee, Schwarzwald.', tone: 'ok' }],
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
    readiness: 81,
    log: [{ date: '21.10.2026', text: 'Sperrung 66,6 MHz im Umkreis Funkstation 80-Nord bestätigt.', tone: 'ok' }, { date: '30.08.2026', text: 'Lokalzeitung: Bericht über Sendemast zurückgezogen.' }, { date: '12.05.2026', text: 'Amnestika Klasse B an 14 Anwohner ausgegeben.', tone: 'warn' }],
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
    readiness: 67,
    log: [{ date: '15.10.2026', text: 'Antimemetischer Filter Archiv 7 erneuert.', tone: 'ok' }, { date: '28.08.2026', text: 'Zwei Mitglieder ohne Erinnerung an Einsatz zurückgekehrt.', tone: 'bad' }],
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
    readiness: 100,
    log: [{ date: '[GESCHWÄRZT]', text: 'Einsatz im Auftrag des Ethikkomitees.', tone: 'bad' }],
  },
];

export const mtfById = (id: string) => MTFS.find((m) => m.id === id);
