"use client";
import { useContext } from "react";
import { LanguageContext } from "@/components/LanguageProvider";
export function useLanguageSettings() {
  return useContext(LanguageContext);
}
export function useLocale() {
  return useLanguageSettings().locale;
}
