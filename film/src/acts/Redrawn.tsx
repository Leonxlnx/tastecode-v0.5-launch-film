import React, { useMemo } from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { C, TYPE } from '../brand/tokens';
import { Clip, ProxyClip } from '../fx/kit';
import { fitLine, Line, lineGeometry } from '../fx/Line';
import type { LinePlan } from '../fx/Line';
import { HEAD, Shader } from '../fx/Shader';
import { accel, clamp, decay, E, fd, lmix, mix, prog, SET, settleRem } from '../lib/anim';
import { inkBox } from '../lib/measure';
import { hex } from '../style/shaders';
import { ACT, b, copy, H, W } from '../timeline';
import type { Sound } from './Sound';

// The yellow flood shuts like a shutter down into one gutter of a plane of dark screens. In the first
// run setup tile the real theme wipe starts from the real pointer, and that one circle keeps growing in
// plane coordinates: every tile it crosses turns to its real light take. The camera then sinks down the
// plane (a short drift left, almost no sideways travel: Leon found the film panning right too much),
// past the profile seal, onto the one cell left open, where the line's two halves lock together on the
// seal's second strike. Appearance sits straight below that cell; it rises, carries the line up out of
// the frame and takes the frame (round 8, Leon: shorter, more than light and dark, no green): the real
// Appearance page in its default neutral colours coasts on, one move whose speed only falls, from the Theme
// previews through Light mode to Dark mode, rests, and then falls away out through the frame's bottom, leaving
// black for the cut to the calm card. Crit8: the seal and the onboarding tiles are drawn without colour (their
// seals were the act's only green), and no account name is readable at any size (Covers).
const DUR = ACT.redrawn.dur;
const G = 10; // the gutter
const R = 20; // the tile radius
const ZOOM = 1.3; // the plane is close enough to read what each tile is

// The master gutter runs along plane y = 0; the shutter closes onto it and dies at this crossing.
const CROSS_X = -35;
const WIDTH_AT = 15; // f: the shutter starts closing sideways
const SHUT_END = 38; // f: nothing of the bar is left

const DISC_AT = 8; // f: clip 296 of onboarding, where the real circle leaves the pointer
const TAKE = 212; // f, abs 1276: Appearance starts rising into the frame; its top edge carries the held line out (HANDOFF e)
const TAKE_LEN = 30;
// The camera's slow push through the hold ends where it did when the take started at 236, so local 0-212 (the
// approved bento and the line's hold) are unchanged frame for frame, and the line keeps its approved size.
const CAM_END = 266;
const READ_AT = 236;
// The page falls on the house fall (accel, x1.136 a frame from 0.25 px/f) and is wholly gone before the cut: it
// starts 6 f after the scroll has come to rest (abs 1348; crit8: the page now holds still from 1342, and the fall stays
// under 1 px/f until 1359, instead of the scroll landing into it), the black opens above the page's top edge from about 1368
// (Dark mode whole on screen), and the fall finishes the drop out through the frame's bottom, its last sliver on 1398 and 1399
// pure black, so the act ends on the completed drop and the calm card's black takes a black cut (crit r8: at 290 the
// page still filled the lower half on 1399 and the cut chopped the fall).
const FALL = 284;
const FALL_K = 1.136;
const FALL_V0 = 0.2507;

// The open cell: one slot of the row under the seal, with Appearance (HERO) straight below it.
const OPEN = { x: -895, y: 1265, w: 1110, h: 620 };

// The seal's two strikes land on the beat: clip frames of set-profile-coin-green, local film frames.
const STRIKE = { clipA: 148, clipB: 212, a: 84, b: 140 };

// The line (TEXT-SYSTEM.md, Redrawn: ROW lock + SET, crit6 #4 A and #2 A): one sentence, centred in the open
// cell, riding the plane. Its halves "Make it look" | "and work your way." strike whole on b(11, 2, 1), each
// LOCK_D em outward from the seam, so the seam reads as two halves held apart (about 0.95 em), never as a double
// space. They settle for 3 f, then close on a gentle quadratic ease-in from LOCK_GO, travelling visibly for 18 f and
// accelerating into the seal's second strike (b(11, 3), its land), and stop dead on it with one word space and no overshoot; on that
// frame "your way." takes a weight strike, so the land has a visible hit. No word cascade, no motion of its own
// in the hold. Exit, HANDOFF (e) edge ride: Appearance rises from below, and once its top edge comes within
// PUSH_GAP of the line's ink it carries the line at that gap, up and out through the frame top. No edge ever
// crosses a glyph but the frame's own top, which takes the ink band in 2 frames at 40 px/f or more (rule 1).
const LINE = copy('redrawn').text;
const LINE_WORDS = LINE.split(' ');
const LINE_IN = b(11, 2, 1) - ACT.redrawn.from; // 119: the halves are drawn whole, apart
const LINE_SEAM = 3; // the first word of the second half, "and"
const LINE_HIT = 5; // "your way.": struck again on the lock
const LINE_LOCK = STRIKE.b; // 140 = b(11, 3): the halves lock with the seal's second strike
const TYPE_BOX = { x: OPEN.x + 80, w: OPEN.w - 2 * 80 }; // plane px: 80 px of paper to the tile on each side
const TYPE_CY = 1560; // plane px: the line's middle sits on the frame's middle through the hold
// The lock (crit7 #7): each half strikes LOCK_D em outward from the seam (about 36 px on screen; the seam then reads
// about 1 em against a 0.19 em word space), and from LOCK_GO, 3 f after the strike, closes on a gentle ease-in
// (LOCK_EASE, half linear and half quadratic) exactly onto LINE_LOCK. It leaves at half its mean speed, so the seam
// closes from its first frames and never stands still long enough to read as a double space (a pure t^2 held it to
// 1191 on the half-res sheet, the old E.in held it 18 f and shut it in 3), and it accelerates into the strike at 1.5x
// its mean speed, with no overshoot. Any closing frame over 3 px/f on screen is drawn on fd(f) by Line's rule-3 guard
// (zoom: the plane's scale), so it steps sharp in the master instead of smearing.
const LOCK_D = 0.4;
const LOCK_GO = LINE_IN + 3; // 122, abs 1186
const LOCK_EASE = (t: number) => t * (0.5 + 0.5 * t);
// The edge ride: screen px between the line's ink bottom and Appearance's top edge while it carries the line. The
// first frame it does is LINE_OUT; the line is gone above the frame top by LINE_CLEARS (both asserted in CopyLine).
const PUSH_GAP = 130;
const LINE_OUT = TAKE + 8; // 220, abs 1284: Appearance's edge reaches PUSH_GAP under the ink and starts to carry the line
const LINE_CLEARS = TAKE + 14; // 226, abs 1290: the first frame the line, above the frame top, is no longer drawn
// The whole line strikes on one frame with no per-glyph lag: seven words struck together each restarted SET.lag's
// leading edge, which striped the centred line word by word. It condenses as one: ink 0.8 -> 1, weight 600 -> 500.
const LINE_SPREAD = 0.02; // em per glyph step about each word's centre
// Every word strikes on the same frame with no close-up, so each centred spread pushes into the word spaces it
// shares ("work your" nearly touched: 4 px against 7 at rest, half res). Each word space inside a half opens by
// exactly what its two neighbours' spreads push into it (plus a hair, so Line keeps both pivots centred), on the
// spread's own decay, so every word space reads at rest from the first frame and never dips under it. Counted
// outward from the seam, the row only ever closes toward the lock. The period of "way.", which carries three
// spaces, is the fastest glyph on the strike: about 3.6 px/f on screen into abs 1184 (Line's guard draws that
// frame on fd), 2.9 into 1185 and falling. The lock closes each half about 33 px on screen over 18 f, at most about
// 2.8 px/f (into 1204), so the guard has no lock frame to step (the old E.in stepped 1201-1204 at up to 17 px).
const SPACE_EPS = 0.0005;
const spaceEm = (a: number) => ((LINE_WORDS[a].length - 1) / 2 + (LINE_WORDS[a + 1].length - 1) / 2) * LINE_SPREAD + SPACE_EPS;
/** em: how far word w's spaces carry it outward on the strike, summed from the seam. */
const openEm = (w: number) => {
  let s = 0;
  if (w >= LINE_SEAM) for (let a = LINE_SEAM; a < w; a++) s += spaceEm(a);
  else for (let a = w; a < LINE_SEAM - 1; a++) s += spaceEm(a);
  return s;
};

