import { useAppStore } from '@/store/useAppStore';
import { t, LANGUAGES } from '@/lib/i18n';

export function useTranslation() {
  const { locale, setLocale } = useAppStore();

  const translate = (key: string, params?: Record<string, string | number>): string => {
    return t(key, locale, params);
  };

  return {
    t: translate,
    locale,
    setLocale,
    languages: LANGUAGES,
  };
}
