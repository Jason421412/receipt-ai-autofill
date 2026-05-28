# Receipt AI Autofill

AI-assisted receipt extraction app that converts receipt images into editable structured form data with human review.

## Problem

Receipts are common, messy, and time-consuming to enter manually. A useful automation tool should extract the obvious fields quickly while still letting a person review the result before anything is saved.

## Solution

Receipt AI Autofill uses a server-side Gemini Vision route to extract key receipt fields from an uploaded image, fills an editable form, shows the raw structured output for transparency, and stores the reviewed result locally in the browser.

This is an AI product engineering prototype, not a production accounting system.

## Key Features

- Upload JPEG, PNG, WebP, HEIC, or HEIF receipt images.
- Validate image type and 10 MB size limit on the client and server.
- Preview the selected receipt locally.
- Send the image to a server-only `/api/extract` route.
- Keep `GEMINI_API_KEY` out of client-side code.
- Prompt Gemini Vision for strict JSON fields.
- Parse and normalize `merchantName`, `date`, `totalAmount`, and `currency`.
- Show a raw JSON preview for review/debugging.
- Let the user edit extracted values before saving.
- Persist the reviewed result in `localStorage`.
- Handle missing API keys, malformed requests, unsupported files, oversized files, failed model calls, and unparseable model output.

## Tech Stack

- **Framework:** Next.js App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI provider:** Gemini Vision via REST API
- **Server boundary:** Next.js route handler at `app/api/extract/route.ts`
- **Client persistence:** Browser `localStorage`

## AI Extraction Flow

```text
User selects receipt image
  -> Client validates type/size and previews image
  -> Client POSTs FormData to /api/extract
  -> Server validates multipart file
  -> Server reads GEMINI_API_KEY from env
  -> Server sends inline image + JSON prompt to Gemini
  -> Server parses/normalizes JSON
  -> Client fills editable review form
  -> User edits and saves reviewed result locally
```

See [docs/ai-extraction-flow.md](docs/ai-extraction-flow.md) for more detail.

## Architecture Overview

- `app/page.tsx` is the client workflow: upload, preview, extraction trigger, editable form, raw JSON preview, local save, and reset.
- `app/api/extract/route.ts` is the server-only AI boundary: environment lookup, file validation, Gemini request, response parsing, and error handling.
- `app/globals.css` and Tailwind provide the UI styling.
- `.env.example` documents the required server-only environment variable.

See [docs/architecture.md](docs/architecture.md) for implementation notes and boundaries.

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in your Gemini API key:

```txt
GEMINI_API_KEY=
```

Do not prefix the key with `NEXT_PUBLIC_`.

## How to Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

On Windows PowerShell:

```powershell
npm.cmd install
npm.cmd run dev
```

## Testing / Quality Checks

```bash
npm run typecheck
npm run build
```

There is no dedicated automated test suite yet.

## Security Notes

- Gemini credentials stay server-side in `app/api/extract/route.ts`.
- Uploaded images are not permanently stored by this app.
- The server rejects unsupported file types and files over 10 MB.
- The client stores only the reviewed extracted fields in `localStorage`.
- The app is not designed for sensitive financial record storage without additional backend security, retention controls, and access control.

## Known Limitations

- Extraction quality depends on receipt image quality, angle, lighting, and text visibility.
- Only four fields are extracted.
- There are no confidence scores or field-level uncertainty indicators.
- The app has no authentication, database, or cross-device sync.
- `localStorage` persistence is browser-local and can be cleared by the user or browser.
- The app does not claim OCR accuracy metrics.

## Roadmap

- Add automated tests for validation, response parsing, and form state.
- Add confidence or review-needed indicators.
- Extract line items, taxes, tips, receipt numbers, payment method, and merchant address.
- Add CSV/JSON export.
- Add drag-and-drop and mobile camera capture.
- Add optional authenticated database persistence.
- Add a screenshot set and short demo clip.

## What I Learned

- How to keep an AI API key behind a server boundary in a Next.js app.
- Why model output needs defensive parsing even when JSON is requested.
- How human-in-the-loop review makes AI extraction safer and more useful.
- How to build a compact AI product workflow without overbuilding the backend.

## Screenshot

![Upload and review screen](docs/screenshots/upload-state.png)
