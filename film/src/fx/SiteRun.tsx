import React from 'react';
import { accel, clamp, decay, E, fd, lmix, prog } from '../lib/anim';
import { ACT, H, W } from '../timeline';
import { SiteClip, siteTake } from './SiteClip';

/**
 * Leon's sites, shown as design work: what Compose's hand and door and the Sites run share.
 * Every move inside a page is the page's own filmed scroll, time-mapped on the grid; the film adds only axial moves
 * (the door's zoom, the plunge, the lift). No browser chrome, no device frame: a take at film width, full bleed.
 */

/** Film px per CSS px of a take drawn at film width (Hvit and Kaffee Klee 1.2, mark-close 2.56, flag-close 3.75). */
export const filmScale = (id: string) => W / siteTake(id).w;

/**
 * A take at film width. `oy` places the page's top in the frame (film px; 1920 x 1200 crops to 1080 with oy 0 to
 * -120). The film camera then zooms by `zoom` about `origin` (film px) and lifts the picture by `lift` (film px, up).
 * The stage behind it is the caller's; `blend` composites the page onto it (lighten: the page's blacks take the stage's).
 */
export const Full: React.FC<{
  id: string;
  frame: number;
  oy?: number;
  zoom?: number;
  origin?: readonly [number, number];
  lift?: number;
  proxy?: boolean;
  blend?: 'lighten';
}> = ({ id, frame, oy = 0, zoom = 1, origin = [W / 2, H / 2], lift = 0, proxy, blend }) => {
  const k = filmScale(id);
  const [ox, oo] = origin;
  const t = `translate(${ox}px, ${(oo - lift).toFixed(3)}px) scale(${zoom.toFixed(5)}) translate(${-ox}px, ${(oy - oo).toFixed(3)}px) scale(${k.toFixed(5)})`;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <SiteClip id={id} frame={frame} proxy={proxy} style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: t, mixBlendMode: blend }} />
    </div>
  );
};

// ------------------------------------------------------------------------------------------- the door
/**
 * Abs frame the door first shows through the orb's hole: 24 f before the Sites act (r8: 2216, the frame after Compose's
 * IRIS_AT 2215).
 */
export const DOOR_AT = ACT.sites.from - 24;
/**
 * hvit/intro's take frame on DOOR_AT (crit8). The take opens on its own focus pull: the aerial at an 8 px blur and the
 * headline at half ink until f16, then sharpening to f44 (Laplacian mean in the hole's view, CSS 700-900 x 527-727:
 * 0.7 on f0-14, 1.4 on f24, 6.9 on f36, 14.8 on f40, 19.3 on f42, 19.8 from f44). From f0 the hole's first frames were
 * a dim blue-grey disc the orb's size, read as the orb turning into a grey bubble; from f42 the first hole frame is
 * already sharp (the harbour and the white town), the headline finishes its last ink (55 -> 50) under the zoom, and the
 * take is still from f60 (2228) on, so the Sites run takes over a settled page (its door shot holds f60 under the zoom;
 * tour f20, its lift shot's first frame, is pixel-identical to it).
 */
const DOOR_FROM = 42;
/** hvit/intro's take frame through the door at abs frame `fAbs`: at 1.5x from DOOR_FROM, settled (f60) on abs 2228. */
export const DOOR = (fAbs: number) => clamp(DOOR_FROM + 1.5 * (fAbs - DOOR_AT), 0, 60);
/** The door's and the run's zoom origin: the hero's middle at film width (CSS 1600 x 1000 x 1.2 = 1920 x 1200). */
export const DOOR_ORIGIN = [W / 2, 600] as const;

/**
 * Through the orb's hole (Compose; it clips this with its own circle): Hvit's entrance at film width, top-aligned, the
 * film's zoom about the hero's middle. At zoom 1.87 (the first hole frame) the hole's centre (960, 884) sees page CSS
 * (800, 627), the aerial's harbour under the white town: the iris opens on a sharp picture. The Sites run continues the
 * same take and the same zoom (SHOTS door).
 */
