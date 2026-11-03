// cinetic:brand-supplied the app's needs-you yellow on the row's dot, the caption and the flood
import React, { useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import { C, SAFE } from '../brand/tokens';
import { BigCursor, Clip, cursorMove, ProxyClip } from '../fx/kit';
import { fitLine, Line, lineGeometry, LinePlan, lineTimes, ritard } from '../fx/Line';
import { Shader } from '../fx/Shader';
import { accel, E, fd, glide, hitPulse, lmix, mix, prog } from '../lib/anim';
import { inkBox } from '../lib/measure';
import { FOG, hex } from '../style/shaders';
import { ACT, b, copy, CUE, H, W } from '../timeline';
import { REBUILT_END, REBUILT_HOLD, RebuiltCarry, ZOOM_P } from './Rebuilt';
import type { Sound } from './Sound';

// The fall from Rebuilt carries on in the same picture, one zoom about Rebuilt's ZOOM_P, until the rail
// fills the frame: it lands fast then slow on its framing and never pans to get there. The real band
// pops (its dot stays the footage's own, never scaled or redrawn); the heavy cursor comes up from where it was parked and lands on the row's dot, and the row lifts
// where it is (crit8): it never travels. The rail behind it goes soft and dark and recedes in one eased
// scale about the row's dot, so nothing in the picture moves sideways, and from 961 the whole picture is
// still under the caption. The rail's own status dots stay in the footage, under the same blur and dim
// as their rows. The press sets off the flood out of the dot under the cursor's tip.
const ID = 'rail-needs';
const HERO = REBUILT_END.id; // hero-window2: no band, the rail in rail-needs f0's state
const DUR = ACT.needs.dur;
const BAND = CUE.band - ACT.needs.from; // clip f54 lands here
const HOVER = 87; // f: clip f150, the row's real hover fades up as the cursor comes in
const GRAB = 91; // f: the cursor is on the dot
const LINE = copy('needs').text;
const CAPTION = { x: SAFE.x, y: 928 }; // the caption anchor: left x 96, top of the line box at y 928
const PRESS = 186; // f: the pointer squeezes (bottom at f189, the 16th)
const FLOOD = 196; // f: the beat, 8 f after the dip has come back
// Below SEAM_Y (under Move forms) hero-window2 and rail-needs f0 are the same rail, spinner turn included,
// so the rail's own footage shows there from f0. Above it the only difference is Move forms' selected
// highlight in rail-needs, so the hero keeps that strip until the band replaces it: nothing changes on its own.
const SWAP = BAND; // f: the rail's own footage takes over the strip above SEAM_Y from the hero
const SEAM_Y = 172;

// All of these are the clip's CSS px, measured off the PNGs.
const SHIFT = 57.04; // what the band pushes the rail down by
const LOWER = 170; // first line of the band frame below the row
const ROW = { x: 9.83, y: 139.2, w: 232, h: 27.8, r: 6.5 };
const DOT = { x: 23.95, y: 152.97, r: 2.93 };
// hero-window2 against rail-needs: the title bar's 34 px (rail-needs is the window cropped from y 34).
// Neither has a band, so this lines up every row of the rail (measured: best match at 0 css px off).
const HERO_DY = 34;

// Rebuilt's last frame, from its own transforms.
const S0 = REBUILT_END.s;
const X0 = REBUILT_END.x;
const Y0 = REBUILT_END.y + HERO_DY * S0; // the rail's top on screen
// The framing the zoom lands on at GRAB: scale preS(GRAB) (8.06), the rail's left edge at X1, rail y T_LAND at the frame top.
const S1 = 8; // full-bleed macro
const X1 = -18;
const T1 = 105; // the real "Needs you" heading clears the 64 px top margin until GRAB
// The rail's css y at the frame top on GRAB: T1 plus 9.1 (a creep that is gone now; ZOOM_P in Rebuilt.tsx is solved for this framing).
const T_LAND = T1 + 0.1 * GRAB;
// From GRAB the rail recedes behind the lifted row: one scale about the row's dot to S2, zero-slope start, at rest on
// GRAB + SINK (961). No scroll and no sideways term, so the picture holds still under the caption.
const S2 = 7.55;
const SINK = 30;
// The held row comes up LIFT about its own dot and stays there: "atlas-web" keeps about 30 px clear of the right edge.
const LIFT = 0.015;
const RACK = 0.72;

const PARK = { x: 1440, y: 1180 }; // fully below the frame until it moves
const CURSOR_SIZE = 212;
const TIP = { x: DOT.x + 3.6, y: DOT.y + 3.6 }; // just off the dot's lower right: the dot stays whole
const CURSOR_OUT = FLOOD - 6; // f: straight after the press it clears the dot, accelerating, ahead of the flood

const FOG_FRONT = { amt: 0.42, y: -0.16, tint: hex(C.white), scale: 1.4, seed: 7.7 }; // Rebuilt's front bank

/** Clip frame. f60-150 are pixel-identical, so the jump to the real hover shows nothing but the hover. */
const clipFrame = (f: number) => {
  const n = fd(f);
  if (n < BAND) return Math.floor((n * 54) / BAND);
  if (n < HOVER) return 54 + n - BAND;
  if (n < HOVER + 14) return 150 + n - HOVER;
  return 164 + ((n - HOVER - 14) * 24) / (DUR - HOVER - 14); // the pointer leaves the row at f190: never gets there
};

/** The fall: fast and short on top of slow and long, so it never quite lands. Opens one step on from Rebuilt's last pose. */
const fall = (f: number) => 0.85 * (1 - Math.pow(0.84, f + 1)) + 0.15 * (1 - Math.pow(0.965, f + 1));
/** The zoom's scale: its first step (839 -> 840) is Rebuilt's last (x1.088), then it lands fast then slow. */
const preS = (f: number) => lmix(S0, S1, fall(f)) * (1 + 0.00012 * f);

// Until GRAB the rail's pose is that scale about ZOOM_P and nothing else: no x or y curve of its own, so the
// content under ZOOM_P holds still from Rebuilt's HOLD (abs 760) to GRAB and the rail's left edge only moves outward.
// ZOOM_P is the fixed point between Rebuilt's pose on HOLD and the framing at GRAB; solved here, it must match.
const S_LAND = preS(GRAB);
const fixedPoint = (a0: number, s0: number, a1: number) => (a1 * s0 - a0 * S_LAND) / (s0 - S_LAND);
const SOLVED = { x: fixedPoint(REBUILT_HOLD.x, REBUILT_HOLD.s, X1), y: fixedPoint(REBUILT_HOLD.y + HERO_DY * REBUILT_HOLD.s, REBUILT_HOLD.s, -T_LAND * S_LAND) };
if (Math.hypot(SOLVED.x - ZOOM_P.x, SOLVED.y - ZOOM_P.y) > 0.02) throw new Error(`Needs: the zoom's fixed point is now (${SOLVED.x.toFixed(2)}, ${SOLVED.y.toFixed(2)}); set ZOOM_P in Rebuilt.tsx to it`);
const zoomX = (f: number) => ZOOM_P.x + ((X0 - ZOOM_P.x) * preS(f)) / S0;
const zoomY = (f: number) => ZOOM_P.y + ((Y0 - ZOOM_P.y) * preS(f)) / S0;
// The window's left edge is still in frame on the first frames (x 79 on f0): until it and the window's hairline (1 px
// of Rebuilt's layer, under one clip px, so under s px on screen) have left the frame, Rebuilt's sky and window go on
// under the rail (RebuiltCarry). f28 (abs 868).
const CARRY_END = (() => {
  let n = 0;
  while (n < GRAB && zoomX(n) + preS(n) > -1) n++;
  return n;
})();

// The row's dot on screen where the zoom lands it on GRAB. From GRAB the row is held here and the rail scales about it.
const ANCHOR = { x: zoomX(GRAB) + S_LAND * DOT.x, y: zoomY(GRAB) + S_LAND * DOT.y };
const RS = S_LAND * (1 + LIFT); // the held row's scale once it has come up

/** The rail's recede: 0 on GRAB (and before), 1 from GRAB + SINK. Zero slope at both ends, so it hands over from the landed zoom with no step. */
const sink = (f: number) => prog(f, GRAB, GRAB + SINK, E.rest);

// Until GRAB: the zoom about ZOOM_P. From GRAB: a pure scale about ANCHOR (the row's dot), continuous on GRAB, still from GRAB + SINK.
const railS = (f: number) => lmix(preS(f), S2, sink(f));
const railX = (f: number) => (f < GRAB ? zoomX(f) : ANCHOR.x - railS(f) * DOT.x);
const railY = (f: number) => (f < GRAB ? zoomY(f) : ANCHOR.y - railS(f) * DOT.y);

/** The row's dot on screen and its scale. The row is hung from its dot, lifts in place (scale only) and dips on the press. */
const rowPose = (f: number) => ({
  x: ANCHOR.x,
  y: ANCHOR.y,
  rs: S_LAND * (1 + LIFT * prog(f, GRAB, GRAB + 20, E.outSoft)) * (1 - 0.03 * hitPulse(f - PRESS, 3, 3)),
});

/** A row-space point on screen under the row's pose. */
const onRow = (p: ReturnType<typeof rowPose>, cx: number, cy: number) => ({ x: p.x + (cx - DOT.x) * p.rs, y: p.y + (cy - DOT.y) * p.rs });

// The push into the flood about the dot: the same accelerating curve from FLOOD, scaled so it ends on DUR - 2 (the last
// frame before the full accent) with "atlas-web" still whole: its right ink is ATLAS_R css right of the dot (measured
// x 1889 on the 1000 still), and it stays 6 px inside the frame. No word of the row is ever cut by the frame edge.
const ATLAS_R = 209.5;
const PUSH_K = 1.085;
const PUSH_END = (W - 6 - ANCHOR.x) / (ATLAS_R * RS);
const PUSH_V0 = ((PUSH_END - 1) * (PUSH_K - 1)) / (Math.pow(PUSH_K, DUR - 2 - FLOOD) - 1);
const pushAt = (f: number) => 1 + accel(f, FLOOD, 0, PUSH_K, PUSH_V0);

/** The flood's radius at f for the row's scale rs: the dot's own disc, equal ratios per frame from FLOOD, past the far corner on the last frame. */
const CORNER = Math.hypot(W - ANCHOR.x, H - ANCHOR.y);
const floodRadius = (rs: number, f: number) => DOT.r * rs * Math.exp((Math.log((CORNER * 1.04) / (DOT.r * RS)) / (DUR - 1 - FLOOD)) * Math.max(0, f - FLOOD));

// The caption (TEXT-SYSTEM.md, Needs.tsx): SET at the caption anchor, screen-fixed, in absolute frames (COPY's clock).
// See, which, chat strike 3 f apart from b(9,2) in caption setup amounts; "needs you." is one phrase unit BORN on
// the beat b(9,3), a 22 f ritardando. It is C.accent at ink 1 from its first frame and settles 650 -> 500: never a ramp
// from grey, so never olive. Dead still from there over a still picture (the rail is at rest from 961: no scroll while
// the line is up), until the yellow flood out of the dot under the cursor covers it (a picture exit: the
// line stays whole under the opaque disc and stops drawing once the disc has all of its ink).
const ABS = ACT.needs.from; // the act's first frame: the plan is absolute, Line runs it from the local frame
const POPS = ritard(b(9, 2), [3, 3]); // See 952, which 955, chat 958 (local 112, 115, 118)
const BORN = b(9, 3); // 980 (local 140), on the beat
// f per glyph for the born unit's settle (SET.lag is 0.6). "needs" and "you." strike together, so Line pivots
// "you." on its left edge: its spread then closes leftward with the close-up, and at 0.6 the two add to 3.4 px/f
// on "o", "u" and "." at full ink (981-983). At 1.1 each glyph's spread starts once the close-up has slowed, so no
// glyph of the phrase moves more than the close-up's own first step (3.0 px/f). Amounts are unchanged. Line's rule 3
// guard would now step those frames on its own, but 1.1 is the approved preview 5 settle, so it stays.
// See, which and chat are setup words at the dark stage's o0 0.85 (crit6 #5): they strike white-ish, and Line steps
// the catch-up close-ups of which and chat on fd (about 956-961). "needs you." is born at ink 1 either way.
const BORN_LAG = 1.1;
const OUT = 1056; // the flood's first contact with the caption's ink (measured by floodReach; Caption checks it)
const CLEARS = 1060; // the first frame the flood covers all of the caption's ink, every motion-blur sample included
const PLAN: LinePlan = {
  units: [...POPS.map((at, i) => ({ words: i, at, mode: 'setup' as const })), { words: [3, 4], at: BORN, mode: 'born', lag: BORN_LAG }],
  out: { at: OUT, kind: 'picture', clears: CLEARS },
};
export const NEEDS_LINE = lineTimes(PLAN, LINE.split(' ').length);

/**
 * When the flood reaches the caption, from the act's own maths: the first frame its disc touches any glyph's ink box
 * (contact), and the first frame whose disc half a frame earlier already covers every glyph (clears: the earliest
 * motion-blur sample is 1/3 f before the frame, so no sample ever shows the line missing outside the disc).
 */
const floodReach = (size: number) => {
  const geo = lineGeometry(LINE, size, { role: 'caption', anchor: { x: CAPTION.x, y: CAPTION.y } });
  const boxes = geo.layout.glyphs.map((g) => {
    const ink = inkBox(g.ch, size, geo.layout.weight);
    return { l: geo.left + g.x + g.inkL, r: geo.left + g.x + g.inkR, t: geo.baseline - ink.ascent, b: geo.baseline + ink.descent };
  });
  const near = (x: number, y: number) => Math.min(...boxes.map((q) => Math.hypot(Math.max(q.l - x, 0, x - q.r), Math.max(q.t - y, 0, y - q.b))));
  const far = (x: number, y: number) => Math.max(...boxes.map((q) => Math.hypot(Math.max(Math.abs(q.l - x), Math.abs(q.r - x)), Math.max(Math.abs(q.t - y), Math.abs(q.b - y)))));
  const covers = (f: number, d: (x: number, y: number) => number) => {
    const p = rowPose(f);
    return f >= FLOOD && floodRadius(p.rs, f) >= d(p.x, p.y);
  };
  let contact = DUR;
  let clears = DUR;
  for (let n = DUR - 1; n >= FLOOD; n--) {
    if (covers(n, near)) contact = n;
    if (covers(n - 0.5, far)) clears = n;
  }
  return { contact: ABS + contact, clears: ABS + clears };
};

const Caption: React.FC<{ f: number }> = ({ f }) => {
  const size = useMemo(() => {
    const s = fitLine(LINE, 'caption');
    const m = floodReach(s);
    if (m.contact !== OUT || m.clears !== CLEARS) throw new Error(`Needs caption: the flood now reaches the line on ${m.contact} and covers it on ${m.clears}; set OUT and CLEARS (and COPY needs.out) to match`);
    return s;
  }, []);
  // Its own layer at the frame's origin for the whole act. Without it the held caption re-rasterised on FLOOD + 1
  // (1037, the push's first non-identity scale) and stepped ~1 px sideways mid-hold (measured on the half-res sheets,
  // and already in preview 5); in its own layer it rasterises the same way on every frame.
  return (
    <div style={{ position: 'absolute', inset: 0, transform: 'translateZ(0)' }}>
      <Line id="needs" text={LINE} f={f} offset={ABS} size={size} role="caption" anchor={CAPTION} plan={PLAN} />
    </div>
  );
};

export const Needs: React.FC = () => {
  const f = useCurrentFrame();
  if (fd(f) >= DUR - 1) return <div style={{ position: 'absolute', inset: 0, background: C.accent }} />;

  const n = fd(f);
  const c = clipFrame(f);
  const s = railS(f);
  const ox = railX(f);
  const oy = railY(f);
  const row = rowPose(f);
  const gap = f < BAND ? 0 : 1 - Math.pow(0.76, f - BAND);
  const rack = prog(f, GRAB, GRAB + 26, E.outSoft);
  const lifted = n >= GRAB;

  // The flood: the dot's own disc, equal ratios per frame, so its edge is fastest on the last frame.
  const dotAt = lifted ? { x: row.x, y: row.y } : { x: ox + s * DOT.x, y: oy + s * DOT.y };
  const growing = f >= FLOOD;
  const floodR = floodRadius(row.rs, f);
  const push = pushAt(f);

  // The halo is light on the rail, neutral and within 40 px of the row: yellow at low alpha on near-black is olive.
  const lit = prog(f, GRAB, GRAB + 20, E.out);
  const halo = lit * (1 - 0.3 * prog(f, GRAB + 30, GRAB + 72, E.smooth) + 0.5 * prog(f, PRESS, FLOOD, E.outSoft));
  const rowW = ROW.w * row.rs;
  const rowH = ROW.h * row.rs;
  const haloAt = `translate(${row.x - (DOT.x - ROW.x) * row.rs}px, ${row.y - (DOT.y - ROW.y) * row.rs}px)`;

  // The cursor: parked half off the bottom, a short wind-up against its travel, then over onto the dot.
  const windUp = prog(f, BAND, BAND + 4, E.out);
  const park = { x: PARK.x - 0.08 * f + 30 * windUp, y: glide(f, 6, 1240, PARK.y, 0.9) - 0.1 * Math.max(0, f - 40) + 12 * windUp };
  const tip = onRow(row, TIP.x, TIP.y);
  const fly = cursorMove(f, park, lifted ? tip : { x: ox + s * TIP.x, y: oy + s * TIP.y }, BAND + 2, GRAB, E.fly, 0.14);
  const out = accel(f, CURSOR_OUT, 0, 1.13, 3);
  const cursor = lifted ? { x: tip.x + 0.86 * out, y: tip.y + 0.5 * out, bank: 0 } : f >= BAND + 2 ? fly : { x: park.x, y: park.y, bank: 0 };
  // iz1 R7: down to 0.6 from the tip in 3 f, back as the flood starts.
  const squeeze = prog(f, PRESS, PRESS + 3, E.linear) * (1 - prog(f, FLOOD - 3, FLOOD + 1, E.outSoft));


  return (
    <div style={{ position: 'absolute', inset: 0, background: C.void, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: `${dotAt.x}px ${dotAt.y}px`, transform: `scale(${push})` }}>
        {/* The same window Rebuilt was falling into: chat panel and all, until the rail has taken all of it. First with
            Rebuilt's sky, shadow and edge beside it, while the window's left edge is still in frame. */}
        {n < CARRY_END && <RebuiltCarry f={ACT.rebuilt.dur + f} zoom={s / S0} clipF={REBUILT_END.clipF + 1 + n} />}
        {n >= CARRY_END && n < SWAP && (
          <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${ox}px, ${oy - HERO_DY * s}px) scale(${s})` }}>
            <Clip id={HERO} frame={REBUILT_END.clipF + 1 + n} />
          </div>
        )}

        {/* The rail. Base clip, then the lower half sliding down over the band so the real layout opens rather than pops. */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: 256, height: 784, overflow: 'hidden', transformOrigin: '0 0', transform: `translate(${ox}px, ${oy}px) scale(${s})`, clipPath: n < SWAP ? `inset(${SEAM_Y}px 0 0 ${n < CARRY_END ? 1 : 0}px)` : undefined }}>
          <Clip id={ID} frame={c} />
          {n >= BAND && gap < 0.999 && (
            <div style={{ position: 'absolute', left: 0, top: 0, width: 262, height: 545, overflow: 'hidden', background: C.ink, transform: `translateY(${LOWER - SHIFT * (1 - gap)}px)` }}>
              <Clip id={ID} frame={c} style={{ transform: `translateY(${-LOWER}px)` }} />
            </div>
          )}
          {/* The band's dot is the footage's own, at its own size: the film no longer pops a scaled copy of it (NO DOTS). */}
          {/* Out of focus behind the row: a fixed blur faded in, never an animated one. */}
          {rack > 0 && <ProxyClip id={ID} frame={c} style={{ position: 'absolute', left: 0, top: 0, opacity: rack, filter: 'blur(1.1px)' }} />}
          {/* The slot the row came out of stays empty. Rounded like the row: the rail scales about the row's dot, so the slot always sits inside the row. */}
          {lifted && <div style={{ position: 'absolute', left: ROW.x, top: ROW.y, width: ROW.w, height: ROW.h, borderRadius: ROW.r, background: C.ink2 }} />}
          {/* Everything in the rail, its status dots included, stays under the one blur and dim: nothing is lifted out of it but the row. */}
          {rack > 0 && <div style={{ position: 'absolute', inset: 0, background: C.void, opacity: RACK * rack }} />}
        </div>

        {/* The lower left falls off into the stage, so the caption never sits on a rail row's text: fully dark past its last word (ink ends near x 1020). */}
        {rack > 0 && <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, background: `linear-gradient(to top, ${C.void} 0%, ${C.void} 13%, transparent 36%)`, maskImage: 'linear-gradient(to right, black 60%, transparent 82%)', opacity: 0.9 * rack }} />}

        {/* The halo falls on the rail, not on the row. */}
        {lifted && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: rowW, height: rowH, transformOrigin: '0 0', transform: haloAt }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: rowH / 3, background: C.white, opacity: 0.14 * halo, filter: 'blur(20px)', transform: 'scale(1, 1.04)' }} />
          </div>
        )}

        {/* The real row, hung from its dot. Its grey comes up against the rail; the dot keeps the true accent. */}
        {lifted && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: ROW.w,
              height: ROW.h,
              overflow: 'hidden',
              borderRadius: ROW.r,
              background: C.ink2,
              transformOrigin: '0 0',
              transform: `translate(${row.x}px, ${row.y}px) scale(${row.rs}) translate(${ROW.x - DOT.x}px, ${ROW.y - DOT.y}px)`,
            }}
          >
            <Clip id={ID} frame={c} style={{ transform: `translate(${-ROW.x}px, ${-ROW.y}px)`, filter: `brightness(${mix(1, 1.3, lit)})` }} />
            <div style={{ position: 'absolute', left: 0, top: 0, width: ROW.w, height: ROW.h, clipPath: `circle(${DOT.r + 0.2}px at ${DOT.x - ROW.x}px ${DOT.y - ROW.y}px)` }}>
              <Clip id={ID} frame={c} style={{ transform: `translate(${-ROW.x}px, ${-ROW.y}px)` }} />
            </div>
          </div>
        )}

        {n < 18 && (
          <div style={{ position: 'absolute', inset: 0, transformOrigin: `${ZOOM_P.x}px ${ZOOM_P.y}px`, opacity: 1 - prog(f, 8, 17, E.smooth), transform: `scale(${s / S0})` }}>
            <Shader frag={FOG} transparent uniforms={{ ...FOG_FRONT, t: (ACT.rebuilt.dur + f) / 60 }} />
          </div>
        )}

        <BigCursor x={cursor.x} y={cursor.y} size={CURSOR_SIZE * (1 - 0.4 * squeeze)} bank={cursor.bank} white />
      </div>

      {/* The caption stays out of the flood's push: it holds dead still in screen space and the flood covers it. */}
      <Caption f={f} />

      {growing && (
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
          <circle cx={dotAt.x} cy={dotAt.y} r={floodR} fill={C.accent} />
        </svg>
      )}
    </div>
  );
};

export const NEEDS_SOUND: Sound[] = [
  { f: BAND, kind: 'ping', weight: 1, pan: -0.5 },
  { f: GRAB, kind: 'slide', weight: 0.6, pan: -0.3 }, // the lift and the rail's recede
  { f: PRESS + 3, kind: 'press', weight: 0.9, pan: -0.3 },
  { f: DUR - 8, kind: 'swell', weight: 0.8, pan: -0.3 }, // end-aligned: builds through the dot's growth, then the drops' 7 f hole before the impact
  { f: DUR - 1, kind: 'impact', weight: 1 },
];
