// DraggableControls.jsx
import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { DragControls } from "three/examples/jsm/controls/DragControls";

export default function DraggableControls({ objects }) {
  const { camera, gl, scene } = useThree();

  useEffect(() => {
    if (!objects || objects.length === 0) return;

    const controls = new DragControls(objects, camera, gl.domElement);

    // Prevent orbit controls conflict
    controls.addEventListener("dragstart", (event) => {
      event.object.material.emissive = new THREE.Color(0xaaaaaa);
      gl.domElement.style.cursor = "grabbing";
    });

    controls.addEventListener("drag", (event) => {
      // Optional: keep Z fixed (only drag in X and Y)
      event.object.position.z = 0;
    });

    controls.addEventListener("dragend", (event) => {
      event.object.material.emissive = new THREE.Color(0x000000);
      gl.domElement.style.cursor = "grab";
    });

    return () => {
      controls.dispose();
    };
  }, [objects, camera, gl, scene]);

  return null;
}
