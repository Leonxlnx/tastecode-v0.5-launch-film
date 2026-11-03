import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C } from '../brand/tokens';
import { DRAIN, fitLine, Line, lineGeometry, LinePlan, lineTimes, relayAt, scaleAbout, SET, SetUnit } from '../fx/Line';
import { ACT, copy, W } from '../timeline';
import type { Sound } from './Sound';

// The card (Leon, Nov 3: "show it in the middle, only in the middle", then the footage). One
// grammar for all six: the sentence alone on the flat black stage, centred, set with the house system (TEXT-SYSTEM.md
// section "Cards"). Nothing else is in frame: no plate, no gradient, no grain, no glow, no dot, no yellow. The footage
// before and after meets it with hard cuts on beats, and the cut into the footage is the card's exit (HANDOFF f).
//
// Entrance (crit8): every word strikes IN ITS OWN FINAL SLOT. Each line (each relay part) is laid out once, at its
// final place, its whole ink centred on x 960; the row never moves as a whole (the crit7 row shove made the line whip:
// up to 640 px of travel in 11 f on the design card, the row parked off centre, two payoff grammars). A word strikes as
// SET with one short local travel (CARD_STRIKE): drawn whole from its onset at the stage's setup ink (o0 0.85, H 100)
// or, for the payoff, at full ink with the hit's weight pulse (o0 1, H 150), 0.13 em (14 px) right of its slot, and it
// closes leftward on the house settle (k 0.80): monotone deceleration, the same direction for every word, at rest 18 f
// later. No glyph spread and no glyph lag, so every glyph of a word moves as one and its ink only decelerates. On a 2 f
// cadence Line's catch-up close-up grows the travel (at most 1.8 x, 0.23 em) so a word never lands on its still-settling
// neighbour. Setup words strike 2-4 f apart, the payoff on a beat or a 16th, no more than 16 f after the last setup word
// (rule 7). The payoff's ink stays inside the 5% title safe edge (x 1824) on its strike: the widest rest edge is ~1756.
// Two-part sentences relay at one anchor: part A waits the 6 f breath and drains as one left-to-right wave (the comma
// word last, never alone), and part B's first word strikes on relayAt, the first frame A is gone, into its own layout.
// Camera: one slow axial push of the whole card about (960, 540), 1 + 0.00018 f (+4% over 224 f), the hold's only life.
// Sound: none. The music carries the cards (tools/mix/mix.py sits each card 1.5 dB under its footage in drop 2).

/** The anchor: centred on x 960, the x-height midline on y 540 (the baseline 0.273 em below it). */
const ANCHOR = { x: W / 2, y: 540, v: 'xmid' as const };
const PUSH = 0.00018; // scale per frame of the card act
const MAX = 112; // px: the display step
const WIDTH = 1600; // px: the widest line's measure
const BREATH = DRAIN.breath.display; // 6 f
const PAYOFF_CAP = 16; // f: rule 7, the payoff after the last setup word
const SETTLE = 18; // f: a strike's settle (k 0.80: close-up, ink and weight) is over
const STILL_BEFORE_CUT = 6; // f: HANDOFF (f), the last part is whole and still this long before the cut

/**
 * The card strike (crit8): SET in the word's own slot. The display close-up (0.13 em from the right, k 0.80) is the only
 * travel; spread 0 and lag 0 make every glyph of a word move as one, so the word's ink edges only decelerate, leftward.
 */
export const CARD_STRIKE = { close: SET.close.display, spread: 0, lag: 0 } as const;

/** A card part's units: one setup unit per word at `on`, the rest of the line (words on.length .. n - 1) as the payoff hit. */
export const cardUnits = (on: readonly number[], hit: number, n: number): SetUnit[] => [
  ...on.map((at, i) => ({ words: i, at, mode: 'setup' as const, ...CARD_STRIKE })),
  { words: [on.length, n - 1] as const, at: hit, mode: 'hit' as const, ...CARD_STRIKE },
];

type CardAct = 'calmCard' | 'designCard' | 'switchCard' | 'skillsCard' | 'splitCard' | 'limitsCard';
/** One part of a card's sentence: its setup onsets (one word each, in reading order), the payoff's onset (the rest of the
 * line as one unit) and, for part A of a relay, out.at (the wave starts on out.at + BREATH - 1). */
type Part = { id: string; on: readonly number[]; hit: number; aOut?: number };

// Onsets are absolute frames. Every payoff is on a beat or a 16th of the grid (b() in timeline.ts).
const CARDS: Record<CardAct, readonly Part[]> = {
  // 36 f of empty stage (1400-1435): the pause between the settings and the chat; the music breathes under it.
  calmCard: [
    { id: 'calm-a', on: [1436, 1440, 1444], hit: 1456, aOut: 1544 }, // "work," on b(14), the breakdown; A leaves 1549-1560
    { id: 'calm-b', on: [1561, 1563], hit: 1568 }, // step on relayAt, "step." on b(15)
  ],
  designCard: [{ id: 'design', on: [1800, 1804, 1808], hit: 1820 }], // "and dashboards." on b(17,1)
  switchCard: [
    { id: 'switch-a', on: [2528, 2531], hit: 2541, aOut: 2597 }, // "mid-chat," on b(23,2,3); A leaves 2602-2612
    { id: 'switch-b', on: [2613, 2615, 2617], hit: 2625 }, // "conversation." on b(24,1,3)
  ],
  skillsCard: [
    { id: 'skills-a', on: [2836, 2839, 2842, 2845], hit: 2856, aOut: 2940 }, // "websites," on b(26,2); A leaves 2945-2957
    { id: 'skills-b', on: [2958, 2960], hit: 2968 }, // "skills." on b(27,2)
  ],
  splitCard: [{ id: 'split', on: [3144, 3148, 3152], hit: 3164 }], // "side by side." on b(29,1)
  limitsCard: [{ id: 'limits', on: [3370, 3373, 3376, 3379], hit: 3388 }], // "at a glance." on b(31,1)
};

