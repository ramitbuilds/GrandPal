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
        viewBox="0 0 160 160"
        className={`w-full h-full transition-transform duration-300 ${
          isCelebrating ? "animate-bounce" : isListening ? "scale-105" : ""
        }`}
      >
        {/* Flat color palette inspired by professional Duolingo-style vector character sheets */}
        
        {/* Ears */}
        <polygon points="42,50 30,22 62,38" fill="#D97706" />
        <polygon points="40,46 34,28 54,38" fill="#FEF3C7" />

        <polygon points="118,50 130,22 98,38" fill="#D97706" />
        <polygon points="120,46 126,28 106,38" fill="#FEF3C7" />

        {/* Outer Wings */}
        <ellipse cx="32" cy="98" rx="12" ry="28" fill="#B45309" transform="rotate(-15 32 98)" />
        <ellipse cx="128" cy="98" rx="12" ry="28" fill="#B45309" transform="rotate(15 128 98)" />

        {/* Main Body */}
        <rect x="36" y="38" width="88" height="92" rx="44" fill="#F59E0B" />

        {/* Belly Patch (Cream, crisp flat geometry) */}
        <path d="M52,78 Q80,68 108,78 Q114,124 80,126 Q46,124 52,78 Z" fill="#FFFBEB" />

        {/* Stethoscope Cord (Doctor / Health Companion) */}
        <path
          d="M58,74 C58,110 102,110 102,74"
          fill="none"
          stroke="#0284C7"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="80" cy="104" r="5" fill="#38BDF8" stroke="#0369A1" strokeWidth="2" />

        {/* Eyeglasses Frame */}
        <rect x="42" y="52" width="32" height="26" rx="8" fill="#FFFFFF" stroke="#1E293B" strokeWidth="3" />
        <rect x="86" y="52" width="32" height="26" rx="8" fill="#FFFFFF" stroke="#1E293B" strokeWidth="3" />
        <line x1="74" y1="64" x2="86" y2="64" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />

        {/* Pupils */}
        {isListening ? (
          <>
            <circle cx="58" cy="65" r="7" fill="#0F172A" />
            <circle cx="102" cy="65" r="7" fill="#0F172A" />
            <circle cx="56" cy="63" r="2" fill="#FFFFFF" />
            <circle cx="100" cy="63" r="2" fill="#FFFFFF" />
          </>
        ) : isSpeaking ? (
          <>
            <circle cx="60" cy="64" r="6" fill="#0F172A" />
            <circle cx="104" cy="64" r="6" fill="#0F172A" />
            <circle cx="58" cy="62" r="2" fill="#FFFFFF" />
            <circle cx="102" cy="62" r="2" fill="#FFFFFF" />
          </>
        ) : (
          <>
            <circle cx="58" cy="65" r="6" fill="#0F172A" />
            <circle cx="102" cy="65" r="6" fill="#0F172A" />
            <circle cx="56" cy="63" r="2" fill="#FFFFFF" />
            <circle cx="100" cy="63" r="2" fill="#FFFFFF" />
          </>
        )}

        {/* Beak / Mouth (Puckered / Open / Resting) */}
        {isSpeaking ? (
          <polygon points="80,72 73,86 87,86" fill="#EA580C" />
        ) : (
          <polygon points="80,72 74,80 86,80" fill="#EA580C" />
        )}

        {/* Feet */}
        <ellipse cx="64" cy="132" rx="8" ry="4" fill="#D97706" />
        <ellipse cx="96" cy="132" rx="8" ry="4" fill="#D97706" />
      </svg>
    </div>
  );
}
