import sharp from 'sharp';
import fs from 'node:fs';
const [src, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const crop = { left: 256, top: 486, width: 3584, height: 3181 };
const full = await sharp(src).extract(crop).png().toBuffer();

// Mark without "co" for small sizes: clear the co area to transparent.
const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
for (let y = 2130; y <= 2990; y++) for (let x = 2975; x <= 3290; x++) data[(y * info.width + x) * 4 + 3] = 0;
const markBuf = await sharp(data, { raw: info }).extract(crop).png().toBuffer();

const save = (buf, w, file, opts = {}) => sharp(buf).resize({ width: w }).webp({ quality: 90, ...opts }).toFile(`${out}/${file}`);
await save(full, 640, 'jlco-logo-640.webp');
await save(full, 1280, 'jlco-logo-1280.webp');
await sharp(full).resize({ width: 1280 }).png({ compressionLevel: 9 }).toFile(`${out}/jlco-logo-1280.png`);
await save(markBuf, 96, 'jlco-mark-96.webp');
await save(markBuf, 192, 'jlco-mark-192.webp');

// Icons on black with padding.
const icon = async (size, file, pad = 0.12) => {
  const inner = Math.round(size * (1 - pad * 2));
  const m = await sharp(markBuf).resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#000000' } }).composite([{ input: m, gravity: 'center' }]).png().toFile(`${out}/${file}`);
};
await icon(32, 'favicon-32.png', 0.06);
await icon(180, 'apple-touch-icon.png');
await icon(512, 'icon-512.png');

// Open Graph image 1200x630.
const og = await sharp(full).resize({ height: 420 }).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#000000' } }).composite([{ input: og, gravity: 'center' }]).png().toFile(`${out}/og-image.png`);
console.log(fs.readdirSync(out).map((f) => `${f} ${fs.statSync(`${out}/${f}`).size}`).join('\n'));
