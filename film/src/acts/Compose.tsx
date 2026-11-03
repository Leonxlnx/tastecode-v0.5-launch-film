import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C } from '../brand/tokens';
import { Deal, Orb, orbFill, PHASES, PhaseTick } from '../fx/Deal';
import { handFace, SitesDoor } from '../fx/SiteRun';
import { accel, E, fd, glide, lmix, mix, prog } from '../lib/anim';
import { BigCursor, Clip, Plate, pressAt } from '../fx/kit';
import { ACT, BEAT, CUE, H, W } from '../timeline';

// Dawn. A hard cut from the design card's black: the real composer rises into a quiet sky on one decelerating move,
// the Design chip is pressed, the prompt is typed. One beat before the press a jump cut throws the whole sentence up
// large, then the camera eases back to the whole composer. The orb is pressed: a shimmer crosses the card, the sentence
// leaves its row, the orb lifts out of its socket and drifts down to the middle of the sky, and the app's own phase
// names tick through the prompt row while the card leans back. Into the drop the card flips away; on the drop the orb
// deals the site the sentence asked for, nine real screens of Hvit (a guesthouse in Flateyri, made with Leon's
// TasteSkill), into an open hand over the clouds, fully lit and with no text over it. Then the hand flies apart, the
// orb opens wide onto Hvit's own entrance, sharp from the first hole frame.
const A = ACT.compose.from;
const DUR = ACT.compose.dur;
const PRESS = CUE.press - A; // 140
const DROP = CUE.drop2 - A; // 224
const EXIT = DUR - 28; // 308 = b(20,3): the hand flies apart, the last beat of the act; the deal holds 224-308
const PUSH_AT = DROP + 26; // the hand pushes in around the orb from here to EXIT
const exitAt = (f: number) => prog(f, EXIT, DUR - 1, E.exit); // the hand's exit: its cards fly outward and it scales x2.1
const IRIS_AT = EXIT + 3; // 311 (abs 2215): the orb opens into the door
const IRIS_V0 = 40; // px: the hole's first step past the orb's radius (crit8)
const IRIS_K = 1.2; // the hole's growth per frame
/**
 * The door's zoom about Hvit's hero (crit7 #4a): it ends at exactly 1.05 on the act's last frame, the contract with
 * fx/SiteRun entryZoom = lmix(1.05, 1, decay(l, -1, 0.895)) (crit7 #4b). It is that same decay run backwards, so the
 * pull-back is fast while the hole is small (2.0 on IRIS_AT, where the hole's centre looks into the aerial) and slows to
 * Sites' own speed at the cut: log-zoom falls by x0.895 a frame on both sides of 2239/2240, no stop and no lurch
 * (an E.exit ramp to 1.05 would leave the door at 5.5% a frame against Sites' 0.5%).
 */
const DOOR_END = 1.05;
const doorZoom = (f: number) => Math.exp(Math.log(DOOR_END) * Math.pow(0.895, Math.min(f, DUR - 1) - (DUR - 1)));

const CX = W / 2;
const CY = 884; // the hand's pivot, low in the frame

// The composer, in the source pixels of the clip design-compose (1920x1080): the card, its parts.
const CARD = { x: 47, y: 455, w: 1828, h: 287 };
const ORB = { x: 1816, y: 687 };
/**
 * The take's send orb, measured on clip 239-268: disc centre (1817, 687.13), radius 35.8, fill 215 until its hover
 * (clip 253) and 237 from clip 256. crit8: the film's orb takes over from the take's on SWAP (local 132, clip 239), drawn
 * as that same orb in that same place (fx/Deal Orb), so the hand-over itself shows nothing. It then carries the app's
 * own hover brightening over HOVER frames (the time-map had squeezed it into one frame, 2040 -> 2041) and the press
 * squeezes it on the cursor's own pulse (pressAt: 0.38, 0.71, 0.92, 1 into PRESS + 1, then decaying) instead of
 * cutting to a 0.66x disc on the press frame (r8: 16 -> 11 px half-res in one frame, with a 2x heavier arrow).
 */
