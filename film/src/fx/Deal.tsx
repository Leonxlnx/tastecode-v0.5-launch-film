import React from 'react';
import { Img } from 'remotion';
import { C, typeStyle } from '../brand/tokens';
import { clamp, decay, DRAIN, E, fd, mix, SET } from '../lib/anim';
import { mockUrl } from './kit';

// One page, cut into nine: the page the prompt asked for, dealt out of the send orb like a hand of cards, opening
// clockwise over a 200 degree arc. Every card carries its page from its first visible frame (r8 crit compose: a wipe
// left each card a blank paper slab at the arc's start for 1-5 f); the card's back is the page's own paper under it,
// so the hand reads as one light site (crit7 #2: no accent in the hand, the accent means "needs you" only). `pos` is the crop's vertical position on the slot's file, so replacing the
// Halden file keeps nine sections of whatever page is there. A `face` replaces the nine sections (Compose deals nine
// real Hvit screens, fx/SiteRun HAND).
const PAGE = 'halden';
const CARDS: { pos: number; zoom: number; ox: number; oy: number }[] = [
  // in deal order: the leader ends up at the far right, the last card at the far left
  { pos: 42, zoom: 1, ox: 0.5, oy: 0.5 }, // the two pictures
  { pos: 83, zoom: 1, ox: 0.5, oy: 0.5 }, // the list, paper
  { pos: 60, zoom: 1.2, ox: 1, oy: 0.5 }, // the dish
  { pos: 30, zoom: 1.3, ox: 0.5, oy: 0 }, // the iron bowl, close
  { pos: 0, zoom: 1, ox: 0.5, oy: 0 }, // the word on the bowl: the centre, on top
  { pos: 8, zoom: 1.15, ox: 0.5, oy: 1 }, // the pale bowl, close
  { pos: 46, zoom: 1.5, ox: 0, oy: 0.2 }, // the hare bowl, close
  { pos: 66, zoom: 1, ox: 0.5, oy: 0.5 }, // forty pieces
  { pos: 18, zoom: 1, ox: 0.5, oy: 0.5 }, // fired slowly, paper
];
const N = CARDS.length;
const ARC = 200;
const STEP = ARC / (N - 1);
const CARD_W = 700;
const CARD_H = 438;
const DEAL_RATE = 3; // f between cards
const CENTRE = (N - 1) / 2;

/** The cards' backs: Hvit's own page ground (#F6F5F3 on every Hvit take), so an unwiped card is the site's paper. */
const BACK = 'rgb(246,245,243)'; // lint-ok: Leon's Hvit page ground, sampled from the hvit takes (site content, not the film's palette)

/**
 * Paint order, bottom to top. The nearer a card is to the top of the arc the higher it sits, so the middle card is
 * whole; each end card sits right above its one neighbour: the last-dealt card (8, "Flateyri", the hand's biggest
 * word) over the booking card, so the word reads whole (crit7 #20; the booking card's empty name field goes under it),
 * and the leader (0) on top of all, as it sweeps the whole arc first.
 */
const ORDER = (() => {
  const o = CARDS.map((_, i) => i).sort((a, b) => Math.abs(b - CENTRE) - Math.abs(a - CENTRE)); // 0, 8, 1, 7, 2, 6, 3, 5, 4
  const rest = o.filter((i) => i !== 0 && i !== N - 1);
  const j = rest.indexOf(N - 2);
  return [...rest.slice(0, j + 1), N - 1, ...rest.slice(j + 1), 0]; // 1, 7, 8, 2, 6, 3, 5, 4, 0
})();

export type DealPose = {
  f: number; // frames since the deal began
  cx: number;
  cy: number;
  rIn: number; // inner radius of the arc
  scale?: number; // the whole hand, for the exit
  out?: number; // 0..1 cards flung outward on the exit
  /** Card i's face at its deal age (f - i * DEAL_RATE), drawn 700 x 438 under the wipe; default: the Halden section. */
  face?: (i: number, age: number) => React.ReactNode;
};

/** The hand's own turn, degrees: thrown open against the sweep, decaying to a floor so it never stops. */
export const spinAt = (f: number) => (f <= 0 ? -18 : -18 + 8 * (1 - Math.pow(0.95, f)) + 0.42 * f);

