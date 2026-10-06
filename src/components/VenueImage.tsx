"use client";
import Image from "next/image";
import { isImageSource } from "@/utils/image-source";
import { useState } from "react";
import { Coffee } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
export default function VenueImage({
  src,
  alt,
  locale,
  className = "h-44",
}: {
  src?: string;
  alt: string;
  locale: Language;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const available = src && isImageSource(src) && failedSrc !== src;
  return (
    <div
      className={`relative w-full overflow-hidden bg-pinkcream ${className}`}
    >
      {available ? (
        <Image
          unoptimized
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 672px"
          className="object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <div
          className="flex h-full flex-col items-center justify-center gap-2 text-gray-600"
          role="img"
          aria-label={t("image.missing", locale)}
        >
          <Coffee size={32} aria-hidden="true" />
          <span className="text-sm">{t("image.missing", locale)}</span>
        </div>
      )}
    </div>
  );
}
