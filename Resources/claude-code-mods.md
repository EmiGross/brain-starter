---
type: reference
date: 2026-10-12
updated: 2026-10-12
---

Mods sind kleine TypeScript-Plugins, die sich in Claude Code einklinken und eigene Oberfläche ins Terminal zeichnen. Anders als Regeln in `CLAUDE.md` sind sie Code und greifen jedes Mal. Der Vault bringt fünf mit, keiner ist von Haus aus installiert: Welche du brauchst, entscheidest du beim Onboarding oder später.

## Die fünf Mods

| Mod | Was er macht | Gut zu wissen |
|---|---|---|
| `brain-zeile` | Zeigt unter dem Eingabefeld den nächsten Termin aus den offenen Aufgaben der neuesten Daily-Note. Zählt ein Datum im fetten Titel einer Aufgabe, bei Aufgaben mit ⏰ auch das nächste Datum aus der Beschreibung | Braucht Daily-Notes mit `## Tasks`. Liest `Daily/` im Ordner, in dem Claude Code gestartet wurde |
| `kontext-anzeige` | Kasten unter dem Eingabefeld: womit der Kontext belegt ist, als farbiger Balken mit Legende, dazu die Abo-Limits. Ab 70 % rät er zu `/wrap`, ab 85 % kommt einmal ein Hinweis | `/kontext` schaltet auf eine einzeilige Ansicht um |
| `fortschritt` | Dünner Balken unter dem Eingabefeld für Aufgaben mit mehreren Schritten: Titel, erledigte Schritte, der laufende Schritt, die Zeit | Claude meldet die Schritte selbst. `/fortschritt` blendet den Balken aus |
| `sprengradius` | Hält riskante Befehle in PowerShell und Bash an: Löschen mit Unterordnern oder Platzhaltern, `git reset --hard`, `git clean`, `git push --force`, Prozesse beenden, Laufwerksbefehle. Zeigt, was betroffen wäre, und fragt vor dem Ausführen | Gebaut und erprobt unter Windows |
| `merker` | Erkennt an der Wortwahl Korrekturen in deinen Nachrichten („nein“, „ab jetzt“, „stattdessen“, „merk dir“) und fragt, ob daraus eine dauerhafte Regel werden soll. Claude formuliert sie und legt sie ab | `/merken <Text>` speichert eine eigene Regel, `/merken aus` schaltet die Erkennung ab |

`brain-zeile`, `kontext-anzeige` und `fortschritt` haben die Einstellung „Position“: `unten` (Standard) oder `oben`, also unter oder über dem Eingabefeld.

## Installieren

Der Vault ist zugleich die Quelle der Mods (`.claude-plugin/marketplace.json`). Im Terminal, mit dem Pfad zu deinem Vault:

```
claude plugin install fortschritt --marketplace "PFAD/ZU/DEINEM/VAULT"
```

Der erste Aufruf trägt den Vault als Quelle `brain-starter` ein. Danach reicht der kurze Name:

```
claude plugin install merker@brain-starter
```

Aktiv ist ein Mod nach `/reload-plugins` oder beim nächsten Start von Claude Code. Installiert wird für dich als Nutzer, die Mods erscheinen also auch, wenn du Claude Code in einem anderen Ordner startest.

- **Einstellung ändern:** `/plugin configure brain-zeile@brain-starter`, oder gleich beim Installieren `--config position=oben`
- **Wieder entfernen:** `claude plugin uninstall merker@brain-starter`
- **Was ist installiert:** `claude plugin list`

> [!warning] Der Code wird aus dem Vault gelesen
> Claude Code kopiert die Mods nicht, es liest sie aus `Resources/scripts/claude-code-mods/`. Verschiebst du den Vault, installierst du sie neu. Dafür wirkt jede Änderung am Code dort sofort nach `/reload-plugins`.

## Selbst anpassen oder bauen

Der Quellcode liegt in `Resources/scripts/claude-code-mods/<name>/`. Zum Ändern und für neue Mods gibt es in Claude Code den eingebauten Skill `plugin-authoring`: Sag Claude, was du sehen willst, und es baut den Mod.

- **Prüfen:** `claude plugin validate <ordner>` und `claude plugin test <ordner>`
- **Neuer Mod in der Sammlung:** Ordner unter `Resources/scripts/claude-code-mods/` anlegen und in `.claude-plugin/marketplace.json` eintragen

> [!warning] Early Access
> Die Mod-Schnittstelle von Claude Code ist neu und kann sich mit einem Update ändern. Bricht ein Mod, nennt Claude Code beim Start den Mod und den Grund in einer grauen Zeile.

## Mods von anderen

Nicht im Vault enthalten, aber einen Blick wert. Das ist fremder Code: vor dem Installieren lesen, was er tut.

| Mod | Was er macht |
|---|---|
| [cache-tax](https://github.com/karanb192/cache-tax) | Hält eine Nachricht bei kaltem Cache einmal an, nennt die geschätzten Kosten und hält den Cache in Pausen warm. Das Warmhalten kostet Tokens |
| [filetree](https://github.com/data-goblin/claude-code-filetree) | Dateibaum wie in einer IDE, der zeigt, an welchen Dateien Claude gerade arbeitet. Im Terminal nur im Vollbild |
| [replay-theater](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/replay-theater) | Geht die Datei-Änderungen der letzten Antwort Schritt für Schritt durch, ein Diff nach dem anderen |
