// Anomaly Classification System classes beyond disruption and risk: every
// containment and secondary class the site knows, with a short explanation.
// After scp-wiki.wikidot.com/anomaly-classification-system-guide, /object-classes
// and /esoteric-classes-complete-list. Icons: images/archive/acs (official ACS
// icons) and images/archive/acs/secondary (community icons), CC BY-SA 3.0, see
// the LICENSE.txt files there.

export type AcsClass = {
  name: string; // as shown, kept in English as on the wiki
  icon: string; // icon file name without .svg
  info: string;
  color: string; // the class colour behind its icon
};

export const CONTAINMENT: AcsClass[] = [
  { name: 'Safe', icon: 'safe', color: '#4fbf7a', info: 'Statische Klasse. Zuverlässig und vollständig eindämmbar.' },
  { name: 'Euclid', icon: 'euclid', color: '#e8b85a', info: 'Statische Klasse. Verhalten nicht vollständig vorhersagbar.' },
  { name: 'Keter', icon: 'keter', color: '#e5484d', info: 'Statische Klasse. Eindämmung aufwendig und störanfällig.' },
  { name: 'Neutralisiert', icon: 'neutralized', color: '#9aa4ad', info: 'Statische Klasse. Nicht mehr anomal.' },
  { name: 'Pending', icon: 'pending', color: '#8fa3b8', info: 'Noch keine Klasse vergeben, die Erforschung läuft.' },
  { name: 'Explained', icon: 'explained', color: '#b8b0a0', info: 'Kein Anomalon mehr: wissenschaftlich erklärt oder als Täuschung entlarvt.' },
  { name: 'Esoteric', icon: 'esoteric', color: '#8e6bd6', info: 'Sonderfall. Eindämmung über die statischen Klassen hinaus, siehe Sekundärklasse.' },
];

// Secondary classes with an official ACS icon, plus the site's own Nachrichtlich.
export const SECONDARY: AcsClass[] = [
  { name: 'Thaumiel', icon: 'thaumiel', color: '#a46bff', info: 'Wird von der Foundation zur Eindämmung anderer Anomalien eingesetzt.' },
  { name: 'Apollyon', icon: 'apollyon', color: '#b3263a', info: 'Nicht eindämmbar oder kurz vor dem Ausbruch, meist mit Weltuntergangsgefahr.' },
  { name: 'Archon', icon: 'archon', color: '#3fa7a0', info: 'Eindämmbar, sollte aber aus gutem Grund nicht eingedämmt werden.' },
  { name: 'Cernunnos', icon: 'cernunnos', color: '#6aa84f', info: 'Eindämmbar, wird aus logistischen oder ethischen Gründen nicht eingedämmt.' },
  { name: 'Decommissioned', icon: 'decommissioned', color: '#7d8590', info: 'Von der Foundation gezielt zerstört oder seiner Eigenschaften beraubt.' },
  { name: 'Hiemal', icon: 'hiemal', color: '#7fc4e8', info: 'System aus zwei oder mehr Anomalien, die sich gegenseitig in Schach halten.' },
  { name: 'Tiamat', icon: 'tiamat', color: '#d9622b', info: 'Akute Bedrohung, nur durch offenen Krieg oder einen Bruch des Schleiers einzudämmen.' },
  { name: 'Ticonderoga', icon: 'ticonderoga', color: '#b5c23a', info: 'Nicht eindämmbar, muss aber auch nicht eingedämmt werden.' },
  { name: 'Uncontained', icon: 'uncontained', color: '#e39a3b', info: 'Derzeit nicht eingedämmt; die Eindämmung wird hergestellt oder wiederhergestellt.' },
  { name: 'Nachrichtlich', icon: 'nachrichtlich', color: '#4aa8d8', info: 'Wirkt über übertragene Information, etwa ein Funksignal.' },
];

