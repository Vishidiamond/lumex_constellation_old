// FirstPaintGate.jsx (or inline in App.jsx)
import { useFrame } from '@react-three/fiber'
import { useState } from 'react'

export default function FirstPaintGate({ onFirstPaint }) {
  const [done, setDone] = useState(false)
  useFrame(() => {
    if (!done) {
      setDone(true)
      // give one more tick so PMREM/material programs are ready
      setTimeout(() => onFirstPaint?.(), 0)
    }
  })
  return null
}
