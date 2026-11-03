import React, { useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import { C, SAFE, TYPE, U } from '../brand/tokens';
import { CLIPS } from '../data/clips';
import { Clip, Plate, Win } from '../fx/kit';
import { Line, LinePlan, trackOf } from '../fx/Line';
import { Shader } from '../fx/Shader';
import { accel, clamp, decay, E, fd, glide, lmix, mix, prog, squash } from '../lib/anim';
import { glyphLayout, GlyphLayout, inkBox } from '../lib/measure';
import { FOG, hex } from '../style/shaders';
import { ACT, b, copy, H, W } from '../timeline';
import { ECLIPSE_END } from './Eclipse';

// DROP 1. The frame is white with the black dot in it. "We rebuilt the" is struck on the drop, ink on
// the white, while the dot is thrown in one arc over the line; "interface" strikes in the dot's wake
// once the dot is near the top of its arc, high over the word, and the dot hangs there and drops into
// the line's end as the period. A ridge condenses out of the white under the title. The real window comes up
// from below; as its top nears, the whole line, period and all, lifts out of the frame top as one block
// while the window decelerates up beneath it. The camera then falls toward the sidebar into the cut, as one
// zoom about one screen point ZOOM_P that Needs carries on to its framing (no pan anywhere in it).
// (TEXT-SYSTEM.md, Rebuilt: SET in three units on the drop, the dot and the land; exit HANDOFF (c).)
const DUR = ACT.rebuilt.dur;
const TEXT = copy('rebuilt').text; // "We rebuilt the interface."
const BODY = TEXT.replace(/\.$/, ''); // the words the Line sets; the dot is the period
const ROLE = 'hero' as const;
const STRIKE = 0; // f: "We rebuilt the", one hit unit on the drop, b(6)
// f 21 (abs 581): "interface". The dot is then ~75 px over the ascenders, at the height it hangs at. Struck
// on b(6,0,2) (f14) the dot hung 18-52 px over the r and f while the word came in, and read as an accent (crit6 #11).
const INTERFACE = b(6, 0, 3) - ACT.rebuilt.from;
const LAND = 40; // f: the dot's contact as the period (the land sound is tied to it); the line resolves here
const OUT = 118; // f: the line lifts out as the window's top comes up (78 f after the period lands)
// The lift: 2 px/f on its first frame (past single-pixel steps), then x1.2 a frame. The ink band is ~120 px
// tall on screen, so the frame top must cross it at ~50-60 px/f to cut it on 2 frames only (house rule
// 1(b), asserted in lineLayout): at k 1.13 it crossed at 31-40 px/f and cut three frames ("vve repuiit").
const LIFT = { k: 1.2, v0: 2 };
const CLEARS = 138; // f: the first frame nothing of the line is drawn (asserted against the layout below)
// The toss: one throw, off the drop at ~50 px/f. Across, it slows steadily (E.type, the quad-out) and
// comes to rest over its seat at ACROSS, so the arc turns smoothly into a straight fall beside the "e".
// Up, it slows to the top of the arc (quad-out again), hangs there and then drops into the seat on E.in
// squared. On plain E.in it sank beside the "e" for four frames (f36-39 at 13-44 px/f: "interface'", then a
// middle dot; crit6 #11). Squared, it holds the apex height ~4 f longer and falls in one stroke: f38 is
// still ~39 px over the ascenders, f39 is the only frame inside the line's row (50 px/f in), and it lands
// on f40 as before, at ~104 px/f instead of 62 (asserted in lineLayout).
const APEX_EM = 1.27; // the top of the arc above the seat: well clear of the line's ascenders
const APEX_F = 23; // f: the top of the arc
const FALL_P = 2; // the fall runs on E.in^FALL_P
const ACROSS = LAND - 2;
const WIN_W = 1520;
const WIN_AT = 104; // f: the window's first frame on screen; the line reads alone over the ridge until then
const WIN_Y = 350; // where it would rest; it never reaches the lifting line
const CLIMB = 0.6; // px/f: it keeps rising under the line and the lift, then eases out into the zoom
const CAM = DUR - 70; // f: the camera starts falling toward the sidebar (imperceptible for its first ~25 f)
// The camera's total scale on the last frame. 3.79 (was 3.6) so the zoom's speed is the same on both sides of the
// cut: x1.088 on 838 -> 839 and on 839 -> 840 (log 0.0845), its fastest frames, accelerating into the cut and
// landing fast then slow in Needs.
const END_K = 3.79;
const AX_K = 150; // the push's pivot until HOLD, in the clip's px from the window's left edge (the line is placed about it)
const AY = 480;
const PUSH = 0.0005;
// The one zoom (Leon on preview 6: "in the last moment you kinda pan to the left ... it should auto zoom perfectly
// there"). From HOLD (abs 760) to Needs' GRAB (abs 931) the whole picture scales about one fixed screen point,
// ZOOM_P: the slow push, the fall into the cut, and Needs' landing on its rail. The climb has eased out by HOLD
// (CLIMB_EASE f, velocity on a smoothstep), so from HOLD the content under ZOOM_P stays put to the last frame of the
// move, and every other point only moves straight out from it. ZOOM_P is the fixed point of Rebuilt's pose on HOLD
// and Needs' framing on GRAB (scale 8.06, rail left at x -18, rail y 114.1 at the frame top), so the zoom heads for
// that framing from its first frame and never corrects. Needs.tsx solves it again at load and throws if it moves.
export const ZOOM_P = { x: 220.34, y: 563.07 }; // screen px: the rail's css (29.6, 184), between Pinned and Projects
const CLIMB_EASE = 30;
const HOLD = CAM - 10; // f 200, abs 760
// The ridge: the plate is pinned at its summit, so the settle scales around it and the rock stays below the line.
const SUMMIT = { x: 1075, y: 252 }; // in the Plate's 1920 x 1280 image
const PLATE = { k: 1.82, x: -55, y: 270, sink: 0.12 };

const HERO = 'hero-window2';
// Clip frame = f - WIN_AT + HERO_LEAD. The take's E2E spinner turns every 48 f; -7 puts the last frame on clip 168,
// one frame before rail-needs f0's spinner pose, so the rail Needs swaps in at its f0 carries on the same turn.
const HERO_LEAD = -7;
const WIN_SCALE = WIN_W / (CLIPS[HERO]?.w ?? 1310);
const WIN_X = (W - WIN_W) / 2;
const AX = WIN_X + AX_K * WIN_SCALE;
/** The climb's distance: CLIMB px/f from WIN_AT, easing to rest over CLIMB_EASE f that end on HOLD (velocity on a smoothstep). */
const climbAt = (f: number) => {
  const u = clamp((f - (HOLD - CLIMB_EASE)) / CLIMB_EASE);
  return CLIMB * (clamp(f, WIN_AT, HOLD - CLIMB_EASE) - WIN_AT + CLIMB_EASE * (u - u ** 3 + u ** 4 / 2));
};
/** The window's top in the layer: it glides up and climbs, and holds still in the layer from HOLD (the zoom alone moves it). */
const winYAt = (f: number) => {
  const g = Math.min(f, HOLD);
  return glide(g, WIN_AT, H + 40, WIN_Y, 0.935) - climbAt(g);
};
const pushAt = (f: number) => 1 + PUSH * f;
// Camera: a fall toward the sidebar's upper part, accelerating, cut at peak.
const camTAt = (f: number) => accel(f, CAM, 0, 1.075, 0.000514); // 0.93 on DUR-2, 1 on DUR-1: exits at 0.07/f
const fallAt = (f: number) => lmix(1, END_K / pushAt(DUR - 1), Math.min(1, camTAt(f)));
const liftAt = (f: number) => accel(f, OUT, 0, LIFT.k, LIFT.v0);
/** The layer's total scale: the push, then the fall on top of it. */
const camK = (f: number) => fallAt(f) * pushAt(f);
const K_HOLD = camK(HOLD);
const about = (x: number, y: number, k: number) => `translate(${x}px, ${y}px) scale(${k}) translate(${-x}px, ${-y}px)`;
/** The layer's transform at total scale k: about (AX, AY) until HOLD; from HOLD the same scale continues about ZOOM_P. */
const cameraFor = (f: number, k: number) => (f < HOLD ? about(AX, AY, k) : `${about(ZOOM_P.x, ZOOM_P.y, k / K_HOLD)} ${about(AX, AY, K_HOLD)}`);
// The sky falls slower than the window (parallax): the plate scales to SKY_END about ZOOM_P over the fall. Past the cut it
// keeps the ratio of the two speeds on the last frame (SKY_PAR, about 1/3), so its speed carries on across the cut too.
const SKY_END = 1.5;
const skyAt = (f: number) => lmix(1, SKY_END, Math.min(1, camTAt(f)));
const SKY_PAR = Math.log(skyAt(DUR - 1) / skyAt(DUR - 2)) / Math.log(camK(DUR - 1) / camK(DUR - 2));
/** The window clip's pose on screen from HOLD: scale, left x, top y. */
const zoomPose = (f: number) => {
  const z = camK(f) / K_HOLD;
  const x = AX + K_HOLD * (WIN_X - AX);
  const y = AY + K_HOLD * (winYAt(HOLD) - AY);
  return { s: WIN_SCALE * camK(f), x: ZOOM_P.x + z * (x - ZOOM_P.x), y: ZOOM_P.y + z * (y - ZOOM_P.y) };
};

// The line: a title card in the middle of the sky, over the ridge (its summit is at y ~415). It is
// placed for the push's scale at the middle of its read, so there its ink is centred on the frame
// and its middle sits at MID_Y; the push then carries it < 1 px/f. It is sized to MEASURE there, and
// never wider than the safe band at the largest scale it sees before it has gone (the scale only grows).
const K_MAX = pushAt(CLEARS) * fallAt(CLEARS);
const LO = AX + (SAFE.x - AX) / K_MAX; // the safe band in the layer's px around the pivot
const HI = AX + (W - SAFE.x - AX) / K_MAX;
const K_READ = pushAt((LAND + OUT) / 2);
const MID_Y = 300; // px on screen: the middle of the line's ink at the read
const MEASURE = 1475; // px on screen: the line's advance at the read (hero at heroTrack: 147.7 px in the layer, ~153.6 on screen at the read)

const PLAN: LinePlan = {
  units: [
    // Ink 1 on the pure white drop frame, struck at 620 (H 120, not the hit's 150: at 650 the r and e of
    // "rebuilt" merged into one ink shape on a full-res still of the strike frame), settling to 500.
    { words: [0, 2], at: STRIKE, mode: 'hit', H: 120 },
    // A decided strike in the dot's wake (crit7 #6, its fallback): ink 1 on its first frame, 620 settling to 500, the
    // same weight as the first unit. As a setup word (o0 0.8) it came in as a grey ramp (luma 51 to 8 over 6 f).
    { words: 3, at: INTERFACE, mode: 'hit', H: 120 },
  ],
  out: { at: OUT, kind: 'picture', clears: CLEARS },
  resolved: LAND, // it reads once the period has landed
};

// The line is set at heroTrack(size) (TEXT-SYSTEM.md, Rebuilt), never a looser track. Pairs whose ink
// meets (an arm or a stem against a crossbar or a bowl) each keep a minimum gap between their ink boxes,
// opened by a kern on the pair's second glyph alone (glyphLayout and Line take the same map). At
// heroTrack the r's arm touches the f's crossbar in "interface" (boxes -0.006 em, merged ink on a still),
// and r-e in "rebuilt" (boxes -0.037 em) keeps only 0.017 em of white at rest, which closes at the
// strike's weight. Ink is further apart than the boxes; these minimums measured 0.026 (rf), 0.026 (re)
// and 0.033 em (lt) of white on a full-res still of the hold (f640), and 1.8 px for r-e at the strike (f560).
const MIN_GAPS: Record<string, number> = { rf: 0.019, re: -0.029, lt: 0.015 }; // em, between ink boxes
const PAIRS = Object.keys(MIN_GAPS);
const pairGap = (L: GlyphLayout, pair: string) => {
  const i = L.text.indexOf(pair);
  const a = L.glyphs.find((g) => g.i === i);
  const z = L.glyphs.find((g) => g.i === i + 1);
  if (i < 0 || !a || !z) throw new Error(`Rebuilt: no "${pair}" in "${L.text}"`);
  return (z.x + z.inkL - (a.x + a.inkR)) / L.size;
};
type Setting = { track: number; kern: Record<number, number> };
/** heroTrack at `size`, and the kerns (em, on the pair's second glyph) that open each tight pair to its minimum. */
const setAt = (size: number): Setting => {
  const track = trackOf(ROLE, size);
  const L = glyphLayout(TEXT, size, TYPE[ROLE].weight, track);
  const kern: Record<number, number> = {};
  for (const p of PAIRS) {
    const need = MIN_GAPS[p] - pairGap(L, p);
    if (need > 0) kern[TEXT.indexOf(p) + 1] = Math.ceil(need * 1e4) / 1e4;
  }
  return { track, kern };
};

const lineLayout = () => {
  const t = TYPE[ROLE];
  const cx = AX + (W / 2 - AX) / K_READ; // the layer x the push carries to the frame's centre at the read
  const band = 2 * Math.min(cx - LO, HI - cx) - 8; // 8 px: the period's ink runs past the advance
  // Sized to MEASURE on screen at the read and inside the safe band (fitLine's maths, with the kerns).
  const fit = ({ track, kern }: Setting) => Math.min(t.size * U, (Math.min(MEASURE / K_READ, band) / glyphLayout(TEXT, 100, t.weight, track, undefined, kern).width) * 100);
  let size = t.size * U;
  for (let i = 0; i < 6; i++) size = fit(setAt(size));
  const { track, kern } = setAt(size);
  // The full sentence as the DOM sets it, kerning and tracking included: the period's seat is its last glyph.
  const full = glyphLayout(TEXT, size, t.weight, track, undefined, kern);
  for (const p of PAIRS) if (pairGap(full, p) < MIN_GAPS[p] - 1e-4) throw new Error(`Rebuilt: the pair "${p}" is under its gap`);
  const first = full.glyphs[0];
  const stop = full.glyphs[full.glyphs.length - 1];
  const left = cx - (first.inkL + stop.x + stop.inkR) / 2; // the sentence's ink, period included, centred on cx
  const dot = inkBox('.', size, t.weight);
  const ascent = inkBox(BODY, size, t.weight).ascent;
  const base = AY + (MID_Y - AY) / K_READ + ascent / 2;
  const seat = { x: left + stop.x + (stop.inkL + stop.inkR) / 2, y: base - (dot.ascent - dot.descent) / 2, r: (dot.ascent + dot.descent + dot.right - dot.left) / 4 };
  // The lift must have taken the whole line (its ink bottom is the baseline: no descenders) above the
  // frame top on every sub-sample that rounds to CLEARS, or Line would drop a visible line.
  const bottom = (f: number) => AY + (base + Math.max(dot.descent, 0) - liftAt(f) - AY) * pushAt(f) * fallAt(f);
  if (bottom(CLEARS - 0.5) > -2) throw new Error(`Rebuilt: the lifted line is still in frame at f${CLEARS - 0.5} (ink bottom ${bottom(CLEARS - 0.5).toFixed(1)} px)`);
  // House rule 1(b): the frame's top edge cuts the ink band (ascenders to baseline) on 2 frames at most, each at 40 px/f or more.
  const top = (f: number) => AY + (base - ascent - liftAt(f) - AY) * pushAt(f) * fallAt(f);
  const cut: { fr: number; v: number }[] = [];
  for (let fr = OUT; fr < CLEARS; fr++) if (top(fr) < 0 && bottom(fr) > 0) cut.push({ fr, v: bottom(fr - 1) - bottom(fr) });
  if (cut.length > 2 || cut.some((c) => c.v < 40)) throw new Error(`Rebuilt: the lift cuts the line on ${cut.map((c) => `f${c.fr} at ${c.v.toFixed(1)} px/f`).join(', ')}`);
  const L = { size, track, kern, left, base, seat };
  // While "interface" is drawn and the dot is in flight, the dot's bottom stays at least one diameter over the
  // ascenders (so it never reads as an accent or an apostrophe), except on one frame of the fall, entered at
  // 40 px/f or more. The land (LAND) is the seat itself.
  const clear = (fr: number) => {
    const d = dotAt(fr, L);
    return base - ascent - (d.y + d.r) - 2 * d.r;
  };
  const low: string[] = [];
  for (let fr = INTERFACE; fr < LAND; fr++) {
    if (clear(fr) >= 0) continue;
    const v = dotAt(fr, L).y - dotAt(fr - 1, L).y;
    low.push(`f${fr} (${clear(fr).toFixed(1)} px, ${v.toFixed(1)} px/f)`);
    if (fr < LAND - 1 || v < 40) throw new Error(`Rebuilt: the dot is within a diameter of the ascenders at f${fr} (${clear(fr).toFixed(1)} px) at ${v.toFixed(1)} px/f`);
  }
  if (low.length > 1) throw new Error(`Rebuilt: the dot is in the line's row on ${low.join(', ')}`);
  return L;
};

type Layout = Setting & { size: number; left: number; base: number; seat: { x: number; y: number; r: number } };

// The dot: thrown from frame centre in one arc. It crosses the line's row early, passes high over
// "interface" (which strikes in its wake), hangs at the top of the arc and drops into the period's
// seat on E.in squared: contact is on LAND at speed, and the squash peaks the frame after. It leaves with the line.
const dotAt = (f: number, { size, seat }: Layout) => {
  const go = prog(f, 0, 30, E.glide); // the dot's shrink to the period's size
  const across = prog(f, 0, ACROSS, E.type);
  const apexY = seat.y - APEX_EM * size;
  const y = f < APEX_F ? mix(ECLIPSE_END.y, apexY, prog(f, 0, APEX_F, E.type)) : mix(apexY, seat.y, Math.pow(prog(f, APEX_F, LAND, E.in), FALL_P));
  return { x: mix(ECLIPSE_END.x, seat.x, across), y, r: mix(ECLIPSE_END.r, seat.r, go), sq: f >= LAND ? squash(f - LAND) : { along: 1, across: 1 } };
};

export const REBUILT = { winAt: WIN_AT, cam: CAM };
/** The line's local frames, for COPY 'rebuilt': struck on the drop, it reads once the period has landed, and lifts out. */
export const REBUILT_LINE = { in: STRIKE, resolved: LAND, out: OUT, clears: CLEARS };
/** Last frame's pose of the hero-window clip on screen: scale, left edge x, top edge y. Needs opens from it. */
export const REBUILT_END = {
  id: HERO,
  clipF: DUR - 1 - WIN_AT + HERO_LEAD, // the clip frame on the last frame: Needs carries on from clipF + 1
  ...zoomPose(DUR - 1), // s = END_K * WIN_SCALE
};
/** The zoom's start for Needs' check: the clip's pose on HOLD (abs 760), from which the picture only scales about ZOOM_P. */
export const REBUILT_HOLD = zoomPose(HOLD);

const FOG_BACK = { amt: 0.85, y: 0.62, tint: hex(C.white), scale: 1.1, seed: 3.1 };
const FOG_FRONT = { amt: 0.42, y: -0.16, tint: hex(C.white), scale: 1.4, seed: 7.7 };
const WIN_H = (CLIPS[HERO]?.h ?? 818) * WIN_SCALE;

/** The sky: the ridge plate (scaled `zoom` about ZOOM_P: the fall's parallax) and the back fog. `t` carries the fog's clock past the act. */
const Sky: React.FC<{ f: number; zoom: number; t?: number }> = ({ f, zoom, t }) => {
  const plateK = lmix(1.1, 1.0, decay(f, 0, 0.985)) + 0.00008 * f;
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: `${ZOOM_P.x}px ${ZOOM_P.y}px`, transform: `scale(${zoom})` }}>
        <Plate name="fogpeak" k={PLATE.k * plateK} x={PLATE.x} y={PLATE.y + f * PLATE.sink} origin={`${SUMMIT.x}px ${SUMMIT.y}px`} filter="saturate(.5) brightness(1.2) contrast(1.02)" />
      </div>
      <Shader frag={FOG} transparent uniforms={t === undefined ? FOG_BACK : { ...FOG_BACK, t }} />
    </>
  );
};

