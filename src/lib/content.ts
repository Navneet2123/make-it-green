// KBC-style question bank. Every question is a 4-option MCQ, one attempt, one correct answer.
// Questions are drawn at random from the tier that matches the stage you are on.

export type Tier = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  tier: Tier;
  q: string;
  options: string[];
  answer: number;   // index into options
  explain: string;
  concept: string;
}

export interface Stage {
  n: number;        // 1-based rung
  name: string;
  tier: Tier;
  seconds: number;
  checkpoint?: boolean;
}

/** The ladder is a build pipeline. Every right answer promotes the build one stage. */
export const LADDER: Stage[] = [
  { n: 1, name: 'Commit', tier: 'easy', seconds: 30 },
  { n: 2, name: 'Lint', tier: 'easy', seconds: 30 },
  { n: 3, name: 'Build', tier: 'easy', seconds: 30, checkpoint: true },
  { n: 4, name: 'Unit tests', tier: 'easy', seconds: 25 },
  { n: 5, name: 'Integration', tier: 'medium', seconds: 25 },
  { n: 6, name: 'API tests', tier: 'medium', seconds: 25 },
  { n: 7, name: 'End-to-end', tier: 'medium', seconds: 22, checkpoint: true },
  { n: 8, name: 'Staging', tier: 'hard', seconds: 20 },
  { n: 9, name: 'Smoke test', tier: 'hard', seconds: 20 },
  { n: 10, name: 'Production', tier: 'hard', seconds: 20 },
];

