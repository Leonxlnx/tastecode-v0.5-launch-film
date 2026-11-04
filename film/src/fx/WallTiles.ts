import { CLIPS } from '../data/clips';
import { SITE_TAKES } from '../data/sites';
import type { MockId } from './kit';

// What the wall is made of. A view is a window onto a source, in the source's own units, that covers
// any tile: `x, y` its top-left, `w` how much of the source's width the tile shows (none: the whole
// width). Clips are in the app's CSS px, pages in 1/8 of their 2400 px jpeg (a page is 300 wide), and
// sites (Leon's own pages and X recordings, fx/SiteClip) in the take's CSS px.
// The film's mock pictures and pages never show a serif at a size that reads: they are cropped to the photograph.
// Leon's sites are shown as he made them: their typefaces (serifs included) and colours are content, not the film's.
export type View = {
  x?: number;
  y?: number;
  w?: number;
  /** drift of the window across the source, units per frame */
  dx?: number;
  dy?: number;
  light?: boolean;
} & ({ clip: string; from: number; rate?: number } | { site: string; from: number; rate?: number } | { page: MockId } | { plate: string });

const PAGE_H: Record<MockId, number> = { volta: 6929, nocturne: 8352, fathom: 8136, halden: 7776, meridian: 1940, orchard: 2130 };
// r8: the dashboards' dotted routes, hub rings, ping and plotted points were dots the film drew. Their -nodots twins
// (public/mock/<id>/full-nodots.jpg) are the same 2400 px pages, same size and layout, without them.
const NODOTS: MockId[] = ['meridian', 'orchard'];
/** The page's full jpeg, under public/ (for staticFile). */
export const pageFile = (id: MockId) => `mock/${id}/${NODOTS.includes(id) ? 'full-nodots' : 'full'}.jpg`;

/**
 * What a clip must never show on the wall, in the clip's CSS px, drawn over every view of that clip: a flat ground
 * (`fill`) or the same place from a clean frame of the clip (`from`), the latter only on the clip frames in `at`.
 */
export type Cover = { x: number; y: number; w: number; h: number; at?: [number, number] } & ({ fill: string } | { from: number });
// The identity card at the sidebar's foot (avatar, account name, plan meter, gear: CSS 7.7-247.7 x 763.6-810.5, its
// shadow to 813 and x 4-251) under the sidebar's own ground, as the quick package does for the split (crit7 #15a). The
// "Archived" row above it ends at 759.7, the sidebar's divider is at 256. No account name on the wall.
const CARD = { x: 4, y: 761, w: 249, h: 57 };

// r8 speedfix. Leon: no speed numbers anywhere in the film (no timings, no durations, no before/after performance
// numbers). The agents' answers stream two tables: "Metric | Before | After" (Layout shift 0.21 -> 0.00, Largest paint
// 2.4 s -> 1.1 s, Renders on load 14 -> 2: in the hero takes and split2's left chat) and "Spec | Result | Time" (1.8 s,
// 1.2 s, 2.4 s: split2's right chat). The columns that carry them go under the table's own grounds, one cover per band
// between two rules, so every rule, the frame and its rounded corners stay whole: Metric reads as a one-column table and
// Spec | Result as a two-column one, Result running to the frame. Measured on the take's PNGs: the rules are 1 CSS px
// (centres below), the header band and the rows are flat, the rows are the chat's own ground, and each table pops in
// whole on its first frame (no fade), so a band's cover starts on that frame. Each cover keeps 0.8 px clear of its rules.
type Ground = { head: string; row: string };
const INK: Ground = { head: 'rgb(26,26,26)', row: 'rgb(15,15,15)' }; // lint-ok: the dark table's header band (#1A1A1A) and rows, the chat's own ground (#0F0F0F), sampled from the takes' PNGs
const PAPER: Ground = { head: 'rgb(250,250,250)', row: 'rgb(253,253,253)' }; // lint-ok: the light table's header band (#FAFAFA) and rows, the chat's own ground (#FDFDFD), sampled from the take's PNGs
/**
 * Columns x0-x1 of a table under its own grounds, band by band: `rules` are the centres of its horizontal rules (top,
 * under the header, under each row; rows still to come stream onto the chat's ground, so their bands are covered from
 * the start), `scroll` the chat's own scroll of the table as [first clip frame, last, dy]. The last frame held on.
 */
