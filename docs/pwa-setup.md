# PWA Setup Plan for Hearth

## What is a PWA?

A Progressive Web App makes your website installable and app-like on mobile devices. Users can add Hearth to their home screen, use it full-screen, and even access some features offline.

**Key benefits:**
- App-like experience without App Store
- Use Stripe directly (no 30% cut)
- One codebase for web + mobile
- Instant updates (no app review)
- Works on iOS, Android, and desktop

---

## PWA Requirements Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| HTTPS | Required | Vercel provides this |
| Web App Manifest | To add | `manifest.json` |
| Service Worker | To add | For offline + caching |
| Responsive design | ✅ Done | Hearth already responsive |
| App icons | To add | Multiple sizes needed |
| Splash screens | To add | iOS requires special tags |
| Viewport meta tag | ✅ Done | Next.js default |

---

## Implementation Steps

### Step 1: Create App Icons

You need icons in multiple sizes. Create these in `public/icons/`:

```
public/
├── icons/
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-384.png
│   ├── icon-512.png
│   └── maskable-512.png    # Safe zone icon for Android
├── apple-touch-icon.png     # 180x180 for iOS
└── favicon.ico
```

**Tools to generate icons:**
- [PWA Asset Generator](https://github.com/nickmessing/pwa-asset-generator) (CLI)
- [Favicon.io](https://favicon.io/) (Manual)
- [RealFaviconGenerator](https://realfavicongenerator.net/) (Best for all platforms)

**Design tip:** Hearth icon should work on both light and dark backgrounds. Consider a simple, recognizable symbol (flame, heart, or your logo).

---

### Step 2: Create Web App Manifest

Create `public/manifest.json`:

```json
{
  "name": "Hearth",
  "short_name": "Hearth",
  "description": "A meditative journal that listens",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0f0f1a",
  "theme_color": "#0f0f1a",
  "categories": ["lifestyle", "productivity", "health"],
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mobile-home.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Hearth home screen"
    },
    {
      "src": "/screenshots/mobile-write.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Writing a journal entry"
    }
  ],
  "shortcuts": [
    {
      "name": "Write Entry",
      "short_name": "Write",
      "description": "Start a new journal entry",
      "url": "/write",
      "icons": [{ "src": "/icons/shortcut-write.png", "sizes": "96x96" }]
    },
    {
      "name": "My Letters",
      "short_name": "Letters",
      "description": "View your letters",
      "url": "/letters",
      "icons": [{ "src": "/icons/shortcut-letters.png", "sizes": "96x96" }]
    }
  ],
  "related_applications": [],
  "prefer_related_applications": false
}
```

**Display modes:**
- `standalone` - Looks like native app (recommended)
- `fullscreen` - No status bar (games)
- `minimal-ui` - Small browser controls
- `browser` - Normal browser tab

---

### Step 3: Update Layout with Meta Tags

Update `src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f5' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f1a' },
  ],
}

export const metadata: Metadata = {
  title: 'Hearth',
  description: 'A meditative journal that listens',
  manifest: '/manifest.json',

  // Apple PWA meta tags
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hearth',
    startupImage: [
      {
        url: '/splash/apple-splash-2048-2732.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/splash/apple-splash-1170-2532.png',
        media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash/apple-splash-1179-2556.png',
        media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)',
      },
      // Add more sizes as needed
    ],
  },

  // Icons
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  // Open Graph (for sharing)
  openGraph: {
    title: 'Hearth',
    description: 'A meditative journal that listens',
    url: 'https://hearth.app',
    siteName: 'Hearth',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
}
```

---

### Step 4: Set Up Service Worker with next-pwa

**Install the package:**
```bash
npm install next-pwa
```

**Update `next.config.js`:**
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable in dev
  runtimeCaching: [
    {
      // Cache API responses
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
      },
    },
    {
      // Cache images
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      // Cache fonts
      urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'font-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      // Cache pages
      urlPattern: /^https:\/\/hearth\.app\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'page-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
      },
    },
  ],
})

