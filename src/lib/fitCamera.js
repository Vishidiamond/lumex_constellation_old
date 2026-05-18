// lib/fitCamera.js
import * as THREE from "three";

export function computeUnionBox(objectsOrScenes = []) {
  const box = new THREE.Box3();
  for (const o of objectsOrScenes) {
    if (!o) continue;
    const obj = o.scene || o; // accept gltf or object3D
    box.expandByObject(obj);
  }
  return box;
}

export function distanceForPerspective(box, camera, aspect) {
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  const radius = Math.max(sphere.radius, 1e-6);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(fov / 2) * aspect);
  const distV = radius / Math.sin(fov / 2);
  const distH = radius / Math.sin(hFov / 2);
  return { center: sphere.center.clone(), radius, distance: Math.max(distV, distH) };
}

export function fitCameraToBox({ camera, controls, box, padding = 1.2, duration = 0.6, onDone } = {}) {
  if (!box || box.isEmpty()) return;

  if (camera.isPerspectiveCamera) {
    const aspect = camera.aspect || 1;
    const { center, radius, distance } = distanceForPerspective(box, camera, aspect);
    const target = center.clone();

    // place camera along its current view direction (keeps azimuth/elevation)
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir); // -Z in camera space
    const toPos = center.clone().sub(dir.normalize().multiplyScalar(distance * padding));

    // sane near/far
    const near = Math.max(0.01, (distance * 0.05));
    const far  = Math.max(near + 1, distance + radius * 10);

    animateCamera({
      camera, controls,
      toPos, toTarget: target,
      toNear: near, toFar: far,
      duration, onDone
    });

  } else if (camera.isOrthographicCamera) {
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const width = size.x * padding;
    const height = size.y * padding;

    const viewWidth = camera.right - camera.left;
    const viewHeight = camera.top - camera.bottom;
    const newZoom = Math.min(viewWidth / width || 1, viewHeight / height || 1);

    animateCamera({
      camera, controls,
      toPos: camera.position.clone(), toTarget: center,
      toZoom: newZoom,
      duration, onDone
    });
  }
}

function animateCamera({ camera, controls, toPos, toTarget, toNear, toFar, toZoom, duration = 0.6, onDone }) {
  const fromPos = camera.position.clone();
  const fromTarget = controls ? controls.target.clone() : new THREE.Vector3();
  const fromNear = camera.near;
  const fromFar  = camera.far;
  const fromZoom = camera.zoom;

  const ease = (t)=>1-Math.pow(1-t,3); // easeOutCubic
  const start = performance.now();
  const durMs = Math.max(0, duration * 1000);

  function step(now) {
    const t = durMs ? Math.min(1, (now - start) / durMs) : 1;
    const k = ease(t);

    camera.position.lerpVectors(fromPos, toPos, k);
    if (controls) controls.target.lerpVectors(fromTarget, toTarget, k);

    if (toZoom != null && camera.isOrthographicCamera) {
      camera.zoom = THREE.MathUtils.lerp(fromZoom, toZoom, k);
    }
    if (toNear != null) camera.near = THREE.MathUtils.lerp(fromNear, toNear, k);
    if (toFar  != null) camera.far  = THREE.MathUtils.lerp(fromFar,  toFar,  k);

    camera.updateProjectionMatrix();
    if (controls) controls.update();

    if (t < 1) requestAnimationFrame(step); else onDone?.();
  }
  requestAnimationFrame(step);
}
