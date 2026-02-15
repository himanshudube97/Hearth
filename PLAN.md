# Hearth - Visual Effects & Themes Plan

## Overview
Calming visual effects for a journaling/mood app. All effects prioritize **calm, soothing aesthetics** over flashy animations.

---

## Design Principles

1. **Slow particle speeds** - No fast movement that causes anxiety
2. **Low FPS (30)** - Dreamier, smoother motion
3. **Subtle opacity** - Nothing harsh or bright
4. **Gentle ambient animations** - 10-30 second cycles
5. **Soft blurs** - All glow effects are diffused

---

## Themes (10 Total)

### Original Themes (Fixed)

| Theme | Particles | Key Fixes Applied |
|-------|-----------|-------------------|
| **Rivendell** | Fireflies | - |
| **Winter Sunset** | Snow | Speed reduced 0.5-2 → 0.08-0.25 (8x slower), wobble reduced |
| **Cherry Blossom** | Sakura | Speed reduced 1-3 → 0.15-0.4 (7x slower), rotation 5 → 1 |
| **Northern Lights** | Aurora stars | Replaced simplex-noise canvas with simple CSS gradients (20-25s animations) |
| **Misty Mountains** | Mist | Circle sizes reduced 50-150px → 8-25px (6x smaller) |

### New Themes Added

| Theme | Icon | Particles | Ambient Effects |
|-------|------|-----------|-----------------|
| **Gentle Rain** | 🌧️ | Slow raindrops | Distant lightning glow, overcast atmosphere |
| **Cosmos** | ✨ | Twinkling stars (very slow) | Purple/pink nebula clouds, galaxy band, shooting stars |
| **Candlelight** | 🕯️ | Floating dust motes | Warm flickering glow, subtle wall reflections |
| **Ocean Twilight** | 🌊 | Floating sea foam | Sunset horizon, wave shimmer, moon reflection |
| **Quiet Snow** | ❄️ | SVG snowflakes | Soft moonlight, snow ground glow, distant warm window |

---

## Particle Configurations

### Snow (Winter Sunset)
```
speed: 0.08 - 0.25 (very slow)
size: 1 - 3px
wobble: 0.3 speed
drift: -0.15 to 0.15
fpsLimit: 30
```

### Sakura (Cherry Blossom)
```
speed: 0.15 - 0.4 (very slow)
size: 6 - 12px
rotation: 1 speed
tilt: 0.8 speed
wobble: 0.5 speed
fpsLimit: 30
```

### Rain (Gentle Rain)
```
speed: 0.8 - 1.5
size: 1 - 2px
direction: bottom (straight)
fpsLimit: 30
```

### Stars (Cosmos)
```
speed: 0.02 (ultra slow)
size: 0.5 - 2px
twinkle: 0.03 frequency
opacity animation: 0.3 speed
fpsLimit: 30
```

### Dust (Candlelight)
```
speed: 0.05 - 0.15
size: 1 - 3px
warm glow shadow
fpsLimit: 30
```

### Foam (Ocean Twilight)
```
speed: 0.05 - 0.12
size: 2 - 6px
direction: top-right (gentle)
wobble: 0.2 speed
fpsLimit: 30
```

### Snowflakes (Quiet Snow)
```
speed: 0.2 - 0.5
size: 4 - 8px
direction: bottom
straight: true (no sideways movement)
rotation: 0.3 speed
SVG snowflake shapes
fpsLimit: 30
```

### Mist (Misty Mountains)
```
speed: 0.08 - 0.2
size: 8 - 25px (reduced from 50-150)
opacity: 0.03 - 0.12
blur: 8px
fpsLimit: 30
```

---

## Ambient Effects

### Northern Lights (CSS Aurora)
- 3 layered gradient ribbons (green, teal, purple)
- Slow scale/position animations (18-25s cycles)
- Soft vertical streaks
- Heavy blur (40-60px)

### Misty Mountains
- Mountain SVG layers (5 layers, staggered opacity)
- Simplex noise mist canvas
- Floating clouds
- Flying birds

### Gentle Rain
- Distant lightning glow (occasional, subtle)
- Overcast atmosphere gradient
- Window condensation hint

### Cosmos
- Nebula gradients (purple/pink)
- Galaxy band
- Shooting stars (rare)

### Candlelight
- Main candle glow (flickering 3s cycle)
- Ambient room warmth
- Subtle wall reflections

### Ocean Twilight
- Sunset horizon gradient
- Ocean surface shimmer
- Wave motion (horizontal sway)
- Moon reflection

### Quiet Snow
- Soft moonlight from above
- Snow ground reflection
- Distant warm window glow
- Cold atmosphere overlay

---

## Files Modified

- `src/lib/themes.ts` - Theme definitions, colors, whispers
- `src/components/Background.tsx` - Particle configs, ambient effects
- `src/components/ThemeSwitcher.tsx` - Theme icons

---

## Whispers Added

```
"Listen to the rain. It knows how to let go."
"The storm passes. It always does."
"Cozy moments are meant to be savored."
"You are made of stardust and wonder."
"The universe is vast. Your worries are small."
"In the darkness, even small lights matter."
"The flame dances, but it endures."
"Warmth begins from within."
"The ocean holds no grudges against the shore."
"Waves come and go. So do feelings."
"Float. The water will hold you."
"The tide knows when to rest."
"Each snowflake finds its place."
"The world grows quiet under snow."
"Stillness is its own kind of beauty."
"Let the cold air clear your mind."
```

---

## Future Considerations

- Add sound ambience (rain sounds, crackling fire, etc.)
- Time-of-day adaptive themes
- User-customizable particle density
- Accessibility: reduce motion option
