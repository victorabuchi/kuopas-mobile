import type { Locale } from './i18n';

// Mobile-only labels; the web dictionary keeps its own wording, which is copied verbatim.
export const updatesLabel = (locale: Locale) => (locale === 'fi' ? 'Päivitykset' : 'Updates');
export const moreLabel = (locale: Locale) => (locale === 'fi' ? 'Lisää' : 'More');
