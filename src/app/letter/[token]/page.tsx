'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Photo = { url: string; position: number; spread: number; rotation: number }

type LetterData = {
  text: string
  senderName: string
  recipientName: string
  letterLocation: string | null
  writtenAt: string
  song: string | null
  photos: Photo[]
  readsRemaining: number
  expiresAt: string
}

type State =
  | { kind: 'loading' }
  | { kind: 'error'; reason: 'not_found' | 'expired' | 'exhausted' }
  | { kind: 'ok'; data: LetterData }

export default function LetterPage() {
  const params = useParams<{ token: string }>()
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    async function run() {
      const res = await fetch(`/api/letter/${params.token}`)
      if (cancelled) return
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const reason: 'not_found' | 'expired' | 'exhausted' =
          data.reason === 'expired' || data.reason === 'exhausted' ? data.reason : 'not_found'
        setState({ kind: 'error', reason })
        return
      }
      const data: LetterData = await res.json()
      setState({ kind: 'ok', data })
    }
    run()
    return () => { cancelled = true }
  }, [params.token])

  if (state.kind === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500">
        Opening your letter…
      </main>
    )
  }

  if (state.kind === 'error') {
    const title =
      state.reason === 'expired' ? 'This letter has expired' :
      state.reason === 'exhausted' ? 'This letter has been viewed' :
      'Letter not found'
    const body =
      state.reason === 'exhausted'
        ? 'You’ve opened this letter the maximum number of times. Sign up for Hearth to keep your letters safe forever.'
        : state.reason === 'expired'
          ? 'This link has expired. Sign up for Hearth to keep your letters before they go.'
          : 'The link may be incorrect or this letter never existed.'

    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 text-center">
          <h1 className="text-2xl font-serif text-stone-800 mb-3">{title}</h1>
          <p className="text-stone-600 text-sm mb-6">{body}</p>
          <Link
            href="/login"
            className="inline-block bg-stone-800 text-white rounded-full px-6 py-2 text-sm"
          >
            Sign up for Hearth
          </Link>
        </div>
      </main>
    )
  }

  const { data } = state
  const writtenDate = new Date(data.writtenAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-16">
      <article className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-10 font-serif">
        <header className="mb-8">
          <p className="text-sm text-stone-400">
            Written {data.letterLocation ? `from ${data.letterLocation}, ` : ''}{writtenDate}
          </p>
          <p className="text-stone-700 italic mt-2">Dear {data.recipientName},</p>
        </header>

        <div
          className="text-stone-800 leading-relaxed prose prose-stone max-w-none"
          dangerouslySetInnerHTML={{ __html: data.text }}
        />

        {data.photos.length > 0 && (
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            {data.photos.map((p, i) => (
              <div
                key={i}
                className="bg-white p-2 pb-6 shadow-md"
                style={{ transform: `rotate(${p.rotation || (p.position === 1 ? 5 : -5)}deg)` }}
              >
                <img src={p.url} alt="" className="w-32 h-40 object-cover" />
              </div>
            ))}
          </div>
        )}

        {data.song && (
          <div className="mt-8 p-3 border border-stone-200 rounded-lg bg-stone-50">
            <p className="text-xs text-stone-500 mb-1">A song was shared with this letter</p>
            <a
              href={data.song}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-stone-700 underline break-all"
            >
              {data.song}
            </a>
          </div>
        )}

        <footer className="mt-10 pt-6 border-t border-stone-200">
          <p className="text-stone-700 italic text-right">— {data.senderName}</p>
        </footer>

        <p className="text-xs text-stone-400 mt-10 text-center">
          {data.readsRemaining > 0
            ? `You can open this letter ${data.readsRemaining} more time${data.readsRemaining === 1 ? '' : 's'}.`
            : 'This was your last view of this letter.'}
        </p>
      </article>
    </main>
  )
}
