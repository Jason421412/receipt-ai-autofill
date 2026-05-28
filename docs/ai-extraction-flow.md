# AI Extraction Flow

The app treats AI as a first-pass extractor, not as the final source of truth.

## 1. User Upload

The browser accepts:

- JPEG
- PNG
- WebP
- HEIC
- HEIF

The client rejects unsupported files and files larger than 10 MB before sending them to the server.

## 2. Server Validation

The server route validates the request again. This second check matters because client validation can be bypassed.

The route rejects:

- missing `GEMINI_API_KEY`
- invalid multipart form data
- missing `image` field
- unsupported MIME types
- images over 10 MB

## 3. Model Prompting

The route sends Gemini Vision:

- a strict receipt extraction prompt
- the image encoded as inline base64 data
- a JSON response schema
- temperature `0`

The requested fields are:

- `merchantName`
- `date`
- `totalAmount`
- `currency`

## 4. Response Parsing

The server:

- joins candidate text parts
- strips possible Markdown code fences
- extracts the JSON object boundaries
- parses JSON
- normalizes missing or non-string values

If parsing fails, the route returns an explicit error instead of silently trusting bad output.

## 5. Human Review

The extracted values fill an editable form. The user can correct every field before saving.

This is the important product decision: the AI accelerates entry, but a human reviews the final structured data.

## 6. Local Persistence

The reviewed result is stored in browser `localStorage` under a single key. This keeps the prototype simple and avoids server-side storage of receipt data.

## Future Hardening

- Add automated parser tests with sample model outputs.
- Add field confidence or review-required indicators.
- Add retry behavior for transient provider failures.
- Add optional authenticated persistence with retention controls.
- Add explicit privacy copy before processing sensitive receipts.
