// TextLab: the copy system's test bench (fx/Line.tsx), outside the Film. Each 4 s scene shows one
// technique on the dark stage (top half) and the light stage (bottom half), with the real copy and
// the act's own amounts, so the every-frame sheets of its arrivals and exits can be judged before
// any act switches over. TextLabFidelity is one still: a resting Line against a plain DOM run.
import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { C, FONT, TYPE, typeStyle } from '../brand/tokens';
import { accel, E, lmix, prog } from '../lib/anim';
import { GLYPH_FEATURES } from '../lib/measure';
import { CARD_SIZE, cardUnits } from '../acts/Card';
import { assertRelay, DRAIN, Line, lineGeometry, LinePlan, relayAt, ritard, rowLock, rowPart, scaleAbout, trackOf } from '../fx/Line';
import { copy } from '../timeline';

export const LAB_SCENE = 240;
const HALF = 540;
type Stage = 'dark' | 'light';
const ink = (s: Stage) => (s === 'dark' ? C.white : C.ink);
const ground = (s: Stage) => (s === 'dark' ? C.void : C.paper);

const Label: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ ...typeStyle('ui', 22), position: 'absolute', left: 40, top: 24, color: C.mute }}>{text}</div>
);

const Half: React.FC<{ stage: Stage; bottom?: boolean; label: string; children: React.ReactNode; bg?: string }> = ({ stage, bottom, label, children, bg }) => (
  <div style={{ position: 'absolute', left: 0, top: bottom ? HALF : 0, width: 1920, height: HALF, overflow: 'hidden', background: bg ?? ground(stage) }}>
    <Label text={label} />
    {children}
  </div>
);

const words = (t: string) => t.split(' ').length;
const MID = HALF / 2;

// S1: SET setup + hit on a ritardando, then the RELAY at one anchor (comma breath), then DRAIN. B strikes on
// relayAt, the first frame the comma word is gone, on calm's own cadence (step, by 2 f later, "step." 5 f after).
const calmA = copy('calm-a').text;
const calmB = copy('calm-b').text;
const S1_A: LinePlan = (() => {
  const on = ritard(12, [4, 4, 12]);
  return { units: on.map((at, i) => ({ words: i, at, mode: i === 3 ? 'hit' : 'setup' })), out: { at: 100, kind: 'drain', comma: { breath: DRAIN.breath.caption } } };
})();
const S1_B0 = relayAt(100, words(calmA), DRAIN.breath.caption); // 115: "work," drains 106-114
const S1_B: LinePlan = { units: ritard(S1_B0, [2, 3]).map((at, i) => ({ words: i, at, mode: i === 2 ? 'hit' : 'setup' })), out: { at: 190, kind: 'drain' } };
const S1: React.FC<{ f: number; stage: Stage }> = ({ f, stage }) => {
  assertRelay('lab-calm', { text: calmA, size: 84, role: 'caption', x: 96 }, { text: calmB, size: 84, role: 'caption', x: 96 });
  const a = { x: 96, y: MID, v: 'middle' as const };
  return (
    <>
      <Line id="lab-calm-a" text={calmA} f={f} size={84} role="caption" color={ink(stage)} stage={stage} anchor={a} plan={S1_A} />
      <Line id="lab-calm-b" text={calmB} f={f} size={84} role="caption" color={ink(stage)} stage={stage} anchor={a} plan={S1_B} />
    </>
  );
};

// S2: born. "needs you." is one phrase unit in C.accent at ink 1 on its first frame. It never drains
// (an opacity fade of yellow is olive): the picture takes it, here a hard cut at 170.
const needs = copy('needs').text;
const S2_P: LinePlan = { units: [...ritard(12, [3, 3]).map((at, i) => ({ words: i, at, mode: 'setup' as const })), { words: [3, 4], at: 34, mode: 'born' }], out: { at: 170, kind: 'picture', clears: 170 } };
const S2: React.FC<{ f: number; stage: Stage }> = ({ f, stage }) => (
  <Line id="lab-needs" text={needs} f={f} size={84} role="caption" color={ink(stage)} stage={stage} anchor={{ x: 96, y: MID, v: 'middle' }} plan={S2_P} />
);

