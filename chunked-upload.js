/**
 * Splits a file size into HTTP Content-Range aligned chunks.
 * Pure function, no I/O, kept separate so it can be unit tested without a
 * server or a real File object.
 */
function computeChunkRanges(fileSize, chunkSize) {
  if (chunkSize <= 0) {
    throw new RangeError("chunkSize must be greater than zero");
  }

  const ranges = [];
  for (let start = 0; start < fileSize; start += chunkSize) {
    const end = Math.min(start + chunkSize, fileSize) - 1;
    ranges.push({
      start,
      end,
      contentRange: `bytes ${start}-${end}/${fileSize}`,
    });
  }
  return ranges;
}

/**
 * Uploads a File/Blob to `url` in sequential chunks, one request per range,
 * using the standard `Content-Range` header so a resumable-upload backend
 * (Google Drive style, tus, or a custom one) can reassemble it.
 *
 * Any non-2xx response aborts the upload. `onProgress` is called after every
 * accepted chunk with a 0..1 fraction, so callers can drive a progress bar
 * without needing per-byte XHR progress events.
 *
 * @param {File} file
 * @param {{ url: string, token?: string, chunkSize?: number, onProgress?: (fraction: number, chunkIndex: number, totalChunks: number) => void, signal?: AbortSignal }} options
 * @returns {Promise<{ chunksSent: number }>}
 */
async function uploadFileInChunks(file, options) {
  const { url, token, chunkSize = 10 * 1024 * 1024, onProgress, signal } = options;

  if (!url) {
    throw new Error("uploadFileInChunks: 'url' is required");
  }

  const ranges = computeChunkRanges(file.size, chunkSize);

  for (const [index, range] of ranges.entries()) {
    const chunk = file.slice(range.start, range.end + 1);

    const headers = { "Content-Range": range.contentRange };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append("file", chunk, file.name);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
      signal,
    });

    if (!response.ok) {
      throw new Error(
        `chunk ${index + 1}/${ranges.length} rejected: HTTP ${response.status}`
      );
    }

    onProgress?.((index + 1) / ranges.length, index, ranges.length);
  }

  return { chunksSent: ranges.length };
}

if (typeof module !== "undefined") {
  module.exports = { computeChunkRanges, uploadFileInChunks };
}
