# QR artwork

Scan targets **https://navneet2123.github.io/make-it-green/**

| File | Use it for |
| --- | --- |
| `make-it-green-poster.pdf` | **Printing.** A4 portrait with the workonmymachine logo, fonts embedded, the code drawn as vector paths. Send straight to a printer or a print shop. |
| `make-it-green-poster.svg` | The same poster without the logo, if you want to edit it in a design tool. |
| `make-it-green-qr.svg` | Slides, docs, email signatures. Vector, so it stays sharp at any size. |
| `make-it-green-qr.png` | Chat, Slack, anywhere that will not take an SVG. 2048 x 2048. |
| `logo.png` | The workonmymachine mark, trimmed, as used on the poster. |

Regenerate after changing the URL or the styling:

```bash
npm run qr      # the SVGs
npm run qr:pdf  # the printable PDF

# or point either at a different URL
node scripts/make-qr.mjs https://example.com
node scripts/make-qr-pdf.mjs https://example.com
```

Both scripts download the fonts they need on first run and cache them in `qr/`
(ignored by git), so the committed artwork needs nothing installed to view.

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

The PDF is the one to print. Any size from about 3cm across upward scans fine. For a poster people read from
across a room, A4 or larger is comfortable. Keep the white margin around the
code, it is part of how scanners find it.