export const BANK: Question[] = [
  // ---------------- EASY ----------------
  { id: 'e1', tier: 'easy', concept: 'Automation',
    q: 'Sam logs in and checks the dashboard 50 times a day, every day. Why is this worth automating?',
    options: ['It is repetitive and the steps never change', 'It is the hardest part of testing', 'Robots enjoy it', 'It uses less electricity'],
    answer: 0, explain: 'Repetitive, predictable work is exactly what a computer does well: the same steps, the same way, every time.' },
  { id: 'e2', tier: 'easy', concept: 'Automation',
    q: 'In one line, what is test automation?',
    options: ['Clicking through the app faster', 'Getting a computer to run test steps for you', 'Writing fewer tests', 'Testing only after release'],
    answer: 1, explain: 'A computer repeats the steps you taught it, without getting tired or bored. That is the whole idea.' },
  { id: 'e3', tier: 'easy', concept: 'Manual vs automated',
    q: 'Which job should stay with a human?',
    options: ['Filling a form with 200 email addresses', 'Logging in after every code change', 'Deciding whether the new checkout screen feels confusing', 'Checking 50 product pages load'],
    answer: 2, explain: 'Judgement and taste stay human. Repetition goes to the robot.' },
  { id: 'e4', tier: 'easy', concept: 'Script',
    q: 'What is a test script?',
    options: ['A bug report', 'A screenshot of the app', 'The name of the tester', 'The list of steps the tool follows, in order'],
    answer: 3, explain: 'Open, type, click, check. A script is just that list, and the robot follows it top to bottom.' },
  { id: 'e5', tier: 'easy', concept: 'Locator',
    q: 'A robot cannot see the screen. So how does it find the Log in button?',
    options: ['By an address called a locator', 'By taking a photo', 'By guessing where it usually sits', 'It asks the user'],
    answer: 0, explain: 'Every button and box has a code name. The address built from it is called a locator.' },
  { id: 'e6', tier: 'easy', concept: 'Test case',
    q: 'What is a test case?',
    options: ['A folder of screenshots', 'The steps to perform plus the result you expect', 'A list of known bugs', 'The box the software ships in'],
    answer: 1, explain: 'Steps plus expected result. Without the expected result you are just clicking around.' },
  { id: 'e7', tier: 'easy', concept: 'Automation',
    q: 'The login test is now automated. What changes for Sam?',
    options: ['He stops testing entirely', 'He runs the same test twice as often by hand', 'He spends his time on the tests that need judgement', 'Nothing changes'],
    answer: 2, explain: 'Automation does not replace testers. It hands them back the hours the robot can cover.' },
  { id: 'e8', tier: 'easy', concept: 'Automation',
    q: 'Which is the strongest sign a test is worth automating?',
    options: ['It runs after every single code change', 'It was written last week', 'Nobody on the team understands it', 'It will only ever run once'],
    answer: 0, explain: 'The more often a check repeats, the more a robot saves you. A one-off check is rarely worth the setup.' },

  // ---------------- MEDIUM ----------------
  { id: 'm1', tier: 'medium', concept: 'Locator',
    q: 'What does the locator #login point to?',
    options: ['Any element containing the word login', 'The element whose id is login', 'The first button on the page', 'A comment in the code'],
    answer: 1, explain: '# means "the thing whose id is…". Ids are meant to be unique, which makes them reliable addresses.' },
  { id: 'm2', tier: 'medium', concept: 'XPath',
    q: "What does //input[@name='password'] find?",
    options: ['A text box whose name is password', 'Every input on the page', 'The word "password" wherever it appears', 'A link called password'],
    answer: 0, explain: "// = anywhere on the page · input = a text box · [@name='password'] = named password." },
  { id: 'm3', tier: 'medium', concept: 'Assertion',
    q: 'What is an assertion?',
    options: ['A click on a button', 'A comment explaining the test', 'A check that the actual result matches what you expected', 'The time the test took to run'],
    answer: 2, explain: 'Expected versus actual. The assertion is the moment a test decides pass or fail.' },
  { id: 'm4', tier: 'medium', concept: 'Assertion',
    q: 'A test performs every step but never checks anything. What is wrong with it?',
    options: ['It can never fail, so it proves nothing', 'It runs too fast', 'It uses too much memory', 'Nothing, that is a normal test'],
    answer: 0, explain: 'A test with no assertion is a green light that means nothing. It would pass even if the app were broken.' },
  { id: 'm5', tier: 'medium', concept: 'Pass / fail',
    q: 'Expected: "Cart has 1 item". Actual: "Cart has 0 items". What does the test do?',
    options: ['Pass', 'Fail', 'Retry quietly', 'Skip itself'],
    answer: 1, explain: 'One is not zero, so the assertion fails. That red result is the test doing its job.' },
  { id: 'm6', tier: 'medium', concept: 'Locator',
    q: 'Which locator is most likely to still work after the page is redesigned?',
    options: ['The text "Log in"', 'id="login"', 'The third button from the top', "The button's colour"],
    answer: 1, explain: 'Text gets reworded and positions move. An id is chosen by developers and usually survives a redesign.' },
  { id: 'm7', tier: 'medium', concept: 'Debugging',
    q: 'A test clicks Login, checks the dashboard immediately, and fails because the page was still loading. What is missing?',
    options: ['A wait for the page to be ready', 'A faster computer', 'A second click', 'A screenshot'],
    answer: 0, explain: 'Robots are fast. Waiting for the page before checking is one of the most common fixes in automation.' },
  { id: 'm8', tier: 'medium', concept: 'Script',
    q: 'Which is the right order for a login script?',
    options: ['Check → open → type → click', 'Type → check → open → click', 'Open → type → click → check', 'Click → check → type → open'],
    answer: 2, explain: 'Actions first, check last. You cannot check a dashboard you have not opened yet.' },
  { id: 'm9', tier: 'medium', concept: 'XPath',
    q: 'What is XPath?',
    options: ['A way to write a locator as a path to an element', 'A programming language', 'A kind of bug', 'A test report format'],
    answer: 0, explain: 'XPath describes a path: what kind of thing, and which one. //button[@id=\'login\'] is a button with id login.' },

  // ---------------- HARD ----------------
  { id: 'h1', tier: 'hard', concept: 'Assertion',
    q: 'Expected: "Welcome, Sam". Actual: "Welcome, sam". What happens?',
    options: ['It passes, the meaning is the same', 'It passes with a warning', 'It fails, to a robot those are different words', 'The test is skipped'],
    answer: 2, explain: 'Robots are literal. A lowercase s makes it a different word, so the assertion fails.' },
  { id: 'h2', tier: 'hard', concept: 'Debugging',
    q: 'A test goes red. You try the app by hand and it works perfectly. Most likely cause?',
    options: ['The test itself is wrong', 'The app is broken anyway', 'The internet is down', 'The test should be deleted'],
    answer: 0, explain: 'Tests have bugs too: a typo in a locator, a misspelled expected value, a missing wait.' },
  { id: 'h3', tier: 'hard', concept: 'Locator',
    q: 'Why is //div[3]/span[2]/button a poor locator?',
    options: ['It is too short', 'Any small layout change breaks it', 'It only works in one browser', 'It is not valid XPath'],
    answer: 1, explain: 'It describes a position, not a thing. Move one element and the address points somewhere else.' },
  { id: 'h4', tier: 'hard', concept: 'Debugging',
    q: 'A test passes sometimes and fails other times, with no change to the code. What is that called?',
    options: ['A unit test', 'A smoke test', 'A flaky test', 'A passing test'],
    answer: 2, explain: 'Flaky tests are usually a timing problem. They are dangerous because the team stops trusting red.' },
  { id: 'h5', tier: 'hard', concept: 'Debugging',
    q: 'A test just failed. What is the first thing to do?',
    options: ['Read the error and find which step broke', 'Delete the test', 'Run it ten more times', 'Release anyway'],
    answer: 0, explain: 'Read, locate, fix, run again. The error message almost always names the step and the reason.' },
  { id: 'h6', tier: 'hard', concept: 'Automation',
    q: 'Which of these is NOT worth automating?',
    options: ['The login flow', 'A one-off check you will never run again', 'The checkout flow', 'A form with 50 fields'],
    answer: 1, explain: 'Automation costs time to write. It pays back on repetition, so a single check is cheaper by hand.' },
  { id: 'h7', tier: 'hard', concept: 'Pass / fail',
    q: 'Your suite has 500 tests and 3 are red. What should the team do before releasing?',
    options: ['Release, 497 passed', 'Delete the 3 failing tests', 'Rerun until they go green', 'Find out why those 3 are red'],
    answer: 3, explain: 'Three red tests are three questions to answer. Ignoring red is how teams stop trusting their suite.' },
  { id: 'h8', tier: 'hard', concept: 'Debugging',
    q: 'What does debugging mean in test automation?',
    options: ['Finding the broken step, fixing it, running again', 'Removing every bug from the app forever', 'Writing more tests', 'Renaming the failing test'],
    answer: 0, explain: 'Read the error, find the step, fix it, rerun. Repeat until the run is green.' },
];

