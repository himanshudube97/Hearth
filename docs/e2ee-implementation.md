# End-to-End Encryption (E2EE) Implementation Plan

## Overview

Add optional end-to-end encryption using a **two-key recovery system**:

| Key | Purpose | Where it lives |
|-----|---------|----------------|
| **Master Key** | Encrypts journal entries | DB (encrypted, unreadable by server) |
| **Daily Key** | Unlocks master key | User's memory |
| **Recovery Key** | Backup to unlock master key | User's password manager / printed |

**Server never sees plaintext keys or unencrypted E2EE content.**

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   MASTER KEY  ←── The real key that encrypts entries        │
│       │                                                     │
│       ▼                                                     │
│   ┌───────────────────────────────────────┐                │
│   │  Encrypted Master Key A (in DB)       │ ← Daily key    │
│   │  Encrypted Master Key B (in DB)       │ ← Recovery key │
│   └───────────────────────────────────────┘                │
│                                                             │
│   User enters Daily Key OR Recovery Key                     │
│              │                                              │
│              ▼                                              │
│        Decrypt to get MASTER KEY                            │
│              │                                              │
│              ▼                                              │
│        Decrypt/Encrypt Entries                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Schema & Crypto Library

#### 1.1 Prisma Schema Changes

**File**: `prisma/schema.prisma`

Add to User model:
```prisma
model User {
  // ... existing fields ...

  // E2EE fields
  e2eeEnabled              Boolean   @default(false)
  encryptedMasterKey       String?   // Master key encrypted with daily key
  masterKeyIV              String?   // IV for master key encryption
  masterKeySalt            String?   // Salt for PBKDF2 derivation
  recoveryKeyHash          String?   // Hash to verify recovery key
  encryptedMasterKeyRecovery String? // Master key encrypted with recovery key
  recoveryKeyIV            String?   // IV for recovery encryption
  e2eeSetupAt              DateTime?
}
```

Add to JournalEntry model:
```prisma
model JournalEntry {
  // ... existing fields ...

  encryptionType  String  @default("server")  // "server" | "e2ee"
  e2eeIV          String? // IV for E2EE entries
}
```

#### 1.2 Client-Side Crypto Library

**New file**: `src/lib/e2ee/crypto.ts`

```typescript
// Key generation
generateMasterKey(): Promise<CryptoKey>
generateRecoveryKey(): string  // Human-readable format

// Key derivation
deriveKeyFromPassphrase(passphrase: string, salt: Uint8Array): Promise<CryptoKey>

// Key wrapping (encrypt/decrypt master key)
wrapMasterKey(masterKey: CryptoKey, wrappingKey: CryptoKey): Promise<{wrappedKey: string, iv: string}>
unwrapMasterKey(wrappedKey: string, wrappingKey: CryptoKey, iv: string): Promise<CryptoKey>

// Entry encryption
encryptEntry(plaintext: string, masterKey: CryptoKey): Promise<{ciphertext: string, iv: string}>
decryptEntry(ciphertext: string, iv: string, masterKey: CryptoKey): Promise<string>

// Verification
hashRecoveryKey(key: string): Promise<string>
```

**New file**: `src/lib/e2ee/types.ts`

```typescript
interface E2EESetupData {
  encryptedMasterKey: string
  masterKeyIV: string
  masterKeySalt: string
  recoveryKeyHash: string
  encryptedMasterKeyRecovery: string
  recoveryKeyIV: string
}
```

---

### Phase 2: Zustand Store & API Endpoints

#### 2.1 E2EE Store

**New file**: `src/store/e2ee.ts`

```typescript
interface E2EEState {
  // Status
  isEnabled: boolean
  isUnlocked: boolean
  masterKey: CryptoKey | null

  // UI state
  showSetupModal: boolean
  showUnlockModal: boolean
  showRecoveryModal: boolean

  // Preference
  rememberKey: boolean  // localStorage vs sessionStorage

  // Actions
  storeMasterKey(key: CryptoKey): Promise<void>
  loadMasterKey(): Promise<CryptoKey | null>
  clearMasterKey(): void
  initializeE2EE(enabled: boolean): void
}
```

