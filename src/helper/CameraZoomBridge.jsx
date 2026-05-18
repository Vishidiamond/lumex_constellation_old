// helper/CameraZoomBridge.jsx
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import fitCameraConfig from "./fitCameraConfig.json"; // adjust path if needed

const EPS = 1e-3;
const DEFAULT_DAMPING = 8.0;

function getLimits() {
  const defaults = { minDistance: 0.5, maxDistance: 100 };
  try {
    const cfg = fitCameraConfig;
    const w = typeof window !== "undefined" ? window.innerWidth : 1024;
    const found = Object.values(cfg?.breakpoints || {}).find(
      (bp) => typeof bp?.maxWidth === "number" && w <= bp.maxWidth
    );
    const chosen = found || cfg?.defaults || defaults;
    return {
      min: chosen.minDistance ?? defaults.minDistance,
      max: chosen.maxDistance ?? defaults.maxDistance,
    };
  } catch {
    return defaults;
  }
}

// clamp camera along current direction from target
function clampCameraToLimits(camera, target, min, max) {
  const curDist = camera.position.distanceTo(target);
  const clamped = Math.min(Math.max(curDist, min), max);
  if (Math.abs(curDist - clamped) > 1e-6) {
    const dir = camera.position.clone().sub(target).normalize();
    if (dir.lengthSq() < 1e-8) dir.set(0, 0, 1);
    camera.position.copy(target.clone().add(dir.multiplyScalar(clamped)));
    if (typeof camera.updateProjectionMatrix === "function")
      camera.updateProjectionMatrix();
    return true;
  }
  return false;
}

const tmpVec = new THREE.Vector3();
const tmpDir = new THREE.Vector3();

const CameraZoomBridge = forwardRef(function CameraZoomBridge(
  { controlsRef, damping = DEFAULT_DAMPING },
  ref
) {
  const { camera } = useThree();

  // simple animation state
  const anim = useRef({
    active: false,
    targetDistance: 0,
    targetVec: new THREE.Vector3(),
  });

  // ---- apply limits to OrbitControls and clamp camera immediately ----
  useEffect(() => {
    const applyLimits = (ctrl) => {
      if (!ctrl) return;
      const { min, max } = getLimits();

      ctrl["minDistance"] = min;
      ctrl["maxDistance"] = max;

      // for orthographic controls/cameras if available
      console.log("ctrl.minZoom", ctrl.minZoom);
      console.log("ctrl.maxZoom", ctrl.maxZoom);
      if (typeof ctrl.minZoom !== "undefined") ctrl.minZoom = min;
      if (typeof ctrl.maxZoom !== "undefined") ctrl.maxZoom = max;

      // Immediately clamp camera if out of bounds
      //   try {
      //     const target = ctrl.target || new THREE.Vector3();
      //     const changed = clampCameraToLimits(camera, target, min, max);
      //     if (changed && typeof ctrl.update === "function") ctrl.update();
      //   } catch (e) {
      //     // ignore
      //   }
    };

    const ctrl = controlsRef?.current;
    if (!ctrl) return;

    // initial apply
    applyLimits(ctrl);

    // on resize re-apply (so breakpoints in fitCameraConfig work)
    function onResize() {
      applyLimits(ctrl);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [controlsRef, camera]);

  // Imperative API for DOM UI:
  useImperativeHandle(
    ref,
    () => ({
      zoomIn(step = 1.2) {
        const ctrl = controlsRef?.current;
        if (!ctrl) return;
        const target = ctrl.target
          ? ctrl.target.clone()
          : new THREE.Vector3(0, 0, 0);
        const cur = camera.position.distanceTo(target) || 1;
        const desired = cur / step;
        startAnim(desired, target);
      },
      zoomOut(step = 1.2) {
        const ctrl = controlsRef?.current;
        if (!ctrl) return;
        const target = ctrl.target
          ? ctrl.target.clone()
          : new THREE.Vector3(0, 0, 0);
        const cur = camera.position.distanceTo(target) || 1;
        const desired = cur * step;
        startAnim(desired, target);
      },
      setDistance(d) {
        const ctrl = controlsRef?.current;
        if (!ctrl) return;
        const target = ctrl.target
          ? ctrl.target.clone()
          : new THREE.Vector3(0, 0, 0);
        startAnim(d, target);
      },
      cancel() {
        anim.current.active = false;
      },
    }),
    [controlsRef, camera]
  );

  function startAnim(desiredDist, targetVec) {
    const limits = getLimits();
    const clamped = Math.min(Math.max(desiredDist, limits.min), limits.max);
    anim.current.targetDistance = clamped;
    anim.current.targetVec.copy(targetVec);
    anim.current.active = true;
  }

  // per-frame: lerp current distance -> targetDistance and apply camera position
  useFrame((_, delta) => {
    const ctrl = controlsRef?.current;
    if (!ctrl) return;
    const s = anim.current;
    if (!s.active) return;

    // compute direction and current distance w.r.t the current target (so panning is respected)
    const target = ctrl.target ? ctrl.target : s.targetVec;
    tmpDir.copy(camera.position).sub(target).normalize();
    if (tmpDir.lengthSq() < 1e-8) tmpDir.set(0, 0, 1);

    const curDist = camera.position.distanceTo(target);
    const desired = s.targetDistance;

    // delta-based exponential smoothing (frame-rate independent)
    const alpha = 1 - Math.exp(-damping * Math.max(delta, 1e-4));
    const nextDist = THREE.MathUtils.lerp(curDist, desired, alpha);

    tmpVec.copy(target).add(tmpDir.multiplyScalar(nextDist));
    camera.position.copy(tmpVec);

    // finish when close
    if (Math.abs(nextDist - desired) < EPS) {
      tmpVec.copy(target).add(tmpDir.multiplyScalar(desired));
      //   camera.position.copy(tmpVec);
      s.active = false;
    }

    // After moving, ensure we still respect limits (extra safety)
    try {
      const { min, max } = getLimits();
      const changed = clampCameraToLimits(camera, target, min, max);
      if (changed && typeof ctrl.update === "function") ctrl.update();
    } catch (e) {
      /* ignore */
    }

    if (typeof camera.updateProjectionMatrix === "function")
      camera.updateProjectionMatrix();
    if (typeof ctrl.update === "function") ctrl.update();
  });

  return null;
});

export default CameraZoomBridge;
