import type { RenderElement } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { auftrag, korrektur, kurz } from '../hooks/erkennen'

test('erkennt Korrekturen an der Wortwahl', () => {
  expect(
    [
      'nein, in dem Repo nehmen wir immer pnpm',
      'Nö das passt so nicht',
      'ab jetzt bitte immer erst fragen',
      'das sieht nicht gut aus, mach es schlichter',
      'merk dir: Untertitel auf Englisch',
      'nimm stattdessen YuE2',
      'bitte immer erst den Ordner prüfen',
      'no, from now on use tabs',
    ].map(text => korrektur(text) !== null),
  ).toEqual([true, true, true, true, true, true, true, true])
})

test('lässt normale Nachrichten, Befehle und lange Texte in Ruhe', () => {
  expect(
    [
      'moin mein lieber, das Gespräch lief super',
      'ja safe, die Auswahl klingt gut',
      'neue Idee für den Schnitt',
      'kannst du noch einen Knopf einbauen?',
      '/merken aus',
      `nein ${'x'.repeat(700)}`,
      '',
    ].map(korrektur),
  ).toEqual([null, null, null, null, null, null, null])
})

test('kürzt das Zitat und nennt es im Auftrag', () => {
  expect(kurz('a'.repeat(200)).length).toBe(141)
  expect(auftrag('immer pnpm')).toContain('„immer pnpm“')
})

const band = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 10,
  bodyColumns: 110,
  scroll: { offset: 0, bodyRows: 10 },
  view: {},
}

test('bietet die Korrektur an und übergibt sie auf Knopfdruck', async ($, on) => {
  const gesendet: string[] = []

  const uhr = mock.clock(on, { now: 1000 })

  mock.store(on)
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('prompt.submit', (_$, e) => {
    gesendet.push(e.text)

    return { text: e.text }
  })
  on('ui.render', ($e, e) => h($e.ui.resolve(e).Box, {}) as RenderElement)

  await $.session.start({ cwd: 'C:/Coding', surface: 'terminal', isInteractive: true })

  const tippe = (text: string) =>
    $.prompt.submit({ text, wait: false, origin: { kind: 'composer' } })
  const zeige = () =>
    $.ui.mount({ plugin: 'merker', surface: 'terminal', component: 'AbovePrompt', props: band })

  await tippe('wie spät ist es')

  const leer = await zeige()

  expect(await leer.find({ type: 'Text', text: 'Als Regel merken?' })).toBeUndefined()
  await leer.unmount()

  await tippe('nein, wir nehmen immer pnpm statt npm')

  const frage = await zeige()

  expect(await frage.find({ type: 'Text', text: 'Als Regel merken?' })).toBeDefined()
  await frage.press({ key: 'merken' })
  await uhr.advance(300)
  await frage.unmount()

  expect(gesendet.at(-1)).toContain('„nein, wir nehmen immer pnpm statt npm“')

  const danach = await zeige()

  expect(await danach.find({ type: 'Text', text: 'Als Regel merken?' })).toBeUndefined()
  await danach.unmount()
})

test('/merken speichert eigenen Text und schaltet die Erkennung', async ($, on) => {
  const gesendet: string[] = []

  const uhr = mock.clock(on, { now: 1000 })

  mock.store(on)
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('prompt.submit', (_$, e) => {
    gesendet.push(e.text)

    return { text: e.text }
  })
  on('ui.render', ($e, e) => h($e.ui.resolve(e).Box, {}) as RenderElement)

  await $.session.start({ cwd: 'C:/Coding', surface: 'terminal', isInteractive: true })

  const befehl = (args: string) =>
    $.command.run({
      command: 'merken',
      args,
      origin: { kind: 'composer' },
      presentation: { isFullscreen: false, columns: 110 },
    })

  expect(await befehl('')).toEqual({
    text: 'Gerade liegt keine Korrektur vor. /merken <Text> speichert eine eigene Regel.',
  })
  expect(await befehl('Untertitel immer einzeilig')).toEqual({ text: 'Wird als Regel gespeichert.' })
  await uhr.advance(300)
  expect(gesendet.at(-1)).toContain('„Untertitel immer einzeilig“')

  await befehl('aus')
  await $.prompt.submit({ text: 'nein, so nicht', wait: false, origin: { kind: 'composer' } })

  const aus = await $.ui.mount({
    plugin: 'merker',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: band,
  })

  expect(await aus.find({ type: 'Text', text: 'Als Regel merken?' })).toBeUndefined()
  await aus.unmount()
})
