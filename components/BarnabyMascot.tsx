"use client";

import React from "react";

interface MascotProps {
  state?: "idle" | "talking" | "listening" | "celebrating" | "doctor";
  className?: string;
}

export function BarnabyMascot({ state = "idle", className = "w-48 h-48" }: MascotProps) {
  const isBlinking = state === "idle";
  const isSpeaking = state === "talking";
  const isListening = state === "listening";
  const isCelebrating = state === "celebrating";
  const isDoctor = state === "doctor";

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full transition-transform duration-300 ${
          isCelebrating ? "animate-bounce" : isListening ? "scale-105" : ""
        }`}
      >
        <ellipse cx="40" cy="120" rx="14" ry="36" fill="#FBBF24" className="origin-top -rotate-12" />
        <ellipse cx="160" cy="120" rx="14" ry="36" fill="#FBBF24" className="origin-top rotate-12" />

        <circle cx="100" cy="115" r="68" fill="#FDE68A" stroke="#F59E0B" strokeWidth="4" />
        <ellipse cx="100" cy="130" rx="42" ry="46" fill="#FFFBEB" />

        <path d="M70 75 Q100 88 130 75" fill="none" stroke="#F59E0B" strokeWidth="2.5" opacity="0.4" />
        <path d="M74 100 Q100 115 126 100" fill="none" stroke="#F59E0B" strokeWidth="2.5" opacity="0.4" />

        <polygon points="52,65 72,42 82,65" fill="#F59E0B" />
        <polygon points="148,65 128,42 118,65" fill="#F59E0B" />

        <circle cx="76" cy="94" r="22" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="3" />
        <circle cx="124" cy="94" r="22" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="3" />

        <circle
          cx={isListening ? "79" : "76"}
          cy="94"
          r="9"
          fill="#1E293B"
          className={isBlinking ? "animate-pulse" : ""}
        />
        <circle
          cx={isListening ? "127" : "124"}
          cy="94"
          r="9"
          fill="#1E293B"
          className={isBlinking ? "animate-pulse" : ""}
        />

        <circle cx="73" cy="91" r="3" fill="#FFFFFF" />
        <circle cx="121" cy="91" r="3" fill="#FFFFFF" />

        <ellipse cx="62" cy="112" rx="7" ry="4" fill="#FCA5A5" opacity="0.6" />
        <ellipse cx="138" cy="112" rx="7" ry="4" fill="#FCA5A5" opacity="0.6" />

        <polygon
          points="100,102 91,114 109,114"
          fill="#EA580C"
          className={`transition-all duration-150 origin-top ${isSpeaking ? "scale-y-125" : ""}`}
        />

        {isDoctor && (
          <g>
            <circle cx="76" cy="94" r="24" fill="none" stroke="#3B82F6" strokeWidth="4" />
            <circle cx="124" cy="94" r="24" fill="none" stroke="#3B82F6" strokeWidth="4" />
            <line x1="100" y1="94" x2="100" y2="94" stroke="#3B82F6" strokeWidth="4" />
            <path
              d="M70 145 C70 170 130 170 130 145"
              fill="none"
              stroke="#0284C7"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="100" cy="166" r="6" fill="#38BDF8" stroke="#0369A1" strokeWidth="2" />
          </g>
        )}

        <ellipse cx="80" cy="182" rx="10" ry="5" fill="#EA580C" />
        <ellipse cx="120" cy="182" rx="10" ry="5" fill="#EA580C" />
      </svg>
    </div>
  );
}
