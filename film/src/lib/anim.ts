// The house motion system. Acts take every curve, spring and envelope from here, so the film has
// one motion character; scripts/lint-film.mjs fails raw beziers anywhere else. The numbers are
// proven defaults, not dogma: retune a token here and the whole film follows.
import { Easing, interpolate, spring, SpringConfig } from 'remotion';
import { FPS } from '../timeline';

export type Ease = (t: number) => number;

/** Easing tokens, named for how they feel. Entrances decay, exits accelerate; only the camera eases both ways. */
export const E = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // expo-out: arrivals and reveals (never for fade-outs)
  outSoft: Easing.bezier(0.22, 1, 0.36, 1), // quint-out: gentle settles
  in: Easing.bezier(0.7, 0, 0.84, 0), // expo-in: implosions and hard snaps out (20-24% of the travel in the last frame)
  exit: Easing.bezier(0.55, 0.055, 0.675, 0.19), // cubic-in: exits into a cut, speed growing about x1.14 per frame over the last 10-24 f
  inOut: Easing.bezier(0.87, 0, 0.13, 1), // expo-in-out: whips and lockup slides
  smooth: Easing.bezier(0.65, 0, 0.35, 1), // cubic-in-out: drifts and 10-14 f fades
  ui: Easing.bezier(0.4, 0, 0.2, 1), // small UI state changes
  cam: Easing.bezier(0.48, 0.1, 0, 0.9), // camera: slow start, peak at ~27%, long settle
  glide: Easing.bezier(0.47, 0.2, 0.15, 1), // 150-350 px moves with a soft landing
  rest: Easing.bezier(0.45, 0, 0.1, 1), // zero-slope start, ends at rest: chains after another move
  contact: Easing.bezier(0.55, 0, 0.9, 0.55), // accelerates INTO an impact (ends with velocity)
  whip: Easing.bezier(0.6, 0, 0.15, 1), // feature-to-feature whips
  dolly: Easing.bezier(0.35, 0, 0.65, 1), // slow push through a hold
  type: Easing.bezier(0.5, 1, 0.89, 1), // quad-out: an eased typewriter, 2x its mean rate at the start, last key at ~80%
  pan: Easing.bezier(0.4, 0.2, 0.05, 1), // UI and board pans, 30-46 f: long tail, peak at 30%
  push: Easing.bezier(0.35, 0.05, 0.1, 1), // page pushes, about 23 f
  fly: Easing.bezier(0.1, 0, 0.65, 1), // the cursor's return, a late peak
  tick: Easing.bezier(0.4, 0, 0.15, 1), // a camera tick on the bento: peak at 25-45%, tail creeps
  whipPan: Easing.bezier(0.82, 0, 0.12, 1), // the long pan on the wall: slow in, one huge frame, slow out
  linear: (t: number) => t, // drift only
};

/**
 * Spring presets. Default to critical damping (damping >= 2*sqrt(stiffness*mass)); overshoot is for
 * impacts only, and clamp it wherever it could cross other geometry or go negative.
 */
export const SPR = {
  snap: { damping: 18, stiffness: 260, mass: 0.7 }, // locks into place, small overshoot
  pop: { damping: 11, stiffness: 180, mass: 0.6 }, // 14% overshoot: a true landing only (<= 2 landings per film)
  soft: { damping: 26, stiffness: 120, mass: 1 }, // weighty, no overshoot
  heavy: { damping: 30, stiffness: 90, mass: 1.4 }, // big objects
  firm: { damping: 24, stiffness: 140, mass: 1 }, // UI arrivals, no overshoot
  micro: { damping: 30, stiffness: 500, mass: 0.6 }, // chips, badges, small snaps
  land: { damping: 14.5, stiffness: 200, mass: 1 }, // ~15% overshoot: a true landing only (<= 2 per film)
  word: { damping: 20, stiffness: 170, mass: 0.9 }, // words sliding in to lock (clamp at the lock)
  detent: { damping: 24, stiffness: 380, mass: 0.6 }, // a reel or picker clicking home
} satisfies Record<string, Partial<SpringConfig>>;

export type Spr = Partial<SpringConfig>;

