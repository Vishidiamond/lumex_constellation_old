// useFadeMaterials.js
import { useEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"

/**
 * useFadeMaterials(rootRef, { enabled, minOpacity, maxOpacity, speed })
 * - rootRef: ref to the group/scene to traverse
 */
function useFadeMaterials(rootRef, { enabled = false, minOpacity = 0.4, maxOpacity = 1, speed = 1 } = {}) {
  const materialsRef = useRef([])
  const clockRef = useRef(0)

  useEffect(() => {
    materialsRef.current = []
    const root = rootRef.current
    if (!root) return

    root.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) {
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        mats.forEach((m) => {
          if (!m) return
          materialsRef.current.push({
            material: m,
            originalOpacity: typeof m.opacity === "number" ? m.opacity : 1,
            originalTransparent: !!m.transparent
          })
          m.transparent = true
        })
      }
    })

    return () => {
      materialsRef.current.forEach(({ material, originalOpacity, originalTransparent }) => {
        if (material && !material.isDisposed) {
          material.opacity = originalOpacity
          material.transparent = originalTransparent
        }
      })
      materialsRef.current = []
    }
  }, [rootRef])

  useFrame((_, delta) => {
    if (!enabled || materialsRef.current.length === 0) return
    clockRef.current += delta
    const t = 0.5 * (1 + Math.sin(clockRef.current * Math.PI * 2 * speed))
    const opacity = minOpacity + (maxOpacity - minOpacity) * t
    materialsRef.current.forEach(({ material }) => {
      if (material) material.opacity = opacity
    })
  })
}

export default useFadeMaterials