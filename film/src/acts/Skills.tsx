import React from 'react';
import { Img, useCurrentFrame } from 'remotion';
import { C } from '../brand/tokens';
import { Clip, stillUrl } from '../fx/kit';
import { E, fd, lmix, prog } from '../lib/anim';
import { ACT, b, H, W } from '../timeline';
import type { Sound } from './Sound';

// Skills (3024-3136, b(28)-b(29)). The skills card has said it ("Make motion graphics
// and websites," / "with built-in skills."), so this act only shows it: full frame, no text from the film, no dot.
//   local 0-28    the proof: Settings > Skills, "Included with TasteCode", its line and the three rows (cinetic,
//                 design-taste-frontend, cook) with their descriptions. The info banner, the nav and the install paths
//                 under the rows stay out of frame; the rows' dotted leaders are covered with the page's ground.
//   local 28-112  the use, in a chat: the atlas-web Claude Code chat, its first exchange above ("Is the Flateyri site
//                 ready to share?"), the composer below, the whole column centred (capture C2b `skills-chat`). The cut
//                 lands on the same three skills, now the "$" menu over the composer ("Make a ten second teaser for it.
//                 $", cinetic highlighted); Enter takes cinetic (a chip, on b(28,1,2), local 42), the chip sits 22 f,
//                 Enter sends (64). The message lands as "$cinetic / Make a ten second teaser for it.", the agent's
//                 row reads "Using Skill · cinetic" (84, on b(28,3)), then "Used Skill · cinetic" (100), and the reply
//                 starts to stream (104). The app's timers ("Worked for 2s", "Working for 1s") show only their first
//                 word and the agent's status dot is covered (TIMERS below); the menu's "v2.5" is cut out (MENU_V25).
// Camera: axial only, never a pan. The Settings list pushes at a constant ratio per frame (1.03 per 56 f) about its ink
// centre. The chat holds still through the menu and the pick (the take moves, the frame does not: TEXT-SYSTEM rule 8),
// then from the send it makes one push, x1 to x1.6, about the agent's tool row (CHAT_PIVOT), so "Using Skill · cinetic"
// grows in place from a 21 px cap to a 34 px one while the sent message leaves the frame up and right and the composer
// leaves it down; the push is at rest by the cut. Hard cuts on the grid: in on b(28), where the hats return; the chat
// on b(28,1); out on b(29) into the split card. The cut and every take frame are decided on fd; the camera runs on the
// continuous frame, so the blur pass smears it. The take plays at 1x; it skips or holds only where its picture does not
// change.
const DUR = ACT.skills.dur; // 112
const CUT = b(28, 1) - ACT.skills.from; // 28: Settings -> the chat
const APP_BG = 'rgb(15,15,15)'; // lint-ok: the app's own ground (#0F0F0F), sampled from the still and the take's PNGs
/** The push at t frames into a shot: a constant ratio per frame (1.03 per 56 f), so there is no ease to read. */
const pushAt = (t: number) => Math.pow(1.03, t / 56);
if (ACT.skills.from !== b(28) || CUT !== 28) throw new Error(`Skills: the act starts on ${ACT.skills.from} (b(28) ${b(28)}), the chat on local ${CUT}`);

