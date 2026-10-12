import { atom, read, update } from 'claude-code'
import type {
  Elements,
  EngineInterface,
  Register,
  RenderElement,
} from 'claude-code'

import {
  JETZT,
  ausMessung,
  balken,
  legende,
  limitText,
  rat,
  stufe,
  zahl,
} from './anzeige'
import type { KontextStand } from '../types'

const AKZENT = '#D97757'
const DUNKEL = '#16171D'
const NACH_CLEAR_MS = 1500
// Die Hinweiszeile ist eingerückt, der Kasten soll nicht umbrechen.
const RAND_UNTEN = 4
const BEFEHL = 'kontext'
const MERKER = 'klein'

const stand = atom({ plugin: 'kontext-anzeige', key: 'stand' } as const, null)
const klein = atom({ plugin: 'kontext-anzeige', key: 'klein' } as const, false)

let hatGewarnt = false

// Zählt den Kontext wie /context, aber geschätzt und ohne eigene Anfrage.
const messe = async ($: EngineInterface): Promise<void> => {
  const neu = ausMessung(await $.session.usage({ breakdown: 'summary' }))

  if (neu === null) {
    return
  }

  const istVoll = neu.prozent >= JETZT

  await update($, stand, () => neu)

  if (istVoll && !hatGewarnt) {
    $.ui.toast(
      `Kontext zu ${neu.prozent} % voll. Zeit für /wrap und einen neuen Chat.`,
      { timeoutMs: 8000 },
    )
  }

  hatGewarnt = istVoll
}

// Die Ansicht gilt über die Sitzung hinaus.
const ladeAnsicht = async ($: EngineInterface): Promise<void> => {
  const gemerkt = (await $.store.get(MERKER)) === true

  await update($, klein, () => gemerkt)
}

const schalteUm = async ($: EngineInterface): Promise<boolean> => {
  const neu = !(await read($, klein))

  await update($, klein, () => neu)
  await $.store.set(MERKER, neu)

  return neu
}

type Elemente = Pick<Elements['terminal'], 'Box' | 'Button' | 'Text'>
// Der Knopf zum Umschalten, nur wo die Oberfläche Klicks meldet.
type Knopf = (() => void) | null