// S3: the card entrance (Card.tsx, crit8) on the design card: the whole line laid out once at its
// final place, ink centred on x 960 with the x-height midline on the scene's middle, at CARD_SIZE. Every word strikes in its
// own slot (cardUnits: SET, close-up 0.13 em from the right on k 0.80, no spread, no lag; the row never moves). "It",
// "designs", "websites" strike 4 f apart at the stage's setup ink (o0 0.85 dark, 0.8 light; H 100); "and dashboards." one
// phrase (hit, H 150) 12 f after "websites" (1800, 1804, 1808, 1820 in the film). The card's push (1 + 0.00018 f) rides
// the wrap; the hard cut at 170 is its exit.
const design = copy('design').text;
const S3_ON = [...ritard(12, [4, 4]), 32];
const S3_P: LinePlan = { units: cardUnits(S3_ON.slice(0, 3), S3_ON[3], words(design)), out: { at: 170, kind: 'picture', clears: 170 } };
const S3: React.FC<{ f: number; stage: Stage }> = ({ f, stage }) => (
  <Line
    id="lab-design"
    text={design}
    f={f}
    size={CARD_SIZE()}
    role="display"
    color={ink(stage)}
    stage={stage}
    align="center"
    anchor={{ x: 960, y: MID, v: 'xmid' }}
    plan={S3_P}
    zoom={1 + 0.00018 * f}
    wrap={(g) => scaleAbout(960, MID, 1 + 0.00018 * g)}
  />
);

// S4: hook. ROW camera on the snap, RELAY with a display breath, the type step on the punch, carried out on the release.
const hookA = copy('hook-a').text;
const hookB = copy('hook-b').text;
const tight = (f: number) => Math.log(2.2) * (1 - prog(f, 4, 16, E.dolly));
const S4_A: LinePlan = {
  units: [10, 11, 12, 14].map((at, i) => ({ words: i, at, mode: 'setup' as const })),
  row: { s: (f) => Math.exp(0.35 * tight(f)) },
  out: { at: 70, kind: 'drain', comma: { breath: DRAIN.breath.display } },
};
const S4_B0 = relayAt(70, words(hookA), DRAIN.breath.display);
const S4_PUNCH = 103;
const S4_B: LinePlan = {
  units: [...ritard(S4_B0, [2, 2]).map((at, i) => ({ words: i, at, mode: 'setup' as const })), { words: 3, at: S4_PUNCH, mode: 'hit', spread: 0.025, close: 0 }],
  layouts: [{ at: S4_B0, words: [0, 2] }, { at: S4_PUNCH, scale: 122 / 84 }],
  out: { at: 170, kind: 'carried' },
};
const S4: React.FC<{ f: number; stage: Stage }> = ({ f, stage }) => {
  assertRelay('lab-hook', { text: hookA, size: 84, role: 'caption', align: 'center', x: 960 }, { text: hookB.split(' ').slice(0, 3).join(' '), size: 84, role: 'caption', align: 'center', x: 960 });
  const y = MID + 10;
  return (
    <>
      <Line id="lab-hook-a" text={hookA} f={f} size={84} role="caption" color={ink(stage)} stage={stage} align="center" anchor={{ x: 960, y, v: 'xmid' }} plan={S4_A} />
      <Line
        id="lab-hook-b"
        text={hookB}
        f={f}
        size={84}
        role="caption"
        color={ink(stage)}
        stage={stage}
        align="center"
        anchor={{ x: 960, y, v: 'xmid' }}
        plan={S4_B}
        wrap={(g) => (g > 170 ? scaleAbout(960, y, lmix(1, 0.45, 1 - Math.pow(0.88, g - 170))) : undefined)}
      />
    </>
  );
};

