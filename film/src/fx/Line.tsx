/**
 * fx/Line.tsx: the film's one copy component (TEXT-SYSTEM.md sections 2-3). Every COPY line is a
 * <Line>. It draws one span per glyph at its kerned x from lib/measure.ts glyphLayout(), so a word
 * exists whole from its first drawn frame, the line never reflows while weights move, and nothing
 * is ever clipped. Motion is transforms (translateX only), opacity, colour and numeric font-weight.
 * No blur, no clip box, no vertical move, no overshoot, no will-change. Discrete state (onsets,
 * layout steps, the lit colour step, a word leaving) is decided on fd(f), so every motion-blur
 * sub-sample of a frame agrees. Settles run on continuous f, with one guard (rule 3, TEXT-SYSTEM.md
 * section 2): a glyph at ink SET.inkFast (0.75) or more whose x moves more than SET.vmax (3) screen
 * px over a frame (|x(F + 0.5) - x(F - 0.5)|·zoom, everything Line moves: close-up, spread, ROW,
 * DRAIN) is drawn at its fd(f) state on that frame, so the master's sub-samples cannot smear it.
 * lineFrame() is the same maths without React, for Node checks.
 *
 * ---------------------------------------------------------------------------------------------
 * <Line
 *   id="needs"                 data-text id for scripts/layout-audit.sh (the wrapper carries it)
 *   text={copy('needs').text}  the approved words; one line, never a '\n'
 *   f={frame}                  the clock the plan is written in (see offset)
 *   offset?={0}                added to f: a plan in absolute frames runs from an act's local frame
 *   size={84}                  px, the line's size (fitLine() below)
 *   role?="display"            TYPE role: rest weight, lead, tracking (hero uses heroTrack(size))
 *   tier?                      SET amounts: 'caption' | 'display' | 'hero' | 'title' | 'secondary' (default from role)
 *   track? weight?             override the role's tracking (em) and rest weight
 *   kern?                      { [text index]: em } opens single pairs (glyphLayout's kern): that glyph and all after it move right
 *   color?={C.white}           the line's colour; a unit may override it
 *   stage?="dark"              'dark' | 'light': a setup unit's first-frame ink (SET.o0)
 *   align?="left"              'left' | 'center' | 'right' | { seam: wordIndex } (the space before that word)
 *   anchor?={{ x, y, v }}      where the align point sits in the parent, px. v: 'top' (default) |
 *                              'middle' | 'baseline' | 'xmid' (the x-height midline). Omit it and the
 *                              wrapper is position: relative, placed by its parent.
 *   plan={{ units, row?, layouts?, out?, resolved? }}   LinePlan from lib/anim.ts (re-exported here)
 *   wrap?={(f) => transform}   per-frame CSS transform in the PARENT's px, applied outside the anchor
 *                              placement (origin 0 0): a camera ride, a lift, an edge ride. scaleAbout() helps.
 *                              Line does not step a wrap: a fast wrap is the camera's move (its windows are
 *                              listed in TEXT-SYSTEM.md section 7); decide it on fd yourself (stepFast) if not.
 *   zoom?={1}                  screen px per line px when a parent scales the line (a plane, a lean), for
 *                              rule 3's guard. Redrawn's plane: z; one-look: LOOK_PUSH.
 *   style?                     extra wrapper style (a clipPath, zIndex). Do not pass transform here.
 * />
 *
 * The wrapper is a div sized to the rest layout (measured advance x size·lead) with data-text={id},
 * so the audit reads true bounds. It renders nothing before the first onset and from the frame the
 * exit has cleared (lineTimes(plan).clears).
 *
 * plan.units: SetUnit[] - every word in exactly one unit (Line throws otherwise).
 *   { words: 2 | [3, 4], at, mode: 'setup' | 'hit' | 'born' | 'cut' | 'lit', litAt?, color?, from?,
 *     o0?, H?, close?, spread?, lag?, ripple?, k?, kInk?, by?, read? }
 *   Per glyph j of a word (t from the word's onset + ripple·(word in unit) + lag·j, clamped at 0):
 *     ink    1 - (1 - o0)·kInk^t        weight  rest + H·k^t (drawn centred on its REST advance)
 *     spread (j - c)·spread·size·k^t    close-up (word) close·size·k^t, positive = starts right, closes left
 *   Spread pivots, so words never touch on a strike: a word spreads about its centre when the
 *   strike's own motion (its close-up, the ROW spacing) opens both its word spaces, or the
 *   neighbour there strikes later. Where a neighbour strikes on the same frame ("needs you.", a
 *   cut-in or lit line, "one look." under a ROW) or sits still beside a word with no close-up, that
 *   side is closed: the word pivots on that edge and spreads toward its free side (at most 15 px,
 *   3 px/f), or, closed on both sides, spreads about its centre capped at 15% of the word space.
 *   Catch-up close-up: when the previous word is still settling (cadence gaps of 2-4 f), a word's
 *   close-up grows by what that neighbour still carries, so the gap opens by at least close/2 on
 *   the strike (capped at 1.8 x close). On a 4 f caption cadence that is ~20 px instead of 15.
 *   Rule 3's guard: a close-up of 15 px moves 3.06 px/f on its first whole frame and a grown one up
 *   to 5.5, so a setup word's first 1-3 frames are usually drawn on fd (sharp steps), then it
 *   settles on continuous f under 3 px/f.
 *   Defaults by mode: setup o0 = SET.o0[stage] (0.85 dark, 0.8 light), H 100 | hit o0 1, H 150 | born = hit in C.accent |
 *   cut o0 SET.cutO0 (1), H 80, ripple 0.5 | lit o0 1, H 60, from C.mute. close and spread come from
 *   SET.close / SET.spread by tier; close is 0 for every unit when plan.row is set.
 * plan.row: RowDriver - { s: (f) => number, anchor? } scales word centres about anchor (line px,
 *   default the line's centre); { split, offset: (f) => number } moves words < split left and
 *   >= split right by offset(f) px; { dx: (word, f) => px } moves any word (an inline slot);
 *   { shove: { onsets, k, gap } } holds the visible words centred and lets each new step shove the
 *   earlier ones left (iz1 R1; Line resolves it against the layout). Glyph size never changes.
 *   rowClose / rowLock / rowPart / rowSlot / rowShove build them. A ROW driver zeroes every unit's
 *   default close-up; give a unit `close` to keep one (switch-a: SET.close.display).
 * plan.layouts: LineStep[] - from fd(f) >= at the line is words [a, b] laid out alone at size (or
 *   scale x size), re-placed about the same anchor (use anchor.v 'xmid' to lock the x-height
 *   midline). Before the first step's at, the first step is used. Word state carries across steps.
 * plan.out: LineOut - drain | carried (+ comma: { breath }: the whole line waits breath - gap f more, then
 *   drains in reading order with the comma word last) | title | picture (+ clears?).
 * plan.resolved: override lineTimes' resolved (COPY uses the act's measured frame).
 *
 * The accent is born, never mixed: a unit in C.accent must have o0 1, may not be lit, and its line
 * may only leave by the picture (out.kind 'picture'), because an opacity fade of yellow is olive.
 * Line throws otherwise.
 *
 * ---------------------------------------------------------------------------------------------
 * Examples (frames are illustrative; take the real ones from TEXT-SYSTEM.md section 4).
 *
 * SET setup + hit (calm-a): a ritardando whose payoff lands on the stream's first token.
 *   const [w, y, a, k] = ritard(1458, [4, 4, 12]);            // 1458 1462 1466 1478
 *   plan = { units: [{ words: 0, at: w, mode: 'setup' }, { words: 1, at: y, mode: 'setup' },
 *                    { words: 2, at: a, mode: 'setup' }, { words: 3, at: k, mode: 'hit' }],
 *            out: { at: 1538, kind: 'drain', comma: { breath: DRAIN.breath.caption } } };
 *   <Line id="calm-a" text={A} f={f} offset={ACT.calm.from} size={84} role="caption" anchor={{ x: 96, y: 928 }} plan={plan} />
 * SET born (needs): "needs you." is one phrase unit in C.accent at ink 1 on its first frame.
 *   units: [...ritard(952, [3, 3]).map((at, i) => ({ words: i, at, mode: 'setup' })), { words: [3, 4], at: 980, mode: 'born' }]
 * SET cut (q-limits): units: [{ words: [0, 6], at: 2800, mode: 'cut', H: 80, close: 0 }]   // whole on the cut
 * SET cut (switch-a): units: [{ words: [0, 5], at: 2354, mode: 'cut', o0: 0.7, H: 100 }]   // close-up from the tier
 * SET lit (q-review): the whole line at mute from the cut; each phrase steps to white on its result.
 *   units: [{ words: 0, at: 2884, mode: 'lit', litAt: 2898 }, { words: 1, at: 2884, mode: 'lit', litAt: 2919 },
 *           { words: [2, 6], at: 2884, mode: 'lit', litAt: 2940 }]
 * SET hit with overrides (name): { words: 0, at: 380, mode: 'hit', H: 100, close: 0 }, { words: 1, at: 392, mode: 'hit' }  with tier="title"
 * SET envelope (platforms, all eight words on one clock, resting exactly on STILL 3400):
 *   { words: [0, 7], at: 3388, mode: 'cut', o0: 0.42, H: 80, close: 0, spread: 0, lag: 0, ripple: 0, by: 3400, read: 10 }
 *
 * ROW camera (hook-a): row: { s: (f) => Math.exp(0.35 * Math.log(2.2) * (1 - prog(f, 49, 61, E.dolly))) }
 *   (word centres ride the snap; every glyph stays 84 px; close is 0 automatically)
 * ROW close: row: rowClose(1932)                              // s = 1 + 0.10·0.91^(f - 1932). It scales about the
 *   whole line's centre, so each word appears at its final place and the shown words hang left of centre while
 *   the rest of the slot is empty (fix7 #3a, one-look 1932-1960): use rowShove for a centred cadence.
 * ROW shove (one-look, iz1 R1): the visible row stays centred and each new word shoves the earlier ones left.
 *   const on = [...ritard(1942, [4, 4]), 1960];               // Every 1942, page 1946, keeps 1950, "one look." 1960
 *   units: [...on.slice(0, 3).map((at, i) => ({ words: i, at, mode: 'setup', o0: 1 })), { words: [3, 4], at: on[3], mode: 'hit' }],
 *   row: rowShove(on)                                          // k 0.78, gap 1.2 em; align 'center' about the anchor
 *   Per drawn frame Fd, with steps i = 0..m struck by Fd (a step is one onset: a word or a phrase unit) and
 *   rem_i = settleRem(f, at_i, k): every visible word sits at T_m + sum_i (T_(i-1) - T_i)·rem_i, plus gap·size·rem_i
 *   for each step i at or before its own. T_i = h·(inkR of the line's last word - inkR of step i's last word), h 0.5
 *   centred (0 left, 1 right): the visible row's ink centre on the whole line's. "Every" strikes alone on the centre;
 *   "page" strikes 1.2 em past its rest gap and both run left, "page" faster, the row re-centring as the gap closes.
 *   Measured at 112 px: a word's strike moves 40-60 px/f, falling ~22% a frame; under 3 px/f about 12 f after each
 *   step, so on a 4 f cadence the row is moving from the first step to ~12 f after the last (one-look 1942-1970, a
 *   fast-text window, TEXT-SYSTEM.md section 7). Every frame of it at ink 0.75 or more is drawn on fd(f) by rule 3's
 *   guard (sharp steps, no master smear). Every term falls monotonically: zero overshoot.
 * ROW lock (redrawn): row: rowLock(3, 1183, 1204, 0.18 * size) // halves "Make it look" | "and work your way." lock on 1204
 * ROW part (q-split): row: rowPart(3, 2706, 42), align: { seam: 3 }, anchor: { x: 960, y: 928 }
 * ROW slot (switch-a): words from 5 ("agent,") sit `w` px right (the tile's room) until the press,
 *   then close on glide k 0.84: row: rowSlot(5, w, 2423), units: [{ words: [0, 5], at: 2354, mode: 'cut',
 *   o0: 0.7, H: 100, close: SET.close.display }]. The act draws the caret/tile at
 *   lineGeometry(...).layout.words[4].x1 + its gap, which is where the slot opens.
 *
 * RELAY pair (hook): one anchor, A holds a breath and drains as one wave, B strikes on the first frame the comma word is gone.
 *   With a comma, every word of A waits the breath (fix7 #13): word w drains from aOut + w·gap + breath - gap, so
 *   "Every agent you use," drains 133, 134, 135, 136 (each over 9 f) and the comma word never stands alone at full ink.
 *   const aOut = 128, B0 = relayAt(aOut, 4, DRAIN.breath.display);   // 145: "use," drains 136-144, last of the wave
 *   A.out = { at: aOut, kind: 'drain', comma: { breath: DRAIN.breath.display } }
 *   B.units = ritard(B0, [2, 2]).map(...)                              // 145, 147, 149
 *   assertRelay('hook', { text: A, size, role: 'caption', align: 'center', x: 960 },
 *               { text: 'together in one', size, role: 'caption', align: 'center', x: 960 });   // throws if B would touch A's comma word
 *   Both lines share size and anchor. Never strike B before relayAt: the two parts must not share a frame.
 *
 * DRAIN drain (calm-b): out: { at: 1612, kind: 'drain' }        // per word, 1 f apart, 9 f each
 * DRAIN carried (ink and weight only; the picture moves it): out: { at, kind: 'carried' },
 *   wrap: (f) => scaleAbout(CX, CY, lmix(1, 2.1, exitT(f)))
 * Whole-line exit (hook-b on the release): out: { at: 224, kind: 'picture', clears: 233 }, and the act takes the
 *   wrapper's ink over DRAIN.dur: style={{ opacity: 1 - prog(f, 224, 233, E.smooth) }}. No tail phrase is left.
 *
 * Layouts type step (hook-b): "together in one" alone at 84 px, then the full line at 122 on the punch.
 *   layouts: [{ at: 145, words: [0, 2] }, { at: 161, scale: 122 / 84 }], anchor: { x: 960, y: Y, v: 'xmid' },
 *   units: [{ words: 0, at: 145, mode: 'setup' }, { words: 1, at: 147, ... }, { words: 2, at: 149, ... },
 *           { words: 3, at: 161, mode: 'hit', spread: 0.025, close: 0 }]
 *
 * Absolute-frame span (dash, both acts render the same Line): write the plan in absolute frames and
 *   pass each act's own origin: Dash1 <Line f={f} offset={ACT.dash1.from} .../>, Dash2 the same with
 *   ACT.dash2.from. The SET state is then one function of the absolute frame across the cut.
 *
 * Picture exits: out: { at: 678, kind: 'picture', clears: 698 } and the act moves or clips the
 *   wrapper (rebuilt's lift: translateY(-accel(f, 678, 0, 1.2, 2)) px, 2 px/f, then x1.2 a frame, so the
 *   frame top crosses the ink band at 40 px/f or more on 2 frames at most; the act asserts `clears`).
 */
