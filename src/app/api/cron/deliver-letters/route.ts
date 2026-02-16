import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendLetterEmail, sendSelfLetterNotification } from '@/lib/email'
import { safeDecrypt } from '@/lib/encryption'

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
        // Determine if this is a friend letter or self letter
        if (letter.recipientEmail) {
          // Friend letter - send email to recipient
          // Decrypt sensitive fields before sending
          const senderName = safeDecrypt(letter.senderName) || letter.user.name || 'Someone special'
          const recipientName = safeDecrypt(letter.recipientName) || 'Friend'
          const letterContent = safeDecrypt(letter.text)
          const letterLocation = safeDecrypt(letter.letterLocation)

          const { success, error } = await sendLetterEmail({
            to: letter.recipientEmail,
            recipientName,
            senderName,
            letterContent,
            letterLocation,
            writtenAt: letter.createdAt,
          })

          if (success) {
            results.friendLetters++
          } else {
            results.errors.push(`Failed to send friend letter ${letter.id}: ${error}`)
          }
        } else {
          // Self letter - send notification to the user
          const { success, error } = await sendSelfLetterNotification({
            to: letter.user.email,
            userName: letter.user.name || '',
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
