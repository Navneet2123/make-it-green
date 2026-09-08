# 🟢 Make It Green

> Five tiny levels. Five minutes. You'll walk away knowing what test automation actually is.

**Make It Green** is a small, beautiful, Duolingo-style game that teaches the basics of software
test automation to complete beginners. The whole game *is* a test run: a strip of test dots fills
green or red as you play, and you finish with a shareable test report.

It is the 5-minute companion to [AUTO: The Automation Mission](https://github.com/Navneet2123/auto-automation-mission),
a 30–45 minute 3D adventure on the same topic.

- ⏱️ 14 quick interactions, about 4–5 minutes
- 📱 Designed for phones first, lovely on desktop
- 🧠 Every level teaches by *doing*: sort, order, tap, judge, fix
- 🔁 Wrong answers always show the right one with a one-line reason
- 🔇 Synthesised sound with a mute button, no assets to download
- 💾 Refreshing the page never loses your run

---

## Run it on your computer

### Requirements

| Tool | Version | Check with |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | 18 or newer (20 LTS recommended) | `node -v` |
| npm | 9 or newer (comes with Node) | `npm -v` |
| Browser | Any modern browser | — |

### Steps

```bash
# 1. Get the code
git clone https://github.com/Navneet2123/make-it-green.git
cd make-it-green

# 2. Install dependencies (once)
npm install

# 3. Play
npm run dev
```

Open **http://localhost:5174** and press **▶ Start the run**.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Type-check and build a static site into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript only |

---

## How to play

Tap. That's it. Each level has two to four tests. Press **Run test** to check your answer, read the
one-line explanation, press **Continue** (or **Enter**). Get one wrong and you get a nudge and a
second try; the verdict says **You got it** or **Not quite**, while PASS and FAIL are reserved for
what the robot's own check would say.

| Level | You do | You learn |
| --- | --- | --- |
| 1 · Spot the repeat | Tap the tasks a robot should take over | **Automation** |
| 2 · Build the script | Tap steps into the right order | **Script** |
| 3 · Find it | Tap the element a locator points to on a mini web page | **Locator, XPath** |
| 4 · Pass or fail | Judge expected vs actual, fast | **Assertion** |
| 5 · Fix the bug | Read the failing run and pick the fix | **Debugging** |

You earn 10 XP per test you get right first time (5 after a retry), +5 while on a streak of three or more. The report gives you a rank
from *Curious Human* to *Green Suite Legend*, and **Copy result** puts a text summary on your clipboard.

---

## Edit the questions

All content is data in [`src/lib/content.ts`](src/lib/content.ts). Each level has a title, a story,
a concept and a list of items. Six item kinds are supported:

| Kind | Fields |
| --- | --- |
| `sort` | `cards[{ text, robot }]` — player taps the ones a robot should do |
| `choice` | `options[]`, `answer` |
| `order` | `steps[]` in the correct order, optional `interchangeable` groups |
| `locate` | `locator`, `target` (one of `email`, `password`, `login`, `forgot`, `signup`) |
| `judge` | `expected`, `actual`, `pass` |
| `fix` | `script[]`, `brokenLine`, `output`, `fixes[]`, `answer` |

Every item has an `explain` line shown after the answer. Add, remove or reorder items and levels
freely; the progress strip, XP and report adapt.

---

## Project structure

```
src/
├── App.tsx              Screens: intro, level card, play, feedback sheet, report
├── styles.css           Design tokens and all styling
├── components/
│   ├── Items.tsx        The six interaction types
│   └── RunStrip.tsx     The test-dot progress strip
└── lib/
    ├── content.ts       Levels and questions (edit me)
    ├── game.ts          Game state reducer, XP, timing
    └── audio.ts         Tiny Web Audio synth
docs/
└── AI-DLC.md            How this was built: inception, construction, operations
```

Stack: Vite, React 18, TypeScript, framer-motion. No backend.

## Design

- Palette: periwinkle mist background, ink text, pass green, fail coral, XP yellow.
- Type: Bricolage Grotesque for headlines, Instrument Sans for body, JetBrains Mono for anything
  that is code, because scripts and locators *are* code.
- Chunky tactile controls with hard shadows that press down. One entrance animation per screen, a
  bounce on PASS, a shake on FAIL, confetti on a good report. Reduced-motion is respected.

See [docs/AI-DLC.md](docs/AI-DLC.md) for the full brief, the development life cycle, and the
independent zero-knowledge playtest review that shaped v1.1.

## Deploy

`npm run build` produces a static `dist/` folder for GitHub Pages, Netlify, Vercel or any web
server. For a sub-path deployment (for example `https://user.github.io/make-it-green/`), set
`base: '/make-it-green/'` in `vite.config.ts` before building.

## License

[MIT](LICENSE)
