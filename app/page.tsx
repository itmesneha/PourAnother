"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Please choose an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);

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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold">Pour Another</h1>
        <p className="text-sm text-neutral-600">
          Upload a photo or mood board. Claude Vision will analyze aesthetic,
          palette, lighting, and mood, then return a drink pairing with a poetic
          explanation.
        </p>
      </section>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            setFile(selected);
            setResult(null);
            setError(null);
          }}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Analyzing..." : "Analyze and Recommend"}
        </button>
      </form>

      {previewUrl ? (
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Uploaded image</h2>
          <Image
            src={previewUrl}
            alt="Uploaded preview"
            width={1200}
            height={800}
            className="max-h-80 w-full rounded-md border object-contain"
          />
        </section>
      ) : null}

      {error ? (
        <section className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      {result ? (
        <section className="space-y-4 rounded-md border p-4">
          <h2 className="text-xl font-semibold">Drink Pairing</h2>

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
        </section>
      ) : null}
    </main>
  );
}
