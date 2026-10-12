import { atom, read, update } from 'claude-code'
import type {
  Elements,
  EngineInterface,
  Register,
  RenderElement,
  Timer,
} from 'claude-code'

import { abstand, auswahl, etikett, leseTermine } from './termine'
import type { Termin } from '../types'

const NOTIZ = /^\d{4}-\d{2}-\d{2}\.md$/
// Vom Arbeitsordner aus: der Vault selbst, sonst ein Vault-Ordner `Brain/` darin oder daneben.
const ORTE = ['Daily', 'Brain/Daily', '../Brain/Daily', '../../Brain/Daily']
const ALLE_MS = 10 * 60_000
const AKZENT = '#D97757'

const termine = atom({ plugin: 'brain-zeile', key: 'termine' } as const, [])
const heute = atom({ plugin: 'brain-zeile', key: 'heute' } as const, '')

// Der Kalendertag in Deutschland, auch wenn die Umgebung in UTC rechnet.
const tagIn = (ms: number): string => {
  const teile = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(ms))
  const teil = (art: string): string =>
    teile.find(t => t.type === art)?.value ?? ''

  return `${teil('year')}-${teil('month')}-${teil('day')}`
}

const findeOrdner = async ($: EngineInterface): Promise<string | undefined> => {
  for (const ort of ORTE) {
    if (await $.fs.exists(ort)) {
      return ort
    }
  }

  return undefined
}

const aktualisiere = async ($: EngineInterface): Promise<void> => {
  try {
    const tag = tagIn(await $.clock.now())
    const ordner = await findeOrdner($)

    if (ordner === undefined) {
      return
    }

    const neueste = (await $.fs.list(ordner))
      .filter(eintrag => eintrag.kind === 'file' && NOTIZ.test(eintrag.name))
      .map(eintrag => eintrag.name)
      .sort()
      .at(-1)

    if (neueste === undefined) {
      return
    }

    const notiz = await $.fs.read(`${ordner}/${neueste}`)
    await update($, termine, () => leseTermine(notiz, tag))
    await update($, heute, () => tag)
  } catch (fehler) {
    $.ui.log(`Daily-Note nicht gelesen: ${String(fehler)}`, { to: 'debug' })
  }
}

type Elemente = Pick<Elements['terminal'], 'Box' | 'Text'>

// Die Zeile selbst, unter dem, was die Stelle sonst zeigt (etwa ein anderer Mod).
const zeile = (
  { Box, Text }: Elemente,
  liste: Termin[],
  tag: string,
  darunter: RenderElement,
): RenderElement => (
  <Box flexDirection="column">
    {darunter}
    <Box paddingX={2}>
      <Text color={AKZENT}>◆ </Text>
      <Text bold>Als Nächstes </Text>
      {auswahl(liste, tag).map((termin, stelle) => {
        const tage = abstand(termin, tag)
        const stil =
          tage < 0
            ? { color: 'error' }
            : tage === 0
              ? { color: 'warning' }
              : {}

        return (
          <Text {...stil} wrap="truncate-end">
            {stelle > 0 ? ' · ' : ''}
            {etikett(termin, tag)}
          </Text>
        )
      })}
    </Box>
  </Box>
)

export const register: Register = (on, options) => {
  let takt: Timer | undefined

  on('session.start', async ($, e, next) => {
    await aktualisiere($)
    takt?.cancel()
    takt = $.clock.every(ALLE_MS, () => void aktualisiere($))

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const fertig = await next(e)
    await aktualisiere($)

    return fertig
  })

  // Unter dem Eingabefeld: hängt die Zeile an die Hinweiszeile.
  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    const liste = await read($, termine)
    const tag = await read($, heute)
    const darunter = await next(e)

    if (options.position === 'oben' || liste.length === 0 || tag === '') {
      return darunter
    }

    return zeile($.ui.resolve(e), liste, tag, darunter)
  })

  // Über dem Eingabefeld, wenn die Einstellung es so will.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const liste = await read($, termine)
    const tag = await read($, heute)
    const darunter = await next(e)

    if (
      options.position !== 'oben' ||
      e.props.hasSurvey ||
      liste.length === 0 ||
      tag === ''
    ) {
      return darunter
    }

    return zeile($.ui.resolve(e), liste, tag, darunter)
  })
}
