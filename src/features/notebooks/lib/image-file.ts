const MAX_DIM = 1400;

/** Downscales an image in the browser and returns a compact data URI. */
export async function fileToDataUrl(file: File): Promise<string> {
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Couldn't read that file"));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Couldn't read that image"));
    element.src = original;
  });

  const scale = Math.min(1, MAX_DIM / Math.max(image.width, image.height));
  if (scale === 1 && original.length < 400_000) return original;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return original;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

const IMAGE_EXTENSION = /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i;

export function looksLikeImageUrl(value: string): boolean {
  return IMAGE_EXTENSION.test(value.trim());
}

export function looksLikeUrl(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value.trim());
}
