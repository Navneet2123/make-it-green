# QR artwork

Scan targets **https://navneet2123.github.io/make-it-green/**

| File | Use it for |
| --- | --- |
| `make-it-green-poster.svg` | Printing. A4 portrait, fonts embedded, no network needed. Send straight to a printer or open in any browser and print. |
| `make-it-green-qr.svg` | Slides, docs, email signatures. Vector, so it stays sharp at any size. |
| `make-it-green-qr.png` | Chat, Slack, anywhere that will not take an SVG. 2048 x 2048. |

Regenerate after changing the URL or the styling:

```bash
npm run qr                                   # uses the published URL
node scripts/make-qr.mjs https://example.com # or any other URL
```

## Before you change the colours

The code is decode-tested, and one rule keeps it that way: **the three eye
centres must stay dark.** A scanner converts the image to pure black and white
at roughly 50% brightness before reading it. The brand green `#19C37D` sits just
above that line, so scanners see those squares as white and the code stops
resolving at anything larger than a thumbnail. The artwork uses `#0E8A57`
instead, the same green the game uses for PASS text, which is comfortably below
the line.

If you pick a different colour, keep its luma under about 110:

```
luma = 0.299 x red + 0.587 x green + 0.114 x blue
```

Rounded modules, rounded eyes and the badge in the middle are all safe. The
badge works because the code is generated at error-correction level H, which
can rebuild about 30% of a damaged code, and the badge covers under 4%.

## Printing

Any size from about 3cm across upward scans fine. For a poster people read from
across a room, A4 or larger is comfortable. Keep the white margin around the
code, it is part of how scanners find it.
