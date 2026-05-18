// Replace your entire ModelLoader with this component
import { useRef, useLayoutEffect, useState, useEffect, useMemo, useCallback } from "react";
import * as THREE from "three";
import { Billboard, Html, useAnimations } from "@react-three/drei";
import useFadeMaterials from "../helper/useFadeMaterials";
import useIsResponsive from "../helper/useIsResponsive";

export default function ModelLoader({
  model,
  title = "",
  scale = 1,
  billboard = false,
  ctaLink = "www.google.com",
  labelDistanceFactor = 8,
  maxVwWidth = 22,
  fadeanimation = false,
  hitboxDisable = false,
  removeLabelVisibility = false,
  manualHoverDisable = false,
  showChangePropogation,
  renderOrder = 999,
  closeDelay = 180, // Increased default delay for Firefox robustness
}) {
  const groupRef = useRef();
  const hitboxRef = useRef();
  const labelDivRef = useRef(null);
  const isResponsive = useIsResponsive();
  const boxRef = useRef(null);
  const rafRef = useRef(null);
  const pointerRafRef = useRef(null);
  const leaveTimerRef = useRef(null);
  const lastPointerRef = useRef({ x: null, y: null });

  const [labelPos, setLabelPos] = useState([0, 0, 0]);
  const [logoPos, setLogoPos] = useState([0, 0, 0]);

  const [isOverObject, setIsOverObject] = useState(false);
  const [isOverLabel, setIsOverLabel] = useState(false);

  const isOverObjectRef = useRef(false);
  const isOverLabelRef = useRef(false);

  const { actions, names } = useAnimations(model?.animations, groupRef);

  // Play GLTF animation if present
  useEffect(() => {
    if (actions && names.length) {
      const a = actions[names[0]];
      a && a.reset().setLoop(THREE.LoopRepeat).fadeIn(0.5).play();
    }
    return () => {
      if (actions && names.length && actions[names[0]]) actions[names[0]].stop();
    };
  }, [actions, names]);

  // Compute bounding box and hitbox
  useLayoutEffect(() => {
    if (!groupRef.current || !model?.scene) return;
    const box = new THREE.Box3().setFromObject(groupRef.current);
    if (box.isEmpty()) return;

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    setLabelPos([center.x, box.min.y - Math.max(0.1, 0.04 * size.y), center.z]);
    if (billboard) setLogoPos([center.x, center.y, center.z]);
    boxRef.current = box;

    const padding = 1.03;
    const paddedSize = new THREE.Vector3(
      Math.max(size.x * padding, 0.001),
      Math.max(size.y * padding, 0.001),
      Math.max(size.z * padding, 0.001)
    );

    if (!hitboxDisable) {
      hitboxRef.current = {
        center: [center.x, center.y, center.z],
        size: [paddedSize.x, paddedSize.y, paddedSize.z],
      };
    }
  }, [model, scale, billboard, hitboxDisable]);

  // Fade materials
  useFadeMaterials(groupRef, {
    enabled: fadeanimation,
    minOpacity: 0.3,
    maxOpacity: 1,
    speed: 0.5,
  });

  const showLabel = isOverObject || isOverLabel;

  // notify parent safely
  useEffect(() => {
    if (typeof showChangePropogation === "function") {
      try {
        showChangePropogation(showLabel);
      } catch (e) {}
    }
  }, [showLabel, showChangePropogation]);

  // canvas cursor
  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    canvas.style.cursor = showLabel ? "pointer" : "";
    if (showChangePropogation) showChangePropogation(showLabel);
    return () => {
      if (canvas) canvas.style.cursor = "";
    };
  }, [showLabel]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (pointerRafRef.current) cancelAnimationFrame(pointerRafRef.current);
      rafRef.current = pointerRafRef.current = null;
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }
      document.removeEventListener("pointermove", pointerMoveListener, { passive: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // RAF-batched setters
  const scheduleObjectOver = useCallback((next) => {
    if (isOverObjectRef.current === next) return;
    isOverObjectRef.current = next;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setIsOverObject((prev) => (prev === isOverObjectRef.current ? prev : isOverObjectRef.current));
    });
  }, []);

  const scheduleLabelOver = useCallback((next) => {
    if (isOverLabelRef.current === next) return;
    isOverLabelRef.current = next;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setIsOverLabel((prev) => (prev === isOverLabelRef.current ? prev : isOverLabelRef.current));
    });
  }, []);

  // pointermove checker (RAF)
  const pointerMoveChecker = useCallback(() => {
    pointerRafRef.current = null;
    const div = labelDivRef.current;
    if (!div) {
      scheduleLabelOver(false);
      return;
    }
    const rect = div.getBoundingClientRect();
    const { x, y } = lastPointerRef.current;
    if (x == null || y == null) {
      scheduleLabelOver(false);
      return;
    }
    const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    scheduleLabelOver(inside);
  }, [scheduleLabelOver]);

  // pointermove store + schedule
  const pointerMoveListener = useCallback((e) => {
    lastPointerRef.current.x = e.clientX;
    lastPointerRef.current.y = e.clientY;
    if (pointerRafRef.current) return;
    pointerRafRef.current = requestAnimationFrame(pointerMoveChecker);
  }, [pointerMoveChecker]);

  // attach/detach pointermove when label visibility changes (stable listener)
  useEffect(() => {
    if (showLabel) {
      // attach once to document
      document.addEventListener("pointermove", pointerMoveListener, { passive: true });
      // immediate check if pointer already somewhere (no window.event reliance)
      // if lastPointerRef has values, run a check
      if (lastPointerRef.current.x != null && !pointerRafRef.current) {
        pointerRafRef.current = requestAnimationFrame(pointerMoveChecker);
      }
    } else {
      scheduleLabelOver(false);
      document.removeEventListener("pointermove", pointerMoveListener, { passive: true });
      if (pointerRafRef.current) {
        cancelAnimationFrame(pointerRafRef.current);
        pointerRafRef.current = null;
      }
    }
    return () => {
      document.removeEventListener("pointermove", pointerMoveListener, { passive: true });
      if (pointerRafRef.current) {
        cancelAnimationFrame(pointerRafRef.current);
        pointerRafRef.current = null;
      }
    };
  }, [showLabel, pointerMoveListener, pointerMoveChecker, scheduleLabelOver]);

  // removeLabelVisibility/manualHoverDisable guards
  useEffect(() => {
    if (removeLabelVisibility || manualHoverDisable) {
      isOverObjectRef.current = false;
      isOverLabelRef.current = false;
      setIsOverObject(false);
      setIsOverLabel(false);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (pointerRafRef.current) {
        cancelAnimationFrame(pointerRafRef.current);
        pointerRafRef.current = null;
      }
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }
      document.removeEventListener("pointermove", pointerMoveListener, { passive: true });
    }
  }, [removeLabelVisibility, manualHoverDisable, pointerMoveListener]);

  if (!model?.scene) return null;

  const ModelPrimitive = <primitive ref={groupRef} object={model.scene} scale={scale} />;

  // Hitbox handlers using pointerenter/pointerleave and leave delay
  const onHitboxPointerEnter = useCallback((e) => {
    e.stopPropagation();
    if (manualHoverDisable) return;
    if (!isResponsive) {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }
      // prime the label: ensure DOM will mount quickly (prevents race on Firefox)
      scheduleLabelOver(true);
      scheduleObjectOver(true);
    }
  }, [isResponsive, manualHoverDisable, scheduleLabelOver, scheduleObjectOver]);

  const onHitboxPointerLeave = useCallback((e) => {
    e.stopPropagation();
    if (manualHoverDisable) return;
    if (!isResponsive) {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = setTimeout(() => {
        leaveTimerRef.current = null;
        scheduleObjectOver(false);
        // schedule a quick check; pointerMove listener will pick up if pointer is on label
        scheduleLabelOver(false);
      }, closeDelay);
    }
  }, [isResponsive, manualHoverDisable, scheduleLabelOver, scheduleObjectOver, closeDelay]);

  const onHitboxClick = useCallback((e) => {
    e.stopPropagation();
    if (manualHoverDisable) return;
    if (isResponsive) {
      const next = !isOverObjectRef.current;
      scheduleObjectOver(next);
    } 
  }, [isResponsive, manualHoverDisable, ctaLink, scheduleObjectOver]);

  // memoized label DOM
  const memoLabelContent = useMemo(() => {
    return (
      <div
        style={{
          opacity: showLabel ? 1 : 0,
          willChange: "opacity, transform",
          background: "linear-gradient(180deg, rgba(0,0,0,0.66), rgba(0,0,0,0.45))",
          transition: "opacity 0.18s cubic-bezier(.32,2,.55,.27)",
          color: "white",
          borderRadius: 8,
          padding: "8px 10px",
          width: `clamp(160px, ${maxVwWidth}vw, 420px)`,
          boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
          userSelect: "auto",
          cursor: "unset",
        }}
      >
        <p style={{ margin: 0, fontSize: "clamp(12px, 1.2vw, 16px)", color: "white", cursor: "unset" }}>{title}</p>
        {ctaLink ? (
          <a
            href={
              ctaLink.startsWith("http") ||
              ctaLink.startsWith("mailto:") ||
              ctaLink.startsWith("tel:")
                ? ctaLink
                : `https://${ctaLink}`
            }
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#66d0ff",
              textDecoration: "underline",
              cursor: "pointer",         // ✅ force clickable
              WebkitTouchCallout: "default", // ✅ helps iOS long-press
              WebkitUserSelect: "auto",      // ✅ ensures text/link selectable
              userSelect: "auto",
              width: "100%",
              padding: '10px 10px 10px 0'
            }}
          >
            Read More
          </a>
        ) : null}
      </div>
    );
  }, [showLabel, title, ctaLink, maxVwWidth]);

  function ResponsiveLabel() {
    return (
      <Html center distanceFactor={labelDistanceFactor} transform>
        <div
          ref={labelDivRef}
          style={{
            pointerEvents: showLabel ? "auto" : "none",
            display: "inline-block",
          }}
        >
          {memoLabelContent}
        </div>
      </Html>
    );
  }

  const hitboxData = hitboxRef.current;

  return (
    <group>
      {billboard ? (
        <Billboard position={logoPos} follow>
          {ModelPrimitive}
        </Billboard>
      ) : (
        ModelPrimitive
      )}

      {/* {title && (
        <Billboard position={labelPos} follow>
          <ResponsiveLabel />
        </Billboard>
      )} */}

      {hitboxData && !hitboxDisable && (
        <mesh
          position={hitboxData.center}
          scale={hitboxData.size}
          frustumCulled={false}
          renderOrder={renderOrder}
          onPointerEnter={onHitboxPointerEnter}
          onPointerLeave={onHitboxPointerLeave}
          onClick={onHitboxClick}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
        </mesh>
      )}
    </group>
  );
}