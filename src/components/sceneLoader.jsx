// components/SceneLoader.jsx
import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { useGLTF, Preload, useProgress, Bounds, Billboard, Html } from '@react-three/drei'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import ModelLoader from './modelLoader'
import FitCamera from '../helper/fitCamera'

// draco
useGLTF.setDecoderPath('/draco/')

export default function SceneLoader(props) {
  const { active, progress, loaded, total, item } = useProgress()

  // Define items ONCE, derive urls from it (keeps order consistent)
  const items = useMemo(() => ([
    { url: '/assets/center.glb', fade: true, renderOrder: 1 }, // invisible center for easy rotation
    { url: '/assets/star.glb', hitboxDisable: true }, // keep stars visible but typically no label
    { url: '/assets/orion.glb',   text: 'Lumex Group rises as the cosmic balance between disruption and creation-championing a brand new era of diamonds.', cta: 'https://lumexgroup.com/' },
    { url: '/assets/aquarius.glb',text: 'Atelier Amara celebrates fluidity of being human-our innovative jewels inspire unique expressions of individuality.', cta: 'https://atelieramara.com/' },
    { url: '/assets/cygnus.glb',  text: 'Nsphere is a futurist creation blueprint that weaves together technology & artistry to generate designs at scale.', cta: 'https://nsphere.ai/' },
    { url: '/assets/lyra.glb',    text: 'With Uncertify.ai we are defying the status quo by democratizing the value of your diamond, and giving the power back to you!', cta: 'https://uncertify.ai/' },
    { url: '/assets/phoenix.glb', text: 'Fortunoff is a legacy reborn; a take on the classic to now make it iconic!', cta: 'https://www.fortunoff.com/ ' },
    { url: '/assets/ursa_major.glb', text: 'Lumex.Online emerging as the north star guides the entire diamond eco-system together onto one digital commerce platform unlike ever before.', cta: 'https://lumex.online/' },
  ]), [])

  const urls = useMemo(() => items.map(i => i.url), [items])
  const envURL = '/assets/nebulas_4.hdr'

  useEffect(() => {
    console.log(`Loading: `, active, progress, loaded, total, item)
    props.loaderEvent({ active, progress, loaded, total, item });
  }, [active, progress, loaded, total, item])

  return (
    <group position={props.position}>
      <Suspense fallback={null}>
        <PreloadAssets urls={urls} envURL={envURL} />

        {/* Responsive auto-fit to the union of all children */}
        <Bounds fit clip observe margin={0.35}>
          <SceneContent items={items} />
        </Bounds>
      </Suspense>
    </group>
  )
}

function PreloadAssets({ urls, envURL }) {
  urls.forEach((u) => useGLTF.preload(u))
  const hdr = useLoader(RGBELoader, envURL)
  hdr.mapping = THREE.EquirectangularReflectionMapping
  THREE.Cache.add(envURL, hdr)
  return <Preload all />
}