const dropColumns = (x0: number, x1: number, rules: number[], g: Ground, scroll: [number, number, number][]): Cover[] =>
  scroll.flatMap(([a, b, dy]) =>
    rules.slice(1).map((r, i): Cover => ({ x: x0, y: rules[i] + dy + 0.8, w: x1 - x0, h: r - rules[i] - 1.6, fill: i ? g.row : g.head, at: [a, b] })),
  );
// The hero takes' Metric table (both themes, same layout): rules at 476.5-596.5, frame x 397.5-1170.5. Before and After
// (their divider moves 740.5 -> 792.5 as the rows stream) go from x 600, clear of the longest label ("Renders on load"
// ends at 496), to 1150, clear of the frame's corners. hero-window2: pops in on 199, still to 335; the chat then scrolls
// it up in whole px as the checklist streams under it (wall: f301-358). light2: pops in on 218 and never moves.
const METRIC = [476.5, 506.5, 536.5, 566.5, 596.5];
const HERO_SCROLL: [number, number, number][] = [[199, 335, 0], [336, 336, -1], [337, 337, -2], [338, 338, -4], [339, 339, -5], [340, 340, -7], [341, 341, -9], [342, 342, -10], [343, 343, -11], [344, 344, -12], [345, 346, -13], [347, 348, -14], [349, 351, -15], [352, 354, -16], [355, Infinity, -17]];
// split2's right chat: the spec table pops in on 258 (rules 535.45-655.45, frame x 825-1269); the chat's smooth scroll
// moves it by sub-pixel steps on 306-322 and again from 354 (the wall shows f282-337). The Time column and the Result |
// Time divider (1161 until 281, then 1169.5) go from x 1158, clear of "Passed" (ends 1103), to 1245.
const SPEC_SCROLL: [number, number, number][] = [[258, 307, 0], [308, 308, -1], [309, 309, -2.8], [310, 310, -5.1], [311, 311, -6], [312, 312, -6.9], [313, 313, -7.8], [314, 314, -8.7], [315, 316, -10.1], [317, 318, -11], [319, 322, -11.9], [323, 353, -12.8], [354, 354, -13.7], [355, 355, -15.1], [356, 356, -16.9], [357, 357, -20.1], [358, 358, -21], [359, Infinity, -22.8]];

export const COVERS: Record<string, Cover[]> = {
  // chat-stream's status row, "Working for 5s" / "6s" (CSS: bullet 15.8-23.3, "Working" 34.1-79.8, "for 6s" 84-114.7,
  // y 135-148.3): still from clip 67 to 410 (0.8 px up from 371), off the top by 412 and at rest at y 47, above every
  // stream view (y 60 on). The wall shows it in stream (f299-379) and streamB (f398-410). " for Ns" goes under the
  // chat's own ground and the row reads "Working" by its dot. The subagents' "· 2s" (x 425 on) are right of every
  // stream view (x 30-360), the previous turn's "Worked for 1s" (f0-38) before every one.
  'chat-stream': [
    { x: 81.5, y: 131.5, w: 40.5, h: 20, at: [67, 410], fill: 'rgb(15,15,15)' }, // lint-ok: the chat's own ground (#0F0F0F), sampled from the take's PNGs
  ],
  'hero-window2': [
    { ...CARD, fill: 'rgb(19,19,19)' }, // lint-ok: the dark sidebar's own ground (#131313), sampled from the take's PNGs
    ...dropColumns(600, 1150, METRIC, INK, HERO_SCROLL),
  ],
  'hero-window-light2': [
    { ...CARD, fill: 'rgb(252,252,252)' }, // lint-ok: the light sidebar's own ground (#FCFCFC), sampled from the take's PNGs
    ...dropColumns(600, 1150, METRIC, PAPER, [[218, Infinity, 0]]),
  ],
  split2: [
    { ...CARD, fill: 'rgb(19,19,19)' }, // lint-ok: the dark sidebar's own ground (#131313), sampled from the take's PNGs
    // The browser caret in the right composer (CSS 825-826 x 723.6-743.6) blinks at random under the capture's clock from
    // clip 155 on (Leon: no flashing caret). The same place from clip 236, a caret-off frame, is identical outside the
    // caret's two columns to every frame of 155-250 (quick package) and 270-344 (measured r8): only the caret goes.
    { x: 814, y: 716, w: 26, h: 36, from: 236, at: [155, 344] },
    // The left chat's Metric table pops in on 265 and never moves (rules 443.58-563.58, frame x 297.7-741.8): Before and
    // After (divider 495 -> 525 as the rows stream) go from x 440, clear of "Renders on load" (ends 411), to 725.
    ...dropColumns(440, 725, [443.58, 473.58, 503.58, 533.58, 563.58], INK, [[265, Infinity, 0]]),
    ...dropColumns(1158, 1245, [535.45, 565.45, 595.45, 625.45, 655.45], INK, SPEC_SCROLL),
  ],
};

