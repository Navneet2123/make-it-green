// All game content lives here. Edit freely: the engine renders whatever is described.

export type Item =
  | { kind: 'sort'; prompt: string; hint: string; cards: { text: string; robot: boolean }[]; explain: string }
  | { kind: 'choice'; prompt: string; options: string[]; answer: number; explain: string }
  | { kind: 'order'; prompt: string; steps: string[]; interchangeable?: number[][]; explain: string }
  | { kind: 'locate'; prompt: string; hint?: string; locator: string; target: string; explain: string }
  | { kind: 'judge'; expected: string; actual: string; pass: boolean; explain: string }
  | { kind: 'fix'; script: string[]; brokenLine: number; output: string; fixes: string[]; answer: number; explain: string };

export interface Level {
  id: string;
  file: string; // shown like a test file name
  title: string;
  concept: string;
  story: string;
  color: string;
  items: Item[];
}

export const LEVELS: Level[] = [
  {
    id: 'automation', file: 'what-is-automation.test', title: 'Spot the repeat', concept: 'Automation', color: '#19C37D',
    story: 'Sam tests the login page by hand. Fifty times a day. Which jobs should a robot take over?',
    items: [
      {
        kind: 'sort', prompt: 'Tap every task a robot should do.', hint: 'Robots love boring. Humans keep the judgement calls.',
        cards: [
          { text: 'Log in and check the dashboard — after every code change', robot: true },
          { text: 'Decide whether the new checkout design feels confusing', robot: false },
          { text: 'Fill the sign-up form with 200 different email addresses', robot: true },
          { text: 'Poke around the app looking for anything that feels odd', robot: false },
        ],
        explain: 'Repetitive and predictable → automate it. Judgement and exploration → keep a human on it.',
      },
      {
        kind: 'choice', prompt: 'So, in one line: what is test automation?',
        options: ['Getting a computer to run the repetitive test steps for you', 'Clicking through the app faster', 'Deleting the tests nobody likes'],
        answer: 0,
        explain: 'A computer repeats the same steps exactly, every time, without getting tired. That is the whole idea.',
      },
    ],
  },
  {
    id: 'script', file: 'login.script.test', title: 'Build the script', concept: 'Script', color: '#4F6BFF',
    story: 'A robot only does what you tell it, in the order you tell it. That list of steps is a script. (Tap a placed step to put it back.)',
    items: [
      {
        kind: 'order', prompt: 'Tap the steps in the order the robot should do them.',
        steps: ['OPEN the website', 'TYPE the username', 'TYPE the password', 'CLICK Login', 'CHECK the dashboard appears'],
        interchangeable: [[1, 2]],
        explain: 'Open → type → click → check. Every automated test is a list like this: actions, then a check.',
      },
      {
        kind: 'order', prompt: 'Now the shop. Order the steps.',
        steps: ['OPEN robo.shop', 'SEARCH "robo arm"', 'OPEN the product', 'ADD to cart', 'CHECK the cart has 1 item'],
        explain: 'You cannot add before you open, and you cannot check before you add. Order is everything.',
      },
    ],
  },
  {
    id: 'locator', file: 'find-the-element.test', title: 'Find it', concept: 'Locator', color: '#B36BFF',
    story: 'The robot cannot "see" a button. It needs an address for it. That address is a locator.',
    items: [
      { kind: 'locate', prompt: 'Tap the thing this address points to:', hint: 'Every button and box on a page has a code name, its tag. A locator is an address built from it.', locator: '#login', target: 'login', explain: '# means "the thing whose id is…". The Log in button has id="login", so #login finds it.' },
      { kind: 'locate', prompt: 'This address is a path, called XPath. Tap what it finds:', hint: "Read it left to right: // = anywhere on the page · input = a text box · [@name='password'] = named password.", locator: "//input[@name='password']", target: 'password', explain: 'XPath describes a path to a thing: what kind of thing, and which one. Here: a text box named password.' },
      { kind: 'locate', prompt: 'Last one. Tap what it finds:', hint: "In XPath, a = a link, and text()= means 'whose words are'.", locator: "//a[text()='Sign up']", target: 'signup', explain: 'A link whose text is exactly "Sign up". Finding things by their words breaks if someone renames the link, so ids are safer.' },
    ],
  },
  {
    id: 'assertion', file: 'pass-or-fail.test', title: 'Pass or fail', concept: 'Assertion', color: '#FFB020',
    story: 'After the steps, the robot compares what it expected with what it actually got. That comparison is an assertion.',
    items: [
      { kind: 'judge', expected: 'Dashboard page', actual: 'Dashboard page', pass: true, explain: 'Expected matches actual. PASS.' },
      { kind: 'judge', expected: 'Cart has 1 item', actual: 'Cart has 0 items', pass: false, explain: 'One is not zero. FAIL — and that is the test doing its job.' },
      { kind: 'judge', expected: '"Welcome, Sam"', actual: '"Welcome, sam"', pass: false, explain: 'Robots are literal. To a robot, a lowercase s makes it a different word. FAIL.' },
      { kind: 'judge', expected: 'Logged-out page', actual: 'Logged-out page', pass: true, explain: 'Exact match. PASS. A test without an assertion is not a test.' },
    ],
  },
  {
    id: 'debugging', file: 'fix-the-robot.test', title: 'Fix the bug', concept: 'Debugging', color: '#FF5A5F',
    story: 'A red test is a message, not a disaster. Read the output, find the broken step, fix it, run again.',
    items: [
      {
        kind: 'fix', script: ['OPEN the website', 'TYPE username "sam"', 'TYPE password "robot123"', 'CLICK #logni', 'CHECK dashboard'],
        brokenLine: 3, output: 'Error at step 4: element "#logni" not found', fixes: ['CLICK #login', 'WAIT 2 seconds', 'CLICK #logout'], answer: 0,
        explain: 'Wrong locator. "#logni" is a typo for "#login". Locators must match exactly.',
      },
      {
        kind: 'fix', script: ['OPEN the website', 'TYPE username "sam"', 'TYPE password "robot123"', 'CLICK #login', 'CHECK "Dashbored"'],
        brokenLine: 4, output: 'Assertion failed at step 5: expected "Dashbored", saw "Dashboard"', fixes: ['CHECK "Error"', 'CHECK "Dashboard"', 'TYPE password again'], answer: 1,
        explain: 'The app was fine. The expected value in the test was misspelled. Tests can have bugs too.',
      },
      {
        kind: 'fix', script: ['OPEN the website', 'TYPE username "sam"', 'TYPE password "robot123"', 'CLICK #login', 'CHECK dashboard right away'],
        brokenLine: 4, output: 'Assertion failed at step 5: page was still loading', fixes: ['CLICK #login twice', 'WAIT for the page, then CHECK dashboard', 'Delete step 5'], answer: 1,
        explain: 'The robot checked too early. Waiting for the page to load is one of the most common fixes in automation.',
      },
    ],
  },
];

export const TOTAL_TESTS = LEVELS.reduce((n, l) => n + l.items.length, 0);

export const RANKS = [
  { min: 0, name: 'Curious Human', line: 'You met the robot. Play again and it will remember you.' },
  { min: 0.5, name: 'Automation Apprentice', line: 'You know what a script, a locator and an assertion are. That is more than most.' },
  { min: 0.8, name: 'Automation Engineer', line: 'Scripts, locators, assertions, debugging. You could explain this to a friend.' },
  { min: 1, name: 'Green Suite Legend', line: 'Every test green on the first run. Sam would like to hire you.' },
];
