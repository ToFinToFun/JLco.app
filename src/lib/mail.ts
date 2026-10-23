import { emailLogoPng } from './email-logo';
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

const languageNames: Record<string, string> = { en: 'Engelska', sv: 'Svenska' };

interface Details {
  sentAt: string;
  language: string;
  ip: string;
}

function renderHtml(msg: ContactMessage, d: Details): string {
  const font = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const mono = "'JetBrains Mono',Menlo,Consolas,monospace";
  const email = escape(msg.email);
  const row = (label: string, value: string) =>
    `<tr><td style="padding:5px 20px 5px 0;font-family:${mono};font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#7489a1;white-space:nowrap;vertical-align:top">${label}</td>` +
    `<td style="padding:5px 0;font-size:14px;color:#07192d">${value}</td></tr>`;

  return `<!doctype html>
<html lang="sv"><head><meta charset="utf-8"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#eef2f7">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:24px 12px;font-family:${font}">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:6px;overflow:hidden">
  <tr><td style="background:#000000;padding:20px 28px;border-bottom:3px solid #008bff">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle"><img src="cid:jlco-logo" width="56" height="50" alt="JLco" style="display:block;border:0"></td>
      <td style="vertical-align:middle;padding-left:16px;font-family:${mono};font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#00e3f2">Kontaktformulär</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 28px 4px">
    <p style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.01em;color:#07192d">Nytt meddelande</p>
  </td></tr>
  <tr><td style="padding:16px 28px 4px">
    <table role="presentation" cellpadding="0" cellspacing="0">
      ${row('Från', escape(msg.name))}
      ${row('E-post', `<a href="mailto:${email}" style="color:#0732c8;text-decoration:none">${email}</a>`)}
      ${row('Tid', escape(d.sentAt))}
      ${row('Språk', escape(d.language))}
      ${row('IP', escape(d.ip))}
    </table>
  </td></tr>
  <tr><td style="padding:20px 28px">
    <div style="border-left:3px solid #00e3f2;background:#f5f8fc;padding:16px 20px;font-size:15px;line-height:1.6;color:#07192d;white-space:pre-wrap">${escape(msg.message)}</div>
  </td></tr>
  <tr><td style="padding:0 28px 28px">
    <a href="mailto:${email}" style="display:inline-block;background:#008bff;color:#000000;font-family:${mono};font-size:13px;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:12px 22px;border-radius:2px">Svara &rarr;</a>
  </td></tr>
</table>
<p style="margin:16px 0 0;font-size:12px;color:#7489a1">Svara på det här mejlet så går svaret direkt till avsändaren.</p>
</td></tr>
</table>
</body></html>`;
}

export async function sendContactMail(msg: ContactMessage): Promise<void> {
  const sender = process.env.SMTP_FROM || required('SMTP_USER');
  const address = sender.match(/<([^>]+)>/)?.[1] ?? sender;
  const d: Details = {
    sentAt: new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm', dateStyle: 'long', timeStyle: 'short' }),
    language: languageNames[msg.lang] ?? msg.lang,
    ip: msg.ip || 'okänd',
  };
  await getTransporter().sendMail({
    from: { name: 'Kontaktformulär JLco', address },
    to: required('CONTACT_TO'),
    replyTo: { name: msg.name, address: msg.email },
    subject: `Kontaktformulär JLco: ${msg.name}`,
    text: [
      'KONTAKTFORMULÄR JLCO',
      '',
      `Från:   ${msg.name}`,
      `E-post: ${msg.email}`,
      `Tid:    ${d.sentAt}`,
      `Språk:  ${d.language}`,
      `IP:     ${d.ip}`,
      '',
      msg.message,
    ].join('\n'),
    html: renderHtml(msg, d),
    attachments: [{ filename: 'jlco.png', content: Buffer.from(emailLogoPng, 'base64'), cid: 'jlco-logo' }],
  });
}
