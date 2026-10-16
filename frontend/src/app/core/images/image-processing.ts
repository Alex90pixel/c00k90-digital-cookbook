/** Shrinks an image so its longest side is at most `maxSize` px, as JPEG. */
export async function resizeImage(file: Blob, maxSize: number, quality: number): Promise<Blob> {
  const image = await loadImage(file);
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);
  return draw(width, height, quality, (context) => context.drawImage(image, 0, 0, width, height));
}

/** Cuts the largest centered square out of an image and scales it to `size` px, as JPEG. */
export async function cropToSquare(file: Blob, size: number, quality: number): Promise<Blob> {
  const image = await loadImage(file);
  const side = Math.min(image.width, image.height);
  const target = Math.min(size, side);
  const x = (image.width - side) / 2;
  const y = (image.height - side) / 2;
  return draw(target, target, quality, (context) =>
    context.drawImage(image, x, y, side, side, 0, 0, target, target),
  );
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    image.src = url;
  });
}

function draw(
  width: number,
  height: number,
  quality: number,
  paint: (context: CanvasRenderingContext2D) => void,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return Promise.reject(new Error('Canvas is not available'));
  paint(context);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))),
      'image/jpeg',
      quality,
    ),
  );
}
