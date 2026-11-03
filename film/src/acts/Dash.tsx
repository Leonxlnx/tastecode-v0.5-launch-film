import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { C } from '../brand/tokens';
import { accel, decay } from '../lib/anim';
import { ACT, BEAT, H, W } from '../timeline';

// Two dashboards, flipping the stage's polarity on the beat, with no text (r8: the design card before Compose names
// them). The boards are mockups made for the film. dash2 ends with a
// hard cut to the black switch card.
//
// r8 sites2: each board is the whole screen, centred by construction (the page at film width, x 0-1920, nothing cut
// on one side), with no window frame, no stage around it and no sideways move: it only rises on its own scroll. The
// boards are the no-dots captures (public/mock/<id>/full-nodots.jpg, Leon's "NO DOTS"): lanes are solid lines, the map
// has no load dots, hub markers or ping, the legend keys are short lines, lane progress is a bar fill, and Orchard's
// MRR line has no end marker. Same pages, same layout and size as the old full.jpg (1600 CSS px at DPR 1.5).

/** The boards: 2400 px wide captures, their height in capture px, and a ground behind them (never seen: the page covers the frame). */
const BOARD = {
  meridian: { src: 'mock/meridian/full-nodots.jpg', h: 1940, ground: C.ink },
  orchard: { src: 'mock/orchard/full-nodots.jpg', h: 2130, ground: C.paper },
} as const;
type BoardId = keyof typeof BOARD;

/** Film px per capture px: the page drawn at film width. */
const K = W / 2400;

/**
 * How far the page has risen on local frame f (film px): an entry rise carried on the cut's speed (`rise`, decaying
 * 0.9 per frame), the page's own slow scroll (`scroll`, 0.955), and the exit (the film's exit curve from EXIT f before
 * the cut, k 1.25 from 0.5 px/f, so it grows out of the slow scroll without a kink). Its speed on frame 0 is
 * rise x 0.1 + scroll x 0.045; on its last frame about 0.5 x 1.25^16 + 0.7 = 18.5.
 */
type Move = { rise: number; scroll: number };
const EXIT = 18;
const travel = (f: number, dur: number, m: Move) => m.rise * decay(f, 0, 0.9) + m.scroll * decay(f, 0, 0.955) + accel(f, dur - EXIT, 0, 1.25, 0.5);

/**
 * Dash1 (Meridian, dark): enters at 24 px/f, the manuscript's lift (23.6 px/f on its last frame), settles to under
 * 2 px/f mid-shot and leaves at about 18.5 px/f into the flip; 412 px of its 472 spare. Dash2 (Orchard, light):
 * enters at 19 px/f, Dash1's exit speed, and leaves at about 18.5 px/f into the hard cut; 362 px of 624.
 */
const MOVES: Record<BoardId, Move> = {
  meridian: { rise: 160, scroll: 180 },
  orchard: { rise: 110, scroll: 180 },
};

// At load: no board may rise past its own bottom edge (the stage would show under it).
for (const [id, dur] of [['meridian', ACT.dash1.dur], ['orchard', ACT.dash2.dur]] as const) {
  const spare = BOARD[id].h * K - H;
  const t = travel(dur - 1, dur, MOVES[id]);
  if (t > spare) throw new Error(`Dash: ${id} rises ${t.toFixed(0)} px, its page has ${spare.toFixed(0)} px below the frame`);
}

const Board: React.FC<{ id: BoardId; f: number; dur: number }> = ({ id, f, dur }) => {
  const b = BOARD[id];
  const y = -travel(f, dur, MOVES[id]);
  return (
    <div style={{ position: 'absolute', inset: 0, background: b.ground, overflow: 'hidden' }}>
      <Img src={staticFile(b.src)} style={{ position: 'absolute', left: 0, top: 0, width: W, height: b.h * K, transform: `translateY(${y.toFixed(3)}px)` }} />
    </div>
  );
};

export const Dash1: React.FC = () => {
  const f = useCurrentFrame();
  return <Board id="meridian" f={f} dur={ACT.dash1.dur} />;
};

export const Dash2: React.FC = () => {
  const f = useCurrentFrame();
  return <Board id="orchard" f={f} dur={ACT.dash2.dur} />;
};

/** The polarity flip, dash1 local (abs 2464 = b(23)): sync.ts sounds bass + land here. */
export const DASH = { flip: BEAT * 2 };
