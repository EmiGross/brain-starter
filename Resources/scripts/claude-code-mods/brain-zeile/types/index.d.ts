export type Termin = { tag: string; zeit: string | null; titel: string }

declare module 'claude-code' {
  interface PluginState {
    'brain-zeile': { termine: Termin[]; heute: string }
  }
}
