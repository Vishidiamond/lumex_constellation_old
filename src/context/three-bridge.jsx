// three-bridge.jsx
import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useThreeBridge } from "./three-provider";

/**
 * ThreeBridge: mounts inside Canvas, publishes camera/controls data to ThreeContext.
 * - throttles updates to ~100ms to prevent too many re-renders.
 */
export default function ThreeBridge({ throttleMs = 100 }) {
  const { camera, controls } = useThree();
  const { setState } = useThreeBridge();
  const last = useRef(0);

  useEffect(() => {
    // initial seed
    // const target = (controls && controls.target) || { x: 0, y: 0, z: 0 };
    setState((s) => ({
      ...s,
      camera, controls
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, controls]); // run once when they mount

  useFrame(() => {
    // const now = performance.now();
    // if (now - last.current < throttleMs) return;
    // last.current = now;

    // const target = (controls && controls.target) || camera.position;
    // const camPos = camera.position.toArray();
    // const ctrlTarget = [target.x, target.y, target.z];
    // const dist = camera.position.distanceTo(target);

    // setState((s) => {
    //   // shallow compare to avoid unnecessary state updates
    //   if (
    //     s.distance === dist &&
    //     s.cameraPosition[0] === camPos[0] &&
    //     s.cameraPosition[1] === camPos[1] &&
    //     s.cameraPosition[2] === camPos[2]
    //   ) {
    //     return s;
    //   }
    //   return { ...s, cameraPosition: camPos, controlsTarget: ctrlTarget, distance: dist };
    // });
  });

  return null;
}
