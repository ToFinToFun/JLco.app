import type { APIRoute } from 'astro';
import { defaultLang, isLang, localePath } from '../../i18n/ui';
import { sendContactMail } from '../../lib/mail';
import { isRateLimited } from '../../lib/rate-limit';
import { spamReason } from '../../lib/spam';
import { verifyTurnstile } from '../../lib/turnstile';

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Result = 'sent' | 'invalid' | 'captcha' | 'rate' | 'error';

function field(data: FormData, name: string, max: number): string {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  let lang: string = defaultLang;

  const respond = (result: Result, status: number) => {
    if (wantsJson) {
      return Response.json(result === 'sent' ? { ok: true } : { ok: false, error: result }, { status });
    }
    const target = `${localePath(isLang(lang) ? lang : defaultLang, '/contact')}?status=${result}`;
    return new Response(null, { status: 303, headers: { Location: target } });
  };

  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return respond('invalid', 400);
  }

  const rawLang = field(data, 'lang', 5);
  if (isLang(rawLang)) lang = rawLang;

  // Honeypot: bots fill every field. Pretend it worked.
  if (field(data, 'website', 200)) {
    console.log('[contact] blocked spam: honeypot filled');
    return respond('sent', 200);
  }

  const name = field(data, 'name', 200).replace(/[\r\n]+/g, ' ');
  const email = field(data, 'email', 320);
  const message = field(data, 'message', 5000);
  if (!name || !EMAIL_RE.test(email) || message.length < 2) return respond('invalid', 400);

  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    clientAddress ??
    '';

  if (isRateLimited(ip || 'unknown')) return respond('rate', 429);

  // Likely spam: drop it but answer as if it was sent, so bots learn nothing.
  const spam = spamReason(field(data, 'ts', 200), message);
  if (spam) {
    console.log(`[contact] blocked spam from ${ip || 'unknown'}: ${spam}`);
    return respond('sent', 200);
  }

  const token = data.get('cf-turnstile-response');
  if (!(await verifyTurnstile(typeof token === 'string' ? token : null, ip))) {
    return respond('captcha', 400);
  }

  try {
    await sendContactMail({ name, email, message, lang, ip });
  } catch (err) {
    console.error('[contact] failed to send mail:', err instanceof Error ? err.message : err);
    return respond('error', 502);
  }
  return respond('sent', 200);
};

export const ALL: APIRoute = () => new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