// S5: the card RELAY (Card.tsx, crit8) on the skills card: part A struck word by word in its own final layout, then the
// 6 f breath and one drain wave (fix7 #13: every word waits the breath, 1 f apart, the comma word last, so it never stands
// alone); part B strikes on relayAt, the first frame A is gone, into its own final layout about the same centre. The cut
// at 220 is its exit. Film frames: Make 2836, motion 2839, graphics 2842, and 2845, "websites," 2856, A out.at 2940; with
// 2958, built-in 2960, "skills." 2968. Here: the same gaps from 10, A out.at 104.
const skillsA = copy('skills-a').text;
const skillsB = copy('skills-b').text;
const S5_AON = [10, 13, 16, 19, 30];
const S5_AOUT = 104;
const S5_A: LinePlan = { units: cardUnits(S5_AON.slice(0, 4), S5_AON[4], words(skillsA)), out: { at: S5_AOUT, kind: 'drain', comma: { breath: DRAIN.breath.display } } };
const S5_B0 = relayAt(S5_AOUT, words(skillsA), DRAIN.breath.display); // 122: A drains 109-121 as one wave
const S5_BON = [S5_B0, S5_B0 + 2, S5_B0 + 10];
const S5_B: LinePlan = { units: cardUnits(S5_BON.slice(0, 2), S5_BON[2], words(skillsB)), out: { at: 220, kind: 'picture', clears: 220 } };
const S5: React.FC<{ f: number; stage: Stage }> = ({ f, stage }) => {
  const size = CARD_SIZE();
  const a = { x: 960, y: MID, v: 'xmid' as const };
  const push = (g: number) => scaleAbout(960, MID, 1 + 0.00018 * g);
  return (
    <>
      <Line id="lab-skills-a" text={skillsA} f={f} size={size} role="display" color={ink(stage)} stage={stage} align="center" anchor={a} plan={S5_A} zoom={1 + 0.00018 * f} wrap={push} />
      <Line id="lab-skills-b" text={skillsB} f={f} size={size} role="display" color={ink(stage)} stage={stage} align="center" anchor={a} plan={S5_B} zoom={1 + 0.00018 * f} wrap={push} />
    </>
  );
};

// S6: lit. The whole line at mute from the cut; each phrase steps to its colour on its own result.
const review = 'Commit, push and open a pull request.'; // the old q-review line (cut from the film in r8), kept as a lab sample
const S6_P: LinePlan = {
  units: [
    { words: 0, at: 10, mode: 'lit', litAt: 24 },
    { words: 1, at: 10, mode: 'lit', litAt: 45 },
    { words: [2, 6], at: 10, mode: 'lit', litAt: 66 },
  ],
};
const S6: React.FC<{ f: number; stage: Stage }> = ({ f, stage }) => (
  <Line id="lab-review" text={review} f={f} size={84} role="caption" color={ink(stage)} stage={stage} anchor={{ x: 96, y: MID, v: 'middle' }} plan={S6_P} />
);

// S7: ROW part (the split line, dark; the technique q-split used before r8) and ROW lock (redrawn, light).
const split = copy('split').text;
const redrawn = copy('redrawn').text;
const S7_PART: LinePlan = { units: [{ words: [0, 2], at: 10, mode: 'setup' }, { words: [3, 5], at: 10, mode: 'setup' }], row: rowPart(3, 12, 42) };
const S7_LOCK = (size: number): LinePlan => ({ units: [{ words: [0, 2], at: 10, mode: 'setup', spread: 0.02 }, { words: [3, 6], at: 10, mode: 'setup', spread: 0.02 }], row: rowLock(3, 10, 31, 0.18 * size), out: { at: 200, kind: 'drain' } });
const S7: React.FC<{ f: number; stage: Stage }> = ({ f, stage }) =>
  stage === 'dark' ? (
    <Line id="lab-split" text={split} f={f} size={84} role="caption" color={ink(stage)} stage={stage} align={{ seam: 3 }} anchor={{ x: 960, y: MID, v: 'middle' }} plan={S7_PART} />
  ) : (
    <Line id="lab-redrawn" text={redrawn} f={f} size={100} role="display" color={ink(stage)} stage={stage} align="center" anchor={{ x: 960, y: MID, v: 'middle' }} plan={S7_LOCK(100)} />
  );

