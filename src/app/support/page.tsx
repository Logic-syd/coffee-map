"use client";
import TopBar from "@/components/TopBar";
import { useLocale } from "@/hooks/useLocale";
import { t } from "@/lib/i18n";
export default function SupportPage() {
  const locale = useLocale();
  return (
    <>
      <TopBar showBack title={t("support.title", locale)} />
      <main className="mx-auto max-w-2xl space-y-6 p-6 text-base leading-relaxed text-inkblack">
        <h1 className="text-2xl font-bold">{t("support.title", locale)}</h1>
        {(["location", "hours", "names", "favorites"] as const).map((topic) => (
          <section key={topic} className="space-y-2">
            <h2 className="font-semibold">
              {t(`support.${topic}.title`, locale)}
            </h2>
            <p>{t(`support.${topic}.body`, locale)}</p>
          </section>
        ))}
      </main>
    </>
  );
}
