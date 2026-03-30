import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { RoughLink } from "./RoughLink";
import { supabase } from "@/lib/supabase";

type ShareRow = {
  image_url: string;
  drink_recommendation: string;
  poetic_pairing: string;
  recipe: {
    instructions: string;
    ingredients: { ingredient: string; measure: string }[];
  } | null;
};

async function getShare(id: string): Promise<ShareRow | null> {
  const { data, error } = await supabase
    .from("shares")
    .select("image_url, drink_recommendation, poetic_pairing, recipe")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as ShareRow;
}

export async function generateMetadata(
  props: PageProps<"/share/[id]">
): Promise<Metadata> {
  const { id } = await props.params;
  const share = await getShare(id);
  if (!share) return { title: "Pour Another" };

  return {
    title: `${share.drink_recommendation} — Pour Another`,
    description: share.poetic_pairing,
    openGraph: {
      title: `${share.drink_recommendation} — Pour Another`,
      description: share.poetic_pairing,
      images: [{ url: share.image_url }],
    },
  };
}

export default async function SharePage(props: PageProps<"/share/[id]">) {
  const { id } = await props.params;
  const share = await getShare(id);

  if (!share) notFound();

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm flex flex-col gap-0 rounded-sm overflow-hidden shadow-lg border border-foreground/10">
        {/* Mood image */}
        <div className="relative w-full aspect-[4/3] bg-surface">
          <Image
            src={share.image_url}
            alt="Mood"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60" />
        </div>

        {/* Card body */}
        <div className="bg-background px-6 py-6 flex flex-col gap-4">
          <p className="font-title text-3xl text-accent leading-none">
            Pour Another<span className="font-sans text-base align-baseline">.</span>
          </p>

          <p className="font-sans text-med font-bold text-accent text-center pt-2 leading-tight">
            {share.drink_recommendation}
          </p>

          <p className="font-sans text-sm leading-7 text-center text-foreground/80">
            {share.poetic_pairing}
          </p>

          {share.recipe && (
            <div className="border-t border-foreground/10 pt-4 flex flex-col gap-3">
              <ul className="font-sans list-disc list-inside text-sm space-y-1 text-foreground/80">
                {share.recipe.ingredients.map((item, idx) => (
                  <li key={idx}>
                    {item.ingredient}
                    {item.measure ? ` — ${item.measure}` : ""}
                  </li>
                ))}
              </ul>
              <p className="font-sans text-sm whitespace-pre-line leading-6 text-foreground/80">
                {share.recipe.instructions}
              </p>
            </div>
          )}

          <RoughLink href="/">read the room yourself →</RoughLink>
        </div>
      </div>
    </main>
  );
}