// S8: the name (title tier, 190 px; title DRAIN) on dark; the hero line (heroTrack, 151 px; whole-block lift) on light.
const name = copy('name').text;
const rebuilt = copy('rebuilt').text;
const S8_NAME: LinePlan = { units: [{ words: 0, at: 10, mode: 'hit', H: 100, close: 0 }, { words: 1, at: 22, mode: 'hit' }], out: { at: 160, kind: 'title' } };
const S8_HERO: LinePlan = { units: [{ words: [0, 2], at: 10, mode: 'hit' }, { words: 3, at: 24, mode: 'setup' }], out: { at: 150, kind: 'picture', clears: 185 } };
const S8: React.FC<{ f: number; stage: Stage }> = ({ f, stage }) =>
  stage === 'dark' ? (
    <Line id="lab-name" text={name} f={f} size={190} role="display" tier="title" color={ink(stage)} stage={stage} align="center" anchor={{ x: 960, y: MID, v: 'middle' }} plan={S8_NAME} />
  ) : (
    <Line
      id="lab-rebuilt"
      text={rebuilt}
      f={f}
      size={151}
      role="hero"
      color={ink(stage)}
      stage={stage}
      align="center"
      anchor={{ x: 960, y: MID, v: 'middle' }}
      plan={S8_HERO}
      wrap={(g) => `translateY(${(-accel(g, 150, 0, 1.13, 2)).toFixed(3)}px)`}
    />
  );