// Der Kasten selbst, unter dem, was die Stelle sonst zeigt (etwa ein anderer Mod).
const kasten = (
  { Box, Button, Text }: Elemente,
  aktuell: KontextStand,
  breite: number,
  darunter: RenderElement,
  umschalten: Knopf,
): RenderElement => {
  const farbe = stufe(aktuell.prozent)
  const hinweis = rat(aktuell.prozent)
  const limits = limitText(aktuell)
  const schwelle =
    aktuell.komprimiertBei === null
      ? ''
      : ` · komprimiert bei ${zahl(aktuell.komprimiertBei)}`

  return (
    <Box flexDirection="column">
      {darunter}
      <Box
        flexDirection="column"
        width={breite}
        borderStyle="round"
        borderDimColor
        paddingX={1}
      >
        <Box justifyContent="space-between">
          <Box>
            <Text color={AKZENT}>◆ </Text>
            <Text bold>Kontext</Text>
            {limits !== '' && <Text dimColor>{`   Limit ${limits}`}</Text>}
            {umschalten !== null && <Text> </Text>}
            {umschalten !== null && (
              <Button key="ansicht" plain label="▾ klein" onPress={umschalten} />
            )}
          </Box>
          <Box>
            {hinweis !== '' && <Text color={farbe}>{`${hinweis} · `}</Text>}
            <Text bold>{zahl(aktuell.tokens)}</Text>
            <Text dimColor>{` von ${zahl(aktuell.fenster)}${schwelle} `}</Text>
            <Text backgroundColor={farbe} color={DUNKEL} bold>
              {` ${aktuell.prozent} % `}
            </Text>
          </Box>
        </Box>
        <Box>
          {balken(aktuell, breite - 4).map(abschnitt => (
            <Text color={abschnitt.farbe}>{abschnitt.zeichen}</Text>
          ))}
        </Box>
        <Box flexWrap="wrap" columnGap={3}>
          {legende(aktuell).map(eintrag => (
            <Box>
              <Text color={eintrag.farbe}>■ </Text>
              <Text>{`${eintrag.name} `}</Text>
              <Text bold>{zahl(eintrag.tokens)}</Text>
              {eintrag.anteil !== null && (
                <Text dimColor>{` ${eintrag.anteil} %`}</Text>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

// Die kleine Ansicht: eine Zeile mit dünnem Balken, rechts die Tokenzahl.
const streifen = (
  { Box, Button, Text }: Elemente,
  aktuell: KontextStand,
  breite: number,
  darunter: RenderElement,
  umschalten: Knopf,
): RenderElement => {
  const farbe = stufe(aktuell.prozent)
  const hinweis = rat(aktuell.prozent)
  const menge = ` ${zahl(aktuell.tokens)}`
  const fenster = ` von ${zahl(aktuell.fenster)} `
  const ratText = hinweis === '' ? '' : `${hinweis} · `
  const marke = ` ${aktuell.prozent} % `
  const knopf = umschalten === null ? '' : '▸ groß '
  const fest =
    4 + 2 + knopf.length + menge.length + fenster.length + ratText.length + marke.length

  return (
    <Box flexDirection="column">
      {darunter}
      <Box paddingX={2} width={breite}>
        <Text color={AKZENT}>◆ </Text>
        {umschalten !== null && (
          <Button key="ansicht" plain label="▸ groß" onPress={umschalten} />
        )}
        {umschalten !== null && <Text> </Text>}
        {balken(aktuell, Math.max(8, breite - fest), true).map(abschnitt => (
          <Text color={abschnitt.farbe}>{abschnitt.zeichen}</Text>
        ))}
        <Text bold>{menge}</Text>
        <Text dimColor>{fenster}</Text>
        {ratText !== '' && <Text color={farbe}>{ratText}</Text>}
        <Text backgroundColor={farbe} color={DUNKEL} bold>
          {marke}
        </Text>
      </Box>
    </Box>
  )
}

export const register: Register = (on, options) => {
  on('session.start', async ($, e, next) => {
    // Räumt die Statuszeile der ersten Fassung dieses Mods.
    $.ui.status(undefined)
    await $.command.register({
      name: BEFEHL,
      description: 'Kontext-Anzeige klein oder groß schalten',
    })
    await ladeAnsicht($)
    await messe($)

    return next(e)
  })

  on('command.run', { command: BEFEHL }, async $ => ({
    text: (await schalteUm($))
      ? 'Kontext-Anzeige ist jetzt klein. /kontext schaltet zurück.'
      : 'Kontext-Anzeige ist jetzt groß. /kontext schaltet zurück.',
  }))

  on('session.measure', async ($, e, next) => {
    await messe($)

    return next(e)
  })

  // Nach /clear ist der Kontext neu, aber erst, wenn das Ende durch ist.
  on('session.end', ($, e, next) => {
    $.clock.after(NACH_CLEAR_MS, () => void messe($))

    return next(e)
  })

  // Unter dem Eingabefeld: hängt die Anzeige an die Hinweiszeile.
  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    const aktuell = await read($, stand)
    const istKlein = await read($, klein)
    const darunter = await next(e)

    if (options.position === 'oben' || aktuell === null) {
      return darunter
    }

    const breite = Math.max(24, (e.viewport?.columns ?? 104) - RAND_UNTEN)
    // Unter dem Eingabefeld gibt es keinen Tastaturfokus, nur Klicks im Vollbild.
    const umschalten =
      e.viewport?.isFullscreen === true ? () => void schalteUm($) : null

    return (istKlein ? streifen : kasten)(
      $.ui.resolve(e),
      aktuell,
      breite,
      darunter,
      umschalten,
    )
  })

  // Über dem Eingabefeld, wenn die Einstellung es so will.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const aktuell = await read($, stand)
    const istKlein = await read($, klein)
    const darunter = await next(e)

    if (options.position !== 'oben' || e.props.hasSurvey || aktuell === null) {
      return darunter
    }

    return (istKlein ? streifen : kasten)(
      $.ui.resolve(e),
      aktuell,
      Math.max(24, e.props.bodyColumns),
      darunter,
      () => void schalteUm($),
    )
  })
}
