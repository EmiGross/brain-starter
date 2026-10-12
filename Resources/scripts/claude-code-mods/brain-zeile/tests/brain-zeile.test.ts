import type { RenderElement } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { auswahl, etikett, leseTermine } from '../hooks/termine'

const HEUTE = '2026-10-06'
const NOTIZ = [
  '## Tasks',
  '- [ ] **Projektbericht: Kapitel 2 (Entwurf) bis So, 18.10.** — 2.1 Aufgabenbereiche',
  '- [x] ⏰ **Erstgespräch mit [[studio-nord]] am Di, 06.10., 12:30 Uhr** — erledigt',
  '- [ ] **Rückmeldung von [[studio-nord]] abwarten, zugesagt für Mi, 07.10.** — bei positivem Ausgang',
  '- [ ] ⏰ **Kundentermin bei [[musterfirma]] am Mi, 07.10., 15:30 Uhr** — digital',
  '- [ ] ⏰ **Telefonat mit Alex von [[beispiel-gmbh]]** — Do, 08.10. oder Fr, 09.10., zwischen 11 und 14 Uhr',
  '- [ ] **Bei den acht vom 02.10. nachfassen, wenn bis 16.10. nichts kommt** — [[versandhaus]] *(06.10.: bleiben fünf)*',
  '- [ ] **Bei [[agentur-west]] nachfassen, wenn bis zum 05.10. nichts kommt** — abgeschickt am 21.09.',
  '- [ ] **API-Key rotieren** — **mache ich selbst** (01.09. zugesagt)',
  '- [ ] [[sommerfest]]: **Ticket-Shop schliessen** — Kontingent `Workshop-Plätze · Mi 26.08.`',
  '- [ ] LinkedIn: Post texten *(05.10.: wäre der erste Post überhaupt)*',
  '- [ ] ⏰ **LinkedIn Premium kündigen** — Start 05.10.2026, spätestens am 02.01.2027 kündigen',
  '- [ ] Patronen bestellen — 920XL-Multipack, 16,59 €',
].join('\n')

test('liest Termine aus den offenen Aufgaben', () => {
  expect(leseTermine(NOTIZ, HEUTE)).toEqual([
    {
      tag: '2026-10-07',
      zeit: '15:30',
      titel: 'Kundentermin bei musterfirma',
    },
    {
      tag: '2026-10-07',
      zeit: null,
      titel: 'Rückmeldung von studio-nord abwarten',
    },
    { tag: '2026-10-08', zeit: null, titel: 'Telefonat mit Alex von beispiel-gmbh' },
    {
      tag: '2026-10-16',
      zeit: null,
      titel: 'Bei den acht vom 02.10. nachfassen',
    },
    {
      tag: '2026-10-18',
      zeit: null,
      titel: 'Projektbericht: Kapitel 2 (Entwurf)',
    },
    { tag: '2027-01-02', zeit: null, titel: 'LinkedIn Premium kündigen' },
    { tag: '2026-10-05', zeit: null, titel: 'Bei agentur-west nachfassen' },
  ])
})

test('nennt heute, morgen, Wochentag und Überfälliges', () => {
  const zeigt = (tag: string, zeit: string | null): string =>
    etikett({ tag, zeit, titel: 'Call' }, HEUTE)

  expect(zeigt('2026-10-06', '12:30')).toBe('heute 12:30 Call')
  expect(zeigt('2026-10-07', null)).toBe('morgen Call')
  expect(zeigt('2026-10-18', null)).toBe('So 18.10. Call')
  expect(zeigt('2026-10-05', null)).toBe('überfällig seit 05.10. Call')
})

test('ein Datum ohne Jahr nach dem Jahreswechsel liegt im nächsten Jahr', () => {
  const notiz = '- [ ] **Rechnung prüfen bis 05.01.** — steht an'

  expect(leseTermine(notiz, '2026-12-20')[0]?.tag).toBe('2027-01-05')
})

test('zeigt nur den nächsten Termin, einen zweiten nur für heute', () => {
  const termin = (tag: string, titel: string) => ({ tag, zeit: null, titel })
  const morgen = [termin('2026-10-07', 'A'), termin('2026-10-07', 'B')]
  const jetzt = [termin(HEUTE, 'A'), termin(HEUTE, 'B'), termin(HEUTE, 'C')]

  expect(auswahl(morgen, HEUTE)).toEqual(morgen.slice(0, 1))
  expect(auswahl(jetzt, HEUTE)).toEqual(jetzt.slice(0, 2))
  expect(auswahl([], HEUTE)).toEqual([])
})

test('zeichnet die Zeile aus der neuesten Daily-Note', async ($, on) => {
  const datei = (name: string) => ({
    name,
    kind: 'file' as const,
    size: 1,
    mtimeMs: 1,
    isLink: false,
  })
  const gelesen: string[] = []
  const pfad = (roh: string): string => roh.replaceAll('\\', '/')

  mock.clock(on, { now: Date.UTC(2026, 9, 6, 10) })
  on('fs.exists', (_$, e) => ({
    value: pfad(e.path).endsWith('/brain-zeile/Brain/Daily'),
  }))
  on('fs.list', () => ({
    value: [
      datei('2026-10-05.md'),
      datei('2026-10-06.md'),
      datei('CLAUDE.md'),
    ],
  }))
  on('fs.read', (_$, e) => {
    gelesen.push(pfad(e.path).split('/').slice(-3).join('/'))

    return { value: NOTIZ }
  })
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('ui.render', ($e, e) => h($e.ui.resolve(e).Box, {}) as RenderElement)

  await $.session.start({
    cwd: 'C:/Coding',
    surface: 'terminal',
    isInteractive: true,
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({
      plugin: 'brain-zeile',
      surface,
      component: 'PromptHint',
      props: { isDraft: false, isWorking: false, hint: '? for shortcuts' },
    })

    expect(
      await ui.find({
        type: 'Text',
        text: 'morgen 15:30 Kundentermin bei musterfirma',
      }),
    ).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Als Nächstes' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'studio-nord' })).toBe(
      undefined,
    )
    await ui.unmount()
  }

  expect(gelesen).toEqual(['Brain/Daily/2026-10-06.md'])
})
