export type KontextTeil = {
  name: string
  tokens: number
  farbe: string
  art: 'used' | 'free' | 'buffer'
}

export type KontextLimit = { fenster: string; prozent: number }

export type KontextStand = {
  tokens: number
  fenster: number
  prozent: number
  komprimiertBei: number | null
  teile: KontextTeil[]
  limits: KontextLimit[]
}

declare module 'claude-code' {
  interface PluginState {
    'kontext-anzeige': { stand: KontextStand | null; klein: boolean }
  }
}
