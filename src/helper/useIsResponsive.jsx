import { useEffect, useState } from "react";

/**
 * useIsResponsive
 * Returns true for all devices except desktop.
 * Desktop definition: (min-width: 1024px) AND (hover: hover)
 *
 * - Safe for SSR (defaults to `true` while mounting on server)
 * - Listens to media query changes and window resize
 */
export default function useIsResponsive() {
  const mqQuery = "(min-width: 1024px) and (hover: hover)";

  // default true (assume responsive) for SSR / initial render safety
  const [isResponsive, setIsResponsive] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return true;
    }
    return !window.matchMedia(mqQuery).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mql = window.matchMedia(mqQuery);
    const handleChange = (ev) => {
      // if media matches => desktop => responsive = false
      setIsResponsive(!ev.matches);
    };

    // initial sync (in case media changed between init and effect)
    setIsResponsive(!mql.matches);

    // prefer addEventListener API, fallback to addListener for older browsers
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handleChange);
    } else if (typeof mql.addListener === "function") {
      mql.addListener(handleChange);
    }

    // Also listen to resize as a fallback for environments where hover changes aren't reported
    const onResize = () => setIsResponsive(!window.matchMedia(mqQuery).matches);
    window.addEventListener("resize", onResize);

    return () => {
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", handleChange);
      } else if (typeof mql.removeListener === "function") {
        mql.removeListener(handleChange);
      }
      window.removeEventListener("resize", onResize);
    };
  }, []); // run once

  return isResponsive;
}