export const SitesDoor: React.FC<{ fAbs: number; zoom: number }> = ({ fAbs, zoom }) => (
  <Full id="hvit/intro" frame={DOOR(fd(fAbs))} oy={0} zoom={zoom} origin={DOOR_ORIGIN} />
);

// ------------------------------------------------------------------------------------------- the hand
/**
 * The nine Hvit screens Compose's orb deals on drop 2, in deal order (0 = the leader, far right; 4 is painted on top;
 * 8 is dealt last, far left). One site, one ground, one typeface, one accent. Live cards play from `at` on the card's
 * own age (Deal's f - i * DEAL_RATE); the highest frame reached is about 228, inside every take.
 */
export const HAND: readonly { take: string; at: number; live: boolean; what: string }[] = [
  { take: 'hvit/place', at: 290, live: false, what: 'the shore view, "A village on a sand spit"' },
  { take: 'hvit/marquee-close', at: 60, live: true, what: '"Five rooms, three kinds" over the drifting marquee' },
  { take: 'hvit/rooms', at: 120, live: false, what: 'the fjord room card' },
  { take: 'hvit/rooms', at: 210, live: false, what: 'the ink loft card over the fjord card (the one dark card)' },
  { take: 'hvit/intro', at: 200, live: false, what: 'the hero, "White rooms in Flateyri"' },
  { take: 'hvit/seasons', at: 230, live: false, what: 'the tern on blue and the daylight months' },
  { take: 'hvit/months-close', at: 60, live: true, what: 'the hour numbers rolling' },
  { take: 'hvit/booking-ui', at: 0, live: true, what: 'the booking controls (state changes at age 30, 75, 120)' },
  { take: 'hvit/closing', at: 389, live: false, what: '"Flateyri" over "Wool on the bed, the sea at the window."' },
];

/** Card i's face at its deal age: one whole 1600 x 1000 screen in a 700 x 438 card, from the take's proxy. For Deal's `face`. */
export const handFace = (i: number, age: number) => {
  const c = HAND[i];
  return <SiteClip id={c.take} frame={c.live ? c.at + Math.max(0, age) : c.at} proxy width={700} height={438} style={{ objectFit: 'cover' }} />;
};

// ------------------------------------------------------------------------------------------- the run
/** The film camera on one frame of a shot: zoom about `origin`, then `lift` film px up. */
export type ShotCam = { zoom: number; origin: readonly [number, number]; lift: number };

export type Shot = {
  key: 'door' | 'lift' | 'rooms' | 'gather' | 'shelf' | 'stet' | 'manuscript';
  /** First and last local frame of the Sites act (inclusive); the shot is chosen on fd(l). */
  from: number;
  to: number;
  take: string;
  /** Take frame at the continuous local time l (sub-frames included); it extrapolates a little before `from`. */
  time: (l: number) => number;
  /** Film px: the page's top in the frame. */
  oy: number;
  cam: (l: number) => ShotCam;
  /** How the shot begins: through the door, an invisible take swap, a cut on the grid, or a polarity flip. */
  enter: 'door' | 'swap' | 'cut' | 'flip';
  /** 'ink': the page's blacks are lifted to the stage's C.ink (lighten), for a black-to-black cut. */
  ground?: 'ink';
};

const SITES_AT = ACT.sites.from;

/**
 * A take time-map from a table: F[i] is the whole take frame on local frame `from + i`. Between whole frames it is
 * linear (the master's sub-samples land on the neighbouring take frames: a true shutter blur), and past either end it
 * runs on the end step. A table, not a curve, where rounding a curve to whole take frames would make the preview step
 * unevenly (2 and 3 take frames alternating: 18 and 26 px on alternate frames, a hitch on a big edge).
 */
const table =
  (from: number, F: readonly number[]) =>
  (l: number): number => {
    const x = l - from;
    const i = Math.max(0, Math.min(F.length - 2, Math.floor(x)));
    return F[i] + (F[i + 1] - F[i]) * (x - i);
  };

