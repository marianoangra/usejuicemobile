'use client';

import { useEffect, useRef } from 'react';

interface JuiceWordmarkProps {
  className?: string;
}

export function JuiceWordmark({ className }: JuiceWordmarkProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gradRef = useRef<SVGRadialGradientElement>(null);

  useEffect(() => {
    let frame: number | null = null;
    let latestX = 0;
    let latestY = 0;

    const update = () => {
      frame = null;
      const svg = svgRef.current;
      const grad = gradRef.current;
      if (!svg || !grad) return;
      const rect = svg.getBoundingClientRect();
      const x = ((latestX - rect.left) / rect.width) * 100;
      const y = ((latestY - rect.top) / rect.height) * 100;
      grad.setAttribute('cx', `${x}%`);
      grad.setAttribute('cy', `${y}%`);
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

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 380 130"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="JUICE"
      className={className}
    >
      <defs>
        {/* Olive metal gradient — same stops as .metal-text in globals.css */}
        <linearGradient id="juice-olive-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eaf5b8" />
          <stop offset="16%" stopColor="#c5d97c" />
          <stop offset="32%" stopColor="#94b048" />
          <stop offset="48%" stopColor="#d4e58c" />
          <stop offset="56%" stopColor="#f0f8c8" />
          <stop offset="72%" stopColor="#b8cd6b" />
          <stop offset="88%" stopColor="#8aa83d" />
          <stop offset="100%" stopColor="#c5d97c" />
        </linearGradient>
        {/* Same as above, but with a subtle teal/blue band mid-gradient
            to add a cool reflection on the CE side. */}
        <linearGradient id="juice-olive-metal-cool" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eaf5b8" />
          <stop offset="16%" stopColor="#c5d97c" />
          <stop offset="32%" stopColor="#94b048" />
          <stop offset="48%" stopColor="#d4e58c" />
          <stop offset="56%" stopColor="#f0f8c8" />
          <stop offset="68%" stopColor="#6db8e0" />
          <stop offset="82%" stopColor="#b8cd6b" />
          <stop offset="92%" stopColor="#8aa83d" />
          <stop offset="100%" stopColor="#c5d97c" />
        </linearGradient>
        {/* Mouse-following specular highlight — center moves with cursor. */}
        <radialGradient
          ref={gradRef}
          id="juice-spotlight"
          cx="50%"
          cy="50%"
          r="70%"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="22%" stopColor="#fffce8" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#f5f8d8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Base layer — metallic letters + white bolt */}
      <text
        x="8"
        y="105"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontSize="120"
        fontWeight="900"
        fill="url(#juice-olive-metal)"
        letterSpacing="-4"
      >
        JU
      </text>

      <path
        d="M 204 12 L 156 76 L 184 76 L 171 113 L 217 63 L 190 63 Z"
        fill="#ffffff"
        strokeLinejoin="round"
      />

      <text
        x="218"
        y="105"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontSize="120"
        fontWeight="900"
        fill="url(#juice-olive-metal-cool)"
        letterSpacing="0"
      >
        CE
      </text>

      {/* Spotlight overlay — same letter shapes filled with the radial
          highlight that tracks the mouse. Sits on top of the metallic
          base, so the cursor "lights up" the wordmark as it passes. */}
      <text
        x="8"
        y="105"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontSize="120"
        fontWeight="900"
        fill="url(#juice-spotlight)"
        letterSpacing="-4"
      >
        JU
      </text>
      <text
        x="218"
        y="105"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontSize="120"
        fontWeight="900"
        fill="url(#juice-spotlight)"
        letterSpacing="0"
      >
        CE
      </text>
    </svg>
  );
}
