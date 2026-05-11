'use client';

import { useReducedMotion } from 'framer-motion';

const LIME = '#a8db3a';

interface UsbCableProps {
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Decorative USB-C cable that visually plugs into the bottom of a phone
 * mockup, with energy particles flowing UP the cable into the device.
 *
 * Renders as an SVG: the path id="usb-cable-path" is drawn from the
 * bottom-right (charger end) to the top-center (phone end), so SVG
 * <animateMotion> following the path naturally moves particles from the
 * charger up into the phone — mirroring the real app's
 * "minute-of-charging → on-chain points" flow.
 *
 * Position the cable so the top-center connector aligns with the phone's
 * bottom-center. Particles auto-disable under prefers-reduced-motion.
 */
export function UsbCable({
  className,
  width = 240,
  height = 220,
}: UsbCableProps) {
  const reduce = useReducedMotion();

  return (
    <svg
      viewBox="0 0 240 220"
      width={width}
      height={height}
      className={className}
      aria-hidden
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Path drawn from bottom-right (USB-A) up to top-center (USB-C)
            so particle motion is natural: charger → phone. End slightly
            above SVG y=0 so the path tip enters the connector boot. */}
        <path
          id="usb-cable-path"
          d="M 195 210 C 215 150, 65 70, 120 4"
          fill="none"
        />
        <linearGradient
          id="usb-cable-stroke"
          x1="0"
          y1="0"
          x2="1"
          y2="0"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="35%" stopColor="#3a3a3a" />
          <stop offset="55%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
        {/* Boot fill — top blends into the phone-frame's mid-tone
            (#1c1d20), bottom matches the cable color. This kills the
            hard horizontal seam where the boot meets the phone. */}
        <linearGradient id="usb-boot-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c1d20" />
          <stop offset="20%" stopColor="#16171a" />
          <stop offset="65%" stopColor="#121214" />
          <stop offset="100%" stopColor="#0d0d0e" />
        </linearGradient>

        {/* Soft seam blender — a horizontal radial gradient that sits
            right at the contact line, optically dissolving the edge
            between phone bottom and connector boot. */}
        <radialGradient id="usb-seam-blend" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#1c1d20" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#1c1d20" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1c1d20" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Cable drop shadow */}
      <path
        d="M 195 210 C 215 150, 65 70, 120 4"
        stroke="rgba(0,0,0,0.55)"
        strokeWidth="6.5"
        strokeLinecap="round"
        fill="none"
        transform="translate(1.5, 2.5)"
      />

      {/* Cable body */}
      <path
        d="M 195 210 C 215 150, 65 70, 120 4"
        stroke="url(#usb-cable-stroke)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Top sheen on cable */}
      <path
        d="M 195 210 C 215 150, 65 70, 120 4"
        stroke="rgba(255,255,255,0.10)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        transform="translate(-0.6, -0.6)"
      />

      {/* USB-C connector boot — the visible plastic sleeve that sits
          flush against the phone's USB-C port. The metal plug itself is
          rendered by the phone's port slot (in PhoneMockup), so we only
          show the boot here. */}
      <g transform="translate(120, 0)">
        {/* Boot body — gradient fill blends top into phone color. No
            top stroke (kills the hard horizontal seam). Sides + bottom
            get a soft hairline from the metal-light side highlight. */}
        <path
          d="M -11.5 0 L 11.5 0 L 11.5 13 Q 11.5 16 8.5 16 L -8.5 16 Q -11.5 16 -11.5 13 Z"
          fill="url(#usb-boot-fill)"
        />
        {/* Side hairlines (left + right + bottom only) */}
        <path
          d="M -11.5 1 L -11.5 13 Q -11.5 16 -8.5 16 L 8.5 16 Q 11.5 16 11.5 13 L 11.5 1"
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="0.5"
        />
        {/* Strain relief ribs */}
        <rect x="-9" y="4" width="18" height="0.6" fill="rgba(255,255,255,0.04)" />
        <rect x="-9" y="7" width="18" height="0.6" fill="rgba(255,255,255,0.04)" />
        <rect x="-9" y="10" width="18" height="0.6" fill="rgba(255,255,255,0.04)" />
      </g>

      {/* Seam blender — wider soft ellipse exactly at the contact line,
          dissolving any remaining edge between phone bottom and boot. */}
      <ellipse
        cx="120"
        cy="0"
        rx="22"
        ry="3.5"
        fill="url(#usb-seam-blend)"
      />

      {/* Charging-status LED — pulses to indicate active charging.
          Sits on the boot, just below the phone bottom edge. */}
      {!reduce && (
        <circle r="1.1" fill={LIME} cx="113" cy="11">
          <animate
            attributeName="opacity"
            values="0.35;1;0.35"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* USB-A connector at bottom (charger end) */}
      <g transform="translate(195, 210)">
        {/* Plastic boot */}
        <rect
          x="-15"
          y="-3"
          width="22"
          height="16"
          rx="2"
          fill="#181818"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="0.6"
        />
        {/* Metal head */}
        <rect
          x="-13"
          y="-2"
          width="20"
          height="9"
          rx="1"
          fill="#9a9a9a"
        />
        <rect
          x="-13"
          y="-2"
          width="20"
          height="1.5"
          fill="rgba(255,255,255,0.45)"
        />
        {/* Inner contacts */}
        <rect x="-10" y="0.5" width="3.5" height="3" fill="#0d0d0d" />
        <rect x="-5" y="0.5" width="3.5" height="3" fill="#0d0d0d" />
        <rect x="0" y="0.5" width="3.5" height="3" fill="#0d0d0d" />
        <rect x="5" y="0.5" width="2" height="3" fill="#0d0d0d" />
      </g>

      {/* Flowing energy particles — charger → phone */}
      {!reduce && (
        <>
          {[0, 0.55, 1.1, 1.65, 2.2].map((delay, i) => (
            <g key={i}>
              <circle r="2.6" fill={LIME}>
                <animateMotion
                  dur="2.75s"
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                >
                  <mpath href="#usb-cable-path" />
                </animateMotion>
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.12;0.88;1"
                  dur="2.75s"
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                />
              </circle>
              {/* Particle outer glow */}
              <circle
                r="5"
                fill={LIME}
                opacity="0.35"
                filter="blur(2px)"
              >
                <animateMotion
                  dur="2.75s"
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                >
                  <mpath href="#usb-cable-path" />
                </animateMotion>
                <animate
                  attributeName="opacity"
                  values="0;0.5;0.5;0"
                  keyTimes="0;0.12;0.88;1"
                  dur="2.75s"
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
        </>
      )}
    </svg>
  );
}
