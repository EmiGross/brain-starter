import type { RenderElement, SessionUsage } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { ausMessung, balken, legende, rat, zahl } from '../hooks/anzeige'

const zeile = (
  name: string,
  tokens: number,
  color: string,
  kind: 'used' | 'free' | 'buffer' | 'deferred' = 'used',
) => ({ name, tokens, color, isDeferred: kind === 'deferred', kind })

const messung = (percentage: number): SessionUsage => ({
  startedAt: 0,
  context: {
    window: 1_000_000,
    breakdown: {
      categories: [
        zeile('System prompt', 4200, 'promptBorder'),
        zeile('MCP tools', 52_000, 'permission'),
        zeile('Messages', 0, 'claude'),
        zeile('MCP tools (deferred)', 9000, 'inactive', 'deferred'),
        zeile('Free space', 930_800, 'promptBorder', 'free'),
        zeile('Autocompact buffer', 13_000, 'inactive', 'buffer'),
      ],
      totalTokens: 56_200,
      maxTokens: 1_000_000,
      rawMaxTokens: 1_000_000,
      autocompactSource: 'model-default',
      percentage,
      gridRows: [],
      model: 'Opus',
      memoryFiles: [],
      mcpTools: [],
      agents: [],
      autoCompactThreshold: 987_000,
      isAutoCompactEnabled: true,
      apiUsage: null,
    },
  },
  rateLimits: [
    { kind: 'five_hour', percentUsed: 12.4 },
    { kind: 'spend_limit', percentUsed: 5 },
  ],
})

test('schreibt Tokenzahlen kurz', () => {
  expect([0, 897, 4200, 17_000, 897_000, 1_000_000, 1_250_000].map(zahl)).toEqual(
    ['0', '897', '4,2k', '17k', '897k', '1M', '1,3M'],
  )
})

test('übernimmt die Aufteilung ohne nachgeladene Tools', () => {
  const stand = ausMessung(messung(6))

  expect(stand?.teile.map(teil => teil.name)).toEqual([
    'System-Prompt',
    'MCP-Tools',
    'Nachrichten',
    'frei',
    'Puffer',
  ])
  expect(stand?.limits).toEqual([{ fenster: '5 h', prozent: 12 }])
  expect(ausMessung({ ...messung(6), context: { window: 1 } })).toBe(null)
})

test('der Balken füllt genau die Breite und setzt die Marke', () => {
  const stand = ausMessung(messung(6))

  if (stand === null) {
    throw new Error('kein Stand')
  }

  const abschnitte = balken(stand, 100)

  expect(abschnitte.map(teil => teil.zeichen.length)).toEqual([1, 5, 93, 1])
  expect(abschnitte[3]?.zeichen).toBe('│')
  expect(abschnitte.map(teil => teil.zeichen).join('').length).toBe(100)
  expect(balken(stand, 40, true).map(teil => teil.zeichen[0])).toEqual([
    '━',
    '━',
    '━',
    '┃',
  ])
})

test('die Legende nennt Anteile, beim freien Platz nur die Menge', () => {
  const stand = ausMessung(messung(6))
  const einträge = stand === null ? [] : legende(stand)

  expect(einträge.map(e => [e.name, e.anteil])).toEqual([
    ['System-Prompt', 0],
    ['MCP-Tools', 5],
    ['Nachrichten', 0],
    ['frei', null],
  ])
})

test('rät ab 70 % zu /wrap und ab 85 % dringend', () => {
  expect([69, 70, 85].map(rat)).toEqual(['', 'bald /wrap', 'jetzt /wrap'])
})

test('startet klein, klappt mit /kontext auf und warnt einmal', async ($, on) => {
  const hinweise: string[] = []
  let prozent = 6

  on('session.usage', () => ({ value: messung(prozent) }))
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  on('ui.status', () => ({ value: undefined }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('ui.toast', (_$, e) => {
    hinweise.push(e.text)

    return { value: undefined }
  })
  on('ui.render', ($e, e) => h($e.ui.resolve(e).Box, {}) as RenderElement)

  await $.session.start({
    cwd: 'C:/Coding',
    surface: 'terminal',
    isInteractive: true,
  })

  // Ohne Einstellung beginnt jede Sitzung klein.
  const kleinUi = await $.ui.mount({
    plugin: 'kontext-anzeige',
    surface: 'terminal',
    component: 'PromptHint',
    props: { isDraft: false, isWorking: false, hint: '? for shortcuts' },
  })

  expect(await kleinUi.find({ type: 'Text', text: ' 6 % ' })).toBeDefined()
  expect(await kleinUi.find({ type: 'Text', text: 'MCP-Tools' })).toBeUndefined()
  await kleinUi.unmount()

  // /kontext klappt den Kasten für diese Sitzung auf.
  const antwort = await $.command.run({
    command: 'kontext',
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 110 },
  })

  expect(antwort).toEqual({
    text: 'Kontext-Anzeige ist jetzt groß. /kontext schaltet zurück.',
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({
      plugin: 'kontext-anzeige',
      surface,
      component: 'PromptHint',
      props: { isDraft: false, isWorking: false, hint: '? for shortcuts' },
    })

    expect(await ui.find({ type: 'Text', text: 'Kontext' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: ' 6 % ' })).toBeDefined()
    expect(
      await ui.find({ type: 'Text', text: 'komprimiert bei 987k' }),
    ).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'MCP-Tools' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Limit 5 h 12 %' })).toBeDefined()
    await ui.unmount()
  }

  const gemessen = {
    context: { window: 1_000_000 },
    rateLimits: [],
    changed: ['context' as const],
  }

  prozent = 86
  await $.session.measure(gemessen)
  prozent = 90
  await $.session.measure(gemessen)

  expect(hinweise).toEqual([
    'Kontext zu 86 % voll. Zeit für /wrap und einen neuen Chat.',
  ])
})

test(
  'steht mit der Einstellung "oben" wieder über dem Eingabefeld, auf Wunsch groß',
  { options: { position: 'oben', start: 'groß' } },
  async ($, on) => {
    on('session.usage', () => ({ value: messung(6) }))
    on('session.start', (_$, e) => ({ cwd: e.cwd }))
    on('ui.status', () => ({ value: undefined }))
    on('command.register', (_$, e) => ({ value: { command: e.name } }))
    on('ui.render', ($e, e) => h($e.ui.resolve(e).Box, {}) as RenderElement)

    await $.session.start({
      cwd: 'C:/Coding',
      surface: 'terminal',
      isInteractive: true,
    })

    const oben = await $.ui.mount({
      plugin: 'kontext-anzeige',
      surface: 'terminal',
      component: 'AbovePrompt',
      props: {
        hasSurvey: false,
        isWorking: false,
        maxRows: 10,
        bodyColumns: 104,
        scroll: { offset: 0, bodyRows: 10 },
        view: {},
      },
    })

    expect(await oben.find({ type: 'Text', text: 'Kontext' })).toBeDefined()
    await oben.unmount()

    const unten = await $.ui.mount({
      plugin: 'kontext-anzeige',
      surface: 'terminal',
      component: 'PromptHint',
      props: { isDraft: false, isWorking: false, hint: '? for shortcuts' },
    })

    expect(await unten.find({ type: 'Text', text: 'Kontext' })).toBeUndefined()
    await unten.unmount()
  },
)
