import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

type Recipe = { ingredient: string; measure: string }[];
type PairingResult = {
  drinkRecommendation: string;
  poeticPairing: string;
  recipe?: { instructions: string; ingredients: Recipe };
};

function extractJsonBlock(text: string): string {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Claude returned an unexpected response.");
  }
  return text.slice(firstBrace, lastBrace + 1);
}

async function fetchRecipeFromCocktailDB(
  drinkName: string
): Promise<{ instructions: string; ingredients: Recipe } | null> {
  try {
    const res = await fetch(
      `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(drinkName)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { drinks?: Array<Record<string, unknown>> };
    const drink = data.drinks?.[0];
    if (!drink) return null;
    const instructions = drink.strInstructions as string | undefined;
    if (!instructions) return null;
    const ingredients: Recipe = [];
    for (let i = 1; i <= 15; i++) {
      const ingredient = drink[`strIngredient${i}`] as string | undefined;
      const measure = drink[`strMeasure${i}`] as string | undefined;
      if (ingredient) ingredients.push({ ingredient, measure: measure ?? "" });
    }
    return { instructions, ingredients };
  } catch {
    return null;
  }
}

async function getRecipeFromClaude(
  drinkName: string,
  apiKey: string,
  model: string
): Promise<{ instructions: string; ingredients: Recipe } | null> {
  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `Provide a recipe for a ${drinkName} cocktail. Return ONLY valid JSON: {"instructions":"...","ingredients":[{"ingredient":"...","measure":"..."}]}`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as { content?: Array<{ type?: string; text?: string }> };
    const text = payload.content?.filter((c) => c.type === "text").map((c) => c.text).join("\n") ?? "";
    const recipe = JSON.parse(extractJsonBlock(text)) as { instructions?: string; ingredients?: Recipe };
    if (recipe.instructions && recipe.ingredients) return { instructions: recipe.instructions, ingredients: recipe.ingredients };
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set." }, { status: 500 });
    }

    const body = (await request.json()) as { ingredients?: unknown };
    if (typeof body.ingredients !== "string" || !body.ingredients.trim()) {
      return NextResponse.json({ error: "Please provide ingredients." }, { status: 400 });
    }

    const ingredients = body.ingredients.trim();

    const prompt = [
      `I have these ingredients available: ${ingredients}`,
      "Recommend the single best alcoholic cocktail I can make with some or all of these.",
      "Return ONLY valid JSON with this exact shape:",
      '{"drinkRecommendation":"...","poeticPairing":"..."}',
      "The poeticPairing should be lyrical but concise (1-2 sentences). Do not include the recipe in the drinkRecommendation only a brief title of max 3 words",
    ].join("\n");

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Something went wrong while raiding the cabinet. Try again in a moment." },
        { status: 502 },
      );
    }

    const claudePayload = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const responseText =
      claudePayload.content
        ?.filter((c) => c.type === "text" && typeof c.text === "string")
        .map((c) => c.text)
        .join("\n") ?? "";

    const jsonText = extractJsonBlock(responseText);
    const parsed = JSON.parse(jsonText) as Partial<PairingResult>;

    if (!parsed.drinkRecommendation || !parsed.poeticPairing) {
      throw new Error("Claude returned an unexpected response.");
    }

    const result: PairingResult = {
      drinkRecommendation: parsed.drinkRecommendation,
      poeticPairing: parsed.poeticPairing,
    };

    const recipe =
      (await fetchRecipeFromCocktailDB(result.drinkRecommendation)) ||
      (await getRecipeFromClaude(result.drinkRecommendation, apiKey, model));

    if (recipe) result.recipe = recipe;

    return NextResponse.json({ result });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while raiding the cabinet. Try again in a moment." },
      { status: 500 },
    );
  }
}
