import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Clip } from '../fx/kit';
import { fd } from '../lib/anim';
import { ACT, H, W } from '../timeline';
import type { Sound } from './Sound';

// The film's breath, in one take (r8). The calm card has said it ("Watch your agent work,"
// / "step by step."), so this act only shows it: the real thread, full frame and sharp, arriving message by message.
// No text from the film, no lens, no horizontal move. One slow axial push, and one vertical follow: the frame holds
// while the first messages fill the room left under them, then follows the newest message down as the agent's finding
// and its subagents arrive, and settles on the whole thread before a hard cut into the design card on b(17).
// crit8: the cut from the card's centred line lands mid-stream, with the agent's first line on the frame's centre line,
// not on an empty thread.
const DUR = ACT.calm.dur; // 168
const CLIP = 'calm-take2'; // the whole window, 1310x720 at DPR 4.4; its page clock runs ahead, so no timer reads as a speed
const APP_BG = 'rgb(15,15,15)'; // lint-ok: the app's own chat ground (#0F0F0F), sampled from the take's PNGs

// Clip time, in the take's own events (footage/clips/calm-take2/meta.json, checked on the PNGs).
const CLIP_START = 78; // "Searching" lands whole under the first streamed line, which is in to "...to the firs" and streams "first paint." on to 86
const CLIP_FIRST = 46; // the first streamed line's box (its first glyph shows at 48)
const CLIP_SEARCH = 78; // "Searching" under it (a dim ghost on 77, whole on 78)
const CLIP_FOLD = 115; // the reads fold to their count
const CLIP_REPLY = 120; // the finding's first glyph ("The plan cards render twice.")
const CLIP_NOTE = 128; // the finding's second line (its box grows here)
const CLIP_RUN = 144; // "Running Explore · Trace the price to first paint"
const CLIP_AGENTS = 162; // the three agents open (the rows unroll over 162-166)
const AGENTS_AT = 112; // local = b(16,2): the rows start to unroll on the beat; from here the take plays at its real speed

/** Cubic Hermite through [local, clip, slope] keys: C1, so the stream never changes speed in a step. */
const hermite = (k: [number, number, number][]) => (x: number) => {
  let i = 0;
  while (i < k.length - 2 && x >= k[i + 1][0]) i++;
  const [x0, y0, m0] = k[i];
  const [x1, y1, m1] = k[i + 1];
  const h = x1 - x0;
  const t = (x - x0) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m1;
};
// The stream runs under real time from the cut (0.65x, a calm agent) and gathers to 1x as the agents open, never
// changing speed in a step (0.64-1.0x throughout, asserted below), so every message after the first still visibly
// arrives: "first paint.", "Reading files", the fold, the finding's two lines, "Running", the subagents, their rows.
const STREAM_IN = 0.65;
const streamAt = hermite([
  [0, CLIP_START, STREAM_IN],
  [AGENTS_AT, CLIP_AGENTS, 1],
  [DUR, CLIP_AGENTS + DUR - AGENTS_AT, 1],
]);
/** The clip frame shown on local frame f, decided on fd. The last one is clip 217: every agent row whole. */
const srcAt = (f: number) => fd(streamAt(f));
const CLIP_END = srcAt(DUR - 1);
for (let f = 0; f < DUR - 1; f++) {
  const v = streamAt(f + 1) - streamAt(f);
  if (!(v >= 0.6 && v <= 1.05)) throw new Error(`Calm: the stream runs at ${v.toFixed(3)}x on local ${f} (allowed 0.6-1.05x)`);
}
if (CLIP_END >= 221) throw new Error(`Calm: the act ends on clip ${CLIP_END}; the agent rows' counters change on 221`);

const localOf = (clip: number) => {
  let i = 0;
  while (i < DUR - 1 && srcAt(i) < clip) i++;
  return i;
};

/**
 * The take's visible events, local frames, through streamAt: first 0 and searching 0 (both on the cut), fold 56,
 * reply 63, note 73, running 93, agents 112.
 */
export const CALM_EVENTS = {
  first: localOf(CLIP_FIRST),
  searching: localOf(CLIP_SEARCH),
  fold: localOf(CLIP_FOLD),
  reply: localOf(CLIP_REPLY),
  note: localOf(CLIP_NOTE),
  running: localOf(CLIP_RUN),
  agents: localOf(CLIP_AGENTS),
};
// The breakdown has no UI sounds at all (Leon, Nov 2: the toggles and the slide here were among the worst sounds in
// the film). The music's breakdown carries the act.
export const CALM_SOUND: Sound[] = [];

// The frame, in CSS px of the window (the take's marks). The thread's column is x 396.5-1170.5 (the agent's text from
// its left edge, the prompt bubble to its right edge); its content runs from the pinned prompt's top (y 102) to the
// last agent row's foot (y 454). The frame is centred on the column and never moves sideways. crit8: 2.30x on the cut
// (the take's body type about 8% larger than before), pushing to 2.35x on the last frame, where the bubble still has
// 51 px of ground to the frame's right edge (SIDE_MIN asserted). The sidebar and its identity card stay far out of frame.
const S0 = 2.3;
const S1 = 2.35;
const FOCUS_X = 396.5 + 774 / 2; // 783.5, fixed: nothing moves sideways
const scaleAt = (f: number) => S0 * Math.pow(S1 / S0, f / DUR); // constant ratio per frame: one slow axial push, no ease to read
const SIDE_MIN = 48; // px of ground left and right of the column, on the 1080 frame, at every frame