export const Deal: React.FC<DealPose> = ({ f, cx, cy, rIn, scale = 1, out = 0, face }) => {
  if (f < 0) return null;
  const spin = spinAt(f);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${cx}px, ${cy}px) scale(${scale})` }}>
      {ORDER.map((i) => {
        const c = CARDS[i];
        const age = f - i * DEAL_RATE;
        if (age < 0) return null;
        // Every card leaves from the same spot at the arc's start and stops at its place: the leader travels furthest.
        const final = ARC / 2 - i * STEP;
        const a = -ARC / 2 + (final + ARC / 2) * decay(age, 0, 0.9) + spin;
        const grow = decay(age, 0, 0.82); // the card shooting out of the orb
        const r = rIn + (1 - grow) * -140 + out * 620;
        const shadowO = 0.42 * grow;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: CARD_W,
              height: CARD_H,
              transformOrigin: '0 0',
              transform: `rotate(${a}deg) translate(${-CARD_W / 2}px, ${-r - CARD_H}px) scale(${mix(0.5, 1, grow)})`,
              borderRadius: 16,
              overflow: 'hidden',
              background: BACK,
              boxShadow: `0 18px 60px rgba(0,0,0,${shadowO}), 0 2px 10px rgba(0,0,0,${shadowO * 0.6})`,
            }}
          >
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              {face ? (
                face(i, age)
              ) : (
                <Img
                  src={mockUrl(PAGE, 'full')}
                  style={{ display: 'block', width: CARD_W, height: CARD_H, objectFit: 'cover', objectPosition: `50% ${c.pos}%`, transformOrigin: `${c.ox * 100}% ${c.oy * 100}%`, transform: `scale(${c.zoom})` }}
                />
              )}
            </div>
            {/* A paper card on paper cards: a faint dark edge keeps each card's outline (a light one vanished on Hvit's ground). */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 16, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.08)' }} />
          </div>
        );
      })}
    </div>
  );
};

/**
 * The take's send orb, its disc sampled flat from the design-compose PNGs: grey 215 at rest (to clip 253), 237 in its
 * hover state (from clip 256). `orbFill(hover)` mixes the two, so the film's orb can carry the app's own hover change
 * over a few frames instead of the time-mapped take's one-frame step.
 */
const ORB_REST = 215;
const ORB_HOVER = 237;
export const orbFill = (hover: number) => {
  const v = Math.round(mix(ORB_REST, ORB_HOVER, clamp(hover)));
  return `rgb(${v},${v},${v})`;
};
const ORB_FILL = orbFill(1);
/**
 * The take's arrow in units of the disc's radius (crit8, measured on clip 265: disc r 35.8 at clip (1817, 687.1); stem
 * 1.25 px left of the centre from 8.3 above it to 10.5 below; 45-degree arms 8 px out; a 2.6 px round stroke). The orb
 * the film draws is the app's orb exactly, so on the frame it takes over from the take nothing changes (r8 drew a 1.7x
 * longer, 2x heavier arrow on a greener disc, which popped on the press).
 */
const ARROW = 'M-0.035 0.294 L-0.035 -0.231 M-0.258 -0.019 L-0.035 -0.231 L0.188 -0.019';
const ARROW_W = 0.073;

/** The send orb as a device: the app's light orb with its dark arrow, here free to turn. `opacity` takes disc and arrow together. */
export const Orb: React.FC<{ x: number; y: number; r: number; turn?: number; dip?: number; opacity?: number; fill?: string }> = ({ x, y, r, turn = 0, dip = 0, opacity = 1, fill = ORB_FILL }) => {
  const R = Math.max(0, r * (1 - 0.3 * dip));
  return (
    <svg width={4} height={4} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity, transform: `translate(${x}px, ${y}px)` }}>
      <circle cx={0} cy={0} r={R} fill={fill} />
      <g transform={`rotate(${turn}) scale(${R})`}>
        <path d={ARROW} fill="none" stroke={C.ink} strokeWidth={ARROW_W} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
};

/**
 * The real labels of a Design turn, as the app words them (clip design-phases): six of its eight, ticking
 * through the prompt row in one fixed spot. `align: 'left'` puts the text's left end at x (the composer's prompt
 * row); otherwise x is its centre.
 *
 * crit8: no masked roll (it showed two labels stacked, half glyphs, for 3-4 frames on every change). The house grammar
 * instead, horizontal only: a label strikes whole in its own place on its onset, decided on fd (SET: ink from the dark
 * stage's o0, a PHASE_H weight settle and a 0.13 em close-up from the right, on SET.k / SET.kInk); the one before drains
 * over the last PHASE_DRAIN frames of its own step (DRAIN: ink on E.smooth, weight to DRAIN.weight on E.in, the small
 * leftward drift). The label is chosen on fd(f), so no frame, sub-frames included, ever holds two labels; nothing moves
 * vertically. The last label holds.
 */
export const PHASES = ['Understanding the request', 'Creating brand direction', 'Planning the page', 'Building the website', 'Reviewing the design', 'Refining the website'];
const PHASE_H = 60; // weight above rest on the strike: a quiet UI cut-in (SET's cut mode is 80)
const PHASE_DRAIN = 5; // f: the outgoing label's drain, ending on the frame before the next strike
const PHASE_REST = 500;
export const PhaseTick: React.FC<{ f: number; step: number; x: number; y: number; opacity?: number; size?: number; align?: 'center' | 'left'; color?: string }> = ({ f, step, x, y, opacity = 1, size = 38, align = 'center', color = C.white }) => {
  if (fd(f) < 0) return null;
  const i = clamp(Math.floor(fd(f) / step), 0, PHASES.length - 1);
  const t = Math.max(0, f - i * step); // since this label's strike; sub-frames before it read as its strike frame
  const settle = Math.pow(SET.k, t);
  // The drain runs on (PHASE_DRAIN + 1) steps so its last drawn frame keeps a trace of ink and the next label strikes
  // on the frame after it: no empty frame and no shared one.
  const u = i === PHASES.length - 1 ? 0 : clamp((t - (step - PHASE_DRAIN) + 1) / (PHASE_DRAIN + 1));
  const td = Math.max(0, t - (step - PHASE_DRAIN));
  const ink = (1 - (1 - SET.o0.dark) * Math.pow(SET.kInk, t)) * (1 - E.smooth(u));
  const weight = mix(PHASE_REST + PHASE_H * settle, DRAIN.weight, E.in(u));
  const dx = SET.close.display * size * settle - DRAIN.drift * (size / DRAIN.driftRef) * (Math.pow(DRAIN.grow, td) - 1);
  const w = 1920;
  const h = Math.round(size * 1.37);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, transform: `translate(${align === 'left' ? x : x - w / 2}px, ${y}px)`, opacity }}>
      {ink > 0.002 && (
        <div data-text="phase" style={{ ...typeStyle('secondary', size), color, fontWeight: Number(weight.toFixed(1)), opacity: Number(ink.toFixed(4)), position: 'absolute', left: 0, top: 0, width: w, textAlign: align, transform: `translateX(${dx.toFixed(3)}px)` }}>
          {PHASES[i]}
        </div>
      )}
    </div>
  );
};
