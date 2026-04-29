'use client'

import { Suspense } from 'react'
import { ShelfScene } from '@/components/shelf'

function Fallback() {
  return (
    <div className="max-w-4xl mx-auto p-8 text-center">
      <p className="text-sm opacity-50">opening the shelf…</p>
    </div>
  )
}

export default function ShelfPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ShelfScene />
    </Suspense>
  )
}