/** The real window in the layer, its top at `y`, showing clip frame `clipF`. */
const Window: React.FC<{ y: number; clipF: number }> = ({ y, clipF }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, borderRadius: 20, boxShadow: '0 -12px 48px rgba(0,0,0,.3)', transform: `translate(${WIN_X}px, ${y}px)` }}>
    <Win w={WIN_W} h={WIN_H} r={20} shadow={1.1}>
      {CLIPS[HERO] && <Clip id={HERO} frame={clipF} style={{ transformOrigin: '0 0', transform: `scale(${WIN_SCALE})` }} />}
    </Win>
  </div>
);

/**
 * Rebuilt's picture carried past its last frame, for Needs' first frames. The zoom about ZOOM_P keeps the window's
 * left edge in frame until about abs 857, so the sky beside it, the window's shadow and its edge go on across the cut
 * instead of turning to Needs' black. `zoom` is the window's scale over Rebuilt's last frame (Needs' s / S0); `f` is
 * the frame on Rebuilt's clock (DUR + Needs' f).
 */
export const RebuiltCarry: React.FC<{ f: number; zoom: number; clipF: number }> = ({ f, zoom, clipF }) => (
  <div style={{ position: 'absolute', inset: 0, background: C.white, overflow: 'hidden' }}>
    <Sky f={f} zoom={SKY_END * Math.pow(zoom, SKY_PAR)} t={f / 60} />
    <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: cameraFor(f, END_K * zoom) }}>
      <Window y={winYAt(HOLD)} clipF={clipF} />
    </div>
  </div>
);

