"use client";

import { useState } from "react";

export default function StoreProductRemoteImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
