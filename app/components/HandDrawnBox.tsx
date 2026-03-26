"use client";

import { useEffect, useRef } from "react";
import { annotate } from "rough-notation";

interface HandDrawnBoxProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  animationDurationMs?: number;
  strokeWidth?: number;
  padding?: number;
  iterations?: number;
}

export const HandDrawnBox: React.FC<HandDrawnBoxProps> = ({
  children,
  className = "",
  delayMs = 0,
  animationDurationMs = 3000,
  strokeWidth = 1.5,
  padding = 4,
  iterations = 3,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // box animation
    const annotation = annotate(ref.current, {
      type: "box",
      color: "#B17457",
      strokeWidth,
      padding,
      animate: true,
      animationDuration: animationDurationMs,
        iterations,
    });

    const timer = window.setTimeout(() => {
      annotation.show();
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
      annotation.remove();
    };
  }, [animationDurationMs, delayMs, padding, strokeWidth]);

  return (
    <div ref={ref} className={`${className}`}>
      {children}
    </div>
  );
};

