// src/app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Coffee Map",
  description: "Specialty coffee & craft beer map",
};

export default function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const locale = params?.locale || "en";

  return (
    <html lang={locale}>
      {/* bg-pastelYellow 让全站背景都是嫩黄 */}
      <body className="bg-pastelYellow min-h-screen">
        <div className="pt-14">{children}</div>
      </body>
    </html>
  );
}
