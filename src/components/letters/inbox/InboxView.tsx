'use client'
import PostalSky from './PostalSky'
import Lamp from './Lamp'
import Postbox from './Postbox'

interface Props { onUnreadCountChange: (n: number) => void }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function InboxView(_props: Props) {
  return (
    <section
      className="relative min-h-screen overflow-hidden"
      style={{ background: 'linear-gradient(180deg, var(--bg-1), var(--bg-2))' }}
    >
      <PostalSky />
      <div
        className="relative z-5 flex items-end justify-center w-full pt-[8%] pb-[8%]"
        style={{ minHeight: '100vh' }}
      >
        <div className="flex items-end gap-15">
          <Lamp />
          <Postbox />
        </div>
      </div>
    </section>
  )
}
