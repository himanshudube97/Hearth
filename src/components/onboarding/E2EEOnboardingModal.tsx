'use client'

export function E2EEOnboardingModal({ userName }: { userName: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <p className="font-serif text-2xl">
        Onboarding for {userName || 'friend'} — coming next.
      </p>
    </div>
  )
}
