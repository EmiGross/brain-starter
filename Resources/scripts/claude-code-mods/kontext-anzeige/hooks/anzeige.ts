import type { SessionUsage } from 'claude-code'

import type { KontextStand } from '../types'

export const BALD = 70
export const JETZT = 85

const FREI = '#3A3D4A'
const PUFFER = '#2A2C35'
const MARKE = '#E5C07B'
const GRUEN = '#8FBF7F'
const GELB = '#E5C07B'
const ROT = '#E06C75'

// Die Zeilen heißen wie in /context; unbekannte bleiben, wie sie kommen.
const NAMEN: Record<string, string> = {
  'System prompt': 'System-Prompt',
  'System tools': 'Tools',
  'MCP tools': 'MCP-Tools',
  'MCP server instructions': 'MCP-Hinweise',
  'Custom agents': 'Agenten',
  'Memory files': 'Memory-Dateien',
  Skills: 'Skills',
  Messages: 'Nachrichten',
  'Free space': 'frei',
  'Autocompact buffer': 'Puffer',
}
const FENSTER: Record<string, string> = { five_hour: '5 h', seven_day: 'Woche' }

export type Abschnitt = { zeichen: string; farbe: string }
export type Eintrag = {
  name: string
  tokens: number
  farbe: string
  anteil: number | null
}

const komma = (wert: number): string =>
  wert.toFixed(1).replace('.0', '').replace('.', ',')

export const zahl = (anzahl: number): string => {
  if (anzahl >= 999_500) {
    return `${komma(anzahl / 1_000_000)}M`
  }

  if (anzahl >= 10_000) {
    return `${Math.round(anzahl / 1000)}k`
  }

  return anzahl >= 1000 ? `${komma(anzahl / 1000)}k` : String(Math.round(anzahl))
}

export const ausMessung = (messung: SessionUsage): KontextStand | null => {
  const aufteilung = messung.context.breakdown

  if (aufteilung === undefined || aufteilung.rawMaxTokens <= 0) {
    return null
  }

  return {
    tokens: aufteilung.totalTokens,
    fenster: aufteilung.rawMaxTokens,
    prozent: aufteilung.percentage,
    komprimiertBei: aufteilung.autoCompactThreshold ?? null,
    teile: aufteilung.categories.flatMap(zeile =>
      zeile.kind === 'deferred'
        ? []
        : [
            {
              name: NAMEN[zeile.name] ?? zeile.name,
              tokens: zeile.tokens,
              farbe: zeile.color,
              art: zeile.kind,
            },
          ],
    ),
    limits: messung.rateLimits.flatMap(limit => {
      const fenster = FENSTER[limit.kind]

      return fenster === undefined
        ? []
        : [{ fenster, prozent: Math.round(limit.percentUsed) }]
    }),
  }
}

export const stufe = (prozent: number): string =>
  prozent >= JETZT ? ROT : prozent >= BALD ? GELB : GRUEN

export const rat = (prozent: number): string =>
  prozent >= JETZT ? 'jetzt /wrap' : prozent >= BALD ? 'bald /wrap' : ''

// Der Balken über die ganze Breite: Belegtes farbig, dann Freies, die Marke
// der automatischen Komprimierung und dahinter der Puffer. Dünn für die kleine
// Ansicht.
export const balken = (
  stand: KontextStand,
  breite: number,
  istDuenn = false,
): Abschnitt[] => {
  const block = istDuenn ? '━' : '█'
  const zellen = (tokens: number): number =>
    Math.round((tokens / stand.fenster) * breite)
  const abschnitte: Abschnitt[] = []
  let voll = 0

  for (const teil of stand.teile) {
    const istSichtbar = teil.art === 'used' && teil.tokens / stand.fenster >= 0.003
    const anzahl = istSichtbar
      ? Math.min(breite - voll, Math.max(1, zellen(teil.tokens)))
      : 0

    if (anzahl > 0) {
      abschnitte.push({ zeichen: block.repeat(anzahl), farbe: teil.farbe })
      voll += anzahl
    }
  }

  const marke =
    stand.komprimiertBei === null || voll >= breite
      ? null
      : Math.min(breite - 1, Math.max(voll, zellen(stand.komprimiertBei)))
  const rest: Abschnitt[] =
    marke === null
      ? [{ zeichen: block.repeat(breite - voll), farbe: FREI }]
      : [
          { zeichen: block.repeat(marke - voll), farbe: FREI },
          { zeichen: istDuenn ? '┃' : '│', farbe: MARKE },
          { zeichen: block.repeat(breite - marke - 1), farbe: PUFFER },
        ]

  return [...abschnitte, ...rest.filter(teil => teil.zeichen !== '')]
}

export const legende = (stand: KontextStand): Eintrag[] =>
  stand.teile.flatMap(teil =>
    teil.art === 'buffer'
      ? []
      : [
          {
            name: teil.name,
            tokens: teil.tokens,
            farbe: teil.art === 'free' ? FREI : teil.farbe,
            anteil:
              teil.art === 'free'
                ? null
                : Math.round((teil.tokens / stand.fenster) * 100),
          },
        ],
  )

export const limitText = (stand: KontextStand): string =>
  stand.limits.map(limit => `${limit.fenster} ${limit.prozent} %`).join(' · ')
