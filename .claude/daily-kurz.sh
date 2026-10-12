#!/usr/bin/env bash
# Daily-Kurzfassung — SessionStart-Hook fürs Brain.
#
# Gibt die neueste Daily-Note gekürzt aus. Die volle Note ist dafür zu groß:
# Claude Code ersetzt Hook-Ausgaben ab rund 10.000 Zeichen durch eine
# 2-KB-Vorschau, dann kommen nur die ersten Zeilen an und der Rest fehlt still.
#
# Gekürzt wird an Sinngrenzen, nie mitten im Wort: pro Stichpunkt bleibt die
# fette Überschrift (unter "Heute passiert" plus ein paar Wörter danach),
# erledigte Tasks fallen weg, "## Entscheidungen" und "## Morgen" bleiben ganz.
# Passt das nicht unter
# GRENZE, schrumpfen erst die Tasks auf eine Zahl pro Abschnitt, dann fällt der
# Nachsatz unter "Heute passiert" weg. Die volle Note liest Claude bei Bedarf
# selbst.

set -u

VAULT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$VAULT" || exit 0

GRENZE=9000          # Bytes; darüber kappt Claude Code die Ausgabe
WORTE_HEUTE=18       # so viele Wörter bleiben nach der fetten Überschrift
WORTE_OHNE=25        # ... und von Zeilen ganz ohne fette Überschrift

note=$(ls Daily/2*.md 2>/dev/null | sort | tail -n 1)
[ -n "$note" ] || exit 0

# $1 = 1: jeder offene Task mit Titel · 2: Tasks nur als Anzahl pro Abschnitt
#      3: zusätzlich "Heute passiert" ohne Nachsatz
# Tasks ohne Abschnitt (oben in der Liste, meist Fristen) bleiben immer mit Titel.
kurz() {
    awk -v stufe="$1" -v heute="$WORTE_HEUTE" -v ohne="$WORTE_OHNE" '
    function kappen(s, n,    w, k, i, out) {
        k = split(s, w, " ")
        if (k <= n) return s
        out = w[1]
        for (i = 2; i <= n; i++) out = out " " w[i]
        return out " …"
    }
    # Stichpunkt bis zum Ende der fetten Überschrift, plus "mehr" Wörter danach
    function titel(s, mehr,    a, b, rest, kopf, nach) {
        a = index(s, "**")
        if (a == 0 || a > 20) return kappen(s, ohne)
        rest = substr(s, a + 2)
        b = index(rest, "**")
        if (b == 0) return kappen(s, ohne)
        kopf = substr(s, 1, a + b + 2)
        nach = substr(rest, b + 2)
        sub(/^[[:space:]]+/, "", nach)
        if (nach == "") return kopf
        if (mehr == 0) return kopf " …"
        return kopf (nach ~ /^[,.;:)]/ ? "" : " ") kappen(nach, mehr)
    }
    function gruppe_abschliessen() {
        if (stufe >= 2 && gruppe != "" && n > 0) print gruppe " — " n " offen"
        n = 0
    }

    { sub(/\r$/, "") }
    NR == 1 && /^---[[:space:]]*$/ { kopfdaten = 1; next }
    kopfdaten { if (/^---[[:space:]]*$/) kopfdaten = 0; next }
    /^[[:space:]]*$/ { next }

    /^## / {
        gruppe_abschliessen()
        abschnitt = $0; gruppe = ""; gedruckt = 0
        print ""; print $0
        next
    }

    abschnitt ~ /^## Tasks/ {
        if (/^###/) { gruppe_abschliessen(); gruppe = $0; gedruckt = 0; next }
        if ($0 !~ /^[[:space:]]*- \[ \]/) next          # erledigt oder Unterzeile
        offen++; n++
        if (stufe == 1 || gruppe == "") {
            if (gruppe != "" && !gedruckt) { print gruppe; gedruckt = 1 }
            sub(/^[[:space:]]+/, "")
            print titel($0, 0)
        }
        next
    }

    abschnitt ~ /^## (Morgen|Entscheidungen)/ { print kappen($0, 40); next }

    /^[[:space:]]/ { next }                              # Unterpunkte
    /^- / { print titel($0, (stufe <= 2 && abschnitt ~ /^## Heute/) ? heute : 0); next }
    { print kappen($0, ohne) }

    END {
        gruppe_abschliessen()
        print ""
        print "(" offen + 0 " offene Tasks. Gekürzte Fassung, Einzelheiten stehen in der Datei.)"
    }
    ' "$note"
}

for stufe in 1 2 3; do
    aus=$(kurz "$stufe")
    [ "$(printf '%s' "$aus" | wc -c | tr -d ' ')" -le "$GRENZE" ] && break
done

echo "=== Neueste Daily-Note ($(basename "$VAULT")/$note), gekürzt — automatisch geladen ==="
printf '%s\n' "$aus"