import React from 'react';
import { C, FONT, heroTrack, SAFE, TYPE, U } from '../brand/tokens';
import { decay, DRAIN, drainAt, drainStart, E, fd, glide, lineTimes, LinePlan, mix, prog, SET, settleRem, SetMode, Tier, unitWords } from '../lib/anim';
import { mixColor } from '../lib/color';
import { baselineOf, Glyph, GLYPH_FEATURES, glyphLayout, GlyphLayout, inkBox } from '../lib/measure';
import { W } from '../timeline';

export type { LineOut, LinePlan, LineStep, RowDriver, SetMode, SetUnit, Tier } from '../lib/anim';
export { DRAIN, lineTimes, relayAt, ritard, SET, stepFast } from '../lib/anim';

export type Role = keyof typeof TYPE;
export type Align = 'left' | 'center' | 'right' | { seam: number };
export type Anchor = { x: number; y: number; v?: 'top' | 'middle' | 'baseline' | 'xmid' };

/** The tracking a Line of `role` uses at `size` (em): heroTrack for hero, the role's token otherwise. */
export const trackOf = (role: Role, size: number) => (role === 'hero' ? heroTrack(size) : TYPE[role].track);
/** The SET tier a role defaults to. */
export const tierOf = (role: Role): Tier => (role === 'hero' ? 'hero' : role === 'secondary' ? 'secondary' : role === 'display' ? 'display' : 'caption');

