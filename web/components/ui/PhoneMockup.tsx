'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface PhoneMockupProps {
  src?: string;
  alt: string;
  /** width:height ratio for the inner screen — defaults to iPhone ~390x844 */
  width?: number;
  height?: number;
  className?: string;
  tilt?: boolean;
  priority?: boolean;
  /** When provided, replaces the screenshot Image with custom screen content. */
  children?: ReactNode;
}

export function PhoneMockup({
  src,
  alt,
  width = 320,
  height = 692,
  className,
  tilt = true,
  priority = false,
  children,
}: PhoneMockupProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className={cn('relative inline-block', className)}
    >
      <div
        className={cn(
          'phone-frame',
          tilt && !reduce && 'phone-tilt'
        )}
        style={{ width: width + 12, height: height + 12 }}
      >
        {/* Side buttons */}
        <span aria-hidden className="phone-button phone-button-vol-up" />
        <span aria-hidden className="phone-button phone-button-vol-down" />
        <span aria-hidden className="phone-button phone-button-power" />

        {/* USB-C port — visible slot on the bottom edge */}
        <span aria-hidden className="phone-usbc-port" />

        {/* Inner display */}
        <div className="phone-screen">
          {src && (
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              priority={priority}
              className="h-full w-full object-cover"
              sizes={`${width}px`}
            />
          )}
          {children}
          {/* Punch-hole front camera */}
          <span aria-hidden className="phone-punch" />
          {/* Diagonal glass reflection */}
          <span aria-hidden className="phone-sheen" />
        </div>
      </div>
      {/* Ambient floor glow */}
      <div
        aria-hidden
        className="absolute inset-x-4 -bottom-10 h-28 rounded-[50%] bg-secondary/20 blur-3xl"
      />
    </motion.div>
  );
}
