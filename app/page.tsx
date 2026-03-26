"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { annotate } from "rough-notation";
import { HandDrawnBox } from "./components/HandDrawnBox";

type PairingResult = {
  aesthetic: string;
  palette: string;
  lighting: string;
  mood: string;
  drinkRecommendation: string;
  poeticPairing: string;
};

export default function Home() {
  const cocktailFrames = [
    "/images/header_cocktail/first.png",
    "/images/header_cocktail/second.png",
    "/images/header_cocktail/third.png",
    // "/images/header_cocktail/4.png",
    // "/images/header_cocktail/5.png",
    // "/images/header_cocktail/6.png"
  ];
  const anotherRef = useRef<HTMLSpanElement>(null);
  const chooseBoxRef = useRef<HTMLDivElement>(null);
  const chooseHighlightRef = useRef<ReturnType<typeof annotate> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PairingResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUploadedPreview, setShowUploadedPreview] = useState(false);
  const [currentCocktailFrame, setCurrentCocktailFrame] = useState(0);
  const hasInputStarted = file !== null || isLoading || result !== null;

  useEffect(() => {
    if (!anotherRef.current) {
      return;
    }
    

    // underline animation page title - 'another'
    const underline = annotate(anotherRef.current, {
      type: "underline",
      color: "#B17457",
      strokeWidth: 1,
      iterations: 5,
      animate: true,
      animationDuration: 500,
    });

    underline.show();

    return () => {
      underline.remove();
    };
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setShowUploadedPreview(false);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setShowUploadedPreview(false);

    const fadeTimer = window.setTimeout(() => {
      setShowUploadedPreview(true);
    }, 950);

    return () => {
      window.clearTimeout(fadeTimer);
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  useEffect(() => {
    return () => {
      chooseHighlightRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentCocktailFrame((prev) => (prev + 1) % cocktailFrames.length);
    }, 100);

    return () => {
      window.clearInterval(timer);
    };
  }, [cocktailFrames.length]);

  function handleChooseHoverEnter() {
    if (!chooseBoxRef.current) {
      return;
    }

    chooseHighlightRef.current?.remove();
    
    // choose file underline animation on hover
    const highlight = annotate(chooseBoxRef.current, {
      type: "underline",
      color: "#B17457",
      padding: 0,
      iterations: 5,
      animate: true,
      animationDuration: 500,
    });

    chooseHighlightRef.current = highlight;
    highlight.show();
  }

  function handleChooseHoverLeave() {
    chooseHighlightRef.current?.remove();
    chooseHighlightRef.current = null;
  }

  async function analyzeImage(selectedFile: File) {
    setFile(selectedFile);

    setIsLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as
        | { error: string }
        | { result: PairingResult };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Request failed.");
      }

      setResult(payload.result);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while analyzing the image.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;

    if (!selected) {
      return;
    }

    void analyzeImage(selected);
  }

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 overflow-hidden bg-background px-6 py-12 text-foreground">
      <div className="pointer-events-none absolute -left-24 top-48 h-[500px] w-[500px] opacity-100">
        <Image
          src="/images/glass1.png"
          alt=""
          fill
          className="object-contain"
          aria-hidden
          priority
        />
      </div>

      <div className="pointer-events-none absolute -right-8 bottom-0 h-[300px] w-[300px] opacity-100">
        <Image
          src="/images/glass2.png"
          alt=""
          fill
          className="object-contain"
          aria-hidden
          priority
        />
      </div>

      <div className="relative z-10 flex flex-col gap-8">
      <section className="space-y-3">
        <div className="flex items-end gap-4">
          <h1 className="font-title text-9xl font-normal text-accent leading-none">
            Pour <span ref={anotherRef}>Another</span>
            <span className="font-sans text-4xl align-baseline">.</span>
          </h1>
          <div className="relative h-28 w-28 shrink-0 self-end md:h-32 md:w-32">
            <Image
              src={cocktailFrames[currentCocktailFrame]}
              alt="Animated cocktail"
              fill
              className="object-contain object-bottom"
              style={{ top: "25px" }}
              priority
            />
          </div>
        </div>
        <p className="font-sans text-sm text-foreground/90 pt-4">
          Every mood has a drink waiting for it.
        </p>
      </section>

      {error ? (
        <section className="rounded-md border border-accent/60 bg-surface px-4 py-3 text-sm text-foreground">
          {error}
        </section>
      ) : null}

      <section
        className="grid gap-6 transition-all duration-[1100ms] ease-in-out"
        style={{
          gridTemplateColumns: hasInputStarted
            ? "minmax(0,1fr) minmax(0,1fr)"
            : "minmax(0,1fr) 0fr",
        }}
      >
        <div
          className={`transition-all duration-[1100ms] ease-in-out ${
            hasInputStarted ? "max-w-none" : "mx-auto w-full max-w-md"
          }`}
        >
        <HandDrawnBox className="h-[430px]" delayMs={0} animationDurationMs={100}
                    strokeWidth={1.2}
                    padding={3}
                    iterations={3}>
          <article className="flex h-full flex-col">
          <h2 className="font-sans text-sm text-accent pt-3 pr-3">The Mood</h2>

          {previewUrl ? (
            <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
              <div className="relative min-h-0 flex-1 overflow-hidden rounded-md border border-foreground/20 bg-background">
                <div
                  className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
                    showUploadedPreview ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Image
                    src={previewUrl}
                    alt="Uploaded preview"
                    fill
                    className="object-cover"
                  />
                </div>

                {!showUploadedPreview ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                    <p className="font-sans text-sm text-accent/85">framing your mood...</p>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-center py-2">
                <div
                  ref={chooseBoxRef}
                  className="w-1/2"
                  onMouseEnter={handleChooseHoverEnter}
                  onMouseLeave={handleChooseHoverLeave}
                >
                  <HandDrawnBox
                    className="w-full"
                    animationDurationMs={3000}
                    strokeWidth={1.2}
                    padding={3}
                    iterations={1}
                  >
                    <label className="font-sans inline-flex w-full cursor-pointer items-center justify-center rounded-sm bg-accent/5 px-4 py-3 text-center text-sm text-accent">
                      choose another
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </HandDrawnBox>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-1 items-center justify-center bg-background/60">
              <div
                ref={chooseBoxRef}
                className="w-1/2"
                onMouseEnter={handleChooseHoverEnter}
                onMouseLeave={handleChooseHoverLeave}
              >
                <HandDrawnBox
                  className="w-full"
                  animationDurationMs={3000}
                    strokeWidth={1.2}
                    padding={3}
                    iterations={1}
                >
                  <label className="font-sans inline-flex w-full cursor-pointer items-center justify-center rounded-sm bg-accent/5 px-4 py-3 text-center text-sm text-accent">
                    {isLoading ? "reading the room..." : "choose file"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                </HandDrawnBox>
              </div>
            </div>
          )}
          </article>
        </HandDrawnBox>
        </div>

        <div
          className={`min-w-0 overflow-hidden transition-all duration-[900ms] ease-in-out ${
            hasInputStarted
              ? "translate-x-0 opacity-100"
              : "pointer-events-none translate-x-10 opacity-0"
          }`}
        >
        {hasInputStarted ? (
        <HandDrawnBox className="h-[430px]" delayMs={350}>
          <article className="flex h-full flex-col">
          <h2 className="font-sans text-sm text-accent pr-3">Drink Pairing</h2>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <p className="font-sans text-sm text-foreground/80">reading the room...</p>
            ) : result ? (
              <div className="space-y-4">
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Aesthetic:</strong> {result.aesthetic}
                  </p>
                  <p>
                    <strong>Palette:</strong> {result.palette}
                  </p>
                  <p>
                    <strong>Lighting:</strong> {result.lighting}
                  </p>
                  <p>
                    <strong>Mood:</strong> {result.mood}
                  </p>
                </div>

                <p className="text-lg">
                  <strong>Recommended drink:</strong> {result.drinkRecommendation}
                </p>

                <p className="whitespace-pre-wrap text-sm leading-7">
                  {result.poeticPairing}
                </p>
              </div>
            ) : (
              <p className="font-sans text-sm text-foreground/80">
                Upload an image to get your pairing.
              </p>
            )}
          </div>
          </article>
        </HandDrawnBox>
        ) : null}
        </div>
      </section>
      </div>
    </main>
  );
}
