// Tauri 2 exposes window.__TAURI_INTERNALS__ in the webview. This check is
// the conventional Tauri-2 sniff and works in both dev and production builds.
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}
