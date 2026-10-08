# Creative Variant Studio

A small tool for creative production teams. You paste a product feed, pick languages and brand rules, and the app writes ad copy for every product × language × format. Each variant is checked by plain code and has to be approved by a person before it can be used.

**Live demo:** https://creative-variant-studio-173727362113.europe-north1.run.app

## How it works

```
Browser (React)  →  POST /api/jobs  →  Claude writes copy (one call per product + language)
                                    →  validate.ts checks every variant
                                    →  job saved to Firestore
Designer edits / approves  →  PATCH / POST /api/jobs/:id/variants/:variantId  →  checks run again
```

1. **Generate.** `src/lib/generate.ts` asks Claude for a headline and a CTA for all three formats in one request. The response is forced into a JSON schema (Zod + structured outputs), so the app never has to parse free text.
2. **Check.** `src/lib/validate.ts` is ordinary TypeScript, not AI. It checks that the copy fits each format's character limit, avoids banned words, contains no prices or numbers that aren't in the product data, and isn't empty. A variant that fails is flagged.
3. **Review.** A person approves variants. Flagged variants can't be approved until someone edits the copy and the checks pass.
4. **Adjust.** A shared brand style (colours, font, text size, corners, button shape) applies to every banner. A designer can also change one variant's size and shape. Changing the size re-runs the checks with the new format's limits.
5. **Export.** Approved variants download as a CSV with the final copy, size and style, ready for a design tool or an ad platform.

The model does the creative part. Deterministic code decides what is allowed to ship.

## Formats

| Format | Size | Headline max | CTA max |
|---|---|---|---|
| Square | 1080×1080 | 40 | 18 |
| Leaderboard | 728×90 | 28 | 12 |
| Story | 1080×1920 | 55 | 22 |
| Medium rectangle* | 300×250 | 30 | 14 |
| Skyscraper* | 160×600 | 35 | 12 |
| Billboard* | 970×250 | 50 | 20 |

\* Available when editing a variant. Claude writes copy for the first three.

## Stack

- Next.js 16 (App Router) with React 19 and TypeScript
- Anthropic SDK, model `claude-opus-5`, structured JSON output
- Google Cloud Run for hosting, Firestore for jobs, Secret Manager for the API key
- Vitest for the validation rules, GitHub Actions for lint, typecheck, test and build

## Run locally

```bash
npm install
echo "ANTHROPIC_API_KEY=..." > .env.local   # optional; without it the app uses demo copy
npm run dev
npm test
```

Locally, jobs are kept in memory. On Cloud Run they are stored in Firestore.

## Deploy to Google Cloud Run

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com firestore.googleapis.com secretmanager.googleapis.com
gcloud firestore databases create --location=europe-north1
printf "%s" "$ANTHROPIC_API_KEY" | gcloud secrets create anthropic-key --data-file=-
gcloud run deploy creative-variant-studio --source . --region europe-north1 \
  --allow-unauthenticated --set-secrets ANTHROPIC_API_KEY=anthropic-key:latest
```

## What I would add next

- Render the banners to real images (PNG/HTML5) so they can be dropped into an ad server
- Read products from a Google Sheet or a feed URL instead of pasted text
- Sign-in, so approvals are tied to a named reviewer
- Pub/Sub queue for large feeds, so a job with hundreds of products doesn't run inside one request
