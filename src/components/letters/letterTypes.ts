// src/components/letters/letterTypes.ts
import { addMonths, addYears } from 'date-fns'

export type LetterRecipient = 'future_me' | 'someone_close'

export type UnlockChoice =
  | { kind: '1_month' }
  | { kind: '6_months' }
  | { kind: '1_year' }
  | { kind: 'someday'; date: Date | null } // null = picker not yet chosen

export const DEFAULT_UNLOCK: UnlockChoice = { kind: '1_year' }

/**
 * Resolve an UnlockChoice into a concrete unlock Date relative to `from`.
 * Returns null only when kind=someday and date is not yet picked
 * (UI must block seal in that case).
 */
export function resolveUnlockDate(choice: UnlockChoice, from: Date = new Date()): Date | null {
  switch (choice.kind) {
    case '1_month':  return addMonths(from, 1)
    case '6_months': return addMonths(from, 6)
    case '1_year':   return addYears(from, 1)
    case 'someday':  return choice.date
  }
}

/**
 * Map the new UI recipient onto the existing schema fields.
 * - future_me  -> entryType=letter, recipient=self, no email, recipientName="future me"
 * - someone_close (no email) -> entryType=unsent_letter, no recipient/email, recipientName=user-typed
 * - someone_close (with email) -> entryType=letter, recipient=friend, recipientEmail set
 */
export interface RecipientSchemaMapping {
  entryType: 'letter' | 'unsent_letter'
  recipient: 'self' | 'friend' | null   // null for unsent
  recipientName: string                  // "future me" or user-typed name
  recipientEmail: string | null
}

export function mapRecipientToSchema(
  recipient: LetterRecipient,
  closeName: string,
  closeEmail: string | null,
): RecipientSchemaMapping {
  if (recipient === 'future_me') {
    return {
      entryType: 'letter',
      recipient: 'self',
      recipientName: 'future me',
      recipientEmail: null,
    }
  }
  // someone_close
  if (closeEmail && closeEmail.trim().length > 0) {
    return {
      entryType: 'letter',
      recipient: 'friend',
      recipientName: closeName.trim() || 'someone close',
      recipientEmail: closeEmail.trim(),
    }
  }
  return {
    entryType: 'unsent_letter',
    recipient: null,
    recipientName: closeName.trim() || 'someone close',
    recipientEmail: null,
  }
}
