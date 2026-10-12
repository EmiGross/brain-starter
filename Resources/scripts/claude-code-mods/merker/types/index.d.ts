export type Kandidat = string | null

declare module 'claude-code' {
  interface PluginState {
    merker: { kandidat: Kandidat }
  }
}