export const RANKS = [
  { min: 0, name: 'Build Failed', line: 'Everyone starts here. The next run picks different questions.' },
  { min: 3, name: 'Junior Tester', line: 'You got the build compiling. You know what automation is for.' },
  { min: 5, name: 'QA Engineer', line: 'Scripts, locators, assertions. You could explain these to a friend.' },
  { min: 8, name: 'Automation Engineer', line: 'You made it to staging. Locators, waits and flaky tests hold no fear.' },
  { min: 10, name: 'Release Manager', line: 'Shipped to production with every test green. Sam would like to hire you.' },
];

export const CONCEPTS = ['Automation', 'Manual vs automated', 'Test case', 'Script', 'Locator', 'XPath', 'Assertion', 'Pass / fail', 'Debugging'];

/** Fisher-Yates with a seed so a run is reproducible within itself. */
export function shuffle<T>(arr: T[], seed = Math.random() * 1e9): T[] {
  const a = [...arr];
  let s = Math.floor(seed) % 2147483647;
  if (s <= 0) s += 2147483646;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export interface Drawn { question: Question; order: number[]; answer: number }

/** Pick one random unused question of a tier, and shuffle its options. */
export function draw(tier: Tier, used: Set<string>): Drawn {
  const pool = BANK.filter((q) => q.tier === tier && !used.has(q.id));
  const source = pool.length ? pool : BANK.filter((q) => q.tier === tier);
  const question = shuffle(source)[0];
  const order = shuffle([0, 1, 2, 3]);
  return { question, order, answer: order.indexOf(question.answer) };
}
