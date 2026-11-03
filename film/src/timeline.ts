// The single source of truth for time. Picture (src/acts), sound (src/sync.ts -> out/cues.json)
// and QA (scripts/grid-check.ts) all import this file, so a change here moves everything together.
// Think in bars and beats, never in seconds. Keep this file free of React and CSS imports:
// Node scripts load it directly.

export const FPS = 60;
// The track is Next Horizon at 130 BPM, stretched 1.1% so a beat is a whole 28 frames and a 16th a
// whole 7. Bars are 112 f (1.867 s). tools/mix/mix.py applies the same stretch.
export const BEAT = 28;
export const BPM = (60 * FPS) / BEAT;
export const W = 1920;
export const H = 1080;

export const BAR = BEAT * 4;
/**
 * Absolute frame of a grid position: bar is 1-based, beat 0-3, sub = 16ths within the beat.
 * b(3) is the downbeat of bar 3; b(2, 1, 2) is the "and" of beat 2 in bar 2.
 */
export const b = (bar: number, beat = 0, sub = 0) => Math.round(((bar - 1) * 4 + beat) * BEAT + sub * (BEAT / 4));

/**
 * A choreography length written in 60 fps frames (the unit every number in the cinetic
 * references uses), converted to this film's fps. Cues come from b(); durations inside a move
 * use f60(), so the film keeps its timing if --fps changes.
 */
export const f60 = (frames: number) => Math.round((frames * FPS) / 60);

/** The film ends on the lockup's still card (69.5 s): the lockup act carries its own tail. */
export const TAIL = 0;

const span = (from: number, to: number) => ({ from, dur: to - from });

// 69.5 s, b(38, 1). Round 8 (Leon's notes on preview 6, Nov 3): the second half is told as a centred card (the
// sentence alone on black, src/acts/Card.tsx), then the footage full screen with no text.
export const TOTAL = b(38, 1);

// Acts: contiguous, [from, from + dur). Every hard cut in the film is an act boundary, because
// motion-blur samples never cross one. Each act is its own composition in Root.tsx. Every boundary is on a
// beat; the wall and the lockup sit 6 bars later than in preview 6, so their music phase is kept.
export const ACT = {
  hook: span(b(1), b(4)), // the dot, one thread, five agents (music: intro, filter opening)
  eclipse: span(b(4), b(6)), // the dot eclipses and floods to white
  rebuilt: span(b(6), b(8, 2)), // DROP 1. fog, giant word, the window rises
  needs: span(b(8, 2), b(10, 2)), // macro rail, the band, the row lifts, yellow flood
  redrawn: span(b(10, 2), b(13, 2)), // fog paper bento of rebuilt surfaces, then the Appearance page's own scroll
  calmCard: span(b(13, 2), b(15, 2)), // card: "Watch your agent work," / "step by step." (opens on 36 f of empty stage)
  calm: span(b(15, 2), b(17)), // BREAKDOWN. the chat, message by message, no text
  designCard: span(b(17), b(18)), // card: "It designs websites and dashboards." (the breakdown's 140 lift)
  compose: span(b(18), b(21)), // dawn clouds, Design chip, press; DROP 2 at b(20) on the deal; the orb opens on Hvit
  sites: span(b(21), b(22, 2)), // through the hole: Leon's sites
  dash1: span(b(22, 2), b(23)), // polarity flip: a dark dashboard
  dash2: span(b(23), b(23, 2)), // flip: a light dashboard
  switchCard: span(b(23, 2), b(25)), // card: "Switch agents mid-chat," / "and keep the conversation."
  switch: span(b(25), b(26, 1)), // the chat column full frame: picker, shelf, send, the reply picks up
  skillsCard: span(b(26, 1), b(28)), // card: "Make motion graphics and websites," / "with built-in skills."
  skills: span(b(28), b(29)), // the hats come back on this cut: Included with TasteCode, a skill picked in a chat
  splitCard: span(b(29), b(30)), // card: "Run two chats side by side."
  split: span(b(30), b(31)), // two chats, two panes
  limitsCard: span(b(31), b(32)), // card: "See every plan limit at a glance."
  limits: span(b(32), b(32, 3)), // the limits popup
  review: span(b(32, 3), b(33, 2)), // commit, push, pull request
  update: span(b(33, 2), b(34)), // the update waits for running chats
  wall: span(b(34), b(36)), // every shot, the biggest peak b(35), implosion into the dot
  lockup: span(b(36), TOTAL), // the mark grows around the dot the wall left; the card holds still for the last 100 f
};

