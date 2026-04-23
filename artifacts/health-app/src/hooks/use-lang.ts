import { useContext } from "react";
import { LanguageContext } from "@/contexts/language-context";

export function useLang() {
  return useContext(LanguageContext);
}
