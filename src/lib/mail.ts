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

export async function sendContactMail(msg: ContactMessage): Promise<void> {
  const from = process.env.SMTP_FROM || required('SMTP_USER');
  await getTransporter().sendMail({
    from,
    to: required('CONTACT_TO'),
    replyTo: { name: msg.name, address: msg.email },
    subject: `JLco: message from ${msg.name}`,
    text: [
      `Name: ${msg.name}`,
      `Email: ${msg.email}`,
      `Language: ${msg.lang}`,
      `IP: ${msg.ip}`,
      '',
      msg.message,
    ].join('\n'),
  });
}
