export class TranscriptIngestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranscriptIngestValidationError";
  }
}

const SUPPORTED_TRANSCRIPT_EXTENSIONS = new Set(["txt", "md"]);
const MAX_TRANSCRIPT_FILE_BYTES = 1024 * 1024 * 2;

function extensionFromFilename(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

export function validateTranscriptUploadFile(file: File | null): File {
  if (!file) {
    throw new TranscriptIngestValidationError("`file` is required.");
  }

  if (!file.name.trim()) {
    throw new TranscriptIngestValidationError("Uploaded file must have a filename.");
  }

  const extension = extensionFromFilename(file.name);

  if (!SUPPORTED_TRANSCRIPT_EXTENSIONS.has(extension)) {
    throw new TranscriptIngestValidationError("Only `.txt` and `.md` transcript files are supported.");
  }

  if (file.size <= 0) {
    throw new TranscriptIngestValidationError("Uploaded file is empty.");
  }

  if (file.size > MAX_TRANSCRIPT_FILE_BYTES) {
    throw new TranscriptIngestValidationError("Uploaded file exceeds the 2 MB demo limit.");
  }

  return file;
}

export function buildTranscriptDemoMetadata(file: File) {
  const droppedAt = new Date().toISOString();

  return {
    batchId: `demo-${Date.now()}`,
    sourceFilename: file.name,
    sourceRelativePath: file.name,
    droppedAt,
    contentType: file.type || inferContentType(file.name),
  };
}

export async function computeTranscriptFingerprint(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const text = new TextDecoder().decode(arrayBuffer);
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const payload = `${file.name}\0${normalized}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));

  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function inferContentType(filename: string): string {
  return extensionFromFilename(filename) === "md" ? "text/markdown" : "text/plain";
}
