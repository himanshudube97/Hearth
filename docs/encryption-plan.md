# Encryption Plan for Hearth

> **Status: IMPLEMENTED**
> Encryption is now active. New data is encrypted automatically.
> Old data remains unencrypted (readable by both old and new code).

## Overview

Application-level encryption using AES-256-GCM to protect sensitive user data. The encryption key is held server-side, protecting against database breaches while allowing server-side features.

---

## What to Encrypt

| Field | Encrypt | Reason |
|-------|---------|--------|
| Journal content | Yes | Personal thoughts |
| Letter content | Yes | Personal messages |
| Letter sender name | Yes | Privacy |
| Doodle image data | Yes | Personal expression |
| Mood value | No | Needed for constellation analytics |
| Email | No | Needed for auth & sending letters |
| Timestamps | No | Needed for sorting/filtering |
| User preferences | No | Not sensitive |

---

## Encryption Approach

### Algorithm
- **AES-256-GCM** (Galois/Counter Mode)
- Provides both encryption and authentication
- Industry standard, well-supported in Node.js

### Key Management
- Single master encryption key stored in environment variable
- Key should be 32 bytes (256 bits)
- Generate with: `openssl rand -hex 32`

```env
ENCRYPTION_KEY=your-64-character-hex-string-here
```

### Structure
Each encrypted field stores:
```
iv:authTag:encryptedData
```
- **iv**: Initialization vector (unique per encryption)
- **authTag**: Authentication tag (verifies integrity)
- **encryptedData**: The encrypted content

---

## Implementation

### 1. Create Encryption Utility

**File:** `src/lib/encryption.ts`

```typescript
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  }
  return Buffer.from(key, 'hex')
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':')

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted text format')
  }

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

// Helper to check if a string is encrypted
export function isEncrypted(text: string): boolean {
  const parts = text.split(':')
  return parts.length === 3 && parts[0].length === 32 // IV is 16 bytes = 32 hex chars
}
```

---

### 2. Database Schema (No Changes Needed)

Encrypted data is stored as strings, so existing `String` fields work:
- `content` in Entry model
- `content` in Letter model
- `senderName` in Letter model

---

### 3. Encrypt on Write

**Entry creation example:**

```typescript
import { encrypt } from '@/lib/encryption'

// In API route: POST /api/entries
const encryptedContent = encrypt(content)

await prisma.entry.create({
  data: {
    content: encryptedContent,  // Encrypted
    mood,                        // Not encrypted
    userId,
    // ...
  }
})
```

**Letter creation example:**

```typescript
const encryptedContent = encrypt(content)
const encryptedSenderName = senderName ? encrypt(senderName) : null

await prisma.letter.create({
  data: {
    content: encryptedContent,
    senderName: encryptedSenderName,
    // ...
  }
})
```

---

### 4. Decrypt on Read

**Entry fetch example:**

```typescript
import { decrypt } from '@/lib/encryption'

// In API route: GET /api/entries
const entries = await prisma.entry.findMany({
  where: { userId }
})

const decryptedEntries = entries.map(entry => ({
  ...entry,
  content: decrypt(entry.content)
}))
```

**Create helper function:**

```typescript
// src/lib/encryption.ts

export function decryptEntry(entry: Entry): Entry {
  return {
    ...entry,
    content: decrypt(entry.content)
  }
}

export function decryptLetter(letter: Letter): Letter {
  return {
    ...letter,
    content: decrypt(letter.content),
    senderName: letter.senderName ? decrypt(letter.senderName) : null
  }
}
```

---

### 5. Migration Strategy (Existing Data)

If you have existing unencrypted data:

```typescript
// scripts/migrate-encryption.ts

import { prisma } from '@/lib/prisma'
import { encrypt, isEncrypted } from '@/lib/encryption'

async function migrateEntries() {
  const entries = await prisma.entry.findMany()

  for (const entry of entries) {
    // Skip if already encrypted
    if (isEncrypted(entry.content)) continue

    await prisma.entry.update({
      where: { id: entry.id },
      data: { content: encrypt(entry.content) }
    })
  }

  console.log(`Migrated ${entries.length} entries`)
}

async function migrateLetters() {
  const letters = await prisma.letter.findMany()

  for (const letter of letters) {
    if (isEncrypted(letter.content)) continue

    await prisma.letter.update({
      where: { id: letter.id },
      data: {
        content: encrypt(letter.content),
        senderName: letter.senderName ? encrypt(letter.senderName) : null
      }
    })
  }

  console.log(`Migrated ${letters.length} letters`)
}

// Run migration
migrateEntries()
migrateLetters()
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/encryption.ts` | Create (new file) |
| `src/app/api/entries/route.ts` | Encrypt on create, decrypt on read |
| `src/app/api/entries/[id]/route.ts` | Decrypt on read, encrypt on update |
| `src/app/api/letters/route.ts` | Encrypt on create, decrypt on read |
| `src/app/api/cron/deliver-letters/route.ts` | Decrypt before sending email |
| `.env` | Add ENCRYPTION_KEY |
| `.env.example` | Add ENCRYPTION_KEY placeholder |

---

## Environment Setup

```env
# .env
ENCRYPTION_KEY=generate-with-openssl-rand-hex-32

# Generate key:
# openssl rand -hex 32
```

---

## Security Checklist

- [ ] Generate strong 32-byte key using `openssl rand -hex 32`
- [ ] Never commit ENCRYPTION_KEY to git
- [ ] Add ENCRYPTION_KEY to production environment (Vercel/hosting)
- [ ] Backup the encryption key securely (if lost, data is unrecoverable)
- [ ] Test encryption/decryption before deploying
- [ ] Run migration script for existing data

---

## Testing

```typescript
// Test the encryption
import { encrypt, decrypt } from '@/lib/encryption'

const original = "Today I feel grateful for..."
const encrypted = encrypt(original)
const decrypted = decrypt(encrypted)

console.log('Original:', original)
console.log('Encrypted:', encrypted)
console.log('Decrypted:', decrypted)
console.log('Match:', original === decrypted) // Should be true
```

---

## Limitations

1. **No server-side search** — Can't search encrypted content in DB queries
2. **Key rotation is complex** — Would need to decrypt all and re-encrypt
3. **If key is lost, data is gone** — Backup the key securely
4. **You (developer) can still read data** — This is not E2EE

---

## Future Considerations

- **Key rotation**: Implement versioned keys for rotating encryption keys
- **Per-user keys**: Derive keys from user credentials for stronger isolation
- **Optional E2EE**: Let privacy-conscious users opt into full E2EE
