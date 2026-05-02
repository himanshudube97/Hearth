'use client'

import { useEffect, useState, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useThemeStore } from '@/store/theme'
import { useAuthStore } from '@/store/auth'
import { useProfileStore, ProfileKey } from '@/store/profile'
import { useE2EEStore } from '@/store/e2ee'
import DatePicker from '@/components/DatePicker'
import RotateRecoveryKeyModal from '@/components/e2ee/RotateRecoveryKeyModal'

interface Question {
  key: ProfileKey
  prompt: string
  hint?: string
  placeholder: string
}

const questions: Question[] = [
  {
    key: 'lostHobby',
    prompt: 'Something you used to love doing but life got in the way...',
    placeholder: 'painting, playing guitar, reading novels...',
  },
  {
    key: 'recharges',
    prompt: 'What recharges you?',
    hint: 'could be anything - long walks, late night chats, a specific album',
    placeholder: 'morning coffee in silence, long drives with no destination...',
  },
  {
    key: 'smallJoy',
    prompt: 'A small thing that always makes you smile',
    placeholder: 'the first sip of tea, dogs saying hello, a perfect sunset...',
  },
  {
    key: 'wantToReturn',
    prompt: 'Something you want to get back to someday',
    placeholder: 'learning a language, traveling solo, writing poetry...',
  },
  {
    key: 'comfortThing',
    prompt: 'Your comfort food / movie / song when the world feels heavy',
    placeholder: 'khichdi, Studio Ghibli films, old Hindi songs...',
  },
  {
    key: 'friendDescription',
    prompt: 'How would your closest friend describe you in a few words?',
    placeholder: 'the one who always listens, quietly stubborn, warm chaos...',
  },
]

// Debounced save hook
function useDebouncedSave(delay = 500) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async (key: ProfileKey, value: string) => {
    // Clear existing timer
    if (timer) clearTimeout(timer)
    setSaved(false)

    // Set new timer
    const newTimer = setTimeout(async () => {
      setSaving(true)
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [key]: value }),
        })
        if (response.ok) {
          setSaved(true)
          // Hide "saved" after 2 seconds
          setTimeout(() => setSaved(false), 2000)
        }
      } catch {
        // Silently fail
      } finally {
        setSaving(false)
      }
    }, delay)

    setTimer(newTimer)
  }, [timer, delay])

  return { saving, saved, save }
}

