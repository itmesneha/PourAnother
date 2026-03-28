import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

type Recipe = { ingredient: string; measure: string }[];

type PairingResult = {
  drinkRecommendation: string;
  poeticPairing: string;
  recipe?: { instructions: string; ingredients: Recipe };
};

function extractJsonBlock(text: string): string {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Claude returned an unexpected response.");
  }

  return text.slice(firstBrace, lastBrace + 1);
}

function validateResult(data: unknown): PairingResult {
  if (!data || typeof data !== "object") {
    throw new Error("Claude response was not valid JSON.");
  }

  const candidate = data as Partial<PairingResult>;

  const keys: (keyof PairingResult)[] = [
    "drinkRecommendation",
    "poeticPairing",
  ];

  for (const key of keys) {
    if (!candidate[key] || typeof candidate[key] !== "string") {
      throw new Error(`Missing or invalid field: ${key}`);
    }
  }

  return candidate as PairingResult;
}

async function fetchRecipeFromCocktailDB(
  drinkName: string
): Promise<{ instructions: string; ingredients: Recipe } | null> {
  try {
    const searchUrl = `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(drinkName)}`;
    const response = await fetch(searchUrl);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      drinks?: Array<Record<string, unknown>>;
    };
    const drink = data.drinks?.[0];

    if (!drink) {
      return null;
    }

    const instructions = drink.strInstructions as string | undefined;
    if (!instructions) {
      return null;
    }

    const ingredients: Recipe = [];
    for (let i = 1; i <= 15; i++) {
      const ingredient = drink[`strIngredient${i}`] as string | undefined;
      const measure = drink[`strMeasure${i}`] as string | undefined;

      if (ingredient) {
        ingredients.push({ ingredient, measure: measure || "" });
      }
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
    const recipePrompt = `Provide a recipe for a ${drinkName} cocktail. Return ONLY valid JSON with this exact shape: {"instructions":"...","ingredients":[{"ingredient":"...","measure":"..."}]}`;

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        messages: [{ role: "user", content: recipePrompt }],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const claudePayload = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const responseText =
      claudePayload.content
        ?.filter((item) => item.type === "text" && typeof item.text === "string")
        .map((item) => item.text)
        .join("\n") ?? "";

    const jsonText = extractJsonBlock(responseText);
    const recipe = JSON.parse(jsonText) as {
      instructions?: string;
      ingredients?: Recipe;
    };
    if (recipe.instructions && recipe.ingredients) {
      return { instructions: recipe.instructions, ingredients: recipe.ingredients };
    }

    return null;
  } catch {
    return null;
  }
}

// --- DEV CACHE FOR CLAUDE RESPONSE ---
const DEV_CLAUDE_CACHE = {
  enabled: process.env.NODE_ENV === "development",
  result: {
    drinkRecommendation: "Aged Scotch Whisky (single malt, neat)",
    poeticPairing:
      "Like the dog-eared pages of a forgotten manuscript, a glass of peated single malt lingers with smoky wisdom and amber warmth. Sip slowly — some truths, like Bukowski knew, are only found in the dying light.",
    // aesthetic:
    //   "Dark academia moodboard with rich sepia and mahogany tones, featuring ancient libraries, handwritten manuscripts, classical busts, aged globes, and literary quotes — evoking intellectual melancholy and timeless scholarly romance",
  },
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not set." },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "Please upload an image file." },
        { status: 400 },
      );
    }

    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are supported." },
        { status: 400 },
      );
    }

    if (image.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Image is too large. Max size is 10MB." },
        { status: 400 },
      );
    }

    const bytes = await image.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString("base64");

    const prompt = [
      "Analyze this uploaded image for visual style.",
      "Focus on: aesthetic, palette, lighting, and mood.",
      "Then recommend only one alcholic drink pairing.",
      "Return ONLY valid JSON with this exact shape:",
      '{"drinkRecommendation":"...","poeticPairing":"..."}',
      "The poeticPairing should be lyrical but concise (1-2 sentences)."
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
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: image.type,
                  data: base64Image,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Claude API error: ${errorText}` },
        { status: 502 },
      );
    }

    const claudePayload = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };

    const responseText =
      claudePayload.content
        ?.filter((item) => item.type === "text" && typeof item.text === "string")
        .map((item) => item.text)
        .join("\n") ?? "";

    const jsonText = extractJsonBlock(responseText);
    const parsed = JSON.parse(jsonText) as unknown;
    const result = validateResult(parsed);

    // DEV: Use cached Claude response if enabled
    if (DEV_CLAUDE_CACHE.enabled) {
      const result = { ...DEV_CLAUDE_CACHE.result };
      // Fetch recipe as normal
      const recipe =
        (await fetchRecipeFromCocktailDB(result.drinkRecommendation)) ||
        (await getRecipeFromClaude(result.drinkRecommendation, apiKey, model));
      if (recipe) {
        result.recipe = recipe;
      }
      return NextResponse.json({ result });
    }

    // Fetch recipe from CocktailDB, fallback to Claude
    const recipe =
      (await fetchRecipeFromCocktailDB(result.drinkRecommendation)) ||
      (await getRecipeFromClaude(result.drinkRecommendation, apiKey, model));

    if (recipe) {
      result.recipe = recipe;
    }

    return NextResponse.json({ result });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error while processing the image.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
