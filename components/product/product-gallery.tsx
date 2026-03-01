"use client";

import Image from "next/image";
import { useState } from "react";
import type { Image as ImageType } from "@/lib/shopify/types";

export function ProductGallery({ images }: { images: ImageType[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = images[selectedIndex];

  if (images.length === 0) return null;

  return (
    <div>
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-brand-ice mb-4">
        <Image
          src={selected.url}
          alt={selected.altText || "Product image"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setSelectedIndex(i)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === selectedIndex ? "border-brand-accent" : "border-transparent"
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText || `Thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
