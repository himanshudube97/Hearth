import sharp from 'sharp'
import { getStroke } from 'perfect-freehand'

/**
 * StrokeData interface for doodle strokes
 * Points are [x, y] coordinate pairs
 */
interface StrokeData {
  points: number[][]
  color: string
  size: number
}

/**
 * Convert SVG outline points to SVG path d attribute string
 * Uses quadratic bezier curves for smooth strokes
 */
function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return ''

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q'] as (string | number)[]
  )

  d.push('Z')
  return d.join(' ')
}

/**
 * Calculate bounding box for strokes to determine viewBox
 */
function calculateBounds(strokes: StrokeData[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  strokes.forEach((stroke) => {
    stroke.points.forEach(([x, y]) => {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    })
  })

  return { minX, minY, maxX, maxY }
}

/**
 * Convert doodle stroke data to SVG string
 * @param strokes - Array of stroke data
 * @param width - Optional width for the SVG (default: 200)
 * @param height - Optional height for the SVG (default: 200)
 * @returns SVG string
 */
export function strokesToSvg(
  strokes: StrokeData[],
  width: number = 200,
  height: number = 200
): string {
  if (!strokes || strokes.length === 0) {
    // Return empty SVG
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"></svg>`
  }

  const bounds = calculateBounds(strokes)
  const padding = 20

  const viewBox = `${bounds.minX - padding} ${bounds.minY - padding} ${
    bounds.maxX - bounds.minX + padding * 2
  } ${bounds.maxY - bounds.minY + padding * 2}`

  const pathElements = strokes
    .map((strokeData) => {
      const outlinePoints = getStroke(strokeData.points, {
        size: strokeData.size,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      })
      const pathData = getSvgPathFromStroke(outlinePoints)
      return `<path d="${pathData}" fill="${strokeData.color}" opacity="0.9"/>`
    })
    .join('\n')

  return `<svg width="${width}" height="${height}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">${pathElements}</svg>`
}

/**
 * Convert doodle stroke data to PNG buffer via sharp
 * @param strokes - Array of stroke data
 * @param width - Optional width for the PNG (default: 200)
 * @param height - Optional height for the PNG (default: 200)
 * @returns Promise<Buffer | null> - PNG buffer or null if conversion fails
 */
export async function strokesToPng(
  strokes: StrokeData[],
  width: number = 200,
  height: number = 200
): Promise<Buffer | null> {
  try {
    const svgString = strokesToSvg(strokes, width, height)

    const buffer = await sharp(Buffer.from(svgString))
      .png()
      .toBuffer()

    return buffer
  } catch (error) {
    console.error('Error converting strokes to PNG:', error)
    return null
  }
}

/**
 * Convert doodle stroke data to base64 data URL
 * @param strokes - Array of stroke data
 * @param width - Optional width for the image (default: 200)
 * @param height - Optional height for the image (default: 200)
 * @returns Promise<string | null> - Base64 data URL or null if conversion fails
 */
export async function strokesToDataUrl(
  strokes: StrokeData[],
  width: number = 200,
  height: number = 200
): Promise<string | null> {
  try {
    const pngBuffer = await strokesToPng(strokes, width, height)

    if (!pngBuffer) {
      return null
    }

    const base64 = pngBuffer.toString('base64')
    return `data:image/png;base64,${base64}`
  } catch (error) {
    console.error('Error converting strokes to data URL:', error)
    return null
  }
}
