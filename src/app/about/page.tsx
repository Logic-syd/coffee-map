"use client";
import TopBar from "@/components/TopBar";
import { useLocale } from "@/hooks/useLocale";
import { t } from "@/lib/i18n";
export default function AboutPage() {
  const locale = useLocale();
  return (
    <>
      <TopBar showBack title={t("about.title", locale)} />
      <main className="mx-auto max-w-2xl space-y-6 p-6 text-base leading-relaxed text-inkblack">
        <h1 className="text-2xl font-bold">{t("about.title", locale)}</h1>
        {(
          [
            "about.intro",
            "about.languages",
            "about.favorites",
            "about.hours",
          ] as const
        ).map((key) => (
          <p key={key}>{t(key, locale)}</p>
        ))}
      </main>
    </>
  );
}