/** em: how far the seam word's own spread reaches into the seam on the strike (its last or first glyph step). */
const seamEm = (w: number) => ((LINE_WORDS[w < LINE_SEAM ? LINE_SEAM - 1 : LINE_SEAM].length - 1) / 2) * LINE_SPREAD;

/**
 * ROW lock: the halves close on LOCK_EASE into the strike, and their word spaces hold the spreads off. As "look" and
 * "and" condense they would open the seam by 0.05 em (it read as a hold to 1188), so each half also comes in by its
 * seam word's condensing, fading out with the lock's own travel: the seam stays put from the strike to LOCK_GO, closes
 * from then on, and is exactly one word space on LINE_LOCK.
 */
const lockRow = (size: number) => ({
  dx: (w: number, f: number) => {
    const go = 1 - prog(f, LOCK_GO, LINE_LOCK, LOCK_EASE);
    const rem = settleRem(f, LINE_IN, SET.k);
    return (w < LINE_SEAM ? -1 : 1) * size * (LOCK_D * go + openEm(w) * rem - seamEm(w) * (1 - rem) * go);
  },
});

/**
 * The line's plan. One strike for the whole line on LINE_IN (setup on paper: o0 0.8, H 100, spread 0.02 em, no
 * per-glyph lag, no close-up: the ROW lock owns x). "your way." strikes with it and again on the lock: Line's lit
 * step from C.ink to C.ink is a weight strike (+SET.lit.H) with no colour change.
 */
export const redrawnPlan = (size: number): LinePlan => ({
  units: [
    { words: [0, LINE_HIT - 1], at: LINE_IN, mode: 'setup', spread: LINE_SPREAD, lag: 0 },
    { words: [LINE_HIT, LINE_WORDS.length - 1], at: LINE_IN, mode: 'lit', litAt: LINE_LOCK, from: C.ink, o0: SET.o0.light, H: SET.H.setup, spread: LINE_SPREAD, lag: 0 },
  ],
  row: lockRow(size),
  out: { at: LINE_OUT, kind: 'picture', clears: LINE_CLEARS },
  resolved: LINE_LOCK,
});

export const REDRAWN = { take: TAKE, fall: FALL, typeAt: LINE_IN };
/** The line's frames, local: drawn, locked (resolved), first carried out by Appearance, and the first frame it is no longer drawn. */
export const REDRAWN_LINE = { in: LINE_IN, resolved: LINE_LOCK, out: LINE_OUT, clears: LINE_CLEARS };

export const REDRAWN_SOUND: Sound[] = [
  { f: 1, kind: 'shutter', weight: 0.9 },
  { f: STRIKE.a, kind: 'press', weight: 0.5 }, // the seal's first strike, the coin centred under the camera
  { f: STRIKE.b, kind: 'land', weight: 0.7 }, // the seal's second strike, the coin at the top centre over the open cell
  { f: TAKE + 6, kind: 'whoosh', weight: 0.75 }, // Appearance rising from below, 1-2 f ahead of its fastest frames (f1283-1284)
];

type Tile = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Top-left of the crop, in the clip's CSS px. */
  cx: number;
  cy: number;
  /** Clip CSS px to plane px. */
  s: number;
  /** Local frame to the clip's frame: each tile sits in the middle of its own moment. */
  map: (f: number) => number;
  /** Long-side 1280 proxy instead of the full PNG. */
  proxy?: boolean;
  /** The same moment from the real light take. */
  lightId?: string;
  /** Where the dark clip's crop begins inside the light clip, when the dark one is itself a crop. */
  lightAt?: { x: number; y: number };
  /** The light take only exists for these clip frames. */
  lightRange?: [number, number];
  /** This tile's footage holds the real wipe itself. */
  real?: boolean;
  /**
   * Drawn without colour (crit8, Leon: "the appearance one ... looks kind of green"): these takes carry the profile's
   * green seal (the coin, the onboarding's name seal and its sidebar avatar) and the preview's green diff rows. Every
   * other colour in them is already neutral, so only the green goes; no patch, no edge.
   */
  mono?: boolean;
};