module.exports = withPWA({
  // Your existing Next.js config
  reactStrictMode: true,
})
```

**Add to `.gitignore`:**
```
# PWA files (auto-generated)
public/sw.js
public/workbox-*.js
public/sw.js.map
public/workbox-*.js.map
```

---

### Step 5: Add Install Prompt Component

Create `src/components/InstallPrompt.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const { theme } = useThemeStore()

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

    // Listen for install prompt (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Show iOS prompt after a delay
    if (isIOSDevice) {
      const dismissed = localStorage.getItem('pwa-prompt-dismissed')
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setShowPrompt(false)
      }
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  if (!showPrompt) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-4 left-4 right-4 z-50 p-4 rounded-2xl"
        style={{
          background: theme.glass.bg,
          backdropFilter: `blur(${theme.glass.blur})`,
          border: `1px solid ${theme.glass.border}`,
          boxShadow: `0 10px 40px ${theme.accent.primary}20`,
        }}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
      >
        <div className="flex items-start gap-4">
          <div className="text-3xl">✨</div>
          <div className="flex-1">
            <h3
              className="font-medium mb-1"
              style={{ color: theme.text.primary }}
            >
              Add Hearth to Home Screen
            </h3>
            <p
              className="text-sm mb-3"
              style={{ color: theme.text.secondary }}
            >
              {isIOS
                ? 'Tap the share button, then "Add to Home Screen"'
                : 'Install for quick access and a better experience'}
            </p>

            <div className="flex gap-2">
              {!isIOS && (
                <button
                  onClick={handleInstall}
                  className="px-4 py-2 rounded-full text-sm font-medium"
                  style={{
                    background: theme.accent.primary,
                    color: theme.bg.primary,
                  }}
                >
                  Install
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-full text-sm"
                style={{
                  color: theme.text.muted,
                  border: `1px solid ${theme.glass.border}`,
                }}
              >
                {isIOS ? 'Got it' : 'Not now'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
```

**Add to your layout:**
```tsx
// src/app/layout.tsx or a client wrapper
import { InstallPrompt } from '@/components/InstallPrompt'

// Inside your layout
<InstallPrompt />
```

---

### Step 6: Offline Support for Journaling

Create offline-first journaling experience:

**`src/lib/offlineStorage.ts`:**
```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface HearthDB extends DBSchema {
  'offline-entries': {
    key: string
    value: {
      id: string
      text: string
      mood: number
      createdAt: string
      synced: boolean
    }
  }
  'pending-sync': {
    key: string
    value: {
      id: string
      action: 'create' | 'update' | 'delete'
      data: unknown
      timestamp: number
    }
  }
}

let db: IDBPDatabase<HearthDB>

export async function getDB() {
  if (!db) {
    db = await openDB<HearthDB>('hearth-offline', 1, {
      upgrade(db) {
        db.createObjectStore('offline-entries', { keyPath: 'id' })
        db.createObjectStore('pending-sync', { keyPath: 'id' })
      },
    })
  }
  return db
}

export async function saveEntryOffline(entry: HearthDB['offline-entries']['value']) {
  const db = await getDB()
  await db.put('offline-entries', entry)

  // Queue for sync
  await db.put('pending-sync', {
    id: `sync-${entry.id}`,
    action: 'create',
    data: entry,
    timestamp: Date.now(),
  })
}

export async function getOfflineEntries() {
  const db = await getDB()
  return db.getAll('offline-entries')
}

export async function syncPendingEntries() {
  const db = await getDB()
  const pending = await db.getAll('pending-sync')

  for (const item of pending) {
    try {
      // Sync to server
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      })

      // Remove from pending
      await db.delete('pending-sync', item.id)

      // Mark as synced
      const entry = await db.get('offline-entries', (item.data as { id: string }).id)
      if (entry) {
        entry.synced = true
        await db.put('offline-entries', entry)
      }
    } catch (error) {
      console.log('Sync failed, will retry later')
    }
  }
}
```

**Install idb:**
```bash
npm install idb
```

**Sync when online:**
```typescript
// In a useEffect or layout
useEffect(() => {
  const handleOnline = () => {
    syncPendingEntries()
  }

  window.addEventListener('online', handleOnline)

  // Sync on load if online
  if (navigator.onLine) {
    syncPendingEntries()
  }

  return () => window.removeEventListener('online', handleOnline)
}, [])
```

---

### Step 7: Push Notifications (Letter Arrivals)

**Enable Web Push for "Your letter has arrived!" notifications.**

**Install web-push:**
```bash
npm install web-push
```

**Generate VAPID keys:**
```bash
npx web-push generate-vapid-keys
```

Add to `.env`:
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BPxxx...
VAPID_PRIVATE_KEY=xxx...
VAPID_EMAIL=mailto:you@example.com
```

**`src/lib/notifications.ts`:**
```typescript
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  })

  // Send subscription to server
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  })

  return subscription
}
```

**`src/app/api/push/send/route.ts`:**
```typescript
import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: Request) {
  const { userId, title, body } = await req.json()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushSubscription: true },
  })

  if (user?.pushSubscription) {
    await webpush.sendNotification(
      JSON.parse(user.pushSubscription),
      JSON.stringify({ title, body })
    )
  }

  return Response.json({ success: true })
}
```

**Add to User model:**
```prisma
model User {
  // ... existing fields
  pushSubscription  String?  // JSON string of push subscription
}
```

---

### Step 8: iOS-Specific Considerations

iOS has some PWA limitations:

| Feature | iOS Support |
|---------|-------------|
| Add to Home Screen | ✅ Works |
| Full screen mode | ✅ Works |
| Push notifications | ✅ iOS 16.4+ only |
| Background sync | ❌ Limited |
| Splash screen | ✅ Needs special tags |

**iOS Splash Screens:**

You need specific sizes for each device. Generate with [pwa-asset-generator](https://github.com/nickmessing/pwa-asset-generator):

```bash
npx pwa-asset-generator logo.png public/splash --splash-only --background "#0f0f1a"
```

---

### Step 9: Testing Your PWA

**Chrome DevTools:**
1. Open DevTools → Application tab
2. Check "Manifest" section for errors
3. Check "Service Workers" for registration
4. Use "Lighthouse" tab for PWA audit

**Test Install Flow:**
1. Deploy to HTTPS (Vercel preview URL works)
2. Open in Chrome mobile
3. Should see "Add to Home Screen" banner
4. Or: Menu → "Install app"

**Test Offline:**
1. Open DevTools → Network tab
2. Set to "Offline"
3. Reload page
4. Should see cached content

**Lighthouse PWA Audit:**
1. DevTools → Lighthouse
2. Check "Progressive Web App"
3. Run audit
4. Fix any issues

---

## File Structure After Setup

```
public/
├── manifest.json
├── favicon.ico
├── apple-touch-icon.png
├── og-image.png
├── icons/
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-384.png
│   ├── icon-512.png
│   └── maskable-512.png
├── splash/
│   ├── apple-splash-2048-2732.png
│   ├── apple-splash-1170-2532.png
│   └── ... (other sizes)
├── screenshots/
│   ├── mobile-home.png
│   └── mobile-write.png
├── sw.js              (auto-generated by next-pwa)
└── workbox-*.js       (auto-generated by next-pwa)

src/
├── app/
│   └── layout.tsx     (updated with PWA meta tags)
├── components/
│   └── InstallPrompt.tsx
└── lib/
    ├── offlineStorage.ts
    └── notifications.ts

next.config.js          (updated with PWA config)
```

---

## Implementation Order

| Step | Task | Priority |
|------|------|----------|
| 1 | Create app icons (all sizes) | Required |
| 2 | Create `manifest.json` | Required |
| 3 | Update `layout.tsx` with meta tags | Required |
| 4 | Install & configure `next-pwa` | Required |
| 5 | Test PWA in Chrome | Required |
| 6 | Add `InstallPrompt` component | Nice to have |
| 7 | Add iOS splash screens | Nice to have |
| 8 | Implement offline storage | Nice to have |
| 9 | Add push notifications | Future |

---

## Deployment Checklist

- [ ] All icon sizes generated
- [ ] `manifest.json` has correct `start_url` and `scope`
- [ ] Service worker registers successfully
- [ ] Site works on HTTPS
- [ ] Lighthouse PWA score is 90+
- [ ] Install prompt appears on mobile
- [ ] Installed app opens in standalone mode
- [ ] Basic offline page works
- [ ] iOS splash screens display correctly

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Install prompt not showing | Must be HTTPS, manifest must be valid |
| Service worker not updating | Clear cache, or update `skipWaiting: true` |
| iOS not showing splash | Specific sizes required, check meta tags |
| Offline not working | Check service worker console for errors |
| Push not working on iOS | Requires iOS 16.4+, user must install PWA first |

---

## Resources

- [web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)
- [PWA Asset Generator](https://github.com/nickmessing/pwa-asset-generator)
- [Workbox (Service Worker)](https://developers.google.com/web/tools/workbox)
- [Apple PWA Documentation](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