/**
 * Largest size (px, at most `max`) at which one line of `text` fits `width` on screen while the
 * camera shows it at scale `k`; the default width is the frame inside both 96 px margins. Same maths
 * as the old fx/Sentence fitLine (a width at 100 px, scaled linearly), measured with Line's own
 * glyph settings. A hero line iterates, because its tracking depends on its size.
 */
export const fitLine = (text: string, role: Role = 'display', k = 1, max = TYPE[role].size * U, width = W - 2 * SAFE.x, track?: number) => {
  const weight = TYPE[role].weight;
  const fit = (tr: number) => Math.min(max, (width / k / glyphLayout(text, 100, weight, tr).width) * 100);
  if (track !== undefined || role !== 'hero') return fit(track ?? TYPE[role].track);
  let s = fit(heroTrack(max));
  for (let i = 0; i < 4; i++) s = fit(heroTrack(s));
  return s;
};

/** A transform for Line's `wrap` that scales by `s` about the parent point (x, y). */
export const scaleAbout = (x: number, y: number, s: number) => `translate(${x.toFixed(3)}px, ${y.toFixed(3)}px) scale(${s.toFixed(5)}) translate(${(-x).toFixed(3)}px, ${(-y).toFixed(3)}px)`;

/** ROW close (one-look): s = 1 + amount·k^(f - at). Edges 5.8 px/f on the first frame at display size, then falling. */
export const rowClose = (at: number, amount = 0.1, k = 0.91, anchor?: number) => ({ anchor, s: (f: number) => 1 + amount * (1 - decay(f, at, k)) });
/** ROW lock (redrawn): the halves split before word `split` start `d` px apart outward each and land together on `lock` on E.glide. */
export const rowLock = (split: number, arrive: number, lock: number, d: number) => ({ split, offset: (f: number) => d * (1 - prog(f, arrive, lock, E.glide)) });
/** ROW part (q-split): the halves part from `at` by px·(1 - k^t) each (42 px on k 0.92: 3.2 px/f, then falling). */
export const rowPart = (split: number, at: number, px: number, k = 0.92) => ({ split, offset: (f: number) => px * decay(f, at, k) });
/** ROW slot (switch-a): words from `from` on sit `px` right, held open, and close from `close` on glide (k 0.84: 90% in 13 f). */
export const rowSlot = (from: number, px: number, close: number, k = 0.84) => ({ dx: (w: number, f: number) => (w >= from ? glide(f, close, px, 0, k) : 0) });
/**
 * ROW shove (iz1 R1, one-look): the visible words are held centred on the line's align point and each new step
 * shoves the earlier words left. `onsets` are the units' distinct onset frames, ascending (Line throws if they
 * disagree with the units). Each step strikes `gapEm` past its rest gap and that gap collapses at `k` per frame,
 * while the whole visible row eases at the same `k` toward its new centred target. Every term only falls, so no
 * word ever moves right after its strike and nothing overshoots; all of it rests exactly 16 f (k 0.78) after the
 * last step. Pair it with units at full ink (o0 1): the strike is the shove, no grey precedes it. `edge` (parent
 * px, default W - SAFE.x) is the furthest right a step may strike: the gap shrinks to the room left, and past that
 * the shown words make room on the strike frame (anchored lines only).
 * `lead` (f, default 0: crit7's behaviour) makes that room in time instead of on the strike frame (r8, the cards): a
 * step that would overflow moves the shown words left before it strikes, on E.glide over the frames since the previous
 * step (at most `lead`), by as much as it needs to strike with its full gap, never more than the row's own re-centring.
 * A wide payoff ("and dashboards." at 1600 px) otherwise jumps the shown words ~330 px in one frame and lands with the
 * word space closed ("websitesand"). The move only goes left and ends at rest on the strike: no overshoot.
 */
