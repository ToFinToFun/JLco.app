import nodemailer, { type Transporter } from 'nodemailer';

let transporter: Transporter | undefined;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transporter = nodemailer.createTransport({
      host: required('SMTP_HOST'),
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
      auth: { user: required('SMTP_USER'), pass: required('SMTP_PASS') },
    });
  }
  return transporter;
}

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
  lang: string;
  ip: string;
}

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// The visitor sees this subject (as "Re: …") when we reply, so it is written for them.
const subjects: Record<string, string> = { en: 'Your message to JLco', sv: 'Ditt meddelande till JLco' };
const wrote: Record<string, string> = { en: 'wrote', sv: 'skrev' };

/**
 * Kept plain on purpose: a reply quotes the whole mail back to the visitor, so it holds only
 * their own words. Language and IP travel as headers instead (visible under "show original").
 */
function renderHtml(msg: ContactMessage): string {
  const font = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  return `<!doctype html>
<html><body style="margin:0;padding:16px;font-family:${font};color:#07192d">
<p style="margin:0 0 12px;font-size:14px;color:#5a6b7f">${escape(msg.name)} &lt;${escape(msg.email)}&gt; ${wrote[msg.lang] ?? wrote.en}:</p>
<div style="border-left:3px solid #008bff;padding:4px 0 4px 16px;font-size:15px;line-height:1.6;white-space:pre-wrap">${escape(msg.message)}</div>
</body></html>`;
}

export async function sendContactMail(msg: ContactMessage): Promise<void> {
  const sender = process.env.SMTP_FROM || required('SMTP_USER');
  // Show the visitor's name in the inbox, while still sending from our own address.
  const address = sender.match(/<([^>]+)>/)?.[1] ?? sender;
  await getTransporter().sendMail({
    from: { name: `${msg.name} via JLco`, address },
    to: required('CONTACT_TO'),
    replyTo: { name: msg.name, address: msg.email },
    subject: subjects[msg.lang] ?? subjects.en,
    headers: { 'X-JLco-Language': msg.lang, 'X-JLco-Sender-IP': msg.ip || 'unknown' },
    text: `${msg.name} <${msg.email}> ${wrote[msg.lang] ?? wrote.en}:\n\n${msg.message}`,
    html: renderHtml(msg),
  });
}