// The vertical follow. On the cut the frame holds the prompt in the upper third (y ~308 of 1080), the agent's first
// line on the centre line (~529), where the card's line just stood, and "Searching" under it (614), with the room
// below for what streams next (the finding 694-752, "Running" 837). It holds still (only the push) while that room
// fills, then follows the newest message: it starts as the finding's first glyph shows (CALM_EVENTS.reply), is at its
// fastest as the subagents start (running), and settles as their rows unroll (agents), landing at rest on b(16,3) on
// the balanced end frame (the whole thread, prompt top to the rows' foot, centred) for 28 f before the cut. One move,
// one direction, no cruise: a raised-cosine rise over FOLLOW_IN and a twice-as-long raised-cosine settle. About 135 px
// on the 1080 frame, never faster than TRAVEL_MAX px/f (asserted; peak 3.54 on local 89).
const FOCUS_Y0 = 220;
const FOCUS_Y1 = (102 + 454) / 2; // 278
const FOLLOW_AT = CALM_EVENTS.reply; // 63
const TRAVEL_END = 140; // = b(16,3)
const FOLLOW_IN = 26;
const FOLLOW_OUT = TRAVEL_END - FOLLOW_AT - FOLLOW_IN; // 51
const TRAVEL_MAX = 4;
/** Its closed-form travel, in frames of full speed: raised-cosine velocity up over FOLLOW_IN, down over FOLLOW_OUT. */
const travelG = (f: number) => {
  const u = Math.min(Math.max(f - FOLLOW_AT, 0), FOLLOW_IN + FOLLOW_OUT);
  if (u < FOLLOW_IN) return u / 2 - (FOLLOW_IN / (2 * Math.PI)) * Math.sin((Math.PI * u) / FOLLOW_IN);
  const w = u - FOLLOW_IN;
  return FOLLOW_IN / 2 + w / 2 + (FOLLOW_OUT / (2 * Math.PI)) * Math.sin((Math.PI * w) / FOLLOW_OUT);
};
const TRAVEL_G = travelG(TRAVEL_END); // (FOLLOW_IN + FOLLOW_OUT) / 2
const focusYAt = (f: number) => FOCUS_Y0 + (FOCUS_Y1 - FOCUS_Y0) * (travelG(f) / TRAVEL_G);
/** Where a point of the take at CSS y sits on the 1080 frame on local f. */
const screenY = (y: number, f: number) => H / 2 + (y - focusYAt(f)) * scaleAt(f);

if (FOLLOW_IN < 16 || FOLLOW_OUT < FOLLOW_IN) throw new Error(`Calm: the follow needs a rise of 16 f or more and a longer settle (${FOLLOW_IN}/${FOLLOW_OUT})`);
if (Math.abs(focusYAt(TRAVEL_END) - FOCUS_Y1) > 1e-9) throw new Error('Calm: the follow does not land on the end frame');
for (let f = 0; f < DUR; f++) {
  // No point of the thread (the prompt's top, the first line, the rows' foot) moves faster than TRAVEL_MAX px/f.
  if (f < DUR - 1) {
    for (const y of [102, 215, 454]) {
      const v = Math.abs(screenY(y, f + 1) - screenY(y, f));
      if (v > TRAVEL_MAX) throw new Error(`Calm: y ${y} travels ${v.toFixed(3)} px/f on local ${f} (max ${TRAVEL_MAX})`);
    }
  }
  // The frame's bottom edge, in the window's CSS px, stays above the composer's top (601).
  const bottom = focusYAt(f) + H / 2 / scaleAt(f);
  if (bottom > 580) throw new Error(`Calm: the frame's bottom reaches y ${bottom.toFixed(1)} on local ${f}, near the composer`);
  const side = W / 2 - (FOCUS_X - 396.5) * scaleAt(f);
  if (side < SIDE_MIN) throw new Error(`Calm: the column comes within ${side.toFixed(1)} px of the frame's side on local ${f}`);
}
// The cut lands on the stream: the prompt's middle in the upper third (25-36% down), the first line on the centre line.
const openPrompt = screenY(119, 0) / H;
if (openPrompt < 0.25 || openPrompt > 0.36 || Math.abs(screenY(215, 0) - H / 2) > 20) throw new Error('Calm: the opening frame lost its composition');
// The rows unroll inside the frame (their foot 80 px or more above its bottom from the moment they open).
for (let f = CALM_EVENTS.agents; f < DUR; f++) {
  if (screenY(454, f) > H - 80) throw new Error(`Calm: the agent rows' foot sits at ${screenY(454, f).toFixed(0)} px on local ${f}`);
}

// Above y 92 the frame would hold the chat's header (its title and menu) and the scrolled-away timestamp peeking
// under it, and above y 0 the window ends: one flat sheet of the chat's own ground covers all of it, so the top of the
// frame is the chat's empty air.
const COVER_Y = 92;
// The status dot that breathes before "Working for 2m 14s" (ink x 401-408, y 173-181.4 over the take, measured on
// the PNGs; the label starts at x 419). Leon: no dots. A patch of the chat's own ground (uniform 15,15,15 there) hides
// it; the label stays.
const DOT_COVER = { x: 396, y: 167, w: 18, h: 20 };

export const Calm: React.FC = () => {
  const f = useCurrentFrame();
  const src = srcAt(f);
  const s = scaleAt(f);
  const fy = focusYAt(f);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, background: APP_BG, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${W / 2 - FOCUS_X * s}px, ${H / 2 - fy * s}px) scale(${s})` }}>
        <Clip id={CLIP} frame={src} />
        <div style={{ position: 'absolute', left: -40, top: -400, width: 1390, height: COVER_Y + 400, background: APP_BG }} />
        <div style={{ position: 'absolute', left: DOT_COVER.x, top: DOT_COVER.y, width: DOT_COVER.w, height: DOT_COVER.h, background: APP_BG }} />
      </div>
    </div>
  );
};
