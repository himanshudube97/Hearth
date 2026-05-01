'use client'

interface Props {
  onBegin: () => void
}

export default function WriteCard({ onBegin }: Props) {
  return (
    <div className="write-card flex-[0_0_360px] mb-[60px] text-left">
      <div
        className="icon-row text-[56px] tracking-[14px] mb-[14px]"
        style={{ color: 'var(--accent-primary)' }}
      >
        ✉ ✦ ✉
      </div>
      <h2
        className="font-medium text-[44px] mb-[8px]"
        style={{ fontFamily: 'var(--font-caveat), Caveat, cursive', color: 'var(--text-primary)' }}
      >
        start a letter
      </h2>
      <p
        className="italic text-[16px] leading-[1.6] mb-[30px]"
        style={{ color: 'var(--text-secondary)' }}
      >
        address the envelope, turn it over to write — then fold &amp; seal.<br />
        a stamp will land in your album. the letter will arrive on its day.
      </p>
      <button
        onClick={onBegin}
        className="rounded-full px-[28px] py-[12px] pb-[14px] text-[22px] tracking-wide cursor-pointer text-white border-0"
        style={{
          fontFamily: 'var(--font-caveat), Caveat, cursive',
          background: 'var(--accent-primary)',
          boxShadow: '0 8px 22px rgba(0,0,0,0.20)',
        }}
      >
        begin a letter →
      </button>
      <div className="mt-[30px] italic text-[13px]" style={{ color: 'var(--text-muted)' }}>
        or pick a recipient:{' '}
        <strong
          className="not-italic text-[16px]"
          style={{ fontFamily: 'var(--font-caveat), Caveat, cursive', color: 'var(--text-primary)' }}
        >
          future me · someone close
        </strong>
      </div>
    </div>
  )
}
