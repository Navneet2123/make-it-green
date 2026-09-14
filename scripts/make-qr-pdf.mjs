/**
 * Builds the printable poster as a true vector PDF.
 *
 *   node scripts/make-qr-pdf.mjs [url]
 *
 * Writes qr/make-it-green-poster.pdf — A4, fonts embedded, the QR drawn as
 * vector paths rather than a picture of one, so it stays crisp at any print
 * size. The workonmymachine logo is placed from qr/logo.png.
 *
 * Fonts are downloaded once and cached in qr/.ttf/ (ignored by git).
 */
import PDFDocument from 'pdfkit';
import { create } from 'qrcode';
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QR_DIR = join(ROOT, 'qr');
const URL_ = process.argv[2] ?? 'https://navneet2123.github.io/make-it-green/';

const INK = '#1B1F3B';
const GREEN = '#19C37D';
const EYE_GREEN = '#0E8A57';   // dark enough to binarise as black — see qr/README.md
const BG = '#EEF0FA';
const GOLD = '#FFD23F';
const MUTED = '#6B7194';
const CARD = '#FFFFFF';

const TTF = {
  display: 'https://fonts.gstatic.com/s/bricolagegrotesque/v9/3y9U6as8bTXq_nANBjzKo3IeZx8z6up5BeSl5jBNz_19PpbpMXuECpwUxJBOm_OJWiaaD30YfKfjZZoLvZvl-Moltw.ttf',
  body: 'https://fonts.gstatic.com/s/instrumentsans/v4/pximypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr-yp2JGEJOH9npSQb_jfykyk.ttf',
  mono: 'https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8-qxTOlOQ.ttf',
};

