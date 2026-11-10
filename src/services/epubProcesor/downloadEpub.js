import { sanitizeFilename } from "../../utils/security.js";

export async function downloadEpub(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `HTTP error: ${response.status} ${response.statusText || ""}`.trim(),
    );
  }

  const blob = await response.blob();
  const rawName = url.split("/").pop()?.split("?")[0] || "book.epub";
  const filename = sanitizeFilename(rawName);
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = filename.endsWith(".epub") ? filename : `${filename}.epub`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