export const rowShove = (onsets: readonly number[], k = 0.78, gapEm = 1.2, edge?: number, lead = 0) => ({ shove: { onsets, k, gap: gapEm, edge, lead } });

type GeomOpts = { role?: Role; track?: number; weight?: number; align?: Align; anchor?: Anchor };

/** x of the align point inside a laid-out line, px from its left. `first` maps a seam's word index into a sub-layout. */
const alignX = (L: GlyphLayout, align: Align, first = 0) => {
  if (align === 'left') return 0;
  if (align === 'center') return L.width / 2;
  if (align === 'right') return L.width;
  const k = align.seam - first;
  if (k <= 0 || k >= L.words.length) throw new Error(`Line: seam ${align.seam} is not between two words of "${L.text}"`);
  return (L.words[k - 1].x1 + L.words[k].x0) / 2;
};

/** Distance from the line box's top to the anchor's vertical point. */
const anchorY = (size: number, weight: number, lead: number, v: Anchor['v'] = 'top') => {
  if (v === 'top') return 0;
  if (v === 'middle') return (size * lead) / 2;
  const base = baselineOf(size, weight, lead);
  return v === 'baseline' ? base : base - inkBox('x', size, weight).ascent / 2;
};

/**
 * Where a Line sets `text` at `size`: its glyph layout and the wrapper's box in the parent (left,
 * top, width, height), with the baseline and x-height midline. For act layout maths (a period's
 * seat, the wordmark's rest ink edge, a relay's clearance) without rendering.
 */
