'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useE2EEStore } from '@/store/e2ee'
import {
  generateMasterKey,
  generateRecoveryKey,
  generateSalt,
  parseSalt,
  deriveKeyFromPassphrase,
  deriveKeyFromRecoveryKey,
  wrapMasterKey,
  hashRecoveryKey,
} from '@/lib/e2ee/crypto'

const CONFIRMATION_PHRASE = 'I understand I may lose my data'

type Step = 'intro' | 'confirm1' | 'confirm2' | 'daily-key' | 'recovery-key' | 'verify-recovery' | 'complete'

export default function SetupModal() {
  const { theme } = useThemeStore()
  const { showSetupModal, setShowSetupModal, setEnabled, storeMasterKey, fetchKeyData } = useE2EEStore()

  const [step, setStep] = useState<Step>('intro')
  const [dailyKey, setDailyKey] = useState('')
  const [confirmDailyKey, setConfirmDailyKey] = useState('')
  const [recoveryKey, setRecoveryKey] = useState('')
  const [verifyPhrase, setVerifyPhrase] = useState('')
  const [verifyRecovery, setVerifyRecovery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const resetState = useCallback(() => {
    setStep('intro')
    setDailyKey('')
    setConfirmDailyKey('')
    setRecoveryKey('')
    setVerifyPhrase('')
    setVerifyRecovery('')
    setError('')
    setLoading(false)
    setCopied(false)
  }, [])

  const handleClose = useCallback(() => {
    setShowSetupModal(false)
    resetState()
  }, [setShowSetupModal, resetState])

  const handleCopyRecoveryKey = async () => {
    await navigator.clipboard.writeText(recoveryKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadRecoveryKey = () => {
    const blob = new Blob(
      [`Hearth Recovery Key\n\n${recoveryKey}\n\nStore this securely. You'll need it if you forget your daily key.`],
      { type: 'text/plain' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hearth-recovery-key.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSetupComplete = async () => {
    setLoading(true)
    setError('')

    try {
      // Generate master key
      const masterKey = await generateMasterKey()

      // Generate salt for PBKDF2
      const salt = generateSalt()
      const saltBytes = parseSalt(salt)

      // Derive wrapping key from daily key
      const dailyWrappingKey = await deriveKeyFromPassphrase(dailyKey, saltBytes)

      // Wrap master key with daily key
      const { wrappedKey: encryptedMasterKey, iv: masterKeyIV } = await wrapMasterKey(
        masterKey,
        dailyWrappingKey
      )

      // Generate recovery key
      const newRecoveryKey = generateRecoveryKey()
      setRecoveryKey(newRecoveryKey)

      // Derive wrapping key from recovery key
      const recoveryWrappingKey = await deriveKeyFromRecoveryKey(newRecoveryKey)

      // Wrap master key with recovery key
      const { wrappedKey: encryptedMasterKeyRecovery, iv: recoveryKeyIV } = await wrapMasterKey(
        masterKey,
        recoveryWrappingKey
      )

      // Hash recovery key for verification
      const recoveryHash = await hashRecoveryKey(newRecoveryKey)

      // Send to server
      const res = await fetch('/api/e2ee/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedMasterKey,
          masterKeyIV,
          masterKeySalt: salt,
          recoveryKeyHash: recoveryHash,
          encryptedMasterKeyRecovery,
          recoveryKeyIV,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to setup E2EE')
      }

      // Store master key locally and update state
      await storeMasterKey(masterKey, 0)
      setEnabled(true)
      await fetchKeyData()

      // Move to recovery key step
      setStep('recovery-key')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  const validateDailyKey = () => {
    if (dailyKey.length < 8) {
      setError('Daily key must be at least 8 characters')
      return false
    }
    if (dailyKey !== confirmDailyKey) {
      setError('Daily keys do not match')
      return false
    }
    setError('')
    return true
  }

  const validateRecoveryVerification = () => {
    const normalizedInput = verifyRecovery.replace(/-/g, '').toUpperCase()
    const normalizedKey = recoveryKey.replace(/-/g, '').toUpperCase()
    if (normalizedInput !== normalizedKey.slice(0, 8)) {
      setError('Recovery key verification failed. Please check the first 8 characters.')
      return false
    }
    setError('')
    return true
  }

  if (!showSetupModal) return null

  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <motion.div
            key="intro"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">
                <svg className="w-16 h-16 mx-auto" viewBox="0 0 24 24" fill="none" stroke={theme.accent.primary} strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h2 className="text-xl font-light mb-2" style={{ color: theme.text.primary }}>
                End-to-End Encryption
              </h2>
              <p className="text-sm" style={{ color: theme.text.secondary }}>
                Your entries will be encrypted with a key only you know.
                Not even we can read them.
              </p>
            </div>

            <div
              className="p-4 rounded-xl text-sm space-y-3"
              style={{ background: `${theme.accent.warm}15`, border: `1px solid ${theme.accent.warm}30` }}
            >
              <p style={{ color: theme.text.primary }}>
                <strong>What you need to know:</strong>
              </p>
              <ul className="space-y-2" style={{ color: theme.text.secondary }}>
                <li>You'll create a <strong>daily key</strong> (like a password) to unlock your journal</li>
                <li>You'll receive a <strong>recovery key</strong> to use if you forget your daily key</li>
                <li>If you lose both keys, <strong>your data cannot be recovered</strong></li>
                <li>New entries will be encrypted; existing entries stay as they are</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl text-sm"
                style={{
                  background: theme.glass.bg,
                  border: `1px solid ${theme.glass.border}`,
                  color: theme.text.muted,
                }}
              >
                Maybe Later
              </button>
              <button
                onClick={() => setStep('confirm1')}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{
                  background: theme.accent.primary,
                  color: '#fff',
                }}
              >
                Continue
              </button>
            </div>
          </motion.div>
        )

      case 'confirm1':
        return (
          <motion.div
            key="confirm1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">
                <svg className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="none" stroke={theme.accent.warm} strokeWidth="1.5">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-light mb-2" style={{ color: theme.text.primary }}>
                First Confirmation
              </h2>
              <p className="text-sm" style={{ color: theme.text.secondary }}>
                Please read carefully before continuing.
              </p>
            </div>

            <div
              className="p-4 rounded-xl text-sm space-y-4"
              style={{ background: `${theme.accent.warm}10`, border: `1px solid ${theme.accent.warm}25` }}
            >
              <p style={{ color: theme.text.primary }}>
                <strong>This action is serious and cannot be easily undone.</strong>
              </p>
              <p style={{ color: theme.text.secondary }}>
                Once E2EE is enabled, your new journal entries will be encrypted with keys
                that only exist on your device. If you lose access to your keys:
              </p>
              <ul className="list-disc list-inside space-y-1" style={{ color: theme.text.secondary }}>
                <li>We cannot recover your encrypted entries</li>
                <li>No password reset is possible</li>
                <li>Your encrypted data will be permanently inaccessible</li>
              </ul>
            </div>

            <p className="text-center text-sm" style={{ color: theme.text.muted }}>
              Are you sure you want to continue?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('intro')}
                className="flex-1 py-3 rounded-xl text-sm"
                style={{
                  background: theme.glass.bg,
                  border: `1px solid ${theme.glass.border}`,
                  color: theme.text.muted,
                }}
              >
                Go Back
              </button>
              <button
                onClick={() => setStep('confirm2')}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{
                  background: theme.accent.warm,
                  color: '#fff',
                }}
              >
                Yes, Continue
              </button>
            </div>
          </motion.div>
        )

      case 'confirm2':
        const isPhraseCorrect = verifyPhrase.toLowerCase().trim() === CONFIRMATION_PHRASE.toLowerCase()
        return (
          <motion.div
            key="confirm2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">
                <svg className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="none" stroke={theme.accent.warm} strokeWidth="1.5">
                  <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h2 className="text-xl font-light mb-2" style={{ color: theme.text.primary }}>
                Final Confirmation
              </h2>
              <p className="text-sm" style={{ color: theme.text.secondary }}>
                Type the phrase below to confirm you understand.
              </p>
            </div>

            <div
              className="p-4 rounded-xl text-center"
              style={{ background: theme.glass.bg, border: `1px solid ${theme.glass.border}` }}
            >
              <p className="text-sm mb-1" style={{ color: theme.text.muted }}>
                Please type:
              </p>
              <p className="text-lg font-medium" style={{ color: theme.accent.warm }}>
                "{CONFIRMATION_PHRASE}"
              </p>
            </div>

            <input
              type="text"
              value={verifyPhrase}
              onChange={(e) => setVerifyPhrase(e.target.value)}
              placeholder="Type the phrase above..."
              className="w-full p-4 rounded-xl text-sm outline-none"
              style={{
                background: theme.glass.bg,
                border: `1px solid ${isPhraseCorrect ? theme.accent.primary : theme.glass.border}`,
                color: theme.text.primary,
              }}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStep('confirm1')}
                className="flex-1 py-3 rounded-xl text-sm"
                style={{
                  background: theme.glass.bg,
                  border: `1px solid ${theme.glass.border}`,
                  color: theme.text.muted,
                }}
              >
                Go Back
              </button>
              <button
                onClick={() => setStep('daily-key')}
                disabled={!isPhraseCorrect}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-opacity"
                style={{
                  background: isPhraseCorrect ? theme.accent.primary : theme.text.muted,
                  color: '#fff',
                  opacity: isPhraseCorrect ? 1 : 0.5,
                  cursor: isPhraseCorrect ? 'pointer' : 'not-allowed',
                }}
              >
                I Understand
              </button>
            </div>
          </motion.div>
        )

      case 'daily-key':
        return (
          <motion.div
            key="daily-key"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">
                <svg className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="none" stroke={theme.accent.primary} strokeWidth="1.5">
                  <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-xl font-light mb-2" style={{ color: theme.text.primary }}>
                Create Your Daily Key
              </h2>
              <p className="text-sm" style={{ color: theme.text.secondary }}>
                This is like a password you'll use to unlock your journal.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-2" style={{ color: theme.text.muted }}>
                  Daily Key (min 8 characters)
                </label>
                <input
                  type="password"
                  value={dailyKey}
                  onChange={(e) => setDailyKey(e.target.value)}
                  placeholder="Enter your daily key..."
                  className="w-full p-4 rounded-xl text-sm outline-none"
                  style={{
                    background: theme.glass.bg,
                    border: `1px solid ${theme.glass.border}`,
                    color: theme.text.primary,
                  }}
                />
              </div>

              <div>
                <label className="block text-xs mb-2" style={{ color: theme.text.muted }}>
                  Confirm Daily Key
                </label>
                <input
                  type="password"
                  value={confirmDailyKey}
                  onChange={(e) => setConfirmDailyKey(e.target.value)}
                  placeholder="Confirm your daily key..."
                  className="w-full p-4 rounded-xl text-sm outline-none"
                  style={{
                    background: theme.glass.bg,
                    border: `1px solid ${dailyKey === confirmDailyKey && confirmDailyKey ? theme.accent.primary : theme.glass.border}`,
                    color: theme.text.primary,
                  }}
                />
              </div>

              {error && (
                <p className="text-sm text-center" style={{ color: theme.accent.warm }}>
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('confirm2')}
                className="flex-1 py-3 rounded-xl text-sm"
                style={{
                  background: theme.glass.bg,
                  border: `1px solid ${theme.glass.border}`,
                  color: theme.text.muted,
                }}
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  if (validateDailyKey()) {
                    handleSetupComplete()
                  }
                }}
                disabled={loading || dailyKey.length < 8 || dailyKey !== confirmDailyKey}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{
                  background: theme.accent.primary,
                  color: '#fff',
                  opacity: loading || dailyKey.length < 8 || dailyKey !== confirmDailyKey ? 0.5 : 1,
                }}
              >
                {loading ? 'Setting up...' : 'Create Keys'}
              </button>
            </div>
          </motion.div>
        )

      case 'recovery-key':
        return (
          <motion.div
            key="recovery-key"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">
                <svg className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="none" stroke={theme.accent.primary} strokeWidth="1.5">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-light mb-2" style={{ color: theme.text.primary }}>
                Save Your Recovery Key
              </h2>
              <p className="text-sm" style={{ color: theme.text.secondary }}>
                Write this down or save it somewhere safe. You'll need it if you forget your daily key.
              </p>
            </div>

            <div
              className="p-4 rounded-xl text-center"
              style={{ background: theme.glass.bg, border: `1px solid ${theme.accent.primary}50` }}
            >
              <p className="text-xs mb-3" style={{ color: theme.text.muted }}>
                Your Recovery Key
              </p>
              <p
                className="text-lg font-mono tracking-wide select-all"
                style={{ color: theme.accent.primary }}
              >
                {recoveryKey}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopyRecoveryKey}
                className="flex-1 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                style={{
                  background: theme.glass.bg,
                  border: `1px solid ${theme.glass.border}`,
                  color: copied ? theme.accent.primary : theme.text.secondary,
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownloadRecoveryKey}
                className="flex-1 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                style={{
                  background: theme.glass.bg,
                  border: `1px solid ${theme.glass.border}`,
                  color: theme.text.secondary,
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </button>
            </div>

            <button
              onClick={() => setStep('verify-recovery')}
              className="w-full py-3 rounded-xl text-sm font-medium"
              style={{
                background: theme.accent.primary,
                color: '#fff',
              }}
            >
              I've Saved It
            </button>
          </motion.div>
        )

      case 'verify-recovery':
        return (
          <motion.div
            key="verify-recovery"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">
                <svg className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="none" stroke={theme.accent.primary} strokeWidth="1.5">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-light mb-2" style={{ color: theme.text.primary }}>
                Verify Your Recovery Key
              </h2>
              <p className="text-sm" style={{ color: theme.text.secondary }}>
                Enter the first 8 characters to confirm you've saved it.
              </p>
            </div>

            <input
              type="text"
              value={verifyRecovery}
              onChange={(e) => setVerifyRecovery(e.target.value.toUpperCase())}
              placeholder="First 8 characters..."
              maxLength={8}
              className="w-full p-4 rounded-xl text-sm text-center font-mono tracking-wider outline-none uppercase"
              style={{
                background: theme.glass.bg,
                border: `1px solid ${theme.glass.border}`,
                color: theme.text.primary,
              }}
            />

            {error && (
              <p className="text-sm text-center" style={{ color: theme.accent.warm }}>
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('recovery-key')}
                className="flex-1 py-3 rounded-xl text-sm"
                style={{
                  background: theme.glass.bg,
                  border: `1px solid ${theme.glass.border}`,
                  color: theme.text.muted,
                }}
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  if (validateRecoveryVerification()) {
                    setStep('complete')
                  }
                }}
                disabled={verifyRecovery.length < 8}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{
                  background: theme.accent.primary,
                  color: '#fff',
                  opacity: verifyRecovery.length < 8 ? 0.5 : 1,
                }}
              >
                Verify
              </button>
            </div>
          </motion.div>
        )

      case 'complete':
        return (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5, delay: 0.2 }}
              className="text-6xl"
            >
              <svg className="w-20 h-20 mx-auto" viewBox="0 0 24 24" fill="none" stroke={theme.accent.primary} strokeWidth="1.5">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>

            <div>
              <h2 className="text-xl font-light mb-2" style={{ color: theme.text.primary }}>
                E2EE is Now Active
              </h2>
              <p className="text-sm" style={{ color: theme.text.secondary }}>
                Your new journal entries will be encrypted with end-to-end encryption.
                Only you can read them.
              </p>
            </div>

            <div
              className="p-4 rounded-xl text-sm"
              style={{ background: `${theme.accent.primary}10`, border: `1px solid ${theme.accent.primary}25` }}
            >
              <p style={{ color: theme.text.secondary }}>
                Remember: Keep your recovery key safe. It's the only way to access your entries
                if you forget your daily key.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl text-sm font-medium"
              style={{
                background: theme.accent.primary,
                color: '#fff',
              }}
            >
              Start Writing
            </button>
          </motion.div>
        )
    }
  }

  return (
    <AnimatePresence>
      {showSetupModal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto p-6 rounded-2xl"
            style={{
              background: theme.bg.primary,
              border: `1px solid ${theme.glass.border}`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full"
              style={{ color: theme.text.muted }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Progress indicator */}
            <div className="flex gap-1 mb-6">
              {(['intro', 'confirm1', 'confirm2', 'daily-key', 'recovery-key', 'verify-recovery', 'complete'] as Step[]).map((s, i) => (
                <div
                  key={s}
                  className="flex-1 h-1 rounded-full transition-colors"
                  style={{
                    background: (['intro', 'confirm1', 'confirm2', 'daily-key', 'recovery-key', 'verify-recovery', 'complete'] as Step[]).indexOf(step) >= i
                      ? theme.accent.primary
                      : `${theme.text.muted}30`,
                  }}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