const cutOf = (act: CardAct) => ACT[act].from + ACT[act].dur;

/** A part's Line plan: every word struck in its own final slot (no ROW driver); part A drains as a wave, the last part leaves on the cut. */
const planOf = (p: Part, act: CardAct): LinePlan => ({
  units: cardUnits(p.on, p.hit, copy(p.id).text.split(' ').length),
  out: p.aOut !== undefined ? { at: p.aOut, kind: 'drain', comma: { breath: BREATH } } : { at: cutOf(act), kind: 'picture', clears: cutOf(act) },
});

const PLANS: Record<string, LinePlan> = Object.fromEntries((Object.keys(CARDS) as CardAct[]).flatMap((act) => CARDS[act].map((p) => [p.id, planOf(p, act)] as const)));

/** Every card line's frames from its plan (absolute): in, resolved, out, clears. COPY in timeline.ts must equal them. */
export const CARD_LINES = Object.fromEntries(Object.entries(PLANS).map(([id, plan]) => [id, lineTimes(plan, copy(id).text.split(' ').length)]));

// Load-time checks: the strike's travel stays short (Line's catch-up close-up is at most 1.8 x, under 0.25 em), the plans
// and COPY agree, every relay hands over on relayAt, rule 7's cap, the last part's still hold.
if (1.8 * CARD_STRIKE.close > 0.25) throw new Error(`Card: the strike's close-up can grow to ${(1.8 * CARD_STRIKE.close).toFixed(3)} em (at most 0.25)`);
for (const act of Object.keys(CARDS) as CardAct[]) {
  const parts = CARDS[act];
  parts.forEach((p, i) => {
    const t = CARD_LINES[p.id];
    const c = copy(p.id);
    if (t.in !== c.in || t.resolved !== c.resolved || t.out !== c.out)
      throw new Error(`Card ${act}: "${p.id}" plans in ${t.in} / resolved ${t.resolved} / out ${t.out}, COPY says ${c.in} / ${c.resolved} / ${c.out}`);
    const steps = [...p.on, p.hit];
    if (steps.some((at, j) => j > 0 && at <= steps[j - 1])) throw new Error(`Card ${act}: "${p.id}" onsets are not increasing`);
    if (p.on.length && p.hit - p.on[p.on.length - 1] > PAYOFF_CAP) throw new Error(`Card ${act}: "${p.id}" lands its payoff ${p.hit - p.on[p.on.length - 1]} f after the last setup word (rule 7: at most ${PAYOFF_CAP})`);
    if (p.on[0] < ACT[act].from) throw new Error(`Card ${act}: "${p.id}" strikes on ${p.on[0]}, before the card's cut (${ACT[act].from})`);
    const next = parts[i + 1];
    if (next) {
      if (p.aOut === undefined) throw new Error(`Card ${act}: "${p.id}" is part A of a relay but has no out`);
      const at = relayAt(p.aOut, c.text.split(' ').length, BREATH);
      if (next.on[0] !== at || t.clears !== at) throw new Error(`Card ${act}: "${next.id}" strikes on ${next.on[0]}, but "${p.id}" is gone on ${t.clears} (relayAt ${at})`);
    } else if (cutOf(act) - p.hit < SETTLE + STILL_BEFORE_CUT) throw new Error(`Card ${act}: "${p.id}" is still settling ${STILL_BEFORE_CUT} f before the cut (${cutOf(act)})`);
  });
}

/** One size for all nine card lines: the largest at which the widest fits 1600 px, at most the display step (112). */
let cardSize: number | undefined;
export const CARD_SIZE = () => (cardSize ??= Math.min(...Object.keys(PLANS).map((id) => fitLine(copy(id).text, 'display', 1, MAX, WIDTH))));

/** The anchor for one line: x moved so its ink (not its advance box) is centred on 960; the x-height midline on 540. */
const anchorOf = (text: string, size: number) => {
  const L = lineGeometry(text, size, { role: 'display' }).layout;
  const ink = (L.words[0].inkL + L.words[L.words.length - 1].inkR) / 2;
  return { ...ANCHOR, x: ANCHOR.x - (ink - L.width / 2) };
};

/** The cards make no sound: the music carries them. */
export const CARD_SOUND: Sound[] = [];

const Card: React.FC<{ act: CardAct }> = ({ act }) => {
  const f = useCurrentFrame();
  const from = ACT[act].from;
  const size = CARD_SIZE(); // measured under FontGate, never at import (Node scripts load the timeline's acts)
  const push = 1 + PUSH * f;
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.void, overflow: 'hidden' }}>
      {CARDS[act].map((p) => (
        <Line
          key={p.id}
          id={p.id}
          text={copy(p.id).text}
          f={f}
          offset={from}
          size={size}
          role="display"
          color={C.white}
          stage="dark"
          align="center"
          anchor={anchorOf(copy(p.id).text, size)}
          plan={PLANS[p.id]}
          zoom={push}
          wrap={(g) => scaleAbout(ANCHOR.x, ANCHOR.y, 1 + PUSH * (g - from))}
        />
      ))}
    </div>
  );
};

export const CalmCard: React.FC = () => <Card act="calmCard" />;
export const DesignCard: React.FC = () => <Card act="designCard" />;
export const SwitchCard: React.FC = () => <Card act="switchCard" />;
export const SkillsCard: React.FC = () => <Card act="skillsCard" />;
export const SplitCard: React.FC = () => <Card act="splitCard" />;
export const LimitsCard: React.FC = () => <Card act="limitsCard" />;
