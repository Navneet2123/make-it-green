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

## 5. Iteration log

- v1.0 — initial release: 5 levels, 14 tests, report, share, replay.
- v1.1 — human-review pass (see §4): retries, wording, phone header, order reveal, report tone, share link.
