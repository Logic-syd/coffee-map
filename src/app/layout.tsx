// src/app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";
import TopBar from "@/components/TopBar";

export const metadata = {
  title: "Coffee Map",
  description: "Specialty coffee & craft beer map",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      {/* bg-pastelYellow 让全站背景都是嫩黄 */}
      <body className="bg-pastelYellow min-h-screen">
        <TopBar />
        <div className="pt-14">{children}</div>
      </body>
    </html>
  );
}
