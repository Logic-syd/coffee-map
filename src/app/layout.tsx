// src/app/layout.tsx
import "./globals.css";
import LanguageProvider from "@/components/LanguageProvider";
import { ReactNode } from "react";

export const metadata = {
  title: "Coffee Map",
  description: "Find and save cafes in Shanghai",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const locale = "en";

  return (
    <html lang={locale}>
      <body className="bg-pinkcream min-h-screen antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
