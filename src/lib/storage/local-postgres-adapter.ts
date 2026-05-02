import { prisma } from '@/lib/db'
import type { PhotoStorageAdapter } from './photo-adapter'

/**
 * Dev adapter: stores ciphertext as base64 in the EncryptedBlob table.
 * Handle = blob row id. Owner-scoped retrieve/delete enforces userId match.
 */
export class LocalPostgresAdapter implements PhotoStorageAdapter {
  async store(encryptedBytes: Buffer, userId: string): Promise<string> {
    const blob = await prisma.encryptedBlob.create({
      data: {
        userId,
        ciphertext: encryptedBytes.toString('base64'),
      },
    })
    return blob.id
  }

  async retrieve(handle: string, userId: string): Promise<Buffer> {
    const blob = await prisma.encryptedBlob.findFirst({
      where: { id: handle, userId },
    })
    if (!blob) throw new Error(`blob not found or not owned: ${handle}`)
    return Buffer.from(blob.ciphertext, 'base64')
  }

  async delete(handle: string, userId: string): Promise<void> {
    await prisma.encryptedBlob.deleteMany({
      where: { id: handle, userId },
    })
  }
}
