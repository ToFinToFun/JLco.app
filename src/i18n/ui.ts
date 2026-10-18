export const languages = {
  en: 'English',
  sv: 'Svenska',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'en';

// Languages that are published. Add 'sv' here to turn on the Swedish pages
// (/sv/, /sv/contact) and the language switcher.
export const enabledLangs: Lang[] = ['en'];

export const ui = {
  en: {
    'meta.title': 'JLco',
    'meta.description': 'Power, protection and digital systems. And a few things we don’t talk about yet.',
    'nav.contact': 'Contact',
    'nav.home': 'JLco home',
    'nav.language': 'Language',
    'home.eyebrow': '// Consulting & engineering',
    'home.title': 'Precision\nfor whatever\ncomes next.',
    'home.lead': 'Power, protection and digital systems. And a few things we don’t talk about yet.',
    'home.cta': 'Start a conversation',
    'contact.title': 'Contact',
    'contact.eyebrow': '// 01 Contact',
    'contact.heading': 'Tell us\nwhat you need.',
    'contact.lead': 'Big or small, obvious or odd. We read everything and answer within a few working days.',
    'contact.name': 'Name',
    'contact.email': 'Email',
    'contact.message': 'Message',
    'contact.send': 'Send',
    'contact.sending': 'Sending…',
    'contact.sentTitle': '// Received',
    'contact.sent': 'Message received. We’ll be in touch.',
    'contact.again': 'Send another',
    'contact.error': 'Something went wrong. Please try again in a moment.',
    'contact.invalid': 'Please fill in your name, a valid email and a message.',
    'contact.captcha': 'Please confirm you are human and try again.',
    'contact.rate': 'Too many messages. Please try again later.',
    'notfound.title': 'Nothing here.',
    'notfound.back': 'Back to start',
  },
  sv: {
    'meta.title': 'JLco',
    'meta.description': 'Kraft, skydd och digitala system. Och en del vi inte pratar om än.',
    'nav.contact': 'Kontakt',
    'nav.home': 'JLco startsida',
    'nav.language': 'Språk',
    'home.eyebrow': '// Konsult & teknik',
    'home.title': 'Precision\nför det som\nkommer härnäst.',
    'home.lead': 'Kraft, skydd och digitala system. Och en del vi inte pratar om än.',
    'home.cta': 'Hör av dig',
    'contact.title': 'Kontakt',
    'contact.eyebrow': '// 01 Kontakt',
    'contact.heading': 'Berätta vad\ndu behöver.',
    'contact.lead': 'Stort eller litet, självklart eller udda. Vi läser allt och svarar inom några arbetsdagar.',
    'contact.name': 'Namn',
    'contact.email': 'E-post',
    'contact.message': 'Meddelande',
    'contact.send': 'Skicka',
    'contact.sending': 'Skickar…',
    'contact.sentTitle': '// Mottaget',
    'contact.sent': 'Tack, vi har fått ditt meddelande och hör av oss.',
    'contact.again': 'Skicka ett till',
    'contact.error': 'Något gick fel. Försök igen om en stund.',
    'contact.invalid': 'Fyll i namn, en giltig e-postadress och ett meddelande.',
    'contact.captcha': 'Bekräfta att du är en människa och försök igen.',
    'contact.rate': 'För många meddelanden. Försök igen senare.',
    'notfound.title': 'Här finns inget.',
    'notfound.back': 'Till startsidan',
  },
} as const;

export type UiKey = keyof (typeof ui)['en'];

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && value in languages;
}

export function useTranslations(lang: Lang) {
  return (key: UiKey): string => ui[lang][key] ?? ui[defaultLang][key];
}

/** Path for a page in a given language, e.g. localePath('sv', '/contact') -> '/sv/contact'. */
export function localePath(lang: Lang, path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === defaultLang) return clean;
  return clean === '/' ? `/${lang}/` : `/${lang}${clean}`;
}

/** getStaticPaths entries for the [...lang] routes: undefined = default language at the root. */
export function langPaths() {
  return enabledLangs.map((lang) => ({
    params: { lang: lang === defaultLang ? undefined : lang },
    props: { lang },
  }));
}
