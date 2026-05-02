/**
 * Pure encryption/decryption of journal entry drafts.
 *
 * Every field listed in EncryptableDraft is encrypted under the master key.
 * Fields not present (undefined/null) are skipped — their IV slot is omitted
 * from the e2eeIVs map.
 *
 * To add a new encrypted field:
 *   1. Add the field to EncryptableDraft
 *   2. Add an encrypt branch in encryptDraft
 *   3. Add a decrypt branch in decryptEntry
 *   4. (No server-side change needed — server stores ciphertext as-is)
 */
import { encryptString, decryptString } from './crypto'

export interface EncryptableDraft {
  text?: string
  textPreview?: string | null
  mood?: number | null
  tags?: string[] | null
  song?: string | null
  senderName?: string | null
  recipientName?: string | null
  letterLocation?: string | null
  doodles?: Array<{ strokes: unknown; spread?: number; positionInEntry?: number }>
  // photos and scrapbook items handled via separate flows (see PhotoSlot, scrapbook hooks)
}

export interface EncryptedDraft {
  encryptionType: 'e2ee'
  text?: string
  textPreview?: string
  mood?: string
  tags?: string
  song?: string
  senderName?: string
  recipientName?: string
  letterLocation?: string
  doodles?: Array<{
    encryptedStrokes: string
    e2eeIV: string
    spread?: number
    positionInEntry?: number
  }>
  e2eeIVs: Record<string, string>
}

const STRING_FIELDS = [
  'text',
  'textPreview',
  'song',
  'senderName',
  'recipientName',
  'letterLocation',
] as const

const JSON_FIELDS = ['mood', 'tags'] as const

export async function encryptDraft(
  draft: EncryptableDraft,
  masterKey: CryptoKey
): Promise<EncryptedDraft> {
  const out: EncryptedDraft = {
    encryptionType: 'e2ee',
    e2eeIVs: {},
  }

  for (const field of STRING_FIELDS) {
    const value = draft[field]
    if (value === undefined || value === null) continue
    const { ciphertext, iv } = await encryptString(value, masterKey)
    out[field] = ciphertext
    out.e2eeIVs[field] = iv
  }

  for (const field of JSON_FIELDS) {
    const value = draft[field]
    if (value === undefined || value === null) continue
    const { ciphertext, iv } = await encryptString(JSON.stringify(value), masterKey)
    out[field] = ciphertext
    out.e2eeIVs[field] = iv
  }

  if (draft.doodles && draft.doodles.length > 0) {
    out.doodles = []
    for (const d of draft.doodles) {
      const { ciphertext, iv } = await encryptString(JSON.stringify(d.strokes), masterKey)
      out.doodles.push({
        encryptedStrokes: ciphertext,
        e2eeIV: iv,
        spread: d.spread,
        positionInEntry: d.positionInEntry,
      })
    }
  }

  return out
}

export async function decryptEntry(
  encrypted: EncryptedDraft,
  masterKey: CryptoKey
): Promise<EncryptableDraft> {
  const out: EncryptableDraft = {}

  for (const field of STRING_FIELDS) {
    const ct = encrypted[field]
    const iv = encrypted.e2eeIVs[field]
    if (!ct || !iv) continue
    out[field] = await decryptString(ct, iv, masterKey)
  }

  for (const field of JSON_FIELDS) {
    const ct = encrypted[field]
    const iv = encrypted.e2eeIVs[field]
    if (!ct || !iv) continue
    const json = await decryptString(ct, iv, masterKey)
    ;(out as Record<string, unknown>)[field] = JSON.parse(json)
  }

  if (encrypted.doodles && encrypted.doodles.length > 0) {
    out.doodles = []
    for (const d of encrypted.doodles) {
      const json = await decryptString(d.encryptedStrokes, d.e2eeIV, masterKey)
      out.doodles.push({
        strokes: JSON.parse(json),
        spread: d.spread,
        positionInEntry: d.positionInEntry,
      })
    }
  }

  return out
}