async function fonts() {
  const dir = join(QR_DIR, '.ttf');
  mkdirSync(dir, { recursive: true });
  const out = {};
  for (const [name, url] of Object.entries(TTF)) {
    const file = join(dir, `${name}.ttf`);
    if (!existsSync(file)) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} downloading the ${name} font`);
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    }
    out[name] = file;
  }
  return out;
}

// ---------- page geometry, in PDF points (72 per inch) ----------
const mm = (v) => (v * 72) / 25.4;
const PW = mm(210), PH = mm(297);

const doc = new PDFDocument({ size: 'A4', margin: 0, info: {
  Title: 'Make It Green — scan to play',
  Author: 'workonmymachine',
  Subject: URL_,
} });
const f = await fonts();
doc.registerFont('display', f.display);
doc.registerFont('body', f.body);
doc.registerFont('mono', f.mono);

// background
doc.rect(0, 0, PW, PH).fill(BG);
for (let y = mm(6); y < PH; y += mm(4.6)) {
  for (let x = mm(6); x < PW; x += mm(4.6)) doc.circle(x, y, 0.6).fill(INK);
}
doc.fillOpacity(1);

// card, with the offset shadow the game uses
const cx = mm(14), cy = mm(14), cw = PW - mm(28), ch = PH - mm(28);
doc.roundedRect(cx + mm(1.6), cy + mm(1.6), cw, ch, mm(7)).fill(INK);
doc.roundedRect(cx, cy, cw, ch, mm(7)).fillAndStroke(CARD, INK);
doc.lineWidth(2.4).roundedRect(cx, cy, cw, ch, mm(7)).stroke(INK);

let y = cy + mm(12);

// ---------- logo ----------
const logoPath = join(QR_DIR, 'logo.png');
if (existsSync(logoPath)) {
  const logoH = mm(48);
  const logoW = logoH * 1.2;                    // the trimmed mark is 1.2 : 1
  doc.image(logoPath, PW / 2 - logoW / 2, y, { width: logoW, height: logoH });
  y += logoH + mm(9);
} else {
  doc.font('display').fontSize(26).fillColor(INK).text('make it green', 0, y, { width: PW, align: 'center' });
  y += mm(14);
}

// ---------- headline ----------
doc.font('display').fontSize(54).fillColor(INK)
  .text('Scan to play', 0, y, { width: PW, align: 'center', characterSpacing: -1.2 });
y += mm(22);
doc.font('body').fontSize(15).fillColor(MUTED)
  .text('Ten questions about software testing.', 0, y, { width: PW, align: 'center' });
y += mm(7.5);
doc.font('body').fontSize(15).fillColor(MUTED)
  .text('Five minutes. No sign-up.', 0, y, { width: PW, align: 'center' });
y += mm(13);

// ---------- the code, drawn as vectors ----------
const qr = create(URL_, { errorCorrectionLevel: 'H' });
const N = qr.modules.size;
const bit = (r, c) => qr.modules.data[r * N + c] === 1;
const QUIET = 4, BADGE = 7;
const b0 = Math.floor((N - BADGE) / 2);
const inEye = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
const inBadge = (r, c) => r >= b0 && r < b0 + BADGE && c >= b0 && c < b0 + BADGE;
const on = (r, c) => r >= 0 && c >= 0 && r < N && c < N && bit(r, c) && !inEye(r, c) && !inBadge(r, c);

const QSIZE = mm(94);
const M = QSIZE / (N + QUIET * 2);
const qx = PW / 2 - QSIZE / 2, qy = y;
const R = M * 0.4;
const px = (c) => qx + (c + QUIET) * M;
const py = (r) => qy + (r + QUIET) * M;

doc.roundedRect(qx, qy, QSIZE, QSIZE, M * 4).fill(CARD);

// data modules, rounded only where no dark neighbour sits alongside
for (let r = 0; r < N; r++) {
  for (let c = 0; c < N; c++) {
    if (!on(r, c)) continue;
    const x = px(c), yy = py(r);
    const up = on(r - 1, c), dn = on(r + 1, c), lf = on(r, c - 1), rt = on(r, c + 1);
    const tl = !up && !lf ? R : 0, tr = !up && !rt ? R : 0, br = !dn && !rt ? R : 0, bl = !dn && !lf ? R : 0;
    doc.moveTo(x + tl, yy).lineTo(x + M - tr, yy);
    if (tr) doc.quadraticCurveTo(x + M, yy, x + M, yy + tr);
    doc.lineTo(x + M, yy + M - br);
    if (br) doc.quadraticCurveTo(x + M, yy + M, x + M - br, yy + M);
    doc.lineTo(x + bl, yy + M);
    if (bl) doc.quadraticCurveTo(x, yy + M, x, yy + M - bl);
    doc.lineTo(x, yy + tl);
    if (tl) doc.quadraticCurveTo(x, yy, x + tl, yy);
    doc.fill(INK);
  }
}

// the three eyes: concentric rounded squares, ratio preserved
for (const [ro, co] of [[0, 0], [0, N - 7], [N - 7, 0]]) {
  const x = px(co), yy = py(ro);
  doc.roundedRect(x, yy, M * 7, M * 7, M * 1.4).fill(INK);
  doc.roundedRect(x + M, yy + M, M * 5, M * 5, M).fill(CARD);
  doc.roundedRect(x + M * 2, yy + M * 2, M * 3, M * 3, M * 0.7).fill(EYE_GREEN);
}

// centre badge
{
  const x = px(b0), yy = py(b0), s = BADGE * M;
  doc.roundedRect(x - 1, yy - 1, s + 2, s + 2, M * 2).fill(CARD);
  doc.roundedRect(x + 2, yy + 2, s - 4, s - 4, M * 1.6).fill(INK);
  doc.circle(x + s / 2, yy + s / 2, s * 0.28).fill(GREEN);
  doc.lineWidth(s * 0.075).lineCap('round').lineJoin('round')
    .moveTo(x + s / 2 - s * 0.13, yy + s / 2)
    .lineTo(x + s / 2 - s * 0.04, yy + s / 2 + s * 0.1)
    .lineTo(x + s / 2 + s * 0.14, yy + s / 2 - s * 0.11)
    .stroke(INK);
}
y = qy + QSIZE + mm(13);

// ---------- prize ----------
const bw = mm(136), bh = mm(13);
doc.roundedRect(PW / 2 - bw / 2, y, bw, bh, mm(4)).fillAndStroke(GOLD, INK);
doc.lineWidth(2).roundedRect(PW / 2 - bw / 2, y, bw, bh, mm(4)).stroke(INK);
doc.font('display').fontSize(16).fillColor(INK)
  .text('Score 1000 or more, win a chocolate', 0, y + mm(3.9), { width: PW, align: 'center' });
y += bh + mm(11);

// ---------- url ----------
doc.font('mono').fontSize(13).fillColor(INK)
  .text(URL_.replace(/^https:\/\//, ''), 0, y, { width: PW, align: 'center' });
y += mm(12);

// ---------- footer ----------
const chips = [['10 questions', GREEN], ['one shot each', GOLD], ['beat the clock', '#FF5A5F']];
doc.font('body').fontSize(10.5);
const widths = chips.map(([t]) => doc.widthOfString(t) + mm(6));
let x0 = PW / 2 - widths.reduce((a, b) => a + b, 0) / 2;
chips.forEach(([text, colour], i) => {
  doc.circle(x0 + mm(1.4), y + mm(1.4), mm(1).valueOf() * 0.9).fill(colour);
  doc.fillColor(MUTED).text(text, x0 + mm(4), y, { lineBreak: false });
  x0 += widths[i];
});

const out = join(QR_DIR, 'make-it-green-poster.pdf');
doc.pipe(createWriteStream(out)).on('finish', () => console.log(`Wrote ${out}`));
doc.end();
