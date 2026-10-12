// Liest einen Shell-Befehl (PowerShell, cmd oder Bash) und sagt, ob er etwas
// zerstören kann. Reine Textarbeit: gemessen wird in register.ts.

export type Risiko =
  | { art: 'loeschen'; etikett: string; ziele: string[]; ort: string | null; istRekursiv: boolean }
  | { art: 'git'; unter: GitFall; etikett: string; args: string[]; ort: string | null }
  | { art: 'spiegeln'; etikett: string; ziele: string[]; ort: string | null }
  | { art: 'prozess' | 'laufwerk' | 'unklar'; etikett: string; ort: string | null }

export type GitFall = 'reset' | 'clean' | 'push' | 'checkout' | 'branch' | 'stash'

export type Bericht = { kopf: string; zeilen: string[]; warnungen: string[] }

export const AUSFUEHREN = 'Ausführen'
export const ABBRECHEN = 'Abbrechen'

const LOESCHEN = new Set(['remove-item', 'ri', 'rm', 'del', 'erase', 'rd', 'rmdir'])
const WECHSELN = new Set(['cd', 'chdir', 'set-location', 'sl', 'pushd', 'push-location'])
const PROZESS = new Set(['stop-process', 'spps', 'kill', 'taskkill', 'pkill', 'killall'])
const LAUFWERK = new Set([
  'format-volume',
  'clear-disk',
  'remove-partition',
  'initialize-disk',
  'diskpart',
  'format',
])
// Wörter, die vor dem eigentlichen Befehl stehen dürfen.
const VORSPANN = new Set(['&', 'sudo', 'command', 'exec', 'env', 'nohup', 'time', 'then', 'do', 'else'])
// PowerShell-Parameter, deren Wert kein Ziel ist.
const MIT_WERT = new Set([
  '-erroraction',
  '-ea',
  '-warningaction',
  '-wa',
  '-include',
  '-exclude',
  '-filter',
  '-stream',
  '-credential',
])
const OHNE_FOLGE = /\b(remove-item|rmdir|rd|del|erase|ri|rm)\b[^|;\n]*?\s(-r\b|-rec\w*|-fo\w*|-rf\b|-fr\b|\/s\b)/i

/** Zerlegt ein Segment in Wörter und achtet dabei auf Anführungszeichen. */
export const worte = (text: string): string[] => {
  const muster = /"((?:[^"\\`]|[\\`].)*)"|'([^']*)'|(\S+)/g
  const liste: string[] = []

  for (const treffer of text.matchAll(muster)) {
    liste.push(treffer[1] ?? treffer[2] ?? treffer[3] ?? '')
  }

  return liste
}

/** `C:\x\git.exe` wird zu `git`. */
const befehlsname = (wort: string): string =>
  (wort.replace(/\\/g, '/').split('/').at(-1) ?? wort).replace(/\.exe$/i, '').toLowerCase()

// Eine abgekürzte PowerShell-Option: `-rec` meint `-Recurse`.
const meint = (lang: string, option: string): boolean => {
  const kurz = option.toLowerCase().split(':')[0] ?? ''

  return kurz.length >= 2 && lang.startsWith(kurz)
}

// Gebündelte Bash-Optionen wie `-rf`.
const buendel = (option: string, buchstabe: string): boolean =>
  /^-[rRfivdI]+$/.test(option) && option.toLowerCase().includes(buchstabe)

export const istAbsolut = (pfad: string): boolean =>
  /^[A-Za-z]:[\\/]/.test(pfad) || pfad.startsWith('/') || pfad.startsWith('\\') || pfad.startsWith('~')

export const verbinde = (basis: string | null, pfad: string): string =>
  basis === null || basis === '' || istAbsolut(pfad) ? pfad : `${basis}/${pfad}`

