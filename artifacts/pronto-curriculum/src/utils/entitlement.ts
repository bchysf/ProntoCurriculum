// Spends one CV entitlement (free trial, then paid credits) server-side,
// right before a CV is actually generated. Thrown errors tell the caller
// which modal to open next.
export class EntitlementError extends Error {
  code: 'AUTH_REQUIRED' | 'NEEDS_PAYMENT';
  constructor(code: 'AUTH_REQUIRED' | 'NEEDS_PAYMENT') {
    super(code === 'AUTH_REQUIRED' ? 'Devi accedere per scaricare il CV' : 'Prova gratuita esaurita');
    this.code = code;
  }
}

export async function consumeCvEntitlement(): Promise<void> {
  const res = await fetch('/api/billing/consume', { method: 'POST', credentials: 'include' });
  if (res.status === 401) throw new EntitlementError('AUTH_REQUIRED');
  if (res.status === 402) throw new EntitlementError('NEEDS_PAYMENT');
  if (!res.ok) throw new Error('Errore di rete durante la verifica del CV');
}