/**
 * What a take must never show (crit8 privacy: no account name at any size), drawn over the take inside its own crop, so
 * it tracks the tile exactly. Each is the place's own flat ground, in the take's CSS px, on the clip frames in `at`
 * (decided on fd, like the clip's own frame). `light` is the ground once the take itself is in its light theme.
 */
type Cover = { x: number; y: number; w: number; h: number; at: [number, number]; fill: string; light?: string };
// The preview window's sidebar foot: the identity card (avatar, the profile name or "Local profile" in its box, the chevron;
// ink CSS 541-715.3 x 617-647.7) under the sidebar's own ground. The window's rounded corner starts at y 651.8 on x 541
// and the sidebar's divider is right of 720, so the rect touches neither. The window is whole from clip 56 to 866.
const ONB_CARD = { x: 540, y: 614, w: 178, h: 36 };
// The name field's inside (its 1 px border is CSS 75.8-455.8 x 477-527, radius about 8): the typed name (ink
// x 94-170 y 491-513) and its caret go, the field stays, empty. From the first key (132) to the last frame before the
// next step's labels reach this rect (204); the name leaves the field on 199-204.
const ONB_FIELD = { x: 84, y: 484, w: 363, h: 36 };
const DARK_SIDEBAR = 'rgb(19,19,19)'; // lint-ok: the dark sidebar's own ground (#131313), sampled from the take's PNGs
const LIGHT_SIDEBAR = 'rgb(252,252,252)'; // lint-ok: the light sidebar's own ground (#FCFCFC), sampled from the take's PNGs
const COVERS: Record<string, Cover[]> = {
  onboarding: [
    { ...ONB_CARD, at: [56, 866], fill: DARK_SIDEBAR, light: LIGHT_SIDEBAR },
    { ...ONB_FIELD, at: [132, 204], fill: 'rgb(16,16,16)' }, // lint-ok: the dark field's own inside (#101010), sampled
  ],
  'onboarding-light': [
    { ...ONB_CARD, at: [56, 866], fill: LIGHT_SIDEBAR },
    { ...ONB_FIELD, at: [132, 204], fill: 'rgb(253,253,253)' }, // lint-ok: the light field's own inside (#FDFDFD), sampled
  ],
};
// The dark onboarding take's own theme over the card: dark, the real circle from the pointer on Light (CSS 269.7, 431)
// crosses it on clip 311-312, light from 313, and the take goes back to Dark over it on 395.
const ONB_THEME = { wipe: 296, light: 313, dark: 395, x: 269.7, y: 431 };

// Where the real pointer presses Light, in plane px; the one circle grows from here.
const ORIGIN = { x: -1040 + 269.7 * 0.95, y: 5 + (431 - 60) * 0.95 };

