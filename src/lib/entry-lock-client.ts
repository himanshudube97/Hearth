/**
 * Client-side mirror of the server lock check. Compares the user's local
 * calendar day against createdAt's local calendar day. The server uses the
 * IANA tz the client sends, so as long as the client is honest about its
 * timezone, both sides agree.
 */
export function isEntryLocked(
  createdAt: Date | string,
  opts?: { entryType?: string | null; isSealed?: boolean | null },
): boolean {
  // Letters lock on seal, not on the day flip. Mirror server logic.
  if (opts?.entryType && opts.entryType !== 'normal') {
    return opts.isSealed === true
  }
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  return created.toDateString() !== new Date().toDateString()
}

/**
 * Best-effort IANA timezone of the current browser. Sent on every save
 * request so the server enforces the same calendar-day boundary the UI does.
 */
export function getClientTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}
