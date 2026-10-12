import type { EngineInterface, Register } from 'claude-code'

import {
  ABBRECHEN,
  AUSFUEHREN,
  absage,
  frage,
  glatt,
  groesse,
  hatPlatzhalter,
  hatVariable,
  klassifiziere,
  namensMuster,
  verbinde,
} from './risiko'
import type { Bericht, Risiko } from './risiko'

const LISTE_MAX = 6
const EINTRAEGE_MAX = 5000
const GIT_MS = 15_000

type Zaehler = {
  dateien: number
  bytes: number
  links: number
  besucht: number
  namen: string[]
  istGekappt: boolean
}

const mal = (anzahl: number, eins: string, viele: string): string =>
  `${anzahl} ${anzahl === 1 ? eins : viele}`

const leer = (): Zaehler => ({
  dateien: 0,
  bytes: 0,
  links: 0,
  besucht: 0,
  namen: [],
  istGekappt: false,
})

const merke = (zaehler: Zaehler, name: string, bytes: number): void => {
  zaehler.dateien += 1
  zaehler.bytes += bytes

  if (zaehler.namen.length < LISTE_MAX) {
    zaehler.namen.push(name)
  }
}

// Der Ordner, in dem der Befehl läuft: der Sitzungsordner, verlegt durch ein
// `cd` oder `git -C` weiter vorn in derselben Zeile.
const ordnerVon = async ($: EngineInterface, risiko: Risiko): Promise<string> => {
  const sitzung = await $.session.cwd()

  return glatt(risiko.ort === null ? sitzung : verbinde(sitzung, await daheim($, risiko.ort)))
}

const daheim = async ($: EngineInterface, pfad: string): Promise<string> => {
  if (!pfad.startsWith('~')) {
    return pfad
  }

  const heim = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME')) ?? '~'

  return heim + pfad.slice(1)
}

// Zählt einen Ordner aus, ohne Verknüpfungen zu folgen.
const zaehleOrdner = async (
  $: EngineInterface,
  start: string,
  anzeige: string,
  zaehler: Zaehler,
): Promise<void> => {
  const offen: [string, string][] = [[start, anzeige]]

  while (offen.length > 0) {
    const [ordner, name] = offen.pop() ?? ['', '']
    const eintraege = await $.fs.list(ordner)

    for (const eintrag of eintraege) {
      zaehler.besucht += 1

      if (zaehler.besucht > EINTRAEGE_MAX) {
        zaehler.istGekappt = true

        return
      }

      if (eintrag.isLink) {
        zaehler.links += 1
      } else if (eintrag.kind === 'dir') {
        offen.push([`${ordner}/${eintrag.name}`, `${name}/${eintrag.name}`])
      } else {
        merke(zaehler, `${name}/${eintrag.name}`, eintrag.size)
      }
    }
  }
}

// Löst ein Ziel in die Pfade auf, die es trifft: ein Platzhalter im letzten
// Namen wird gegen den Ordner darüber gelesen.
const treffer = async ($: EngineInterface, pfad: string): Promise<string[]> => {
  const schnitt = pfad.lastIndexOf('/')
  const ordner = schnitt < 0 ? '.' : pfad.slice(0, schnitt)
  const name = pfad.slice(schnitt + 1)

  if (!hatPlatzhalter(name)) {
    return (await $.fs.exists(pfad)) ? [pfad] : []
  }

  if (hatPlatzhalter(ordner) || !(await $.fs.exists(ordner))) {
    return []
  }

  const muster = namensMuster(name)

  return (await $.fs.list(ordner))
    .filter(eintrag => muster.test(eintrag.name))
    .map(eintrag => `${ordner}/${eintrag.name}`)
}

