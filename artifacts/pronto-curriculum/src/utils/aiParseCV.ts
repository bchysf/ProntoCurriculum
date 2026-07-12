import { CVData } from '../types';

export async function aiParseCV(text: string, isLinkedIn = false): Promise<Partial<CVData>> {
  const url = isLinkedIn ? '/api/parse-cv/linkedin' : '/api/parse-cv';
  const body = isLinkedIn ? { profileText: text } : { text };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Errore server: ${response.status}`);
  }

  const result = await response.json();
  return isLinkedIn ? (result.data as Partial<CVData>) : (result as Partial<CVData>);
}

export async function aiParseLinkedInText(profileText?: string, profileUrl?: string): Promise<Partial<CVData>> {
  const response = await fetch('/api/parse-cv/linkedin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileText, profileUrl }),
  });

  if (!response.ok) {
    throw new Error(`Errore server: ${response.status}`);
  }

  const result = await response.json();
  return result.data as Partial<CVData>;
}
