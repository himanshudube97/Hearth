import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============ JOURNAL ENTRIES SEED DATA ============

const journalEntries = [
  // Short entries
  { text: "Quiet morning. Coffee tastes better when you're not rushing.", tags: ["morning", "gratitude"] },
  { text: "Didn't sleep well. Head feels heavy.", tags: ["sleep"] },
  { text: "Finally fixed that bug that's been haunting me for days. Small wins.", tags: ["work", "coding"] },
  { text: "Rain outside. Perfect excuse to do nothing.", tags: ["weather"] },
  { text: "Mom called. She sounded happy today.", tags: ["family"] },
  { text: "Skipped the gym. Not feeling it.", tags: ["health"] },
  { text: "New song on repeat. Can't stop listening.", tags: ["music"], song: "Khoya Sa - Mohit Chauhan" },
  { text: "Overthinking again. Need to stop.", tags: ["reflection"] },
  { text: "Good chai, good book, good evening.", tags: ["evening", "reading"] },
  { text: "Felt invisible at work today.", tags: ["work"] },
  { text: "Walked in the park. The trees don't care about deadlines.", tags: ["nature", "walk"] },
  { text: "Cooked dinner from scratch. Felt proud.", tags: ["cooking", "gratitude"] },
  { text: "2 AM thoughts hitting different.", tags: ["night", "reflection"] },
  { text: "Laughed so hard today. Can't even remember why.", tags: ["happiness"] },
  { text: "Just existing today. That's enough.", tags: [] },
  { text: "Watched the sunset from the balcony. Orange bleeding into purple.", tags: ["nature", "evening"] },
  { text: "Headache won't go away.", tags: ["health"] },
  { text: "Sometimes silence is the loudest thing.", tags: ["reflection"] },
  { text: "Craving home food.", tags: ["home", "food"] },
  { text: "Productive day for once.", tags: ["work"] },

  // Medium entries
  { text: "Had a long conversation with an old friend today. We talked about how different life is from what we imagined five years ago. Neither of us is where we thought we'd be, but maybe that's okay. Plans change. People change. The important thing is we're still figuring it out.", tags: ["friendship", "reflection"] },
  { text: "Work has been draining lately. Not the work itself, but the constant context switching. By evening my brain feels like mush. Need to find a better way to protect my focus time. Maybe wake up earlier? Not sure I have it in me.", tags: ["work", "productivity"] },
  { text: "Spent the evening reorganizing my desk. There's something therapeutic about putting things in order when your mind feels chaotic. Found some old photos in a drawer. Younger me had no idea what was coming.", tags: ["home", "reflection"] },
  { text: "The neighborhood stray cat visited again. I've started keeping some food out for her. She doesn't let me pet her yet, but she sits nearby now. Progress.", tags: ["animals", "small-joys"] },
  { text: "Tried meditation again. Lasted about 4 minutes before my mind wandered to that embarrassing thing I said three years ago. Classic. Will try again tomorrow.", tags: ["meditation", "health"] },
  { text: "Festival season starting. The city feels different - more alive, more colorful. Even the traffic seems more tolerable when there are lights everywhere.", tags: ["festival", "city"] },
  { text: "Bad news from home. Nothing serious, but it reminded me how far away I am. Video calls aren't the same as being there.", tags: ["family", "home"] },
  { text: "Finished a book I'd been putting off for months. The ending wasn't what I expected, but maybe that's what made it good. Real life doesn't wrap up neatly either.", tags: ["reading", "reflection"] },
  { text: "Someone at work appreciated my work today. Publicly. It shouldn't matter this much, but it does. Recognition is a strange thing - you tell yourself you don't need it, until you get it.", tags: ["work", "gratitude"] },
  { text: "Went to bed angry, woke up still angry. Need to let this go. It's not worth the energy.", tags: ["emotions"] },

  // Longer reflective entries
  { text: "I've been thinking about the concept of 'home' lately. Is it a place? A feeling? A person? I've moved so many times now that the word has become abstract. My childhood home doesn't feel like mine anymore. My current apartment is just walls and rent. Maybe home is something you carry with you, not somewhere you go back to. Or maybe I'm just being philosophical because I'm tired and the chai is strong tonight.", tags: ["reflection", "home", "philosophy"], song: "Agar Tum Saath Ho - Arijit Singh" },
  { text: "Watched a documentary about time today. How it's not linear, how our perception of it changes. When I was a kid, summer holidays lasted forever. Now entire months disappear. They said time feels faster as you age because you're experiencing fewer new things. Everything becomes routine. Maybe that's why travel feels so long - everything is new. Note to self: do more new things. Break the pattern.", tags: ["reflection", "time", "documentary"] },
  { text: "Had dinner with colleagues. Everyone was talking about promotions, salaries, career ladders. I nodded along, but inside I was wondering if I even want to climb. What's at the top? More meetings? A fancier title? I don't know what I want, but I'm starting to suspect it's not what everyone else seems to want. Or maybe they're all pretending too.", tags: ["work", "career", "reflection"] },
  { text: "My grandfather used to say that the best things in life are free - sunlight, fresh air, laughter. I used to think it was just something old people say. But sitting on my balcony this evening, watching the sky change colors, not looking at my phone for once... I think I understand now. We complicate things. Happiness is simpler than we make it.", tags: ["gratitude", "wisdom", "evening"] },
  { text: "Rough week. Multiple deadlines, barely any sleep, and then my laptop decided to crash. Lost some work. I should be more upset than I am, but I think I've hit that point of exhaustion where everything becomes absurdly funny. Laughed at myself for twenty minutes. Maybe that's a coping mechanism. Maybe I'm losing it. Either way, weekend is here.", tags: ["work", "stress", "weekend"] },
  { text: "Someone asked me today where I see myself in five years. I hate that question. Five years ago I had no idea I'd be here. Life doesn't follow the script. I gave some generic answer about growth and learning, but the truth is I don't know. And maybe that's okay. Maybe not knowing is the only honest answer.", tags: ["future", "reflection", "uncertainty"] },

  // Letters/special entries
  { text: "Dear younger me,\n\nStop worrying so much about what people think. Most of them aren't thinking about you at all - they're too busy worrying about themselves. That thing you're embarrassed about? No one remembers it.\n\nAlso, call your grandparents more. Time moves faster than you think.\n\nFrom, the slightly less clueless version of you", tags: ["letter", "self"], entryType: "letter" },
  { text: "Things I never said:\n\nI was hurt when you didn't show up. I know you had reasons, but it still stung. I pretended it was fine because that's what I do - pretend things are fine. But they weren't. Maybe they still aren't. I don't know if I'll ever tell you this, but writing it down helps.", tags: ["unsent", "emotions"], entryType: "unsent_letter" },
  { text: "Note to future self:\n\nWhen you read this, remember how you felt today. Tired but hopeful. Uncertain but moving forward. Remember that you've survived every bad day so far. You'll survive whatever you're facing when you read this too.", tags: ["future-self", "hope"], entryType: "letter" },

  // More variety
  { text: "Woke up to birds singing. Didn't check my phone for an hour. Revolutionary.", tags: ["morning", "digital-detox"] },
  { text: "Nothing special happened today, and that's special in itself.", tags: [] },
  { text: "Cleaned the whole apartment. Sweat and satisfaction.", tags: ["cleaning", "home"] },
  { text: "Watched old videos of myself. Who was that person? We share a face but not much else.", tags: ["nostalgia", "reflection"] },
  { text: "The wifi went out. Read a physical book. Wild concept.", tags: ["reading", "humor"] },
  { text: "Burnt my dinner. Ordered in. No regrets.", tags: ["cooking", "food"] },
  { text: "Full moon tonight. Stood on the terrace for a while. The city noise fades when you look up.", tags: ["night", "nature"] },
  { text: "Interview didn't go well. Or maybe it did and I'm overthinking. The waiting is the worst part.", tags: ["career", "anxiety"] },
  { text: "Got the call. I got it. I actually got it.", tags: ["career", "success", "celebration"] },
  { text: "First day at new role. Imposter syndrome hitting hard. Everyone seems so competent.", tags: ["work", "new-beginnings"] },
  { text: "Three months in. Starting to feel like I belong here.", tags: ["work", "growth"] },
  { text: "Diwali alone this year. Video called family. Not the same, but the diyas still flicker the same way.", tags: ["festival", "family", "home"], song: "Tujhe Dekha To - Kumar Sanu" },
  { text: "New Year's Eve. Everyone's posting highlight reels. My year had lowlights too. That's okay. That's real.", tags: ["new-year", "reflection"] },
  { text: "2025. Fresh page. Same me. Let's see what happens.", tags: ["new-year", "hope"] },
  { text: "Winter mornings have a different kind of silence. Everything moves slower.", tags: ["winter", "morning"] },
  { text: "Made a stranger smile today. That's enough.", tags: ["kindness", "small-joys"] },
  { text: "Sometimes I write here just to prove to myself that I existed today. That I felt things. That the day wasn't just a blur of tasks.", tags: ["reflection", "existence"] },
  { text: "Re-read old entries. I've grown. Slowly, messily, but grown.", tags: ["reflection", "growth"] },
  { text: "The jacaranda tree outside is blooming. Purple everywhere. Nature doesn't need permission to be beautiful.", tags: ["nature", "beauty"] },
  { text: "Therapy session today. Cried a little. Felt lighter after.", tags: ["mental-health", "healing"] },
  { text: "Haven't written in a week. Life got busy. Or maybe I got avoidant. Back now.", tags: ["return"] },
  { text: "Power cut. Lit candles. Suddenly the evening felt like childhood.", tags: ["nostalgia", "home"] },
  { text: "Long walk after dinner. The city looks different at night. Softer.", tags: ["night", "walk", "city"] },
  { text: "Made chai the way Nani used to. Almost got it right.", tags: ["family", "cooking", "memories"] },
  { text: "Some days the words flow. Today they're stuck.", tags: ["writing", "block"] },
  { text: "Deadline tomorrow. Weirdly calm. Either I've prepared well or I've stopped caring. Hard to tell.", tags: ["work", "deadlines"] },
  { text: "Met someone interesting today. The kind of person who makes you think.", tags: ["people", "connection"] },
  { text: "Comfort movie night. Some films are like old friends.", tags: ["movies", "comfort"], song: "Kun Faya Kun - A.R. Rahman" },
  { text: "Caught myself complaining about small things. Perspective check needed. I have a roof, food, people who care. That's more than enough.", tags: ["gratitude", "perspective"] },
  { text: "The AC broke. Sweating through the night. Summer is merciless here.", tags: ["summer", "discomfort"] },
  { text: "First rain of the season. The smell of wet earth. Everything feels possible.", tags: ["monsoon", "rain", "joy"], song: "Bheegi Bheegi - Gangster" },
  { text: "Office politics exhausting me. I just want to do good work. Why is that not enough?", tags: ["work", "frustration"] },
  { text: "Booked tickets home. Countdown begins.", tags: ["home", "excitement", "family"] },
  { text: "Back from home. The apartment feels emptier now.", tags: ["home", "return", "loneliness"] },
  { text: "Started learning something new. Beginner again. Humbling and exciting.", tags: ["learning", "growth"] },
  { text: "Old friend getting married. Happy for them. Also, where did the years go?", tags: ["friendship", "milestones", "time"] },
  { text: "Deleted social media apps for a week. Day 1: already reaching for the phone. Habit runs deep.", tags: ["digital-detox", "habits"] },
  { text: "Day 7 without social media. Didn't miss much. Missed the illusion of connection though.", tags: ["digital-detox", "reflection"] },
  { text: "Birthday tomorrow. Another year. Not sure what to feel.", tags: ["birthday", "reflection"] },
  { text: "Birthday messages pouring in. Feeling loved today.", tags: ["birthday", "gratitude", "love"] },
  { text: "Sunday well spent. Did absolutely nothing productive. Perfect.", tags: ["weekend", "rest"] },
  { text: "Can't shake this restlessness. Like I should be doing something more. But what?", tags: ["restlessness", "purpose"] },
  { text: "Helped a junior at work today. Realized how far I've come without noticing.", tags: ["work", "mentoring", "growth"] },
  { text: "The moon was massive tonight. Pulled over just to look. Some things demand your attention.", tags: ["night", "nature", "awe"] },
  { text: "Anxious about tomorrow. Writing to calm down. It helps, a little.", tags: ["anxiety", "writing"] },
  { text: "Tomorrow came and went. It was fine. It's always fine. The worry is worse than the thing.", tags: ["anxiety", "relief", "reflection"] },
  { text: "Random act of kindness from a stranger. Faith in humanity slightly restored.", tags: ["kindness", "strangers", "hope"] },
  { text: "Feeling disconnected from everything. Going through motions. This will pass. It always does.", tags: ["low", "disconnection"] },
  { text: "Better today. Sleep helped. So did sunlight.", tags: ["recovery", "health"] },
  { text: "Grateful for: hot water, a working body, people who check in. The basics.", tags: ["gratitude", "basics"] },
  { text: "Watched kids playing in the park. Unfiltered joy. We unlearn that somewhere along the way.", tags: ["observation", "joy", "childhood"] },
  { text: "Project shipped. Months of work. Now the emptiness of 'what next'. Rest first.", tags: ["work", "achievement", "rest"] },
  { text: "Quarter-life crisis or just Tuesday? Hard to tell anymore.", tags: ["humor", "crisis", "life"] },
  { text: "Found an old playlist. Every song a time machine.", tags: ["music", "nostalgia", "memories"], song: "Tum Se Hi - Mohit Chauhan" },
  { text: "Cooked for friends. The kitchen was a mess. The laughter was worth it.", tags: ["cooking", "friends", "joy"] },
  { text: "Took a different route today. Small change, but the city looked new.", tags: ["exploration", "city", "routine"] },
  { text: "Overthinking spiral. Caught myself. Stepped outside. Better.", tags: ["anxiety", "coping", "nature"] },
  { text: "Video call with the gang. Miles apart, still feels close.", tags: ["friends", "connection", "distance"] },
  { text: "Spent too much on something I didn't need. Retail therapy is a lie.", tags: ["spending", "regret"] },
  { text: "Early morning flight. Airport at 4 AM has a strange energy. Everyone is somewhere between awake and dreaming.", tags: ["travel", "airport", "observation"] },
  { text: "New city. Everything unfamiliar. That's the whole point.", tags: ["travel", "adventure", "new-places"] },
  { text: "Back home. Suitcase unpacked. Memories filed away. Until next time.", tags: ["travel", "return", "home"] },
  { text: "Realized I've been running from stillness. Scared of what I'll hear in the quiet. Maybe it's time to listen.", tags: ["reflection", "stillness", "fear"] },
  { text: "Good day. No particular reason. Just good. Noting it down because I want to remember.", tags: ["happiness", "gratitude", "memory"] },
]

