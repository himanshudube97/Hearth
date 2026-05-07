import { isTauri } from './isTauri'

export async function clearBadgeIfTauri(): Promise<void> {
  if (!isTauri()) return
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('clear_badge')
  } catch {
    // Best-effort: don't break the entry-save flow if the bridge is missing.
  }
}

export async function setBadgeIfTauri(count: number): Promise<void> {
  if (!isTauri()) return
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('set_badge', { count })
  } catch {
    // Same posture as above.
  }
}

export async function showNotificationIfTauri(title: string, body: string): Promise<void> {
  if (!isTauri()) return
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('show_notification', { title, body })
  } catch {
    // Permission denied or plugin missing — quietly skip.
  }
}
