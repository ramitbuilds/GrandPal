"use client";

import React from "react";
import { VectorPuppy, PuppyState } from "@/components/VectorPuppy";

interface MascotProps {
  state?: PuppyState;
  className?: string;
  isCelebrating?: boolean;
}

export function PuppyMascot({
  state = "idle",
  className = "w-36 h-36",
  isCelebrating = false,
}: MascotProps) {
  return (
    <VectorPuppy
      state={state}
      className={className}
      isCelebrating={isCelebrating}
    />
  );
}
