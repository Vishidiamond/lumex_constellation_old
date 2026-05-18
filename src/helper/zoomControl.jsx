import { useState } from "react";

export default function ZoomControls({ bridgeRef, controlsRef, step = 1.5, style }) {
  const [hoverIn, setHoverIn] = useState(false);
  const [hoverOut, setHoverOut] = useState(false);

  const doZoomIn = () => {
    // prefer bridge for smoothing
    if (bridgeRef?.current?.zoomIn) {
      bridgeRef.current.zoomIn();
      return;
    }
    // fallback: immediate dolly on controlsRef
    const ctrl = controlsRef?.current;
    if (!ctrl) return;
    if (typeof ctrl.dollyIn === "function") {
      ctrl.dollyIn(step);
      ctrl.update && ctrl.update();
      return;
    }
    // manual fallback
    const cam = ctrl.object;
    const target = ctrl.target ?? new THREE.Vector3();
    const dir = cam.position.clone().sub(target).normalize();
    const newDist = Math.max(cam.position.distanceTo(target) / step, 0.001);
    cam.position.copy(target.clone().add(dir.multiplyScalar(newDist)));
    if (cam.updateProjectionMatrix) cam.updateProjectionMatrix();
    ctrl.update && ctrl.update();
  };

  const doZoomOut = () => {
    if (bridgeRef?.current?.zoomOut) {
      bridgeRef.current.zoomOut();
      return;
    }
    const ctrl = controlsRef?.current;
    if (!ctrl) return;
    if (typeof ctrl.dollyOut === "function") {
      ctrl.dollyOut(step);
      ctrl.update && ctrl.update();
      return;
    }
    const cam = ctrl.object;
    const target = ctrl.target ?? new THREE.Vector3();
    const dir = cam.position.clone().sub(target).normalize();
    const newDist = cam.position.distanceTo(target) * step;
    cam.position.copy(target.clone().add(dir.multiplyScalar(newDist)));
    if (cam.updateProjectionMatrix) cam.updateProjectionMatrix();
    ctrl.update && ctrl.update();
  };

  const containerStyle = {
    position: "fixed",
    right: 20,
    bottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    zIndex: 999999,
    pointerEvents: "auto",
    userSelect: "none",
    ...style,
  };

  const btnBase = {
    width: 44,
    height: 44,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "white",
    color: "black",
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
    cursor: "pointer",
    fontSize: 20,
  };

  const hoverStyle = { transform: "translateY(-3px) scale(1.04)", background: "rgba(30,30,30,0.85)", color: "white" };

  return (
    <div style={containerStyle}>
      <button
        title="Zoom in"
        onMouseEnter={() => setHoverIn(true)}
        onMouseLeave={() => setHoverIn(false)}
        onClick={doZoomIn}
        style={{ ...btnBase, ...(hoverIn ? hoverStyle : {}) }}
      >
        −
      </button>

      <button
        title="Zoom out"
        onMouseEnter={() => setHoverOut(true)}
        onMouseLeave={() => setHoverOut(false)}
        onClick={doZoomOut}
        style={{ ...btnBase, ...(hoverOut ? hoverStyle : {}) }}
      >
        +
      </button>
    </div>
  );
}
