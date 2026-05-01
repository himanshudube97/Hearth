// src/components/shelf/shelfPalette.ts

// One curated color per month (index 0 = January, 11 = December).
// Spec: "Same color for the same month across years; year is conveyed
// by the etched roman numeral year on the spine label."
const MONTH_SPINE_COLORS: readonly string[] = [
  '#1f3656', // Jan — winter navy
  '#3a3760', // Feb — slate plum
  '#4a6b3a', // Mar — early spring moss
  '#6f8b4a', // Apr — sage
  '#88a35a', // May — fresh leaf
  '#c08a3e', // Jun — summer ochre
  '#b66a3a', // Jul — terracotta
  '#a3553a', // Aug — late summer rust
  '#8c4a2e', // Sep — autumn russet
  '#6e3a2c', // Oct — burnished brown
  '#553344', // Nov — wine plum
  '#3e2530', // Dec — deep aubergine
] as const

export function spineColor(monthIndex: number): string {
  return MONTH_SPINE_COLORS[monthIndex % 12]
}

const ROMAN_DIGITS: Array<[number, string]> = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]

export function toRoman(num: number): string {
  if (num <= 0 || !Number.isInteger(num)) return ''
  let n = num
  let out = ''
  for (const [value, symbol] of ROMAN_DIGITS) {
    while (n >= value) {
      out += symbol
      n -= value
    }
  }
  return out
}

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const

export function monthLabel(monthIndex: number): string {
  return MONTH_NAMES[monthIndex % 12]
}
