import React, { useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import { C, TYPE } from '../brand/tokens';
import { DOT, MARK_VIEW } from '../brand/markPaths';
import { fitLine, Line, LinePlan, lineTimes } from '../fx/Line';
import { Mark3D } from '../fx/Mark3D';
import { accel, decay, E, lmix, mix, prog } from '../lib/anim';
import { baselineOf, inkBox } from '../lib/measure';
import { ACT, copy, CUE, H, W } from '../timeline';
import { WALL_END } from './Wall';

// The last act. It opens on the wall's last frame: the dot, r 22, at (960, 660), on void. The dot stays where it
// landed, lets its last bit of inward momentum die, and thickens into glass; the stem halves grow up out of it
// and the roof drops onto them, so the mark builds around the dot, centred, a third of the frame tall. A band of
// spectral light passes through the glass. Then the mark shrinks and steps left into a modest lockup (the mark
// about 1.3x the name's cap height). The name rides in on the mark's follow-through, whole from its first frame,
// held a lockup gap off the mark's right edge, its ink resolving before its position (TEXT-SYSTEM.md HANDOFF e).
// One line cuts in centred under the pair on the next beat. From STILL on nothing moves: the card holds still and
// clean to the last frame.
const ABS = ACT.lockup.from; // the act's first frame: the text plans are absolute, Line runs them from the local clock
const ROOF = CUE.roof - ABS; // 44 f: the roof lands (contact shows 2-3 f earlier)
const WINGS = 12; // f: stem and wings grow out of the dot
const ASIDE = 80; // f: the mark starts to shrink and step left
const NAME = 112; // f, b(37) since r8: the name is drawn, riding the mark's edge (2.8 px/f there, 0.04 by 136)
const LINE = 140; // f, b(37,1) since r8: the one line cuts in, whole, and settles onto STILL
const STILL = 152; // f: every pose is frozen from here: the card holds still for the last 100 f
export const LOCKUP = { wings: WINGS, roof: ROOF, aside: ASIDE, name: NAME, line: LINE, still: STILL };

// The copy (absolute frames). Both lines resolve as one unit: every glyph runs the same clock (lag 0, ripple 0),
// so no part of a line is ever brighter or heavier than another (a per-glyph lag reads as a left-to-right wipe:
// "Taste" lit before "Code"). r8 (crit7 #11, option A): both lines strike decided on their first frame, never a grey
// fade. wordmark: one word struck on b(37) = 4032, ink 0.9 on its first frame (1 - 0.1·0.72^t: 0.96 by 4035),
// weight 560 -> 500 at k 0.85 (the settle as before), no close-up and no spread: the edge ride is its only x motion.
// read 8 keeps COPY wordmark resolved on 4040 (by then the ink has long resolved; the name is still by about 4056).
// platforms: all eight words cut in on b(37,1) = 4060 at ink 0.8 -> 1, weight 530 -> 450, one envelope clamped by
// STILL (4072), so it rests exactly there and the card is pixel-still from STILL. No glyph spread: all eight words
// strike together, so it can only push into the 7.6 px word spaces.
const WORDMARK_PLAN: LinePlan = {
  units: [{ words: 0, at: ABS + NAME, mode: 'setup', o0: 0.9, H: 60, k: 0.85, close: 0, spread: 0, lag: 0, read: 8 }],
};
const PLATFORMS_WORDS = copy('platforms').text.split(' ').length; // 8
const PLATFORMS_PLAN: LinePlan = {
  units: [{ words: [0, PLATFORMS_WORDS - 1], at: ABS + LINE, mode: 'cut', o0: 0.8, H: 80, close: 0, spread: 0, lag: 0, ripple: 0, by: ABS + STILL, read: 10 }],
};
export const LOCKUP_LINE = {
  wordmark: lineTimes(WORDMARK_PLAN, copy('wordmark').text.split(' ').length),
  platforms: lineTimes(PLATFORMS_PLAN, PLATFORMS_WORDS),
};

const PX = 1080 / (2 * 26 * Math.tan((12 * Math.PI) / 180)); // world units at z=0 to screen px (Mark3D's camera)
const UNIT = MARK_VIEW.h / 10; // icon units per mark unit (10 mark units = the icon's height)
/** Mark-space y of the mark's dot centre, in mark units, y up from the mark's own centre. */
const DOT_Y = (75 - DOT.y) / UNIT;
const DOT_R = DOT.r / UNIT;
// The mark's ink in icon units: roof apex y 3.9 to the dot's foot 144.6, x 11.4 to 138.4.
const INK_H = (144.6 - 3.9) / MARK_VIEW.h; // ink height, in mark heights
const INK_W = (138.4 - 11.4) / MARK_VIEW.h;
const INK_CY = (75 - (3.9 + 144.6) / 2) / UNIT; // ink centre above the mark's origin, in mark units

// The hero size: the mark's dot sits exactly where the wall left the dot, and the mark is then centred on the
// frame (351 px of ink, 32% of the frame height).
const X0 = (WALL_END.x - W / 2) / PX;
const HERO = (10 * (WALL_END.y - H / 2)) / PX / -DOT_Y;
const END_YAW = -0.16;

const NAME_TEXT = copy('wordmark').text;
const NAME_SIZE = 96; // px, the display role at lockup size
const NAME_LETTERS = NAME_TEXT.length;

export const Lockup: React.FC = () => {
  const f = useCurrentFrame();
  const g = Math.min(f, STILL); // the clock every pose reads: it stops at STILL

  // The end card, from the real font: the mark 1.3x the name's cap height, a gap of half a cap, the pair centred
  // on the frame's width; mark, name and line sit as one block on the frame's centre.
  const lay = useMemo(() => {
    const wt = TYPE.display.weight;
    const ink = inkBox(NAME_TEXT, NAME_SIZE, wt);
    const cap = inkBox('T', NAME_SIZE, wt).ascent;
    const nameInkW = ink.right + (NAME_LETTERS - 1) * TYPE.display.track * NAME_SIZE - ink.left; // canvas ink has no tracking
    const markH = 1.3 * cap;
    const scale = markH / (INK_H * PX);
    const markW = INK_W * scale * PX;
    const gap = 0.5 * cap;
    const left = W / 2 - (markW + gap + nameInkW) / 2;
    const markCx = left + markW / 2;
    const nameInkLeft = left + markW + gap;
    const line = copy('platforms').text;
    const lineSize = fitLine(line, 'secondary');
    const lineInk = inkBox(line, lineSize, TYPE.secondary.weight);
    const gapV = 0.85 * cap; // mark foot to the line's ink top
    const height = markH + gapV + lineInk.ascent;
    const capMid = H / 2 - height / 2 + markH / 2;
    const base = capMid + cap / 2; // the name's baseline
    const lineInkTop = capMid + markH / 2 + gapV;
    return {
      scale,
      gap,
      x: (markCx - W / 2) / PX,
      y: (H / 2 - capMid) / PX - (INK_CY * scale) / 10,
      nameInkLeft,
      nameX: nameInkLeft - ink.left,
      nameTop: base - baselineOf(NAME_SIZE, wt, TYPE.display.lead),
      line,
      lineSize,
      lineTop: lineInkTop + lineInk.ascent - baselineOf(lineSize, TYPE.secondary.weight, TYPE.secondary.lead),
    };
  }, []);

  // One move from the hero to the lockup: position leads, size joins 2 f later, both end at rest.
  const pPos = prog(g, ASIDE, ASIDE + 56, E.pan);
  const pSize = prog(g, ASIDE + 2, ASIDE + 60, E.pan);
  const scale = lmix(HERO, lay.scale, pSize);
  const x = mix(X0, lay.x, pPos);
  const y = mix(0, lay.y, pPos);
  const yaw = mix(-0.92, END_YAW, decay(g, 0, 0.972));
  const pitch = 0.07 * (1 - decay(g, 0, 0.97)) + 0.05;
  const light = -0.03 - 0.085 * Math.pow(0.982, g); // the strip passes, and the rig settles where the mark reads brightest

  const wingsT = decay(g, WINGS, 0.9);
  const roofFall = g < ROOF ? accel(g, ROOF - 24, 0, 1.17, 0.02) : 3.2; // a roof that accelerates into contact
  const roofY = 3.2 - Math.min(3.2, roofFall);
  const roofIn = prog(g, ROOF - 24, ROOF - 12, E.smooth);
  const land = g >= ROOF ? Math.exp(-(g - ROOF) / 7) * 0.05 : 0;

  // The dot: the wall's implosion still carries it inward for a few frames (22 -> about 20.5), then it thickens
  // into the glass dot's size. The glass dot grows under the white one, hidden until it is whole.
  const solidR = DOT_R * (scale / 10) * PX;
  const settle = WALL_END.r - 2 * decay(f, 0, 0.82);
  const dotR = lmix(settle, solidR, prog(f, 4, 28, E.push));
  const tuck = mix(0.86, 1, prog(f, 24, 40, E.smooth)); // the glass stays a little inside the white disc until it hands over
  const dotS = (dotR * tuck) / solidR;

  // Spectral light inside the glass: one pale band crosses the object as the roof lands and leaves a faint trace.
  const bandAt = mix(-7.5, 1.1, decay(g, ROOF - 30, 0.955)) + yaw * 2.7;
  const bandAmount = prog(g, ROOF - 30, ROOF - 6, E.smooth) * mix(0.92, 0.26, decay(g, ROOF + 40, 0.97));

  const pose = useMemo(
    () => ({
      yaw,
      pitch,
      roll: -0.012,
      scale,
      x,
      y,
      light,
      dispersion: 10,
      exposure: 0.95,
      spectrum: { amount: bandAmount, at: bandAt },
      parts: {
        dot: { s: dotS, y: DOT_Y * (1 - dotS), z: 0 },
        // The stem halves grow out of the dot's centre (behind the white disc), never from under its foot.
        left: { s: wingsT, x: 0, y: mix(DOT_Y, 0, wingsT) }, // lint-ok: the mark's left wing in three.js, not a CSS offset
        right: { s: wingsT, x: 0, y: mix(DOT_Y, 0, wingsT) }, // lint-ok: the mark's right wing in three.js, not a CSS offset
        roof: { s: roofIn, y: roofY - land, z: 0 },
      },
    }),
    [yaw, pitch, scale, x, y, light, wingsT, roofIn, roofY, land, dotS, bandAmount, bandAt],
  );

  // The white dot the wall left: it covers the glass dot while that grows, and hands over as the roof lands.
  const screenDotX = W / 2 + x * PX;
  const screenDotY = H / 2 - (y + (DOT_Y * scale) / 10) * PX;
  const solid = 1 - prog(f, 30, 44, E.smooth);

  // The name rides the mark's edge: its ink left sits a lockup gap off the mark's right ink edge (from this pose,
  // read on g) until the mark has stepped clear of the name's rest, then it is at rest. Measured on the real
  // layout (preview 6, the same local frames): the edge moves 2.8 px/f on NAME (b(37) = 4032; the name 27 px right of
  // rest), 0.7 px/f by NAME + 14 and still by NAME + 28; the rendered mark's ink edge tracks this one within 1 px, so
  // the gap never changes and the two never touch.
  const markRight = W / 2 + x * PX + 0.5 * INK_W * scale * PX;
  const ride = Math.max(0, markRight + lay.gap - lay.nameInkLeft);

  return (
    <div style={{ position: 'absolute', inset: 0, background: C.void, overflow: 'hidden' }}>
      <Mark3D pose={pose} />
      {solid > 0.002 && (
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
          <circle cx={screenDotX} cy={screenDotY} r={Math.max(0, dotR)} fill={C.white} opacity={solid} />
        </svg>
      )}
      <Line
        id="wordmark"
        text={NAME_TEXT}
        f={g}
        offset={ABS}
        size={NAME_SIZE}
        role="display"
        color={C.white}
        anchor={{ x: lay.nameX, y: lay.nameTop }}
        plan={WORDMARK_PLAN}
        wrap={() => (ride > 0.0005 ? `translateX(${ride.toFixed(3)}px)` : undefined)}
      />
      <Line id="platforms" text={lay.line} f={g} offset={ABS} size={lay.lineSize} role="secondary" color={C.mist} align="center" anchor={{ x: W / 2, y: lay.lineTop }} plan={PLATFORMS_PLAN} />
    </div>
  );
};