export const lineGeometry = (text: string, size: number, o: GeomOpts = {}) => {
  const role = o.role ?? 'display';
  const weight = o.weight ?? TYPE[role].weight;
  const track = o.track ?? trackOf(role, size);
  const lead = TYPE[role].lead;
  const layout = glyphLayout(text, size, weight, track);
  const ax = o.anchor ? o.anchor.x - alignX(layout, o.align ?? 'left') : 0;
  const ay = o.anchor ? o.anchor.y - anchorY(size, weight, lead, o.anchor.v) : 0;
  const baseline = baselineOf(size, weight, lead);
  return { layout, left: ax, top: ay, width: layout.width, height: size * lead, baseline: ay + baseline, xmid: ay + baseline - inkBox('x', size, weight).ascent / 2 };
};

/** One side of a RELAY for the guard: the text as laid out at the shared anchor x. */
export type RelaySide = { text: string; size: number; role?: Role; align?: Align; x: number; track?: number; tier?: Tier };

/**
 * RELAY guard (TEXT-SYSTEM.md, RELAY): px between B's first word's right ink edge (plus its full
 * close-up and 0.3 em) and A's comma word's left ink edge (after its whole drain drift). Positive is
 * clear. assertRelay throws when it is not; then B must wait until the comma's ink is under 0.05.
 */
export const relayClear = (a: RelaySide, b: RelaySide) => {
  const ga = lineGeometry(a.text, a.size, { role: a.role, track: a.track, align: a.align, anchor: { x: a.x, y: 0 } });
  const gb = lineGeometry(b.text, b.size, { role: b.role, track: b.track, align: b.align, anchor: { x: b.x, y: 0 } });
  const comma = ga.layout.words[ga.layout.words.length - 1];
  const b0 = gb.layout.words[0];
  const drift = -drainAt(DRAIN.dur, 0, a.size).drift;
  const closeUp = SET.close[b.tier ?? tierOf(b.role ?? 'display')] * b.size;
  return ga.left + comma.inkL - drift - (gb.left + b0.inkR + closeUp + 0.3 * b.size);
};
export const assertRelay = (id: string, a: RelaySide, b: RelaySide) => {
  const c = relayClear(a, b);
  if (c < 0) throw new Error(`Line relay "${id}": B's first word overlaps A's comma word by ${(-c).toFixed(1)} px; strike B once the comma's ink is under 0.05`);
  return c;
};

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

type Resolved = { a: number; b: number; at: number; mode: SetMode; o0: number; H: number; close: number; spread: number; lag: number; ripple: number; k: number; kInk: number; by?: number; color: string; from: string; litAt?: number };

export type LineProps = {
  id: string;
  text: string;
  f: number;
  offset?: number;
  size: number;
  role?: Role;
  tier?: Tier;
  track?: number;
  weight?: number;
  kern?: Record<number, number>;
  color?: string;
  stage?: 'dark' | 'light';
  align?: Align;
  anchor?: Anchor;
  plan: LinePlan;
  wrap?: (f: number) => string | undefined;
  zoom?: number;
  style?: React.CSSProperties;
};

/** One drawn glyph of a Line frame, px from the line's left. `stepped`: rule 3's guard drew its fd(f) state this frame. */
export type LineGlyph = { key: string; ch: string; word: number; x: number; inkL: number; inkR: number; ink: number; wt: number; col: string; stepped: boolean };
/** One frame of a Line: the layout in force (size lsize), the anchor placement and every drawn glyph. */
export type LineFrame = { L: GlyphLayout; lsize: number; lead: number; ax: number; ay: number; titleScale: number; glyphs: LineGlyph[] };

/**
 * Line's maths for one frame, without React: null when nothing is drawn. `layoutOf` is glyphLayout (a Node
 * check passes a layout of its own; anchor.v 'baseline' and 'xmid' still need the DOM's inkBox).
 */
