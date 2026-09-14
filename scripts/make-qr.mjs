/**
 * Generates the event QR artwork.
 *
 *   node scripts/make-qr.mjs [url]
 *
 * Writes to qr/:
 *   make-it-green-qr.svg      the code on its own, for slides and chat
 *   make-it-green-poster.svg  an A4 poster with the fonts embedded, for printing
 *
 * The code is drawn by hand rather than by the library's SVG renderer so the
 * modules, the three eyes and the centre badge can carry the game's styling.
 * Error correction is set to H (30%), which is what lets the badge sit on top.
 */
import { create } from 'qrcode';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL_ = process.argv[2] ?? 'https://navneet2123.github.io/make-it-green/';

const INK = '#1B1F3B';
const GREEN = '#19C37D';
/**
 * The eye centres must read as dark after a scanner binarises the image.
 * The brand green (#19C37D) has a luma of 136, just over the usual threshold of
 * 128, so scanners see those squares as white and the code stops resolving at
 * anything above about 300px. This deeper green (luma 95) is the same one the
 * game uses for PASS text and decodes cleanly at every size.
 * If you change it, keep the luma under roughly 110.
 */
const EYE_GREEN = '#0E8A57';
const BG = '#EEF0FA';
const GOLD = '#FFD23F';
const CARD = '#FFFFFF';

const M = 10;      // one module, in user units
const QUIET = 4;   // quiet zone, in modules

const qr = create(URL_, { errorCorrectionLevel: 'H' });
const N = qr.modules.size;
const bit = (r, c) => qr.modules.data[r * N + c] === 1;
const side = (N + QUIET * 2) * M;

/** The three 7x7 eyes, drawn by hand, so skip their modules in the data pass. */
const inEye = (r, c) =>
  (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);

/** Modules hidden behind the centre badge. */
const BADGE = 7;
const b0 = Math.floor((N - BADGE) / 2);
const inBadge = (r, c) => r >= b0 && r < b0 + BADGE && c >= b0 && c < b0 + BADGE;

/**
 * A module is only rounded on a corner where both neighbours are light.
 * Neighbouring dark modules therefore meet flush, with no white notch between
 * them. Rounding every corner looks softer but leaves gaps that make crisp,
 * high-resolution scans misread the code.
 */
const R = 4;
const on = (r, c) =>
  r >= 0 && c >= 0 && r < N && c < N && bit(r, c) && !inEye(r, c) && !inBadge(r, c);

/** One 10x10 tile, rounded on the corners named in the 4-bit mask. */
function tile(mask) {
  const tl = mask & 1 ? R : 0, tr = mask & 2 ? R : 0, br = mask & 4 ? R : 0, bl = mask & 8 ? R : 0;
  return [
    `M${tl} 0`,
    `H${M - tr}`, tr ? `a${tr} ${tr} 0 0 1 ${tr} ${tr}` : '',
    `V${M - br}`, br ? `a${br} ${br} 0 0 1 -${br} ${br}` : '',
    `H${bl}`, bl ? `a${bl} ${bl} 0 0 1 -${bl} -${bl}` : '',
    `V${tl}`, tl ? `a${tl} ${tl} 0 0 1 ${tl} -${tl}` : '',
    'z',
  ].join('');
}

function dataModules(idPrefix) {
  let out = '';
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!on(r, c)) continue;
      const up = on(r - 1, c), down = on(r + 1, c), left = on(r, c - 1), right = on(r, c + 1);
      const mask = (!up && !left ? 1 : 0) | (!up && !right ? 2 : 0) | (!down && !right ? 4 : 0) | (!down && !left ? 8 : 0);
      out += `<use href="#${idPrefix}t${mask}" x="${(c + QUIET) * M}" y="${(r + QUIET) * M}"/>`;
    }
  }
  return out;
}

const tileDefs = (idPrefix) =>
  Array.from({ length: 16 }, (_, m) => `<path id="${idPrefix}t${m}" d="${tile(m)}" fill="${INK}"/>`).join('');

/**
 * A finder pattern, drawn as three concentric rounded squares so the
 * 1:1:3:1:1 ratio a scanner looks for is preserved exactly.
 */
function eye(rowOffset, colOffset, bg) {
  const x = (colOffset + QUIET) * M, y = (rowOffset + QUIET) * M;
  return `
    <rect x="${x}" y="${y}" width="${M * 7}" height="${M * 7}" rx="14" fill="${INK}"/>
    <rect x="${x + M}" y="${y + M}" width="${M * 5}" height="${M * 5}" rx="10" fill="${bg}"/>
    <rect x="${x + M * 2}" y="${y + M * 2}" width="${M * 3}" height="${M * 3}" rx="7" fill="${EYE_GREEN}"/>`;
}

