import type { FsEntry } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { frage, glatt, groesse, klassifiziere, namensMuster } from '../hooks/risiko'

const art = (befehl: string): string | null => klassifiziere(befehl)?.art ?? null

test('harmlose Befehle laufen durch', () => {
  expect(
    [
      'Get-ChildItem -Recurse',
      'Remove-Item notiz.txt',
      'rm datei.txt',
      'git status',
      'git clean -n',
      'git restore --staged .',
      'Remove-Item -Recurse -Force build -WhatIf',
      'Stop-Process -Id 4711',
      'kill -9 1234',
      'taskkill /PID 4711 /F',
      'robocopy D:\\a E:\\b /E',
      'Format-Table Name',
      'git commit -m "aufräumen"',
    ].map(art),
  ).toEqual([null, null, null, null, null, null, null, null, null, null, null, null, null])
})

test('erkennt Löschbefehle in PowerShell, cmd und Bash', () => {
  expect(klassifiziere('Remove-Item -Recurse -Force "Brain\\Inbox", alt')).toEqual({
    art: 'loeschen',
    etikett: 'remove-item -Recurse -Force',
    ziele: ['Brain\\Inbox', 'alt'],
    ort: null,
    istRekursiv: true,
  })
  expect(klassifiziere('cd Video; rm -rf out')).toEqual({
    art: 'loeschen',
    etikett: 'rm -rf',
    ziele: ['out'],
    ort: 'Video',
    istRekursiv: true,
  })
  expect(
    [
      'ri -rec -fo x',
      'cmd /c rd /s /q build',
      'del *.tmp',
      'Remove-Item -Path a -ErrorAction SilentlyContinue -Force',
    ].map(art),
  ).toEqual(['loeschen', 'loeschen', 'loeschen', 'loeschen'])
})

test('erkennt versteckte und zielfreie Fälle als unklar', () => {
  expect(
    [
      'Get-ChildItem *.log | Remove-Item -Force',
      'Get-ChildItem | ForEach-Object { Remove-Item $_ -Recurse }',
      'find . -name "*.bak" -delete',
    ].map(art),
  ).toEqual(['unklar', 'unklar', 'unklar'])
})

test('erkennt Git, Prozesse, Spiegeln und Laufwerke', () => {
  expect(
    [
      'git reset --hard HEAD~1',
      'git -C Brain clean -fd',
      'git push --force origin main',
      'git checkout -- .',
      'git branch -D alt',
      'git stash clear',
    ].map(befehl => {
      const risiko = klassifiziere(befehl)

      return risiko?.art === 'git' ? risiko.unter : null
    }),
  ).toEqual(['reset', 'clean', 'push', 'checkout', 'branch', 'stash'])
  expect(klassifiziere('git -C Brain clean -fd')?.ort).toBe('Brain')
  expect(
    [
      'Stop-Process -Name chrome',
      "Get-Process | Where-Object { $_.MainWindowTitle -like '*Schnitt*' } | Stop-Process",
      'taskkill /IM chrome.exe /F',
      'robocopy D:\\Footage E:\\Sicherung /MIR',
      'Format-Volume -DriveLetter X',
    ].map(art),
  ).toEqual(['prozess', 'prozess', 'prozess', 'spiegeln', 'laufwerk'])
})

test('Pfade, Platzhalter, Größen und die Frage', () => {
  expect(
    ['C:\\a\\b\\..\\c', '/c/Users/x', 'a/./b', 'C:/a//b/'].map(glatt),
  ).toEqual(['C:/a/c', 'C:/Users/x', 'a/b', 'C:/a/b'])
  expect(['a.TMP', 'a.tmpx', 'b.tmp'].map(name => namensMuster('*.tmp').test(name))).toEqual([
    true,
    false,
    true,
  ])
  expect([512, 2048, 5 * 1024 ** 2, 38 * 1024 ** 2].map(groesse)).toEqual([
    '512 Byte',
    '2,0 KB',
    '5,0 MB',
    '38 MB',
  ])
  expect(
    frage({ kopf: 'rm -rf löscht 2 Dateien', zeilen: ['a', 'b'], warnungen: ['Vorsicht'] }, 'rm  -rf x'),
  ).toBe('rm -rf löscht 2 Dateien\n⚠ Vorsicht\n· a\n· b\nBefehl: rm -rf x\nWirklich ausführen?')
})

const datei = (name: string, size: number): FsEntry => ({
  name,
  kind: 'file',
  size,
  mtimeMs: 0,
  isLink: false,
})
const ordner = (name: string): FsEntry => ({ name, kind: 'dir', size: 0, mtimeMs: 0, isLink: false })
const junction = (name: string): FsEntry => ({ name, kind: 'other', size: 0, mtimeMs: 0, isLink: true })

const BAUM: Record<string, FsEntry[]> = {
  'C:/Coding/build': [datei('a.js', 1024), ordner('sub'), junction('skills')],
  'C:/Coding/build/sub': [datei('b.js', 1024)],
}

test('misst, fragt und führt nur nach „Ausführen“ aus', async ($, on) => {
  const fragen: string[] = []
  const gelaufen: string[] = []
  let antwort = 'Abbrechen'

  mock.env(on, { USERPROFILE: 'C:/Users/ich' })
  on('session.cwd', () => ({ value: 'C:\\Coding' }))
  on('fs.exists', (_$, e) => ({ value: glatt(e.path) in BAUM }))
  on('fs.list', (_$, e) => ({ value: BAUM[glatt(e.path ?? '')] ?? [] }))
  on('fs.stat', (_$, e) => ({
    value: { kind: 'dir' as const, size: 0, mtimeMs: 0, isLink: false, realPath: e.path },
  }))
  on('tool.call', (_$, e) => {
    if (e.tool === 'AskUserQuestion') {
      const gestellt = (e as unknown as { questions: { question: string }[] }).questions[0]?.question ?? ''

      fragen.push(gestellt)

      return { result: { questions: [], answers: { [gestellt]: antwort } } } as never
    }

    gelaufen.push(String((e as { command?: string }).command))

    return { result: { stdout: '', stderr: '' } } as never
  })

  const harmlos = await $.tool.call({ tool: 'PowerShell', command: 'Get-ChildItem' } as never)
  const gestoppt = await $.tool.call({
    tool: 'PowerShell',
    command: 'Remove-Item -Recurse -Force build',
  } as never)

  expect((harmlos as { deny?: string }).deny).toBeUndefined()
  expect(fragen).toEqual([
    [
      'remove-item -Recurse -Force löscht 2 Dateien, 2,0 KB in 1 Ordner',
      '⚠ Darin liegt 1 Verknüpfung (Junction). Windows PowerShell 5.1 löscht bei -Recurse auch deren Ziel-Inhalt.',
      '· build/a.js',
      '· build/sub/b.js',
      'Befehl: Remove-Item -Recurse -Force build',
      'Wirklich ausführen?',
    ].join('\n'),
  ])
  expect((gestoppt as { deny?: string }).deny).toContain('der Nutzer hat abgebrochen')
  expect(gelaufen).toEqual(['Get-ChildItem'])

  antwort = 'Ausführen'
  await $.tool.call({ tool: 'Bash', command: 'rm -rf build' } as never)

  expect(gelaufen).toEqual(['Get-ChildItem', 'rm -rf build'])
})
