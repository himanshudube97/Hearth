import { randomBytes } from 'node:crypto'
import { prisma } from '@/lib/db'

const DEFAULT_READS = 3
const DEFAULT_TTL_DAYS = 14

export function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

export async function createAccessToken(params: {
  letterId: string
  recipientEmail: string
  reads?: number
  ttlDays?: number
}) {
  const token = generateToken()
  const reads = params.reads ?? DEFAULT_READS
  const ttlDays = params.ttlDays ?? DEFAULT_TTL_DAYS
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000)
  return prisma.letterAccessToken.create({
    data: {
      token,
      letterId: params.letterId,
      recipientEmail: params.recipientEmail,
      readsRemaining: reads,
      expiresAt,
    },
  })
}

export type ConsumeResult =
  | { ok: true; tokenRow: NonNullable<Awaited<ReturnType<typeof prisma.letterAccessToken.findUnique>>> }
  | { ok: false; reason: 'not_found' | 'expired' | 'exhausted' }

export async function consumeToken(token: string): Promise<ConsumeResult> {
  const row = await prisma.letterAccessToken.findUnique({ where: { token } })
  if (!row) return { ok: false, reason: 'not_found' }
  if (row.expiresAt < new Date()) return { ok: false, reason: 'expired' }
  if (row.readsRemaining <= 0) return { ok: false, reason: 'exhausted' }

  const updated = await prisma.letterAccessToken.update({
    where: { token },
    data: {
      readsRemaining: { decrement: 1 },
      readCount: { increment: 1 },
      firstReadAt: row.firstReadAt ?? new Date(),
    },
  })
  return { ok: true, tokenRow: updated }
}