const ORB_C = { x: 1817, y: 687.13 };
const TAKE_ORB_R = 35.8;
const SWAP = PRESS - 8;
const HOVER = 5; // f: SWAP to PRESS - 3, where the press pulse begins
const CHIP = { x: 533, y: 687 };
const CHIP_AT = 22; // f: the Design chip is pressed
const CLIP_PRESS = 265;
const JUMP = PRESS - BEAT; // the jump cut, one beat before the press
const SWING = PRESS - 20; // the camera leaves for the orb
const ROW = { x: 70, y: 552, w: 640, h: 58, textX: 84, midY: 580 }; // the prompt's row in the clip
const ROW_K = 1.4; // the type's growth at the jump
const CARD_K = 1.06; // the card's
const ROW_EMPTY_X = 1000; // a stretch of the prompt row with nothing in it: the row's own fill once the sentence is sent
const K_PRESS = 0.92; // the camera's scale at the press: the whole composer, the sentence left, the orb at the right
const PHASE_AT = PRESS + 12; // the first phase name rises in the emptied row
const FLIP = DROP - 40; // the card starts to flip and fall away into the drop
const LABEL_X = 280; // card px: the middle of a phase name in the prompt row

// The first frame (r8): the act now opens on a hard cut from the design card's black, not on Calm's composer lift. The
// composer is already framed and still rising: one geometric decay of RISE px, 24 px on the first step, under 1 px/f
// from local 15 and at rest by about local 20. The sky rises a third as far behind it.
const RISE = 120;
const RISE_K = 0.8;

// The clip's time: the chip lights on the frame after its click, typing at 1.6x, the last three keys slowing across the jump.
const STOPS: [number, number][] = [[0, 36], [CHIP_AT, 71], [50, 104], [JUMP, 203], [JUMP + 12, 213], [PRESS, CLIP_PRESS], [PRESS + 3, 268]];
const clipFrame = (f: number) => {
  for (let i = 1; i < STOPS.length; i++) {
    if (f <= STOPS[i][0]) return mix(STOPS[i - 1][1], STOPS[i][1], (f - STOPS[i - 1][0]) / (STOPS[i][0] - STOPS[i - 1][0]));
  }
  return 268;
};
const fromClip = (c: number) => {
  for (let i = 1; i < STOPS.length; i++) {
    if (c <= STOPS[i][1]) return mix(STOPS[i - 1][0], STOPS[i][0], (c - STOPS[i - 1][1]) / (STOPS[i][1] - STOPS[i - 1][1]));
  }
  return PRESS;
};

// Deal slot -> HAND face (crit-compose #2; SiteRun's HAND is unchanged). The months card's big hour numerals sat in
// slot 6; the calm fjord-room card takes slot 6 and the months go to slot 2, low on the right and mostly under the
// loft card during the hold. Card 2's age on the act's last frame is 108, so the months' highest live take frame is
// 60 + 108 = 168.
const SLOT = [0, 1, 6, 3, 4, 5, 2, 7, 8];
const slotFace = (i: number, age: number) => handFace(SLOT[i], age);

const PHASE_STEP = (DROP - PHASE_AT) / PHASES.length; // 12 f each, from the emptied row to the drop

// The prompt is 35 characters across clip frames 104-213: a key sound on every other one.
export const COMPOSE = {
  press: PRESS,
  drop: DROP,
  exit: EXIT,
  chip: CHIP_AT,
  jump: JUMP,
  keys: Array.from({ length: 17 }, (_, i) => Math.round(fromClip(104 + (i * 2 * 109) / 34) + [0, 1, -1, 1, 0, -1, 1][i % 7])),
  phases: PHASES.map((_, i) => Math.round(PHASE_AT + i * PHASE_STEP)), // one tick per label, the first in the emptied row
  flip: FLIP,
};

