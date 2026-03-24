# Pour Another

Upload a photo or mood board image. The app sends it to Claude Vision, which analyzes:

- aesthetic
- palette
- lighting
- mood

It then returns a single drink recommendation with a poetic explanation of why the pairing fits.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add your API key:

```bash
cp .env.example .env.local
```

Then set `ANTHROPIC_API_KEY` in `.env.local`.

Optional: set `ANTHROPIC_MODEL` to a model available to your Anthropic workspace.
Default is `claude-sonnet-4-6`.

## Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Notes

- API route: `app/api/recommend/route.ts`
- UI page: `app/page.tsx`
- Max upload size is 10MB per image.
