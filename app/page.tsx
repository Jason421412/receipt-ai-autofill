"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileJson,
  Loader2,
  RotateCcw,
  Save,
  ScanLine,
  Upload,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

type ReceiptFields = {
  merchantName: string;
  date: string;
  totalAmount: string;
  currency: string;
};

type SubmittedReceipt = ReceiptFields & {
  submittedAt: string;
};

const EMPTY_RECEIPT: ReceiptFields = {
  merchantName: "",
  date: "",
  totalAmount: "",
  currency: "",
};

const STORAGE_KEY = "receipt-ai-autofill:last-submission";
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [formValues, setFormValues] = useState<ReceiptFields>(EMPTY_RECEIPT);
  const [rawJson, setRawJson] = useState<ReceiptFields | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<SubmittedReceipt | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        setSubmittedReceipt(JSON.parse(saved) as SubmittedReceipt);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function updateField(field: keyof ReceiptFields, value: string) {
    setSuccessMessage("");
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError("");
    setSuccessMessage("");
    setRawJson(null);

    if (!file) {
      return;
    }

    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setSelectedFile(null);
      setError("Please upload a JPEG, PNG, WebP, HEIC, or HEIF receipt image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setSelectedFile(null);
      setError("Please upload an image under 10 MB.");
      event.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function extractReceipt() {
    if (!selectedFile) {
      setError("Choose a receipt image before extracting.");
      return;
    }

    setIsExtracting(true);
    setError("");
    setSuccessMessage("");
    setRawJson(null);

    const payload = new FormData();
    payload.append("image", selectedFile);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        body: payload,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Receipt extraction failed.");
      }

      const extracted: ReceiptFields = {
        merchantName: typeof result.merchantName === "string" ? result.merchantName : "",
        date: typeof result.date === "string" ? result.date : "",
        totalAmount: typeof result.totalAmount === "string" ? result.totalAmount : "",
        currency: typeof result.currency === "string" ? result.currency : "",
      };

      setFormValues(extracted);
      setRawJson(extracted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsExtracting(false);
    }
  }

  function submitReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const submitted: SubmittedReceipt = {
      ...formValues,
      submittedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(submitted));
    setSubmittedReceipt(submitted);
    setSuccessMessage("Receipt saved locally.");
  }

  function resetAll() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");
    setFormValues(EMPTY_RECEIPT);
    setRawJson(null);
    setSubmittedReceipt(null);
    setError("");
    setSuccessMessage("");
    window.localStorage.removeItem(STORAGE_KEY);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
              AI Intern Assessment
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              Receipt AI Autofill
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Upload a receipt, extract the key fields with Gemini Vision, review the JSON, edit the form, and save the final result locally.
            </p>
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </button>
        </header>

        {error ? (
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
            <p>{error}</p>
          </div>
        ) : null}

        {successMessage ? (
          <div
            className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
            <p>{successMessage}</p>
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Receipt Image</h2>
                <p className="mt-1 text-sm text-slate-500">JPEG, PNG, WebP, HEIC, or HEIF under 10 MB.</p>
              </div>
              <span className="rounded-md bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                Local preview
              </span>
            </div>

            <label
              htmlFor="receipt-image"
              className="mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-teal-400 hover:bg-teal-50"
            >
              <Upload className="h-8 w-8 text-teal-700" aria-hidden="true" />
              <span className="mt-3 text-sm font-semibold text-slate-800">
                Choose receipt image
              </span>
              <span className="mt-1 max-w-sm text-sm text-slate-500">
                The image is sent only to the server API route for extraction.
              </span>
              <input
                ref={fileInputRef}
                id="receipt-image"
                name="receipt-image"
                type="file"
                accept={SUPPORTED_IMAGE_TYPES.join(",")}
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>

            {selectedFile ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                <span className="max-w-full truncate font-medium text-slate-800">
                  {selectedFile.name}
                </span>
                <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            ) : null}

            <div className="mt-5 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Uploaded receipt preview"
                  className="max-h-[520px] w-full object-contain"
                />
              ) : (
                <div className="flex h-72 items-center justify-center px-6 text-center text-sm text-slate-500">
                  Image preview will appear here.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={extractReceipt}
              disabled={!selectedFile || isExtracting}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isExtracting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ScanLine className="h-4 w-4" aria-hidden="true" />
              )}
              {isExtracting ? "Extracting..." : "Extract Fields"}
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <form
              onSubmit={submitReceipt}
              className="rounded-md border border-slate-200 bg-white p-5 shadow-soft"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Editable Receipt Form</h2>
                  <p className="mt-1 text-sm text-slate-500">Review and adjust every field before submitting.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block" htmlFor="merchantName">
                  <span className="text-sm font-semibold text-slate-700">Merchant name</span>
                  <input
                    id="merchantName"
                    name="merchantName"
                    value={formValues.merchantName}
                    onChange={(event) => updateField("merchantName", event.target.value)}
                    className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    placeholder="e.g. ACME Market"
                  />
                </label>

                <label className="block" htmlFor="date">
                  <span className="text-sm font-semibold text-slate-700">Date</span>
                  <input
                    id="date"
                    name="date"
                    value={formValues.date}
                    onChange={(event) => updateField("date", event.target.value)}
                    className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    placeholder="e.g. 2026-05-12"
                  />
                </label>

                <label className="block" htmlFor="totalAmount">
                  <span className="text-sm font-semibold text-slate-700">Total amount</span>
                  <input
                    id="totalAmount"
                    name="totalAmount"
                    value={formValues.totalAmount}
                    onChange={(event) => updateField("totalAmount", event.target.value)}
                    className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    placeholder="e.g. 42.75"
                  />
                </label>

                <label className="block" htmlFor="currency">
                  <span className="text-sm font-semibold text-slate-700">Currency</span>
                  <input
                    id="currency"
                    name="currency"
                    value={formValues.currency}
                    onChange={(event) => updateField("currency", event.target.value)}
                    className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    placeholder="e.g. USD"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Submit and Save Locally
              </button>
            </form>

            <section className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-teal-700" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-slate-950">Raw JSON Preview</h2>
              </div>
              <pre className="mt-4 min-h-36 overflow-auto rounded-md bg-slate-950 p-4 text-sm leading-6 text-slate-100">
                {JSON.stringify(rawJson ?? EMPTY_RECEIPT, null, 2)}
              </pre>
            </section>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-950">Submitted Result</h2>
          {submittedReceipt ? (
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Merchant</dt>
                <dd className="mt-2 break-words text-sm font-semibold text-slate-900">
                  {submittedReceipt.merchantName || "Not provided"}
                </dd>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Date</dt>
                <dd className="mt-2 break-words text-sm font-semibold text-slate-900">
                  {submittedReceipt.date || "Not provided"}
                </dd>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Amount</dt>
                <dd className="mt-2 break-words text-sm font-semibold text-slate-900">
                  {submittedReceipt.totalAmount || "Not provided"}
                </dd>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Currency</dt>
                <dd className="mt-2 break-words text-sm font-semibold text-slate-900">
                  {submittedReceipt.currency || "Not provided"}
                </dd>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Saved</dt>
                <dd className="mt-2 break-words text-sm font-semibold text-slate-900">
                  {new Date(submittedReceipt.submittedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Submit the editable form to save and display the result here.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