// Esoteric secondary classes with community icons. One colour for all of them.
const ESO = '#8a96a8';
export const ESOTERIC: AcsClass[] = (
  [
    ['Ain-Soph-Aur', 'ain-soph-aur', 'Einziges Objekt, das das Überleben der normalen Menschheit sichert.'],
    ['Aisna', 'aisna', 'Erzeugt Anomalien, ist durch Bewusstsein auslösbar und mit einer Gottheit oder dem Ursprung der Realität verbunden.'],
    ['Alterius', 'alterius', 'Stammt nicht von der Erde, ob außerirdisch oder aus einer anderen Dimension.'],
    ['Anomalous', 'anomalous', 'So schlicht, dass es keine eigene Akte erhält.'],
    ['Argus', 'argus', 'Die Eindämmung liegt in der Hand einer dritten Partei.'],
    ['Atlas', 'atlas', 'Kann künftig YK-Ereignisse auslösen, denen nicht beizukommen ist.'],
    ['Azathorth', 'azathorth', 'Außerordentlich gefährlich und zerstörerisch.'],
    ['Bakkhos', 'bakkhos', 'Verwischt die Grenze zwischen Leben und Tod.'],
    ['Chhokmah', 'chhokmah', 'Mit der Grundrealität verflochten; eine Eindämmung träfe intelligente Wesen.'],
    ['Dagdagiel', 'dagdagiel', 'Der Bericht über das Objekt wurde im Traum verfasst.'],
    ['Declassified', 'declassified', 'Der Foundation oder der Öffentlichkeit bekannt gemacht.'],
    ['Drygioni', 'drygioni', 'Seine Echtheit wird vom O5-Rat offiziell geprüft.'],
    ['Echelon', 'echelon', 'Höchste Priorität der Foundation.'],
    ['Embla', 'embla', 'Wird von der Foundation genutzt, um Anomalien zu erschaffen.'],
    ['Eparch', 'eparch', 'Nicht anomal, steht aber in Verbindung zum Anomalen.'],
    ['Gevurah', 'gevurah', 'Gefährdet die innere Struktur der Foundation und hemmt ihre Nebenziele.'],
    ['Gödel', 'godel', 'Mit anomaler Wissenschaft erklärbar.'],
    ['Hod', 'hod', 'Kann die Foundation stark beeinträchtigen, aber nur, wenn sie es zulässt.'],
    ['Ignosi', 'ignosi', 'Seine Entdeckung muss verhindert werden, auch durch die Foundation.'],
    ['In Doubt', 'in-doubt', 'Seine Wirkung schließt die bestehenden Klassen aus.'],
    ['Israfil', 'israfil', 'Steht in Verbindung mit Action 10-Israfil-A oder geht daraus hervor.'],
    ['Khonsu', 'khonsu', 'Wird bald neutralisiert; seine Erforschung hat Vorrang.'],
    ['Kronecker', 'kronecker', 'Nicht mehr anomal und von der Eindämmung ausgenommen.'],
    ['Kušum', 'kusum', 'Die Eindämmung ist auf unbestimmte Zeit aufgegeben.'],
    ['Maksur', 'maksur', 'In mehrere anomale Teile getrennt, die getrennt bleiben müssen.'],
    ['Malkuth', 'malkuth', 'Ist oder gehört zu einer fortgeschrittenen nichtmenschlichen Zivilisation.'],
    ['Mendax', 'mendax', 'Teil der Grundrealität, kann aber K-Szenarien auslösen.'],
    ['Nagi', 'nagi', 'Hat über lange Zeit seine anomalen oder gefährlichen Eigenschaften verloren.'],
    ['Necropsar', 'necropsar', 'Historisch nicht belegt, seine Existenz ist aber auf anderem Weg bestätigt.'],
    ['Nehemoth', 'nehemoth', 'Ein Feind der Foundation.'],
    ['Netzach', 'netzach', 'Ein unwahrscheinliches Mittel, das Überleben der Menschheit dauerhaft zu sichern.'],
    ['Non-Anomalous', 'non-anomalous', 'Keine anomalen Eigenschaften festgestellt.'],
    ['Pantokratōr', 'pantokrator', 'Zu groß für eine realistische Eindämmung.'],
    ['Paradox-Apollyon', 'paradox-apollyon', 'Vernichtet die Menschheit unausweichlich, eindämmbar nur durch ihre vorzeitige Auslöschung.'],
    ['Ragnarok', 'ragnarok', 'Wirkt wie Apollyon, beeinflusst aber in Wahrheit den Verfasser seiner Akte.'],
    ['ROLL', 'roll', 'Verursacht selbst Fehler in seiner Klassifizierung; die Akte ist verstümmelt.'],
    ['See Below', 'see-below', 'Besteht aus mehreren Anomalien mit jeweils eigener Klasse.'],
    ['Spiritual', 'spiritual', 'Reicht über mehrere Realitäten, Ursprung unbekannt.'],
    ['Tenebrarius', 'tenebrarius', 'Die Foundation besitzt keine Informationen über das Objekt und kann keine besitzen.'],
    ['Terminal', 'terminal', 'Nimmt Menschen nach ihrem Tod in sich auf.'],
    ['Uncontainable', 'uncontainable', 'Grundsätzlich nicht eindämmbar.'],
    ['Unknown', 'unknown', 'Ort oder Eigenschaften noch unbestimmt.'],
    ['Unnecessary', 'unnecessary', 'Eine Eindämmung ist nicht erforderlich.'],
    ['Yesod', 'yesod', 'In die Befehlsstruktur der Foundation eingegliedert.'],
    ['Yggdrasil', 'yggdrasil', 'Kann ein ZK-Szenario auslösen oder die Realität schädlich verändern.'],
    ['Zeno', 'zeno', 'Mittlerer Eindämmungsaufwand bei geringer Bedrohung.'],
  ] as const
).map(([name, icon, info]) => ({ name, icon, info, color: ESO }));

export const ALL_CLASSES = [...CONTAINMENT, ...SECONDARY, ...ESOTERIC];
export const classByName = (n: string) => ALL_CLASSES.find((c) => c.name.toLowerCase() === n.toLowerCase());
