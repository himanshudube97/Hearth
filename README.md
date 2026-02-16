# Hearth

A cozy, personal journaling app designed for long-term use. Track your moods, write your thoughts, and watch your story unfold over years.

## Features

### Writing
- Rich text editor with mood tracking (5 mood levels)
- Doodle canvas for sketches and drawings
- Song/music attachment for entries
- Writing prompts and whispers for inspiration

### Timeline
- **Year/Month Navigation** - Jump to any period instantly
- **Search** - Full-text search across all entries
- **Mood Filters** - Filter entries by mood
- **Infinite Scroll** - Smooth loading as you browse
- **Streak Tracking** - Current and longest writing streaks

### Calendar
- **Month View** - See your mood patterns day by day
- **Year View** - Heatmap showing monthly mood averages
- **Statistics** - Entries count, days written, average mood
- **Streak Display** - Track your consistency

### Customization
- **10 Themes** - Winter Sunset, Rivendell, Cherry Blossom, Northern Lights, and more
- **8 Custom Cursors** - Golden Orb, Quill Pen, Forest Leaf, Star, Heart, Moon, Feather, Crystal

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Editor**: TipTap
- **State**: Zustand

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd hearth
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your database URL
```

4. Set up the database
```bash
npx prisma db push
```

5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start journaling.

## API Reference

### Entries

#### GET /api/entries
Fetch entries with pagination and filters.

| Parameter | Type | Description |
|-----------|------|-------------|
| `cursor` | string | Entry ID for cursor-based pagination |
| `limit` | number | Max entries to return (default: 20, max: 50) |
| `month` | string | Filter by month (e.g., "2024-02") |
| `year` | string | Filter by year (e.g., "2024") |
| `mood` | string | Filter by mood(s) (e.g., "3" or "2,3,4") |
| `search` | string | Full-text search query |
| `today` | boolean | Only return today's entries |
| `includeDoodles` | boolean | Include doodle data (default: true) |
| `previewOnly` | boolean | Return preview text only, not full HTML |

**Response:**
```json
{
  "entries": [...],
  "pagination": {
    "hasMore": true,
    "nextCursor": "entry_id",
    "limit": 20
  }
}
```

#### GET /api/entries/stats
Get entry statistics for navigation and insights.

**Response:**
```json
{
  "totalEntries": 150,
  "years": [
    {
      "year": 2024,
      "entryCount": 45,
      "avgMood": 3.2,
      "months": [
        {
          "month": "2024-02",
          "entryCount": 12,
          "avgMood": 3.5,
          "daysWithEntries": 8
        }
      ]
    }
  ],
  "firstEntryDate": "2023-01-15T...",
  "lastEntryDate": "2024-02-16T...",
  "currentStreak": 5,
  "longestStreak": 21
}
```

#### POST /api/entries
Create a new entry.

#### PUT /api/entries/[id]
Update an existing entry.

#### DELETE /api/entries/[id]
Delete an entry.

## Architecture

### Scalability (Built for 5+ Years of Journaling)

The app is designed to handle thousands of entries efficiently:

| Feature | Implementation |
|---------|----------------|
| **Pagination** | Cursor-based (O(1) at any position) |
| **Filtering** | Server-side with database indexes |
| **Navigation** | Load by month (~30-60 entries max) |
| **List Views** | Preview text only (not full HTML) |
| **Doodles** | Lazy loaded on expand |
| **Stats** | Cached year/month summaries |

### Database Indexes
```prisma
@@index([userId, createdAt(sort: Desc)])  // Timeline queries
@@index([userId, mood])                    // Mood filtering
@@index([userId, createdAt, mood])         // Combined filters
```

## Project Structure

```
src/
├── app/
│   ├── api/entries/       # Entry CRUD + stats API
│   ├── calendar/          # Calendar view
│   ├── timeline/          # Timeline with search
│   ├── write/             # Writing interface
│   └── layout.tsx
├── components/
│   ├── Editor.tsx         # TipTap rich text editor
│   ├── MoodPicker.tsx     # Mood selection
│   ├── DoodleCanvas.tsx   # Drawing canvas
│   ├── EntryCard.tsx      # Entry display card
│   ├── CursorPicker.tsx   # Custom cursor selector
│   └── ThemeSwitcher.tsx  # Theme selector
├── hooks/
│   └── useEntries.ts      # Data fetching hooks
├── lib/
│   ├── themes.ts          # Theme definitions
│   └── cursors.ts         # Cursor definitions
└── store/
    ├── theme.ts           # Theme state (Zustand)
    ├── cursor.ts          # Cursor state (Zustand)
    └── journal.ts         # Journal state (Zustand)
```

## License

Private project.