function SceneContent({ items }) {

  const [openTitleObjectUrl, setOpenTitleObjectUrl] = React.useState(null);

  const CONSTELLATIONS = [
    { 
      name: "Orion", 
      url: "/assets/lumex_logo.glb", 
      position: [-0.11, -0.77, 3.732],
      scale: 0.15
    },
    { 
      name: "Ursa Major", 
      url: "/assets/lumex_online_logo.glb", 
      position: [-7.86, 2.56, -2.43],
      scale: 0.15
    },
    { 
      name: "Cygnus", 
      url: "/assets/nsphere_logo.glb", 
      position: [-0.21836, 8.2712, -1.486],
      scale: 0.15
    },
    { 
      name: "Lyra", 
      url: "/assets/uncertify_logo.glb", 
      position: [8.22, 2.95, -0.96],
      scale: 0.15
    },
    { 
      name: "Aquarius", 
      url: "/assets/atelier_logo.glb", 
      position: [4.208, -6.051, 0.9],
      scale: 0.15
    },
    { 
      name: "Phoenix", 
      url: "/assets/fortunoff_logo.glb", 
      position: [-5.243, -6.688, -0.9],
      scale: 0.15
    },
  ]

  const gltfsByUrl = useMemo(() => {
    const map = new Map();
    items.forEach(({ url }) => map.set(url, useGLTF(url, true)));
    return map;
  }, [items]);

  // build a stable array of objects for fitting
  const objects = useMemo(
    () => items.map(it => gltfsByUrl.get(it.url)).filter(Boolean),
    [items, gltfsByUrl]
  );

  // ---------- Camera animation state ----------
  const { camera, controls } = useThree();
  const animRef = useRef({
    isAnimating: false,
    t: 0,
    duration: 1.1, // seconds
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
  });

  // mapping header labels => constellation name
  const labelToConstellation = {
    "Lumex": "Orion",
    "Atelier Amara": "Aquarius",
    "Nsphere": "Cygnus",
    "Uncertify.ai": "Lyra",
    "Fortunoff": "Phoenix",
    "Lumex.Online": "Ursa Major",
  };

  // Start animation towards a target position (logoPos array)
  const startFocusAnimation = (logoPosArray, opts = {}) => {
    if (!controls || !camera) return;
    const logoPos = new THREE.Vector3(...logoPosArray);

    const currentCam = camera.position.clone();
    const currentTarget = controls.target ? controls.target.clone() : new THREE.Vector3();

    // Maintain roughly same camera-to-target direction & distance but re-center on logo
    const direction = currentCam.clone().sub(currentTarget).normalize();
    const distance = currentCam.distanceTo(currentTarget);

    // new camera position should sit along the same direction from the logo
    const newCamPos = logoPos.clone().add(direction.multiplyScalar(distance * (opts.distanceFactor ?? 0.85)));

    animRef.current.isAnimating = true;
    animRef.current.t = 0;
    animRef.current.duration = opts.duration ?? 1.1;
    animRef.current.startPos.copy(currentCam);
    animRef.current.endPos.copy(newCamPos);
    animRef.current.startTarget.copy(currentTarget);
    animRef.current.endTarget.copy(logoPos);
  };

  // Listen for header clicks (focus-logo custom event)
  useEffect(() => {
    const handler = (e) => {
      const label = e?.detail?.label;
      if (!label) return;
      const constellationName = labelToConstellation[label];
      if (!constellationName) {
        console.warn("No mapping for label:", label);
        return;
      }
      const c = CONSTELLATIONS.find((x) => x.name === constellationName);
      if (!c) {
        console.warn("Logo not found for", constellationName);
        return;
      }
      startFocusAnimation(c.position, { duration: 1.1, distanceFactor: 0.85 });
      setOpenTitleObjectUrl(c.url);
    };

    window.addEventListener("focus-logo", handler);
    return () => window.removeEventListener("focus-logo", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls, camera, CONSTELLATIONS]);

  // Interpolate camera + controls.target inside render loop
  useFrame((state, delta) => {
    if (!animRef.current.isAnimating || !controls || !camera) return;

    animRef.current.t += delta / Math.max(animRef.current.duration, 0.0001);
    const uRaw = Math.min(animRef.current.t, 1);
    const u = uRaw * uRaw * (3 - 2 * uRaw); // smoothstep

    // lerp positions
    camera.position.lerpVectors(animRef.current.startPos, animRef.current.endPos, u);
    controls.target.lerpVectors(animRef.current.startTarget, animRef.current.endTarget, u);

    // Ensure camera looks at the target
    camera.lookAt(controls.target);
    controls.update?.();

    if (uRaw >= 1) {
      animRef.current.isAnimating = false;
      animRef.current.t = 0;
    }
  });

  return (
    <>
      {items.map((it) => (
        <ModelLoader 
          key={it.url} 
          model={gltfsByUrl.get(it.url)} 
          title={it?.text} 
          billboard={it?.billboard} 
          fadeanimation={it?.fade} 
          hitboxDisable={it?.hitboxDisable} 
          ctaLink={it?.cta} 
          removeLabelVisibility={it?.url != openTitleObjectUrl}
          showChangePropogation={(show) => { if (show) setOpenTitleObjectUrl(it?.url)}}
          renderOrder={it?.renderOrder}
        />
      ))}

      {CONSTELLATIONS.map((c) => (
        <Logo key={c.name} url={c.url} position={c.position} scale={c.scale} />
      ))}

      {/* Responsive fit with animation; call ref.current.refit() whenever you want to reframe */}
      <FitCamera/>
    </>
  );
}


function Logo({ url, position = [0, 0, 0], scale = 0.15 }) {
  const ref = useRef();
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => (scene ? scene.clone(true) : null), [scene]);

  // useThree for camera & controls
  const { camera, controls } = useThree();
  const baseScale = scale; // base value

  useFrame(() => {
    if (!ref.current || !controls) return;

    const dist = camera.position.distanceTo(controls.target);
    const finalScale = baseScale * dist * (scale * 10); // tweak multiplier (0.1 → sensitivity)
    const s = THREE.MathUtils.lerp(ref.current.scale.x, finalScale, 0.4); // smooth
    ref.current.scale.setScalar(s);
  });

  return (
    <group ref={ref} position={position}>
      {cloned ? (
        <Billboard follow>
          <primitive object={cloned} />
        </Billboard>
      ) : null}
    </group>
  );
}
