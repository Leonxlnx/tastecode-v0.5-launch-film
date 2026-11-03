import React, { useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import { C, FONT, TYPE } from '../brand/tokens';
import { PROVIDERS } from '../brand/providers';
import { Shader } from '../fx/Shader';
import { assertRelay, DRAIN, Line, lineGeometry, LinePlan, lineTimes, relayAt, ritard, scaleAbout } from '../fx/Line';
import { measureTracked } from '../lib/measure';
import { FIELD, hex } from '../style/shaders';
import { accel, clamp, decay, E, glide, hitPulse, mix, prog } from '../lib/anim';
import { ACT, b, copy, H, W } from '../timeline';
import type { Sound } from './Sound';

// Act 1. The dot throws five agents out onto a ring lying on a tilted plane, seen tight: the chips are
// born large and fly out of frame. "Every agent you use," is struck word by word on the camera's
// snap-out, and the row closes with the snap (only its spacing moves; every glyph stays 84 px), then
// sits dead still across the ring's middle while the ring keeps opening and starts to turn. It hands
// over at the comma: "together in one" strikes at the same place, and on the camera's punch the line
// steps in one frame to its full 122 px layout with "window." struck on the hit, the five thrown out
// to the edges around it. On the bar the camera lets go and the line rides the release out, its ink
// going as one, as the five swing back in, all five alike. Then the ring swings to face the camera
// and closes around the dot at the eclipse's radius: the next act's disc and rim come out of this ring.
// No chip carries a dot (Leon on preview 6: "NO DOTS"); the only dots are the white one and the small
// nodes it throws, which open into the chips.

/** The pose the eclipse opens on: dot at frame centre, the ring around it. */
export const HOOK_END = { x: W / 2, y: H / 2, r: 16, ring: 262 };

const DUR = ACT.hook.dur;
const RETRACT = 280; // f, b(3,2): the ring swings round and closes
const CAM_Y = 580; // the camera's fixed point, which frames the opening
const DOT_LIFT = 472; // the dot hovers over the plane while a statement sits under it
const DOT_RAISE = 34; // and rises this much further with the first half, so the bigger line sits clear under it

// The camera: one scale about CAM_Y, in log space so equal ratios read as equal speed.
const CAM_O = { x: W / 2, y: CAM_Y };
const SNAP = 49; // f: the opening snap-out from 2.2x over 12 f, fastest across b(1,2) (f55-56)
const PUNCH = b(2, 1, 3); // f161: the punch into "together in one window.", its biggest frame
const LET_GO = b(3); // f224: the release, at full speed on the downbeat
const PUSH = 0.0006; // never parked: a slow push through every hold (log scale per frame)
/** The punch's share of the camera (log scale): x1.18 in one frame, then a long settle to 1.9x. */
const punchAt = (f: number) => 0.38 * decay(f, PUNCH - 1, 0.6) + 0.115 * decay(f, PUNCH - 1, 0.88);
/** The snap-out's share of the camera (log scale): ln 2.2 until SNAP, exactly 0 from SNAP + 12 (f61). */
const tightAt = (f: number) => Math.log(2.2) * (1 - prog(f, SNAP, SNAP + 12, E.dolly));
// Peak steps stay near x0.90 a frame, so type moves at most about 60-70 px/f and the blur pass draws it clean.
const camAt = (f: number) => {
  const tight = tightAt(f);
  const push = PUSH * f;
  const creep = accel(Math.min(f, PUNCH), PUNCH - 11, 0, 1.15, 0.0012); // gathers for 11 f before the punch
  const held = tight + push + creep + punchAt(f);
  return Math.exp(held * (f < LET_GO ? 1 : Math.pow(0.9, f - LET_GO))); // 1.0018 by RETRACT, 1.00001 on the cut
};

// The sentence, told in two parts at one place (TEXT-SYSTEM.md, Hook.tsx), in screen space: both halves
// sit on one line box centred at y 538, the ring's middle row at hold scale, outside the camera.
// hook-a: ROW (camera) + SET, then the RELAY out. Each word is struck on fd at 84 px (ink 0.85) on the
// snap's fastest frames, and the row's spacing rides half the snap's share of the camera, s = exp(0.5·tight),
// so the row closes with the five chips: one gesture. "Every" strikes 57 px out and steps in 16, 14, 12, 9,
// 6 px a frame; Line's rule 3 guard draws those frames (55-60) on fd, so the master's sub-frames cannot
// smear it (worst in-frame smear 1.5 px). s is exactly 1 from f61, so the hold is dead still.
// hook-b: SET "together in one" alone at 84 px, then the type step on the punch (HANDOFF b): in one fd
// frame the full line at 122 px, re-centred about the locked x-height midline, "window." struck as a hit.
// Dead still to the release; then it rides the release's scale about the camera's point, the whole
// line's ink going at once over DRAIN.dur, gone long before the ring swings round.
const A_TEXT = copy('hook-a').text;
const B_TEXT = copy('hook-b').text;
const LINE_Y = 538; // screen: the line box's centre, the ring's middle row at hold scale
const A_PX = TYPE.caption.size; // 84: the caption token, centred; hook-b's partial uses it too (one size, one anchor)
const B_PX = 122; // hook-b after the punch's type step (x1.452): display promoted by the punch
const A_POPS = ritard(55, [1, 1, 2]); // Every 55, agent 56, you 57, use, 59: the snap's fastest frames, the last as it lands (61)
const A_OUT = 128; // A's drain: the whole part holds the 6 f breath, then drains as one wave, Every 133, agent 134, you 135, "use," 136 (9 f each, gone on 145); COPY hook-a out 133
// B strikes on relayAt (145), the first frame "use," is gone (its drain ends on 144), so no frame ever
// holds both halves. together 145, in 147, one 149: settled by 154, 7 f before the punch.
const B_POPS = ritard(relayAt(A_OUT, 4, DRAIN.breath.display), [2, 2]);
const B_PART: readonly [number, number] = [0, 2]; // "together in one", laid out alone before the punch
/** The snap's row spacing: word centres at 960 + (x - 960)·s. Exactly 1 from f61. */
const ROW_EXP = 0.5; // the row's share of the snap (log scale); was 0.35 (crit6 #6: the words visibly ride the snap)
const rowSnap = (f: number) => Math.exp(ROW_EXP * tightAt(f));
// Spread 0: under the ROW the row spacing is the condense. With the caption spread (0.03 em) the outer glyphs
// still pushed into the word spaces after the row had closed (f61), so on 60-62 the spaces pinched below rest
// (about 5 px against 7 at half res) and then reopened: a spacing overshoot, plain to see at ink 0.85.
// Without it every space closes monotonically onto rest (half res, "Every agent": 24, 18, 13, 10, 7 px on 56-60).
const A_PLAN: LinePlan = {
  units: A_POPS.map((at, i) => ({ words: i, at, mode: 'setup' as const, spread: 0 })), // o0 0.85, H 100; close-up 0 under the ROW
  row: { s: rowSnap },
  out: { at: A_OUT, kind: 'drain', comma: { breath: DRAIN.breath.display } },
};
const B_PLAN: LinePlan = {
  units: [...B_POPS.map((at, i) => ({ words: i, at, mode: 'setup' as const })), { words: 3, at: PUNCH, mode: 'hit', spread: 0.025, close: 0 }],
  layouts: [
    { at: B_POPS[0], words: B_PART },
    { at: PUNCH, scale: B_PX / A_PX },
  ],
  // The release is the one motion, and the line goes with it as one unit: the whole line's ink on
  // E.smooth over DRAIN.dur (224-232, gone on 233) through the wrapper (bInk), so no trailing phrase
  // ("in one window.", "one window.") is ever left on screen the way the per-word carried drain left it.
  out: { at: LET_GO, kind: 'picture', clears: LET_GO + DRAIN.dur },
};
/** hook-b's ink through the release: the whole line at once, 1 until LET_GO, 0 from LET_GO + DRAIN.dur. */
const bInk = (f: number) => 1 - prog(f, LET_GO, LET_GO + DRAIN.dur, E.smooth);
/** Exported for scripts and sync: the two halves' frames (local = absolute; the hook starts at 0). */
export const HOOK_LINE = { a: lineTimes(A_PLAN, 4), b: lineTimes(B_PLAN, 4) };
/** hook-b's wrapper rides the release from LET_GO: the camera's scale ratio about its own point. */
const releaseRide = (f: number) => (f < LET_GO ? undefined : scaleAbout(CAM_O.x, CAM_O.y, camAt(f) / camAt(LET_GO)));
// The dot's extra lift keys off the old first-half onset (f46) and the release, held as constants so the picture does not move.
const RAISE_IN = 46;

// Node i leaves the dot at BIRTH[i] and opens into its chip at OPEN[i], on the 16ths.
const BIRTH = [-1, 13, 20, 34, 41];
const OPEN = BIRTH.map((s) => s + 8);
const ANGLE = [-98, -24, 54, 124, 196]; // deg, clockwise on screen: no two the same step apart
const REACH = [1, 1.03, 0.97, 1.02, 0.98];
const BOW_T = [83, 67, 97, 71, 89];

const CHIP_H = 74;
const CHIP_SIZE = 44;
const ICON = 42;
const PAD = 22; // the pill's inset before the icon
const GAP = 14; // icon to name, and name to the New badge
const END = 24; // name to the pill's end on a chip without a badge (the icon's 22 plus its own side bearing)
const NEW_W = 80;
const NEW_END = 18; // badge to the pill's end
// A chip is its icon, its name and, if new, the badge: no status dot on any of them. All five are alike
// at full ink, and each keeps its own width from open to shut.

/**
 * The ring on frame f (hook frames; the eclipse passes f + the hook's length, so the close carries on
 * across the seam at the same speed). It opens slowly, then closes on geometric decay while the plane
 * swings up to face the camera.
 */
export const ringAt = (f: number) => {
  const close = decay(f, RETRACT, 0.93); // still closing, about 0.5 px/f, on the cut
  const R = mix(540 + 0.36 * Math.min(f, DUR), HOOK_END.ring, close);
  const roll = ((mix(10, 5, clamp(f / RETRACT)) * Math.PI) / 180) * (1 - close); // the plane is banked, so this is an orbit and not a diagram
  return { R, k: mix(0.6, 1, close), close, sw: mix(2.2, 3, close), roll };
};

/** Deg. A slow constant turn, with a turn on top that grows from f150 (the punch gathering) to the cut. */
const spin = (f: number) => 0.2 * f + accel(f, 150, 0, 1.026, 0.1);

const nameWidth = (i: number) => measureTracked(PROVIDERS[i].name, CHIP_SIZE, 500, -0.02);
const chipWidth = (i: number) => PAD + ICON + GAP + nameWidth(i) + (PROVIDERS[i].isNew ? GAP + NEW_W + NEW_END : END);

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { R, k, close, sw, roll } = ringAt(f);
  const cx = W / 2;
  const cy = H / 2;
  const turn = spin(f);

  // The dot: already swelling on frame 0, kicked by each node it throws, lifted over the plane while
  // the statements sit under it, then down to the centre and tight before the eclipse opens it.
  const kick = BIRTH.reduce((a, s) => a + hitPulse(f - s, 2, 8), 0);
  const home = decay(f, RETRACT + 10, 0.86); // within 0.1 px of centre by the cut
  const dotR = mix(glide(f, 0, 18, 24, 0.86) + 3.5 * kick, HOOK_END.r, prog(f, RETRACT, RETRACT + 44, E.smooth));
  // The extra lift chains onto the first one inside the snap-out, and settles back with the release as
  // the second half leaves; it is gone by f260, so the retract and the last frame are unchanged.
  const raise = DOT_RAISE * prog(f, RAISE_IN - 2, RAISE_IN + 28, E.rest) * (1 - prog(f, LET_GO, LET_GO + 36, E.smooth));
  const dotY = mix(glide(f, 16, cy, DOT_LIFT, 0.9) - raise, cy, home);

  const reach = BIRTH.map((s) => (f <= s ? 0 : 1 - Math.pow(0.89, f - s)));
  const theta = ANGLE.map((a, i) => ((a + turn + 6 * (1 - reach[i])) * Math.PI) / 180);
  const pt = (rho: number, th: number) => {
    const X = rho * R * Math.cos(th);
    const Y = rho * R * k * Math.sin(th);
    return { x: cx + X * Math.cos(roll) - Y * Math.sin(roll), y: cy + X * Math.sin(roll) + Y * Math.cos(roll) };
  };
  const rhoOf = (i: number) => reach[i] * mix(REACH[i], 1, close);
  const node = theta.map((th, i) => pt(rhoOf(i), th));

  // A connector is a chord pulled toward the true ellipse. The pull breathes per connector, so the
  // sides bow and unbow; at the close every pull reaches 1 and the five sides are one exact ring.
  const connector = (a: number, b: number, tip: number) => {
    const pull = mix(0.74 + 0.2 * Math.sin((f / BOW_T[b]) * Math.PI * 2 + b * 1.7), 1, close);
    const thA = theta[a];
    let thB = theta[b];
    while (thB < thA) thB += Math.PI * 2;
    const steps = 40;
    const out: string[] = [];
    for (let s = 0; s <= steps; s++) {
      const u = (s / steps) * tip;
      const arc = pt(mix(rhoOf(a), rhoOf(b), u), mix(thA, thB, u));
      const chX = mix(node[a].x, node[b].x, u);
      const chY = mix(node[a].y, node[b].y, u);
      out.push(`${mix(chX, arc.x, pull).toFixed(2)},${mix(chY, arc.y, pull).toFixed(2)}`);
    }
    return `M${out.join('L')}`;
  };

  // The tail each node drags out of the dot: gone within 26 f, so this is never a fan.
  const tails = BIRTH.map((s, i) => {
    const tail = decay(f, s + 3, 0.8);
    if (f <= s || tail > 0.985) return null;
    const tipX = node[i].x;
    const tipY = node[i].y;
    const bx = mix(cx, tipX, tail);
    const by = mix(dotY, tipY, tail);
    const nx = -(tipY - by) * 0.07;
    const ny = (tipX - bx) * 0.07;
    return `M${bx.toFixed(2)},${by.toFixed(2)}Q${((bx + tipX) / 2 + nx).toFixed(2)},${((by + tipY) / 2 + ny).toFixed(2)} ${tipX.toFixed(2)},${tipY.toFixed(2)}`;
  });

  const field = useMemo(() => ({ a: hex(C.void), b: hex(C.ink), hi: hex(C.ink2), speed: 0.7, amp: 0.3 }), []);
  const flat = prog(f, 300, DUR - 1, E.smooth);
  const backInk = mix(0.42, 1, close);
  const nodeEnd = 1 - prog(f, DUR - 18, DUR - 2, E.smooth);
  const S = camAt(f);
  const camera = (k: number) => `translate(${(CAM_O.x * (1 - k)).toFixed(3)}px, ${(CAM_O.y * (1 - k)).toFixed(3)}px) scale(${k.toFixed(5)})`;

  // hook-b's anchor: the x-height midline of the 84 px line box centred on LINE_Y, so the punch's
  // type step scales about it and the midline does not move. The relay guard throws if "together"
  // could touch "use," (measured about 180 px clear).
  const bAnchor = useMemo(() => {
    const geo = lineGeometry(B_TEXT, A_PX, { role: 'caption', align: 'center', anchor: { x: W / 2, y: LINE_Y, v: 'middle' } });
    const part = B_TEXT.split(' ').slice(B_PART[0], B_PART[1] + 1).join(' ');
    assertRelay('hook', { text: A_TEXT, size: A_PX, role: 'caption', align: 'center', x: W / 2 }, { text: part, size: A_PX, role: 'caption', align: 'center', x: W / 2 });
    return { x: W / 2, y: geo.xmid, v: 'xmid' as const };
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, background: C.void, overflow: 'hidden' }}>
      <Shader frag={FIELD} uniforms={field} />
      <div style={{ position: 'absolute', inset: 0, background: C.void, opacity: flat }} />

      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: camera(S) }}>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <defs>
          <linearGradient id="hookRing" gradientUnits="userSpaceOnUse" x1={0} y1={cy - R * k} x2={0} y2={cy + R * k}>
            <stop offset="0" stopColor={C.white} stopOpacity={backInk} />
            <stop offset="1" stopColor={C.white} stopOpacity={1} />
          </linearGradient>
        </defs>
        {tails.map((d, i) => d && <path key={i} d={d} fill="none" stroke={C.white} strokeOpacity={0.9} strokeWidth={2.2} strokeLinecap="round" />)}
        {[1, 2, 3, 4, 0].map((b) => {
          const a = (b + 4) % 5;
          const s = BIRTH[b === 0 ? 4 : b] + (b === 0 ? 7 : 2);
          const tip = f <= s ? 0 : 1 - Math.pow(0.86, f - s);
          if (tip < 0.002) return null;
          return <path key={b} d={connector(a, b, tip)} fill="none" stroke="url(#hookRing)" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />;
        })}
        {node.map((n, i) => {
          const open = f < OPEN[i] ? 0 : 1 - Math.pow(0.82, f - OPEN[i]);
          const shut = prog(f, RETRACT + 2 + i * 3, RETRACT + 18 + i * 3, E.in);
          const r = 5.5 * nodeEnd * (1 - shut); // shrinks with its chip, so the ring closes clean
          return reach[i] > 0 && open * (1 - shut) < 0.45 && r > 0.05 ? <circle key={i} cx={n.x} cy={n.y} r={r} fill={C.white} /> : null;
        })}
        <circle cx={cx} cy={dotY} r={Math.max(0, dotR)} fill={C.white} />
        {/* The chips, in the ring's own SVG (HTML layers here left stale tiles in the headless renderer). Each node opens into one from its own centre; chips hold size while the ring opens under them. Back to front. */}
        {PROVIDERS.map((p, i) => ({ p, i, sin: Math.sin(theta[i]) }))
          .sort((u, v) => u.sin - v.sin)
          .map(({ p, i, sin }) => {
            const open = f < OPEN[i] ? 0 : 1 - Math.pow(0.82, f - OPEN[i]);
            const shut = prog(f, RETRACT + 2 + i * 3, RETRACT + 18 + i * 3, E.in);
            const a = open * (1 - shut);
            if (a < 0.03) return null;
            const full = chipWidth(i); // constant: no chip ever widens
            const w = mix(11, full, a);
            const h = mix(11, CHIP_H, a);
            const depth = 1 + 0.12 * sin * (1 - close);
            const nameX = PAD + ICON + GAP;
            const badgeX = nameX + nameWidth(i) + GAP;
            return (
              <g key={p.key} opacity={clamp(a * 2.2 - 0.6)} transform={`translate(${node[i].x.toFixed(2)} ${node[i].y.toFixed(2)}) scale(${depth.toFixed(4)})`}>
                <clipPath id={`hookChip${i}`}>
                  <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} />
                </clipPath>
                <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={C.ink2} />
                <rect x={-w / 2 + 0.5} y={-h / 2 + 0.5} width={Math.max(0, w - 1)} height={Math.max(0, h - 1)} rx={Math.max(0, h / 2 - 0.5)} fill="none" stroke={C.white} strokeOpacity={0.16} strokeWidth={1} />
                <g clipPath={`url(#hookChip${i})`} opacity={clamp(a * 2.4 - 1.3)}>
                  <g transform={`translate(${(-full / 2).toFixed(2)} ${-CHIP_H / 2})`}>
                    <path d={p.d} fill={C.white} transform={`translate(22 ${(CHIP_H - ICON) / 2}) scale(${ICON / 24})`} />
                    <text x={nameX} y={CHIP_H / 2} dominantBaseline="central" fill={C.white} style={{ fontFamily: FONT.text, fontSize: CHIP_SIZE, fontWeight: 500, letterSpacing: '-0.02em' }}>
                      {p.name}
                    </text>
                    {p.isNew && (
                      <g>
                        <rect x={badgeX} y={(CHIP_H - 42) / 2} width={NEW_W} height={42} rx={11} fill={C.white} />
                        <text x={badgeX + NEW_W / 2} y={CHIP_H / 2} dominantBaseline="central" textAnchor="middle" fill={C.ink} style={{ fontFamily: FONT.text, fontSize: 28, fontWeight: 600 }}>
                          New
                        </text>
                      </g>
                    )}
                  </g>
                </g>
              </g>
            );
          })}
      </svg>
      </div>

      {/* The copy, in screen space: one anchor for both halves. */}
      <Line id="hook-a" text={A_TEXT} f={f} size={A_PX} role="caption" align="center" anchor={{ x: W / 2, y: LINE_Y, v: 'middle' }} plan={A_PLAN} />
      <Line id="hook-b" text={B_TEXT} f={f} size={A_PX} role="caption" align="center" anchor={bAnchor} plan={B_PLAN} wrap={releaseRide} style={f < LET_GO ? undefined : { opacity: Number(bInk(f).toFixed(4)) }} />
    </div>
  );
};