function badge() {
  const x = (b0 + QUIET) * M, y = (b0 + QUIET) * M, s = BADGE * M;
  const cx = x + s / 2, cy = y + s / 2;
  return `
    <rect x="${x - 2}" y="${y - 2}" width="${s + 4}" height="${s + 4}" rx="${M * 2}" fill="${CARD}"/>
    <rect x="${x + 3}" y="${y + 3}" width="${s - 6}" height="${s - 6}" rx="${M * 1.6}" fill="${INK}"/>
    <circle cx="${cx}" cy="${cy}" r="${s * 0.28}" fill="${GREEN}"/>
    <path d="M${cx - s * 0.13} ${cy} l${s * 0.09} ${s * 0.1} l${s * 0.18} -${s * 0.21}"
          fill="none" stroke="${INK}" stroke-width="${s * 0.075}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

const codeArt = (bgFill, idPrefix = '') => `
  <defs>${tileDefs(idPrefix)}</defs>
  ${bgFill ? `<rect width="${side}" height="${side}" rx="${M * 4}" fill="${bgFill}"/>` : ''}
  ${dataModules(idPrefix)}
  ${eye(0, 0, bgFill || CARD)}${eye(0, N - 7, bgFill || CARD)}${eye(N - 7, 0, bgFill || CARD)}
  ${badge()}`;

// ---------- 1. the code on its own ----------
const plain = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" width="${side}" height="${side}" role="img" aria-label="QR code for ${URL_}">
  <title>Make It Green — scan to play</title>${codeArt(CARD)}
</svg>
`;
mkdirSync(join(ROOT, 'qr'), { recursive: true });
writeFileSync(join(ROOT, 'qr', 'make-it-green-qr.svg'), plain);

// ---------- 2. the A4 poster ----------
/**
 * The poster embeds its own fonts so it prints identically anywhere, with no
 * network and no font installed. Downloads are cached in qr/.fonts.json,
 * which is ignored by git.
 */
const FONTS = {
  'Bricolage Grotesque|800': 'https://fonts.gstatic.com/s/bricolagegrotesque/v9/3y9H6as8bTXq_nANBjzKo3IeZx8z6up5BeSl9D4dj_x9PpZBMnuECoAsyJBOm_OJ2iCwA1XphjhQYg.woff2',
  'Instrument Sans|600': 'https://fonts.gstatic.com/s/instrumentsans/v4/pximypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr-yp2JGEJOH9npSQb_jfykywN2u7ZWwU.woff2',
  'JetBrains Mono|500': 'https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8-qxTOlOVk6OThhvA.woff2',
};
const cacheFile = join(ROOT, 'qr', '.fonts.json');
let cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : {};
let faces = '';
try {
  for (const [key, url] of Object.entries(FONTS)) {
    if (!cache[key]) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} fetching ${key}`);
      cache[key] = Buffer.from(await res.arrayBuffer()).toString('base64');
    }
  }
  writeFileSync(cacheFile, JSON.stringify(cache));
  faces = Object.entries(cache).map(([k, b64]) => {
    const [family, weight] = k.split('|');
    return `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
  }).join('');
} catch (err) {
  console.warn(`Could not embed fonts (${err.message}). The poster will use system fonts instead.`);
}

const W = 2100, H = 2970;               // A4 portrait at 0.1mm per unit
const qrSize = 1150;
const qrX = (W - qrSize) / 2, qrY = 1010;
const scale = qrSize / side;

const poster = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="210mm" height="297mm">
  <title>Make It Green — scan to play</title>
  <defs>
    <style>${faces}
      .display{font-family:'Bricolage Grotesque',system-ui,sans-serif;font-weight:800;}
      .body{font-family:'Instrument Sans',system-ui,sans-serif;font-weight:600;}
      .mono{font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:500;}
    </style>
    <pattern id="dots" width="46" height="46" patternUnits="userSpaceOnUse">
      <circle cx="2.2" cy="2.2" r="2.2" fill="${INK}" opacity="0.07"/>
    </pattern>
  </defs>

  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>

  <!-- card, with the chunky offset shadow the game uses -->
  <rect x="146" y="176" width="1808" height="2648" rx="70" fill="${INK}"/>
  <rect x="130" y="160" width="1808" height="2648" rx="70" fill="${CARD}" stroke="${INK}" stroke-width="9"/>

  <text class="display" x="${W / 2}" y="390" font-size="86" fill="${INK}" text-anchor="middle">make it <tspan fill="${GREEN}">green</tspan></text>
  <rect x="${W / 2 - 90}" y="440" width="180" height="9" rx="4" fill="${GOLD}"/>

  <text class="display" x="${W / 2}" y="680" font-size="210" fill="${INK}" text-anchor="middle" letter-spacing="-6">Scan to play</text>
  <text class="body" x="${W / 2}" y="800" font-size="72" fill="#6B7194" text-anchor="middle">Ten questions about software testing.</text>
  <text class="body" x="${W / 2}" y="890" font-size="72" fill="#6B7194" text-anchor="middle">Five minutes. No sign-up.</text>

  <g transform="translate(${qrX} ${qrY}) scale(${scale})">${codeArt(CARD, 'p')}</g>

  <!-- prize -->
  <rect x="300" y="2265" width="1500" height="150" rx="46" fill="${GOLD}" stroke="${INK}" stroke-width="8"/>
  <text class="display" x="${W / 2}" y="2363" font-size="66" fill="${INK}" text-anchor="middle">Score 1000 or more, win a chocolate</text>

  <text class="mono" x="${W / 2}" y="2560" font-size="52" fill="${INK}" text-anchor="middle">${URL_.replace('https://', '')}</text>

  <g opacity="0.75">
    <circle cx="740" cy="2690" r="13" fill="${GREEN}"/>
    <text class="body" x="775" y="2706" font-size="46" fill="#6B7194">10 questions</text>
    <circle cx="1080" cy="2690" r="13" fill="${GOLD}"/>
    <text class="body" x="1115" y="2706" font-size="46" fill="#6B7194">one shot each</text>
    <circle cx="1440" cy="2690" r="13" fill="#FF5A5F"/>
    <text class="body" x="1475" y="2706" font-size="46" fill="#6B7194">beat the clock</text>
  </g>
</svg>
`;
writeFileSync(join(ROOT, 'qr', 'make-it-green-poster.svg'), poster);
console.log(`QR: ${N}x${N} modules, level H → qr/make-it-green-qr.svg and qr/make-it-green-poster.svg`);
