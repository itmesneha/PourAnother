# Pour Another

> *Drop a photo. Get a drink. It's that kind of app.*

**Pour Another** is an AI-powered drink recommendation web app that matches the perfect cocktail to a mood, aesthetic, or set of ingredients. Upload a photo — a dreamy sunset, a cozy corner of your living room, a screenshot from a film — and the app reads the room, then tells you exactly what to pour.

Built with Next.js, Tailwind CSS, and the Anthropic Claude API. Designed with a warm, hand-crafted aesthetic that feels intentional rather than generated.

---

## What It Does

There are two ways to use Pour Another:

### The Mood
Upload any image — a photo, a mood board, a vibe — and Claude Vision analyzes the aesthetic, color palette, lighting, and emotional tone. It returns a single, thoughtful drink recommendation alongside a poetic explanation of why that pairing fits. Not just *what* to make, but *why* it belongs in that moment.

### The Bar
List what you have — a few bottles, a handful of ingredients — and the app figures out the best cocktail you can make right now. No substitutions, no "you could also try." Just the one drink that makes the most of what's already on your shelf.

In both cases, you get:
- A drink name and brief recommendation
- A full recipe with ingredients and instructions
- A shareable link you can send to someone

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 |
| AI | Anthropic Claude API (Vision + Text) |
| Recipe Data | CocktailDB API |
| Database & Storage | Supabase (PostgreSQL + Object Storage) |
| Animations | Rough Notation |

---

## Features

- **Claude Vision analysis** — Claude reads images for mood, palette, lighting, and aesthetic to find a drink that fits the moment
- **Ingredient-based recommendations** — describe what's in your bar and get a cocktail you can actually make
- **Recipe lookup with AI fallback** — tries CocktailDB first; if the drink isn't in the database, Claude writes the recipe
- **Typewriter reveal** — the poetic pairing description types itself out character by character
- **Hand-drawn UI elements** — animated rough notation boxes and underlines give the interface a tactile, handcrafted feel
- **Shareable pairings** — generate a link to share your drink recommendation with someone, complete with a personal note, from/to names, and the original mood image
- **Dynamic social previews** — share links generate Open Graph metadata so they look good when posted anywhere
- **Responsive layout** — fully adapted for mobile with a vertical scroll layout and touch-friendly interactions
- **Sound design** — subtle audio feedback on key interactions: mode switches, file selection, recipe toggling, and sharing

---

## Project Structure

```
/app
  /api
    /bar/route.ts           — Ingredient-based drink recommendation
    /recommend/route.ts     — Image-based drink recommendation
    /share/route.ts         — Save and retrieve share data from Supabase
  /components
    /HandDrawnBox.tsx        — Rough notation animated box wrapper
    /ShareModal.tsx          — Modal for entering share details
  /share
    /[id]/
      page.tsx              — Dynamic share display page
      RoughLink.tsx         — Link with hover underline animation
  page.tsx                  — Main home page
  layout.tsx                — Root layout, font loading, metadata
  globals.css               — Color scheme, typography, CSS variables
/lib
  supabase.ts               — Supabase client initialization
/public
  /fonts                    — Custom locally-hosted font files
  /images                   — Cocktail and glass illustrations
  /sounds                   — UI sound effects (page-change, open, switch-on)
```

---

## How the AI Works

**Image Mode:**
1. The user uploads a photo (up to 10MB)
2. It's base64-encoded and sent to the `/api/recommend` route
3. Claude Vision analyzes the image for aesthetic qualities and mood
4. Claude returns a structured JSON response: drink name, poetic pairing explanation, and recipe
5. The app tries to fetch the recipe from CocktailDB; if not found, Claude's version is used

**Bar Mode:**
1. The user types a list of ingredients
2. The text is sent to `/api/bar`
3. Claude identifies the best cocktail that can be made from those ingredients
4. Same structured response: name, poetic explanation, recipe

---

## Design Details

The visual language is warm, deliberate, and a little handmade:

- **Color palette:** Warm off-white background (`#faf7f0`), dark charcoal text (`#4a4947`), terracotta accent (`#b17457`)
- **Typography:** Five custom fonts — DirtyCursive, AnticaSignature, MalvinasSignature, TychRc2U, and Antically — giving the interface a vintage, personal feel
- **Rough notation:** Animated hand-drawn boxes and underlines that appear on hover or load, built with the Rough Notation library
- **Typewriter effect:** Poetic pairings reveal character by character at 35ms per character
- **Lightbox:** Click the uploaded mood image to expand it full-size
- **Sound effects:** Three audio cues tied to distinct interaction types — `page-change.mp3` for navigation and modal actions, `open.mp3` for submitting input, `switch-on.mp3` for toggling recipe and share views

---

## Setup

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)
- A [Supabase](https://supabase.com/) project (for the share feature)

### Install

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env.local
```

Set the following in `.env.local`:

```env
ANTHROPIC_API_KEY=your_key_here

# Required for share functionality
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: override the default model
ANTHROPIC_MODEL=claude-sonnet-4-6
```

### Supabase setup

The share feature requires a `shares` table and a `mood-images` storage bucket in your Supabase project.

**Table schema (`shares`):**

| Column | Type |
|---|---|
| id | uuid (primary key) |
| image_url | text |
| drink_recommendation | text |
| poetic_pairing | text |
| recipe | jsonb |
| from_name | text |
| to_name | text |
| message | text |
| created_at | timestamp |

**Storage:** create a public bucket named `mood-images`.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/recommend` | POST | Image-based drink recommendation. Body: `{ image: base64string, mimeType: string }` |
| `/api/bar` | POST | Ingredient-based recommendation. Body: `{ ingredients: string }` |
| `/api/share` | POST | Save a pairing to Supabase and return a share ID |
| `/api/share` | GET | Retrieve a saved pairing by `?id=uuid` |

---

## Deployment

The app is deployed on [Vercel](https://vercel.com/). Set the environment variables above in your Vercel project settings and deploy from the `main` branch.

---

## Notes

- Max upload size: 10MB per image
- The CocktailDB API is used as a free recipe source; if the recommended drink isn't found there, Claude generates the recipe directly
- The `DEV_CACHE` flag in `/api/recommend` can be enabled during development to skip API calls and return a cached response