**Key storage behavior:**
- Default: `sessionStorage` (survives refresh, cleared on tab close)
- If "Remember" checked: `localStorage` (persists until logout)

#### 2.2 API Endpoints

**New file**: `src/app/api/e2ee/setup/route.ts`
```typescript
// POST - Enable E2EE, store encrypted master key blobs
// Body: E2EESetupData
// Response: { success: true }
```

**New file**: `src/app/api/e2ee/keys/route.ts`
```typescript
// GET - Return encrypted key data for unlocking
// Response: { e2eeEnabled, encryptedMasterKey, masterKeyIV, masterKeySalt, ... }
```

**New file**: `src/app/api/e2ee/update-daily-key/route.ts`
```typescript
// POST - Update daily key (re-wrap master key after recovery)
// Body: { encryptedMasterKey, masterKeyIV, masterKeySalt }
```

---

### Phase 3: UI Components

#### 3.1 Setup Modal

**New file**: `src/components/e2ee/SetupModal.tsx`

5-step flow:
1. **Intro**: Explain E2EE, show disclaimer
2. **Create Daily Key**: Password input + confirm (min 8 chars)
3. **Show Recovery Key**: Display key, copy/download buttons
4. **Confirm Recovery**: Paste first 8 chars to verify saved
5. **Complete**: Success animation

#### 3.2 Unlock Modal

**New file**: `src/components/e2ee/UnlockModal.tsx`

- Daily key input
- "Remember on this device" checkbox
- "Forgot key? Use recovery" link
- Error handling for wrong key

#### 3.3 Recovery Modal

**New file**: `src/components/e2ee/RecoveryModal.tsx`

- Recovery key input
- On success: option to set new daily key
- Updates server with re-wrapped master key

#### 3.4 Provider

**New file**: `src/components/e2ee/E2EEProvider.tsx`

```typescript
// Wraps app in layout.tsx
// Initializes E2EE state on user login
// Renders modals conditionally
```

Add to `src/app/layout.tsx`:
```tsx
<AuthProvider>
  <E2EEProvider>
    <LayoutContent>{children}</LayoutContent>
  </E2EEProvider>
</AuthProvider>
```

---

### Phase 4: Modify Entry Flow

#### 4.1 Update Entries API

**File**: `src/app/api/entries/route.ts`

**POST changes:**
```typescript
// Accept encryptionType and e2eeIV
// If encryptionType === 'e2ee': store as-is (already encrypted client-side)
// If encryptionType === 'server': encrypt server-side (existing behavior)
```

**GET changes:**
```typescript
// Include encryptionType and e2eeIV in response
// Only server-decrypt entries with encryptionType === 'server'
// E2EE entries returned as-is for client decryption
```

**File**: `src/app/api/entries/[id]/route.ts`
- Same changes for single entry GET/PUT

#### 4.2 Update Hooks

**File**: `src/hooks/useEntries.ts`

```typescript
// After fetching entries:
const decryptedEntries = await Promise.all(
  entries.map(async (entry) => {
    if (entry.encryptionType === 'e2ee' && masterKey) {
      entry.text = await decryptEntry(entry.text, entry.e2eeIV, masterKey)
    }
    return entry
  })
)
```

**New file**: `src/hooks/useCreateEntry.ts`

```typescript
// Before POST:
if (e2eeEnabled && isUnlocked && masterKey) {
  const { ciphertext, iv } = await encryptEntry(text, masterKey)
  payload = { ...data, text: ciphertext, encryptionType: 'e2ee', e2eeIV: iv }
}
```

---

### Phase 5: Settings Integration

**File**: `src/app/me/page.tsx`

Add E2EE Settings section:

