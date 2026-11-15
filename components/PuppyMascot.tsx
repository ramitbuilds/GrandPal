"use client";

import React from "react";
import Image from "next/image";

interface MascotProps {
  className?: string;
}

export function PuppyMascot({ className = "w-40 h-40" }: MascotProps) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <Image
        src="/mascot/mascot-dog.png"
        alt="GrandPal Dog Mascot"
        width={320}
        height={320}
        priority
        className="object-contain w-full h-full"
      />
    </div>
  );
}