/**
 * S1b on hvit/tour, local 16-27: the page's scroll accelerates every frame, never in pairs (film px per frame on the
 * page, from the take's own scroll: 0, 0, 0, 1.6, 3.2, 7.2, 10.4, 15.2, 21.6, 31.2, 38.4 into the cut). F[0] is tour
 * f20, pixel-identical to intro f60.
 */
const LIFT_F = [20, 20, 20, 20, 25, 30, 35, 41, 47, 54, 62, 70] as const;
/**
 * S2 on hvit/rooms, local 28-55: whole take-frame steps that never step faster than the frame before it (7, 6, 5, 4, 4,
 * then 3 x22 to the cut). crit7 #21: steps of 3 or more through the tea card's own text fade (take f133-154), so the
 * empty grey panel it leaves shows for 5 frames, not 11; the head starts 15 take frames earlier (f78) to keep the
 * entry. Film px per frame on the page: 39.2 (S1b's last is 38.4), 36, 31, 26-27, then 21-28 (the take's own scroll
 * gathers pace under the even step) to the cut. It ends on rooms f170, where the loft's dark top is at film y 549 (the
 * cup's crest on the next frame, gather f221: 551).
 */
const ROOMS_F = [78, 85, 91, 96, 100, 104, 107, 110, 113, 116, 119, 122, 125, 128, 131, 134, 137, 140, 143, 146, 149, 152, 155, 158, 161, 164, 167, 170] as const;

/**
 * The door's zoom carried on: one decay step past Compose's last frame (1.05 at abs 2239, crit7 #4a/#4b: the door no
 * longer ends at 1.42, which sliced Hvit's headline at the left edge), about the hero's middle. The headline is whole
 * from the first frame inside the iris. It runs on through the rooms shot as well (0.2% on its first frame), so Hvit's
 * fixed nav holds still across the 2268 cut instead of stepping as the zoom would drop away.
 */
const entryZoom = (l: number): ShotCam => ({ zoom: lmix(1.05, 1, decay(l, -1, 0.895)), origin: DOOR_ORIGIN, lift: 0 });

/**
 * The plunge into the cup's black: scale 1 to 4.8 over local 101-111 about a point low in the empty band (shelf f100:
 * the band runs film y 648-1056 under the word list, the bean cards below it). crit7 #9: the origin sits at y 1000, so
 * the word list leaves through the top while it is still small and the dive's last frame before the ink is band only,
 * instead of diving through giant flavour words. Measured on the r8 render: about y 940 (crit7's number) still filled
 * 2349 with "Jasmine / Hazelnut / Honey / Orange peel" and left "Orange p" sliced at the top of 2350; at 1000 the
 * bottom line (CSS 566-648 at f100) is under 130 px tall on 2349 and gone on 2350, and the bean cards stay below the
 * frame on every frame (their top edge maps to 1084 or lower on local 105-108). Log-space power 4: the camera barely
 * moves while the page settles, then sinks; the last frames carry the dive (zoom with the creep 1.27, 1.51, 1.97,
 * 2.90 on local 107-110, then all ink on local 111, abs 2351). The dive is decided on the whole frame, fd(l): every
 * master sub-sample of a frame shares one zoom, so the words that grow through the top edge stay crisp (a radial smear
 * of type is blur on type; eep E8 and wi3 E6 dive crisp). The page's own scroll is a whole-frame table (SHELF_F) read
 * on fd(l) by Sites, so the words cannot ghost between neighbouring take frames either. `sharp` (zoom past 1.2, local
 * 107) is kept for the checks.
 */
export const PLUNGE = { from: 101, to: 111, scale: 4.8, power: 4, origin: [W / 2, 1000] as const, sharp: 107 };
const plungeZoom = (F: number) =>
  F <= PLUNGE.from ? 1 : Math.exp(Math.log(PLUNGE.scale) * Math.pow(Math.min(1, (F - PLUNGE.from) / (PLUNGE.to - PLUNGE.from)), PLUNGE.power));