// The real circle's measured radius inside its tile, then the same front running on across the plane.
const discR = (f: number) => interpolate(f, [DISC_AT, DISC_AT + 10, DISC_AT + 14, DISC_AT + 19, DISC_AT + 24, DISC_AT + 104], [0, 114, 285, 756, 953, 953 + 80 * 38], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

// After the wipe the setup clip waits on Light, slowing down, until the camera has left it.
const setupMap = (f: number) => (f < DISC_AT + 49 ? 296 + (f - DISC_AT) : 345 + (f - DISC_AT - 49) * 0.35);
// The real strikes sit on the beat; after them the seal keeps breathing.
const coinMap = (f: number) =>
  f < STRIKE.a ? STRIKE.clipA + (f - STRIKE.a) : f < STRIKE.b ? STRIKE.clipA + ((f - STRIKE.a) * (STRIKE.clipB - STRIKE.clipA)) / (STRIKE.b - STRIKE.a) : Math.min(239, STRIKE.clipB + (f - STRIKE.b) * 0.5);

const ONB_A: [number, number] = [150, 250];
const ONB_B: [number, number] = [530, 620];
const ONB_C: [number, number] = [840, 940];
const KEYS: [number, number] = [20, 129];
const GENERAL: [number, number] = [60, 189];
const SEAL: [number, number] = [125, 239];

// The plane, in rows the camera sinks through. Nothing is on a shared grid but the master gutter the
// shutter lands in; the open cell and Appearance share one column (centre x -340), the camera's.
const TILES: Tile[] = [
  // above the master gutter
  { id: 'hero-window2', lightId: 'hero-window-light2', x: -1500, y: -625, w: 730, h: 620, cx: 0, cy: 130, s: 1.06, map: (f) => 60 + f, proxy: true },
  { id: 'set-providers', lightId: 'set-providers-light', lightAt: { x: -396, y: -496 }, x: -760, y: -625, w: 720, h: 620, cx: 396, cy: 496, s: 3.6, map: (f) => 20 + f },
  { id: 'set-keybinds', lightId: 'set-keybinds-light', lightRange: KEYS, x: -30, y: -625, w: 980, h: 620, cx: 330, cy: 60, s: 1, map: (f) => 26 + f },
  // below it
  { id: 'set-keybinds', lightId: 'set-keybinds-light', lightRange: KEYS, x: -1800, y: 5, w: 750, h: 620, cx: 390, cy: 70, s: 1, map: (f) => 40 + f },
  { id: 'onboarding', x: -1040, y: 5, w: 1000, h: 620, cx: 0, cy: 60, s: 0.95, map: setupMap, real: true, mono: true },
  { id: 'set-general-pictures', lightId: 'set-general-light', lightRange: GENERAL, lightAt: { x: 784, y: 119 }, x: -30, y: 5, w: 660, h: 620, cx: 0, cy: 90, s: 1.706, map: (f) => 36 + f },
  // the seal's row: the coin sits straight above the open cell, under the camera at the first strike
  { id: 'set-keybinds-macro-light', lightRange: KEYS, x: -1648, y: 635, w: 860, h: 340, cx: 0, cy: 0, s: 3, map: (f) => 60 + f * 0.35 },
  { id: 'set-general', lightId: 'set-general-light', lightRange: GENERAL, x: -1648, y: 985, w: 860, h: 270, cx: 524, cy: 240, s: 1.1, map: (f) => 158 + (f - 150) * 0.8 },
  // The seal (crit8): both takes' seals are green (the dark take's only other seal is lavender), so it strikes in grey.
  { id: 'set-profile-coin', lightId: 'set-profile-coin-green', lightRange: SEAL, x: -778, y: 635, w: 720, h: 620, cx: 12, cy: 18, s: 3.5, map: coinMap, mono: true },
  { id: 'onboarding', lightId: 'onboarding-light', lightRange: ONB_A, x: -48, y: 635, w: 1050, h: 620, cx: 30, cy: 140, s: 1.1, map: (f) => 132 + (f - 10) * 0.8, mono: true },
  // the open cell's row: a tile on each side of it (their inner edges are the hold's slivers: a heading and a button, the providers)
  { id: 'onboarding', lightId: 'onboarding-light', lightRange: ONB_C, x: OPEN.x - 10 - 490, y: OPEN.y, w: 490, h: 620, cx: 0, cy: 0, s: 1.06, map: (f) => 866 + (f - 200) },
  { id: 'onboarding', lightId: 'onboarding-light', lightRange: ONB_B, x: OPEN.x + OPEN.w + 10, y: OPEN.y, w: 1200, h: 620, cx: 20, cy: 215, s: 1.4, map: (f) => 521 + (f - 50) },
  // Appearance's row: its neighbours
  { id: 'hero-window2', lightId: 'hero-window-light2', x: -870 - 10 - 980, y: 1895, w: 980, h: 620, cx: 276, cy: 74, s: 1.25, map: (f) => 90 + f * 0.5 },
  { id: 'set-general-pictures', lightId: 'set-general-light', lightRange: GENERAL, lightAt: { x: 784, y: 119 }, x: -870 + 1060 + 10, y: 1895, w: 660, h: 620, cx: 0, cy: 200, s: 1.706, map: (f) => 60 + f },
];

// The cell that takes the frame. It sits centred under the open cell, so the take is a rise and a push, not a pan.
const HERO = { x: -870, y: 1895, w: 1060, h: 800 };
// Its page: set-appearance-scroll (capture C1): Settings > Appearance, Light, the default "Neutral" accent
// and "Graphite" ground, no hex typed, a 912 x 513 CSS px clip of the content column (DPR 2.105). Its top 34.2 CSS px
// (PNG rows 0-71) are the Settings titlebar strip, with its hairline on rows 69-71; the page's own scroll container
// starts on row 72. The crop starts two rows lower, on row 74, so the resample never reaches the hairline (from 72 it
// bled row 71 into a 1 px full-width divider under the cell's top edge, 1279-1300).
const PAGE = { id: 'set-appearance-scroll', w: 912, h: 513, top: 74 / 2.105 };
const GROUND = 'rgb(253, 253, 253)'; // lint-ok: the page's own ground (#FDFDFD), measured on the clip's PNGs; the cell continues it
// The take's real scrollTop per clip frame (meta.json marks.scroll): 0 to f29, then these whole-CSS-px steps from f30
// to f169 (300 px in all), then 300 to f199. Edge sets scrollTop in whole px only, so the steps are 1-4 px.
const STEPS = '11211121112112112121221221222222222223223223233233233333332333433333333333333433323333333233233232232232222222222212212212121121121112111211';
const SCROLL_TOP = ((): number[] => {
  const a: number[] = [];
  let s = 0;
  for (let i = 0; i < 200; i++) a.push((s += i >= 30 && i < 170 ? Number(STEPS[i - 30]) : 0));
  if (s !== 300 || a[169] !== 300 || a[29] !== 0) throw new Error(`Redrawn: the scroll steps add to ${s}, not the take's 300 CSS px`);
  return a;
})();
const SCROLL_MAX = 300;
/**
 * The take's own frame for scroll y: the one whose real scrollTop is nearest (the holds use f0 and f199, the clean
 * ones), and the CSS px it has to move by (down, positive) to sit exactly on y. The page only ever translates while it
 * scrolls, so the picture is that frame's own pixels, under 2.5 CSS px from where the take put them.
 * Edge paints a scroll offset on whole device px (crit8, registered on the take's PNGs): frame k's content sits at
 * round(scrollTop * DPR) / DPR, up to 0.24 CSS px off its scrollTop (168 -> 169 steps 3 device px, not 2.1), which
 * stepped the slow end of the scroll by up to 1 px a frame whenever the picture changed frames. The shift uses that
 * painted offset, so the picture's frame changes never move the page.
 */
const PAGE_DPR = 1920 / PAGE.w; // the take's device px per CSS px (its PNGs are 1920 wide)
const PAINTED = SCROLL_TOP.map((t) => Math.round(t * PAGE_DPR) / PAGE_DPR);
const pageFrame = (y: number) => {
  if (y <= 0.5) return { frame: 0, shift: -y };
  if (y >= SCROLL_MAX - 0.5) return { frame: 199, shift: PAINTED[199] - y };
  let i = 30;
  while (PAINTED[i] < y) i++;
  const k = y - PAINTED[i - 1] < PAINTED[i] - y ? i - 1 : i;
  const frame = SCROLL_TOP[k] === 0 ? 0 : k;
  return { frame, shift: PAINTED[k] - y };
};
// The page's framing once it owns the frame, in screen px per CSS px: 1.097x the take's own pixels, so the titlebar
// strip (and the scroll container's top edge, PAGE_TOP_Y) sits above the frame, the page's bottom is 8 px under it
// (room for the residual shift, at most 1.5 CSS px = 3.5 px), and the text (CSS x 84-827) keeps 100 px of page to each side.
const PAGE_S = 2.31;
const PAGE_TOP_Y = -16;
// A slow push about the frame's centre from the rise to the cut, so the take's scale tail never stops dead.
const PAGE_PUSH = 1.01;
// Crit8b: the scroll starts while the scroll container's top edge (pageGeom's edgeY) still sits inside the cell, in its
// blank ground below the cell's top edge, and the container's clip sliced the heading on an invisible line mid-frame
// (1292-1296). The take only ever translates (its frames match frame 0 moved by their painted offset, pixel for pixel),
// so above that edge the page draws the take's frame 0 moved up by the same scroll, overlapping the container by
// BAND_LAP CSS px so their two edges never leave a seam: the content runs on, whole, to the cell's own top edge.
const BAND_LAP = 1;
const tick = (f: number, at: number, len: number) => prog(f, at, at + len, E.tick);

/**
 * Camera over the plane: it sinks in three asymmetric ticks (the coin under it at the first strike, the open
 * cell under it from f122), with a short drift left inside the first and a smaller one back inside the last,
 * and a tail that keeps creeping down. Sideways it moves 180 + 60 plane px in all; the old pan right was 2065.
 */
const camera = (f: number) => {
  const x = -220 - 180 * tick(f, 44, 56) + 60 * tick(f, 104, 56);
  const y = 120 + 760 * tick(f, 36, 60) + 500 * tick(f, 76, 46) + 140 * tick(f, 106, 52) + f * 0.2;
  const z = ZOOM * lmix(1.12, 1, decay(f, 0, 0.93)) * lmix(1, 1.12, prog(f, 140, CAM_END, E.cam));
  return { x, y, z };
};
// The zoom only grows through the hold; the line keeps the size it was approved at (sized at local 236, about 1.449).
const Z_READ = camera(READ_AT).z;

/**
 * The take at f: the camera, the take's progress, Appearance's top edge on screen, and the plane's push (it scales
 * by pushK about the cell's centre, oy on screen, so its neighbours are pushed back from the growing cell).
 */
const takeAt = (f: number) => {
  const cam = camera(f);
  const take = prog(f, TAKE, TAKE + TAKE_LEN, E.push);
  const heroY0 = H / 2 + (HERO.y - cam.y) * cam.z;
  return { cam, take, heroY0, edge: mix(heroY0, -150, take), oy: heroY0 + (HERO.h * cam.z) / 2, pushK: lmix(1, 1.34, take) };
};
/** Screen y of plane y at f, before the fall (the line has left the frame long before FALL). */
const screenY = (t: ReturnType<typeof takeAt>, y: number) => t.oy + (H / 2 + (y - t.cam.y) * t.cam.z - t.oy) * t.pushK;
/** HANDOFF (e), the edge ride: screen px (up, negative) that Appearance's top edge carries the line, PUSH_GAP under its ink. */
const rideAt = (f: number, inkBottom: number) => {
  const t = takeAt(f);
  return Math.min(0, t.edge - PUSH_GAP - screenY(t, inkBottom));
};

/**
 * The page's place at f, before its own scroll: the scroll container's top edge on screen, and its scale (screen px per
 * CSS px). On the plane it fills the cell's width with that edge on the cell's top edge (the titlebar strip is never
 * drawn: the cell's own ground continues the page's), and it grows on the take's curve to PAGE_S with that edge on
 * PAGE_TOP_Y, centred on the column, under the slow push about the frame's centre.
 */
const pageGeom = (f: number) => {
  const t = takeAt(f);
  const push = lmix(1, PAGE_PUSH, prog(f, TAKE, DUR, E.linear));
  const s = lmix((t.cam.z * HERO.w) / PAGE.w, PAGE_S, t.take);
  return { push, s, pageS: s * push, edgeY: H / 2 + (mix(t.heroY0, PAGE_TOP_Y, t.take) - H / 2) * push };
};

// The move after the rise (crit8: the rise fell to 3.4 px/f, half res, on 1308, then the take's own scroll sped up again
// to 6 px/f on 1325-1336 and only rested about 1369, straight into the fall). Now Appearance's rise and its page's scroll
// are one move whose speed only falls, from the rise's fastest frame to rest. Speed is taken where the eye is, at the
// frame's middle, in screen px a frame, up: riseV is what the take's rise gives there (the top edge climbing, the page
// growing), and the move's speed is the (smooth) larger of riseV and a target that starts on SCROLL.at, the rise's
// fastest frame (local 218.9, abs 1282.9), under the rise's own speed, and falls on the house settle (settleRem at
// SCROLL_K: an inertial scroll's decay, rescaled so it rests exactly). The page scrolls by what that speed has over the
// rise, so the scroll takes over as the rise dies away (1284-1288) and the page coasts on one falling curve from the
// Theme previews through Light mode onto Dark mode, 300 CSS px down: 115 px/f on 1283, 57 on 1290, 18.2 on 1306, 2.2 on
// 1330, at rest from SCROLL.end (local 278, abs 1342), 6 f before the fall starts and 17 f before it passes 1 px/f.
// The handover from the rise to the target is a smooth maximum, taken on the speeds' logs (crit8b: the hard max changed
// the deceleration from about 11 to 2 px/f a frame, half res, between two frames, a slight catch on 1286-1287): while the
// two are within a ratio of e^SCROLL_BLEND the log speed is max(log rise, log target) plus
// (SCROLL_BLEND - |log rise - log target|)^2 / (4 SCROLL_BLEND), so the deceleration passes from the rise's to the
// target's over several frames. Its slope is a weighted mean of the two slopes, so the speed still only falls; outside
// that ratio it is the plain maximum, so the scroll leaves SCROLL.at at zero speed and the move rests exactly.
const SUB = 8; // samples a frame
const SCROLL_K = 0.935;
const SCROLL_BLEND = Math.log(1.5);
const smoothMax = (p: number, q: number) => {
  if (p <= 0 || q <= 0) return Math.max(p, q, 0);
  return Math.max(p, q) * Math.exp(Math.max(0, SCROLL_BLEND - Math.abs(Math.log(p / q))) ** 2 / (4 * SCROLL_BLEND));
};
/** Screen px a frame (up) that the take's rise moves the page's content at the frame's middle at f. */
const riseV = (f: number) => {
  const a = pageGeom(f - 0.5 / SUB);
  const b = pageGeom(f + 0.5 / SUB);
  const g = pageGeom(f);
  return -(b.edgeY - a.edgeY + ((b.pageS - a.pageS) * (H / 2 - g.edgeY)) / g.pageS) * SUB;
};
const SCROLL = ((): { at: number; end: number; a: number; y: number[] } => {
  let at = TAKE;
  for (let f = TAKE; f <= TAKE + TAKE_LEN; f += 1 / SUB) if (riseV(f) > riseV(at)) at = f;
  let end = Math.ceil(at);
  while (settleRem(end, at, SCROLL_K) > 0) end++;
  const n = Math.ceil((end - at) * SUB);
  const rise: number[] = [];
  const scale: number[] = [];
  const target: number[] = [];
  for (let i = 0; i <= n; i++) {
    const f = at + i / SUB;
    rise.push(riseV(f));
    scale.push(pageGeom(f).pageS);
    target.push(settleRem(f, at, SCROLL_K));
  }
  /** CSS px scrolled by each sample, for a target that starts at `a` screen px a frame. */
  const run = (a: number) => {
    const y = [0];
    const v = (i: number) => Math.max(0, smoothMax(Math.max(0, rise[i]), a * target[i]) - rise[i]) / scale[i];
    for (let i = 1; i <= n; i++) y.push(y[i - 1] + (v(i - 1) + v(i)) / (2 * SUB));
    return y;
  };
  let lo = 0;
  let hi = rise[0];
  if (run(hi)[n] < SCROLL_MAX) throw new Error(`Redrawn: at SCROLL_K ${SCROLL_K} the scroll cannot cover ${SCROLL_MAX} CSS px without starting faster than the rise (${rise[0].toFixed(1)} px/f)`);
  for (let k = 0; k < 60; k++) {
    const m = (lo + hi) / 2;
    if (run(m)[n] < SCROLL_MAX) lo = m;
    else hi = m;
  }
  const y = run(hi);
  const y1 = y[n];
  return { at, end, a: hi, y: y.map((v) => (v * SCROLL_MAX) / y1) };
})();
/** CSS px: where the page is scrolled to at local f (0 until SCROLL.at, 300 from SCROLL.end). */
const scrollAt = (f: number) => {
  const u = (f - SCROLL.at) * SUB;
  if (u <= 0) return 0;
  const n = SCROLL.y.length - 1;
  if (u >= n) return SCROLL_MAX;
  const i = Math.floor(u);
  return mix(SCROLL.y[i], SCROLL.y[i + 1], u - i);
};
/** Screen px a frame (up) that the page's content moves at the frame's middle, rise and scroll together, over frame f. */
const pageV = (f: number) => {
  const a = pageGeom(f - 0.5);
  const b = pageGeom(f + 0.5);
  const g = pageGeom(f);
  return -(b.edgeY - a.edgeY + ((b.pageS - a.pageS) * (H / 2 - g.edgeY)) / g.pageS) + g.pageS * (scrollAt(f + 0.5) - scrollAt(f - 0.5));
};
// The one curve: from the rise's fastest frame to rest the speed never rises (0.05 px/f of slack for the sampling).
for (let f = Math.ceil(SCROLL.at); f < SCROLL.end; f++) {
  if (pageV(f + 1) > pageV(f) + 0.05) throw new Error(`Redrawn: the page speeds up again on local ${f + 1} (${pageV(f).toFixed(2)} -> ${pageV(f + 1).toFixed(2)} px/f)`);
}
// The band above the container is drawn only until the cell owns the frame (its top edge then becomes the container's
// own): on the first frame it does, everything above that edge must already be above the frame.
for (let f = TAKE; f <= TAKE + TAKE_LEN; f++) {
  if (takeAt(f).take >= 0.999 && scrollAt(f) > 0 && pageGeom(f).edgeY > 0) throw new Error(`Redrawn: the cell owns the frame on local ${f} with the scroll container's top still on screen (${pageGeom(f).edgeY.toFixed(1)} px)`);
}
/** Local frames: the rise's fastest frame, where the one falling curve starts, and the frame the page is at rest. */
export const REDRAWN_SCROLL = { at: SCROLL.at, end: SCROLL.end, a: SCROLL.a, pageV, riseV, scrollAt, pageGeom, takeAt };

const PAPER = `${HEAD}
uniform vec2 off; uniform vec3 a; uniform vec3 b;
void main(){
  vec2 p = (gl_FragCoord.xy*2. + off*vec2(1.,-1.))/res.y*.42;
  float w = fbm(p*.8 - vec2(t*.03,t*.012));
  float f = fbm(p + vec2(t*.05,0.) + w*1.3);
  o = vec4(dither(mix(a,b,smoothstep(.3,.68,f))),1.);
}`;

const Layer: React.FC<{ clip?: string; children: React.ReactNode }> = ({ clip, children }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, clipPath: clip, overflow: 'hidden' }}>{children}</div>
);

