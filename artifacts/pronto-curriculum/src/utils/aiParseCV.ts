import { CVData } from '../types';

export async function aiParseCV(text: string): Promise<Partial<CVData>> {
  const response = await fetch('/api/parse-cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Errore server: ${response.status}`);
  }

  const data = await response.json() as Partial<CVData>;
  return data;
}
