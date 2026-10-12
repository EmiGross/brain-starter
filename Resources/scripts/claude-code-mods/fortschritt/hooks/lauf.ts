import type { Lauf } from '../types'

export type Meldung = {
  titel?: string
  schritte?: string[]
  fertig?: number
  notiz?: string
  abgeschlossen?: boolean
}

export type Abschnitt = { zeichen: string; istFertig: boolean }

const MAX_SCHRITTE = 12

const sauber = (schritte: unknown): string[] =>
  Array.isArray(schritte)
    ? schritte
        .filter((schritt): schritt is string => typeof schritt === 'string')
        .map(schritt => schritt.trim())
        .filter(schritt => schritt !== '')
        .slice(0, MAX_SCHRITTE)
    : []

// Eine Meldung setzt einen neuen Lauf auf oder schreibt den laufenden fort.
export const uebernimm = (
  alt: Lauf | null,
  meldung: Meldung,
  jetzt: number,
): Lauf => {
  const titel = typeof meldung.titel === 'string' ? meldung.titel.trim() : ''
  const istNeu =
    alt === null || alt.ende !== null || (titel !== '' && titel !== alt.titel)
  const basis: Lauf = istNeu
    ? { titel, schritte: [], fertig: 0, notiz: '', start: jetzt, ende: null }
    : alt
  const schritte =
    meldung.schritte === undefined ? basis.schritte : sauber(meldung.schritte)
  const gemeldet =
    typeof meldung.fertig === 'number' && Number.isFinite(meldung.fertig)
      ? Math.max(0, Math.round(meldung.fertig))
      : basis.fertig
  const istZuEnde = meldung.abgeschlossen === true
  const fertig = istZuEnde
    ? Math.max(schritte.length, gemeldet)
    : schritte.length > 0
      ? Math.min(schritte.length, gemeldet)
      : gemeldet

  return {
    titel: basis.titel === '' ? 'Aufgabe' : basis.titel,
    schritte,
    fertig,
    notiz: typeof meldung.notiz === 'string' ? meldung.notiz.trim() : '',
    start: basis.start,
    ende: istZuEnde ? jetzt : null,
  }
}

// Was gerade läuft: die Notiz, sonst der nächste offene Schritt.
export const aktuell = (lauf: Lauf): string =>
  lauf.notiz !== '' ? lauf.notiz : (lauf.schritte[lauf.fertig] ?? '')

export const gesamt = (lauf: Lauf): number =>
  Math.max(lauf.schritte.length, lauf.fertig)

export const dauer = (ms: number): string => {
  const sekunden = Math.max(0, Math.floor(ms / 1000))
  const minuten = Math.floor(sekunden / 60)
  const rest = String(sekunden % 60).padStart(2, '0')

  return minuten >= 60
    ? `${Math.floor(minuten / 60)}:${String(minuten % 60).padStart(2, '0')}:${rest}`
    : `${minuten}:${rest}`
}

// Der dünne Balken: erledigter Teil und Rest, zusammen genau `breite` Zellen.
export const leiste = (lauf: Lauf, breite: number): Abschnitt[] => {
  const alle = gesamt(lauf)
  const anteil = lauf.ende !== null ? 1 : alle === 0 ? 0 : lauf.fertig / alle
  const voll = Math.min(breite, Math.round(anteil * breite))
  const teile: Abschnitt[] = [
    { zeichen: '━'.repeat(voll), istFertig: true },
    { zeichen: '━'.repeat(breite - voll), istFertig: false },
  ]

  return teile.filter(teil => teil.zeichen !== '')
}

export const antwort = (lauf: Lauf): string =>
  lauf.ende !== null
    ? `ok: ${lauf.titel} abgeschlossen`
    : `ok: ${lauf.titel} ${lauf.fertig}/${gesamt(lauf)}`
