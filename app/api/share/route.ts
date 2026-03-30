import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

type Ingredient = { ingredient: string; measure: string };
type SharePayload = {
  drinkRecommendation: string;
  poeticPairing: string;
  recipe?: { instructions: string; ingredients: Ingredient[] };
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const dataRaw = formData.get("data");

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "Image required." }, { status: 400 });
    }
    if (typeof dataRaw !== "string") {
      return NextResponse.json({ error: "Data required." }, { status: 400 });
    }

    const data = JSON.parse(dataRaw) as SharePayload;

    // Upload image to Supabase Storage
    const bytes = await image.arrayBuffer();
    const fileName = `${crypto.randomUUID()}.${image.name.split(".").pop() ?? "jpg"}`;

    const { error: uploadError } = await supabase.storage
      .from("mood-images")
      .upload(fileName, bytes, { contentType: image.type, upsert: false });

    if (uploadError) {
      return NextResponse.json(
        { error: `Image upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from("mood-images")
      .getPublicUrl(fileName);

    // Insert share record
    const { data: row, error: insertError } = await supabase
      .from("shares")
      .insert({
        image_url: urlData.publicUrl,
        drink_recommendation: data.drinkRecommendation,
        poetic_pairing: data.poeticPairing,
        recipe: data.recipe ?? null,
      })
      .select("id")
      .single();

    if (insertError || !row) {
      return NextResponse.json(
        { error: `DB insert failed: ${insertError?.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: row.id as string });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