```tsx
<E2EESettings />

function E2EESettings() {
  const { isEnabled, setShowSetupModal } = useE2EEStore()

  return (
    <Card>
      <h3>End-to-End Encryption</h3>
      <p>
        {isEnabled
          ? 'Your new entries are encrypted on your device.'
          : 'Enable E2EE to encrypt entries with a key only you know.'}
      </p>

      {!isEnabled && <Button onClick={() => setShowSetupModal(true)}>Enable E2EE</Button>}

      {isEnabled && (
        <>
          <Button>Change Daily Key</Button>
          <Button>View Recovery Key</Button>
        </>
      )}
    </Card>
  )
}
```

---

## File Structure

```
src/
├── lib/
│   └── e2ee/
│       ├── index.ts          # Exports
│       ├── crypto.ts         # Web Crypto API functions
│       └── types.ts          # TypeScript interfaces
│
├── store/
│   └── e2ee.ts               # NEW: E2EE Zustand store
│
├── components/
│   └── e2ee/
│       ├── E2EEProvider.tsx  # NEW: Context/initialization
│       ├── SetupModal.tsx    # NEW: Initial E2EE setup
│       ├── UnlockModal.tsx   # NEW: Daily key entry
│       └── RecoveryModal.tsx # NEW: Recovery flow
│
├── hooks/
│   ├── useEntries.ts         # MODIFY: Add E2EE decryption
│   └── useCreateEntry.ts     # NEW: E2EE encryption on create
│
├── app/
│   ├── api/
│   │   └── e2ee/
│   │       ├── setup/route.ts       # NEW
│   │       ├── keys/route.ts        # NEW
│   │       └── update-daily-key/route.ts  # NEW
│   ├── api/entries/
│   │   ├── route.ts          # MODIFY: Handle mixed encryption
│   │   └── [id]/route.ts     # MODIFY: Handle mixed encryption
│   └── me/
│       └── page.tsx          # MODIFY: Add E2EE settings
│
└── prisma/
    └── schema.prisma         # MODIFY: Add E2EE fields
```

---

## Migration Strategy

1. **Schema migration** adds columns with defaults (no data loss)
2. **Existing entries** remain `encryptionType: 'server'` (unchanged behavior)
3. **New entries** after E2EE setup use `encryptionType: 'e2ee'`
4. **No retroactive migration** of old entries (intentional - complex & risky)

---

## User Flows

### Enable E2EE
```
Settings → Enable E2EE → Setup Modal
  → Create daily key (8+ chars)
  → Save recovery key (copy/download)
  → Confirm recovery key
  → Done! E2EE active for new entries
```

### Daily Use
```
Login → App checks e2eeEnabled
  → If cached key exists: auto-unlock
  → If no cached key: show Unlock Modal
  → Enter daily key → Decrypt entries
```

### Forgot Daily Key
```
Unlock Modal → "Forgot key?" → Recovery Modal
  → Enter recovery key
  → Set new daily key (optional)
  → Done! Access restored
```

---

## Security Notes

- **PBKDF2**: 100,000 iterations for daily key derivation
- **AES-256-GCM**: Authenticated encryption
- **Keys never leave client unencrypted**
- **Server stores only encrypted blobs**
- **Recovery key**: Random 256-bit, one-time generation

---

## Commands

```bash
# Create migration
docker compose exec app npx prisma migrate dev --name add_e2ee_fields

# Restart after changes
docker compose restart app

# View logs
docker compose logs -f app
```

---

## Testing Checklist

- [ ] Setup flow: Enable E2EE → get daily + recovery keys
- [ ] Create entry: Write entry → verify encrypted in DB
- [ ] Read entry: Refresh → unlock → see decrypted content
- [ ] Recovery: Clear sessionStorage → use recovery key → access entries
- [ ] Mixed mode: Old server-encrypted + new E2EE entries display correctly
- [ ] Remember option: localStorage persistence works
- [ ] Tab close: sessionStorage cleared, must re-enter key
- [ ] Wrong key: Shows error, doesn't corrupt data
