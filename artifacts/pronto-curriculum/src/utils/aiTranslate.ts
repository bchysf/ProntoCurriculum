import { CVData } from '../types';

export type SupportedLanguage = 'IT' | 'EN' | 'FR' | 'DE' | 'ES' | 'PT';

// `flag` is the country code for the flag image (see FlagImg in components/CountrySelect):
// emoji flags render as bare letters on Windows, so we use real images everywhere.
export const LANGUAGES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'IT', label: 'Italiano', flag: 'it' },
  { code: 'EN', label: 'English', flag: 'gb' },
  { code: 'FR', label: 'Français', flag: 'fr' },
  { code: 'DE', label: 'Deutsch', flag: 'de' },
  { code: 'ES', label: 'Español', flag: 'es' },
  { code: 'PT', label: 'Português', flag: 'pt' },
];

export async function aiTranslateCV(cvData: CVData, targetLanguage: SupportedLanguage): Promise<CVData> {
  const response = await fetch('/api/translate-cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cvData, targetLanguage }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Errore traduzione CV');
  }

  const data = await response.json() as { cvData: CVData };
  return data.cvData;
}

export async function aiTranslateField(
  field: 'summary' | 'exp-desc' | 'title' | 'degree',
  value: string,
  targetLanguage: SupportedLanguage,
  context?: { role?: string; company?: string },
): Promise<string> {
  const response = await fetch('/api/translate-field', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field, value, targetLanguage, context }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Errore traduzione campo');
  }

  const data = await response.json() as { result: string };
  return data.result;
}
