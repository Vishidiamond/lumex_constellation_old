// components/FitCamera.jsx
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function FitCamera({ models }) {
  const { camera, controls, size } = useThree();

  useEffect(() => {
    if (!models || models.length === 0) return;

    const box = new THREE.Box3();

    models.forEach((m) => {
      if (m?.scene) {
        box.expandByObject(m.scene);
      }
    });

    if (box.isEmpty()) return;

    const boxSize = new THREE.Vector3();
    const boxCenter = new THREE.Vector3();
    box.getSize(boxSize);
    box.getCenter(boxCenter);

    const fov = camera.fov * (Math.PI / 180);
    const aspect = size.width / size.height;

    // Fit to both width and height
    const distanceX = boxSize.x / (2 * Math.tan(fov / 2)) / aspect;
    const distanceY = boxSize.y / (2 * Math.tan(fov / 2));
    let cameraZ = Math.max(distanceX, distanceY);

    // 🔹 Different scaling for desktop vs mobile/tablet
    if (size.width > 1024) {
      // Desktop
      cameraZ *= 0.5;
    } else {
      // Mobile & tablets
      cameraZ *= 0.8;
    }

    camera.position.set(boxCenter.x, boxCenter.y, cameraZ);
    camera.lookAt(boxCenter);

    if (controls) {
      controls.target.copy(boxCenter);
      controls.update();
    }
  }, [models]);

  return null;
}