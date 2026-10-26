// Groups of Interest on file at Site-80. Each one opens in its own themed page
// (styles.css, .goi-<theme>). Backgrounds after the SCP Wiki hubs.

export type Goi = {
  id: string;
  theme: 'valravn' | 'mcd';
  name: string;
  short: string; // card line
  tagline: string; // the group's own words
  threat: 'Niedrig' | 'Mittel' | 'Hoch';
  stance: string; // how the Foundation deals with them
  facts: [string, string][];
  sections: { title: string; body: string[] }[];
  items?: { lot: string; name: string; note: string; price: string }[]; // MC&D catalogue
  ops?: { code: string; place: string; note: string }[]; // Valravn deployments
  stats: [label: string, value: string, note?: string][]; // strip of key figures under the header; note is a small line under the value
  intercept: { title: string; source: string; lines: [string, string][] }; // radio log or letter: [speaker or label, line]
  encounters: { date: string; text: string; tone: 'ok' | 'warn' | 'bad' }[]; // contacts with the Foundation
};

export const GOIS: Goi[] = [
  {
    id: 'valravn',
    theme: 'valravn',
    name: 'Valravn Corporation',
    short: 'Privates Militärunternehmen mit anomaler Ausrüstung. Öffentliches Gesicht der Jomsvikinger.',
    tagline: 'Wir kämpfen die Kriege, die sich andere nicht leisten können.',
    threat: 'Hoch',
    stance: 'Beobachten. Kein Kontakt ohne Freigabe der Standortdirektion. Bei Begegnung im Feld Rückzug und Meldung.',
    facts: [
      ['Typ', 'Privates Militärunternehmen'],
      ['Hintergrund', 'Most Holy Order of the Jomsvikings'],
      ['Verbündete', 'Elden Covenant'],
      ['Verhältnis zur GOC', 'Beitrittsgesuch zurückgezogen'],
      ['Einsatzgebiete', 'Länder ohne eigene Mittel gegen anomale Rebellengruppen'],
    ],
    sections: [
      {
        title: 'Profil',
        body: [
          'Valravn tritt als gewöhnlicher Sicherheitsdienstleister auf. Hinter der Firma steht der Orden der Jomsvikinger, der sich auf nordische Kriegstradition beruft.',
          'Die Firma zog ihr Gesuch um Aufnahme in die Global Occult Coalition zurück. Begründung: Als unabhängige Organisation könne man den Partnern besser dienen.',
        ],
      },
      {
        title: 'Vorgehen',
        body: [
          'Valravn wird von Staaten und Konzernen angeheuert, die anomale Gegner nicht selbst bekämpfen können. Auftraggeber zahlen in Geld, Land oder Schürfrechten.',
          'Mehrere Einsätze stehen im Verdacht schwerer Menschenrechtsverletzungen. [[Ein Bericht aus Mindanao liegt der Standortdirektion vor.]]',
        ],
      },
    ],
    ops: [
      { code: 'VR-2026-03', place: 'Mindanao, Philippinen', note: 'Im Auftrag eines Industriekonzerns. Illegale Operation, abgebrochen.' },
      { code: 'VR-2026-07', place: '[GESCHWÄRZT]', note: 'Begleitschutz für Erzabbau. Verluste unbekannt.' },
      { code: 'VR-2026-11', place: 'Nordnorwegen', note: 'Rekrutierung. Beobachtet durch Site-80 Nord.' },
    ],
    stats: [
      ['Geschätzte Stärke', '≈ 1.200'],
      ['Einsätze 2026', '3'],
      ['Länder aktiv', '7'],
      ['Letzte Sichtung', 'vor 12 Tagen'],
    ],
    intercept: {
      title: 'Abgefangener Funkverkehr',
      source: 'Kanal 4 · Mindanao · 03:12 Ortszeit',
      lines: [
        ['HUGINN-1', 'Ziel bestätigt. Zwei Wärmesignaturen, eine davon nicht menschlich.'],
        ['KOMMANDO', 'Auftraggeber will das Objekt unbeschädigt. Zeugen sind nicht Teil des Vertrags.'],
        ['HUGINN-1', 'Verstanden. Odin sieht zu.'],
        ['KOMMANDO', '[[Verbindung durch Site-80 gestört.]]'],
      ],
    },
    encounters: [
      { date: '03.2026', text: 'Mindanao: Valravn-Einheit vor Eintreffen der Foundation am Fundort. Objekt verloren.', tone: 'bad' },
      { date: '07.2026', text: 'Valravn bietet über Mittelsmann Zusammenarbeit an. Abgelehnt.', tone: 'warn' },
      { date: '11.2026', text: 'Rekrutierer in Tromsø identifiziert. Beobachtung ohne Kontakt.', tone: 'ok' },
    ],
  },
  {
    id: 'mcd',
    theme: 'mcd',
    name: 'Marshall, Carter and Dark Ltd.',
    short: 'Londoner Handelshaus für anomale Waren. Kauft, verkauft, verleiht und verwahrt für sehr reiche Kunden.',
    tagline: "It's all about playing the game.",
    threat: 'Mittel',
    stance: 'Nicht direkt angreifbar. Wirtschaftlich unantastbar. Abfangen von Lieferungen nur mit O5-Genehmigung.',
    facts: [
      ['Typ', 'Händler anomaler Waren'],
      ['Sitz', 'London'],
      ['Personal', 'höchstens etwa einhundert'],
      ['Gründer', 'Marshall, Carter, Dark'],
      ['Gegner', 'Manna Charitable Foundation, Serpent’s Hand'],
    ],
    sections: [
      {
        title: 'Profil',
        body: [
          'Über Jahrhunderte waren Marshall, Carter and Dark die einzigen Händler anomaler Waren der Welt. Sie gelten als die beständigsten Akteure des Feldes.',
          'Ihre Kundschaft ist klein und unermesslich reich. Für das Haus sind die Reichen, was Ameisen für den Menschen sind.',
        ],
      },
      {
        title: 'Geschäft',
        body: [
          'Ware bezieht das Haus unter anderem von Dr. Wondertainment und The Factory. Prometheus Labs tauscht Forschung gegen Proben.',
          'Für Kunden richtet das Haus Ausstellungen anomaler Kunst und geschlossene Gesellschaften aus.',
        ],
      },
    ],
    items: [
      { lot: 'Los 114', name: 'Taschenuhr, die eine Stunde schuldet', note: 'Gibt sie zurück, wann sie will.', price: '£ 2.400.000' },
      { lot: 'Los 207', name: 'Spiegel aus dem Haus Usher', note: 'Zeigt den Betrachter fünf Minuten älter.', price: 'Auf Anfrage' },
      { lot: 'Los 311', name: 'Ein Satz Ehrlichkeit', note: 'Einmalige Anwendung. Nicht übertragbar.', price: '£ 900.000' },
    ],
    stats: [
      ['Gegründet', '17. Jh.'],
      ['Kunden', 'unter 200'],
      ['Niederlassungen', '3', 'NYC · London · Hong Kong'],
      ['Abgefangene Lose', '3'],
    ],
    intercept: {
      title: 'Abgefangene Einladung',
      source: 'Bei einem Kurier in Mayfair sichergestellt',
      lines: [
        ['', 'Marshall, Carter and Dark Ltd. bitten um die Ehre Ihrer Anwesenheit'],
        ['', 'zur geschlossenen Vorbesichtigung der Herbstauktion.'],
        ['Ort', 'Der Club, London. Der Eingang findet Sie.'],
        ['Kleidung', 'Abendgarderobe. Masken werden gestellt.'],
        ['Gebot', 'Ab [[£ 500.000]]. Bezahlung in Währung Ihrer Wahl, auch in Jahren.'],
      ],
    },
    encounters: [
      { date: '1998', text: 'Erste dokumentierte Auktion eines Foundation-Objekts durch das Haus.', tone: 'bad' },
      { date: '02.2026', text: 'Los 207 vor Auslieferung in Dover abgefangen.', tone: 'ok' },
      { date: '09.2026', text: 'Anwaltsschreiben an die Standortdirektion: höfliche Bitte um Rückgabe.', tone: 'warn' },
    ],
  },
];

export const goiById = (id: string) => GOIS.find((g) => g.id === id);