/** Einheitliche Schreibweise: Schrägstriche, `/c/x` als `C:/x`, `.` und `..` aufgelöst. */
export const glatt = (pfad: string): string => {
  const mitStrichen = pfad.replace(/\\/g, '/').replace(/^\/([a-zA-Z])\//, (_, lw: string) => `${lw.toUpperCase()}:/`)
  const kopf = /^[A-Za-z]:\//.exec(mitStrichen)?.[0] ?? (mitStrichen.startsWith('/') ? '/' : '')
  const teile: string[] = []

  for (const teil of mitStrichen.slice(kopf.length).split('/')) {
    if (teil === '..' && teile.length > 0 && teile.at(-1) !== '..') {
      teile.pop()
    } else if (teil !== '' && teil !== '.') {
      teile.push(teil)
    }
  }

  return kopf + teile.join('/')
}

export const hatVariable = (pfad: string): boolean => /[$%`]/.test(pfad)
export const hatPlatzhalter = (pfad: string): boolean => /[*?]/.test(pfad)

/** Ein Platzhalter-Muster für einen einzelnen Namen, ohne Groß und Klein. */
export const namensMuster = (muster: string): RegExp =>
  new RegExp(
    `^${muster
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')}$`,
    'i',
  )

const loeschen = (name: string, args: string[], ort: string | null): Risiko | null => {
  const optionen: string[] = []
  const ziele: string[] = []
  let ueberspringe = false

  for (const arg of args) {
    if (ueberspringe) {
      ueberspringe = false
    } else if (MIT_WERT.has(arg.toLowerCase())) {
      ueberspringe = true
    } else if (arg.startsWith('-') || /^\/[a-zA-Z]$/.test(arg)) {
      optionen.push(arg)
    } else {
      ziele.push(...arg.split(',').filter(teil => teil !== ''))
    }
  }

  if (optionen.some(option => meint('-whatif', option))) {
    return null
  }

  const istRekursiv = optionen.some(
    o => meint('-recurse', o) || buendel(o, 'r') || o === '--recursive' || o.toLowerCase() === '/s',
  )
  const istErzwungen = optionen.some(
    o => meint('-force', o) || buendel(o, 'f') || o === '--force' || o.toLowerCase() === '/q',
  )

  if (!istRekursiv && !istErzwungen && !ziele.some(hatPlatzhalter)) {
    return null
  }

  const etikett = [name, ...optionen].join(' ')

  return ziele.length === 0
    ? { art: 'unklar', etikett: `${etikett} (Ziele kommen aus der Pipeline)`, ort }
    : { art: 'loeschen', etikett, ziele, ort, istRekursiv }
}

const git = (args: string[], ort: string | null): Risiko | null => {
  let gitOrt = ort
  let stelle = 0

  // Gits eigene Optionen stehen vor dem Unterbefehl, -C verlegt den Ort.
  while (stelle < args.length && (args[stelle] ?? '').startsWith('-')) {
    const option = args[stelle]
    const wert = args[stelle + 1]

    if (option === '-C' && wert !== undefined) {
      gitOrt = verbinde(gitOrt, wert)
      stelle += 2
    } else {
      stelle += option === '-c' ? 2 : 1
    }
  }

  const unter = args[stelle]
  const rest = args.slice(stelle + 1)
  const fall = (art: GitFall, etikett: string): Risiko => ({
    art: 'git',
    unter: art,
    etikett,
    args: rest,
    ort: gitOrt,
  })

  if (unter === 'reset' && rest.includes('--hard')) {
    return fall('reset', 'git reset --hard')
  }

  if (unter === 'clean' && !rest.some(a => a === '--dry-run' || /^-[a-zA-Z]*n/.test(a))) {
    return fall('clean', 'git clean')
  }

  if (
    unter === 'push' &&
    rest.some(a => a === '--force' || a === '-f' || a.startsWith('--force-with-lease') || a.startsWith('+'))
  ) {
    return fall('push', 'git push --force')
  }

  const nurVorgemerkt =
    unter === 'restore' && rest.includes('--staged') && !rest.includes('--worktree') && !rest.includes('-W')

  if ((unter === 'checkout' || unter === 'restore') && rest.includes('.') && !nurVorgemerkt) {
    return fall('checkout', `git ${unter} .`)
  }

  if (unter === 'branch' && rest.some(a => a === '-D' || a === '--delete')) {
    return fall('branch', 'git branch -D')
  }

  if (unter === 'stash' && (rest[0] === 'drop' || rest[0] === 'clear')) {
    return fall('stash', `git stash ${rest[0]}`)
  }

  return null
}

const prozess = (name: string, args: string[], ort: string | null): Risiko | null => {
  const klein = args.map(arg => arg.toLowerCase())
  const etikett = [name, ...args].join(' ')

  if (name === 'pkill' || name === 'killall') {
    return { art: 'prozess', etikett, ort }
  }

  if (name === 'taskkill') {
    return klein.includes('/im') || klein.includes('/fi') ? { art: 'prozess', etikett, ort } : null
  }

  const perName = klein.some(arg => meint('-name', arg) || meint('-processname', arg))
  const ziele = args.filter(arg => !arg.startsWith('-'))
  // Ohne Ziel kommen die Prozesse aus der Pipeline, etwa nach einem Fenstertitel gefiltert.
  const ausPipeline = ziele.length === 0 && !klein.some(arg => meint('-id', arg))

  return perName || ausPipeline
    ? { art: 'prozess', etikett: ausPipeline ? `${name} (Prozesse aus der Pipeline)` : etikett, ort }
    : null
}

type Schritt = Risiko | { wechsel: string } | null

const segment = (roh: string, ort: string | null): Schritt => {
  const liste = worte(roh.trim().replace(/^[({\s]+/, '').replace(/[)}\s]+$/, ''))

  while (liste.length > 0) {
    const erstes = (liste[0] ?? '').toLowerCase()
    const istCmd = (erstes === 'cmd' || erstes === 'cmd.exe') && (liste[1] ?? '').toLowerCase() === '/c'

    if (istCmd) {
      liste.splice(0, 2)
    } else if (VORSPANN.has(erstes) || /^[A-Za-z_][A-Za-z0-9_]*=/.test(liste[0] ?? '')) {
      liste.shift()
    } else {
      break
    }
  }

  const [erstes, ...args] = liste

  if (erstes === undefined) {
    return null
  }

  const name = befehlsname(erstes)

  if (WECHSELN.has(name)) {
    const ziel = args.find(arg => !arg.startsWith('-'))

    return ziel === undefined ? null : { wechsel: verbinde(ort, ziel) }
  }

  if (LOESCHEN.has(name)) {
    return loeschen(name, args, ort)
  }

  if (name === 'git') {
    return git(args, ort)
  }

  if (name === 'robocopy' && args.some(arg => /^\/(mir|purge)$/i.test(arg))) {
    const pfade = args.filter(arg => !arg.startsWith('/'))
    const ziel = pfade[1]

    return ziel === undefined
      ? { art: 'unklar', etikett: 'robocopy /MIR', ort }
      : { art: 'spiegeln', etikett: 'robocopy /MIR', ziele: [ziel], ort }
  }

  if (name === 'find' && args.includes('-delete')) {
    return { art: 'unklar', etikett: 'find -delete', ort }
  }

  if (PROZESS.has(name)) {
    return prozess(name, args, ort)
  }

  if (LAUFWERK.has(name) && !(name === 'format' && args.length === 0)) {
    return { art: 'laufwerk', etikett: [name, ...args].join(' '), ort }
  }

  return null
}

/** Das erste riskante Segment eines Befehls, oder null. */
export const klassifiziere = (befehl: string): Risiko | null => {
  let ort: string | null = null

  for (const roh of befehl.split(/&&|\|\||;|\||\n/)) {
    const schritt = segment(roh, ort)

    if (schritt !== null && 'wechsel' in schritt) {
      ort = schritt.wechsel
    } else if (schritt !== null) {
      return schritt
    }
  }

  // Ein Löschbefehl, der in einem Skriptblock oder einer Zeichenkette steckt.
  return OHNE_FOLGE.test(befehl) && !/-whatif\b/i.test(befehl)
    ? { art: 'unklar', etikett: 'Löschbefehl in einem Skriptblock', ort }
    : null
}

export const groesse = (bytes: number): string => {
  const stufen: [number, string][] = [
    [1024 ** 3, 'GB'],
    [1024 ** 2, 'MB'],
    [1024, 'KB'],
  ]
  const stufe = stufen.find(([grenze]) => bytes >= grenze)

  if (stufe === undefined) {
    return `${bytes} Byte`
  }

  const wert = bytes / stufe[0]

  return `${wert >= 10 ? Math.round(wert) : wert.toFixed(1).replace('.', ',')} ${stufe[1]}`
}

const KURZ = 160

/** Die Frage an den Nutzer. Sie endet mit einem Fragezeichen. */
export const frage = (bericht: Bericht, befehl: string): string => {
  const einzeilig = befehl.replace(/\s+/g, ' ').trim()
  const gekuerzt = einzeilig.length > KURZ ? `${einzeilig.slice(0, KURZ)}…` : einzeilig

  return [
    bericht.kopf,
    ...bericht.warnungen.map(warnung => `⚠ ${warnung}`),
    ...bericht.zeilen.map(zeile => `· ${zeile}`),
    `Befehl: ${gekuerzt}`,
    'Wirklich ausführen?',
  ].join('\n')
}

/** Was Claude liest, wenn der Befehl nicht läuft. */
export const absage = (grund: string, bericht: Bericht): string =>
  `Sprengradius hat den Befehl angehalten und nicht ausgeführt: ${grund}. Er hätte bewirkt: ${bericht.kopf}. Nicht erneut versuchen, außer der Nutzer bittet darum.`
