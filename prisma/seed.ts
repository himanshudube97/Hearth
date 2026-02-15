import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const whispers = [
  { text: "The trees don't rush to grow. Neither should you.", category: "generic" },
  { text: "The river doesn't fight its path. It finds it.", category: "generic" },
  { text: "You're here now. That's what matters.", category: "generic" },
  { text: "Some things take root slowly.", category: "generic" },
  { text: "The page is patient.", category: "generic" },
  { text: "Even the forest rests in winter.", category: "generic" },
  { text: "What's growing in you today?", category: "generic" },
  { text: "The stars have time. So do you.", category: "generic" },
  { text: "Write freely. The words will find their way.", category: "generic" },
  { text: "This moment is yours alone.", category: "generic" },
  { text: "Let the thoughts come like leaves falling.", category: "generic" },
  { text: "There's wisdom in the quiet.", category: "generic" },
  { text: "Your story continues with each word.", category: "generic" },
  { text: "The fireflies return every summer. So will your light.", category: "generic" },
  { text: "Be gentle with yourself today.", category: "generic" },
  { text: "You've been carrying a lot this week. It's okay to set it down.", category: "mood-specific" },
  { text: "The last time you felt this good was a while ago. Notice what's different.", category: "pattern-based" },
  { text: "Your mornings are brighter than your evenings. But evening words run deeper.", category: "pattern-based" },
  { text: "You tend to scroll most in the afternoon. That might be your body asking for rest.", category: "pattern-based" },
  { text: "Heavy days pass. They always do.", category: "mood-specific" },
]

async function main() {
  console.log('Seeding whispers...')

  for (const whisper of whispers) {
    await prisma.whisper.upsert({
      where: { id: whisper.text.slice(0, 20) },
      update: {},
      create: whisper,
    })
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
