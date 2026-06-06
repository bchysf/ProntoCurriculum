import { createContext, useContext, useState, type ReactNode } from 'react';
import { translations, type Lang } from './translations';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({ lang: 'IT', setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('pronto-lang') as Lang) ?? 'IT';
    } catch {
      return 'IT';
    }
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('pronto-lang', l); } catch {}
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useT() {
  const { lang } = useLanguage();
  return (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] ?? entry['IT'] ?? key;
  };
}
