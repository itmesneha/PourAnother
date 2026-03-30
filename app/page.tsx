"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { annotate } from "rough-notation";
import { HandDrawnBox } from "./components/HandDrawnBox";

type PairingResult = {
  drinkRecommendation: string;
  poeticPairing: string;
  recipe?: { instructions: string; ingredients: Array<{ ingredient: string; measure: string }> };
};

export default function Home() {
  const cocktailFrames = [
    "/images/header_cocktail/first.png",
    "/images/header_cocktail/second.png",
    "/images/header_cocktail/third.png",
  ];
  const anotherRef = useRef<HTMLSpanElement>(null);
  const chooseBoxRef = useRef<HTMLDivElement>(null);
  const chooseHighlightRef = useRef<ReturnType<typeof annotate> | null>(null);
  const showRecipeBtnRef = useRef<HTMLButtonElement>(null);
  const showRecipeAnnotationRef = useRef<ReturnType<typeof annotate> | null>(null);
  const hideRecipeBtnRef = useRef<HTMLButtonElement>(null);
  const hideRecipeAnnotationRef = useRef<ReturnType<typeof annotate> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PairingResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUploadedPreview, setShowUploadedPreview] = useState(false);
  const [currentCocktailFrame, setCurrentCocktailFrame] = useState(0);
  const [showRecipe, setShowRecipe] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Animation states
  const [drinkVisible, setDrinkVisible] = useState(false);
  const [poeticText, setPoeticText] = useState("");
  const [poeticVisible, setPoeticVisible] = useState(false);
  const [recipeVisible, setRecipeVisible] = useState(false);
  const [recipeExiting, setRecipeExiting] = useState(false);

  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasInputStarted = file !== null || isLoading || result !== null;

  useEffect(() => {
    if (!anotherRef.current) return;
    const underline = annotate(anotherRef.current, {
      type: "underline",
      color: "#B17457",
      strokeWidth: 1,
      iterations: 5,
      animate: true,
      animationDuration: 500,
    });
    underline.show();
    return () => { underline.remove(); };
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
    const fadeTimer = window.setTimeout(() => { setShowUploadedPreview(true); }, 950);
    return () => {
      window.clearTimeout(fadeTimer);
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  useEffect(() => {
    return () => { chooseHighlightRef.current?.remove(); };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentCocktailFrame((prev) => (prev + 1) % cocktailFrames.length);
    }, 100);
    return () => { window.clearInterval(timer); };
  }, [cocktailFrames.length]);

  // Trigger animations when result arrives
  useEffect(() => {
    if (!result) {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      setDrinkVisible(false);
      setPoeticText("");
      setPoeticVisible(false);
      setRecipeVisible(false);
      return;
    }

    if (typewriterRef.current) clearInterval(typewriterRef.current);
    setDrinkVisible(false);
    setPoeticText("");
    setPoeticVisible(false);

    const drinkTimer = window.setTimeout(() => { setDrinkVisible(true); }, 50);

    // Start typewriter after drink fades in (~650ms)
    const poeticTimer = window.setTimeout(() => {
      setPoeticVisible(true);
      startTypewriter(result.poeticPairing);
    }, 700);

    return () => {
      window.clearTimeout(drinkTimer);
      window.clearTimeout(poeticTimer);
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  function startTypewriter(text: string) {
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    setPoeticText("");
    let i = 0;
    typewriterRef.current = setInterval(() => {
      i++;
      setPoeticText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(typewriterRef.current!);
        typewriterRef.current = null;
      }
    }, 35);
  }

  function handleChooseHoverEnter() {
    if (!chooseBoxRef.current) return;
    chooseHighlightRef.current?.remove();
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

  function handleShowRecipeHoverEnter() {
    if (!showRecipeBtnRef.current) return;
    showRecipeAnnotationRef.current?.remove();
    const a = annotate(showRecipeBtnRef.current, {
      type: "underline",
      color: "#B17457",
      padding: 0,
      iterations: 2,
      animate: true,
      animationDuration: 400,
    });
    showRecipeAnnotationRef.current = a;
    a.show();
  }

  function handleShowRecipeHoverLeave() {
    showRecipeAnnotationRef.current?.remove();
    showRecipeAnnotationRef.current = null;
  }

  function handleHideRecipeHoverEnter() {
    if (!hideRecipeBtnRef.current) return;
    hideRecipeAnnotationRef.current?.remove();
    const a = annotate(hideRecipeBtnRef.current, {
      type: "underline",
      color: "#B17457",
      padding: 0,
      iterations: 2,
      animate: true,
      animationDuration: 400,
    });
    hideRecipeAnnotationRef.current = a;
    a.show();
  }

  function handleHideRecipeHoverLeave() {
    hideRecipeAnnotationRef.current?.remove();
    hideRecipeAnnotationRef.current = null;
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
      setShowRecipe(false);
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
    if (!selected) return;
    void analyzeImage(selected);
  }

  function handleShowRecipe() {
    // Stop typewriter and complete the text
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }
    if (result) setPoeticText(result.poeticPairing);
    setRecipeVisible(false);
    setShowRecipe(true);
    // Fade recipe in after mount
    window.setTimeout(() => setRecipeVisible(true), 20);
  }

  function handleHideRecipe() {
    // Trigger recipe fade-out; onTransitionEnd will finish the switch
    setRecipeExiting(true);
    setRecipeVisible(false);
  }

  function handleRecipeTransitionEnd() {
    if (!recipeExiting) return;
    setRecipeExiting(false);
    setShowRecipe(false);
    // Fade poetic section back in
    setPoeticVisible(false);
    window.setTimeout(() => setPoeticVisible(true), 20);
  }

  const isTyping = result !== null && poeticText.length < result.poeticPairing.length;

  return (
    <>
      <div className="pointer-events-none absolute -left-24 top-12 h-[500px] w-[500px] opacity-100">
        <Image src="/images/glass1.png" alt="" fill className="object-contain" aria-hidden priority />
      </div>
      <div className="pointer-events-none absolute -right-8 bottom-0 h-[300px] w-[300px] opacity-100">
        <Image src="/images/glass2.png" alt="" fill className="object-contain" aria-hidden priority />
      </div>
      <main className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 overflow-hidden bg-background px-6 py-12 text-foreground">
        <div className="relative z-10 flex flex-col gap-8">
          <section className="space-y-3">
            <div className="flex items-end gap-4">
              <h1 className="font-title text-9xl font-normal text-accent leading-none">
                Pour <span ref={anotherRef}>Another</span>
                <span className="font-sans text-4xl align-baseline">.</span>
              </h1>
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
            className="grid gap-6"
            style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}
          >
            {/* Left box — file upload */}
            <div>
              <HandDrawnBox className="h-[430px]" delayMs={0} animationDurationMs={100} strokeWidth={1.2} padding={3} iterations={3}>
                <article className="flex h-full flex-col p-4">
                  <h2 className="font-sans text-sm text-accent">The Mood</h2>

                  {previewUrl ? (
                    <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
                      <div
                        className="relative min-h-0 flex-1 overflow-hidden rounded-md border border-foreground/20 bg-background"
                        style={{ cursor: showUploadedPreview ? "zoom-in" : "default" }}
                        onClick={() => { if (showUploadedPreview) setLightboxOpen(true); }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{
                            opacity: showUploadedPreview ? 1 : 0,
                            transition: "opacity 1200ms ease-out",
                          }}
                        >
                          <Image src={previewUrl} alt="Uploaded preview" fill className="object-cover" />
                        </div>
                        {!showUploadedPreview ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                            <p className="font-sans text-sm text-accent/85">framing your mood...</p>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex justify-center py-2">
                        <div ref={chooseBoxRef} className="w-1/2" onMouseEnter={handleChooseHoverEnter} onMouseLeave={handleChooseHoverLeave}>
                          <HandDrawnBox className="w-full" animationDurationMs={3000} strokeWidth={1.2} padding={3} iterations={1}>
                            <label className="font-sans inline-flex w-full cursor-pointer items-center justify-center rounded-sm bg-accent/5 px-4 py-3 text-center text-sm text-accent">
                              choose another
                              <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                            </label>
                          </HandDrawnBox>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-1 items-center justify-center">
                      <div ref={chooseBoxRef} className="w-1/2" onMouseEnter={handleChooseHoverEnter} onMouseLeave={handleChooseHoverLeave}>
                        <HandDrawnBox className="w-full" animationDurationMs={3000} strokeWidth={1.2} padding={3} iterations={1}>
                          <label className="font-sans inline-flex w-full cursor-pointer items-center justify-center rounded-sm bg-accent/5 px-4 py-3 text-center text-sm text-accent">
                            {isLoading ? "reading the room..." : "choose file"}
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                          </label>
                        </HandDrawnBox>
                      </div>
                    </div>
                  )}
                </article>
              </HandDrawnBox>
            </div>

            {/* Right box */}
            <div>
              {hasInputStarted ? (
                <HandDrawnBox className="h-[430px]" delayMs={350}>
                  <article className="flex h-full flex-col p-4">
                    <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
                      {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="relative w-32 h-32 mb-4">
                            <Image src="/images/glass4.png" alt="Cocktail" fill className="object-contain" />
                          </div>
                          <p className="font-sans text-sm text-foreground/80 flex items-center justify-center gap-0.5">
                            reading the room
                            <span className="ml-1 flex gap-0.5">
                              <span className="animate-bounce [animation-delay:0ms]">.</span>
                              <span className="animate-bounce [animation-delay:150ms]">.</span>
                              <span className="animate-bounce [animation-delay:300ms]">.</span>
                            </span>
                          </p>
                        </div>
                      ) : result ? (
                        <div className="flex flex-col items-center justify-center text-center space-y-4 px-2">

                          {/* Drink name — fade in */}
                          <p
                            className="font-sans text-med font-bold text-accent "
                            style={{
                              opacity: drinkVisible ? 1 : 0,
                              transition: "opacity 0.6s ease-out",
                            }}
                          >
                            {result.drinkRecommendation}
                          </p>

                          {/* Poetic text — typewriter, fades in as container */}
                          {!showRecipe && (
                            <div
                              className="flex flex-col items-center gap-4"
                              style={{
                                opacity: poeticVisible ? 1 : 0,
                                transition: "opacity 0.5s ease-out",
                              }}
                            >
                              <p className="font-sans whitespace-pre-wrap text-sm leading-7">
                                {poeticText}
                                {isTyping && (
                                  <span style={{ opacity: 0.4, animation: "pulse 1s step-end infinite" }}>|</span>
                                )}
                              </p>
                              {result.recipe && !isTyping && (
                                <button
                                  ref={showRecipeBtnRef}
                                  className="font-sans cursor-pointer bg-transparent px-4 py-2 text-sm text-accent"
                                  onClick={handleShowRecipe}
                                  onMouseEnter={handleShowRecipeHoverEnter}
                                  onMouseLeave={handleShowRecipeHoverLeave}
                                >
                                  show recipe
                                </button>
                              )}
                            </div>
                          )}

                          {/* Recipe — fade in, fade out */}
                          {showRecipe && result.recipe && (
                            <div
                              className="w-full text-left space-y-3"
                              style={{
                                opacity: recipeVisible ? 1 : 0,
                                transition: "opacity 0.4s ease-out",
                              }}
                              onTransitionEnd={handleRecipeTransitionEnd}
                            >
                              <ul className="font-sans list-disc list-inside text-sm space-y-1">
                                {result.recipe.ingredients.map((item, idx) => (
                                  <li key={idx}>
                                    {item.ingredient}
                                    {item.measure ? ` — ${item.measure}` : ""}
                                  </li>
                                ))}
                              </ul>
                              <div className="font-sans text-sm whitespace-pre-line leading-6">
                                {result.recipe.instructions}
                              </div>
                              <div className="flex justify-center pt-2">
                                <button
                                  ref={hideRecipeBtnRef}
                                  className="font-sans cursor-pointer bg-transparent px-4 py-2 text-sm text-accent"
                                  onClick={handleHideRecipe}
                                  onMouseEnter={handleHideRecipeHoverEnter}
                                  onMouseLeave={handleHideRecipeHoverLeave}
                                >
                                  hide recipe
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="relative w-32 h-32 mb-4">
                            <Image src="/images/glass4.png" alt="Cocktail" fill className="object-contain" />
                          </div>
                          <p className="font-sans text-sm text-foreground/80 text-center">
                            ready to read the room
                          </p>
                        </div>
                      )}
                    </div>
                  </article>
                </HandDrawnBox>
              ) : (
                <div className="h-[430px] flex flex-col items-center justify-center p-4">
                  <div className="relative w-32 h-32 mb-4">
                    <Image src="/images/glass4.png" alt="Cocktail" fill className="object-contain" />
                  </div>
                  <p className="font-sans text-sm text-foreground/80 text-center">
                    ready to read the room
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      {lightboxOpen && previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <Image
              src={previewUrl}
              alt="Full preview"
              width={1200}
              height={1200}
              className="max-h-[90vh] max-w-[90vw] rounded-md object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