// S9 top: one line spanning two "acts" (Sequences) through a polarity flip, its plan in the lab's absolute
// frames; each half passes its own origin as offset. S9 bottom: the wordmark's edge ride and the platforms
// line settling onto STILL.
const design9 = copy('design').text;
const S9_AT = 8 * LAB_SCENE; // the scene's absolute start
const S9_FLIP = 120;
const S9_DASH: LinePlan = { units: [...[4, 7, 11].map((at, i) => ({ words: i, at: S9_AT + at, mode: 'setup' as const })), { words: [3, 4], at: S9_AT + 113, mode: 'hit' }] };
const DashPart: React.FC<{ origin: number; flipped: boolean }> = ({ origin, flipped }) => {
  const f = useCurrentFrame();
  const st: Stage = flipped ? 'light' : 'dark';
  return (
    <Half stage={st} label="S9 one plan across two Sequences (offset), polarity flip at 120">
      <Line id="lab-dash" text={design9} f={f} offset={origin} size={84} role="caption" color={ink(st)} stage="dark" anchor={{ x: 96, y: MID, v: 'middle' }} plan={S9_DASH} />
    </Half>
  );
};
const STILL = 60;
const markRight = (g: number) => 763 + 41 * Math.pow(0.896, g - 16);
const Lockup: React.FC<{ f: number }> = ({ f }) => {
  const g = Math.min(f, STILL);
  const geo = lineGeometry('TasteCode', 96, { role: 'display' });
  const restInkLeft = 798;
  const x0 = restInkLeft - geo.layout.words[0].inkL;
  const r = 40;
  const cx = markRight(g) - r;
  const cy = MID - 40;
  const ride = Math.max(0, markRight(g) + 35 - restInkLeft);
  const name: LinePlan = { units: [{ words: 0, at: 20, mode: 'hit', o0: 0.35, kInk: 0.8, H: 60, k: 0.85, close: 0, spread: 0 }] };
  const plat: LinePlan = { units: [{ words: [0, 7], at: 48, mode: 'cut', o0: 0.42, H: 110, close: 0, spread: 0.03, by: STILL }] };
  return (
    <>
      <svg width={1920} height={HALF} style={{ position: 'absolute', left: 0, top: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill={C.white} />
      </svg>
      <Line id="lab-wordmark" text="TasteCode" f={g} size={96} role="display" color={C.white} anchor={{ x: x0, y: cy, v: 'xmid' }} plan={name} wrap={() => `translateX(${ride.toFixed(3)}px)`} />
      <Line id="lab-platforms" text={copy('platforms').text} f={g} size={44} role="secondary" color={C.mist} align="center" anchor={{ x: 960, y: cy + 110, v: 'top' }} plan={plat} />
    </>
  );
};

const SCENES: { label: [string, string]; C: React.FC<{ f: number; stage: Stage }> }[] = [
  { label: ['S1 SET setup (o0 0.85) + hit, RELAY (comma 4 f, B on its clear at 115), DRAIN: caption, dark', 'S1 light (o0 0.8)'], C: S1 },
  { label: ['S2 SET born ("needs you." C.accent at ink 1), picture exit (hard cut at 170)', 'S2 light'], C: S2 },
  { label: ['S3 card: every word in its own slot (close-up 0.13 em, k 0.80) 12/16/20 setup, "and dashboards." at 32, push, cut at 170', 'S3 light'], C: S3 },
  { label: ['S4 ROW camera (stepped on fd), RELAY (6 f, B at 87), type step x1.452 on the punch, carried release', 'S4 light'], C: S4 },
  { label: ['S5 card RELAY: A in place, breath 6 + one drain wave 109-121, B on relayAt 122 in its own layout, cut at 220', 'S5 light'], C: S5 },
  { label: ['S6 lit: mute on the cut, each phrase steps on its own frame (24, 45, 66)', 'S6 light'], C: S6 },
  { label: ['S7 ROW part about the seam (split line)', 'S7 ROW lock on E.glide, 21 f (redrawn), DRAIN'], C: S7 },
  { label: ['S8 title tier 190: hit, version struck at 22, title DRAIN', 'S8 hero 151 heroTrack: phrase hit, setup word, lift'], C: S8 },
];

export const TEXT_LAB_DUR = (SCENES.length + 1) * LAB_SCENE;

export const TextLab: React.FC = () => {
  const frame = useCurrentFrame();
  const k = Math.floor(frame / LAB_SCENE);
  const f = frame - k * LAB_SCENE;
  const s = SCENES[k];
  if (!s)
    return (
      <AbsoluteFill style={{ background: C.void }}>
        <Sequence from={S9_AT} durationInFrames={S9_FLIP} layout="none">
          <DashPart origin={S9_AT} flipped={false} />
        </Sequence>
        <Sequence from={S9_AT + S9_FLIP} durationInFrames={LAB_SCENE - S9_FLIP} layout="none">
          <DashPart origin={S9_AT + S9_FLIP} flipped />
        </Sequence>
        <Half stage="dark" bottom label="S9 wordmark edge ride (ink before position), platforms cut-in settling onto STILL 60">
          <Lockup f={f} />
        </Half>
      </AbsoluteFill>
    );
  return (
    <AbsoluteFill style={{ background: C.void }}>
      <Half stage="dark" label={s.label[0]}>
        <s.C f={f} stage="dark" />
      </Half>
      <Half stage="light" bottom label={s.label[1]}>
        <s.C f={f} stage="light" />
      </Half>
    </AbsoluteFill>
  );
};

// The fidelity gate (TEXT-SYSTEM.md section 8, risk 1): a resting Line above a plain DOM run with the
// same settings, for caption 84, display 112 and hero 151, at integer positions. Diff the pairs.
export const FIDELITY_ROWS = [
  { role: 'caption' as const, size: 84, text: copy('calm-a').text, y: 40 },
  { role: 'display' as const, size: 112, text: copy('split').text, y: 380 },
  { role: 'hero' as const, size: 151, text: copy('rebuilt').text, y: 720 },
];
export const FIDELITY_GAP = 160; // px between a Line row and its plain twin

export const TextLabFidelity: React.FC = () => (
  <AbsoluteFill style={{ background: C.void }}>
    {FIDELITY_ROWS.map((r) => {
      const plan: LinePlan = { units: r.text.split(' ').map((_, i) => ({ words: i, at: 0, mode: 'setup' as const })) };
      const t = TYPE[r.role];
      return (
        <React.Fragment key={r.role}>
          <Line id={`fid-${r.role}`} text={r.text} f={400} size={r.size} role={r.role} anchor={{ x: 96, y: r.y }} plan={plan} />
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transformOrigin: '0 0',
              transform: `translate(96px, ${r.y + FIDELITY_GAP}px)`,
              fontFamily: FONT.text,
              fontSize: r.size,
              fontWeight: t.weight,
              letterSpacing: `${trackOf(r.role, r.size)}em`,
              lineHeight: t.lead,
              whiteSpace: 'pre',
              ...GLYPH_FEATURES,
              color: C.white,
            }}
          >
            {r.text}
          </div>
        </React.Fragment>
      );
    })}
  </AbsoluteFill>
);