/**
 * The sink starts on the gather cut (local 56, abs 2296): from gather's first frame the camera creeps in about the
 * plunge's origin, 3% by the plunge's start (about 0.9 px/f at the top corners, about the stet push's speed), and keeps
 * going under it. The dive grows out of a move that has been running since the cut (iz1 R5, wi3 E6: a creep, then the
 * jump). 1.0 on the cut, so the rooms-to-cup height match is untouched.
 */
export const CREEP = { from: 56, rate: Math.log(1.03) / 45 };
const creep = (l: number) => Math.exp(CREEP.rate * Math.max(0, l - CREEP.from));
const sink = (l: number): ShotCam => ({ zoom: creep(l) * plungeZoom(fd(l)), origin: PLUNGE.origin, lift: 0 });
/**
 * S3b on kaffee-klee/shelf, local 82-111 (crit7 #9, r8 sites2): a whole-frame table, not a rounded curve. The old
 * eased curve rounded to whole take frames stepped 2/3 and 3/4 take frames on alternate frames (12.8, 14.4, 12.8,
 * 17.6, 14.4, 9.6, 15.2, 10.3 ... film px/f on 2328-2345, a judder on the big white type). Film px per frame on the
 * page, from the take's own scroll marks (x1.2): 4.0 off the pinned gather (its page stands still on screen), 4.8 x3,
 * then rising one take quantum at a time, 5.6, 6.4, 7.2, 8.0 ... 16.0, 16.8 x2 to local 107, then into the plunge
 * 11.2, 5.6 x2, and still on the all-ink frame. Never a step slower than the one before on the way up, nor faster on
 * the way down; under the dive's own growth the page's apparent speed keeps rising to the black (measured on the r8
 * sites2 render: 4.2, 5.4, 5.5, 5.6, 6.0, 6.4, 7.8 ... 15.6, 17.4, 20.9, 29.6, 51.0 px/f on 2323-2346, with the
 * plunge's creep and dive on top). It still enters on f15 (gather f299,
 * pixel-identical) and reaches f99 and f100 on local 109 and 110 as before (2349: the word line high in frame; 2350:
 * band only), so the page never parks after "Plum" lands and the dive does not carry a fast scroll.
 */
const SHELF_F = [15, 22, 26, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 98, 99, 100, 100] as const;

/**
 * S5's lift into Dash: from local 154 on the film's exit curve (k 1.25, Dash's own), 110 px by the last frame and 23 px/f
 * on it, inside the 120 px spare below. Dash1's board enters rising at about 37 px/f, so the hand-off is 0.63; the
 * plan's k 1.2 / v0 2 left it at 18 px/f, under half.
 */
export const LIFT = { at: 154, k: 1.25, v0: 1.6 };

/**
 * crit7 #12: the push onto the manuscript's mark. An axial push about "Katherine" (film x 246-456, y 464 at zoom 1),
 * 8% over local 140-162 on E.out, so it lands with the cut's energy and settles before the lift. No pan: the mark keeps
 * its place in frame while everything else opens away from it.
 */
const MARK = { origin: [350, 464] as const, zoom: 1.08, to: 162 };

/** S4's first take frame: mark-close f6, the word already legible in its halftone (f0-f4 are black, then a sparse field). */
const STET_AT = 6;

