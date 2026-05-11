'use client';

import { useEffect, useRef } from 'react';

/**
 * Tracks the global mouse position and writes it as `--mx` / `--my` CSS
 * custom properties (in % relative to the element's bounding box) onto the
 * returned ref'd element. Pair with the `.metal-text` class to drive a
 * mouse-following specular highlight on a metallic gradient text.
 */
export function useMetalSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    let frame: number | null = null;
    let latestX = 0;
    let latestY = 0;

    const update = () => {
      frame = null;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((latestX - rect.left) / rect.width) * 100;
      const y = ((latestY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mx', `${x}%`);
      el.style.setProperty('--my', `${y}%`);
    };

    const onMove = (e: MouseEvent) => {
      latestX = e.clientX;
      latestY = e.clientY;
      if (frame !== null) return;
      frame = requestAnimationFrame(update);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}
