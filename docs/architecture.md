# Architecture

Receipt AI Autofill is a small Next.js App Router project with one client workflow and one server-side AI extraction route.

## Frontend

`app/page.tsx` is a client component that owns the full browser workflow:

- file selection
- client-side file type and size checks
- object URL preview
- extraction request state
- editable receipt form
- raw JSON preview
- reviewed result persistence in `localStorage`
- reset behavior

The app keeps the UI intentionally small so the AI boundary and review flow are easy to inspect.

## Server Route

`app/api/extract/route.ts` handles `POST` requests with multipart form data.

Responsibilities:

- require `GEMINI_API_KEY` from server environment
- validate the uploaded `image` field
- enforce supported MIME types
- enforce the 10 MB size limit
- convert the image to base64
- call Gemini Vision through the REST API
- request JSON output with a response schema
- parse and normalize the model response
- return structured JSON or explicit error responses

The API key is never exposed through `NEXT_PUBLIC_*` variables and is not referenced by the client component.

## Data Flow

```text
Browser file input
  -> client validation and preview
  -> FormData POST /api/extract
  -> server validation
  -> Gemini Vision request
  -> normalized receipt JSON
  -> editable form
  -> localStorage reviewed result
```

## Error Boundaries

The current implementation handles:

- missing server API key
- non-multipart requests
- missing file field
- unsupported image type
- oversized image
- Gemini API failure
- empty model response
- unparseable model JSON

## Limitations

- The app stores no server-side records.
- There is no authentication or multi-user account model.
- The extraction schema is intentionally limited to four fields.
- There are no automated unit tests yet.
- The app does not measure OCR or extraction accuracy.
