import React, { useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import { C, TYPE } from '../brand/tokens';
import { fitLine, Line, LinePlan } from '../fx/Line';
import { accel, E, fd, lmix, mix, prog } from '../lib/anim';
import { baselineOf, inkBox } from '../lib/measure';
import { ACT, b, copy, H, W } from '../timeline';
import { ringAt } from './Hook';
import type { Sound } from './Sound';

// Act 2, the name card. It opens on the hook's ring, still closing, facing the camera with the dot at
// its centre. The ring tips back to its edge like a coin while it comes at the camera: its two halves
// close in on each other, the dot flattens between them, and on the 16th they are one hairline across
// the frame. The line opens like a shutter into a white band, and the name exists in it, whole and in
// ink, from the first frame the band clears its ink; the version is struck on the next beat. It holds
// while the band and the name push in. Then the band blinks shut on the name to the hairline, and on
// the next 16th it reopens with the film's dot, ink now, inside it. Then the band opens to the frame,
// slowly and then all at once: the last frame is white with the dot in it, on the pose the next act
// opens on. TEXT-SYSTEM.md, Eclipse: the band is the name's only mask (HANDOFF a).
const FROM = ACT.eclipse.from;
const DUR = ACT.eclipse.dur;
const SEAM = ACT.hook.dur; // ringAt counts hook frames, so the close carries on across the cut
const TEXT = copy('name').text; // "TasteCode v0.5"
const ROLE = 'display' as const;
const WEIGHT = TYPE[ROLE].weight;

const TURN = 35; // f, b(4,1,1): the ring is edge-on, one hairline across the frame
const GROW = 4.3; // the ring's scale once edge-on: its ends are off the frame from about 90% of the turn
const LINE = 2; // px: the hairline, and the stroke the ring thins to as it turns
const SHUTTER = 42; // f, b(4,1,2): the line's first open frame
const SHUT = 24; // f: the shutter's open, fastest on its first frame
const NAME_ON = 44; // f: the first frame the band clears the name's ink (+4 px); the act re-finds it from the real layout
const VERSION = b(4, 2) - FROM; // f 56: "v0.5" is struck on the beat
const OUT = b(5, 1, 1) - FROM; // f 147: the band starts closing on the name, on E.in
const BLINK = 7; // f: the close, so the band shuts on OUT + 7 (f154), with the ink whole on every frame before it
const HAIR = OUT + BLINK; // f 154: the hairline; the name is not drawn from here
const REOPEN = b(5, 1, 3) - FROM; // f 161: the band reopens, fastest on its first frame, with the dot inside it
// f 174 (abs 510): the reopen is back at the band's own height (the name's band, still pushing in), about
// 358 px at 1080 when the open starts on f 168 and 367 by f 174: half5's approved geometry (crit6 #12).
const REOPEN_TO = 174;
const OPEN = b(5, 2) - FROM; // f 168: the band starts opening to the frame; it reaches both edges on the last frame
const OPEN_K = 1.1; // per frame: the open's growth, so the white arrives at full speed on the cut
const BAND_EM = 0.9; // the band's half-height around the name's ink centre, in em
const CLEAR = 4; // px: the band clears the ink by this much before a glyph is drawn
const MEASURE = 1260; // px on screen: the name's advance as it lands
const PUSH = 0.0005; // per frame: the band and the name push in from the shutter on, about 0.35 px/f at the name's ends

/** The black dot the next act opens on. */
export const ECLIPSE_END = { x: W / 2, y: H / 2, r: 16 };

const pushAt = (f: number) => 1 + PUSH * Math.max(0, f - SHUTTER);

// The name: MEASURE wide as the version lands, never past the safe width at the biggest push it is seen
// at. Its line box sits so the ink's centre is the frame's (the push scales about that point).
const layout = () => {
  const t = TYPE[ROLE];
  const size = Math.min(fitLine(TEXT, ROLE, pushAt(VERSION), 400, MEASURE), fitLine(TEXT, ROLE, pushAt(HAIR), 400));
  const ink = inkBox(TEXT, size, WEIGHT);
  const mid = baselineOf(size, WEIGHT, t.lead) - (ink.ascent - ink.descent) / 2; // line top to ink centre
  return { size, y0: H / 2 - mid, half: BAND_EM * size, inkHalf: (ink.ascent + ink.descent) / 2 };
};
type Layout = ReturnType<typeof layout>;

// The band's half-height without the open to white: the hairline until the shutter, then open around
// the name and pushing in with it; shut on E.in from OUT; the hairline; reopened on E.out from REOPEN to
// the same band, so the open to white starts from the band the name stood in.
const holdAt = (L: Layout, f: number) => {
  if (f >= REOPEN - 1) return mix(LINE / 2, L.half * pushAt(f), prog(f, REOPEN - 1, REOPEN_TO, E.out));
  const open = mix(LINE / 2, L.half * pushAt(f), prog(f, SHUTTER - 1, SHUTTER - 1 + SHUT, E.out));
  return mix(open, LINE / 2, prog(f, OUT, HAIR, E.in));
};

// The open to white from OPEN, on the exit's curve: its edges cross the frame's exactly on the last frame.
const bandAt = (L: Layout, f: number) => {
  const need = H / 2 + 1 - holdAt(L, DUR - 1);
  const v0 = (need * (OPEN_K - 1)) / (Math.pow(OPEN_K, DUR - 1 - OPEN) - 1);
  return holdAt(L, f) + accel(f, OPEN, 0, OPEN_K, v0);
};

// The first frame from the shutter on where the band clears the whole ink box (at its push) by CLEAR.
const nameOn = (L: Layout) => {
  for (let f = SHUTTER; f < OUT; f++) if (bandAt(L, f) >= L.inkHalf * pushAt(f) + CLEAR) return f;
  return NAME_ON;
};

export const Eclipse: React.FC = () => {
  const f = useCurrentFrame();
  const L = useMemo(layout, []);
  const on = useMemo(() => nameOn(L), [L]);
  const cx = W / 2;
  const cy = H / 2;

  // The name: "TasteCode" struck whole in ink as the band clears it, condensing 600 -> 500 while the band
  // opens around it (no close-up); "v0.5" struck on the beat with the title close-up. It leaves only by
  // the band: Line stops drawing it on the shut frame.
  const plan = useMemo<LinePlan>(
    () => ({
      units: [
        { words: 0, at: on, mode: 'hit', H: 100, close: 0 },
        { words: 1, at: VERSION, mode: 'hit' },
      ],
      out: { at: OUT, kind: 'picture', clears: HAIR },
    }),
    [on],
  );

  // The turn. The ring keeps closing exactly as the hook left it while it tips to its edge and comes at
  // the camera (log scale). The far half dims as it tips away and is back at full where the halves meet.
  const ring = ringAt(f + SEAM);
  const t = prog(f, 0, TURN, E.smooth);
  const th = (t * Math.PI) / 2;
  const g = lmix(1, GROW, t);
  const rx = ring.R * g;
  const ry = ring.R * ring.k * g * Math.cos(th);
  const sw = mix(ring.sw, LINE, t);
  const back = 1 - 0.45 * Math.sin(Math.PI * t);
  const dotRy = ECLIPSE_END.r * Math.cos(th); // painted on the coin: it flattens into the line with it

  const s = pushAt(f);
  const bh = bandAt(L, f);

  return (
    <div style={{ position: 'absolute', inset: 0, background: C.void, overflow: 'hidden' }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <defs>
          <linearGradient id="eclipseRing" gradientUnits="userSpaceOnUse" x1={0} y1={cy - ry} x2={0} y2={cy + ry}>
            <stop offset="0" stopColor={C.white} stopOpacity={back} />
            <stop offset="1" stopColor={C.white} stopOpacity={1} />
          </linearGradient>
          <clipPath id="eclipseBand">
            <rect x={0} y={cy - bh} width={W} height={2 * bh} />
          </clipPath>
        </defs>
        {f < TURN ? (
          <>
            <ellipse cx={cx} cy={cy} rx={rx} ry={Math.max(0.01, ry)} fill="none" stroke="url(#eclipseRing)" strokeWidth={sw} />
            {dotRy > 0.25 && <ellipse cx={cx} cy={cy} rx={ECLIPSE_END.r} ry={dotRy} fill={C.white} />}
          </>
        ) : (
          <rect x={0} y={cy - bh} width={W} height={2 * bh} fill={C.white} />
        )}
        {/* The dot re-forms out of the hairline as the band reopens around it: the same mask it flattened into. */}
        {fd(f) >= REOPEN && <circle cx={cx} cy={cy} r={ECLIPSE_END.r} fill={C.ink} clipPath="url(#eclipseBand)" />}
      </svg>

      {/* The band is the name's only mask, in screen space; the name pushes in inside it. */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, clipPath: `inset(${(cy - bh).toFixed(3)}px 0px ${(H - cy - bh).toFixed(3)}px 0px)` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${cx}px ${cy}px`, transform: `scale(${s.toFixed(5)})` }}>
          <Line id="name" text={TEXT} f={f} size={L.size} role={ROLE} tier="title" color={C.ink} stage="light" align="center" anchor={{ x: cx, y: L.y0 }} plan={plan} zoom={s} />
        </div>
      </div>
    </div>
  );
};

export const ECLIPSE_CUES = { turn: TURN, shutter: SHUTTER, name: NAME_ON, version: VERSION, out: OUT, hair: HAIR, reopen: REOPEN, open: OPEN };
/** The name's local frames, for COPY 'name': first drawn, fully readable (the version struck), the band starts closing, first frame gone. */
export const ECLIPSE_LINE = { in: NAME_ON, resolved: VERSION, out: OUT, clears: HAIR };

/** Every visible hit in the act, local frames. The open to white keeps src/sync.ts's suck into drop 1. */
// Nothing bright or bell-like here (Leon, Nov 2): low air, low clicks, a soft low sweep and the sub.
export const ECLIPSE_SOUND: Sound[] = [
  { f: 21, kind: 'air', weight: 0.6 }, // the ring comes at the camera and tips: fastest about f21
  { f: TURN, kind: 'click-low', weight: 0.4 }, // the halves meet: one hairline
  { f: SHUTTER, kind: 'sweep-soft', weight: 0.7 }, // the shutter snaps open, fastest on its first frame: starts at speed; the name is struck 2 f later
  { f: SHUTTER, kind: 'sub', weight: 0.55 },
  { f: REOPEN, kind: 'click-low', weight: 0.4 }, // the band reopens on b(5,1,3) with the dot in it (nothing on the shut)
];