export type ActKey = keyof typeof ACT;

// Named sync points (absolute frames), all on the 16th grid. A cue that must sit off the grid
// carries a trailing `// offgrid: <reason>` comment, which grid-check accepts.
// Picture code reads these; src/sync.ts turns them into sound events.
export const CUE = {
  drop1: b(6), // full white: the music drops, the groove enters
  band: b(9), // the Needs you band appears
  flood2: b(10, 2), // the yellow flood fills the frame
  breakdown: b(14), // the sparse breakdown lands with the calm card's "work,"
  press: b(19, 1), // the orb is pressed
  drop2: b(20), // the pages deal out of the orb
  hats: b(28), // the top end returns on the cut into skills
  peak: b(35), // the biggest moment of the film
  silence: b(36), // the implosion lands on silence
  roof: b(36) + 44, // offgrid: the mark's roof lands; resolved ring-out starts here
};

export type Copy = {
  id: string;
  text: string; // exactly what is on screen (\n separates lines)
  in: number; // first frame any of it is visible
  resolved: number; // first frame it is fully readable
  out: number; // first frame it starts to leave (TOTAL if it stays)
  kind?: 'copy' | 'ui'; // 'ui': a string the product shows (a typed command, code, a URL, an app label); not budgeted
};

// Every on-screen word, for the word budget (kind: 'ui' entries are counted apart) and the hold check (resolved -> out >= 36 f + 6 f/word at 60 fps).
// Leon's rule (Nov 2): copy reads as plain sentences, never keywords, and never more than one line. A long
// sentence is told in two parts at one anchor (ids -a and -b): the first leaves, then the second rises.
// Acts read their text from here with copy(id).text and set it with fx/Line. Frames per TEXT-SYSTEM.md section 6:
// in = the first drawn frame, resolved = the payoff struck (or the last setup word + 5 f), out = it starts leaving.
// A comma part leaves as one drain wave (fix7 #13), so its `out` is the plan's out.at + the breath - 1.
export const COPY: Copy[] = [
  { id: 'hook-a', text: 'Every agent you use,', in: 55, resolved: 64, out: 133 }, // the row closes with the snap; Hook's A_OUT 128 + the 6 f breath - 1: the whole part drains as one wave 133-144, "use," last (136-144)
  { id: 'hook-b', text: 'together in one window.', in: 145, resolved: 161, out: b(3) }, // B strikes once "use," is gone (140 read "together use,"); "window." struck on the punch (161); carried out on the release
  { id: 'name', text: 'TasteCode v0.5', in: b(4) + 44, resolved: b(4, 2), out: b(5, 1, 1) }, // Eclipse.tsx ECLIPSE_LINE: drawn once the band clears its ink; the band blinks shut on it
  { id: 'rebuilt', text: 'We rebuilt the interface.', in: b(6), resolved: 600, out: 678 }, // struck on the drop; the period lands at 600
  { id: 'needs', text: 'See which chat needs you.', in: b(9, 2), resolved: b(9, 3), out: 1056 }, // "needs you." born yellow on b(9,3); out: the flood's first contact
  { id: 'redrawn', text: 'Make it look and work your way.', in: b(11, 2, 1), resolved: b(11, 3), out: 1284 }, // the halves lock on the seal's strike; out: Appearance's edge starts carrying the line (measured by the redrawn package, r8)
  // The six cards (src/acts/Card.tsx). Each line is alone and centred on black: setup words
  // 3-4 f apart under the row shove, the payoff struck on a beat or a 16th, no more than 16 f after the last setup word.
  // A two-part sentence relays at one anchor: part A drains as one wave, part B strikes on the first frame it is gone
  // (relayAt). The hard cut into the footage is the last part's exit. Card.tsx throws if its plans disagree with these.
  { id: 'calm-a', text: 'Watch your agent work,', in: 1436, resolved: b(14), out: 1549 }, // Watch 1436, your 1440, agent 1444 after 36 f of empty stage; "work," on b(14), the breakdown; A out.at 1544 + 6 - 1
  { id: 'calm-b', text: 'step by step.', in: 1561, resolved: b(15), out: ACT.calm.from }, // step 1561 (relayAt), by 1563, "step." on b(15); the cut into the chat is its exit
  { id: 'design', text: 'It designs websites and dashboards.', in: 1800, resolved: b(17, 1), out: ACT.compose.from }, // It 1800, designs 1804, websites 1808; "and dashboards." one phrase on b(17,1); cut into Compose
  { id: 'phase1', text: 'Understanding the request', in: 2057, resolved: 2064, out: 2068, kind: 'ui' },
  { id: 'phase2', text: 'Creating brand direction', in: 2069, resolved: 2076, out: 2080, kind: 'ui' },
  { id: 'phase3', text: 'Planning the page', in: 2081, resolved: 2088, out: 2092, kind: 'ui' },
  { id: 'phase4', text: 'Building the website', in: 2093, resolved: 2100, out: 2104, kind: 'ui' },
  { id: 'phase5', text: 'Reviewing the design', in: 2105, resolved: 2112, out: 2116, kind: 'ui' },
  { id: 'phase6', text: 'Refining the website', in: 2117, resolved: 2122, out: 2122, kind: 'ui' },
  // Leon's own words ("switch providers mid chat"); "agents" because the film says "agent" from its first line.
  { id: 'switch-a', text: 'Switch agents mid-chat,', in: 2528, resolved: b(23, 2, 3), out: 2602 }, // Switch 2528, agents 2531, "mid-chat," on b(23,2,3); A out.at 2597 + 6 - 1
  { id: 'switch-b', text: 'and keep the conversation.', in: 2613, resolved: b(24, 1, 3), out: ACT.switch.from }, // and 2613 (relayAt), keep 2615, the 2617, "conversation." on b(24,1,3); cut into the chat
  { id: 'skills-a', text: 'Make motion graphics and websites,', in: 2836, resolved: b(26, 2), out: 2945 }, // Make 2836, motion 2839, graphics 2842, and 2845, "websites," on b(26,2); A out.at 2940 + 6 - 1
  { id: 'skills-b', text: 'with built-in skills.', in: 2958, resolved: b(27, 2), out: ACT.skills.from }, // with 2958 (relayAt), built-in 2960, "skills." on b(27,2); cut into Settings > Skills
  { id: 'split', text: 'Run two chats side by side.', in: 3144, resolved: b(29, 1), out: ACT.split.from }, // Run 3144, two 3148, chats 3152, "side by side." one phrase on b(29,1)
  { id: 'limits', text: 'See every plan limit at a glance.', in: 3370, resolved: b(31, 1), out: ACT.limits.from }, // See 3370, every 3373, plan 3376, limit 3379, "at a glance." one phrase on b(31,1)
  // The lockup (src/acts/Lockup.tsx LOCKUP): the name rides the mark's edge from b(37) (lockup local 112), its ink resolving
  // before its position; the line is one unit on b(37,1) (local 140); the card is pixel-still from local 152 to the last frame.
  { id: 'wordmark', text: 'TasteCode', in: b(37), resolved: b(37) + 8, out: TOTAL },
  { id: 'platforms', text: 'v0.5 is out now for Windows and macOS.', in: b(37, 1), resolved: b(37, 1) + 10, out: TOTAL },
];

/** One COPY entry by id; acts read their text and timing from here so the budget stays true. */
export const copy = (id: string): Copy => {
  const c = COPY.find((x) => x.id === id);
  if (!c) throw new Error(`timeline: no COPY entry "${id}"`);
  return c;
};
