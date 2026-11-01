"use client";

import { useEffect, useState } from "react";

function removeConnectedBackground(image: HTMLImageElement) {
  const maximumDimension = 1400;
  const scale = Math.min(1, maximumDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is not available");
  context.drawImage(image, 0, 0, width, height);
  const frame = context.getImageData(0, 0, width, height);
  const pixels = frame.data;
  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const sample = (x: number, y: number) => {
    const offset = (y * width + x) * 4;
    return [pixels[offset], pixels[offset + 1], pixels[offset + 2]] as const;
  };
  const cornerColors = [
    sample(Math.min(2, width - 1), Math.min(2, height - 1)),
    sample(Math.max(0, width - 3), Math.min(2, height - 1)),
    sample(Math.min(2, width - 1), Math.max(0, height - 3)),
    sample(Math.max(0, width - 3), Math.max(0, height - 3)),
  ];
  const toleranceSquared = 72 * 72;
  const resemblesEdgeBackground = (index: number) => {
    const offset = index * 4;
    if (pixels[offset + 3] < 20) return true;
    return cornerColors.some(([red, green, blue]) => {
      const dr = pixels[offset] - red;
      const dg = pixels[offset + 1] - green;
      const db = pixels[offset + 2] - blue;
      return dr * dr + dg * dg + db * db <= toleranceSquared;
    });
  };
  const enqueue = (index: number) => {
    if (index < 0 || index >= pixelCount || visited[index]) return;
    visited[index] = 1;
    if (resemblesEdgeBackground(index)) queue[tail++] = index;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head++];
    pixels[index * 4 + 3] = 0;
    const x = index % width;
    if (x > 0) enqueue(index - 1);
    if (x + 1 < width) enqueue(index + 1);
    if (index >= width) enqueue(index - width);
    if (index + width < pixelCount) enqueue(index + width);
  }

  context.putImageData(frame, 0, 0);
  return new Promise<string>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Transparent image could not be generated"));
        return;
      }
      resolve(URL.createObjectURL(blob));
    }, "image/png");
  });
}

export default function StoreBannerImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [result, setResult] = useState({ input: "", output: "", failed: false });

  useEffect(() => {
    let disposed = false;
    let generatedUrl = "";
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      removeConnectedBackground(image)
        .then((url) => {
          generatedUrl = url;
          if (disposed) URL.revokeObjectURL(url);
          else setResult({ input: src, output: url, failed: false });
        })
        .catch(() => {
          if (!disposed) setResult({ input: src, output: "", failed: true });
        });
    };
    image.onerror = () => {
      if (!disposed) setResult({ input: src, output: "", failed: true });
    };
    image.src = src;
    return () => {
      disposed = true;
      if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    };
  }, [src]);

  const matchesCurrentInput = result.input === src;
  const processedSource = matchesCurrentInput ? result.output : "";
  const processingFailed = matchesCurrentInput && result.failed;

  return (
    <img
      src={processedSource || src}
      alt={alt}
      className={`${className} ${processedSource ? "mix-blend-normal" : processingFailed ? "mix-blend-darken" : "opacity-0"}`}
      decoding="async"
    />
  );
}
