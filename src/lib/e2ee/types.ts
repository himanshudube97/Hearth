// E2EE Types

export interface E2EESetupData {
  encryptedMasterKey: string
  masterKeyIV: string
  masterKeySalt: string
  recoveryKeyHash: string
  encryptedMasterKeyRecovery: string
  recoveryKeyIV: string
}

export interface E2EEKeyData {
  e2eeEnabled: boolean
  encryptedMasterKey: string | null
  masterKeyIV: string | null
  masterKeySalt: string | null
  recoveryKeyHash: string | null
  encryptedMasterKeyRecovery: string | null
  recoveryKeyIV: string | null
  e2eeSetupAt: string | null
}

export interface EncryptedEntry {
  ciphertext: string
  iv: string
}

export interface KeyExportData {
  encryptedMasterKey: string
  masterKeyIV: string
  masterKeySalt: string
}
