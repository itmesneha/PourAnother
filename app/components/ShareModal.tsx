"use client";

import { useRef, useState } from "react";
import { HandDrawnBox } from "./HandDrawnBox";
import { annotate } from "rough-notation";

type ShareState = "idle" | "loading" | "copied" | "error";

type Props = {
  onConfirm: (from: string, to: string, message: string) => void;
  onCancel: () => void;
  shareState: ShareState;
};

export function ShareModal({ onConfirm, onCancel, shareState }: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [tried, setTried] = useState(false);
  const submitBoxRef = useRef<HTMLDivElement>(null);
  const submitAnnotationRef = useRef<ReturnType<typeof annotate> | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const cancelAnnotationRef = useRef<ReturnType<typeof annotate> | null>(null);

  const canHover = () => window.matchMedia("(hover: hover)").matches;

  function playSound(src: string) {
    const audio = new Audio(src);
    audio.play().catch(() => {});
  }

  function handleSubmitEnter() {
    if (!submitBoxRef.current || !canHover()) return;
    submitAnnotationRef.current?.remove();
    const a = annotate(submitBoxRef.current, {
      type: "underline",
      color: "#B17457",
      padding: 0,
      iterations: 2,
      animate: true,
      animationDuration: 400,
    });
    submitAnnotationRef.current = a;
    a.show();
  }

  function handleSubmitLeave() {
    submitAnnotationRef.current?.remove();
    submitAnnotationRef.current = null;
  }

  function handleCancelEnter() {
    if (!cancelRef.current || !canHover()) return;
    cancelAnnotationRef.current?.remove();
    const a = annotate(cancelRef.current, {
      type: "underline",
      color: "#B17457",
      padding: 0,
      iterations: 2,
      animate: true,
      animationDuration: 400,
    });
    cancelAnnotationRef.current = a;
    a.show();
  }

  function handleCancelLeave() {
    cancelAnnotationRef.current?.remove();
    cancelAnnotationRef.current = null;
  }

  const isLoading = shareState === "loading";
  const canSubmit = from.trim().length > 0 && to.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) { playSound("/sounds/page-change.mp3"); onCancel(); } }}
    >
      <div className="w-full max-w-xs mx-4">
        <HandDrawnBox strokeWidth={1.2} padding={6} iterations={3}>
          <div className="bg-background px-6 py-7 flex flex-col gap-5">
            <p className="cocktail-suggestion text-3xl text-accent leading-none">
              send this pairing
            </p>

            <div className="flex flex-col gap-4">
              <label className="flex items-baseline gap-3">
                <span className="font-sans text-xs text-accent w-10 shrink-0">to</span>
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="someone special"
                  maxLength={50}
                  className="flex-1 bg-transparent border-b border-foreground/20 font-sans text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-accent/50 pb-1 transition-colors"
                />
              </label>
              <label className="flex items-baseline gap-3">
                <span className="font-sans text-xs text-accent w-10 shrink-0">from</span>
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="you"
                  maxLength={50}
                  className="flex-1 bg-transparent border-b border-foreground/20 font-sans text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-accent/50 pb-1 transition-colors"
                />
              </label>
              <label className="flex items-start gap-3">
                <span className="font-sans text-xs text-accent w-10 shrink-0 pt-1">note</span>
                <div className="flex-1 flex flex-col gap-1">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="a little something for you..."
                    rows={3}
                    maxLength={200}
                    className="w-full bg-transparent border-b border-foreground/20 font-sans text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-accent/50 pb-1 resize-none leading-6 transition-colors"
                  />
                  <p className="font-sans text-xs text-foreground/25 text-right">{message.length}/200</p>
                </div>
              </label>
            </div>

            {tried && !canSubmit && (
              <p className="font-sans text-xs text-accent/70 -mt-2">
                please fill in both the to and from fields.
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <div
                ref={submitBoxRef}
                onMouseEnter={handleSubmitEnter}
                onMouseLeave={handleSubmitLeave}
              >
                {/* <HandDrawnBox strokeWidth={1.2} padding={3} iterations={1}> */}
                  <button
                    className="font-sans text-sm text-accent px-4 py-2 bg-accent/5 disabled:opacity-50 cursor-pointer relative"
                    style={{ minWidth: "7.5rem" }}
                    onClick={() => { setTried(true); if (canSubmit) { playSound("/sounds/page-change.mp3"); onConfirm(from, to, message); } }}
                    disabled={isLoading}
                  >
                    {/* Widest string sits invisible to reserve space */}
                    <span className="invisible">couldn&apos;t share</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      {shareState === "loading" && "saving..."}
                      {shareState === "copied" && "link copied!"}
                      {shareState === "error" && "couldn't share"}
                      {shareState === "idle" && "get link →"}
                    </span>
                  </button>
                {/* </HandDrawnBox> */}
              </div>
              <button
                ref={cancelRef}
                className="font-sans text-xs text-foreground/40 bg-transparent cursor-pointer"
                onClick={() => { playSound("/sounds/page-change.mp3"); onCancel(); }}
                onMouseEnter={handleCancelEnter}
                onMouseLeave={handleCancelLeave}
              >
                cancel
              </button>
            </div>
          </div>
        </HandDrawnBox>
      </div>
    </div>
  );
}
