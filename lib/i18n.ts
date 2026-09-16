import * as SecureStore from 'expo-secure-store';

export type Locale = 'en' | 'fi';
const STORAGE_KEY = 'kuopas_locale';

export async function getLocale(): Promise<Locale> {
  const value = await SecureStore.getItemAsync(STORAGE_KEY);
  return value === 'fi' ? 'fi' : 'en';
}

export async function setLocale(locale: Locale): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, locale);
}
