"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function TiltCard({ children, className = "" }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(0);
  const glareY = useMotionValue(0);

  // Smooth springs for high-end tactile responsiveness
  const springConfig = { damping: 20, stiffness: 200, mass: 0.2 };
  const smoothX = useSpring(rotateX, springConfig);
  const smoothY = useSpring(rotateY, springConfig);
  const smoothGlareX = useSpring(glareX, springConfig);
  const smoothGlareY = useSpring(glareY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const el = cardRef.current;
    const { left, top, width, height } = el.getBoundingClientRect();
    
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    // Tilt calculations (cap at 7 degrees displacement)
    const tiltX = ((centerY - e.clientY) / (height / 2)) * 7;
    const tiltY = ((e.clientX - centerX) / (width / 2)) * 7;

    rotateX.set(tiltX);
    rotateY.set(tiltY);

    // Glare position
    glareX.set(e.clientX - left);
    glareY.set(e.clientY - top);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <div 
      className="perspective-[1000px] w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        ref={cardRef}
        style={{
          rotateX: smoothX,
          rotateY: smoothY,
          transformStyle: "preserve-3d",
        }}
        className={`relative w-full h-full transition-shadow duration-300 group hover:shadow-lg rounded-sm ${className}`}
      >
        {/* Children content wrapper */}
        <div style={{ transform: "translateZ(10px)" }} className="relative z-10 w-full h-full">
          {children}
        </div>

        {/* Dynamic Sheen/Glare Overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-sm"
          style={{
            background: `radial-gradient(180px circle at ${smoothGlareX}px ${smoothGlareY}px, rgba(255, 255, 255, 0.12), transparent 85%)`
          }}
        />
      </motion.div>
    </div>
  );
}