// ---------------------------------------------------------------------- Settings > Skills (local 0-28)
// footage/stills/skills-included.png: the window, 1310x818 CSS px at DPR 2.2. Measured on the PNG (CSS px): the info
// banner ends at 203; "Included with TasteCode" has its cap top at 222.4; the kept ink runs x 406.3-1149.5 (the names to
// "Enabled"); the rows' descriptions end at 341.6, 445.7 and 550.6, and each row's install path (C:\Program Files\...)
// follows at 348.2-358.6, 453.2-463.6 and 558.2-568.6.
// The page is drawn in tiles. Three bands, the lower two lifted 18 CSS px each (one line of the row), so the paths under
// cinetic and design-taste-frontend close up (the rows keep their own 30-31 px gap) and cook's path is below the last
// band. Each band in two pieces with x 880-1000 taken out, where the rows hold nothing but their leaders: the page as a
// narrower window lays it out, with "Enabled" nearer the names, so the list is a centred block with even margins.
// Every splice edge lies in flat ground, so there is no seam.
const STILL = { id: 'skills-included', w: 1310, h: 818, dpr: 2.2 };
const BANDS = [
  { y0: 210, y1: 344.9, lift: 0 }, // the heading, its line, cinetic
  { y0: 362.9, y1: 449.4, lift: 18 }, // design-taste-frontend
  { y0: 467.4, y1: 554.1, lift: 36 }, // cook
];
const PIECES = [
  { x0: 290, x1: 880, shift: 0 }, // right of the nav's edge (x 256) to the leaders
  { x0: 1000, x1: 1310, shift: 120 }, // the leaders' far end and "Enabled"
];
// design-taste-frontend's description opens "tasteskill v2.5, the anti-slop frontend skill.": a version number in a
// film about v0.5. Its first line (ink 414.5-427.3, the second line starts below 433) is cut between "tasteskill" (ink
// to 451.8) and the comma (ink from 479.1), on device-pixel columns in empty ground (996 and 1053 at DPR 2.2), and the
// rest of the line closes up: "tasteskill, the anti-slop frontend skill." The l-to-comma gap is the 5-to-comma gap (1.36).
const V25 = { y0: 404, y1: 429.5, cutL: 996 / STILL.dpr, cutR: 1053 / STILL.dpr };
type Tile = { x0: number; x1: number; y0: number; y1: number; dx: number; dy: number };
const TILES: Tile[] = BANDS.flatMap((bd) =>
  PIECES.flatMap((p): Tile[] => {
    const t = { x0: p.x0, x1: p.x1, y0: bd.y0, y1: bd.y1, dx: -p.shift, dy: -bd.lift };
    if (!(bd.y0 < V25.y0 && bd.y1 > V25.y1 && p.x0 < V25.cutL && p.x1 > V25.cutR)) return [t];
    return [
      { ...t, y1: V25.y0 },
      { ...t, y0: V25.y0, y1: V25.y1, x1: V25.cutL },
      { ...t, y0: V25.y0, y1: V25.y1, x0: V25.cutR, dx: t.dx - (V25.cutR - V25.cutL) },
      { ...t, y0: V25.y1 },
    ];
  }),
);
if (TILES.length !== 9) throw new Error(`Skills: the v2.5 cut found no tile (${TILES.length} tiles)`);
// The rows' dotted leaders (the app's, from each name to "Enabled"), measured on the PNG's device px (DPR 2.2): the
// dots' ink runs x 1021-2401 / 1248-2397 / 997-2399 and y 636-641 / 867-872 / 1098-1103, so in CSS px (pixel edges)
// x 464.09-1091.82 / 567.27-1090.0 / 453.18-1090.91 and y 289.09-291.82 / 394.09-396.82 / 499.09-501.82. After Leon's
// "NO DOTS" they are covered with the page's own ground: from 3 px before the first dot to x 1100 (the last dot's
// resampled edge left a grey speck when the cover stopped 0.1 px past it, crit8), and 1.4 px above and below. Within 5
// px of the leaders nothing else is inked: the names end at 448.6 / 551.4 / 438.2 and "Enabled" starts at 1106.8.
const LEADERS = [
  { x0: 464.09, y0: 289.09, y1: 291.82, lift: 0 },
  { x0: 567.27, y0: 394.09, y1: 396.82, lift: 18 },
  { x0: 453.18, y0: 499.09, y1: 501.82, lift: 36 },
];
const LEADER_END = 1100; // the covers' right edge, 6.8 px before "Enabled"
const LEADER_PAD = { x: 3, y: 1.4 };
const LIST = { x: (406.3 + 1149.5 - 120) / 2, y: (222.4 + 550.6 - 36) / 2 }; // the kept ink's centre (717.9, 368.5) on the frame's
// The skill names' x-height is 7.73 CSS px; against the composer's text (cap height 10.56 = 15.1 px type, x-height 8.13)
// that is 14.4 px type, so 34.0 px on frame 0 and 34.5 at the cut, with the PNG at most 1.1x up. The rows span 1470 px.
const S_LIST = 2.36;