// ------------------------------------------------------------------------------------------- the caret
// The prompt row's caret. The take's own caret runs on the capture's clock: it drops out for a
// frame between keys (clip 115, 119, 123, 127, 138-139, ...) and blinks 3 on / 3 off from the last key (213), which the
// time-map to the press (3.25x) turns into a flash. It is covered with the field's own ground and the house caret is
// drawn in its place: 2 px wide on screen, centred on the cap-height centre, white at 0.9, solid while typing and for
// 30 f after the last key, then 32 f off / 32 f on, decided on fd. Here the send (PRESS + 1) comes 16 f after the last
// key, so it never blinks: it rides up and out with the sentence. Measured on the PNGs (clip px): caps 570-593 (cap
// height 24, centre 582, so the font is about 33 px); the take's caret is 1 CSS px (2.26 px) wide, rows 558-603.
//
// crit8: the caret stood 1.9 clip px after the last glyph and was as tall as an "l" (1.15x the cap height: 568-596
// against the i's 569-593), so "Flateyri|" read "Flateyril" at preview size. Now it stands CARET_GAP further right
// (the final i's ink ends at 579.6, the caret's left edge is at 584.2-584.4: a 4.6-4.8 px gap, 0.14 em) and runs the field's text
// line, 1.5x the cap height (564-600: above every ascender, down to the descenders), so it can never be read as a
// letter. The focus caret (row 0, before the placeholder's "D") stays where the app has it.
const FIELD = 'rgb(26,26,26)'; // lint-ok: the composer field's own ground, sampled from the design-compose PNGs
const CAP_MID = 582;
const CARET_H = 1.5 * 24;
const CARET_GAP = 3; // clip px past the take's caret centre
const COVER_Y = 556;
const COVER_H = 50;
const BLANK_CLIP = 96; // the placeholder with no caret: the patch for the focused, empty field
/**
 * One row per caret position: [first clip frame, cover x0, cover x1 (exclusive), the take caret's ink centre x], from
 * the columns its ink lifts above the ground. The first is the focus (clip 97), where the caret stands on the
 * placeholder's "D" and is patched from clip 96; then the prompt's 35 keys (a key lands on the frame its caret moves).
 */
const CARETS: readonly (readonly [number, number, number, number])[] = [
  [97, 84, 88, 86.0], [104, 105, 108, 106.39], [106, 114, 117, 115.44], [109, 130, 133, 131.31], [112, 136, 140, 138.1],
  [116, 148, 151, 149.41], [120, 166, 169, 167.51], [124, 175, 178, 176.56], [128, 186, 190, 187.85], [130, 207, 210, 208.29],
  [132, 218, 221, 219.58], [135, 227, 230, 228.62], [140, 245, 248, 246.72], [143, 254, 257, 255.77], [146, 275, 278, 276.23],
  [150, 293, 296, 294.32], [154, 311, 314, 312.42], [157, 324, 328, 326.0], [159, 336, 339, 337.34], [161, 356, 359, 357.68],
  [165, 376, 380, 378.1], [169, 395, 398, 396.23], [172, 410, 414, 412.05], [175, 426, 430, 427.85], [179, 438, 441, 439.24],
  [182, 444, 448, 446.0], [185, 465, 468, 466.39], [188, 474, 477, 475.44], [191, 490, 493, 491.31], [194, 499, 502, 500.36],
  [196, 515, 518, 516.23], [199, 526, 529, 527.51], [203, 544, 547, 545.61], [206, 562, 565, 563.71], [209, 573, 577, 575.08],
  [213, 580, 583, 581.81],
];
/** The caret row on frame F: the take frame Clip shows there (fd of the time-map), or -1 before the field has focus. */
const caretRow = (F: number) => {
  const c = fd(clipFrame(F));
  let r = -1;
  for (let i = 0; i < CARETS.length && CARETS[i][0] <= c; i++) r = i;
  return r;
};
/** Solid while typing and for 30 f after the last key, then 32 f off / 32 f on; decided on fd. */
const caretOn = (f: number) => {
  const F = fd(f);
  const r = caretRow(F);
  let g = F;
  while (g > 0 && caretRow(g - 1) === r) g--;
  const idle = F - g;
  return idle < 30 || (idle - 30) % 64 >= 32;
};