// Helper to generate random dates over 1.5 years
function generateDatesOver18Months(count: number): Date[] {
  const dates: Date[] = []
  const now = new Date()
  const eighteenMonthsAgo = new Date(now)
  eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18)

  const timeRange = now.getTime() - eighteenMonthsAgo.getTime()

  for (let i = 0; i < count; i++) {
    const randomTime = eighteenMonthsAgo.getTime() + Math.random() * timeRange
    const date = new Date(randomTime)
    // Vary the time of day
    date.setHours(Math.floor(Math.random() * 14) + 8) // 8 AM to 10 PM
    date.setMinutes(Math.floor(Math.random() * 60))
    dates.push(date)
  }

  return dates.sort((a, b) => a.getTime() - b.getTime())
}

async function seedJournalEntries() {
  console.log('Looking up user...')

  const user = await prisma.user.findUnique({
    where: { email: 'himansu.dube13@gmail.com' }
  })

  if (!user) {
    console.log('User not found. Creating user...')
    const newUser = await prisma.user.create({
      data: {
        email: 'himansu.dube13@gmail.com',
        name: 'Himanshu',
        provider: 'dev'
      }
    })
    console.log('User created:', newUser.id)
    return seedEntriesForUser(newUser.id)
  }

  console.log('User found:', user.id)
  return seedEntriesForUser(user.id)
}