export const isClip = (v: View): v is View & { clip: string; from: number; rate?: number } => 'clip' in v;
export const isSite = (v: View): v is View & { site: string; from: number; rate?: number } => 'site' in v;
export const isPage = (v: View): v is View & { page: MockId } => 'page' in v;

/** The source's size in view units. */
export const unitSize = (v: View) => {
  if (isClip(v)) return { w: CLIPS[v.clip].w, h: CLIPS[v.clip].h };
  if (isSite(v)) return { w: SITE_TAKES[v.site].w, h: SITE_TAKES[v.site].h };
  if (isPage(v)) return { w: 300, h: PAGE_H[v.page] / 8 };
  return { w: 480, h: 320 };
};

/** The window a view shows in a tile tw x th, `live` frames in: its top-left and scale. Always covers. */
export const fitView = (v: View, tw: number, th: number, live: number) => {
  const u = unitSize(v);
  const y0 = v.y ?? 0;
  const ks = Math.max(tw / (v.w ?? u.w), th / Math.max(1, u.h - y0));
  const free = (a: number, b: number) => Math.max(0, a - b);
  const x = Math.min(free(u.w, tw / ks), Math.max(0, (v.x ?? 0) + (v.dx ?? 0) * live));
  const y = Math.min(free(u.h, th / ks), Math.max(0, y0 + (v.dy ?? 0) * live));
  return { ...u, ks, x, y };
};

// ---- the library -------------------------------------------------------------------------------------
const clip = (id: string, from: number, o: Partial<View> & { rate?: number } = {}): View => ({ clip: id, from, ...o } as View);
const lit = (id: string, from: number, o: Partial<View> & { rate?: number } = {}): View => clip(id, from, { ...o, light: true });
const page = (id: MockId, x: number, y: number, w: number, o: Partial<View> = {}): View => ({ page: id, x, y, w, dy: 0.1, ...o } as View);
const plate = (name: string, o: Partial<View> = {}): View => ({ plate: name, x: 40, y: 20, w: 400, dx: 0.1, dy: 0.05, ...o } as View);
/** A site take, still framed (its own scroll is the only move), from `from` on the tile's clock. */
const site = (id: string, from: number, o: Partial<View> & { rate?: number } = {}): View => ({ site: id, from, ...o } as View);

