"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";

export type PuppyState = "idle" | "listening" | "thinking" | "celebrating";

interface VectorPuppyProps {
  state?: PuppyState;
  className?: string;
  isCelebrating?: boolean;
  isSpeaking?: boolean;
}

export function VectorPuppy({
  state = "idle",
  className = "w-40 h-40",
  isCelebrating = false,
  isSpeaking = false,
}: VectorPuppyProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // States
  const [isBlinking, setIsBlinking] = useState(false);
  const [isWinking, setIsWinking] = useState(false);
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0 });
  const [internalCelebrate, setInternalCelebrate] = useState(false);

  // Internal state for click celebration
  const isCurrentlyCelebrating = isCelebrating || internalCelebrate;

  // Natural Random Blinking (Every 3.2s - 5.5s)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
        const nextDelay = 3200 + Math.random() * 2200;
        timeoutId = setTimeout(triggerBlink, nextDelay);
      }, 150);
    };

    timeoutId = setTimeout(triggerBlink, 2800);
    return () => clearTimeout(timeoutId);
  }, []);

  // Look-At Mouse Pointer Tracking (smooth, subtle gaze)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || state === "thinking") return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);

      // Micro-clamp gaze in 1024-space (between -12 and +12)
      setLookOffset({
        x: Math.max(-12, Math.min(12, deltaX * 12)),
        y: Math.max(-10, Math.min(10, deltaY * 10)),
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [state]);

  // Click interaction: instant friendly wink and jump
  const handleClick = useCallback(() => {
    setIsWinking(true);
    setInternalCelebrate(true);
    setTimeout(() => {
      setIsWinking(false);
      setInternalCelebrate(false);
    }, 750);
  }, []);

  const activeState = isCurrentlyCelebrating ? "celebrating" : state;
  const eyesClosed = isBlinking || activeState === "celebrating";

  // Duolingo Lily Thinking State gaze offset (looking up and to the right)
  const currentLookX = activeState === "thinking" ? 9 : lookOffset.x;
  const currentLookY = activeState === "thinking" ? -14 : lookOffset.y;

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={`relative flex items-center justify-center select-none cursor-pointer ${className}`}
      title="Hi there! I am your GrandPal puppy. Click me to play!"
    >
      <svg
        viewBox="0 0 1024 1024"
        className="w-full h-full overflow-visible"
        style={{ filter: "drop-shadow(0 6px 14px rgba(125, 85, 44, 0.12))" }}
      >
        <defs>
          <style>{`
            @keyframes dogBreathe {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-8px) rotate(0.4deg); }
            }
            @keyframes dogTiltListen {
              0%, 100% { transform: rotate(3.5deg) translateY(-4px); }
              50% { transform: rotate(5deg) translateY(-8px); }
            }
            @keyframes dogTiltThink {
              0%, 100% { transform: rotate(-6deg) translateY(-6px); }
              50% { transform: rotate(-4deg) translateY(-10px); }
            }
            @keyframes dogCelebrateJump {
              0% { transform: translateY(0) scale(1); }
              35% { transform: translateY(-32px) scale(1.06) rotate(-2deg); }
              70% { transform: translateY(-8px) scale(1.02) rotate(1.5deg); }
              100% { transform: translateY(0) scale(1); }
            }
            @keyframes earLeftWiggle {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(-2.5deg); }
            }
            @keyframes earRightWiggle {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(2.5deg); }
            }
            .anim-breathe {
              animation: dogBreathe 3.5s ease-in-out infinite;
            }
            .anim-listen {
              animation: dogTiltListen 2.2s ease-in-out infinite;
            }
            .anim-think {
              animation: dogTiltThink 2.4s ease-in-out infinite;
            }
            .anim-celebrate {
              animation: dogCelebrateJump 0.75s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .anim-ear-l {
              transform-origin: 320px 220px;
              animation: earLeftWiggle 3.5s ease-in-out infinite;
            }
            .anim-ear-r {
              transform-origin: 704px 220px;
              animation: earRightWiggle 3.5s ease-in-out infinite;
            }
            @keyframes mouthSpeak {
              0%, 100% { transform: translateY(0) scaleY(1); }
              50% { transform: translateY(3px) scaleY(1.08); }
            }
            .anim-speak {
              transform-origin: 512px 646px;
              animation: mouthSpeak 0.22s ease-in-out infinite;
            }
            @keyframes mouthOpenTalk {
              0%, 100% { transform: scaleY(0.82) scaleX(0.94); }
              50% { transform: scaleY(1.22) scaleX(1.06); }
            }
            .anim-open-mouth {
              transform-origin: 512px 656px;
              animation: mouthOpenTalk 0.22s ease-in-out infinite;
            }
          `}</style>

          {/* Warm Fur Gradients Matching Reference */}
          <linearGradient id="warmFur" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FED795" />
            <stop offset="100%" stopColor="#F8CA87" />
          </linearGradient>

          <linearGradient id="creamMuzzle" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF7E1" />
            <stop offset="100%" stopColor="#FEF2D2" />
          </linearGradient>

          <radialGradient id="blushGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F9ABA2" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FCA8A0" stopOpacity="0.8" />
          </radialGradient>
        </defs>

        {/* CHARACTER ROOT WITH DUOLINGO STATE MACHINE */}
        <g
          className={
            activeState === "celebrating"
              ? "anim-celebrate"
              : activeState === "listening"
              ? "anim-listen"
              : activeState === "thinking"
              ? "anim-think"
              : "anim-breathe"
          }
        >
          {/* 1. LEFT FLOPPY EAR */}
          <g className="anim-ear-l">
            <path
              d="M 334 205 C 265 165 170 195 120 258 C 82 305 82 360 115 398 C 145 432 188 438 224 424 C 255 412 280 375 295 330"
              fill="url(#warmFur)"
              stroke="#80562D"
              strokeWidth="19"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner Ear Fold Shadow / Crease */}
            <path
              d="M 314 255 C 310 295 290 355 244 420"
              fill="none"
              stroke="#80562D"
              strokeWidth="18"
              strokeLinecap="round"
            />
          </g>

          {/* 2. RIGHT FLOPPY EAR */}
          <g className="anim-ear-r">
            <path
              d="M 690 205 C 759 165 854 195 904 258 C 942 305 942 360 909 398 C 879 432 836 438 800 424 C 769 412 744 375 729 330"
              fill="url(#warmFur)"
              stroke="#80562D"
              strokeWidth="19"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner Ear Fold Shadow / Crease */}
            <path
              d="M 710 255 C 714 295 734 355 780 420"
              fill="none"
              stroke="#80562D"
              strokeWidth="18"
              strokeLinecap="round"
            />
          </g>

          {/* 3. MAIN ROUND HEAD CONTOUR (Matching Reference Proportions) */}
          <path
            d="M 334 205 C 385 178 450 168 512 168 C 574 168 639 178 690 205 C 735 228 788 305 814 410 C 856 505 868 625 808 726 C 744 830 634 848 512 848 C 390 848 280 830 216 726 C 156 625 168 505 210 410 C 236 305 289 228 334 205 Z"
            fill="url(#warmFur)"
            stroke="#80562D"
            strokeWidth="19"
            strokeLinejoin="round"
          />

          {/* 4. SOFT CREAM MUZZLE OVERLAY (Exact Wave Pattern) */}
          <path
            d="M 182 680 C 218 574 252 557 302 557 C 348 557 370 576 400 576 C 440 576 470 516 512 516 C 554 516 584 576 624 576 C 654 576 676 557 722 557 C 772 557 806 574 842 680 C 810 770 730 848 512 848 C 294 848 214 770 182 680 Z"
            fill="url(#creamMuzzle)"
          />

          {/* 5. CUTE ROUND PASTEL BLUSH CIRCLES */}
          <ellipse cx="276" cy="614" rx="54" ry="52" fill="url(#blushGlow)" />
          <ellipse cx="748" cy="614" rx="54" ry="52" fill="url(#blushGlow)" />

          {/* 6. NOSE & W-SHAPED MOUTH */}
          <g id="muzzle-features">
            {/* Rounded Inverted-Triangle Button Nose */}
            <path
              d="M 470 550 C 470 535 554 535 554 550 C 554 575 526 608 512 608 C 498 608 470 575 470 550 Z"
              fill="#3A281E"
            />
            {/* Specular Highlight on Nose */}
            <ellipse cx="496" cy="554" rx="7" ry="5" fill="#FFFFFF" opacity="0.3" />

            {/* Vertical Philtrum */}
            <line
              x1="512"
              y1="608"
              x2="512"
              y2="646"
              stroke="#3A281E"
              strokeWidth="18"
              strokeLinecap="round"
            />

            {/* Open Speaking Mouth with Pink Tongue (Only visible when speaking) */}
            {isSpeaking && (
              <g className="anim-open-mouth">
                {/* Deep Red Mouth Cavity */}
                <path
                  d="M 456 654 C 456 654 466 716 512 716 C 558 716 568 654 568 654 C 542 664 482 664 456 654 Z"
                  fill="#D63031"
                  stroke="#3A281E"
                  strokeWidth="7"
                  strokeLinejoin="round"
                />
                {/* Sweet Little Pink Tongue */}
                <path
                  d="M 482 690 C 492 676 532 676 542 690 C 536 712 488 712 482 690 Z"
                  fill="#FFA3B5"
                />
              </g>
            )}

            {/* Kawaii W-Shaped Mouth (Thick, perfectly rounded) */}
            <path
              className={isSpeaking ? "anim-speak" : ""}
              d="M 416 630 C 416 662 448 676 478 672 C 500 669 512 648 512 646 C 512 648 524 669 546 672 C 576 676 608 662 608 630"
              fill="none"
              stroke="#3A281E"
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* 7. EXPRESSIVE VERTICAL OVAL EYES WITH GAZE TRACKING */}
          {/* Left Eye */}
          <g id="left-eye">
            {eyesClosed ? (
              /* Joyful Closed Smile Arc */
              <path
                d="M 342 530 C 352 500 392 500 402 530"
                fill="none"
                stroke="#3A281E"
                strokeWidth="18"
                strokeLinecap="round"
              />
            ) : (
              /* Vertical Oval Eye */
              <g style={{ transform: `translate(${currentLookX}px, ${currentLookY}px)` }}>
                <ellipse cx="372" cy="518" rx="30" ry="39" fill="#3A281E" />
              </g>
            )}
          </g>

          {/* Right Eye */}
          <g id="right-eye">
            {eyesClosed || isWinking ? (
              /* Joyful Closed Smile Arc (or Wink) */
              <path
                d="M 622 530 C 632 500 672 500 682 530"
                fill="none"
                stroke="#3A281E"
                strokeWidth="18"
                strokeLinecap="round"
              />
            ) : (
              /* Vertical Oval Eye */
              <g style={{ transform: `translate(${currentLookX}px, ${currentLookY}px)` }}>
                <ellipse cx="652" cy="518" rx="30" ry="39" fill="#3A281E" />
              </g>
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}
