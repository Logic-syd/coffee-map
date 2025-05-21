// src/app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";
// import "@/styles/fonts.css";

export const metadata = {
  title: "Coffee Map",
  description: "Specialty coffee & craft beer map",
};

interface RootLayoutProps {
  children: ReactNode;
  params?: { locale?: string }; // 设置为可选
}

export default function RootLayout({
  children,
  params = { locale: "en" }, // 提供默认值
}: RootLayoutProps) {
  const locale = params?.locale || "en";

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&family=Pretendard:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* bg-pastelYellow 让全站背景都是嫩黄 */}
      <body className="bg-pinkcream min-h-screen font-pretendard antialiased">
        {children}
      </body>
    </html>
  );
}
