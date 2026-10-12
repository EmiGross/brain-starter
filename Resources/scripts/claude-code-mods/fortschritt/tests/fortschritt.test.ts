import type { RenderElement } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { aktuell, dauer, leiste, uebernimm } from '../hooks/lauf'

const PLAN = ['Footage sichten', 'Schnittplan bauen', 'XML schreiben']
const OBEN = {
  surface: 'terminal',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: true,
    maxRows: 10,
    bodyColumns: 110,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

test('ein neuer Lauf beginnt bei null und zeigt den ersten Schritt', () => {
  const lauf = uebernimm(null, { titel: 'Rohschnitt', schritte: PLAN }, 1000)

  expect(lauf).toEqual({
    titel: 'Rohschnitt',
    schritte: PLAN,
    fertig: 0,
    notiz: '',
    start: 1000,
    ende: null,
  })
  expect(aktuell(lauf)).toBe('Footage sichten')
})

test('eine Meldung schreibt fort, ein anderer Titel fängt neu an', () => {
  const erster = uebernimm(null, { titel: 'Rohschnitt', schritte: PLAN }, 1000)
  const weiter = uebernimm(erster, { fertig: 2, notiz: 'Clips zählen' }, 5000)
  const zuViel = uebernimm(weiter, { fertig: 9 }, 6000)
  const fertig = uebernimm(zuViel, { abgeschlossen: true }, 9000)
  const neu = uebernimm(weiter, { titel: 'Musik', schritte: ['a', 'b'] }, 7000)

  expect([weiter.fertig, weiter.start, aktuell(weiter)]).toEqual([
    2,
    1000,
    'Clips zählen',
  ])
  expect(zuViel.fertig).toBe(3)
  expect([fertig.fertig, fertig.ende]).toEqual([3, 9000])
  expect([neu.titel, neu.fertig, neu.start]).toEqual(['Musik', 0, 7000])
  expect(uebernimm(fertig, { fertig: 1 }, 9500).start).toBe(9500)
})

test('der Balken füllt genau die Breite, die Zeit steht in Minuten', () => {
  const lauf = uebernimm(null, { titel: 'x', schritte: PLAN, fertig: 1 }, 0)

  expect(leiste(lauf, 24).map(teil => teil.zeichen.length)).toEqual([8, 16])
  expect(
    leiste(uebernimm(lauf, { abgeschlossen: true }, 1), 24).map(
      teil => teil.zeichen.length,
    ),
  ).toEqual([24])
  expect([0, 61_000, 3_725_000].map(dauer)).toEqual(['0:00', '1:01', '1:02:05'])
})

test('zeichnet den Balken und räumt ihn nach der nächsten Nachricht', async ($, on) => {
  const uhr = mock.clock(on, { now: 1_000_000 })

  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('tool.register', (_$, e) => ({ value: { tool: `mcp__fortschritt__${e.name}` } }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('prompt.submit', (_$, e) => ({ text: e.text }))
  on('ui.render', ($e, e) => h($e.ui.resolve(e).Box, {}) as RenderElement)

  await $.session.start({
    cwd: 'C:/Coding',
    surface: 'terminal',
    isInteractive: true,
  })

  const band = () =>
    $.ui.mount({
      plugin: 'fortschritt',
      surface: 'terminal',
      component: 'PromptHint',
      props: { isDraft: false, isWorking: true, hint: '? for shortcuts' },
    })

  const leer = await band()

  expect(await leer.find({ type: 'Text', text: 'Rohschnitt' })).toBeUndefined()
  await leer.unmount()

  const gemeldet = await $.tool.call({
    tool: 'mcp__fortschritt__melden',
    tool_use_id: 't1',
    titel: 'Rohschnitt',
    schritte: PLAN,
  } as never)

  expect(gemeldet).toEqual({ result: 'ok: Rohschnitt 0/3' })

  await uhr.advance(65_000)
  await $.tool.call({
    tool: 'mcp__fortschritt__melden',
    tool_use_id: 't2',
    fertig: 1,
  } as never)

  const laufend = await band()

  expect(await laufend.find({ type: 'Text', text: 'Rohschnitt' })).toBeDefined()
  expect(await laufend.find({ type: 'Text', text: '1/3' })).toBeDefined()
  expect(
    await laufend.find({ type: 'Text', text: 'Schnittplan bauen' }),
  ).toBeDefined()
  expect(await laufend.find({ type: 'Text', text: '1:05' })).toBeDefined()
  await laufend.unmount()

  await $.tool.call({
    tool: 'mcp__fortschritt__melden',
    tool_use_id: 't3',
    abgeschlossen: true,
  } as never)

  const fertig = await band()

  expect(await fertig.find({ type: 'Text', text: '✓ fertig' })).toBeDefined()
  await fertig.unmount()

  // Über dem Eingabefeld bleibt es leer, solange die Einstellung „unten" ist.
  const oben = await $.ui.mount({ ...OBEN, plugin: 'fortschritt' })

  expect(await oben.find({ type: 'Text', text: 'Rohschnitt' })).toBeUndefined()
  await oben.unmount()

  await $.prompt.submit({ text: 'weiter', wait: false, origin: { kind: 'composer' } })

  const danach = await band()

  expect(await danach.find({ type: 'Text', text: 'Rohschnitt' })).toBeUndefined()
  await danach.unmount()
})

test(
  'steht über dem Eingabefeld, wenn die Einstellung es so will',
  { options: { position: 'oben' } },
  async ($, on) => {
    mock.clock(on, { now: 1_000_000 })

    on('session.start', (_$, e) => ({ cwd: e.cwd }))
    on('tool.register', (_$, e) => ({ value: { tool: `mcp__fortschritt__${e.name}` } }))
    on('command.register', (_$, e) => ({ value: { command: e.name } }))
    on('ui.render', ($e, e) => h($e.ui.resolve(e).Box, {}) as RenderElement)

    await $.session.start({
      cwd: 'C:/Coding',
      surface: 'terminal',
      isInteractive: true,
    })
    await $.tool.call({
      tool: 'mcp__fortschritt__melden',
      tool_use_id: 't1',
      titel: 'Rohschnitt',
      schritte: PLAN,
    } as never)

    const oben = await $.ui.mount({ ...OBEN, plugin: 'fortschritt' })

    expect(await oben.find({ type: 'Text', text: 'Rohschnitt' })).toBeDefined()
    await oben.unmount()

    const unten = await $.ui.mount({
      plugin: 'fortschritt',
      surface: 'terminal',
      component: 'PromptHint',
      props: { isDraft: false, isWorking: true, hint: '? for shortcuts' },
    })

    expect(await unten.find({ type: 'Text', text: 'Rohschnitt' })).toBeUndefined()
    await unten.unmount()
  },
)
