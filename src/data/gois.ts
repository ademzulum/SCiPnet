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
  },
];

export const goiById = (id: string) => GOIS.find((g) => g.id === id);
