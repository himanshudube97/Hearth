'use client'

import { useAmbientSound } from '@/hooks/useAmbientSound'

// Mounts the ambient sound hook in isolation so volume/enabled changes don't
// re-render the heavy Background component. Renders nothing.
export default function AmbientSoundLayer() {
  useAmbientSound()
  return null
}
