import type { Metadata } from "next";
import PhotoAdmin from "./photo-admin";

export const metadata: Metadata = {
  title: "门店资料 · Coffee Map",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <PhotoAdmin />;
}