/** In clip px, inside a box whose origin is the clip's (0, 0): the cover over the take's caret, and the house caret. `px` is one screen px. */
const CaretFix: React.FC<{ f: number; px: number }> = ({ f, px }) => {
  const r = caretRow(f); // the same take frame the Clip beside it shows, sub-frames included
  if (r < 0) return null;
  const [, x0, x1, take] = CARETS[r];
  const cx = r === 0 ? take : take + CARET_GAP;
  const w = 2 * px;
  const box = (x: number, y: number, bw: number, bh: number): React.CSSProperties => ({ position: 'absolute', left: 0, top: 0, width: bw, height: bh, transform: `translate(${x}px, ${y}px)` });
  // The scaled take spreads each pixel half a pixel either side, so the cover reaches half a pixel into the last
  // glyph's column and a pixel into the empty field: without that the take's caret left a faint flickering hairline
  // above and below the house caret. The placeholder patch is the same picture minus the caret, so it can be wider.
  const P = 4;
  return (
    <>
      {r === 0 ? (
        <div style={{ ...box(x0 - P, COVER_Y, x1 - x0 + 2 * P, COVER_H), overflow: 'hidden' }}>
          <Clip id="design-compose" frame={BLANK_CLIP} width={1920} height={1080} style={{ transformOrigin: '0 0', transform: `translate(${P - x0}px, ${-COVER_Y}px)` }} />
        </div>
      ) : (
        <div style={{ ...box(x0 - 0.5, COVER_Y, x1 - x0 + 1.5, COVER_H), background: FIELD }} />
      )}
      {/* gone from PRESS + 10: riding out, its stub below the baseline outlived the glyphs by a frame as a speck (r8 crit) */}
      {caretOn(f) && f < PRESS + 10 && <div style={{ ...box(cx - w / 2, CAP_MID - CARET_H / 2, w, CARET_H), background: C.white, opacity: 0.9 }} />}
    </>
  );
};

// Source pixels to screen. While the prompt is typed the camera only pushes in, axially, about one fixed source point
// (r8, crit compose #1): no caret follow and no sideways move, so the card's left edge only moves outward and the
// sentence grows into the empty field, whole on every frame (its start at screen 227 on k 1.54, its end at 1022). The
// jump is a pure scale cut about the same point; then the camera eases back a third of the way toward the orb until the
// whole composer is in frame.
const FX = 560; // the typing shot's fixed point: the model pill (source x 1314 on) stays out of frame until the swing
const K_JUMP = (1.34 + 0.2) * CARD_K; // the camera's scale from the jump to the swing
/** The framing after the jump: a slow 0.5 px/f drift toward the orb, and from SWING a third of the way to it. */
const framed = (f: number, s: number) => {
  const u = 0.35 * s;
  return { fx: mix(FX + 0.5 * (f - JUMP), ORB.x, u), fy: mix(600, ORB.y, u), ay: mix(H / 2, CY - 20, u) };
};
/**
 * The swing (r8, Leon's note 2 applied here): one zoom out about the single source point that sits on the same screen
 * spot in the swing's first and last framing, so every point of the card travels straight to where it ends, with no
 * sideways overshoot and no late correction (mixing fx linearly against a log-mixed scale had the card's left edge run
 * 34 px left and come back 23, at half res, over 2027-2040). The end framing is exactly the old one.
 */
const SWING_PIVOT = (() => {
  const a = framed(SWING, 0);
  const b = framed(PRESS, 1);
  const kA = K_JUMP;
  const kB = K_PRESS;
  const x = (a.fx * kA - b.fx * kB) / (kA - kB);
  const y = (b.ay - a.ay + a.fy * kA - b.fy * kB) / (kA - kB);
  return { x, y, sx: CX + (x - a.fx) * kA, sy: a.ay + (y - a.fy) * kA };
})();
const camera = (f: number) => {
  const rise = glide(f, 0, RISE, 0, RISE_K);
  // The jump: a hard cut inside the act. The card barely grows; the whole sentence is framed.
  if (fd(f) < JUMP) return { fx: FX, fy: 600, k: 1.34 + 0.2 * prog(f, 40, JUMP, E.cam), ay: H / 2, rise };
  const s = prog(f, SWING, PRESS, E.push);
  const k = lmix(K_JUMP, K_PRESS, s);
  if (s <= 0 || s >= 1) return { ...framed(f, s), k, rise };
  const p = SWING_PIVOT;
  return { fx: p.x - (p.sx - CX) / k, fy: p.y - (p.sy - H / 2) / k, k, ay: H / 2, rise };
};
const toScreen = (f: number, x: number, y: number) => {
  const c = camera(f);
  return { x: CX + (x - c.fx) * c.k, y: c.ay + (y - c.fy) * c.k + c.rise };
};

