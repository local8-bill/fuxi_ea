"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
  const getInitialValue = () => {
    if (typeof window === "undefined") return true;
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState<boolean>(getInitialValue);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(mediaQuery.matches);
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [query]);

  return matches;
}
