import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { type Lang, t as translate, type TranslationKey } from "@/lib/translations";

export interface LanguageContextValue {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

export const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  dir: "ltr",
  setLang: () => {},
  t: (key) => translate("en", key),
});

const STORAGE_KEY = "bodylogic-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return (stored === "ar" || stored === "en") ? stored : "en";
    } catch {
      return "en";
    }
  });

  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    try { localStorage.setItem(STORAGE_KEY, newLang); } catch {}
  }, []);

  const tFn = useCallback((key: TranslationKey) => translate(lang, key), [lang]);
  const value = useMemo(() => ({ lang, dir, setLang, t: tFn }), [lang, dir, setLang, tFn]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    if (lang === "ar") {
      document.documentElement.classList.add("font-arabic");
    } else {
      document.documentElement.classList.remove("font-arabic");
    }
  }, [lang, dir]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