export const lineFrame = (p: LineProps, layoutOf: typeof glyphLayout = glyphLayout): LineFrame | null => {
  const { id, text, f: local, offset = 0, size, role = 'display', tier, track, weight, kern, color = C.white, stage = 'dark', align = 'left', anchor, plan, zoom = 1 } = p;
  if (text.includes('\n')) throw new Error(`Line "${id}": copy is one line, never two`);
  const f = local + offset;
  const F = fd(f);
  const words = text.split(' ');
  const n = words.length;
  const times = lineTimes(plan, n);
  if (F < times.in || (times.clears !== undefined && F >= times.clears)) return null;

  const t = TYPE[role];
  const rest = weight ?? t.weight;
  const ti = tier ?? tierOf(role);

  // Units, resolved against their defaults; every word in exactly one.
  const unitOf: number[] = new Array(n).fill(-1);
  const units: Resolved[] = plan.units.map((u, ui) => {
    const [a, b] = unitWords(u);
    if (a < 0 || b >= n || a > b) throw new Error(`Line "${id}": unit ${ui} names words ${a}-${b} of ${n}`);
    for (let w = a; w <= b; w++) {
      if (unitOf[w] >= 0) throw new Error(`Line "${id}": word ${w} ("${words[w]}") is in two units`);
      unitOf[w] = ui;
    }
    const full = u.mode === 'hit' || u.mode === 'born' || u.mode === 'lit';
    const o0 = u.o0 ?? (full ? 1 : u.mode === 'cut' ? SET.cutO0 : SET.o0[stage]);
    const c = u.color ?? (u.mode === 'born' ? C.accent : color);
    const from = u.from ?? C.mute;
    if (same(c, C.accent) && (o0 < 1 || u.mode === 'lit')) throw new Error(`Line "${id}": the accent is born at ink 1, never ramped or mixed (unit ${ui})`);
    // Fading yellow by opacity over the stage passes through olive: the accent leaves by the picture (the flood, a cut).
    if (same(c, C.accent) && plan.out && plan.out.kind !== 'picture') throw new Error(`Line "${id}": an accent unit never drains (an olive fade); give the line a picture exit`);
    if (u.mode === 'lit' && (same(from, C.accent) || u.litAt === undefined)) throw new Error(`Line "${id}": a lit unit needs litAt and a neutral from-colour (unit ${ui})`);
    return {
      a,
      b,
      at: u.at,
      mode: u.mode,
      o0,
      H: u.H ?? SET.H[u.mode],
      close: u.close ?? (plan.row ? 0 : SET.close[ti]),
      spread: u.spread ?? SET.spread[ti],
      lag: u.lag ?? SET.lag,
      ripple: u.ripple ?? (u.mode === 'cut' ? SET.ripple : 0),
      k: u.k ?? SET.k,
      kInk: u.kInk ?? SET.kInk,
      by: u.by,
      color: c,
      from,
      litAt: u.litAt,
    };
  });
  const missing = unitOf.indexOf(-1);
  if (missing >= 0) throw new Error(`Line "${id}": word ${missing} ("${words[missing]}") is in no unit`);

  // The layout in force: a step's word range alone at its size, or the whole line.
  const steps = plan.layouts;
  const step = steps?.length ? ([...steps].reverse().find((s) => F >= s.at) ?? steps[0]) : undefined;
  const [wa, wb] = step?.words ? [step.words[0], step.words[1]] : [0, n - 1];
  const lsize = step ? (step.size ?? size * (step.scale ?? 1)) : size;
  const ltrack = track ?? trackOf(role, lsize);
  const ltext = words.slice(wa, wb + 1).join(' ');
  const from = wa > 0 ? words.slice(0, wa).join(' ').length + 1 : 0; // kern is keyed on the full text's indices
  const lkern = kern && Object.fromEntries(Object.entries(kern).map(([i, v]) => [Number(i) - from, v] as const).filter(([i]) => i >= 0 && i < ltext.length));
  const L = layoutOf(ltext, lsize, rest, ltrack, undefined, lkern);
  const ax = anchor ? anchor.x - alignX(L, align, wa) : 0;
  const ay = anchor ? anchor.y - anchorY(lsize, rest, t.lead, anchor.v) : 0;

  const row = plan.row;
  const rowA = row && 's' in row ? (row.anchor ?? L.width / 2) : 0;
  const out = plan.out;
  const gc = (L.glyphs.length - 1) / 2;

  // Spread pivots. About its own centre, a word's spread pushes into both word spaces; next to a
  // word struck on the same frame, or under a ROW with no close-up, that closes the space ("needsyou.").
  // A side is free when the strike's own motion (close-up, ROW spacing) opens that gap by more than
  // the spreads push in, or when the neighbour on that side strikes later (right) / is the line's end.
  // Free both sides: centre (TEXT-SYSTEM.md). One side: pivot on the closed side's edge and spread
  // toward the free one (at most 15 px of travel, 3 px/f). Neither: centre, capped at 15% of the space.
  // Catch-up close-up: on a fast cadence the previous word still carries part of its own close-up
  // and spread when the next one strikes (2 f apart: ~13 of 15 px), so the new word would land on it
  // ("togetherin"). Its close-up grows by what the neighbour still carries, so the gap opens by at
  // least half a close-up on the strike; capped at 1.8x (3 px/f by ink 0.75). Settled neighbours and
  // ROW lines (close-up 0) are unchanged.
  const onset = (w: number) => units[unitOf[w]].at;
  // ROW shove (rowShove): steps are the layout's distinct onsets in reading order; step i shows words up to last_i.
  // Its target T_i puts the visible row's ink centre (left edge for align 'left', right edge for 'right') where the
  // whole line's sits at rest, so T falls step by step to 0 at the last. The row eases from target to target as a
  // sum of settles, x = T_m + sum_i (T_(i-1) - T_i)·rem_i, and every step after the first strikes gap·rem_i past its
  // rest gap (that word and all after it), rem_i = settleRem(f, at_i, k). Which steps are visible is decided on the
  // drawn frame Fd, never on a sub-sample, so a step's strike cannot leak into the frame before it.
  const shove =
    row && 'shove' in row
      ? (() => {
          const { onsets: listed, k: sk, gap, edge, lead = 0 } = row.shove;
          const steps: { at: number; first: number; last: number }[] = [];
          for (let k = 0; k < L.words.length; k++) {
            const at = onset(wa + k);
            const s = steps[steps.length - 1];
            if (s && at < s.at) throw new Error(`Line "${id}": rowShove needs onsets in reading order; word ${wa + k} ("${words[wa + k]}") strikes on ${at}, before ${s.at}`);
            if (s && at === s.at) s.last = k;
            else steps.push({ at, first: k, last: k });
          }
          const given = [...new Set(listed)].sort((a, b) => a - b);
          if (given.length !== steps.length || given.some((a, i) => a !== steps[i].at))
            throw new Error(`Line "${id}": rowShove([${listed.join(', ')}]) does not match the units' onsets [${steps.map((s) => s.at).join(', ')}]`);
          const h = align === 'left' ? 0 : align === 'right' ? 1 : 0.5;
          const end = L.words[L.words.length - 1].inkR;
          const T = steps.map((s) => h * (end - L.words[s.last].inkR));
          const g = gap * lsize;
          // The frame's edge: a step strikes no further right than `edge` (parent px, default the right safe margin; the
          // parent's own scale `zoom` is taken about the frame centre). A line that fills the frame has no room for the
          // full gap on its last step ("one look." would strike past the frame), so a step's gap shrinks to the room
          // left, and if even its rest gap overflows, the shown words make room on the strike frame by that overflow
          // (iz1 R1's earlier words take most of their shove on the strike), never more than their own re-centring move.
          const limit = anchor ? W / 2 + ((edge ?? W - SAFE.x) - W / 2) / zoom - ax : Infinity;
          const c = [0]; // the row's settle per step, T_(i-1) - T_i less the strike frame's jump (or the lead's move)
          const gs = [0]; // the extra gap per step
          const pre = [0]; // with `lead`: px the shown words move left before step i strikes, over pl[i] frames
          const pl = [0];
          for (let i = 1; i < steps.length; i++) {
            let x = T[i - 1];
            let open = 0;
            for (let j = 1; j < i; j++) {
              const r = settleRem(steps[i].at, steps[j].at, sk);
              x += c[j] * r;
              open += gs[j] * r;
            }
            const right = L.words[steps[i].last].inkR + x + open; // the step's right ink edge on its strike, gap 0
            const d = T[i - 1] - T[i];
            const J = lead > 0 ? Math.min(d, Math.max(0, right + g - limit)) : 0; // room made before the strike, for the full gap
            pre.push(J);
            pl.push(Math.min(lead, steps[i].at - steps[i - 1].at));
            gs.push(Math.min(g, Math.max(0, limit - (right - J))));
            c.push(d - J - Math.min(d - J, Math.max(0, right - J - limit)));
          }
          return (k: number, Fd: number, fx: number) => {
            let m = 0;
            while (m + 1 < steps.length && steps[m + 1].at <= Fd) m++;
            let x = T[m];
            for (let i = 1; i <= m; i++) {
              const r = settleRem(fx, steps[i].at, sk);
              x += c[i] * r + (steps[i].first <= k ? gs[i] * r : 0);
            }
            // The next step's lead: the shown words glide left into the room it needs, at rest on its strike frame.
            const nx = m + 1;
            if (nx < steps.length && pre[nx] > 0) x -= pre[nx] * prog(fx, steps[nx].at - pl[nx], steps[nx].at, E.glide);
            return x;
          };
        })()
      : undefined;
  /** Word w's (local k) ROW offset at clock `at`; discrete ROW state (which shove steps are in) is decided on Fd. */
  const rowShift = (w: number, k: number, at: number, Fd = fd(at)) =>
    !row
      ? 0
      : 's' in row
        ? (L.words[k].cx - rowA) * (row.s(at) - 1)
        : 'split' in row
          ? (w < row.split ? -1 : 1) * row.offset(at)
          : 'dx' in row
            ? row.dx(w, at)
            : shove!(k, Fd, at);
  const spanOf = (k: number) => L.words[k].last - L.words[k].first; // glyphs in the word - 1
  const push = (w: number, k: number) => (spanOf(k) / 2) * units[unitOf[w]].spread * lsize; // centre spread's edge offset
  const closeEff: number[] = [];
  const pivot: ('c' | 'r' | 'l' | 'cap')[] = [];
  /** Does the gap on `side` of word w (local k) open at w's strike by more than the spreads push into it? */
  const opens = (w: number, k: number, side: -1 | 1) => {
    const nb = w + side;
    const nk = k + side;
    const at = onset(w);
    const same = onset(nb) === at;
    const sw = closeEff[k] + rowShift(w, k, at);
    const sn = (same ? units[unitOf[nb]].close * lsize : 0) + rowShift(nb, nk, at);
    return (side < 0 ? sw - sn : sn - sw) >= push(w, k) + (same ? push(nb, nk) : 0);
  };
  for (let k = 0; k < L.words.length; k++) {
    const w = wa + k;
    const u = units[unitOf[w]];
    const c0 = u.close * lsize;
    closeEff[k] = c0;
    if (k > 0 && c0 > 0 && onset(w - 1) < onset(w)) {
      const p = units[unitOf[w - 1]];
      const r = settleRem(onset(w), onset(w - 1), p.k, p.by);
      const S = p.spread * lsize;
      const edge = pivot[k - 1] === 'c' ? push(w - 1, k - 1) : pivot[k - 1] === 'l' ? spanOf(k - 1) * Math.min(S, SET.closeUpPx / Math.max(1, spanOf(k - 1))) : 0;
      const carry = (closeEff[k - 1] + edge) * r + (rowShift(w - 1, k - 1, onset(w)) - rowShift(w, k, onset(w)));
      closeEff[k] = Math.min(1.8 * c0, Math.max(c0, 0.5 * c0 + carry + push(w, k)));
    }
    const lFree = k === 0 || (onset(w - 1) <= onset(w) && opens(w, k, -1));
    const rFree = k === L.words.length - 1 || onset(w + 1) > onset(w) || (onset(w + 1) === onset(w) && opens(w, k, 1));
    pivot[k] = lFree && rFree ? 'c' : lFree ? 'r' : rFree ? 'l' : 'cap';
  }
  const spreadStep = (k: number, j: number, c: number, S: number) => {
    const last = L.words[k].last - L.words[k].first; // glyphs in the word - 1
    const p = pivot[k];
    if (p === 'c') return (j - c) * S;
    if (p === 'r' || p === 'l') return (p === 'r' ? j - last : j) * (last > 0 ? Math.min(S, SET.closeUpPx / last) : S);
    const gaps = [k > 0 ? L.words[k].x0 - L.words[k - 1].x1 : Infinity, k < L.words.length - 1 ? L.words[k + 1].x0 - L.words[k].x1 : Infinity];
    return (j - c) * (c > 0 ? Math.min(S, (0.15 * Math.min(...gaps)) / c) : S);
  };

  const drains = out && (out.kind === 'drain' || out.kind === 'carried') ? out : undefined;
  /**
   * Glyph g's ink, weight and x on clock fx (discrete state stays decided on F): SET's settle, the ROW, then the
   * exit. Every continuous term is clamped outside its own window (a drain is the identity before it starts).
   */
  const glyphAt = (g: Glyph, u: Resolved, w: number, fx: number) => {
    const wordStart = u.at + u.ripple * (w - u.a);
    const gStart = wordStart + u.lag * g.j;
    const remK = settleRem(fx, gStart, u.k, u.by);
    let ink = 1 - (1 - u.o0) * settleRem(fx, gStart, u.kInk, u.by);
    let wt = rest + u.H * remK;
    // SET's spread and close-up, then the ROW: word centres scale about the anchor, the halves move apart, or a slot.
    let dx = spreadStep(g.word, g.j, g.c, u.spread * lsize) * remK + closeEff[g.word] * settleRem(fx, wordStart, u.k, u.by) + rowShift(w, g.word, fx, F);
    if (u.mode === 'lit' && u.litAt !== undefined && F >= u.litAt) wt += SET.lit.H * settleRem(fx, u.litAt + u.lag * g.j, u.k);
    if (drains) {
      const d = drainAt(fx, drainStart(drains, w, n), lsize);
      ink *= d.ink;
      wt = mix(wt, DRAIN.weight, d.weight);
      if (drains.kind === 'drain') dx += (g.j - g.c) * DRAIN.spread * lsize * d.spread + d.drift;
    } else if (out?.kind === 'title') {
      const q = prog(fx, out.at, out.at + DRAIN.title.dur, E.exit);
      dx += (g.g - gc) * DRAIN.title.spread * lsize * q;
      wt = mix(wt, DRAIN.title.weight, q);
      ink *= 1 - q;
    }
    wt = Math.abs(wt - rest) < 0.25 ? rest : Math.round(wt * 2) / 2;
    // Centred on its rest advance: a heavier glyph is wider, so it shifts left by half the difference.
    const adv = mix(g.adv, g.advHeavy, (wt - rest) / 150);
    return { ink, wt, x: g.x + (g.adv - adv) / 2 + (Math.abs(dx) < 0.005 ? 0 : dx) };
  };

  const glyphs: LineGlyph[] = [];
  for (const g of L.glyphs) {
    const w = wa + g.word;
    const u = units[unitOf[w]];
    if (F < u.at) continue;
    if (drains && F >= drainStart(drains, w, n) + DRAIN.dur) continue;
    // Rule 3: read type (ink inkFast or more) that would move more than vmax screen px over this frame is drawn
    // at its fd(f) state, so every motion-blur sub-sample of the frame puts it in one place and it stays sharp.
    const atF = glyphAt(g, u, w, F);
    const stepped = atF.ink >= SET.inkFast && Math.abs(glyphAt(g, u, w, F + 0.5).x - glyphAt(g, u, w, F - 0.5).x) * zoom > SET.vmax;
    const s = stepped || f === F ? atF : glyphAt(g, u, w, f);
    if (s.ink < 0.002) continue;
    let col = u.color;
    if (u.mode === 'lit' && u.litAt !== undefined) {
      const k = F - u.litAt;
      const v = k < 0 ? 0 : SET.lit.steps[Math.min(k, SET.lit.steps.length - 1)];
      col = v >= 1 ? u.color : mixColor(u.from, u.color, v);
    }
    glyphs.push({ key: `${w}.${g.j}`, ch: g.ch, word: w, x: s.x, inkL: g.inkL, inkR: g.inkR, ink: s.ink, wt: s.wt, col, stepped });
  }

  const titleQ = out?.kind === 'title' ? prog(f, out.at, out.at + DRAIN.title.dur, E.exit) : 0;
  return { L, lsize, lead: t.lead, ax, ay, titleScale: titleQ > 0 ? mix(1, DRAIN.title.scale, titleQ) : 1, glyphs };
};

