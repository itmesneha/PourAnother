"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";

type PairingResult = {
  aesthetic: string;
  palette: string;
  lighting: string;
  mood: string;
  drinkRecommendation: string;
  poeticPairing: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PairingResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

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
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 bg-background px-6 py-12 text-foreground">
      <section className="space-y-3">
        <h1 className="font-title text-9xl font-normal text-accent">Pour Another</h1>
        <p className="font-sans text-sm text-foreground/90 pt-16">
          Every mood has a drink waiting for it.
        </p>
      </section>

      {error ? (
        <section className="rounded-md border border-accent/60 bg-surface px-4 py-3 text-sm text-foreground">
          {error}
        </section>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        <article className="flex h-[430px] flex-col rounded-md border border-foreground/25 bg-surface p-4">
          <h2 className="font-sans text-sm text-accent">The Mood</h2>

          {previewUrl ? (
            <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
              <div className="relative min-h-0 flex-1 overflow-hidden rounded-md border border-foreground/20 bg-background">
                <Image
                  src={previewUrl}
                  alt="Uploaded preview"
                  fill
                  className="object-cover"
                />
              </div>

              <label className="font-sans inline-flex w-fit cursor-pointer rounded-md bg-accent px-4 py-2 text-sm text-background">
                choose another
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          ) : (
            <div className="mt-3 flex flex-1 items-center justify-center rounded-md border border-dashed border-foreground/30 bg-background/60">
              <label className="font-sans inline-flex w-1/2 cursor-pointer items-center justify-center rounded-md bg-accent px-4 py-3 text-center text-sm text-background">
                {isLoading ? "reading the room..." : "choose file"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          )}
        </article>

        <article className="flex h-[430px] flex-col rounded-md border border-foreground/20 bg-surface p-4">
          <h2 className="font-sans text-sm text-accent">Drink Pairing</h2>

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
      </section>
    </main>
  );
}
