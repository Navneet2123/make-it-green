# AI-Driven Development Life Cycle — Make It Green

This project was built following an AI-DLC: short, explicit phases where the AI proposes,
the human steers, and every phase leaves an artifact in the repo.

## 1. Inception (what and why)

**Problem.** Visitors to the TechUnpacked project should understand *what test automation is*
in the time it takes to drink a coffee. The earlier 3D game (AUTO: The Automation Mission) is
30–45 minutes; this needs to be **5 minutes, on a phone, no instructions**.

**Users.** Curious non-testers, students, colleagues. Zero prior knowledge assumed.

**Job of the product.** Play five tiny levels, each teaching one idea by doing, and finish with a
"test report" you can share.

**Success criteria**
- A first-time player finishes in ≤ 5 minutes (14 interactions).
- Every level teaches by an *action*, not by reading: sorting, ordering, tapping an element, judging, fixing.
- Wrong answers always show the right one plus a one-line reason.
- Beautiful on a phone; keyboard accessible; respects reduced motion.
- Zero backend, zero accounts, zero assets to download beyond fonts.

**Scope (in / out)**
- In: 5 levels, progress strip, streaks, XP, report, share-as-text, replay, sound with mute.
- Out: logins, leaderboards, hearts/lives, long explanations, more than one screen at a time.

**Concepts covered.** Automation → Script → Locator & XPath → Assertion (pass/fail) → Debugging.

## 2. Construction (how)

**Stack.** Vite + React + TypeScript + framer-motion. Single page, ~10 components, one CSS file
with design tokens. Sound via Web Audio (synthesised, no files).

**Design brief → decisions**
- Subject-grounded signature: the whole game is *a test run*. A **run strip** of test dots across
  the top fills green or red as you play, and the final screen is a **test report**
  (`14 tests · 12 passed · 2 failed · 3m 41s`).
- Palette: periwinkle mist `#EEF0FA` background, ink `#1B1F3B`, pass green `#19C37D`,
  fail coral `#FF5A5F`, XP yellow `#FFD23F`, muted `#6B7194`. Deliberately not the
  cream-and-serif or black-and-acid defaults.
- Type: **Bricolage Grotesque** (display, wide and friendly) + **Instrument Sans** (body) +
  **JetBrains Mono** (scripts and locators, because the content *is* code).
- Chunky tactile controls: 2px ink borders, 4px hard shadows that collapse on press.
- Motion: one entrance per card, a bounce on PASS, a shake on FAIL, confetti on the report. Nothing ambient.

**Level mechanics**

| Level | Mechanic | Teaches |
| --- | --- | --- |
| 1 Spot the repeat | Tap the tasks a robot should do | Automation |
| 2 Build the script | Tap steps into the right order | Script |
| 3 Find it | Tap the element a locator points to on a mini page | Locator, XPath |
| 4 Pass or fail | Judge expected vs actual, fast | Assertion |
| 5 Fix the bug | Read the run output, tap the correct fix | Debugging |

**Quality gates.** `npm run typecheck`, a scripted browser play-through of every level (both
correct and wrong paths), visual review on a 390px-wide viewport, production build.

## 3. Operations (run and share)

- `npm run dev` for local play, `npm run build` for a static `dist/` deployable anywhere.
- README documents setup, play, content editing (all questions live in `src/lib/content.ts`).
- Published as an open GitHub repository.

## 4. Human review (separate reviewer, zero prior knowledge)

A second, independent agent played the game end to end on a 390×844 phone viewport as
**"Priya, 29, marketing, has never heard the phrase test automation"**, deliberately making
mistakes, and wrote a structured review. Scores before fixes: **beauty 6/10, clarity 7/10**.
In her own words afterwards she could explain automation, script, locator, assertion and
debugging — the learning goal held. Her top findings and what changed:

| Finding | Change |
| --- | --- |
| "PASS/FAIL" used for both *me* and *the robot's check* on the same screen (Level 4, 5) | Verdict is now **"✓ You got it" / "✗ Not quite"**; PASS/FAIL is reserved for the robot's test. Judge buttons say "It passes / It fails". |
| Header overflows at 390px: sound button cut in half, pills touch the top edge | Compact strip (smaller dots, shrinkable), safe-area top padding, fixed-size buttons, file name truncates instead of wrapping. |
| Level 2 says "Correct order shown in green" but shows *my* order | On a miss the real order is listed in a green box; caption only appears when everything is right. |
| No way to undo a placed step | ✕ on each placed step plus "Tap a placed step to put it back." |
| "XPath", "element", "tag", "string" unexplained before being asked | Prompts now teach first, ask second ("Read it left to right: // = anywhere…"); "element" → "button or box"; "string" → "word"; inspector bar labelled **tag**. |
| One slip = hard FAIL, "the least Duolingo-like thing here" | One free retry with a specific nudge ("Close! One step is out of place…"). Retried passes earn 5 XP and do not extend the streak. |
| Level 5 wrong answer showed a green "✓ 5 passed" under a red verdict | Wrong fix now stays red with "Still red. Correct fix: …"; only the right fix turns the line green. |
| Report felt like a bad school report; copied text had no link | Headline is "10 of 14 green", partial levels show ◐ in yellow, kinder copy, share text includes the play link. |
| Result sheet covered content / clipped text | Sheet scrolls if tall, page gets bottom padding while a sheet is open, long text wraps. |

