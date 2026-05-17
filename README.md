# Receipt AI Autofill

An AI-assisted receipt extraction web app that uploads a receipt image, extracts key fields with Gemini Vision, and auto-fills an editable review form.

Live demo: [receipt-ai-autofill-eta.vercel.app](https://receipt-ai-autofill-eta.vercel.app)

## Why I Built This

Manual receipt entry is slow and error-prone, but fully automated extraction can also fail when receipts are blurry, cropped, or formatted differently. This project explores a practical middle ground: use an AI vision model for first-pass extraction, then keep a human in the loop to review and correct the final values before saving.

The project was built as a focused AI internship assessment and kept intentionally small so the system boundaries are easy to inspect.

## Features

- Upload receipt images in JPEG, PNG, WebP, HEIC, or HEIF format.
- Validate file type and enforce a 10 MB image-size limit before model calls.
- Preview the selected receipt in the browser.
- Extract `merchantName`, `date`, `totalAmount`, and `currency` with Gemini Vision.
- Keep the Gemini API key server-side inside a Next.js route handler.
- Display raw JSON output for transparency.
- Auto-fill an editable review form.
- Save the reviewed result to browser `localStorage`.
- Reset the workflow and submit a corrected result.

## Tech Stack

- **Framework:** Next.js App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **AI:** Gemini 2.5 Flash via the Gemini Vision API
- **API layer:** Next.js route handler at `/api/extract`
- **Persistence:** Browser `localStorage`

## Architecture / System Design

```text
Browser UI
  -> app/page.tsx
  -> multipart upload to /api/extract
  -> app/api/extract/route.ts
  -> Gemini Vision API
  -> normalized JSON response
  -> editable review form
  -> localStorage
```

- **Frontend:** `app/page.tsx` manages upload state, image preview, loading/error states, raw JSON display, editable fields, and submitted results.
- **Backend/API:** `app/api/extract/route.ts` validates the uploaded file, reads `GEMINI_API_KEY` from server environment variables, builds the Gemini request, and returns normalized JSON.
- **AI integration:** The route uses a strict JSON prompt and Gemini response schema, then strips possible code fences and parses only the expected receipt fields.
- **Storage:** Reviewed submissions are saved locally in the browser for the assessment version. No uploaded image is permanently stored by this app.
- **Deployment:** The app is deployed on Vercel and requires `GEMINI_API_KEY` to be configured as a server-side environment variable.

## My Contributions

- Built the upload, preview, extraction, edit, submit, and reset workflow.
- Implemented the server-side Gemini extraction endpoint.
- Added MIME-type and file-size validation before AI requests.
- Designed the structured JSON prompt and response normalization.
- Kept the API key out of client-side code.
- Added clear UI states for empty input, loading, extraction errors, raw model output, and reviewed submission.
- Documented local setup, deployment requirements, limitations, and future improvements.

## What I Learned

- How to place AI model calls behind a server boundary instead of exposing credentials in the browser.
- How to design prompts for structured JSON output and still parse model responses defensively.
- Why human review is important in AI-assisted workflows where extraction accuracy depends on image quality.
- How to keep a small AI feature production-minded through validation, explicit error states, and typed data flow.

## Screenshots / Demo

![Upload and review screen](docs/screenshots/upload-state.png)

Existing screenshot:

- `docs/screenshots/upload-state.png` - initial upload and review interface.

Evidence to add later:

- `docs/screenshots/extracted-fields.png` - receipt preview with extracted JSON and filled form.
- `docs/screenshots/submitted-result.png` - reviewed receipt after submission.
- Short demo video showing upload, extraction, manual correction, and save.

## Setup

1. Clone the repository.

   ```bash
   git clone https://github.com/Jason421412/receipt-ai-autofill.git
   cd receipt-ai-autofill
   ```

2. Install dependencies.

   ```bash
   npm install
   ```

3. Create a local environment file from the safe example.

   ```bash
   cp .env.example .env.local
   ```

4. Add your own Gemini API key to `.env.local`.

   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   Do not prefix this key with `NEXT_PUBLIC_`; it must stay server-only.

5. Run the development server.

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

On Windows PowerShell, if `npm` is blocked by execution policy, use:

```powershell
npm.cmd install
npm.cmd run dev
```

## Future Improvements

- Add automated tests for file validation, API errors, and form submission.
- Add extraction support for line items, taxes, tips, receipt number, and payment method.
- Store reviewed receipts in a database with user authentication.
- Add CSV/JSON export for accounting or expense-tracking workflows.
- Add confidence indicators or field-level review warnings.
- Add drag-and-drop upload and mobile camera capture.
- Add an evaluation set to compare extraction quality across receipt types.
