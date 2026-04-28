'use client'

// Placeholder index page. T15 replaces this with the scrapbook grid.
// Until then, this just renders a small redirect-style stub so the build
// stays green after T14's per-board route refactor.
export default function ScrapbookPage() {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: 'rgba(58,52,41,0.6)' }}>
      <div style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 22 }}>
        scrapbooks
      </div>
      <div style={{ marginTop: 6, fontSize: 14 }}>
        open a board from the URL: /scrapbook/[id]
      </div>
    </div>
  )
}