export const Rebuilt: React.FC = () => {
  const f = useCurrentFrame();
  const line = useMemo(lineLayout, []);
  const dot = dotAt(f, line);
  const lift = liftAt(f);

  // White burning off: the plate comes up from behind it, fog holding the top of the frame.
  const white = Math.pow(0.955, f);
  // It never rests: after the arrival it keeps climbing over the word, the whole layer pushing in with it.
  const K = camK(f);

  return (
    <div style={{ position: 'absolute', inset: 0, background: C.white, overflow: 'hidden' }}>
      <Sky f={f} zoom={skyAt(f)} />
      {white > 0.003 && <div style={{ position: 'absolute', inset: 0, background: C.white, opacity: white }} />}

      <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: cameraFor(f, K) }}>
        {/* The line and its period: one block, so the lift takes them out together (HANDOFF c). */}
        {fd(f) < CLEARS && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transform: lift > 0 ? `translateY(${(-lift).toFixed(3)}px)` : undefined }}>
            <Line id="rebuilt" text={BODY} f={f} size={line.size} role={ROLE} track={line.track} kern={line.kern} color={C.ink} stage="light" align="left" anchor={{ x: line.left, y: line.base, v: 'baseline' }} plan={PLAN} zoom={K} />
            <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
              <ellipse cx={dot.x} cy={dot.y + (1 - dot.sq.along) * dot.r} rx={dot.r * dot.sq.across} ry={dot.r * dot.sq.along} fill={C.ink} />
            </svg>
          </div>
        )}

        {/* The real window, gliding up through the fog under the line. */}
        {f >= WIN_AT && <Window y={winYAt(f)} clipF={f - WIN_AT + HERO_LEAD} />}
      </div>

      <Shader frag={FOG} transparent uniforms={FOG_FRONT} />
    </div>
  );
};