// Personal info input with local state
const PersonalInfoInput = memo(function PersonalInfoInput({
  label,
  type,
  initialValue,
  placeholder,
  fieldKey,
  disabled,
}: {
  label: string
  type: 'text' | 'email'
  initialValue: string
  placeholder?: string
  fieldKey: ProfileKey | null
  disabled?: boolean
}) {
  const { theme } = useThemeStore()
  const [value, setValue] = useState(initialValue)
  const { saving, saved, save } = useDebouncedSave()

  // Sync initial value when it changes (after fetch)
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleChange = (newValue: string) => {
    setValue(newValue)
    if (fieldKey && !disabled) {
      save(fieldKey, newValue)
    }
  }

  return (
    <div>
      <label
        className="block text-xs mb-2"
        style={{ color: theme.text.muted }}
      >
        {label}
        {saving && <span className="ml-2 opacity-60">saving...</span>}
        {saved && !saving && <span className="ml-2" style={{ color: theme.accent.primary }}>saved</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-transparent outline-none ${type === 'text' ? 'text-lg font-light' : 'text-sm'} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        style={{
          color: disabled ? theme.text.muted : theme.text.primary,
        }}
      />
    </div>
  )
})

// Date of birth input with custom date picker
const DateOfBirthInput = memo(function DateOfBirthInput({
  initialValue,
}: {
  initialValue: string
}) {
  const { theme } = useThemeStore()
  const [value, setValue] = useState(initialValue)
  const { saving, saved, save } = useDebouncedSave()

  // Sync initial value when it changes (after fetch)
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleChange = (newValue: string) => {
    setValue(newValue)
    save('dateOfBirth', newValue)
  }

  return (
    <div>
      <label
        className="block text-xs mb-2"
        style={{ color: theme.text.muted }}
      >
        when were you born?
        {saving && <span className="ml-2 opacity-60">saving...</span>}
        {saved && !saving && <span className="ml-2" style={{ color: theme.accent.primary }}>saved</span>}
      </label>
      <DatePicker
        value={value}
        onChange={handleChange}
        placeholder="select your birthday..."
      />
    </div>
  )
})

// Question card with local state
const QuestionCard = memo(function QuestionCard({
  question,
  initialValue,
  index,
}: {
  question: Question
  initialValue: string
  index: number
}) {
  const { theme } = useThemeStore()
  const [value, setValue] = useState(initialValue)
  const { saving, saved, save } = useDebouncedSave()

  // Sync initial value when it changes (after fetch)
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleChange = (newValue: string) => {
    setValue(newValue)
    save(question.key, newValue)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        delay: 0.15 + index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="p-6 rounded-2xl"
      style={{
        background: theme.glass.bg,
        backdropFilter: `blur(${theme.glass.blur})`,
        border: `1px solid ${theme.glass.border}`,
      }}
    >
      <p
        className="text-base italic mb-1"
        style={{ color: theme.text.secondary }}
      >
        {question.prompt}
      </p>
      {question.hint && (
        <p
          className="text-xs mb-4"
          style={{ color: theme.text.muted }}
        >
          {question.hint}
        </p>
      )}
      {!question.hint && <div className="h-3" />}
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={question.placeholder}
        rows={3}
        className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed"
        style={{
          color: theme.text.primary,
        }}
      />
      <AnimatePresence mode="wait">
        {saving && (
          <motion.p
            key="saving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs mt-2"
            style={{ color: theme.text.muted }}
          >
            saving...
          </motion.p>
        )}
        {saved && !saving && (
          <motion.p
            key="saved"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs mt-2"
            style={{ color: theme.accent.primary }}
          >
            saved
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

// E2EE Settings Component
const E2EESettings = memo(function E2EESettings() {
  const { theme } = useThemeStore()
  const {
    isEnabled,
    isUnlocked,
    keyData,
    setShowSetupModal,
    setShowUnlockModal,
    clearMasterKey,
    loading: e2eeLoading,
  } = useE2EEStore()

  const [showRotate, setShowRotate] = useState(false)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)

  useEffect(() => {
    if (!isUnlocked) {
      setExpiresAt(null)
      return
    }
    try {
      const raw = localStorage.getItem('hearth-e2ee-master-key')
      if (!raw) { setExpiresAt(null); return }
      const parsed = JSON.parse(raw) as { expiresAt: number }
      setExpiresAt(parsed.expiresAt > 0 ? parsed.expiresAt : null)
    } catch {
      setExpiresAt(null)
    }
  }, [isUnlocked])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        delay: 0.95,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="p-6 rounded-2xl"
      style={{
        background: theme.glass.bg,
        backdropFilter: `blur(${theme.glass.blur})`,
        border: `1px solid ${theme.glass.border}`,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-xl"
          style={{
            background: isEnabled ? `${theme.accent.primary}20` : `${theme.text.muted}10`,
          }}
        >
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isEnabled ? theme.accent.primary : theme.text.muted}
            strokeWidth="1.5"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <div className="flex-1 space-y-3">
          <h3
            className="text-base font-medium"
            style={{ color: theme.text.primary }}
          >
            End-to-end encryption
          </h3>

          {!isEnabled && (
            <>
              <p
                className="text-sm"
                style={{ color: theme.text.secondary }}
              >
                Encrypt your journal entries with a key only you know. Not even we can read them.
              </p>
              <motion.button
                onClick={() => setShowSetupModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={e2eeLoading}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: theme.accent.primary,
                  color: '#fff',
                  opacity: e2eeLoading ? 0.5 : 1,
                }}
              >
                {e2eeLoading ? 'Loading...' : 'Enable end-to-end encryption'}
              </motion.button>
            </>
          )}

          {isEnabled && (
            <>
              <p className="text-xs" style={{ color: theme.text.secondary }}>
                {keyData?.e2eeSetupAt
                  ? `Encrypted on ${new Date(keyData.e2eeSetupAt).toLocaleDateString()}.`
                  : 'Encrypted.'}
              </p>
              <p className="text-xs" style={{ color: theme.text.secondary }}>
                {isUnlocked
                  ? expiresAt
                    ? `Unlocked on this device until ${new Date(expiresAt).toLocaleString()}.`
                    : 'Unlocked on this device (session only).'
                  : 'Locked.'}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => clearMasterKey()}
                  className="px-3 py-1.5 rounded-lg text-xs"
                  style={{
                    background: theme.glass.bg,
                    border: `1px solid ${theme.glass.border}`,
                    color: theme.text.muted,
                  }}
                >
                  Lock journal
                </button>
                <button
                  onClick={() => setShowUnlockModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs"
                  style={{
                    background: theme.glass.bg,
                    border: `1px solid ${theme.glass.border}`,
                    color: theme.text.muted,
                  }}
                >
                  Change daily key
                </button>
                <button
                  onClick={() => setShowRotate(true)}
                  disabled={!isUnlocked}
                  className="px-3 py-1.5 rounded-lg text-xs"
                  style={{
                    background: theme.glass.bg,
                    border: `1px solid ${theme.glass.border}`,
                    color: theme.text.muted,
                    opacity: isUnlocked ? 1 : 0.5,
                    cursor: isUnlocked ? 'pointer' : 'not-allowed',
                  }}
                >
                  Generate new recovery key
                </button>
              </div>
            </>
          )}

          <Link
            href="/security"
            className="text-xs underline block pt-1"
            style={{ color: theme.text.muted }}
          >
            How E2EE works →
          </Link>
        </div>
      </div>

      <RotateRecoveryKeyModal open={showRotate} onClose={() => setShowRotate(false)} />
    </motion.div>
  )
})

export default function MePage() {
  const { theme } = useThemeStore()
  const { user, logout } = useAuthStore()
  const { profile, loading, fetchProfile } = useProfileStore()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-center"
          style={{ color: theme.text.muted }}
        >
          loading...
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-10"
      >
        <h1
          className="text-2xl font-light"
          style={{ color: theme.text.primary }}
        >
          {profile.nickname ? `about you, ${profile.nickname}` : 'about you'}
        </h1>
      </motion.div>

      {/* Personal Info */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          delay: 0.1,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="p-6 rounded-2xl mb-8"
        style={{
          background: theme.glass.bg,
          backdropFilter: `blur(${theme.glass.blur})`,
          border: `1px solid ${theme.glass.border}`,
        }}
      >
        <div className="space-y-5">
          <PersonalInfoInput
            label="what should we call you?"
            type="text"
            initialValue={profile.nickname || ''}
            placeholder="your nickname..."
            fieldKey="nickname"
          />
          <DateOfBirthInput
            initialValue={profile.dateOfBirth || ''}
          />
          <PersonalInfoInput
            label="email"
            type="email"
            initialValue={user?.email || ''}
            fieldKey={null}
            disabled
          />
        </div>
      </motion.div>

      {/* Divider before questions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="mb-8 flex items-center gap-4"
      >
        <div
          className="flex-1 h-px"
          style={{ background: theme.glass.border }}
        />
        <span
          className="text-xs italic"
          style={{ color: theme.text.muted }}
        >
          a little more about you
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: theme.glass.border }}
        />
      </motion.div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.key}
            question={question}
            initialValue={profile[question.key] || ''}
            index={index}
          />
        ))}
      </div>

      {/* Divider before security */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.9 }}
        className="my-12 flex items-center gap-4"
      >
        <div
          className="flex-1 h-px"
          style={{ background: theme.glass.border }}
        />
        <span
          className="text-xs italic"
          style={{ color: theme.text.muted }}
        >
          security & privacy
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: theme.glass.border }}
        />
      </motion.div>

      {/* E2EE Settings */}
      <E2EESettings />

      {/* Final Divider */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="my-12 flex items-center gap-4"
      >
        <div
          className="flex-1 h-px"
          style={{ background: theme.glass.border }}
        />
        <span
          className="text-xs"
          style={{ color: theme.text.muted }}
        >
          that's all for now
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: theme.glass.border }}
        />
      </motion.div>

      {/* Sign Out */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <motion.button
          onClick={logout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 rounded-full text-sm"
          style={{
            background: theme.glass.bg,
            border: `1px solid ${theme.glass.border}`,
            color: theme.text.muted,
          }}
        >
          sign out
        </motion.button>
      </motion.div>
    </div>
  )
}