## 5. Team review → v2.0 (KBC format)

A team member reviewed v1.1 and asked for a different format:

> "Attach a timer with inside animation and have a quiz which is made of only MCQ nothing else,
> and questions need to be random but have some difficulty level as going forward. It should be a
> single time to solve any specific quiz question, like KBC."

**Inception.** Five requirements, all structural: (1) an animated timer, (2) MCQ only, (3) random
questions, (4) rising difficulty, (5) one attempt per question. Taken together that is *Kaun Banega
Crorepati*: a ladder you climb, a clock on every question, lock your answer, no take-backs.

**Design decision — what is the ladder?** KBC climbs a money ladder. Money means nothing here, so
the ladder became the thing the game is already named after: **a build pipeline**. Every correct
answer promotes the build one stage, Commit → Lint → Build → … → Production. Getting one wrong
turns the pipeline red. The title finally means exactly what the game asks you to do.

**What changed**

| v1.1 | v2.0 |
| --- | --- |
| 6 interaction types (sort, order, locate, judge, fix, choice) | One type: 4-option MCQ |
| 14 fixed questions in a fixed order | 10 drawn at random from a bank of 25, options shuffled too |
| One flat difficulty | 3 tiers: easy (stages 1–4), medium (5–7), hard (8–10) |
| No timer | Animated countdown ring, 30s → 20s by tier, red pulse and ticking in the last 5s |
| One free retry per question | One attempt. Select, then **Lock it in**. No second chance |
| Wrong answers continue the run | Wrong or out of time ends the run, with checkpoints at stages 3 and 7 |
| — | 3 lifelines: **Bisect** (removes two wrong answers), **Ask the team** (poll), **Rerun** (swaps the question) |
| Fixed content, low replay value | Random draw makes every run different, so replaying is the point |

**Construction.** New `content.ts` (25 questions, 3 tiers, ladder definition, seeded shuffle),
new reducer with the lock/reveal/promote/game-over phases, `Timer.tsx` (SVG ring with the seconds
animating inside), `Ladder.tsx` (rail while playing, full list on the intro, stage-clear and report).
The dark question card with a gold glow keeps the KBC drama inside the existing periwinkle palette.

**Quality gates.** Type-check, then a scripted browser play-through at 390×844 of: a perfect 10/10
run to Production, a wrong answer at stage 2, a timeout with no answer selected, and all three
lifelines. Every path verified before release.

**Trade-off accepted.** The varied v1.1 mechanics were more distinctive as a learning device, but a
single format is faster to grasp, far more replayable, and is what the team asked for. v1.1 remains
in git history.

## 6. Follow-up review → v2.1 (points and restart)

Two more requests from the team:

> "Shouldn't the project have a restart button to start from scratch, and also have a points system,
> as we distribute chocolates to the people if they passed the quiz?"

The second one is the important one: the game is being played at a real event where a **chocolate is
the prize**, so the score has to answer one question unambiguously — *did this person pass?*

**Points.** Every stage is worth more than the last, KBC-style, and the values are printed on the
ladder so the stakes are visible before you answer: 50, 100, 150, 200, 300, 400, 500, 700, 900, 1200.
Answer quickly and you keep a speed bonus of up to 50% of the stage value, so the timer rewards
you as well as threatening you. A perfect, fast run scores 6750.

**The chocolate bar.** `PASS_SCORE = 1000`, which is roughly "clear the easy tier and one medium
question". A progress bar toward it appears after every stage, and the report ends with either
"🍫 Chocolate earned — show this screen to claim it" or how many points short you were. The copied
result includes the score and the verdict, so a claim can be shown or sent.

**Restart.** A ⟲ button sits in the header from the first question onward. It opens a confirm dialog
naming the score you are about to lose, because a mis-tap during a timed question would be
infuriating. The report's button is now labelled Restart too, so the wording matches everywhere.

