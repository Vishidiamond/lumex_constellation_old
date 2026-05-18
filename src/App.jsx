// App.jsx
import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Preload } from "@react-three/drei";
import * as THREE from "three";
import SceneLoader from "./components/sceneLoader";
import DraggableControls from "./helper/draggable";
import LoadingOverlayScreen from "./components/loaderOverLay"; // <-- your classy loader (uses Html fullscreen)
import ZoomControls from "./helper/zoomControl";
import "./App.css";
import Header from "./components/header";
import { ThreeProvider } from "./context/three-provider";
import ThreeBridge from "./context/three-bridge";
import CameraZoomBridge from "./helper/CameraZoomBridge";

export default function App() {
  useEffect(() => {
    THREE.Cache.enabled = true;
  }, []);
  const [loaderData, setLoaderData] = useState({
    active: false,
    progress: 0,
    loaded: 0,
    total: 0,
    item: null,
  });
  const orbitRef = useRef();
  const bridgeRef = useRef();

  console.log(orbitRef, bridgeRef)

  return (
    <ThreeProvider>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          position: "fixed",
          inset: 0,
          background: "#000",
        }}
      >
        <Header show={loaderData.progress == 100} />
        <div className="canvas">
          <Canvas camera={{ position: [0, 2, 10], fov: 45 }}>
            {/* Environment can suspend on first load; wrap so it doesn’t blank the canvas */}

            <ThreeBridge throttleMs={100} />

            <Suspense fallback={null}>
              <Environment files="/assets/nebulas_4.hdr" background />
            </Suspense>

            <ambientLight intensity={1} />
            <directionalLight position={[10, 10, 10]} intensity={1.5} />

            <OrbitControls makeDefault ref={orbitRef} />
            <DraggableControls objects={[]} />

            {/* Your scene (it can use Suspense/useGLTF internally) */}
            <SceneLoader loaderEvent={(e) => setLoaderData(e)} orbitRef={orbitRef} />

            {/* Make three track everything up-front if you want */}
            <Preload all />

            <CameraZoomBridge ref={bridgeRef} controlsRef={orbitRef} step={1.1} smoothing={0.14} damping={8} />
          </Canvas>
        </div>
        <ZoomControls controlsRef={orbitRef} bridgeRef={bridgeRef} step={1.1} />
        <LoadingOverlayScreen loaderData={loaderData} />
      </div>
    </ThreeProvider>
  );
}