/**
 * The take's covers on clip frame `frame` (decided on fd, as the clip's own picture is). `wipe` is the real circle's
 * radius in the take's CSS px on that frame, for the tile that holds the real wipe; elsewhere the dark onboarding take is
 * taken as light from the frame the circle has passed the card.
 */
const Covers: React.FC<{ id: string; frame: number; wipe?: number }> = ({ id, frame, wipe }) => {
  const F = fd(frame);
  return (
    <>
      {(COVERS[id] ?? [])
        .filter((c) => F >= c.at[0] && F <= c.at[1])
        .map((c, i) => {
          const themed = c.light !== undefined && F >= ONB_THEME.wipe && F < ONB_THEME.dark;
          const circle = themed && F < ONB_THEME.light && wipe !== undefined;
          const lit = themed && !circle && (F >= ONB_THEME.light || (wipe === undefined && F >= ONB_THEME.light - 2));
          // One flat ground at a time: a light layer stacked on the dark one would leave the dark one's antialiased
          // edge as a grey outline round the rect (seen on 1110). Only the circle's two frames stack them.
          return (
            <div key={i} style={{ position: 'absolute', left: 0, top: 0, width: c.w, height: c.h, transform: `translate(${c.x}px, ${c.y}px)`, background: lit ? c.light : c.fill }}>
              {circle && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    background: c.light,
                    clipPath: circle ? `circle(${(wipe ?? 0).toFixed(1)}px at ${(ONB_THEME.x - c.x).toFixed(1)}px ${(ONB_THEME.y - c.y).toFixed(1)}px)` : undefined,
                  }}
                />
              )}
            </div>
          );
        })}
    </>
  );
};