const SettingsSkills: React.FC<{ f: number }> = ({ f }) => {
  const s = S_LIST * pushAt(f);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${W / 2 - LIST.x * s}px, ${H / 2 - LIST.y * s}px) scale(${s})` }}>
      {TILES.map((t) => (
        <div key={`${t.x0}-${t.y0}`} style={{ position: 'absolute', left: t.x0 + t.dx, top: t.y0 + t.dy, width: t.x1 - t.x0, height: t.y1 - t.y0, overflow: 'hidden' }}>
          <Img src={stillUrl(STILL.id)} style={{ position: 'absolute', left: -t.x0, top: -t.y0, width: STILL.w, height: STILL.h, display: 'block' }} />
        </div>
      ))}
      {LEADERS.map((l) => (
        <div
          key={l.y0}
          style={{
            position: 'absolute',
            left: l.x0 - LEADER_PAD.x,
            top: l.y0 - LEADER_PAD.y - l.lift,
            width: LEADER_END - PIECES[1].shift - (l.x0 - LEADER_PAD.x),
            height: l.y1 - l.y0 + 2 * LEADER_PAD.y,
            background: APP_BG,
          }}
        />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------- the chat (local 28-112)
// Capture C2b `skills-chat`: the bottom 16:9 of a
// 1310x590 window, 900x506.25 CSS px at x 333.5, y 83.75 (DPR 1920/900), so 1:1 is full frame. The composer card (808 CSS
// wide) is whole and centred, 98 px from either side; the thread is above it. The browser caret was hidden at capture
// (caret-color: transparent); the film draws the house caret from the take's marks.
const TAKE = 'skills-chat';
const ORIGIN = { x: 333.5, y: 83.75 }; // the take's top-left in the window's CSS px
const K = W / 900; // 2.133 px per CSS px
// The text line, measured on the PNG (clip px): "M" ink 890-912, so the cap height is 22.5 and its centre 901. The
// caret is 1.15x the cap height, centred on it, 2 px wide, C.white at 0.9 (the app's ink on its dark composer).
const CAP_MID = 901;
const CARET_H = 1.15 * 22.5;
const CARET_W = 2;
const BLINK = 32; // f on, f off (530 ms): solid for 32 f after every key and after the cut
// The take, by frame (marks.state, and a per-frame pixel diff of the PNGs):
//   0-9 still: the exchange above, "Make a ten second teaser for it." in the composer;  10 " " (no ink);
//   13 "$": the menu is whole in that frame, cinetic highlighted, still to 28;  29 Enter: the menu closes, cinetic is a
//   chip on a new row at the card's top, fading in 29-39 (the last change, 39, is 1 px);  40-42 still;
//   43 Enter: the message lands in the thread and the thread scrolls it to the top, 43-76 (163 CSS px, easing out,
//   1 px a frame from 58 on); 63 the agent's row "Using Skill · cinetic" (the Skill tool call); 79-80 it reads
//   "Used Skill · cinetic"; 81-82 still; 83 on, the reply streams in ("Ten seconds in four shots: ...").
// The film plays it 1:1 in four runs: from local `at`, take `take` on, up to take `last`, which it holds to the run's
// end. It skips only the still stretches 27-28 and 81-82, and holds only take 42, inside the still 36-42 (the chip has
// settled; 36-39 change by 11, 5 and 1 px at most). The cut lands on take 13, the menu's first frame: the Settings list
// cuts to the same three names (critic: no 2 f empty composer before a pop). The menu is up 14 f; Enter on cinetic on
// b(28,1,2) (local 42); the chip then sits 22 f, its fade (29-39) and the still to 42 at 1x and take 42 held 8 f more
// (crit8: the pick sat 8 f, too short to read); the send on 64, so "Using Skill · cinetic" (take 63) lands on b(28,3)
// (local 84) with its tick, on the beat the hats keep. Take 81 is held 1 f (inside the still 80-82).
type Run = { at: number; take: number; last: number; len: number };
const RUNS: readonly Run[] = [
  { at: CUT, take: 13, last: 26, len: 14 }, // the menu, cinetic highlighted
  { at: CUT + 14, take: 29, last: 42, len: 22 }, // Enter on cinetic: the chip
  { at: CUT + 36, take: 43, last: 81, len: 40 }, // Enter sends; "Using Skill · cinetic" on 63, "Used" on 79
  { at: CUT + 76, take: 83, last: 90, len: 8 }, // the reply starts to stream
];
// Take frames that do not change (36-39 by 11, 5 and 1 px at most: the chip's last fade steps, below what reads).
const STILLS: readonly (readonly [number, number])[] = [[0, 12], [13, 28], [36, 42], [80, 82]];
const isStill = (a: number, z: number) => STILLS.some(([s, e]) => s <= a && e >= z);
RUNS.forEach((r, i) => {
  const next = RUNS[i + 1];
  const shown = r.last - r.take + 1;
  if (shown < 1 || shown > r.len) throw new Error(`Skills: run ${i} shows take ${r.take}-${r.last} in ${r.len} f`);
  if (shown < r.len && !isStill(r.last - 1, r.last)) throw new Error(`Skills: run ${i} holds take ${r.last}, which is not a still`);
  if (next && next.at !== r.at + r.len) throw new Error(`Skills: run ${i} ends on ${r.at + r.len}, run ${i + 1} starts on ${next.at}`);
  if (!next && r.at + r.len !== DUR) throw new Error(`Skills: the runs end on local ${r.at + r.len}, the act on ${DUR}`);
  if (next && next.take > r.last + 1 && !isStill(r.last, next.take - 1)) throw new Error(`Skills: run ${i} skips take ${r.last + 1}-${next.take - 1}, which is not a still`);
});
const takeAt = (l: number) => {
  const n = fd(l);
  const run = RUNS.reduce((r, x) => (n >= x.at ? x : r), RUNS[0]);
  return Math.min(run.last, run.take + Math.max(0, n - run.at));
};
/** The first local frame that shows take frame `t` (or later). */
const localOf = (t: number) => {
  for (let l = CUT; l < DUR; l++) if (takeAt(l) >= t) return l;
  throw new Error(`Skills: take frame ${t} is past the cut`);
};
const KEY = { space: 10, dollar: 13, pick: 29, send: 43, skill: 63, used: 79 };
if (takeAt(CUT) !== KEY.dollar || localOf(KEY.pick) !== b(28, 1, 2) - ACT.skills.from) throw new Error(`Skills: the cut shows take ${takeAt(CUT)}, Enter on ${localOf(KEY.pick)} (plan: the menu's first frame, b(28,1,2))`);
const SEND = localOf(KEY.send); // 64
if (SEND - localOf(KEY.pick) < 22) throw new Error(`Skills: the chip sits ${SEND - localOf(KEY.pick)} f before the send (22 to read)`);
if (localOf(KEY.skill) !== b(28, 3) - ACT.skills.from) throw new Error(`Skills: "Using Skill · cinetic" on local ${localOf(KEY.skill)}, the beat b(28,3) on ${b(28, 3) - ACT.skills.from}`);

// The camera on the chat. Still to the send, then one push about CHAT_PIVOT, the agent's tool row ("Using Skill ·
// cinetic", where it lands once the thread has scrolled: ink x 138-459, y 364-390 clip px, "U" cap 366-386, so its left
// edge and cap centre), x1 to x1.6 over the send to the cut on E.rest (zero slope at the start, at rest by the cut).
// Every row above the pivot only rises and every row below it only falls (the thread's own scroll is upward and ends
// above the pivot), so nothing on screen turns back. The row's 21 px cap is 29.2 px when "Using Skill · cinetic"
// appears (x1.39, local 84) and 33.1 px from "Used" on (x1.58, local 100). The sent message's bubble (clip x 1339-1787)
// leaves the frame on the right at x1.484 and the composer (top 853) at the bottom at x1.476: at x1.5 both crept out
// over the push's slow tail, a slice of "Make a ten..." on the edge for 15 f (crit8 r2); at x1.6 both are out by local
// 90 (the bubble's ink earlier), while the push is still quick, and the last 22 f hold only the agent's rows. The take
// is 1920 px across 900 CSS px, so x1.6 enlarges it 1.6x past its own pixels.
const CHAT_PIVOT = { x: 138, y: 376 }; // clip px = screen px at x1
const CHAT_PUSH = 1.6;
/** The chat camera's scale at local frame l (continuous, so the blur pass smears the push). */
const camAt = (l: number) => lmix(1, CHAT_PUSH, prog(l, SEND, DUR, E.rest));
/** Screen position of clip point (x, y) at scale s. */
const onScreen = (x: number, y: number, s: number) => ({ x: CHAT_PIVOT.x + (x - CHAT_PIVOT.x) * s, y: CHAT_PIVOT.y + (y - CHAT_PIVOT.y) * s });
const CLEAR = localOf(KEY.skill) + 6; // 90: the bubble and the composer are out of frame
if (onScreen(1339, 0, camAt(CLEAR)).x < W || onScreen(0, 853, camAt(CLEAR)).y < H) throw new Error(`Skills: the sent message or the composer is still in frame on local ${CLEAR}`);

// Covers in the take, in clip px (the take's PNG px), drawn inside the chat's camera so they scale and move with it.
// TIMERS (crit8b): the app's "Worked for 2s" over the first answer and "Working for 1s" on the agent's turn read as
// speed numbers (no "Working for" / "Worked for" under 1m), and at x1.6 "Working for 1s" is the top
// line of the payoff; the status dot before "Working" breathes (Leon: no dots). Patches of the thread's ground leave
// "Worked" and "Working" and hide the rest, as Switch.tsx (TIMER) and Calm.tsx (DOT_COVER) do. Each follows its row's
// ink top on the PNGs (threshold 20 over the ground 15) through the thread's scroll after the send: "Working for 1s"
// from 604 (take 43) to 267 (take 68 on); "Worked for 2s" 166 to take 42, then 153 ... 13 and above the frame from take
// 48. Ink: "Worked" x 135-224, "for 2s" 233-299, 19 px tall; the dot x 144-159, top+4 to top+19 (smaller while it fades
// in); "Working" 182-280, "for 1s" 289-354, 25 px tall. On every take frame each patch is drawn on, the 1 px ring
// around it is the flat ground (15,15,15), so no edge can show.
const WORKING_TOPS = [604, 574, 536, 497, 461, 427, 399, 373, 352, 335, 322, 309, 301, 294, 288, 281, 279, 277, 275, 273, 271, 271, 269, 269, 269, 267];
const WORKED_TOPS = [153, 124, 87, 49, 13];
const workingTop = (t: number) => (t < KEY.send ? null : WORKING_TOPS[Math.min(t - KEY.send, WORKING_TOPS.length - 1)]);
const workedTop = (t: number) => (t < KEY.send ? 166 : t - KEY.send < WORKED_TOPS.length ? WORKED_TOPS[t - KEY.send] : null);
type Patch = { x0: number; x1: number; dy0: number; dy1: number };
const WORKED_TIMER: Patch = { x0: 228, x1: 306, dy0: -5, dy1: 25 }; // "for 2s"
const WORKING_DOT: Patch = { x0: 136, x1: 170, dy0: -3, dy1: 27 }; // the status dot
const WORKING_TIMER: Patch = { x0: 284, x1: 362, dy0: -5, dy1: 30 }; // "for 1s"
const timerCovers = (t: number) => {
  const wd = workedTop(t);
  const wk = workingTop(t);
  return [...(wd === null ? [] : [{ p: WORKED_TIMER, top: wd }]), ...(wk === null ? [] : [{ p: WORKING_DOT, top: wk }, { p: WORKING_TIMER, top: wk }])];
};
// MENU_V25 (crit8b): the "$" menu's design-taste-frontend row opens "tasteskill v2.5, the anti-slop frontend s...", the
// version number the Settings shot already cuts (V25). On the menu's take frames (13-28, still) the line is cut between
// "tasteskill" (ink to x 540) and the comma (ink from 592; the "5" ends at 590, a faint 591) and the rest of the line
// closes up 50 px: "tasteskill, the anti-slop frontend s...", with the 5-to-comma gap (one ground column). The band y
// 706-760, x 542-880 is the menu's flat ground (26,26,26) outside the text (ink y 724-748, the line's last ink at 876).
const MENU_BG = 'rgb(26,26,26)'; // lint-ok: the "$" menu's own surface (#1A1A1A), sampled from take 13
const MENU_V25 = { y0: 706, y1: 760, cutL: 542, cutR: 592, end: 880 };
/** Clip px to the take's CSS px (the chat's transform scales by K). */
const cpx = (v: number) => v / K;

// The caret's x after each change (window CSS px, marks.state[f].caret: a mirror of the textarea, checked against the
// real caret within 0.5 px on the C2 probe). The film centres its 2 px line half a CSS px past it, where Chromium paints
// its 1 px caret. After the send the field is empty and keeps the focus.
const CARET_AT: readonly (readonly [number, number])[] = [[0, 604.52], [KEY.space, 608.61], [KEY.dollar, 616.7], [KEY.pick, 608.61], [KEY.send, 396.5]];
const caretX = (t: number) => CARET_AT.reduce((x, [k, v]) => (t >= k ? v : x), CARET_AT[0][1]);
const CARET_EVENTS = [CUT, ...[KEY.pick, KEY.send].map(localOf)];
/** The caret: on for 32 f from the last key (or the cut), then 32 off, 32 on. Decided on fd. */
const caretOn = (l: number) => {
  const n = fd(l);
  const last = CARET_EVENTS.reduce((v, k) => (k <= n ? k : v), CUT);
  return Math.floor((n - last) / BLINK) % 2 === 0;
};
for (let l = CUT + 1, run = 1; l < DUR; l++) {
  if (caretOn(l) === caretOn(l - 1)) run++;
  else if (run < BLINK && l - run > CUT) throw new Error(`Skills: the caret toggles after ${run} f on local ${l}`);
  else run = 1;
}

const Chat: React.FC<{ l: number }> = ({ l }) => {
  const t = takeAt(l);
  const s = camAt(l);
  // The push about CHAT_PIVOT; the caret in screen space, so its 2 px stay 2 px, snapped to the pixel grid, centred on
  // the text line's cap centre as the camera carries it (after the send it rides the composer out of the frame).
  const c = onScreen((caretX(t) + 0.5 - ORIGIN.x) * K, CAP_MID, s);
  const top = Math.round(c.y - (CARET_H / 2) * s);
  const bottom = Math.round(c.y + (CARET_H / 2) * s);
  return (
    <>
      <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${CHAT_PIVOT.x * (1 - s)}px, ${CHAT_PIVOT.y * (1 - s)}px) scale(${K * s})` }}>
        <Clip id={TAKE} frame={t} />
        {t >= KEY.dollar && t < KEY.pick && (
          <>
            <div style={{ position: 'absolute', left: cpx(MENU_V25.cutL), top: cpx(MENU_V25.y0), width: cpx(MENU_V25.end - MENU_V25.cutL), height: cpx(MENU_V25.y1 - MENU_V25.y0), background: MENU_BG }} />
            <div style={{ position: 'absolute', left: cpx(MENU_V25.cutL), top: cpx(MENU_V25.y0), width: cpx(MENU_V25.end - MENU_V25.cutR), height: cpx(MENU_V25.y1 - MENU_V25.y0), overflow: 'hidden' }}>
              <Clip id={TAKE} frame={t} style={{ position: 'absolute', left: -cpx(MENU_V25.cutR), top: -cpx(MENU_V25.y0) }} />
            </div>
          </>
        )}
        {timerCovers(t).map(({ p, top }) => (
          <div key={p.x0} style={{ position: 'absolute', left: cpx(p.x0), top: cpx(top + p.dy0), width: cpx(p.x1 - p.x0), height: cpx(p.dy1 - p.dy0), background: APP_BG }} />
        ))}
      </div>
      {caretOn(l) && (
        <div style={{ position: 'absolute', left: 0, top: 0, width: CARET_W, height: bottom - top, background: C.white, opacity: 0.9, transform: `translate(${Math.round(c.x - CARET_W / 2)}px, ${top}px)` }} />
      )}
    </>
  );
};

export const Skills: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, background: APP_BG, overflow: 'hidden' }}>
      {fd(f) < CUT ? <SettingsSkills f={f} /> : <Chat l={f} />}
    </div>
  );
};

// Sound, on the frames the picture shows each change, panned gently toward where it lands on screen (the camera's
// scale on that frame): Enter on cinetic (42, b(28,1,2): the chip goes in), Enter that sends (64: the message lands,
// right of centre) and a soft tick when the agent's row "Using Skill · cinetic" appears (84, b(28,3), left). The cut in has
// none: the hats return on it (mix.py); the cut into the chat has none either (the menu is already open there: no key
// is seen); the reply's stream is carried by the music.
const panAt = (px: number) => Math.round(Math.max(-0.4, Math.min(0.4, ((px - W / 2) / (W / 2)) * 0.4)) * 100) / 100;
const panOf = (cssX: number, l: number) => panAt(onScreen((cssX - ORIGIN.x) * K, 0, camAt(l)).x);
export const SKILLS_SOUND: Sound[] = [
  { f: localOf(KEY.pick), kind: 'enter', weight: 0.35, pan: panOf(437, localOf(KEY.pick)) }, // the chip, CSS x 390-485
  { f: SEND, kind: 'enter', weight: 0.4, pan: panOf(1100, SEND) }, // the message, CSS x 962-1171
  { f: localOf(KEY.skill), kind: 'tick', weight: 0.3, pan: panOf(470, localOf(KEY.skill)) }, // "Using Skill · cinetic", CSS x 397-546
];
