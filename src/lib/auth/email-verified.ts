type WithEmailConfirmedAt = { email_confirmed_at?: string | null } | null | undefined

export function isEmailVerified(user: WithEmailConfirmedAt): boolean {
  if (!user) return false
  return Boolean(user.email_confirmed_at)
}