const Composer: React.FC<{ f: number }> = ({ f }) => {
  const c = camera(f);
  const at = toScreen(f, CARD.x, CARD.y);
  const frame = clipFrame(f);
  const jumped = fd(f) >= JUMP;
  // After the press: the card leans back a little and recedes, then from FLIP it flips away and falls into the drop.
  const lean = prog(f, PRESS, FLIP, E.out);
  const flip = f < FLIP ? 0 : 2 * (Math.pow(1.1, f - FLIP) - 1);
  const rx = Math.min(86, -5 * lean + flip);
  const recede = lmix(1, 0.95, prog(f, PRESS, DROP, E.linear));
  const fall = accel(f, FLIP, 0, 1.1, 1);
  // The press sends a shimmer across the card, and the sentence leaves its row upward as it is sent.
  const sweep = prog(f, PRESS + 2, PRESS + 28, E.pan);
  const sent = prog(f, PRESS + 1, PRESS + 11, E.exit);
  const band = 760;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${at.x}px, ${at.y + fall}px) scale(${c.k})` }}>
      {/* The vanishing point sits on the phase names, so the film's own type stays upright while the card tilts. */}
      <div style={{ position: 'relative', width: CARD.w, height: CARD.h, perspective: 1600, perspectiveOrigin: `${LABEL_X}px 50%` }}>
        <div style={{ position: 'relative', width: CARD.w, height: CARD.h, borderRadius: 38, overflow: 'hidden', boxShadow: '0 30px 90px rgba(0,0,0,.42), 0 6px 18px rgba(0,0,0,.2)', transformOrigin: '50% 50%', transform: `rotateX(${rx.toFixed(3)}deg) scale(${recede.toFixed(5)}) scaleX(${(1 + 0.05 * lean).toFixed(5)})` }}>
          <Clip id="design-compose" frame={frame} width={1920} height={1080} style={{ transformOrigin: '0 0', transform: `translate(${-CARD.x}px, ${-CARD.y}px)` }} />
          {!jumped && (
            <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${-CARD.x}px, ${-CARD.y}px)` }}>
              <CaretFix f={f} px={1 / c.k} />
            </div>
          )}
          {/* The jump: the prompt's row, its own crop of the same frame, grown from its left end. After the send it empties and the phase names tick in it. */}
          {jumped && (
            <div style={{ position: 'absolute', left: 0, top: 0, width: ROW.w, height: ROW.h, overflow: 'hidden', transformOrigin: `${ROW.textX - ROW.x}px ${ROW.midY - ROW.y}px`, transform: `translate(${ROW.x - CARD.x}px, ${ROW.y - CARD.y}px) scale(${ROW_K})` }}>
              {sent > 0 && <Clip id="design-compose" frame={frame} width={1920} height={1080} style={{ transformOrigin: '0 0', transform: `translate(${-ROW_EMPTY_X}px, ${-ROW.y}px)` }} />}
              {sent < 1 && (
                <div style={{ position: 'absolute', left: 0, top: 0, width: ROW.w, height: ROW.h, overflow: 'hidden', transform: `translateY(${(-sent * ROW.h).toFixed(3)}px)` }}>
                  <Clip id="design-compose" frame={frame} width={1920} height={1080} style={{ transformOrigin: '0 0', transform: `translate(${-ROW.x}px, ${-ROW.y}px)` }} />
                  <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${-ROW.x}px, ${-ROW.y}px)` }}>
                    <CaretFix f={f} px={1 / (c.k * ROW_K)} />
                  </div>
                </div>
              )}
              <PhaseTick f={f - PHASE_AT} step={PHASE_STEP} x={ROW.textX - ROW.x} y={(ROW.h - Math.round(27 * 1.37)) / 2} size={27} align="left" />
            </div>
          )}
          {/* The orb has left the card: its place simply empties into the card's own ground (r8: no film-drawn socket
              disc, no rim). The take's orb is 74 px wide (clip x 1780-1853); the ground around it is flat FIELD out to
              the model pill (1757) and the card's edge (1860), so an 84 px disc of FIELD covers it with margin. */}
          {f >= SWAP && <div style={{ position: 'absolute', left: 0, top: 0, width: 84, height: 84, borderRadius: 42, background: FIELD, transform: `translate(${ORB.x - CARD.x - 42}px, ${ORB.y - CARD.y - 42}px)` }} />}
          {sweep > 0 && sweep < 1 && (
            <div style={{ position: 'absolute', left: 0, top: 0, width: band, height: CARD.h, opacity: 0.11, background: `linear-gradient(90deg, transparent, ${C.mist} 20%, ${C.white} 55%, transparent)`, transform: `translateX(${mix(-band, CARD.w, sweep).toFixed(2)}px)` }} />
          )}
        </div>
      </div>
    </div>
  );
};

// The hand: comes up for the chip and leaves the frame before the typing, comes back for the orb, and leaves down and
// right on the press. The first visit rises from below the frame onto the moving chip, all but settled on the press,
// and is out of frame (its top under 1080) before it is dropped at CHIP_AT + 30.
const Hand: React.FC<{ f: number }> = ({ f }) => {
  const chip = toScreen(f, CHIP.x, CHIP.y);
  const orb = toScreen(Math.min(f, PRESS), ORB.x, ORB.y);
  if (f < CHIP_AT + 30) {
    const y = glide(f, 2, 540, 0, 0.82) + accel(f, CHIP_AT + 6, 0, 1.2, 2);
    return <BigCursor white x={chip.x + 6} y={chip.y + 10 + y} press={pressAt(f, CHIP_AT)} size={84} />;
  }
  if (f < SWING - 28) return null;
  const away = accel(f, PRESS + 2, 0, 1.15, 3);
  const y = glide(f, SWING - 28, 620, 0, 0.9) + away;
  const x = glide(f, SWING - 28, 220, 0, 0.9) + 0.6 * away;
  return <BigCursor white x={orb.x + 10 + x} y={orb.y + 14 + y} press={pressAt(f, PRESS)} size={84} />;
};

// The film's orb: from SWAP it is the take's orb, riding the card (whose lean only starts on the press); from the press
// it drops out of the card's socket first, clear of the model label, then drifts left to the hand's pivot.
const ORB_FROM = toScreen(PRESS, ORB_C.x, ORB_C.y);
const orbAt = (f: number) =>
  f < PRESS
    ? toScreen(f, ORB_C.x, ORB_C.y)
    : {
        x: CX + (ORB_FROM.x - CX) * glide(f, PRESS + 5, 1, 0, 0.93),
        y: CY + (ORB_FROM.y - CY) * glide(f, PRESS + 1, 1, 0, 0.87),
      };

export const Compose: React.FC = () => {
  const f = useCurrentFrame();
  const d = f - DROP;

  // The plate clears across the riser: soft light in the quiet, a real horizon on the drop.
  const sharp = prog(f, PRESS + 6, DROP + 6, E.smooth);
  const plateY = mix(-60, 0, sharp) - f * 0.06 + glide(f, 0, RISE / 3, 0, RISE_K);
  const plateK = lmix(1.2, 1.04, prog(f, 0, DROP + 40, E.cam));

  // Orb: the take's own orb on screen until the press, squeezed on the cursor's press pulse, then it grows as it drifts
  // to the pivot; its arrow turns one revolution as it deals.
  const orbR = f < PRESS ? TAKE_ORB_R * camera(f).k : glide(f, PRESS, TAKE_ORB_R * K_PRESS, 62, 0.86);
  const dip = pressAt(f, PRESS);
  const turn = d <= 0 ? 0 : 360 * (1 - Math.pow(0.92, d));
  const orb = orbAt(f);

  const exitT = exitAt(f);
  // The door (crit7 #19). The orb keeps its arrow at full ink until it opens. The hole opens at the orb's own radius,
  // so there is never a hollow ring or a point of light: on IRIS_AT the hole is exactly under the full orb, and on
  // IRIS_AT + 1 the disc and its arrow are gone together (r8: a cut, no half-way grey frame), while the hole grows on one
  // geometric curve to the frame's far corners (1305 px from the pivot). Decided on fd, so the master's sub-frames
  // cannot fade it. crit8: it opens big (IRIS_V0 on its first step, xIRIS_K a frame: r 62 -> 102, 150, 208, 277, 360,
  // 459, 579, 722, 894, 1101, 1348): the old first steps (8.8 px, x1.145: 71, 81, 92, 105 ...) left a disc the orb's
  // own size for 6 frames, read as the orb turning into a grey bubble. Corners on IRIS_AT + 11 (abs 2226), 13 f before
  // the cut; doorZoom is not touched (1.05 on the act's last frame, x0.895 log steps across the 2239/2240 seam).
  const openR = f < IRIS_AT ? 0 : orbR + accel(f, IRIS_AT, 0, IRIS_K, IRIS_V0);
  const orbO = fd(f) <= IRIS_AT ? 1 : 0;
  const handScale = lmix(1, 1.12, prog(f, PUSH_AT, EXIT, E.cam)) * lmix(1, 2.1, exitT); // the hand pushes in around the orb through the hold

  const dealF = d + 3; // the leader is out 3 f before the drop and whole on the drop's own frame
  const rIn = 400 + (1 - Math.pow(0.9, Math.max(0, d))) * 20;
  const stage = Math.max(mix(0.22, 0.02, sharp), 0.45 * prog(f, DROP, DROP + 20, E.smooth)); // the plate gives way to the hand

  // The pre-drop plate's soft copy blurs the image itself, which overhangs the frame, so the frame's edges never pull in the dark.
  const softPlate = (px: number, opacity: number) => (
    <div style={{ position: 'absolute', inset: 0, opacity }}>
      <Plate name="cloudsea" y={plateY} k={plateK} origin="50% 85%" filter={`blur(${px}px)`} />
    </div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, background: C.ink, overflow: 'hidden' }}>
      <Plate name="cloudsea" y={plateY} k={plateK} origin="50% 85%" />
      {sharp < 1 && softPlate(26, 1 - sharp)}
      <div style={{ position: 'absolute', inset: 0, background: C.ink, opacity: stage }} />

      {f < DROP + 4 && <Composer f={f} />}

      {/* The hand: fully lit, no text over it (Leon, Nov 3: the images play on their own after the design card). */}
      <Deal f={dealF} cx={CX} cy={CY} rIn={rIn} scale={handScale} out={exitT} face={slotFace} />

      {f >= SWAP && f < IRIS_AT && <Orb x={orb.x} y={orb.y} r={orbR} turn={turn} dip={dip} fill={orbFill(prog(f, SWAP, SWAP + HOVER, E.ui))} />}

      {f < DROP && <Hand f={f} />}

      {/* Through the orb: Hvit's own entrance, filmed frame by frame. At zoom 1.87 the hole's centre looks into the
          aerial's harbour under the white town, already sharp (crit8: DOOR starts at take f42, past the take's own focus
          pull); the zoom ends at 1.05 on the act's last frame, where Sites carries the same take and zoom on (at 1.05
          Hvit's headline is whole). */}
      {f >= IRIS_AT && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', clipPath: `circle(${openR}px at ${CX}px ${CY}px)` }}>
          <SitesDoor fAbs={A + f} zoom={doorZoom(f)} />
        </div>
      )}
      {f >= IRIS_AT && orbO > 0 && <Orb x={orb.x} y={orb.y} r={openR} turn={turn} />}
    </div>
  );
};
