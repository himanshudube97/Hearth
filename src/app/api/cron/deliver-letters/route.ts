import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendLetterEmail, sendSelfLetterEmail } from '@/lib/email'
import { safeDecrypt } from '@/lib/encryption'
import { strokesToDataUrl } from '@/lib/doodle-to-image'

// This endpoint should be called by a cron job (e.g., Vercel Cron, or external service)
// It checks for letters that are due for delivery and sends them

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Find all letters that are due for delivery
    const dueLetters = await prisma.journalEntry.findMany({
      where: {
        entryType: 'letter',
        isSealed: true,
        isDelivered: false,
        unlockDate: {
          lte: now,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        photos: { select: { url: true, position: true, spread: true, rotation: true } },
        doodles: { select: { strokes: true, positionInEntry: true, spread: true } },
      },
      take: 50, // Process in batches to avoid timeout
    })

    if (dueLetters.length === 0) {
      return NextResponse.json({
        message: 'No letters to deliver',
        processed: 0,
      })
    }

    const results = {
      processed: 0,
      friendLetters: 0,
      selfLetters: 0,
      errors: [] as string[],
    }

    for (const letter of dueLetters) {
      try {
        // Render doodle to image if exists
        let doodleDataUrl: string | null = null
        if (letter.doodles && letter.doodles.length > 0) {
          const strokes = letter.doodles[0].strokes as { points: number[][]; color: string; size: number }[]
          doodleDataUrl = await strokesToDataUrl(strokes)
        }

        const photos = (letter.photos || []).map((p: { url: string; position: number }) => ({ url: p.url, position: p.position }))
        const songLink = letter.song || null

        // Determine if this is a friend letter or self letter
        if (letter.recipientEmail) {
          // Friend letter - send email to recipient
          // Decrypt sensitive fields before sending
          const senderName = safeDecrypt(letter.senderName) || letter.user.name || 'Someone special'
          const recipientName = safeDecrypt(letter.recipientName) || 'Friend'
          const letterContent = safeDecrypt(letter.text)
          const letterLocation = safeDecrypt(letter.letterLocation)

          const { success, error } = await sendLetterEmail({
            to: letter.recipientEmail!,
            recipientName,
            senderName,
            letterContent,
            letterLocation,
            writtenAt: letter.createdAt,
            photos,
            doodleDataUrl,
            songLink,
          })

          if (success) {
            results.friendLetters++
          } else {
            results.errors.push(`Failed to send friend letter ${letter.id}: ${error}`)
          }
        } else {
          // Self letter - send full letter content email to the user
          const { success, error } = await sendSelfLetterEmail({
            to: letter.user.email!,
            userName: letter.user.name || '',
            letterContent: safeDecrypt(letter.text),
            letterLocation: safeDecrypt(letter.letterLocation),
            writtenAt: letter.createdAt,
            photos,
            doodleDataUrl,
            songLink,
          })

          if (success) {
            results.selfLetters++
          } else {
            results.errors.push(`Failed to send self letter notification ${letter.id}: ${error}`)
          }
        }

        // Mark letter as delivered regardless of email success
        // (we don't want to keep retrying failed emails forever)
        await prisma.journalEntry.update({
          where: { id: letter.id },
          data: {
            isDelivered: true,
            deliveredAt: now,
          },
        })

        // Cross-user delivery: if recipient is a Hearth user, create a received entry
        if (letter.recipientEmail) {
          try {
            const recipientUser = await prisma.user.findUnique({
              where: { email: letter.recipientEmail },
            })

            if (recipientUser && recipientUser.id !== letter.userId) {
              await prisma.journalEntry.create({
                data: {
                  text: letter.text,
                  textPreview: letter.textPreview,
                  mood: letter.mood,
                  song: letter.song,
                  entryType: 'letter',
                  unlockDate: letter.unlockDate,
                  isSealed: true,
                  isDelivered: true,
                  deliveredAt: new Date(),
                  isReceivedLetter: true,
                  originalSenderId: letter.userId,
                  originalEntryId: letter.id,
                  senderName: letter.senderName,
                  recipientName: letter.recipientName,
                  letterLocation: letter.letterLocation,
                  encryptionType: letter.encryptionType,
                  userId: recipientUser.id,
                  photos: letter.photos.length > 0 ? {
                    create: letter.photos.map((p: { url: string; position: number; spread: number; rotation: number }) => ({
                      url: p.url,
                      position: p.position,
                      spread: p.spread,
                      rotation: p.rotation,
                    }))
                  } : undefined,
                  doodles: letter.doodles.length > 0 ? {
                    create: letter.doodles.map((d: { strokes: any; positionInEntry: number; spread: number }) => ({
                      strokes: d.strokes as any,
                      positionInEntry: d.positionInEntry,
                      spread: d.spread,
                    }))
                  } : undefined,
                },
              })
            }
          } catch (err) {
            console.error(`Failed to create received entry for ${letter.recipientEmail}:`, err)
            // Don't fail the whole delivery
          }
        }

        results.processed++
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        results.errors.push(`Error processing letter ${letter.id}: ${errorMsg}`)
      }
    }

    return NextResponse.json({
      message: `Processed ${results.processed} letters`,
      ...results,
    })
  } catch (error) {
    console.error('Error in deliver-letters cron:', error)
    return NextResponse.json(
      { error: 'Failed to process letters' },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility with different cron services
export async function POST(request: NextRequest) {
  return GET(request)
}
