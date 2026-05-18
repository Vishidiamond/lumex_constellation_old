import React, { createContext, useContext, useState } from "react";

const ThreeContext = createContext(null);

export function ThreeProvider({ children }) {
  // Keep a small state shape to avoid heavy re-renders
  const [state, setState] = useState({
    cameraPosition: [0, 0, 0],
    controlsTarget: [0, 0, 0],
    distance: 0,
    // you can add non-frequently-changing metadata here
  });

  return <ThreeContext.Provider value={{ state, setState }}>{children}</ThreeContext.Provider>;
}

/**
 * Hook for outside-Canvas components
 * usage: const { state, setState } = useThreeBridge();
 */
export function useThreeBridge() {
  const ctx = useContext(ThreeContext);
  if (!ctx) throw new Error("useThreeBridge must be used within ThreeProvider");
  return ctx;
}