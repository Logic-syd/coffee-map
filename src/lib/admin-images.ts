export const PHOTO_BUCKET = "venue-photos";
export const MAX_INPUT_BYTES = 20 * 1024 * 1024;

export type PreparedPhoto = {
  blob: Blob;
  preview: string;
  filename: string;
  width: number;
  height: number;
  originalBytes: number;
};

export function photoDimensions(width: number, height: number) {
  const scale = Math.min(1, 1600 / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (!file.size) throw new Error("这张照片是空文件，请重新选择。");
  if (file.size > MAX_INPUT_BYTES) throw new Error("照片超过 20 MB，请先导出较小的版本。");
  if (!/\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name) && !/^image\/(jpeg|png|webp|avif|heic|heif)$/.test(file.type)) {
    throw new Error("请选择 JPG、PNG、WebP 或手机照片，不支持动图和 SVG。");
  }
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = source;
    try { await image.decode(); }
    catch { throw new Error("浏览器无法读取这张照片。若是 HEIC，请先从相册导出为 JPEG 后重试。"); }
    if (image.naturalWidth * image.naturalHeight > 60_000_000) throw new Error("照片分辨率过大，请先缩小到 6000 万像素以内。");
    const { width, height } = photoDimensions(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("当前浏览器无法处理照片，请更换浏览器重试。");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    let blob: Blob | null = null;
    for (const quality of [0.82, 0.72, 0.62, 0.52]) {
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (!blob) throw new Error("照片处理失败，请重新选择。");
      if (blob.size <= 1024 * 1024) break;
    }
    if (!blob || blob.size > 2 * 1024 * 1024) throw new Error("压缩后照片仍过大，请裁剪后重试。");
    return { blob, preview: URL.createObjectURL(blob), filename: file.name, width, height, originalBytes: file.size };
  } finally {
    URL.revokeObjectURL(source);
  }
}