export const V = {
  // whole windows, dark
  // the re-takes: every timer reads over a minute. hero-window2 streams 5 f later than the old take: +5 keeps each view's content.
  split: clip('split2', 282),
  splitB: clip('split2', 210),
  hero: clip('hero-window2', 301),
  heroB: clip('hero-window2', 201),
  glide: clip('chat-glide2', 24),
  glideB: clip('chat-glide2', 92),
  // Usage, cropped clear of every dollar figure: x under 930 and y from 205 keep the nav and the charts and lose
  // the "at API prices" summary, the per-provider totals and the price table.
  usage: clip('usage', 58, { x: 0, y: 205, w: 930 }),
  usageB: clip('usage', 216, { x: 0, y: 205, w: 930 }),
  appear: clip('set-appearance', 232, { rate: 1.5 }),
  profile: clip('set-profile', 146, { x: 380, y: 70, w: 460 }), // the coin and the name: the Accounts rows carry plan names
  general: clip('set-general', 62),
  keys: clip('set-keybinds', 26),
  onbName: clip('onboarding', 132),
  onbAgents: clip('onboarding', 517, { rate: 1.4 }),
  // macros, dark: a word at 22 px or more on the wall
  rail: clip('rail-needs', 54, { x: 6, y: 100, w: 190, dy: 0.05 }),
  railB: clip('rail-needs', 300, { x: 6, y: 400, w: 190, dy: -0.05 }),
  // The hero tile from the second cut: the Needs you band, still, a tile of the plane. r8: "Needs you", its yellow row
  // and the "Pinned" label only (rows, CSS: Pull requests ends 87.1, Needs you 122.7-133.9, the row 148.3-158.2, Pinned
  // 179.6-188.2, the pinned chat's box from 196.1; the row's text ends at 161, "atlas-web" starts at 185): the window is
  // 90.5-193.6 in the 700-wide tile, so no line is cut and the pinned chat ("Move forms to React Ho...") is out.
  needs: clip('rail-needs', 300, { x: 4, y: 90.5, w: 165 }),
  // The chat list only: y 8 to 154 (in every 300-tall tile) keeps the five rows whole and ends above the profile row
  // (avatar, name, plan left) at 174; w 214 ends left of the rows' status dots at 228.
  update: clip('update', 141, { x: 0, y: 8, w: 214 }),
  updateB: clip('update', 13, { x: 0, y: 8, w: 214 }),
  // r8: the slash menu (no shot of its own any more, its descriptions cut mid-word by the tile edge) and the old skills
  // take (a visible caret after "$", "tasteskill v2.5" in its menu) are off the wall. The skills shot's own take instead:
  // the cinetic chip and the brief typing after it (keys f92-217, browser caret hidden), never the menu (f20-79). The
  // composer card is x 70.4-, y 143.5-280.3; the text ends at 341.8; x 56 + w 310 keeps the card's edge and the whole
  // line in every tile. `skillsUse` is for 440x280 and 480x300 tiles (window y 95-292), `skillsUseHi` for 440x300 (81-292).
  skillsUse: clip('skills-use', 150, { x: 56, y: 95, w: 310 }),
  skillsUseB: clip('skills-use', 92, { x: 56, y: 95, w: 310 }), // a pre view: take f92 on the wall's f0, typing while it is big
  skillsUseHi: clip('skills-use', 150, { x: 56, y: 81, w: 310 }),
  // r8: from y 47.5, below the "Search models" field (its border ends at 38.1; its caret strobes f60-250) and the Codex
  // header's sliver under it (to 46.2 from f230); w 178 ends every tile above the Grok header (from 171.5).
  picker: clip('switch-picker', 200, { x: 10, y: 47.5, w: 178 }),
  compose: clip('design-compose', 104, { x: 170, y: 120, w: 500, rate: 1.4 }),
  banner: clip('switch-banner', 118, { x: 90, y: 560, w: 480, rate: 1.5 }),
  stream: clip('chat-stream', 300, { x: 30, y: 60, w: 300, dy: 0.1 }),
  streamB: clip('chat-stream', 400, { x: 30, y: 130, w: 330, rate: 1.4 }),
  streamC: clip('chat-stream', 700, { x: 30, y: 60, w: 320, rate: 1.2 }),
  diff: clip('review', 150, { x: 300, y: 120, w: 320, dy: 0.3 }),
  diffB: clip('review', 120, { x: 300, y: 150, w: 380, rate: 1.2, dy: 0.2 }),
  bars: clip('usage', 58, { x: 420, y: 300, w: 520 }),
  barsB: clip('usage', 96, { x: 420, y: 205, w: 520 }), // below the summary and legend, and clear of the dollar tooltip at 158-200
  limits: clip('limits', 56, { x: 13, y: 312, w: 228, dy: 0.3 }), // Claude Code down: the first group has a row named API
  coin: clip('set-profile-coin', 150), // the seal and, right of it, the profile name: only in slots that never reach the screen
  pictures: clip('set-general-pictures', 62, { w: 340 }),
  previews: clip('set-appearance-previews', 232, { rate: 1.5 }),
  table: clip('hero-window2', 255, { x: 395, y: 460, w: 500, dy: 0.05 }),
  why: clip('hero-window2', 215, { x: 390, y: 340, w: 420, dy: 0.1 }),
  name: clip('onboarding', 132, { x: 70, y: 220, w: 360 }),
  agents: clip('onboarding', 517, { x: 70, y: 210, w: 360, rate: 1.4 }),
  // light: the real light theme, the only twins there are
  lHero: lit('hero-window-light2', 150),
  lHeroB: lit('hero-window-light2', 180),
  lAppear: lit('set-appearance', 58),
  lOnb: lit('onboarding', 332), // r8: from 332, past the theme switch's circular wipe (296-330), which read as a white dot growing in its tile
  lRail: lit('hero-window-light2', 60, { x: 8, y: 140, w: 240, dy: 0.1 }),
  lChat: lit('hero-window-light2', 110, { x: 390, y: 192, w: 460, dy: 0.25 }), // starts under the "Working for" row: no short timer on the wall
  lTable: lit('hero-window-light2', 212, { x: 390, y: 330, w: 460, dy: 0.2, rate: 0.6 }),
  lTree: lit('hero-window-light2', 90, { x: 8, y: 300, w: 240, dy: 0.1 }),
  lHead: lit('set-appearance', 62, { x: 380, y: 70, w: 560 }),
  lRows: lit('set-appearance', 66, { x: 380, y: 400, w: 560 }),
  lPreviews: lit('set-appearance-previews', 64),
  lOnbHead: lit('onboarding', 340, { x: 70, y: 250, w: 380 }),
  // Leon's sites, live. Each take plays from `from` on its tile's own clock (`live` restarts at
  // every cut) and holds its last frame; `x` centres the take in the narrowest tile it lands in. Every `from` is
  // past the take's wordmark and cursor frames: no tile shows a second design's "Hvit" or "Proofloom".
  hvLoft: site('hvit/rooms', 120, { light: true }), // the fjord room card, then the ink loft card rises over it
  hvLoftDark: site('hvit/rooms', 180, { light: true }), // the loft card and the tea glass, then the single room rises: no type that reads
  hvHero: site('hvit/intro', 60, { light: true }), // "White rooms in Flateyri" over the aerial, as the door opened on it
  hvPlace: site('hvit/place', 250, { light: true }), // the shore under a white cloud
  kkBoard: site('kaffee-klee/board-hover', 40, { x: 66 }),
  // not -full: its utility bar carries a mail address and a phone number. At 0.25 the word stays whole (it never
  // passes f19): from f22 the zoom pushes "Westfjord" past the take's own edges. r8: checked on the masters and the
  // proxies (f0-82): this take has no bar and no address at all, from its first frame.
  xFjord: site('x/x2d-westfjords', 0, { x: 150, rate: 0.25 }),
  // Its slot (2.3 a) slides in from the left edge on wall f59 and is whole on screen from f86: the take holds its
  // black f0 until f85, then the word prints itself in, whole, at 1.4x (take f0-39 on f85-113, before the wave).
  stet: site('editing-tool/mark-close', -119, { x: 53, rate: 1.4 }),
  // A still of the golden aerial over the cloud: clear of the f186 caption, of the empty "Down through the weather"
  // card at f70-128 and of the take's jumps (f127-168). The "Hvit" wordmark is under the cloud from f55.
  xCloud: site('x/x1-cloud-dive-full', 165, { x: 148, rate: 0 }),
  // The "Hvit means white" heading has gone by f22. At 0.38 the arc of words rises and the take never passes f49:
  // its "Four rooms, two people" line (from f52) would read beside Hvit's own "Five rooms, three kinds".
  xArc: site('x/x2c-arc', 22, { x: 59, light: true, rate: 0.38 }),
  hvClosing: site('hvit/closing', 350, { x: 40, light: true }), // "Flateyri" over its line, the hand's last card, as the other words fade
  kkGather: site('kaffee-klee/gather', 196, { x: 66, light: true }),
  plFlag: site('proofloom/flag-close', 21, { x: 21, light: true }),
  hvTern: site('hvit/tern-flight', 40, { light: true, rate: 0.6 }), // the tern and the months: by the fall's end it reaches f89, before the booking block and its price
  plWindow: site('proofloom/window-close', 100, { x: 36, light: true }),
  hvTour: site('hvit/tour', 20, { light: true }), // the whole page scrolling
  kkHero: site('kaffee-klee/intro', 30), // the pour-over, dark and crisp
  kkWeight: site('kaffee-klee/weight-close', 100, { x: 51, light: true }),
  hvMonths: site('hvit/months-close', 60, { light: true }),
  kkGatherClose: site('kaffee-klee/gather-close', 200),
  hvMarquee: site('hvit/marquee-close', 100, { light: true }),
  xSeasons: site('x/x2d-seasons-full', 20, { x: 95 }), // white, then the dark coast fills the frame
  plCheck: site('proofloom/checklist-close', 20, { x: 16, light: true }),
  xRooms: site('x/x2d-rooms', 10, { light: true }), // on screen for take f10-20 only: its prices come in at f50
  hvBooking: site('hvit/booking-ui', 20, { light: true }),
  // the film's own mock pages: a loud colour among Leon's calmer palettes, and the dashboards. r8: VOLTA (yellow type)
  // is in no slot: on the wall yellow is the Needs you row's alone.
  volta: page('volta', 0, 6, 300),
  noc: page('nocturne', 0, 4, 300),
  map: page('meridian', 40, 14, 200),
  meridian: page('meridian', 0, 0, 300),
  orchard: page('orchard', 45, 0, 255, { light: true }),
  heat: page('orchard', 50, 100, 130, { light: true }),
  fog: plate('fogpines', { light: true }),
  fogpeak: plate('fogpeak', { light: true }),
  cloudpeak: plate('cloudpeak', { light: true }),
  dawnPlate: plate('cloudsea'),
  forest: plate('forest'),
};
export type ViewName = keyof typeof V;

