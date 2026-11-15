"use client";

import React from "react";

interface MascotProps {
  state?: "idle" | "listening" | "talking" | "celebrating";
  className?: string;
}

export function BarnabyMascot({ state = "idle", className = "w-32 h-32" }: MascotProps) {
  const isSpeaking = state === "talking";
  const isListening = state === "listening";
  const isCelebrating = state === "celebrating";

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 120 120"
        className={`w-full h-full transition-transform duration-500 ease-out ${
          isCelebrating ? "animate-bounce" : isListening ? "scale-105" : "animate-mascot-float"
        }`}
      >
        {/* Shadow */}
        <ellipse cx="60" cy="112" rx="34" ry="5" fill="#2E3532" opacity="0.12" />

        {/* Left Wing */}
        <ellipse
          cx="24"
          cy="74"
          rx="10"
          ry="22"
          fill="#8B2635"
          className="transition-transform duration-300"
          style={{
            transformOrigin: "24px 60px",
            transform: isCelebrating ? "rotate(-35deg)" : "rotate(-12deg)",
          }}
        />

        {/* Right Wing */}
        <ellipse
          cx="96"
          cy="74"
          rx="10"
          ry="22"
          fill="#8B2635"
          className="transition-transform duration-300"
          style={{
            transformOrigin: "96px 60px",
            transform: isCelebrating ? "rotate(35deg)" : "rotate(12deg)",
          }}
        />

        {/* Left Tuft / Ear */}
        <path
          d="M32 38 Q22 18 42 26 Z"
          fill="#8B2635"
          className={!isCelebrating ? "animate-ear-left" : ""}
        />
        <path d="M33 34 Q28 24 38 28 Z" fill="#D3EFBD" />

        {/* Right Tuft / Ear */}
        <path
          d="M88 38 Q98 18 78 26 Z"
          fill="#8B2635"
          className={!isCelebrating ? "animate-ear-right" : ""}
        />
        <path d="M87 34 Q92 24 82 28 Z" fill="#D3EFBD" />

        {/* Main Torso / Body - Premium Dark Charcoal #2E3532 */}
        <rect x="28" y="28" width="64" height="74" rx="32" fill="#2E3532" />

        {/* Belly Patch - Gentle Sage #D3EFBD */}
        <path
          d="M40 58 Q60 50 80 58 Q86 96 60 97 Q34 96 40 58 Z"
          fill="#D3EFBD"
        />

        {/* Medical / Care Emblem on Belly - Burgundy #8B2635 */}
        <rect x="58" y="74" width="4" height="12" rx="2" fill="#8B2635" />
        <rect x="54" y="78" width="12" height="4" rx="2" fill="#8B2635" />

        {/* Spectacles Frames - Crisp #D2D4C8 */}
        <circle cx="45" cy="50" r="14" fill="#E0E2DB" stroke="#8B2635" strokeWidth="2.5" />
        <circle cx="75" cy="50" r="14" fill="#E0E2DB" stroke="#8B2635" strokeWidth="2.5" />
        <line x1="59" y1="50" x2="61" y2="50" stroke="#8B2635" strokeWidth="2.5" />

        {/* Eyes (Pupils + Catchlights) */}
        <g className={!isSpeaking ? "animate-mascot-blink" : ""}>
          {/* Left Eye */}
          <circle cx="45" cy="50" r={isListening ? 6 : 5} fill="#2E3532" />
          <circle cx="43" cy="48" r="1.5" fill="#FFFFFF" />

          {/* Right Eye */}
          <circle cx="75" cy="50" r={isListening ? 6 : 5} fill="#2E3532" />
          <circle cx="73" cy="48" r="1.5" fill="#FFFFFF" />
        </g>

        {/* Beak / Mouth */}
        <path
          d="M60 56 L55 64 Q60 67 65 64 Z"
          fill="#8B2635"
          className={isSpeaking ? "animate-beak-talk" : "transition-transform"}
        />

        {/* Feet - Burgundy #8B2635 */}
        <ellipse cx="48" cy="103" rx="6" ry="3" fill="#8B2635" />
        <ellipse cx="72" cy="103" rx="6" ry="3" fill="#8B2635" />
      </svg>
    </div>
  );
}
