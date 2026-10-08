// The server rejects data URLs longer than this (see /api/images).
const MAX_LENGTH = 880_000;

// Scales an image down in the browser before upload, so stored images stay small.
// Photos (JPEG) stay JPEG. PNG and WebP may be transparent, so they become WebP,
// which keeps transparency (JPEG would turn transparent areas black).
export async function resizeImage(file: File, maxSide = 1200): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const keepTransparency = file.type !== "image/jpeg";
  try {
    for (let side = maxSide; side >= 300; side = Math.round(side * 0.75)) {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      // Browsers that can't encode WebP return PNG instead, which also keeps transparency.
      const dataUrl = keepTransparency
        ? canvas.toDataURL("image/webp", 0.9)
        : canvas.toDataURL("image/jpeg", 0.85);
      if (dataUrl.length <= MAX_LENGTH) return dataUrl;
    }
    throw new Error("Image is too large, try a smaller one");
  } finally {
    bitmap.close();
  }
}