/** Sites (abs 2240-2407, local 0-167). Rhythm 28 | 28 | 56 | 28 | 28. */
export const SHOTS: readonly Shot[] = [
  // S1a: the hole has filled the frame; the site finishes focusing (the DOOR starts at take f42, so this holds take f60, r8).
  { key: 'door', from: 0, to: 15, take: 'hvit/intro', time: (l) => DOOR(SITES_AT + l), oy: 0, cam: entryZoom, enter: 'door' },
  // S1b: intro f60 and tour f20 are pixel-identical. The page starts to scroll on its own, accelerating every frame
  // into the cut (LIFT_F: its last step is 8 take frames, 38 film px up).
  { key: 'lift', from: 16, to: 27, take: 'hvit/tour', time: table(16, LIFT_F), oy: 0, cam: entryZoom, enter: 'swap' },
  // S2, b(21,1): enters at S1b's speed (7 take frames, 39 film px up) and slows in whole steps (ROOMS_F) to an even 3,
  // about 28 px/f handed to gather's 22. The fjord card pins, the ink loft card slides up over it, and on rooms f170
  // the loft's dark top is at film y 549, where the cup's black crest stands on the next frame (gather f221: 551).
  // The fixed nav holds across the cut.
  { key: 'rooms', from: 28, to: 55, take: 'hvit/rooms', time: table(28, ROOMS_F), oy: 0, cam: entryZoom, enter: 'cut' },
  // S3a, b(21,2): the loft card's dark top rises into Kaffee Klee's black cup at the same height; the words fall in at
  // 3x (crit7 #9: compressed, so the page never parks after "Plum" lands). The camera's creep into the cup starts on
  // this frame (CREEP). It reaches gather f296 on local 81.
  { key: 'gather', from: 56, to: 81, take: 'kaffee-klee/gather', time: (l) => 221 + 3 * (l - 56), oy: 0, cam: sink, enter: 'cut' },
  // S3b: gather f299 and shelf f0-f15 are pixel-identical (the shelf's own scroll starts on f16), so the swap enters on
  // f15 (gather's next 3-frame step) and the page goes on at once. SHELF_F carries it to f100: the page lets the words
  // go upward, gathering pace, then slows as the camera sinks into the empty black band, so the dive is not also
  // carrying a fast scroll x4.8. All ink on local 111.
  { key: 'shelf', from: 82, to: 111, take: 'kaffee-klee/shelf', time: table(82, SHELF_F), oy: 0, cam: sink, enter: 'swap' },
  // S4, b(22): "stet" lands on the downbeat out of the cup's black and finishes printing itself. r8 sites2: the take
  // runs at 1x from f6 (f6-f33; it was 1.25x from f0, a 1-1-1-2 take-frame cadence that spiked the diff every 4th
  // frame), so its first frame already reads as the word instead of a sparse field of halftone dots, and it ends where
  // it did (f33.75 before). Its black (luma 8) sits lighten-blended on the C.ink stage (13).
  {
    key: 'stet',
    from: 112,
    to: 139,
    take: 'editing-tool/mark-close',
    time: (l) => STET_AT + (l - 112),
    oy: -60,
    cam: (l) => ({ zoom: lmix(1, 1.025, clamp((l - 112) / 28)), origin: [W / 2, H / 2], lift: 0 }),
    enter: 'cut',
    ground: 'ink',
  },
  // S5, b(22,1): the polarity flip onto paper. crit7 #12: the green mark draws under "Katherine" and sweeps over it at
  // 1.5x (take f21-47, whole by local 158, abs 2398) while the camera pushes in on it (MARK), then the page holds on the
  // mark and lifts into Dash1's rising board. It never passes take f47: the flag's note starts on f49 and could only
  // be half-born and cut, so the shot ends on the mark.
  {
    key: 'manuscript',
    from: 140,
    to: 167,
    take: 'proofloom/flag-close',
    time: (l) => Math.min(47, 21 + 1.5 * (l - 140)),
    oy: 0,
    cam: (l) => ({ zoom: lmix(1, MARK.zoom, prog(l, 140, MARK.to, E.out)), origin: MARK.origin, lift: accel(l, LIFT.at, 0, LIFT.k, LIFT.v0) }),
    enter: 'flip',
  },
];

/** The shot on whole local frame F (pass fd(l)). */
export const shotAt = (F: number) => SHOTS.find((s) => F >= s.from && F <= s.to) ?? (F < 0 ? SHOTS[0] : SHOTS[SHOTS.length - 1]);
