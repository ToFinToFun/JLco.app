import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// Forms filled in faster than this are bots; older than this are stale (or replayed).
const MIN_AGE_MS = 3_000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_LINKS = 2;

// FORM_SECRET if set, else derived from the SMTP password so it survives redeploys.
const secret =
  process.env.FORM_SECRET ||
  (process.env.SMTP_PASS ? `form:${process.env.SMTP_PASS}` : randomBytes(32).toString('hex'));

const sign = (value: string) => createHmac('sha256', secret).update(value).digest('base64url');

/** A signed timestamp rendered into the form, so the server can tell when the form was loaded. */
export function formToken(now = Date.now()): string {
  const ts = String(now);
  return `${ts}.${sign(ts)}`;
}

/** Returns why a submission looks like spam, or null when it looks fine. */
export function spamReason(token: string, message: string, now = Date.now()): string | null {
  const [ts, mac] = token.split('.');
  if (!ts || !mac) return 'no form token';
  const expected = Buffer.from(sign(ts));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return 'bad form token';
  const age = now - Number(ts);
  if (age < MIN_AGE_MS) return 'sent too fast';
  if (age > MAX_AGE_MS) return 'form too old';

  if (/<a\s|\[url=|\[link=/i.test(message)) return 'markup links';
  const links = message.match(/https?:\/\/|www\./gi)?.length ?? 0;
  if (links > MAX_LINKS) return `${links} links`;
  return null;
}
