"use client";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { t } from "@/lib/i18n";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  return (
    <main
      className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 p-6 text-inkblack"
      role="alert"
    >
      <h1 className="text-2xl font-bold">{t("error.title", locale)}</h1>
      <p>{t("error.body", locale)}</p>
      <button
        onClick={reset}
        className="min-h-11 rounded-full bg-pinkaccent px-5 py-3 text-white"
      >
        {t("action.retry", locale)}
      </button>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center text-pinkaccent underline"
      >
        {t("action.list", locale)}
      </Link>
    </main>
  );
}
