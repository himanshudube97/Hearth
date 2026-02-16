import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendLetterEmailParams {
  to: string
  recipientName: string
  senderName: string
  letterContent: string
  letterLocation?: string | null
  writtenAt: Date
}

// Generate beautiful HTML email for letter delivery
function generateLetterEmail({
  recipientName,
  senderName,
  letterContent,
  letterLocation,
  writtenAt,
}: Omit<SendLetterEmailParams, 'to'>): string {
  const formattedDate = writtenAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Strip HTML tags for plain text sections but keep formatting for the main content
  const cleanContent = letterContent
    .replace(/<p><\/p>/g, '<br/>')
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '<br/>')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A Letter From ${senderName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1215; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1a1215; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px;">
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="font-size: 32px; margin-bottom: 8px;">✨</div>
              <h1 style="color: #f5e6d3; font-size: 24px; font-weight: 300; margin: 0; letter-spacing: 0.5px;">
                A letter has arrived
              </h1>
              <p style="color: #9a7b5b; font-size: 14px; margin: 8px 0 0 0;">
                Written ${letterLocation ? `from ${letterLocation}, ` : ''}${formattedDate}
              </p>
            </td>
          </tr>
        </table>

        <!-- Letter Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px;">
          <tr>
            <td style="background: linear-gradient(135deg, rgba(232,148,90,0.15) 0%, rgba(212,168,75,0.08) 100%); border-radius: 16px; border: 1px solid rgba(232,148,90,0.2);">

              <!-- Letter Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 24px 32px 16px 32px; border-bottom: 1px solid rgba(232,148,90,0.1);">
                    <p style="color: #9a7b5b; font-size: 14px; margin: 0; font-style: italic;">
                      Dear ${recipientName},
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Letter Content -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 24px 32px;">
                    <div style="color: #f5e6d3; font-family: 'Crimson Pro', Georgia, serif; font-size: 18px; line-height: 2; letter-spacing: 0.3px;">
                      ${cleanContent}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Letter Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 16px 32px 24px 32px; border-top: 1px solid rgba(232,148,90,0.1);">
                    <p style="color: #9a7b5b; font-size: 14px; margin: 0; font-style: italic; text-align: right;">
                      — ${senderName}
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- CTA Section -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px;">
          <tr>
            <td align="center" style="padding: 40px 0 24px 0;">
              <p style="color: #9a7b5b; font-size: 14px; margin: 0 0 16px 0;">
                Want to write a letter back?
              </p>
              <a href="https://hearth.app/letters"
                 style="display: inline-block; background-color: #e8945a; color: #1a1215; padding: 12px 32px; border-radius: 24px; text-decoration: none; font-size: 14px; font-weight: 500;">
                Write a Letter
              </a>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px;">
          <tr>
            <td align="center" style="padding: 24px 0; border-top: 1px solid rgba(154,123,91,0.2);">
              <p style="color: #6b5a4a; font-size: 12px; margin: 0;">
                Sent with warmth from <a href="https://hearth.app" style="color: #e8945a; text-decoration: none;">Hearth</a>
              </p>
              <p style="color: #4a3a2a; font-size: 11px; margin: 8px 0 0 0;">
                Words that travel through time
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`
}

export async function sendLetterEmail({
  to,
  recipientName,
  senderName,
  letterContent,
  letterLocation,
  writtenAt,
}: SendLetterEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const html = generateLetterEmail({
      recipientName,
      senderName,
      letterContent,
      letterLocation,
      writtenAt,
    })

    const { error } = await resend.emails.send({
      from: 'Hearth <letters@hearth.app>',
      to: [to],
      subject: `A letter from ${senderName} has arrived`,
      html,
    })

    if (error) {
      console.error('Failed to send letter email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Error sending letter email:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// Generate notification email for self-letters
export async function sendSelfLetterNotification({
  to,
  userName,
}: {
  to: string
  userName: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A Letter From Your Past Self</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1215; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1a1215; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px;">
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="font-size: 48px; margin-bottom: 16px;">✨</div>
              <h1 style="color: #f5e6d3; font-size: 24px; font-weight: 300; margin: 0;">
                A letter from the past has arrived
              </h1>
              <p style="color: #9a7b5b; font-size: 16px; margin: 16px 0 0 0; line-height: 1.6;">
                ${userName ? `Dear ${userName}, ` : ''}Your past self wrote you a letter, and it&apos;s ready to be opened.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 24px 0;">
              <a href="https://hearth.app"
                 style="display: inline-block; background-color: #e8945a; color: #1a1215; padding: 14px 40px; border-radius: 24px; text-decoration: none; font-size: 15px; font-weight: 500;">
                Open Your Letter
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 32px 0; border-top: 1px solid rgba(154,123,91,0.2);">
              <p style="color: #6b5a4a; font-size: 12px; margin: 0;">
                Sent with warmth from <a href="https://hearth.app" style="color: #e8945a; text-decoration: none;">Hearth</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`

    const { error } = await resend.emails.send({
      from: 'Hearth <letters@hearth.app>',
      to: [to],
      subject: 'A letter from your past self has arrived',
      html,
    })

    if (error) {
      console.error('Failed to send self letter notification:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Error sending self letter notification:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
