import type { Termin } from '../types'

const TAG_MS = 86_400_000
const UEBERFAELLIG_TAGE = 14
const TITEL_LAENGE = 40
const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

const OFFEN = /^\s*- \[ \] (.*)$/
const FETT = /\*\*(.+?)\*\*/
const ANMERKUNG = /\*\([^]*?\)\*/g
const DATUM =
  /(?<![\d.])(\d{1,2})\.(\d{1,2})\.(\d{4})?(?!\d)(?:,? (\d{1,2}:\d{2}))?/g

type Fund = { tag: string; zeit: string | null; von: number; bis: number }

const zwei = (n: number): string => String(n).padStart(2, '0')

const tagNr = (iso: string): number =>
  Math.round(
    Date.UTC(
      Number(iso.slice(0, 4)),
      Number(iso.slice(5, 7)) - 1,
      Number(iso.slice(8, 10)),
    ) / TAG_MS,
  )

const iso = (jahr: number, monat: number, tag: number): string | null => {
  const datum = new Date(Date.UTC(jahr, monat - 1, tag))
  const gibtEs = datum.getUTCMonth() === monat - 1 && datum.getUTCDate() === tag

  return gibtEs ? `${jahr}-${zwei(monat)}-${zwei(tag)}` : null
}

// Ein Datum ohne Jahr meint das Jahr, in dem es dem heutigen Tag am nächsten liegt.
const mitJahr = (
  tag: number,
  monat: number,
  jahr: number | undefined,
  heute: string,
): string | null => {
  if (jahr !== undefined) {
    return iso(jahr, monat, tag)
  }

  const dieses = Number(heute.slice(0, 4))
  const moeglich = [dieses - 1, dieses, dieses + 1]
    .map(j => iso(j, monat, tag))
    .filter((d): d is string => d !== null)
  const naechstes = [...moeglich].sort(
    (a, b) =>
      Math.abs(tagNr(a) - tagNr(heute)) - Math.abs(tagNr(b) - tagNr(heute)),
  )

  return naechstes[0] ?? null
}

const findeDaten = (text: string, heute: string): Fund[] =>
  [...text.matchAll(DATUM)].flatMap(m => {
    const tag = mitJahr(
      Number(m[1]),
      Number(m[2]),
      m[3] === undefined ? undefined : Number(m[3]),
      heute,
    )

    const von = m.index ?? 0

    return tag === null
      ? []
      : [{ tag, zeit: m[4] ?? null, von, bis: von + m[0].length }]
  })

const ohneLinks = (text: string): string =>
  text.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').replace(/[`*]/g, '')

const ohneRand = (text: string): string => text.replace(/[\s,]+$/, '')

// „Gespräch bei X am Mi, “ wird zu „Gespräch bei X“.
const ohneVorspann = (kopf: string): string =>
  ohneRand(
    ohneRand(ohneRand(kopf).replace(/(^|\s)(Mo|Di|Mi|Do|Fr|Sa|So)$/, '')).replace(
      /(^|[\s,])(wenn\s+)?(zugesagt\s+für|bis\s+zum|bis|am|für|vom|um)$/,
      '',
    ),
  )

const kommend = (daten: Fund[], heute: string): Fund | undefined =>
  daten
    .filter(d => d.tag >= heute)
    .sort((a, b) => a.tag.localeCompare(b.tag))[0]

const vergangen = (daten: Fund[], heute: string): Fund | undefined =>
  daten
    .filter(d => d.tag < heute)
    .filter(d => tagNr(heute) - tagNr(d.tag) <= UEBERFAELLIG_TAGE)
    .sort((a, b) => b.tag.localeCompare(a.tag))[0]

const ausZeile = (zeile: string, heute: string): Termin | null => {
  const rest = OFFEN.exec(zeile)?.[1]

  if (rest === undefined) {
    return null
  }

  const fett = FETT.exec(rest)?.[1]
  const titel = ohneLinks(fett ?? rest.split(/ — | \*\(/)[0] ?? rest).trim()
  const imTitel = findeDaten(titel, heute)
  const fund = kommend(imTitel, heute) ?? vergangen(imTitel, heute)

  if (fund !== undefined) {
    const kopf = ohneVorspann(titel.slice(0, fund.von))
    const schwanz = titel.slice(fund.bis).replace(/^[\s,.]*(Uhr)?[\s,.]*/, '')

    return { tag: fund.tag, zeit: fund.zeit, titel: kopf || schwanz || titel }
  }

  // Ohne Datum im Titel zählt nur eine mit ⏰ markierte Aufgabe, dann mit dem
  // nächsten Datum aus ihrer Beschreibung.
  if (imTitel.length > 0 || !rest.includes('⏰')) {
    return null
  }

  const spaeter = kommend(findeDaten(rest.replace(ANMERKUNG, ''), heute), heute)

  return spaeter === undefined
    ? null
    : { tag: spaeter.tag, zeit: spaeter.zeit, titel }
}

// Kommendes zuerst, am selben Tag Termine mit Uhrzeit vorn; Überfälliges hinten.
export const leseTermine = (notiz: string, heute: string): Termin[] =>
  notiz
    .split(/\r?\n/)
    .map(zeile => ausZeile(zeile, heute))
    .filter((t): t is Termin => t !== null)
    .sort(
      (a, b) =>
        Number(a.tag < heute) - Number(b.tag < heute) ||
        a.tag.localeCompare(b.tag) ||
        Number(a.zeit === null) - Number(b.zeit === null) ||
        (a.zeit ?? '').padStart(5, '0').localeCompare((b.zeit ?? '').padStart(5, '0')),
    )

const kurz = (text: string, laenge: number): string =>
  text.length <= laenge ? text : `${text.slice(0, laenge - 1).trimEnd()}…`

export const abstand = (termin: Termin, heute: string): number =>
  tagNr(termin.tag) - tagNr(heute)

export const etikett = (termin: Termin, heute: string): string => {
  const tage = abstand(termin, heute)
  const datum = `${termin.tag.slice(8, 10)}.${termin.tag.slice(5, 7)}.`
  const wochentag = WOCHENTAGE[new Date(tagNr(termin.tag) * TAG_MS).getUTCDay()]
  const wann =
    tage < 0
      ? `überfällig seit ${datum}`
      : tage === 0
        ? 'heute'
        : tage === 1
          ? 'morgen'
          : `${wochentag} ${datum}`

  return [wann, termin.zeit, kurz(termin.titel, TITEL_LAENGE)]
    .filter((teil): teil is string => teil !== null)
    .join(' ')
}

// Der nächste Termin; ein zweiter nur, wenn auch er heute ansteht.
export const auswahl = (termine: Termin[], heute: string): Termin[] =>
  termine
    .slice(0, 2)
    .filter((termin, stelle) => stelle === 0 || termin.tag === heute)