async function seedEntriesForUser(userId: string) {
  // Check existing entries
  const existingCount = await prisma.journalEntry.count({
    where: { userId }
  })

  if (existingCount > 50) {
    console.log(`User already has ${existingCount} entries. Skipping seed to avoid duplicates.`)
    console.log('To re-seed, delete existing entries first.')
    return
  }

  console.log('Generating journal entries over 18 months...')

  const dates = generateDatesOver18Months(journalEntries.length)

  const entriesToCreate = journalEntries.map((entry, index) => ({
    text: entry.text,
    textPreview: entry.text.slice(0, 150),
    tags: entry.tags,
    entryType: entry.entryType || 'normal',
    song: entry.song || null,
    userId,
    createdAt: dates[index],
    updatedAt: dates[index],
  }))

  console.log(`Creating ${entriesToCreate.length} entries...`)

  // Use createMany for efficiency
  await prisma.journalEntry.createMany({
    data: entriesToCreate
  })

  console.log(`✓ Created ${entriesToCreate.length} journal entries spanning 18 months`)

  // Show date range
  const firstDate = dates[0]
  const lastDate = dates[dates.length - 1]
  console.log(`  Date range: ${firstDate.toDateString()} → ${lastDate.toDateString()}`)
}

// ============ WHISPERS SEED DATA ============

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
  console.log('🌱 Starting seed...\n')

  // Seed journal entries first
  await seedJournalEntries()

  console.log('\nSeeding whispers...')
  for (const whisper of whispers) {
    await prisma.whisper.upsert({
      where: { id: whisper.text.slice(0, 20) },
      update: {},
      create: whisper,
    })
  }

  console.log('\n✓ Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