export const Line: React.FC<LineProps> = (props) => {
  const fr = lineFrame(props);
  if (!fr) return null;
  const { id, f: local, offset = 0, color = C.white, anchor, wrap, style } = props;
  const { L, lsize, lead, ax, ay, titleScale, glyphs } = fr;
  const f = local + offset;
  const spans = glyphs.map((g) => (
    <span
      key={g.key}
      style={{ position: 'absolute', left: 0, top: 0, fontWeight: g.wt, color: g.col, opacity: g.ink >= 0.998 ? undefined : Number(g.ink.toFixed(4)), transform: `translateX(${g.x.toFixed(3)}px)` }}
    >
      {g.ch}
    </span>
  ));

  const place = anchor ? `translate(${ax.toFixed(3)}px, ${ay.toFixed(3)}px)` : '';
  const ride = wrap?.(f) ?? '';
  const transform = `${ride} ${place}`.trim() || undefined;
  return (
    <div
      data-text={id}
      style={{
        position: anchor ? 'absolute' : 'relative',
        left: anchor ? 0 : undefined,
        top: anchor ? 0 : undefined,
        width: L.width,
        height: lsize * lead,
        transformOrigin: '0 0',
        transform,
        fontFamily: FONT.text,
        fontSize: lsize,
        lineHeight: lead,
        letterSpacing: 0,
        whiteSpace: 'pre',
        ...GLYPH_FEATURES,
        color,
        ...style,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '50% 50%', transform: titleScale !== 1 ? `scale(${titleScale.toFixed(5)})` : undefined }}>{spans}</div>
    </div>
  );
};
