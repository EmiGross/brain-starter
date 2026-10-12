export type Lauf = {
  titel: string
  schritte: string[]
  fertig: number
  notiz: string
  start: number
  ende: number | null
}

declare module 'claude-code' {
  interface PluginState {
    fortschritt: { lauf: Lauf | null; jetzt: number }
  }
}