const messeLoeschen = async (
  $: EngineInterface,
  etikett: string,
  ziele: string[],
  istRekursiv: boolean,
  cwd: string,
): Promise<Bericht> => {
  const zaehler = leer()
  const warnungen: string[] = []
  let ordner = 0
  let gefunden = 0

  for (const ziel of ziele) {
    if (hatVariable(ziel)) {
      warnungen.push(`Das Ziel ${ziel} enthält eine Variable, ich kann es nicht auflösen.`)
      continue
    }

    const pfade = await treffer($, glatt(verbinde(cwd, await daheim($, ziel))))

    if (pfade.length === 0) {
      warnungen.push(`${ziel} trifft im Moment nichts.`)
    }

    for (const pfad of pfade) {
      const stand = await $.fs.stat(pfad, { resolve: true })
      const name = pfad.startsWith(`${cwd}/`) ? pfad.slice(cwd.length + 1) : pfad

      gefunden += 1

      if (stand.isLink) {
        warnungen.push(
          `${name} ist eine Verknüpfung (Junction) nach ${stand.realPath ?? 'unbekannt'}. Windows PowerShell 5.1 löscht bei -Recurse den Inhalt des Ziels mit.`,
        )
      } else if (stand.kind === 'dir') {
        ordner += 1

        if (istRekursiv) {
          await zaehleOrdner($, pfad, name, zaehler)
        }
      } else {
        merke(zaehler, name, stand.size)
      }
    }
  }

  if (zaehler.links > 0) {
    warnungen.push(
      `Darin ${zaehler.links === 1 ? 'liegt' : 'liegen'} ${mal(zaehler.links, 'Verknüpfung (Junction)', 'Verknüpfungen (Junctions)')}. Windows PowerShell 5.1 löscht bei -Recurse auch deren Ziel-Inhalt.`,
    )
  }

  const mehr = zaehler.dateien - zaehler.namen.length
  const menge = zaehler.istGekappt
    ? `über ${zaehler.dateien} Dateien (Zählung nach ${EINTRAEGE_MAX} Einträgen abgebrochen)`
    : `${mal(zaehler.dateien, 'Datei', 'Dateien')}, ${groesse(zaehler.bytes)}`

  return {
    kopf:
      gefunden === 0
        ? `${etikett}: trifft im Moment nichts`
        : `${etikett} löscht ${menge}${ordner > 0 ? ` in ${mal(ordner, 'Ordner', 'Ordnern')}` : ''}`,
    zeilen: mehr > 0 ? [...zaehler.namen, `und ${mehr} weitere`] : zaehler.namen,
    warnungen,
  }
}

const gitZeilen = async ($: EngineInterface, cwd: string, args: string[]): Promise<string[]> => {
  const lauf = await $.process.run(['git', '-C', cwd, ...args], { timeoutMs: GIT_MS })

  if (lauf.exitCode !== 0) {
    throw new Error(lauf.stderr.trim().split('\n')[0] ?? 'git meldet einen Fehler')
  }

  return lauf.stdout.split('\n').filter(zeile => zeile.trim() !== '')
}

const gekuerzt = (zeilen: string[]): string[] =>
  zeilen.length > LISTE_MAX
    ? [...zeilen.slice(0, LISTE_MAX), `und ${zeilen.length - LISTE_MAX} weitere`]
    : zeilen

const messeGit = async (
  $: EngineInterface,
  risiko: Extract<Risiko, { art: 'git' }>,
  cwd: string,
): Promise<Bericht> => {
  if (risiko.unter === 'clean') {
    const schalter = risiko.args.filter(arg => /^-[a-zA-Z]+$/.test(arg)).map(arg => arg.replace(/[fn]/g, ''))
    const weg = await gitZeilen($, cwd, ['clean', '-n', ...schalter.filter(arg => arg !== '-')])

    return {
      kopf: `git clean löscht ${weg.length} unversionierte Einträge unwiederbringlich`,
      zeilen: gekuerzt(weg.map(zeile => zeile.replace(/^Would remove /, ''))),
      warnungen: [],
    }
  }

  if (risiko.unter === 'push') {
    const zweig = (await gitZeilen($, cwd, ['rev-parse', '--abbrev-ref', 'HEAD']))[0] ?? 'unbekannt'

    return {
      kopf: `git push --force überschreibt die Historie auf dem Server (Zweig ${zweig})`,
      zeilen: [],
      warnungen: ['Commits, die nur auf dem Server liegen, gehen verloren.'],
    }
  }

  if (risiko.unter === 'branch') {
    return {
      kopf: `git branch -D löscht den Zweig ${risiko.args.filter(arg => !arg.startsWith('-')).join(', ')}`,
      zeilen: [],
      warnungen: ['Nicht zusammengeführte Commits des Zweigs sind danach schwer wiederzufinden.'],
    }
  }

  if (risiko.unter === 'stash') {
    const ablage = await gitZeilen($, cwd, ['stash', 'list'])

    return {
      kopf: `${risiko.etikett} verwirft zwischengelagerte Änderungen (${ablage.length} im Stash)`,
      zeilen: gekuerzt(ablage),
      warnungen: [],
    }
  }

  const stand = await gitZeilen($, cwd, ['status', '--porcelain'])
  const geaendert = stand.filter(zeile => !zeile.startsWith('??'))

  return {
    kopf: `${risiko.etikett} verwirft die Änderungen an ${geaendert.length} Dateien`,
    zeilen: gekuerzt(geaendert.map(zeile => zeile.slice(3))),
    warnungen: geaendert.length > 0 ? ['Nicht committete Änderungen sind danach weg.'] : [],
  }
}