Both are tuned in one place: `PASS_SCORE`, `SPEED_BONUS` and each stage's `points` live in
`src/lib/content.ts`, so the bar can be moved for an easier or harder chocolate.

## 7. Second independent review → v2.2

The KBC rebuild had only ever been tested by its author. A second reviewer agent played it cold as
**"Arjun, 24, a graphic designer who has never heard the phrase test automation and watches KBC with
his family"**, over three runs, and was told only what a player at the event would be told: *score
1000 and you win a chocolate*. Scores: **beauty 8/10, clarity 5/10**. He could explain automation and
locators back in his own words afterwards, and was honest that he had reverse-engineered "assertion"
from the feedback screens rather than being taught it.

His verdict on the core mechanic was the useful part: *"The two-step lock-in is the single best thing
in the game… I actually hesitated before pressing it."* And then: *"No drama at the moment of truth.
You press Lock it in and the answer just appears."*

### Bugs he found that the author's own testing missed

| Bug | Fix |
| --- | --- |
| The countdown kept running behind the restart dialog, killing a run while the dialog still offered "Keep playing" | A dialog now pauses the clock, and closes itself if the run ends underneath it |
| The timer snapped to **0** the instant you answered, so a fast answer looked identical to a timeout | The ring now freezes on the time you had left — the number that earned the bonus |
| The intro ladder was clipped at 232px with 493px of content and could not be scrolled, hiding stages 1–6 | Replaced with a single points scale, 50 → 1200, with the chocolate line marked on it |
| "Next: Lint" sat below the fold on every one of the ten between-stage screens | The continue button is now a sticky footer |
| "Different questions next run" was not true — a restart re-served the same question | Recent question ids are remembered across runs, and the opening pool was widened from 3 to 5 |

### Clarity fixes

- **The chocolate target vanished during play.** It only appeared between stages, where it was needed
  least. A slim bar now sits above every question: *"★ 661 · 🍫 339 more for a chocolate"*.
- **Winning the chocolate was smaller than the points popup.** Crossing 1000 now takes over the
  screen: 🍫, *"That's a chocolate."*, *"Whatever happens next, it is yours."*
- **Contradictory numbers on the report.** "★ 5910 / 6750" (6750 was never explained), "🔒2213 BANKED"
  on a perfect run, and the chocolate stated twice in 40 pixels. Now one score, one verdict, three stats.
- **Lifeline names were in a language only the authors speak.** "Bisect" → **50:50**, "Rerun" →
  **Swap question**, each with a visible one-line description instead of a `title` tooltip that no
  touchscreen ever shows. "Rerun" also collided with a wrong answer in one of the questions.
- **The restart button was an unlabelled 36px "⟲" that he never found**, and looked for at the bottom
  of the screen. It is now a 44px pill reading **⟲ New player** — because at an event, the person who
  needs it most is the next player in the queue.
- **The padlock meant four different things.** Checkpoints now use ⚑ and are called safe points; 🔒
  only ever means locking in an answer.
- **Stage names were mystique with no meaning** ("Lint especially. Is that the fluff from a pocket?").
  Every stage now carries a plain-English line: *Lint · the tidiness check*.
- **Raw code read as broken prose.** ``//input[@name='password']`` now renders as a monospace chip,
  and the XPath question introduces the word before asking.
- **Questions could assume a word not yet met.** Concept-introducing questions are flagged and drawn
  at stages 1–2.
- **One ambiguous question**: "A test goes red… most likely cause?" had "The test should be deleted"
  as an option, which is an action, not a cause. All four options are causes now.
- Best score is labelled **"Best on this device"** with a clear button, so a shared event screen does
  not greet each new player with a stranger's score.

Two of his points were left as they are: the "no sound" complaint is an artefact of the review
environment having no audio output (the sounds are synthesised and do fire), and the localhost URL in
the share text becomes the real URL once deployed.

## 8. Iteration log

- v1.0 — initial release: 5 levels, 14 tests, report, share, replay.
- v1.1 — human-review pass (see §4): retries, wording, phone header, order reveal, report tone, share link.
- v2.0 — team review (see §5): KBC format. MCQ only, animated timer, random questions, difficulty tiers, one attempt, pipeline ladder, lifelines.
- v2.1 — follow-up review (see §6): points per stage with speed bonus, chocolate pass mark at 1000, restart button with confirm.
- v2.2 — second independent playtest (see §7): suspense beat on lock-in, full-screen chocolate moment, always-visible target, paused dialog, frozen timer, sticky continue, plain-English stages and lifelines, no repeat questions.
