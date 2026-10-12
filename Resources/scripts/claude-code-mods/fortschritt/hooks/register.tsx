import { atom, read, update } from 'claude-code'
import type {
  Elements,
  EngineInterface,
  Register,
  RenderElement,
  Timer,
} from 'claude-code'

import { aktuell, antwort, dauer, gesamt, leiste, uebernimm } from './lauf'
import type { Meldung } from './lauf'
import type { Lauf } from '../types'

const WERKZEUG = 'mcp__fortschritt__melden'
const BEFEHL = 'fortschritt'
const AKZENT = '#D97757'
const GRUEN = '#8FBF7F'
const OFFEN = '#3A3D4A'
const BALKEN = 24
const TAKT_MS = 1000
// Die Hinweiszeile ist eingerückt, der Balken soll nicht umbrechen.
const RAND_UNTEN = 4

const lauf = atom({ plugin: 'fortschritt', key: 'lauf' } as const, null)
const jetzt = atom({ plugin: 'fortschritt', key: 'jetzt' } as const, 0)

type Elemente = Pick<Elements['terminal'], 'Box' | 'Text'>

// Die Balkenzeile, unter dem, was die Stelle sonst zeigt (etwa ein anderer Mod).
const balkenzeile = (
  { Box, Text }: Elemente,
  offen: Lauf,
  zeit: number,
  breite: number,
  darunter: RenderElement,
): RenderElement => {
  const istZuEnde = offen.ende !== null
  const zeile = aktuell(offen)
  const vergangen = dauer((offen.ende ?? Math.max(zeit, offen.start)) - offen.start)

  return (
    <Box flexDirection="column">
      {darunter}
      <Box paddingX={2} width={breite}>
        <Text color={AKZENT}>◆ </Text>
        <Text bold wrap="truncate-end">{`${offen.titel}  `}</Text>
        {leiste(offen, BALKEN).map(teil => (
          <Text color={teil.istFertig ? GRUEN : OFFEN}>{teil.zeichen}</Text>
        ))}
        {istZuEnde ? (
          <Text color={GRUEN} bold>{`  ✓ fertig `}</Text>
        ) : (
          <Text bold>{`  ${offen.fertig}/${gesamt(offen)} `}</Text>
        )}
        {!istZuEnde && zeile !== '' && (
          <Text wrap="truncate-end">{`· ${zeile} `}</Text>
        )}
        <Text dimColor>{istZuEnde ? `in ${vergangen}` : vergangen}</Text>
      </Box>
    </Box>
  )
}

// Lässt die Uhr im Balken laufen, solange etwas läuft.
const ticke = async ($: EngineInterface): Promise<void> => {
  const offen = await read($, lauf)

  if (offen === null || offen.ende !== null) {
    return
  }

  const zeit = await $.clock.now()

  await update($, jetzt, () => zeit)
}

export const register: Register = (on, options) => {
  let takt: Timer | undefined

  on('session.start', async ($, e, next) => {
    const gestartet = await next(e)

    await $.tool.register({
      name: 'melden',
      description:
        'Zeigt dem Nutzer einen Fortschrittsbalken am Eingabefeld. ' +
        'Bei jeder Aufgabe mit drei oder mehr Arbeitsschritten aufrufen: einmal zu Beginn mit `titel` und `schritte`, ' +
        'danach nach jedem erledigten Schritt mit `fertig`, am Ende mit `abgeschlossen: true`. ' +
        'Ändert sich der Plan, `schritte` neu schicken. Ausgelassene Felder behalten ihren Wert. ' +
        'Billig und still: der Aufruf zeichnet nur den Balken und ersetzt keine Nachricht an den Nutzer.',
      isDeferred: false,
      inputSchema: {
        type: 'object',
        properties: {
          titel: {
            type: 'string',
            description: 'Die Aufgabe in wenigen Wörtern, auf Deutsch.',
          },
          schritte: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Der Plan in 3 bis 8 kurzen Schritten, in Reihenfolge, auf Deutsch.',
          },
          fertig: {
            type: 'integer',
            minimum: 0,
            description: 'Wie viele Schritte erledigt sind.',
          },
          notiz: {
            type: 'string',
            description:
              'Was gerade läuft, wenige Wörter. Ohne Notiz steht dort der nächste offene Schritt.',
          },
          abgeschlossen: {
            type: 'boolean',
            description: 'True, sobald die Aufgabe fertig ist.',
          },
        },
      },
    })
    await $.command.register({
      name: BEFEHL,
      description: 'Fortschrittsbalken ausblenden',
    })
    takt?.cancel()
    takt = $.clock.every(TAKT_MS, () => void ticke($))

    return gestartet
  })

  on('tool.call', { tool: WERKZEUG }, async ($, e) => {
    const zeit = await $.clock.now()
    const neu = await update($, lauf, alt =>
      uebernimm(alt ?? null, e as unknown as Meldung, zeit),
    )

    await update($, jetzt, () => zeit)

    return { result: neu === null ? 'ok' : antwort(neu) }
  })

  on('command.run', { command: BEFEHL }, async $ => {
    await update($, lauf, () => null)

    return { text: 'Fortschrittsbalken ausgeblendet.' }
  })

  // Ein abgeschlossener Lauf bleibt stehen, bis die nächste Nachricht kommt.
  on('prompt.submit', async ($, e, next) => {
    const letzter = await read($, lauf)

    if (letzter !== null && letzter.ende !== null) {
      await update($, lauf, () => null)
    }

    return next(e)
  })

  // Unter dem Eingabefeld: hängt den Balken an die Hinweiszeile.
  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    const offen = await read($, lauf)
    const zeit = await read($, jetzt)
    const darunter = await next(e)

    if (options.position === 'oben' || offen === null) {
      return darunter
    }

    return balkenzeile(
      $.ui.resolve(e),
      offen,
      zeit,
      Math.max(40, (e.viewport?.columns ?? 104) - RAND_UNTEN),
      darunter,
    )
  })

  // Über dem Eingabefeld, wenn die Einstellung es so will.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const offen = await read($, lauf)
    const zeit = await read($, jetzt)
    const darunter = await next(e)

    if (options.position !== 'oben' || e.props.hasSurvey || offen === null) {
      return darunter
    }

    return balkenzeile(
      $.ui.resolve(e),
      offen,
      zeit,
      Math.max(40, e.props.bodyColumns),
      darunter,
    )
  })
}
