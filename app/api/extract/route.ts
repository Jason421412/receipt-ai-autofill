import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReceiptFields = {
  merchantName: string;
  date: string;
  totalAmount: string;
  currency: string;
};

const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const EMPTY_RECEIPT: ReceiptFields = {
  merchantName: "",
  date: "",
  totalAmount: "",
  currency: "",
};

const RECEIPT_EXTRACTION_PROMPT = `You are a receipt extraction engine.

Extract the following fields from the receipt image:
- merchantName
- date
- totalAmount
- currency

Return valid JSON only with exactly these keys:
{
  "merchantName": "",
  "date": "",
  "totalAmount": "",
  "currency": ""
}

Rules:
- Do not include markdown, comments, explanations, or extra keys.
- If a field is unclear or not visible, return an empty string for that field.
- Use the receipt transaction date when available.
- Return totalAmount as the final amount paid, including tax, tips, and discounts when shown.
- Return currency as the ISO 4217 code when clear, otherwise the visible currency symbol, otherwise an empty string.`;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function stripMarkdownCodeFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseReceiptJson(modelText: string): ReceiptFields {
  const stripped = stripMarkdownCodeFence(modelText);
  const firstBrace = stripped.indexOf("{");
  const lastBrace = stripped.lastIndexOf("}");
  const jsonText =
    firstBrace >= 0 && lastBrace >= firstBrace
      ? stripped.slice(firstBrace, lastBrace + 1)
      : stripped;
  const parsed = JSON.parse(jsonText) as Partial<Record<keyof ReceiptFields, unknown>>;

  return {
    merchantName:
      typeof parsed.merchantName === "string" ? parsed.merchantName.trim() : "",
    date: typeof parsed.date === "string" ? parsed.date.trim() : "",
    totalAmount:
      typeof parsed.totalAmount === "string"
        ? parsed.totalAmount.trim()
        : parsed.totalAmount == null
          ? ""
          : String(parsed.totalAmount),
    currency: typeof parsed.currency === "string" ? parsed.currency.trim() : "",
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return jsonError("GEMINI_API_KEY is not configured on the server.", 500);
  }

  let image: FormDataEntryValue | null = null;

  try {
    const formData = await request.formData();
    image = formData.get("image");
  } catch {
    return jsonError("Request must be multipart form data.", 400);
  }

  if (!(image instanceof File)) {
    return jsonError("Upload a receipt image using the 'image' field.", 400);
  }

  if (!SUPPORTED_IMAGE_TYPES.has(image.type)) {
    return jsonError("Unsupported image type. Use JPEG, PNG, WebP, HEIC, or HEIF.", 400);
  }

  if (image.size > MAX_IMAGE_BYTES) {
    return jsonError("Image is too large. Upload an image under 10 MB.", 400);
  }

  const imageBuffer = Buffer.from(await image.arrayBuffer());
  const imageBase64 = imageBuffer.toString("base64");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: RECEIPT_EXTRACTION_PROMPT },
              {
                inline_data: {
                  mime_type: image.type,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: "object",
            properties: {
              merchantName: { type: "string" },
              date: { type: "string" },
              totalAmount: { type: "string" },
              currency: { type: "string" },
            },
            required: ["merchantName", "date", "totalAmount", "currency"],
            additionalProperties: false,
          },
          temperature: 0,
          maxOutputTokens: 512,
        },
      }),
    },
  );

  const geminiResult = (await response.json().catch(() => ({}))) as GeminiResponse;

  if (!response.ok) {
    return jsonError(
      geminiResult.error?.message ?? "Gemini extraction request failed.",
      response.status,
    );
  }

  const modelText =
    geminiResult.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

  if (!modelText) {
    return NextResponse.json(EMPTY_RECEIPT);
  }

  try {
    return NextResponse.json(parseReceiptJson(modelText));
  } catch {
    return jsonError("Gemini returned JSON that could not be parsed.", 502);
  }
}
