import { useCallback, useEffect, useState } from 'react';
import { getDictionary } from './dictionary';
import { getLocale, setLocale as persistLocale, type Locale } from './i18n';

export function useDictionary() {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    getLocale().then(setLocaleState);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  return { locale, setLocale, dict: getDictionary(locale) };
}
