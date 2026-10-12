#!/usr/bin/env bash
# Stand-Check — SessionStart-Hook fürs Brain.
#
# Zeigt bei jedem Session-Start GENAU EIN Projekt, dessen `status: active` am
# längsten nicht mehr belegt wurde, und fragt danach. Eine Frage, nicht eine
# Liste: eine Liste wird nach zwei Wochen überlesen, eine einzelne Frage nicht.
#
# Ein Projekt gilt als belegt, wenn sein `updated:` frisch ist ODER es in einer
# der letzten DAILY_FENSTER Daily-Notes vorkommt. Ist nichts überfällig, gibt
# das Skript nichts aus.

set -u

VAULT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$VAULT" || exit 0

SCHWELLE_TAGE=21     # ab wann ein stilles active-Projekt nachgefragt wird
DAILY_FENSTER=3      # so viele der letzten Daily-Notes gelten als "erwähnt"

heute=$(date +%s)
letzte_dailies=$(ls Daily/2*.md 2>/dev/null | sort | tail -n "$DAILY_FENSTER")

aeltester_name=""
aeltester_tage=0
aeltester_datum=""

for hub in Projects/*/*.md; do
    [ -e "$hub" ] || continue                 # noch kein Projekt angelegt
    name=$(basename "$hub" .md)
    # nur Ordnernotizen (Projects/foo/foo.md), keine Unterseiten
    [ "$(basename "$(dirname "$hub")")" = "$name" ] || continue

    grep -qE '^status:[[:space:]]*active[[:space:]]*$' "$hub" || continue

    datum=$(grep -m1 -E '^updated:' "$hub" | sed 's/^updated:[[:space:]]*//;s/[[:space:]]*$//')
    [ -n "$datum" ] || datum=$(grep -m1 -E '^date:' "$hub" | sed 's/^date:[[:space:]]*//;s/[[:space:]]*$//')
    [ -n "$datum" ] || continue

    # GNU date (Linux, Git Bash) oder BSD date (macOS)
    ts=$(date -d "$datum" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$datum" +%s 2>/dev/null) || continue
    tage=$(( (heute - ts) / 86400 ))
    [ "$tage" -ge "$SCHWELLE_TAGE" ] || continue

    # in einer der letzten Daily-Notes erwähnt? dann läuft es sichtbar
    if [ -n "$letzte_dailies" ] && grep -qlF "[[$name" $letzte_dailies 2>/dev/null; then
        continue
    fi

    if [ "$tage" -gt "$aeltester_tage" ]; then
        aeltester_tage=$tage
        aeltester_name=$name
        aeltester_datum=$datum
    fi
done

[ -n "$aeltester_name" ] || exit 0

wochen=$(( aeltester_tage / 7 ))
cat <<EOF

=== Stand-Check ===
[[$aeltester_name]] steht auf \`status: active\`, letzte Änderung $aeltester_datum — das sind $aeltester_tage Tage (rund $wochen Wochen), und in den letzten $DAILY_FENSTER Daily-Notes kommt es nicht vor.

Frag beiläufig nach, was daraus geworden ist — nicht als Checkliste, sondern als eine Frage, sobald es in den Gesprächsverlauf passt. Die Antwort gehört danach sofort in Projects/$aeltester_name/$aeltester_name.md: entweder ein Satz unter "## Status" plus neues \`updated:\`, oder \`status: on-hold\` bzw. \`completed\` mit Begründung. Sag nichts dazu, wenn gerade etwas anderes ansteht — der Check darf warten, er läuft beim nächsten Start wieder.
EOF