const Crop: React.FC<{ t: Tile; id: string; frame: number; at?: { x: number; y: number }; wipe?: number }> = ({ t, id, frame, at, wipe }) => {
  const Body = t.proxy ? ProxyClip : Clip;
  const cx = t.cx + (at?.x ?? 0);
  const cy = t.cy + (at?.y ?? 0);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${(-cx * t.s).toFixed(2)}px, ${(-cy * t.s).toFixed(2)}px) scale(${t.s})` }}>
      <Body id={id} frame={frame} />
      <Covers id={id} frame={frame} wipe={wipe} />
    </div>
  );
};

/** How far the disc has got over a rect: 'dark', 'light', or the circle in the rect's own px. */
const discOver = (t: { x: number; y: number; w: number; h: number }, r: number) => {
  const dx = Math.max(t.x - ORIGIN.x, 0, ORIGIN.x - t.x - t.w);
  const dy = Math.max(t.y - ORIGIN.y, 0, ORIGIN.y - t.y - t.h);
  const far = Math.hypot(Math.max(Math.abs(t.x - ORIGIN.x), Math.abs(t.x + t.w - ORIGIN.x)), Math.max(Math.abs(t.y - ORIGIN.y), Math.abs(t.y + t.h - ORIGIN.y)));
  if (r <= Math.hypot(dx, dy)) return 'dark';
  if (r >= far) return 'light';
  return `circle(${r.toFixed(1)}px at ${(ORIGIN.x - t.x).toFixed(1)}px ${(ORIGIN.y - t.y).toFixed(1)}px)`;
};

const TileBody: React.FC<{ t: Tile; f: number; r: number }> = ({ t, f, r }) => {
  const state = t.real || !t.lightId ? (t.real ? 'dark' : 'light') : discOver(t, r);
  const frame = t.map(f);
  const showDark = state !== 'light' && (t.real || t.lightId);
  const showLight = state !== 'dark';
  const lightFrame = t.lightRange ? clamp(frame, t.lightRange[0], t.lightRange[1]) : frame;
  // The real circle on the take's own frame (setupMap's first segment runs the clip 1:1 from DISC_AT), in its CSS px.
  const wipe = t.real ? discR(fd(frame) - setupMap(DISC_AT) + DISC_AT) / t.s : undefined;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: t.w,
        height: t.h,
        borderRadius: R,
        overflow: 'hidden',
        background: showLight ? C.white : C.ink,
        transform: `translate(${t.x}px, ${t.y}px)`,
        filter: t.mono ? 'grayscale(1)' : undefined,
      }}
    >
      {showDark && (
        <Layer>
          <Crop t={t} id={t.id} frame={frame} wipe={wipe} />
        </Layer>
      )}
      {showLight && (
        <Layer clip={state === 'light' ? undefined : state}>
          <Crop t={t} id={t.lightId ?? t.id} frame={lightFrame} at={t.lightAt} />
        </Layer>
      )}
      <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: R, boxShadow: showLight && !t.real ? 'inset 0 0 0 1px rgba(0,0,0,.06)' : 'inset 0 0 0 1px rgba(255,255,255,.08)' }} />
    </div>
  );
};

/**
 * The line's size and ink band (plane px), with the edge ride's frames checked against them: LINE_OUT is the first
 * frame Appearance carries the line, the frame top crosses its ink band on 2 frames at most, each at 40 px/f or more
 * (house rule 1 b), and on every sub-sample that rounds to LINE_CLEARS the whole line is above the frame.
 */
const lineSetting = () => {
  // As wide as the open cell allows, and inside the safe width at the read's largest zoom.
  const size = Math.min(fitLine(LINE, 'display', Z_READ), fitLine(LINE, 'display', 1, undefined, TYPE_BOX.w));
  const g = lineGeometry(LINE, size, { role: 'display', align: 'center', anchor: { x: TYPE_BOX.x + TYPE_BOX.w / 2, y: TYPE_CY, v: 'middle' } });
  const ink = inkBox(LINE, size, TYPE.display.weight);
  const inkHi = g.baseline - ink.ascent;
  const inkLo = g.baseline + ink.descent;
  const at = (f: number) => {
    const t = takeAt(f);
    const ride = rideAt(f, inkLo);
    return { hi: screenY(t, inkHi) + ride, lo: screenY(t, inkLo) + ride, ride };
  };
  if (at(LINE_OUT - 1).ride < 0 || at(LINE_OUT).ride >= 0) throw new Error(`Redrawn: the edge ride does not start on LINE_OUT ${LINE_OUT} (ride ${at(LINE_OUT - 1).ride.toFixed(1)}, ${at(LINE_OUT).ride.toFixed(1)})`);
  if (at(LINE_CLEARS - 0.5).lo > -2 || at(LINE_CLEARS - 1.5).lo <= -2) throw new Error(`Redrawn: LINE_CLEARS ${LINE_CLEARS} is not the first frame the line is above the frame (ink bottom ${at(LINE_CLEARS - 0.5).lo.toFixed(1)} px)`);
  const cut: { fr: number; v: number }[] = [];
  for (let fr = LINE_OUT; fr < LINE_CLEARS; fr++) if (at(fr).hi < 0 && at(fr).lo > 0) cut.push({ fr, v: at(fr - 1).lo - at(fr).lo });
  if (cut.length > 2 || cut.some((c) => c.v < 40)) throw new Error(`Redrawn: the frame top cuts the line on ${cut.map((c) => `f${c.fr} at ${c.v.toFixed(1)} px/f`).join(', ')}`);
  return { size, inkLo };
};

/** The one line, in plane px, under the camera's scale and the take's push (zoom: screen px per plane px, for rule 3). */
const CopyLine: React.FC<{ f: number; zoom: number }> = ({ f, zoom }) => {
  const { size, inkLo } = useMemo(lineSetting, []);
  const plan = useMemo(() => redrawnPlan(size), [size]);
  return (
    <Line
      id="redrawn"
      text={LINE}
      f={f}
      size={size}
      role="display"
      color={C.ink}
      stage="light"
      align="center"
      anchor={{ x: TYPE_BOX.x + TYPE_BOX.w / 2, y: TYPE_CY, v: 'middle' }}
      plan={plan}
      zoom={zoom}
      wrap={(fx) => {
        // Screen px to plane px: the line sits under the camera's scale and the take's push.
        const ride = rideAt(fx, inkLo);
        const t = takeAt(fx);
        return ride < 0 ? `translateY(${(ride / (t.cam.z * t.pushK)).toFixed(3)}px)` : undefined;
      }}
    />
  );
};

export const Redrawn: React.FC = () => {
  const f = useCurrentFrame();
  const tk = takeAt(f);
  const { cam, take } = tk;
  const fall = accel(f, FALL, 0, FALL_K, FALL_V0);
  const r = discR(f);

  const fogOff = useMemo(() => [cam.x * cam.z * 0.5, cam.y * cam.z * 0.5], [cam.x, cam.y, cam.z]);
  const fog = useMemo(() => ({ off: fogOff, a: hex(C.paper), b: hex(C.white) }), [fogOff]);

  const toX = (x: number) => W / 2 + (x - cam.x) * cam.z;
  const toY = (y: number) => H / 2 + (y - cam.y) * cam.z;

  // The shutter: geometric decay onto the gutter, which keeps moving with the plane underneath.
  const sy = toY(0);
  const sx = toX(CROSS_X);
  const hk = Math.pow(0.83, f);
  const wEnd = Math.pow(0.865, SHUT_END - WIDTH_AT);
  const wk = f < WIDTH_AT ? 1 : Math.max(0, (Math.pow(0.865, f - WIDTH_AT) - wEnd) / (1 - wEnd));
  const thick = mix(0, G * cam.z, Math.min(1, wk * 6));
  const barT = (sy - thick / 2) * (1 - hk);
  const barB = H - (H - sy - thick / 2) * (1 - hk);
  const barL = sx * (1 - wk);
  const barR = W - (W - sx) * (1 - wk);
  const shutterOn = f < SHUT_END && barR - barL > 0.5;

  // The hero cell's rect on screen, from its place on the plane to past the frame's edges.
  const heroX0 = toX(HERO.x);
  const heroY0 = tk.heroY0;
  const heroW0 = HERO.w * cam.z;
  const heroH0 = HERO.h * cam.z;
  // The sides aim 200 px past the frame (the top edge, which carries the line, keeps its -150): they leave the frame
  // between two frames, about 22 px in on 1284 and 13 px out on 1285, so no frame holds a sliver of plane beside a
  // corner (aiming at -150 left a 14 px sliver on 1285).
  const heroX = mix(heroX0, -200, take);
  const heroY = tk.edge;
  const heroR = mix(heroX0 + heroW0, W + 200, take);
  const heroB = mix(heroY0 + heroH0, H + 150, take);
  const owned = take >= 0.999;
  const heroOn = owned || (heroY0 < H + 40 && heroX0 < W + 40);
  // The page inside it (pageGeom). The page's bottom stays under the frame's bottom on every frame of the take (1811 px
  // on 1276, 1090 from 1306).
  const { push, s, pageS, edgeY: pageTop } = pageGeom(f);
  const pageX = W / 2 + (mix(heroX0 + heroW0 / 2, W / 2, take) - (PAGE.w / 2) * s - W / 2) * push;
  const pageY = pageTop - PAGE.top * pageS;
  // Once it owns the frame the cell begins at the scroll container's top edge, so the fall opens black above the page.
  const cellY = owned ? pageTop : heroY;
  const scrolled = scrollAt(f);
  const page = pageFrame(scrolled);

  // Neighbours are pushed back from the growing cell.
  const ox = heroX0 + heroW0 / 2;
  const oy = tk.oy;
  const pushK = tk.pushK;

  const visible = (t: { x: number; y: number; w: number; h: number }) => {
    const m = 30;
    return toX(t.x + t.w) > -m && toX(t.x) < W + m && toY(t.y + t.h) > -m && toY(t.y) < H + m;
  };
  const onPlane = TILES.filter(visible);

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, background: owned ? C.void : C.paper, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `translateY(${fall.toFixed(2)}px)` }}>
        {!owned && <Shader frag={PAPER} uniforms={fog} scale={0.5} />}

        {!owned && (
          <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: `${ox}px ${oy}px`, transform: `scale(${pushK})` }}>
            <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${(W / 2 - cam.x * cam.z).toFixed(2)}px, ${(H / 2 - cam.y * cam.z).toFixed(2)}px) scale(${cam.z})` }}>
              {onPlane.map((t, i) => (
                <TileBody key={i} t={t} f={f} r={r} />
              ))}
              <CopyLine f={f} zoom={cam.z * pushK} />
            </div>
          </div>
        )}

        {heroOn && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: heroR - heroX,
              height: heroB - cellY,
              borderRadius: R * cam.z * (1 - take),
              transform: `translate(${heroX.toFixed(2)}px, ${cellY.toFixed(2)}px)`,
              boxShadow: take > 0 && !owned ? `0 ${mix(10, 50, take)}px ${mix(30, 130, take)}px rgba(0,0,0,${mix(0.08, 0.34, take)})` : undefined,
            }}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: 'inherit', overflow: 'hidden', background: GROUND }}>
              <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${(pageX - heroX).toFixed(2)}px, ${(pageY - cellY).toFixed(2)}px) scale(${pageS.toFixed(5)})` }}>
                {/* The scroll container: the take's frame, moved by its residual shift onto the smooth scroll. */}
                <div style={{ position: 'absolute', left: 0, top: PAGE.top, width: PAGE.w, height: PAGE.h - PAGE.top, overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, width: PAGE.w, height: PAGE.h - PAGE.top, overflow: 'hidden', transform: `translateY(${page.shift.toFixed(3)}px)` }}>
                    <Clip id={PAGE.id} frame={page.frame} style={{ position: 'absolute', left: 0, top: -PAGE.top }} />
                  </div>
                </div>
                {/* What has scrolled up past the container's top while that top is still inside the cell: the take's
                    first frame moved up by the same scroll, so the page's content runs on up to the cell's own edge. */}
                {scrolled > 0 && !owned && (
                  <div style={{ position: 'absolute', left: 0, top: -SCROLL_MAX, width: PAGE.w, height: SCROLL_MAX + PAGE.top + BAND_LAP, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: SCROLL_MAX + PAGE.top, width: PAGE.w, height: PAGE.h - PAGE.top, overflow: 'hidden', transform: `translateY(${(-scrolled).toFixed(3)}px)` }}>
                      <Clip id={PAGE.id} frame={0} style={{ position: 'absolute', left: 0, top: -PAGE.top }} />
                    </div>
                  </div>
                )}
              </div>
              {!owned && <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: 'inherit', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.06)' }} />}
            </div>
          </div>
        )}
      </div>

      {shutterOn && <div style={{ position: 'absolute', left: 0, top: 0, width: barR - barL, height: barB - barT, background: C.accent, transform: `translate(${barL.toFixed(2)}px, ${barT.toFixed(2)}px)` }} />}
    </div>
  );
};