/** Exported for src/sync.ts: when each agent opens, when the ring closes. */
export const HOOK = {
  nodeAt: OPEN,
  retract: RETRACT,
};

const panOf = (deg: number) => clamp(Math.cos((deg * Math.PI) / 180) * 0.6, -0.6, 0.6);

/** Every visible hit in the act, local frames. */
export const HOOK_SOUND: Sound[] = [
  { f: 1, kind: 'tick', weight: 0.8 }, // f1: at f0 the mix would cut the first 20 ms (the attack) of the peak-aligned tick
  ...OPEN.map((o, i) => ({ f: o, kind: 'pop', weight: 0.9, pan: panOf(ANGLE[i]) })),
  { f: SNAP + 6, kind: 'swish', weight: 0.95 }, // the snap-out, fastest across f55-56 (the swish's 3 f lead-in rides its first frames)
  { f: PUNCH, kind: 'land', weight: 1 }, // the punch: x1.19 in one frame, the type steps to 122 px and "window." is struck
  { f: PUNCH, kind: 'sub', weight: 0.45 },
  { f: LET_GO + 1, kind: 'swish', weight: 0.8 }, // the release: at full speed from the downbeat, fastest on its first frames
  { f: RETRACT, kind: 'swish', weight: 0.7 },
  { f: RETRACT + 28, kind: 'suck-short', weight: 1 }, // end-aligned: builds from f291, peaks on f304, ends as the last chip shuts (f310)
];