// ---- the plane ---------------------------------------------------------------------------------------
// A tile: its height (none: a window's own aspect) and its views. `a` until the wave, or `pre` first
// when it is on screen long enough to need a cut; `c` the wave, `d` the second cut.
export type Row = { h?: number; a: ViewName; pre?: ViewName; c: ViewName; d: ViewName };
const r = (h: number | undefined, a: ViewName, c: ViewName, d: ViewName, pre?: ViewName): Row => ({ h, a, c, d, pre });

/** The yellow dot of the Needs you row in rail-needs, in the clip's px. */
export const NEEDS_DOT = { x: 23.9, y: 153 };

export const GUT = 16;
const WIN = 818 / 1310;

export const PLANE: { w: number; top: number; slip: number; rows: Row[] }[] = [
  {
    w: 440,
    top: -1290,
    slip: 0.32,
    rows: [
      r(300, 'xArc', 'lRail', 'stream'),
      r(280, 'compose', 'hvMonths', 'skillsUse'), // d: r8, was the old skills take (a caret after "$")
      r(320, 'hvHero', 'lChat', 'kkWeight'), // a: a picture; this slot shows only its right third at the frame's left edge (r8: was stet, cut to "et")
      r(280, 'stream', 'hvClosing', 'limits'),
      r(300, 'kkBoard', 'lTree', 'updateB'),
      r(280, 'railB', 'kkGatherClose', 'lOnbHead'),
      r(300, 'lHead', 'diff', 'lRail'),
      r(280, 'skillsUse', 'orchard', 'xFjord'), // a: r8, was the old skills take
      r(300, 'kkGather', 'lTable', 'picker'),
    ],
  },
  {
    w: 660,
    top: -1260,
    slip: -0.26,
    rows: [
      r(undefined, 'lHeroB', 'usage', 'lHero'),
      r(undefined, 'general', 'fog', 'lHeroB'),
      r(undefined, 'fog', 'lOnb', 'usageB'),
      r(undefined, 'usage', 'hero', 'plFlag'),
      r(undefined, 'lHero', 'lAppear', 'cloudpeak'),
      r(undefined, 'kkGatherClose', 'kkWeight', 'keys'), // a: r8, was the red Nocturne mock, the most saturated object while the disc closed (3892-3908) and a red sliver on the peak
      r(undefined, 'onbName', 'lHeroB', 'lAppear'),
    ],
  },
  {
    w: 440,
    top: -1230,
    slip: 0.2,
    rows: [
      r(310, 'streamC', 'hvTour', 'pictures'), // d: r8, was the coin, whose tile read the profile name beside it (3838-3852)
      r(280, 'hvLoft', 'lRows', 'bars'),
      r(300, 'update', 'plWindow', 'cloudpeak'), // d: a picture, not a line of type, on the Needs tile's arrival
      r(300, 'stet', 'barsB', 'lTree'), // a: whole on screen from f59 to the wave, where "stet" prints itself in
      r(280, 'limits', 'lTree', 'kkHero'),
      r(320, 'kkHero', 'hvClosing', 'lHead'), // a: the first site seen big in the ticks, a still photograph as the old one was
      r(300, 'picker', 'hvMarquee', 'streamB'),
      r(280, 'xSeasons', 'lRail', 'skillsUse'), // d: r8, was the slash menu
      r(300, 'diff', 'heat', 'lChat'),
    ],
  },
  {
    w: 700,
    top: -1170,
    slip: -0.3,
    rows: [
      r(undefined, 'profile', 'lAppear', 'lHeroB'),
      r(undefined, 'lHeroB', 'orchard', 'forest', 'lHero'), // d: a dark, crisp photograph above the Needs tile on the cut after the peak, as the old ring was
      r(undefined, 'hero', 'streamC', 'heroB', 'split'),
      r(undefined, 'diffB', 'hvPlace', 'lOnb'),
      r(undefined, 'fogpeak', 'lOnb', 'fog'), // d: under the Needs tile through the fall, a pale picture (r8: the sunset plate's glow was the one other yellow in the middle)
      r(undefined, 'appear', 'orchard', 'usageB'),
    ],
  },
  {
    w: 480,
    top: -1200,
    slip: 0.36,
    rows: [
      r(300, 'lRows', 'xFjord', 'lChat'),
      r(320, 'barsB', 'lRail', 'plCheck'),
      r(300, 'streamB', 'fog', 'lTable', 'picker'),
      r(300, 'xArc', 'lPreviews', 'hvLoftDark', 'lChat'), // a: Leon's post seen big while the plane is still close; d: beside the Needs tile, no type that reads
      r(300, 'diff', 'lTree', 'fogpeak', 'skillsUseB'), // pre: r8, was the slash menu, big on 3715-3765 with its descriptions cut mid-word
      r(330, 'kkGather', 'lChat', 'barsB'), // a: Kaffee Klee's black wave of big words beside the hero (r8: was the VOLTA mock, whose yellow took the peak)
      r(300, 'lRail', 'coin', 'fogpeak'),
      r(300, 'coin', 'kkBoard', 'lRows'),
    ],
  },
  {
    w: 640,
    top: -1290,
    slip: -0.22,
    rows: [
      r(undefined, 'glide', 'lHeroB', 'glideB'),
      r(undefined, 'lAppear', 'hvLoft', 'lChat'),
      r(undefined, 'onbAgents', 'lHero', 'xSeasons'), // d: Leon's dark coast through the fall (r8: was VOLTA); no other tile shows it then
      r(undefined, 'hvTour', 'hvHero', 'lOnb'), // a: Leon's page (r8: was the cloudsea plate, the most saturated tile at the right edge on 3756-3764 and the peak)
      r(undefined, 'lHeroB', 'kkBoard', 'hvTern'),
      r(undefined, 'keys', 'lAppear', 'xRooms'),
      r(undefined, 'map', 'lHero', 'usage'),
    ],
  },
  {
    w: 440,
    top: -1250,
    slip: 0.28,
    rows: [
      r(300, 'lTree', 'lChat', 'diffB'),
      r(300, 'skillsUseHi', 'fogpeak', 'lRail'), // a: r8, was the slash menu
      r(300, 'hvPlace', 'lTable', 'hvMonths'), // a (on screen only after its cut3, in the fall): r8, was the golden xCloud, the biggest yellow beside the Needs row; d: r8, was hvTour, on screen with 2.0's
      r(300, 'lPreviews', 'rail', 'lHead'),
      r(300, 'diffB', 'lRail', 'heat'),
      r(300, 'fog', 'hvMarquee', 'stream'), // c: r8, was hvClosing, on screen with 2.5's at the same time
      r(300, 'banner', 'lRows', 'lTree'),
      r(300, 'streamC', 'hvBooking', 'lChat'),
      r(300, 'plFlag', 'lHead', 'map'),
    ],
  },
];
export const PLANE_LEFT = -1660;
export const windowHeight = (w: number) => w * WIN;