/** Clamped tween between two frames. interpolate() extends past its range by default; this never does. */
export const tw = (frame: number, from: number, to: number, a: number, b: number, ease: Ease = E.out) =>
  interpolate(frame, [from, to], [a, b], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

/**
 * 0..1 progress between two frames. It is 0 ON `from`, so a change meant to show on a hit frame
 * starts at `cue - 1`. Pass the ease explicitly for exits and fades (E.in / E.smooth): the E.out
 * default is for arrivals only.
 */
export const prog = (frame: number, from: number, to: number, ease: Ease = E.out) => tw(frame, from, to, 0, 1, ease);

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Log-space mix for scale and zoom: equal ratios per frame, so a zoom never seems to accelerate. */
export const lmix = (a: number, b: number, t: number) => Math.exp(mix(Math.log(a), Math.log(b), t));
export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/** Spring started at `start` (frames). Same maths as src/lib/sync.ts uses to find its hit frame. */
export const spr = (frame: number, start: number, cfg: Spr = SPR.snap) => spring({ frame: frame - start, fps: FPS, config: cfg });

/**
 * Attack-decay envelope for every punch and tick, `t` frames after its cue: rises over `attack`
 * frames (the picture peaks just after its sound), then decays with time constant `tau`. No
 * velocity step at either end, unlike a half-sine on a hard window. Returns 0..1; multiply by the
 * amplitude. `attack` and `tau` are 60 fps frames, so a pulse lasts the same time at any fps.
 */
export const hitPulse = (t: number, attack = 2, tau = 5) => {
  const u = (t * 60) / FPS;
  return u <= 0 || u > attack + 6 * tau ? 0 : u < attack ? Math.sin((u / attack) * (Math.PI / 2)) : Math.exp(-(u - attack) / tau);
};

/**
 * Blur for an entrance at eased progress p (0..1), `px` at p = 0. Chromium quantises CSS blur (the
 * radius steps about every 0.5 px and anything under ~0.75 px renders fully sharp), so a ramp that
 * ends slowly snaps into focus while the element is almost still. This one is gone by 60% of the
 * move, while the element is still travelling fast and half transparent. Text lands sharp.
 */
export const blurIn = (p: number, px: number) => px * clamp(1 - p / 0.6);
/** Blur for an exit at eased progress q: it only starts once the element is already moving (q > 0.3). */
export const blurOut = (q: number, px: number) => px * clamp((q - 0.3) / 0.7);

/**
 * Vertical text moves: Chromium's headless shell snaps a text layer's vertical position to whole
 * pixels (horizontal stays sub-pixel), so the slow tail of an ease-out renders as 1 px ticks with
 * holds between them (a visible stair-step as a word settles). `arrive` rescales eased progress so
 * the move ends at `k` of its curve, while it still travels ~0.5-1 px/f, and then stops; `depart`
 * does the same for the slow start of an exit. Use them on the translateY of text and small UI;
 * opacity, blur and horizontal moves keep the plain progress.
 */
export const arrive = (p: number, k = 0.94) => clamp(p / k);
export const depart = (q: number, k = 0.06) => clamp((q - k) / (1 - k));
/**
 * The `k` for arrive() on a vertical move of `px` over `dur` frames on `ease`: the point of the
 * curve where its step falls below 1 px/f, so the move stops from ~1 px/f at any travel and fps.
 * The default 0.94 fits a ~40 px rise at 60 fps; a 140 px slide would stop from 3 px/f with it
 * (12 px/f at 30 fps), a 20 px one would tick.
 */
export const arriveK = (px: number, dur: number, ease: Ease = E.out) => {
  const n = Math.max(1, Math.round(dur));
  for (let i = 1; i <= n; i++) if (Math.abs(px) * (ease(i / n) - ease((i - 1) / n)) < 1) return clamp(ease((i - 1) / n), 0.5, 1);
  return 1;
};

/** Contact squash for a landing, `t` frames after contact: widen 8% and flatten 10%, back over ~8 f (at 60 fps). Anchor it at the contact edge. */
export const squash = (t: number) => {
  const k = hitPulse(t, 1, 4);
  return { along: 1 - 0.1 * k, across: 1 + 0.08 * k };
};

/** Deterministic pseudo-random in [0,1) from a number or string seed (Math.random is banned: renders must repeat). */
export const rand = (seed: number | string) => {
  const s = String(seed);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

/**
 * Whole frame for discrete state (typed characters, carets, counters, layout switches). The
 * motion-blur pass renders fractional frames; deciding state on Math.round keeps every sub-sample
 * of one output frame in agreement.
 */
export const fd = Math.round;

/**
 * Start offset (frames) of item i of n spread over `span` frames: 0 for the first, `span` for the
 * last. The ease shapes the gaps (E.linear: even; E.out: the first items bunch up, the tail spreads
 * out). Add it to the group's start: prog(f, at + stagger(i, n, 24), at + stagger(i, n, 24) + 26, E.out).
 * A group arrives within 30 f at 60 fps (references/motion-tokens.md §6); longer reads as a queue.
 */
export const stagger = (i: number, n: number, span: number, ease: Ease = E.linear) => (n > 1 ? span * ease(clamp(i / (n - 1))) : 0);

/**
 * Inertial scroll that starts `start` at v0 px/f and loses (1 - decay) of its speed every frame, in
 * closed form: x = v0·tau·(1 - d^n), v = v0·d^n, with tau = -1/ln d. Before `start` it moves at a
 * constant v0, so a shot can open at peak scroll speed and coast (the velocity has no step). `decay`
 * is per 60 fps frame (0.89: tau = 8.6 f, travel = 8.6·v0, within 0.5 px of rest after
 * `settle` frames); it is converted for other frame rates. A slow vertical tail of text settles in
 * 1 px ticks (references/chromium-rendering.md §15): for text use total * arrive(x / total,
 * 1 - 1 / |v0|) after `start` (x before it), which stops from ~1 px/f at any v0 > 1.
 */
export const inertia = (frame: number, start: number, v0: number, decay = 0.89) => {
  const d = clamp(decay, 1e-6, 0.999999) ** (60 / FPS);
  const tau = -1 / Math.log(d);
  const n = frame - start;
  const total = v0 * tau;
  const settle = Math.abs(total) > 0.5 ? Math.ceil(tau * Math.log(Math.abs(total) / 0.5)) : 0;
  if (n <= 0) return { x: v0 * n, v: v0, total, settle };
  const k = d ** n;
  return { x: total * (1 - k), v: v0 * k, total, settle };
};

/**
 * The film's own move: geometric decay toward `to`, starting at frame f0 with no ease-in. Most fast
 * moves in the film are this curve, so it reads as one hand. `k` is the per-frame ratio at 60 fps:
 * 0.949 for a window glide (still travelling 90 f later), 0.90 for a settle, 0.89 for a headline.
 * Before f0 it holds `from`. Never stops dead, never overshoots.
 */
export const glide = (f: number, f0: number, from: number, to: number, k = 0.949) => (f < f0 ? from : to + (from - to) * Math.pow(k, f - f0));

/**
 * The exit's curve: geometric growth from f0 at v0 px/f, ratio `k` per frame (1.14 fast, 1.07 slow).
 * A move on this curve cut at its fastest frame is the film's default seam.
 */
export const accel = (f: number, f0: number, from: number, k = 1.14, v0 = 1.5) => (f < f0 ? from : from + (v0 * (Math.pow(k, f - f0) - 1)) / (k - 1));

/** Same as glide for a 0..1 progress. */
export const decay = (f: number, f0: number, k = 0.92) => (f < f0 ? 0 : 1 - Math.pow(k, f - f0));

// ---------------------------------------------------------------------------------- copy lines
// The text motion system (TEXT-SYSTEM.md section 3): SET strikes and settles a line, DRAIN takes it
// away, RELAY hands a two-part sentence over at one anchor. fx/Line.tsx draws them; these are the
// numbers and the curves, React-free so Node checks can run the same maths (scripts/text-check.ts is
// specified in TEXT-SYSTEM.md section 5 but not on disk yet; lineFrame() is the hook it would use).
// Every settle is the house geometric decay (decay(), k per 60 fps frame); every exit uses E.smooth,
// E.in, E.exit and accel(). No new curves.

/** Which SET amounts a line uses. Line picks one from its role; pass `tier` to override (the name is 'title'). */
export type Tier = 'caption' | 'display' | 'hero' | 'title' | 'secondary';
/**
 * How a unit arrives. setup: the cadence; hit: lands on a picture event at full ink; born: a hit in
 * C.accent ("needs you." only); cut: present on a cut; lit: present at mute, steps to its colour on `litAt`.
 */
export type SetMode = 'setup' | 'hit' | 'born' | 'cut' | 'lit';

const setClose: Record<Tier, number> = { caption: 0.18, display: 0.13, hero: 0.1, title: 0.08, secondary: 0 };
const setSpread: Record<Tier, number> = { caption: 0.03, display: 0.025, hero: 0.02, title: 0.02, secondary: 0.03 };
const setHeft: Record<SetMode, number> = { setup: 100, hit: 150, born: 150, cut: 80, lit: 60 };
const setRead: Record<SetMode, number> = { setup: 5, hit: 0, born: 0, cut: 2, lit: 2 };

/**
 * SET, the house entrance: a word strikes decided, drawn whole at near-full ink from its onset frame,
 * and condenses to rest in weight and spacing (the weight settle is the visible strike). No vertical
 * travel, no blur, no clip, no overshoot. Grey is kept only where it means something (q-review's lit).
 */
export const SET = {
  k: 0.8, // weight, spread and close-up settle: rest + H·k^t
  kInk: 0.72, // ink settle: 1 - (1 - o0)·kInk^t (from o0 0.85: 0.85, 0.89, 0.92, 0.94, 0.96 at t 4; from 0.8: 0.96 at t 5)
  o0: { dark: 0.85, light: 0.8 }, // a setup word's first-frame ink, by stage: white-ish on the strike, never a grey placeholder
  cutO0: 1, // a cut-in's first-frame ink (switch-a uses 0.7)
  vmax: 3, // px/f on screen: rule 3. A glyph at ink inkFast or more that moves faster over a frame is decided on fd(f) (Line's guard, stepFast)
  inkFast: 0.75, // the ink from which rule 3 applies
  H: setHeft, // weight above rest on the onset frame, by mode
  lag: 0.6, // f: glyph j of a word starts its settle 0.6·j later (a curved leading edge; every glyph is drawn from the onset)
  ripple: 0.5, // f: a cut-in's word-to-word settle offset (all words are drawn on the cut)
  closeUpPx: 15, // the close-up on screen at every size; `close` is it in em per tier
  close: setClose, // em: a word starts this far right and closes up leftward (0 when a ROW driver owns x)
  spread: setSpread, // em per glyph step from the word's centre: the gaps only close
  lit: { steps: [0.5, 0.85, 1] as const, H: 100 }, // lit: the 3-frame OKLab colour step (on fd) and its 600 -> 500 settle
  read: setRead, // f after a unit's onset until it reads: resolved = the latest of these (setup + 5: ink 0.96 on both stages)
};

/**
 * Rule 3's mechanism (TEXT-SYSTEM.md section 2): an offset o(f) that moves more than `vmax` px/f over
 * frame F = fd(f), measured |o(F + 0.5) - o(F - 0.5)|, is decided on fd(f) on that frame. The master's
 * sub-frame samples sit within ±1/3 f of F, so they all draw it in one place and it stays sharp (a
 * smear of type is blur on type); slower frames keep the continuous o(f). `scale` converts o's px to
 * screen px. Line applies it to every glyph at ink SET.inkFast or more; use it for any other offset
 * that carries read type fast (a ROW you drive outside Line, a dot riding a glyph).
 */
export const stepFast =
  (o: (f: number) => number, vmax = SET.vmax, scale = 1) =>
  (f: number) => {
    const F = fd(f);
    return Math.abs(o(F + 0.5) - o(F - 0.5)) * scale > vmax ? o(F) : o(f);
  };

/**
 * DRAIN, the house exit, per word, DRAIN.gap apart in reading order, over DRAIN.dur: ink 1 -> 0 on
 * E.smooth, weight rest -> 400 on E.in, the glyph spread opens by 0.04 em per step on 1.25^t, and
 * the word drifts left 4.5·(size/84)·(1.25^t - 1) px. 'carried' keeps ink and weight only. The
 * title variant (Eclipse's fallback) takes the whole line at once over 16 f.
 */
const DRAIN_DUR = 9; // f: a word's drain; its last drawn frame is start + 8
export const DRAIN = {
  dur: DRAIN_DUR,
  gap: 1,
  weight: 400,
  spread: 0.04, // em per glyph step at the end of the drain
  grow: 1.25, // the spread's and the drift's growth per frame
  drift: 4.5, // px at 84 px: 1.0 px/f at t 0, 6 px/f on the last frame
  driftRef: 84,
  // f a comma out holds past out.at before it drains (fix7 #13): the whole first part waits the breath, then drains as
  // one wave DRAIN.gap apart with the comma word last, so it never stands alone at full ink ("use,", "work,", "agent,"
  // read as keywords when only they waited). The comma word starts where it always did: out.at + (n - 2)·gap + breath.
  breath: { caption: 4, display: 6 },
  // f after the comma word starts draining that the second part strikes: the whole drain, so B strikes on
  // the first frame the comma word is gone and the two parts never share the baseline (crit6 #3: "step  work,").
  lead: DRAIN_DUR,
  title: { dur: 16, spread: 0.1, scale: 0.96, weight: 380 },
};

/** One SET unit: a word or a phrase that strikes together. Word indices are into the Line's text split on spaces. */
export type SetUnit = {
  words: number | readonly [number, number]; // one word, or an inclusive range
  at: number; // onset frame: drawn from fd(f) >= at
  mode: SetMode;
  litAt?: number; // lit: the frame this phrase steps to its colour
  color?: string; // overrides the Line's colour (born defaults to C.accent)
  from?: string; // lit: the colour before the step (default C.mute)
  o0?: number; // first-frame ink (setup: by stage; hit, born, lit: 1; cut: SET.cutO0)
  H?: number; // weight above rest on the onset (SET.H[mode])
  close?: number; // em, the word close-up (SET.close[tier]; 0 under a ROW driver)
  spread?: number; // em per glyph step (SET.spread[tier])
  lag?: number; // f per glyph (SET.lag)
  ripple?: number; // f per word inside the unit (cut: SET.ripple, else 0)
  k?: number; // weight / spread / close-up decay (SET.k)
  kInk?: number; // ink decay (SET.kInk)
  by?: number; // settle on prog(f, onset, by, E.out) instead of the open decay, so it rests exactly on `by` (platforms: STILL)
  read?: number; // f after `at` that the unit reads (SET.read[mode])
};

/**
 * ROW: only the spacing moves, never the glyph size. `s` scales word centres about `anchor` (line
 * px, default the line's centre); `split` moves the words before / from that index by -/+ offset(f);
 * `dx` moves word w by dx(w, f) px (an inline slot: the words after it held open, then closing);
 * `shove` (iz1 R1) keeps the visible words centred on the line's align point and lets each new step
 * strike `gap` em past its rest gap, both easing at `k` per frame, so every new word shoves the
 * earlier ones left. Line resolves it against the layout (fx/Line.tsx rowShove); `onsets` are the
 * distinct onset frames of the line's units, ascending, and Line throws if they disagree.
 */
export type RowDriver =
  | { anchor?: number; s: (f: number) => number }
  | { split: number; offset: (f: number) => number }
  | { dx: (word: number, f: number) => number }
  | { shove: { onsets: readonly number[]; k: number; gap: number; edge?: number; lead?: number } };
/** A layout step (hook-b's type step): from fd(f) >= at, draw words [a, b] laid out alone at `size` (or the Line's size x `scale`). */
export type LineStep = { at: number; words?: readonly [number, number]; size?: number; scale?: number };
/**
 * The exit. drain / carried: per word from `at`, DRAIN.gap apart (comma: the whole line holds `breath - gap` f
 * more, so the comma word, last, starts on at + (n - 2)·gap + breath); title: the whole line over 16 f;
 * picture: the act's own exit (lift, band, occlusion, cut) and Line stays whole.
 */
export type LineOut =
  | { at: number; kind: 'drain' | 'carried'; comma?: { breath: number } }
  | { at: number; kind: 'title' }
  | { at: number; kind: 'picture'; clears?: number };
export type LinePlan = { units: readonly SetUnit[]; row?: RowDriver; layouts?: readonly LineStep[]; out?: LineOut; resolved?: number };

/** Inclusive word range of a unit. */
export const unitWords = (u: SetUnit): [number, number] => (typeof u.words === 'number' ? [u.words, u.words] : [u.words[0], u.words[1]]);

/** Onset frames of a ritardando: ritard(952, [3, 3, 22]) -> [952, 955, 958, 980]. Base gaps 2-4 f, the payoff gap 2.5-4x. */
export const ritard = (at: number, gaps: readonly number[]) => gaps.reduce<number[]>((acc, g) => [...acc, acc[acc.length - 1] + g], [at]);

/**
 * RELAY: the second part's first onset, DRAIN.lead (= DRAIN.dur) f after the first part's comma word starts
 * draining: the first frame the comma word is no longer drawn. relayAt(128, 4, 6) = 145 (hook),
 * relayAt(1538, 4, 4) = 1553 (calm), relayAt(2470, 6, 6) = 2489 (switch). The comma word is the last of the
 * first part's one drain wave, which starts on aOut + breath - gap (133, 1541, 2475: COPY's `out`).
 */
export const relayAt = (aOut: number, nA: number, breath: number) => aOut + (nA - 2) * DRAIN.gap + breath + DRAIN.lead;

/** A settle is over once SETTLE_END of it is left: the decay is rescaled to reach exactly 0 there, so a held line stops
 * stepping in sub-pixel x and half weight units (the critics saw raster ticks up to 30 f into holds). */
const SETTLE_END = 0.02;

/** Remaining share of a SET settle that started at `start`: k^(f - start) rescaled to end at SETTLE_END (1 before it), or
 * 1 - prog(f, start, by, E.out) when it must rest on `by`. */
export const settleRem = (f: number, start: number, k: number, by?: number) => {
  if (by !== undefined) return 1 - prog(f, start, Math.max(by, start + 1), E.out);
  if (f <= start) return 1;
  const end = Math.ceil(Math.log(SETTLE_END) / Math.log(k));
  if (f - start >= end) return 0;
  const kEnd = Math.pow(k, end);
  return (Math.pow(k, f - start) - kEnd) / (1 - kEnd);
};

/**
 * Frame word `w` of `n` starts draining under `out`: out.at + w·gap, and with a comma every word waits the breath
 * (fix7 #13): out.at + w·gap + breath - gap. The first part then leaves as one 1 f wave whose last word (the comma)
 * starts on out.at + (n - 2)·gap + breath, the frame it started on when only it waited, so relayAt is unchanged.
 */
export const drainStart = (out: { at: number; comma?: { breath: number } }, w: number, n: number) =>
  out.at + w * DRAIN.gap + (out.comma && n > 1 ? out.comma.breath - DRAIN.gap : 0);

/** A drained word started at `s`: ink left, weight share toward DRAIN.weight, spread share (0..1), and drift (px, negative = left) at `size`. */
export const drainAt = (f: number, s: number, size: number) => ({
  ink: 1 - prog(f, s, s + DRAIN.dur, E.smooth),
  weight: prog(f, s, s + DRAIN.dur, E.in),
  spread: accel(f, s, 0, DRAIN.grow, 1) / accel(s + DRAIN.dur, s, 0, DRAIN.grow, 1),
  drift: -accel(f, s, 0, DRAIN.grow, DRAIN.drift * (DRAIN.grow - 1)) * (size / DRAIN.driftRef),
});

/**
 * A line's frames from its plan: in (first drawn), resolved (fully readable), out (the first frame a word
 * starts leaving: a comma drain's out.at + breath - gap) and clears (the first frame nothing is drawn;
 * undefined for a picture exit that names none). `words` is the line's word count (default: the highest
 * index the units name, plus one).
 */
export const lineTimes = (plan: LinePlan, words?: number) => {
  const n = words ?? Math.max(...plan.units.map((u) => unitWords(u)[1])) + 1;
  const first = Math.min(...plan.units.map((u) => u.at));
  const resolved = plan.resolved ?? Math.max(...plan.units.map((u) => u.at + (u.read ?? SET.read[u.mode])));
  const o = plan.out;
  let clears: number | undefined;
  let out = o?.at;
  if (o?.kind === 'drain' || o?.kind === 'carried') {
    const starts = Array.from({ length: n }, (_, w) => drainStart(o, w, n));
    out = Math.min(...starts);
    clears = Math.max(...starts) + DRAIN.dur;
  } else if (o?.kind === 'title') clears = o.at + DRAIN.title.dur;
  else if (o?.kind === 'picture') clears = o.clears;
  return { in: first, resolved, out, clears, words: n };
};