const messe = async ($: EngineInterface, risiko: Risiko): Promise<Bericht> => {
  try {
    const cwd = await ordnerVon($, risiko)

    if (risiko.art === 'loeschen') {
      return await messeLoeschen($, risiko.etikett, risiko.ziele, risiko.istRekursiv, cwd)
    }

    if (risiko.art === 'spiegeln') {
      const bericht = await messeLoeschen($, 'robocopy /MIR', risiko.ziele, true, cwd)

      return {
        ...bericht,
        kopf: bericht.kopf.replace('löscht', 'gleicht das Ziel an und löscht dort bis zu'),
        warnungen: [...bericht.warnungen, 'Alles im Ziel, was in der Quelle fehlt, wird gelöscht.'],
      }
    }

    if (risiko.art === 'git') {
      return await messeGit($, risiko, cwd)
    }

    const hinweis: Record<string, string> = {
      prozess: 'Beendet Prozesse nach Namen oder Filter, nicht nach PID. Das kann auch das Terminal treffen.',
      laufwerk: 'Verändert ein ganzes Laufwerk.',
      unklar: 'Die Ziele lassen sich aus dem Befehl nicht ablesen.',
    }

    return { kopf: risiko.etikett, zeilen: [], warnungen: [hinweis[risiko.art] ?? ''] }
  } catch (fehler) {
    return {
      kopf: risiko.etikett,
      zeilen: [],
      warnungen: [`Ich konnte nicht messen, was betroffen ist: ${String(fehler).slice(0, 160)}`],
    }
  }
}

// Ein Fehler beim Lesen des Befehls darf keinen harmlosen Befehl aufhalten.
const lies = (befehl: unknown): Risiko | null => {
  try {
    return klassifiziere(String(befehl ?? ''))
  } catch {
    return null
  }
}

// Misst und fragt. Gibt den Grund zurück, aus dem der Befehl nicht läuft, oder null.
const halte = async ($: EngineInterface, befehl: string, risiko: Risiko): Promise<string | null> => {
  const bericht = await messe($, risiko)
  let antwort = ''

  try {
    antwort = await $.ui.ask(frage(bericht, befehl), {
      options: [ABBRECHEN, AUSFUEHREN],
      header: 'Sprengradius',
    })
  } catch {
    return absage('die Rückfrage wurde geschlossen oder es war niemand da', bericht)
  }

  if (antwort === AUSFUEHREN) {
    return null
  }

  return absage(
    antwort === ABBRECHEN ? 'der Nutzer hat abgebrochen' : `der Nutzer schrieb: ${antwort}`,
    bericht,
  )
}

export const register: Register = on => {
  on('tool.call', { tool: 'PowerShell' }, async ($, e, next) => {
    const risiko = lies(e.command)

    if (risiko === null) {
      return next(e)
    }

    const grund = await halte($, String(e.command), risiko)

    return grund === null ? next(e) : { deny: grund }
  }).catch(($, e, next) =>
    next.called || lies(e.command) === null
      ? next(e)
      : { deny: 'Sprengradius ist beim Prüfen gescheitert und hat den riskanten Befehl nicht ausgeführt.' },
  )

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const risiko = lies(e.command)

    if (risiko === null) {
      return next(e)
    }

    const grund = await halte($, String(e.command), risiko)

    return grund === null ? next(e) : { deny: grund }
  }).catch(($, e, next) =>
    next.called || lies(e.command) === null
      ? next(e)
      : { deny: 'Sprengradius ist beim Prüfen gescheitert und hat den riskanten Befehl nicht ausgeführt.' },
  )
}
