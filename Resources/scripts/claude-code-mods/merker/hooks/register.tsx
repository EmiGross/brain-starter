import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { auftrag, korrektur, kurz } from './erkennen'

const BEFEHL = 'merken'
const SCHALTER = 'aus'
const AKZENT = '#D97757'
const VERSATZ_MS = 200

const kandidat = atom({ plugin: 'merker', key: 'kandidat' } as const, null)

// Übergibt die Korrektur an Claude, das die Regel formuliert und ablegt. Kurz
// versetzt, weil ein Befehl während seines eigenen Laufs nichts abschicken darf.
const speichere = async ($: EngineInterface, zitat: string): Promise<void> => {
  await update($, kandidat, () => null)
  $.clock.after(VERSATZ_MS, () => void $.prompt.submit({ text: auftrag(zitat) }))
}

const verwirf = async ($: EngineInterface): Promise<void> => {
  await update($, kandidat, () => null)
}

const istAus = async ($: EngineInterface): Promise<boolean> =>
  (await $.store.get(SCHALTER)) === true

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const gestartet = await next(e)

    await $.command.register({
      name: BEFEHL,
      description:
        'Letzte Korrektur als Regel speichern. /merken <Text> speichert eine eigene, /merken aus und /merken an schalten die Erkennung',
    })

    return gestartet
  })

  // Eine neue Nachricht ersetzt den Kandidaten oder räumt ihn ab.
  on('prompt.submit', async ($, e, next) => {
    if (e.origin.kind === 'composer') {
      const zitat = (await istAus($)) ? null : korrektur(e.text)

      await update($, kandidat, () => zitat)
    }

    return next(e)
  })

  on('command.run', { command: BEFEHL }, async ($, e) => {
    const eingabe = e.args.trim()

    if (eingabe === 'aus' || eingabe === 'an') {
      await $.store.set(SCHALTER, eingabe === 'aus')
      await verwirf($)

      return {
        text:
          eingabe === 'aus'
            ? 'Merker erkennt keine Korrekturen mehr. /merken <Text> geht weiter, /merken an schaltet zurück.'
            : 'Merker erkennt Korrekturen wieder.',
      }
    }

    const zitat = eingabe === '' ? await read($, kandidat) : eingabe

    if (zitat === null) {
      return {
        text: 'Gerade liegt keine Korrektur vor. /merken <Text> speichert eine eigene Regel.',
      }
    }

    await speichere($, zitat)

    return { text: 'Wird als Regel gespeichert.' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const zitat = await read($, kandidat)
    const darunter = await next(e)

    if (e.props.hasSurvey || zitat === null) {
      return darunter
    }

    const { Box, Button, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {darunter}
        <Box paddingX={2} width={Math.max(40, e.props.bodyColumns)} columnGap={1}>
          <Text color={AKZENT}>◆</Text>
          <Text bold>Als Regel merken?</Text>
          <Text wrap="truncate-end">{`„${kurz(zitat)}“`}</Text>
          <Button
            key="merken"
            hotkey="m"
            variant="primary"
            label="Merken"
            onPress={() => void speichere($, zitat)}
          />
          <Button key="nicht" hotkey="n" label="Nicht" onPress={() => void verwirf($)} />
          <Text dimColor>/merken</Text>
        </Box>
      </Box>
    )
  })
}
