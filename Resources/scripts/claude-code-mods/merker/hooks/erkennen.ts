// Erkennt an der Wortwahl, ob eine Nachricht eine Korrektur ist, die sich als
// dauerhafte Regel lohnen könnte. Bewusst ohne Modellaufruf.

const LAENGE_MAX = 600
const ZITAT_MAX = 140
// Statt \b, das Umlaute nicht als Buchstaben kennt.
const VOR = '(^|[^a-zäöüß])'
const NACH = '(?![a-zäöüß])'

const wort = (inhalt: string): RegExp => new RegExp(`${VOR}(${inhalt})${NACH}`, 'i')

const MUSTER: RegExp[] = [
  /^\s*(nein|nee|nö|ne)(?![a-zäöüß])/i,
  /^\s*no(?![a-z])/i,
  wort('nicht so|so nicht'),
  wort('stattdessen'),
  wort('ab jetzt|ab sofort|in zukunft|künftig|von nun an'),
  wort('nie wieder|niemals|nie mehr'),
  wort('merke? dir'),
  wort('hör auf|lass das|bitte nicht'),
  wort('gefällt mir nicht|sieht nicht gut aus|ist falsch|stimmt nicht'),
  wort('hätte ich lieber|ich wollte eigentlich|ich meinte'),
  wort('(immer|jedes mal).{0,40}[^a-zäöüß](statt|nicht|nur|erst|zuerst|vorher)'),
  wort('(du sollst|du musst|bitte).{0,30}[^a-zäöüß](immer|nie)'),
  wort("from now on|never again|don't ever|stop doing|always use|instead of"),
  wort("that'?s wrong|i wish"),
]

/** Das Zitat für die Rückfrage, wenn die Nachricht nach einer Korrektur klingt. */
export const korrektur = (text: string): string | null => {
  const sauber = text.replace(/\s+/g, ' ').trim()

  if (sauber === '' || sauber.startsWith('/') || sauber.length > LAENGE_MAX) {
    return null
  }

  return MUSTER.some(muster => muster.test(sauber)) ? sauber : null
}

export const kurz = (zitat: string): string =>
  zitat.length > ZITAT_MAX ? `${zitat.slice(0, ZITAT_MAX)}…` : zitat

/** Der Auftrag an Claude: aus der Korrektur eine Regel machen und ablegen. */
export const auftrag = (zitat: string): string =>
  [
    `Der Nutzer möchte diese Korrektur dauerhaft als Regel gespeichert haben: „${zitat}“`,
    'Formuliere daraus eine knappe Regel mit Warum und Anwendung und lege sie dort ab, wo dieser Arbeitsbereich Regeln aufbewahrt (Memory als Feedback, bei Projekt- oder Vault-Themen zusätzlich die passende Datei).',
    'Prüfe vorher, ob es dazu schon einen Eintrag gibt, und ergänze ihn dann, statt einen zweiten anzulegen.',
    'Bestätige in einem Satz, was du wo gespeichert hast.',
  ].join(' ')
