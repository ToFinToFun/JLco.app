const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Real Turnstile keys start with "0x"; anything else (empty, placeholder text) counts as not set.
const key = (name: string) => {
  const value = process.env[name]?.trim() ?? '';
  return value.startsWith('0x') ? value : '';
};

/** Turnstile is only used when both keys are set, so the widget and the check are always on or off together. */
export function turnstileKeys(): { siteKey: string; secret: string } | null {
  const siteKey = key('TURNSTILE_SITE_KEY');
  const secret = key('TURNSTILE_SECRET_KEY');
  return siteKey && secret ? { siteKey, secret } : null;
}

/** Returns true when the token is valid, or when Turnstile is not configured. */
export async function verifyTurnstile(token: string | null, ip: string): Promise<boolean> {
  const keys = turnstileKeys();
  if (!keys) return true;
  const { secret } = keys;
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);

  try {
    const res = await fetch(VERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(8000) });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
