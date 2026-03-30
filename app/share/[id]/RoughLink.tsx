"use client";

import Link from "next/link";
import { useRef } from "react";
import { annotate } from "rough-notation";

export function RoughLink({ href, children }: { href: string; children: React.ReactNode }) {
  const elRef = useRef<HTMLAnchorElement>(null);
  const annotationRef = useRef<ReturnType<typeof annotate> | null>(null);

  function handleEnter() {
    if (!elRef.current) return;
    annotationRef.current?.remove();
    const a = annotate(elRef.current, {
      type: "underline",
      color: "#B17457",
      padding: 0,
      iterations: 2,
      animate: true,
      animationDuration: 400,
    });
    annotationRef.current = a;
    a.show();
  }

  function handleLeave() {
    annotationRef.current?.remove();
    annotationRef.current = null;
  }

  return (
    <Link
      ref={elRef}
      href={href}
      className="font-sans text-sm text-accent mt-2 self-start"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
    </Link>
  );
}
