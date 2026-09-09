# 🟢 Make It Green

> Ten questions. One shot each. A timer on every one. Get the build to production.

**Make It Green** is a fast, beautiful, KBC-style quiz that teaches the basics of software test
automation. Every correct answer promotes your build one stage up a pipeline, from **Commit** to
**Production**. Get one wrong, or run out of time, and the pipeline goes red.

It is the 5-minute companion to [AUTO: The Automation Mission](https://github.com/Navneet2123/auto-automation-mission),
a 30–45 minute 3D adventure on the same topic.

- 🍫 **Points and a prize bar.** Score 1000 or more and you have earned a chocolate
- ⏱️ **Animated countdown** on every question, 30 seconds down to 20 as it gets harder
- 🔒 **One attempt.** Pick an answer, lock it in, live with it
- 🎲 **Random questions** drawn from a bank of 25, with the options shuffled too
- 📈 **Rising difficulty:** easy → medium → hard as you climb
- ✂️ **Three lifelines:** Bisect, Ask the team, Rerun
- 🔐 **Checkpoints** at stages 3 and 7, so a late mistake does not erase everything
- ⟲ **Restart any time** from the header, with a confirm so you never lose a run by accident
- 📱 Phone-first, no sign-up, no backend, no assets to download

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
git clone https://github.com/Navneet2123/make-it-green.git
cd make-it-green
npm install
npm run dev
```

Open **http://localhost:5174** and press **▶ Start the pipeline**.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Type-check and build a static site into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript only |

---

## How to play

1. Read the question. The tier badge tells you how hard it is, the ring tells you how long you have.
2. Tap an answer. It turns gold. Nothing is final yet.
3. Press **🔒 Lock it in**. The screen holds for a beat, then the correct answer goes green and yours goes red if it was not.
4. Right answer → your build is promoted. Wrong answer, or the clock hits zero → the run ends.

Keyboard: **A**–**D** to pick, **Enter** to lock and to continue.

Your running score sits beside the stage name, and your best score is remembered on this device.

### The pipeline

| Stage | Tier | Time | Points |
| --- | --- | --- | --- |
| 1 Commit | easy | 30s | 50 |
| 2 Lint | easy | 30s | 100 |
| 3 Build ⚑ | easy | 30s | 150 |
| 4 Unit tests | easy | 25s | 200 |
| 5 Integration | medium | 25s | 300 |
| 6 API tests | medium | 25s | 400 |
| 7 End-to-end ⚑ | medium | 22s | 500 |
| 8 Staging | hard | 20s | 700 |
| 9 Smoke test | hard | 20s | 900 |
| 10 Production | hard | 20s | 1200 |

⚑ marks a safe point. Clear it and that score is yours even if a later question ends the run.

### Scoring and the chocolate

- Each correct answer earns the stage's points, plus a **speed bonus** of up to 50% for answering fast.
- **Score 1000 or more and you have earned a chocolate.** That is roughly the easy tier plus one medium question.
- A slim bar above every question shows your score and how far the chocolate is, and crossing 1000 takes over the screen so the whole room knows. The final report says plainly whether it was earned. **Copy result** puts the score and verdict on the clipboard so a player can show or send their claim.
- A perfect, fast run scores **6750**.

To make the prize easier or harder, change `PASS_SCORE` in [`src/lib/content.ts`](src/lib/content.ts). Point values per stage and the `SPEED_BONUS` share live there too.

### Restarting

Press **⟲ New player** in the header at any time to start a completely fresh run. The clock pauses while the dialog is open. It asks for confirmation and tells you the score you are about to lose, so a mis-tap during a timed question cannot wipe your progress.

### Lifelines (once each per run)

| Lifeline | What it does |
| --- | --- |
| ✂ **50:50** | Drops two wrong answers |
| 👥 **Ask the team** | Shows how the team would vote. They are usually right |
| ↻ **Swap question** | A different question of the same difficulty, and a fresh clock |

---

## What it teaches

Nine ideas, all through questions you answer rather than text you read:

**Automation** · **Manual vs automated testing** · **Test case** · **Script** · **Locator** ·
**XPath** · **Assertion** · **Pass / fail** · **Debugging**

Every question, right or wrong, shows a one-line explanation before you move on. The report marks
which ideas you actually got right.

---

## Edit or add questions

All content is data in [`src/lib/content.ts`](src/lib/content.ts). A question looks like this:

```ts
{ id: 'm1', tier: 'medium', concept: 'Locator',
  q: 'What does the locator #login point to?',
  options: ['Any element containing the word login', 'The element whose id is login',
            'The first button on the page', 'A comment in the code'],
  answer: 1,
  explain: '# means "the thing whose id is…". Ids are unique, which makes them reliable addresses.' }
```

Rules: exactly four options, `answer` is the index of the correct one, `tier` is `easy`, `medium`
or `hard`. Add as many as you like — each run draws a random selection, so a bigger bank simply
means more variety. The ladder itself (`LADDER`) is data too: rename stages, change the timers, or
move the checkpoints.

---

## Project structure

```
src/
├── App.tsx                Screens: intro, question, reveal, stage clear, report
├── styles.css             Design tokens and all styling
├── components/
│   ├── Timer.tsx          SVG countdown ring with the seconds animating inside
│   ├── Ladder.tsx         The pipeline: compact rail while playing, full list elsewhere
│   └── Question.tsx       MCQ card, options, poll bars, lifeline bar
└── lib/
    ├── content.ts         Question bank, ladder, points, pass mark, random draw (edit me)
    ├── game.ts            Reducer: lock, reveal, promote, scoring, checkpoints, game over
    └── audio.ts           Tiny Web Audio synth (ticks, lock, suspense, chimes)
docs/
└── AI-DLC.md              How this was built, the beginner playtest, and the KBC rework
```

Stack: Vite, React 18, TypeScript, framer-motion. No backend.

## Design

- Palette: periwinkle mist background, ink navy, pass green, fail coral, quiz gold.
- Type: Bricolage Grotesque for headlines, Instrument Sans for body, JetBrains Mono for code.
- The question card is dark with a gold glow for the game-show drama; everything around it stays
  light and calm. Chunky controls with hard shadows that press down. Reduced motion is respected.

See [docs/AI-DLC.md](docs/AI-DLC.md) for the full development life cycle: the brief, two independent
zero-knowledge playtests by reviewers who had never seen the game, and the team reviews that produced
this format.

## Deploy

`npm run build` produces a static `dist/` folder for GitHub Pages, Netlify, Vercel or any web
server. For a sub-path deployment, set `base: '/make-it-green/'` in `vite.config.ts` first.

## License

[MIT](LICENSE)
