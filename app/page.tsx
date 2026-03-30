"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { annotate } from "rough-notation";
import { HandDrawnBox } from "./components/HandDrawnBox";
import { ShareModal } from "./components/ShareModal";

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
  const shareBtnRef = useRef<HTMLButtonElement>(null);
  const shareAnnotationRef = useRef<ReturnType<typeof annotate> | null>(null);
  const barSubmitBoxRef = useRef<HTMLDivElement>(null);
  const barSubmitAnnotationRef = useRef<ReturnType<typeof annotate> | null>(null);
  const [mode, setMode] = useState<"mood" | "bar">("mood");
  const [file, setFile] = useState<File | null>(null);
  const [ingredients, setIngredients] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PairingResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUploadedPreview, setShowUploadedPreview] = useState(false);
  const [currentCocktailFrame, setCurrentCocktailFrame] = useState(0);
  const [showRecipe, setShowRecipe] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "loading" | "copied" | "error">("idle");
  const [showShareModal, setShowShareModal] = useState(false);

  // Animation states
  const [drinkVisible, setDrinkVisible] = useState(false);
  const [poeticText, setPoeticText] = useState("");
  const [poeticVisible, setPoeticVisible] = useState(false);
  const [recipeVisible, setRecipeVisible] = useState(false);
  const [recipeExiting, setRecipeExiting] = useState(false);

  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasInputStarted = file !== null || isLoading || result !== null;

  useEffect(() => {
    if (!previewUrl) return;
    const interval = setInterval(() => {
      setCurrentCocktailFrame((f) => (f + 1) % cocktailFrames.length);
    }, 400);
    return () => clearInterval(interval);
  }, [previewUrl]);

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
      setShareState("idle");
      setShowShareModal(false);
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

  const canHover = () => window.matchMedia("(hover: hover)").matches;

  function handleChooseHoverEnter() {
    if (!chooseBoxRef.current || !canHover()) return;
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
    if (!showRecipeBtnRef.current || !canHover()) return;
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
    if (!hideRecipeBtnRef.current || !canHover()) return;
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

  function switchMode(newMode: "mood" | "bar") {
    if (newMode === mode) return;
    setMode(newMode);
    setFile(null);
    setIngredients("");
    setResult(null);
    setError(null);
    setShowRecipe(false);
  }

  function handleBarSubmitHoverEnter() {
    if (!barSubmitBoxRef.current || !canHover()) return;
    barSubmitAnnotationRef.current?.remove();
    const a = annotate(barSubmitBoxRef.current, {
      type: "underline",
      color: "#B17457",
      padding: 0,
      iterations: 5,
      animate: true,
      animationDuration: 500,
    });
    barSubmitAnnotationRef.current = a;
    a.show();
  }

  function handleBarSubmitHoverLeave() {
    barSubmitAnnotationRef.current?.remove();
    barSubmitAnnotationRef.current = null;
  }

  async function analyzeIngredients() {
    if (!ingredients.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/bar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ingredients: ingredients.trim() }),
      });
      const payload = (await response.json()) as { error: string } | { result: PairingResult };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Request failed.");
      }
      setResult(payload.result);
      setShowRecipe(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleShareHoverEnter() {
    if (!shareBtnRef.current || !canHover()) return;
    shareAnnotationRef.current?.remove();
    const a = annotate(shareBtnRef.current, {
      type: "underline",
      color: "#B17457",
      padding: 0,
      iterations: 2,
      animate: true,
      animationDuration: 400,
    });
    shareAnnotationRef.current = a;
    a.show();
  }

  function handleShareHoverLeave() {
    shareAnnotationRef.current?.remove();
    shareAnnotationRef.current = null;
  }

  async function handleShare(from: string, to: string, message: string) {
    if (!result || shareState === "loading") return;
    setShareState("loading");
    try {
      const formData = new FormData();
      if (file) formData.append("image", file);
      formData.append("data", JSON.stringify(result));
      if (from.trim()) formData.append("from", from.trim());
      if (to.trim()) formData.append("to", to.trim());
      if (message.trim()) formData.append("message", message.trim());
      const res = await fetch("/api/share", { method: "POST", body: formData });
      const json = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !json.id) throw new Error(json.error ?? "Share failed.");
      const url = `${window.location.origin}/share/${json.id}`;
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      window.setTimeout(() => {
        setShareState("idle");
        setShowShareModal(false);
      }, 1500);
    } catch {
      setShareState("error");
      window.setTimeout(() => setShareState("idle"), 3000);
    }
  }

  const isTyping = result !== null && poeticText.length < result.poeticPairing.length;

  return (
    <>
      <div className="pointer-events-none absolute -left-24 top-12 h-[500px] w-[500px] opacity-100">
        <Image src="/images/glass1.png" alt="" fill className="object-contain" aria-hidden priority />
      </div>
      <div className="pointer-events-none absolute right-8 bottom-0 h-[300px] w-[300px] opacity-100">
        <Image src="/images/glass2.png" alt="" fill className="object-contain" aria-hidden priority />
      </div>
      <main className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 overflow-hidden bg-background px-6 py-12 text-foreground">
        <div className="relative z-10 flex flex-col gap-8">
          <section className="space-y-3">
            <div className="flex items-end gap-4">
              <h1 className="font-title text-5xl sm:text-9xl font-normal text-accent leading-none">
                Pour <span ref={anotherRef}>Another</span>
                <span className="font-sans text-2xl sm:text-4xl align-baseline">.</span>
              </h1>
            </div>
            <p className="font-sans text-sm text-foreground/90 pt-4">
              {mode === "mood" ? "Every mood has a drink waiting for it." : "Every bar has a cocktail hiding in it."}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <button
                className={`font-sans text-sm transition-colors ${mode === "mood" ? "text-accent" : "text-foreground/35 hover:text-foreground/60"}`}
                onClick={() => switchMode("mood")}
              >
                the mood
              </button>
              <span className="font-sans text-sm text-foreground/25">/</span>
              <button
                className={`font-sans text-sm transition-colors ${mode === "bar" ? "text-accent" : "text-foreground/35 hover:text-foreground/60"}`}
                onClick={() => switchMode("bar")}
              >
                the bar
              </button>
            </div>
          </section>

          {error ? (
            <section className="rounded-md border border-accent/60 bg-surface px-4 py-3 text-sm text-foreground">
              {error}
            </section>
          ) : null}

          <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
            {/* Left box — mood upload or bar ingredients */}
            <div>
              <HandDrawnBox className="h-[200px] sm:h-[430px]" delayMs={0} animationDurationMs={100} strokeWidth={1.2} padding={3} iterations={3}>
                <article className="flex h-full flex-col p-3 sm:p-4">
                  <h2 className="font-sans text-sm text-accent">{mode === "mood" ? "The Mood" : "The Bar"}</h2>

                  {mode === "mood" ? (
                    previewUrl ? (
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
                            <Image src={previewUrl} alt="Uploaded preview" fill className="object-contain sm:object-cover" />
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
                    )
                  ) : (
                    <div className="mt-3 flex flex-1 flex-col gap-3">
                      <textarea
                        className="flex-1 resize-none bg-transparent font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none leading-7"
                        placeholder={"gin, lemon, rosemary,\ntriple sec, honey..."}
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void analyzeIngredients(); }}
                      />
                      <div className="flex justify-center py-2">
                        <div ref={barSubmitBoxRef} className="w-2/3" onMouseEnter={handleBarSubmitHoverEnter} onMouseLeave={handleBarSubmitHoverLeave}>
                          <HandDrawnBox className="w-full" animationDurationMs={3000} strokeWidth={1.2} padding={3} iterations={1}>
                            <button
                              className="font-sans inline-flex w-full cursor-pointer items-center justify-center rounded-sm bg-accent/5 px-4 py-3 text-center text-sm text-accent disabled:opacity-50"
                              onClick={() => void analyzeIngredients()}
                              disabled={isLoading || !ingredients.trim()}
                            >
                              {isLoading ? "mixing something up..." : "what can i make?"}
                            </button>
                          </HandDrawnBox>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              </HandDrawnBox>
            </div>

            {/* Right box */}
            <div>
              {hasInputStarted ? (
                <HandDrawnBox className="h-[200px] sm:h-[430px]" delayMs={350}>
                  <article className="flex h-full flex-col p-3 sm:p-4">
                    <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
                      {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="relative w-16 h-16 sm:w-32 sm:h-32 mb-4">
                            <Image src={(previewUrl || mode === "bar") ? cocktailFrames[currentCocktailFrame] : "/images/glass4.png"} alt="Cocktail" fill className="object-contain" />
                          </div>
                          <p className="font-sans text-sm text-foreground/80 flex items-center justify-center gap-0.5">
                            {mode === "mood" ? "reading the room" : "raiding the cabinet"}
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

                          {/* Share button — appears after typing finishes */}
                          {!isTyping && (
                            <button
                              ref={shareBtnRef}
                              className="font-sans cursor-pointer bg-transparent px-4 py-1 text-xs text-foreground/40 hover:text-accent transition-colors"
                              onClick={() => setShowShareModal(true)}
                              onMouseEnter={handleShareHoverEnter}
                              onMouseLeave={handleShareHoverLeave}
                            >
                              share this pairing
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="relative w-16 h-16 sm:w-32 sm:h-32 mb-4">
                            <Image src={previewUrl ? cocktailFrames[currentCocktailFrame] : "/images/glass4.png"} alt="Cocktail" fill className="object-contain" />
                          </div>
                          <p className="font-sans text-sm text-foreground/80 text-center">
                            {mode === "mood" ? "ready to read the room" : "tell me what you've got"}
                          </p>
                        </div>
                      )}
                    </div>
                  </article>
                </HandDrawnBox>
              ) : (
                <div className="h-[200px] sm:h-[430px] flex flex-col items-center justify-center p-4">
                  <div className="relative w-16 h-16 sm:w-32 sm:h-32 mb-4">
                    <Image src="/images/glass4.png" alt="Cocktail" fill className="object-contain" />
                  </div>
                  <p className="font-sans text-sm text-foreground/80 text-center">
                    {mode === "mood" ? "ready to read the room" : "tell me what you've got"}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      {showShareModal && (
        <ShareModal
          onConfirm={(from, to, message) => void handleShare(from, to, message)}
          onCancel={() => { setShowShareModal(false); setShareState("idle"); }}
          shareState={shareState}
        />
      )}
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
