import { useState, useEffect, createContext, useContext } from "react";

type Language = "en" | "ar";
type Dir = "ltr" | "rtl";

interface LanguageContextType {
  language: Language;
  dir: Dir;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    "app.title": "Mirath - Islamic Inheritance Calculator",
    "nav.home": "Home",
    "nav.calculator": "Calculator",
    "nav.about": "About",
    "estate.info": "Estate Information",
    "estate.deceasedName": "Deceased Name",
    "estate.gender": "Gender of Deceased",
    "estate.totalEstate": "Total Estate Value",
    "estate.debts": "Debts",
    "estate.funeral": "Funeral Expenses",
    "estate.bequests": "Bequests / Will",
    "heirs.select": "Select Heirs",
    "calculate": "Calculate Shares",
    "results": "Results",
  },
  ar: {
    "app.title": "ميراث - حاسبة الميراث الإسلامي",
    "nav.home": "الرئيسية",
    "nav.calculator": "الحاسبة",
    "nav.about": "عن الموقع",
    "estate.info": "معلومات التركة",
    "estate.deceasedName": "اسم المتوفى",
    "estate.gender": "جنس المتوفى",
    "estate.totalEstate": "قيمة التركة الإجمالية",
    "estate.debts": "الديون",
    "estate.funeral": "مصاريف الجنازة",
    "estate.bequests": "الوصية",
    "heirs.select": "اختيار الورثة",
    "calculate": "حساب الأنصبة",
    "results": "النتائج",
  },
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language") as Language;
    return saved || "en";
  });

  const dir = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ar" : "en"));
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, dir, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};