import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C } from '../brand/tokens';
import { CLIPS } from '../data/clips';
import { BigCursor, Clip, Plate, pressAt } from '../fx/kit';
import { decay, E, fd, glide, lmix, mix, prog, tw } from '../lib/anim';
import { ACT, b, H, W } from '../timeline';
import type { Sound } from './Sound';

// The quick run: four short shots of real UI after Skills. r8 (Leon's notes on preview 6, Nov 3):
// split and limits follow their centred cards (Card.tsx) and play full screen with no text. crit8: review
// has no line either (text before footage: it was the only line of the second half drawn over picture); its own result
// lines, Committed, Pushed and Opened pull request, say it. Update has no line, the app says it. NO DOTS: the film's dot
// that typed, hopped, was the full stop and pressed the hourglass is gone, and so are the hairline, the seams it
// crossed and the caption band. The pointer that presses is the film's cursor (BigCursor) on the take's own path, so
// every real hover lines up; it leaves once it has pressed.
const DUR = { split: ACT.split.dur, limits: ACT.limits.dur, review: ACT.review.dur, update: ACT.update.dur };

/** A per-frame path (one [x, y] per clip frame from c0), read at a fractional clip frame. */
const onPath = (path: [number, number][], c0: number, c: number) => {
  const u = Math.max(0, Math.min(path.length - 1, c - c0));
  const i = Math.min(path.length - 2, Math.floor(u));
  const t = u - i;
  return { x: mix(path[i][0], path[i + 1][0], t), y: mix(path[i][1], path[i + 1][1], t) };
};

/** A rectangle of a clip (CSS px) taken from one fixed frame, laid over the same place: removes a blinking caret. */
const Patch: React.FC<{ id: string; from: number; x: number; y: number; w: number; h: number }> = ({ id, from, x, y, w, h }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, transform: `translate(${x}px, ${y}px)`, overflow: 'hidden' }}>
    <Clip id={id} frame={from} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${-x}px, ${-y}px)` }} />
  </div>
);

// The dark stage of review is not flat: one cold plate far out of focus, drained of the dawn's warmth so no tan glow
// survives, overscanned so the blur never pulls the edges in. It drifts with the act.
const DarkPlate: React.FC<{ f: number; y?: number }> = ({ f, y = 0 }) => <Plate name="cloudsea" k={1.3} x={-0.5 * f} y={y - 0.3 * f} filter="blur(90px) brightness(.5) saturate(.18)" />;

const Stage: React.FC<{ bg: string; plate?: { f: number; y?: number }; children: React.ReactNode }> = ({ bg, plate, children }) => (
  <div style={{ position: 'absolute', inset: 0, background: bg, overflow: 'hidden', isolation: 'isolate' }}>
    {plate && <DarkPlate {...plate} />}
    {children}
  </div>
);

// ---------------------------------------------------------------------- split
// The card has said it ("Run two chats side by side."); the footage shows it full screen, with no text. The whole
// `split2` window (the retake of `split` with the page clock ahead, so no timer reads as a speed) fills the frame's
// height from under the titlebar's toggle icon to the window's bottom edge, centred; its own edge columns continue it
// out to the frame's sides, so it reads as one wider window, not a picture on a stage. The take runs at 1x: the context
// menu is open and the pointer comes onto "Open beside" (local 0 = clip 127), presses it on local 23 (clip 150), and
// the second chat opens beside the first on local 28 (clip 155) = b(30,1), a beat. Both chats stream to the cut
// (clip 239). The camera is one slow axial push, 1 -> 1.025, about a point on the real divider; the limit keeps the
// panes' titles and both composers whole, with the same margin above and below. crit8: the pointer fades out as soon as
// it has pressed (SP_GONE), so nothing draws the eye off the two chats; the take's later move down across the left chat
// to the divider is not drawn.
const SP_CLIP = 'split2';
const SP_C0 = 127;
const SP_PRESS = 150; // meta openBeside: the pointer's down frames are 150-154
const SP_OPEN = 155; // meta splitAppears
const SP_Y0 = 25; // CSS: under the titlebar's toggle icon (y 11.8-22.7); the titlebar strip and the panes' top border stay
const SP_Y1 = 818; // the window's bottom edge
const SP_S = H / (SP_Y1 - SP_Y0); // 1.362
const SP_W = CLIPS[SP_CLIP].w * SP_S;
const SP_X = (W - SP_W) / 2; // 68: the window centred
const SP_DIV = 783; // CSS: the real divider between the panes
const SP_PIVOT = { x: SP_X + SP_DIV * SP_S, y: 750 }; // with the push's 1.025, 12 px stay above the titles and below the composers
const SP_PUSH = 1.025;
const SP_POINTER = 22; // CSS px: the pointer at about its real size in the app
const SP_SIDEBAR = 'rgb(19,19,19)'; // lint-ok: the sidebar's own ground (#131313), sampled from the take's PNGs
// The identity card (avatar, name, meter and gear; CSS 7.7-247.7 x 763.6-810.5) under the sidebar's own ground.
const SP_CARD = { x: 5, y: 761, w: 247, h: 53 };
// The browser caret in the right composer (CSS 825-826 x 723.6-743.6) blinks at random under the capture's virtual
// clock from the split on (Leon: no flashing caret). A patch of the same place from clip 236, a frame with the caret off,
// covers it: the patch is identical to every caret-off frame of 155-250, so only the caret goes, and it is wide enough
// that the downscale's filter cannot leak the caret's light past its edges.
const SP_CARET = { x: 814, y: 716, w: 26, h: 36, from: 236 };
if (ACT.split.from + SP_OPEN - SP_C0 !== b(30, 1)) throw new Error('Quick: the split must appear on b(30,1)');

// The take's own pointer (meta.cursor, CSS px), one entry per clip frame where it moves; it rests between them.
const SP_PATH_A: [number, number][] = [
  [100.2, 334.7], [100.7, 334.9], [101.7, 335.2], [103.3, 335.8], [105.8, 336.6], [109.2, 337.8], [113.7, 339.2], [119.5, 341.0],
  [126.9, 343.0], [135.9, 345.2], [146.7, 347.5], [157.7, 349.4], [166.8, 350.7], [174.4, 351.5], [180.5, 352.0], [185.2, 352.4],
  [188.8, 352.6], [191.4, 352.7], [193.1, 352.8], [194.1, 352.8], [194.7, 352.8], [194.9, 352.8], [194.9, 352.8],
]; // clip 120-142: onto "Open beside", where it rests through the press
// The pointer fades out on E.smooth from the press's release (clip 158, local 31) and is not drawn from SP_GONE (clip
// 170, local 43), a few frames after the second chat opens (clip 155); the take's own pointer only leaves its rest on 176.
const SP_FADE = 158;
const SP_GONE = 170;

/** One CSS column of a clip stretched sideways over `width` px: the window's own edge continued to the frame's edge. */
const EdgeFill: React.FC<{ id: string; frame: number; col: number; left: number; width: number; s: number; y0: number }> = ({ id, frame, col, left, width, s, y0 }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width, height: H, transform: `translateX(${left}px)`, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1, height: CLIPS[id].h, overflow: 'hidden', transformOrigin: '0 0', transform: `scale(${width}, ${s}) translateY(${-y0}px)` }}>
      <Clip id={id} frame={frame} style={{ position: 'absolute', left: 0, top: 0, transform: `translateX(${-col}px)` }} />
    </div>
  </div>
);

export const Split: React.FC = () => {
  const f = useCurrentFrame();
  const cf = SP_C0 + f;
  const k = lmix(1, SP_PUSH, f / DUR.split);
  const p = onPath(SP_PATH_A, 120, cf);
  const right = SP_X + SP_W;
  return (
    <div style={{ position: 'absolute', inset: 0, background: SP_SIDEBAR, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${SP_PIVOT.x}px ${SP_PIVOT.y}px`, transform: `scale(${k})` }}>
        <EdgeFill id={SP_CLIP} frame={cf} col={0.5} left={-40} width={SP_X + 41} s={SP_S} y0={SP_Y0} />
        <EdgeFill id={SP_CLIP} frame={cf} col={CLIPS[SP_CLIP].w - 1.5} left={right - 1} width={W - right + 41} s={SP_S} y0={SP_Y0} />
        <div style={{ position: 'absolute', left: 0, top: 0, width: CLIPS[SP_CLIP].w, height: CLIPS[SP_CLIP].h, transformOrigin: '0 0', transform: `translate(${SP_X}px, ${-SP_Y0 * SP_S}px) scale(${SP_S})` }}>
          <Clip id={SP_CLIP} frame={cf} />
          <div style={{ position: 'absolute', left: 0, top: 0, width: SP_CARD.w, height: SP_CARD.h, transform: `translate(${SP_CARD.x}px, ${SP_CARD.y}px)`, background: SP_SIDEBAR }} />
          {fd(cf) >= SP_OPEN && <Patch id={SP_CLIP} {...SP_CARET} />}
          {fd(cf) < SP_GONE && <BigCursor x={p.x} y={p.y} size={SP_POINTER} press={pressAt(cf, SP_PRESS)} opacity={1 - prog(cf, SP_FADE, SP_GONE, E.smooth)} white />}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------- limits
// One popup, large and centred, already in place on the cut with its bars still filling: the first frame after the card
// reads, like every other card exit. Cursor's rows are taken out of the surface by a splice,
// so the rows close up. crit8: the popup is 2.4x (was 3.6x, which
// made the move a 2570 px climb in four ticks and an exit run into the cut), so Claude Code, Codex and Grok read at once
// on the cut, framed on the popup's top edge; two calm beat-long ticks on the 16ths, half the travel each, then bring
// Antigravity up until the popup's foot sits as far above the frame's foot as its top sat below the frame's top. It
// settles 24 px on the cut, rests from local 77 and the cut lands on a still frame. No tilt: the footage stays square.
const LM = { s: 2.4, x0: 960 - 115 * 2.4, popX: 13, popY: 149, w: 230, h: 816, cutA: 157, cutB: 308, r: 12 };
const LM_CUT = LM.cutB - LM.cutA;
const LM_SURF = LM.h - LM_CUT; // CSS: the popup's height with Cursor's rows spliced out (665; 1596 px on screen)
const LM_TOP = 64; // px: the popup's top edge once the cut's settle is done
const LM_END = H - LM_TOP - LM_SURF * LM.s; // px: its top edge at the end (-580), the foot 64 px above the frame's foot
const LM_TICKS: [number, number][] = [
  [14, 42], // b(32,0,2) -> b(32,1,2): Codex and Grok come up, Antigravity's header into frame
  [49, 77], // b(32,1,3) -> b(32,2,3): Antigravity whole, the popup's foot in frame; at rest from 77 to the cut (84)
];
// The take's clip frame: 74 is the first with every label at rest (the popup's own fade-in is over by 70 and its text
// settles by 74, measured on the PNGs); its bars keep filling at 1x until about 100.
const LM_C0 = 74;
const LM_C1 = 110;
const lmY = (f: number) => {
  const step = (LM_TOP - LM_END) / LM_TICKS.length;
  return LM_TOP + glide(f, -2, 24, 0, 0.87) - LM_TICKS.reduce((v, [a, z]) => v + step * prog(f, a, z, E.tick), 0);
};

export const Limits: React.FC = () => {
  const f = useCurrentFrame();
  const cf = Math.min(LM_C0 + fd(f), LM_C1);
  const y = lmY(f);
  const segH = LM.cutA - LM.popY;
  return (
    <Stage bg={C.paper}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: LM.w, height: LM_SURF, transformOrigin: '0 0', transform: `translate(${LM.x0}px, ${y}px) scale(${LM.s})`, borderRadius: LM.r, background: C.ink, boxShadow: '0 8px 22px rgba(0,0,0,.26), 0 2px 6px rgba(0,0,0,.16)' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: LM.r, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, transform: `translateY(${segH - 0.5}px)`, width: LM.w, height: LM_SURF - segH + 0.5, overflow: 'hidden' }}>
            <Clip id="limits" frame={cf} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${-LM.popX}px, ${0.5 - LM.cutB}px)` }} />
          </div>
          <div style={{ position: 'absolute', left: 0, top: 0, width: LM.w, height: segH, overflow: 'hidden' }}>
            <Clip id="limits" frame={cf} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${-LM.popX}px, ${-LM.popY}px)` }} />
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ---------------------------------------------------------------------- review
// Real results in hard cuts, each held long enough to read, in a window hung from the top right. Shot 0 is the commit
// message going in as the pointer presses "Commit 4 files"; then the result lines, Committed, Pushed and Opened pull
// request #214, each large in the window. White only: the accent means "needs you", and nothing in a finished commit,
// push or pull request does. crit8: no caption (text before footage), so no band under the window: it runs past the
// frame's foot and the footage has the frame; the result lines carry the sentence.
const RV_WIN = { x: 96, h: H + 100, r: 30 }; // its lower edge stays under the frame's foot even while it settles in
const RV_WIDE = { s: 2.6, tx: RV_WIN.x - 130 * 2.6, ty: -30, fx: 960, fy: 300 };
// The result row large and high in the window, the tab and branch rows above it; the pane's left edge
// (css 131) on the window's, the clip's top edge above the frame.
const RV_LINE = { s: 5, tx: RV_WIN.x - 131 * 5, ty: -2, fx: RV_WIN.x + 175, fy: 503 };
type RvShot = { at: number; c0: number; c1: number; view: typeof RV_WIDE; cur?: { x0: number; y0: number; x1: number; y1: number; c0: number; c1: number; press: number } };
const RV: RvShot[] = [
  { at: 0, c0: 226, c1: 260, view: RV_WIDE, cur: { x0: 776, y0: 224, x1: 750, y1: 201, c0: 226, c1: 246, press: 254 } }, // the message in, Commit 4 files
  { at: 14, c0: 266, c1: 294, view: RV_LINE }, // Committed
  { at: 35, c0: 350, c1: 378, view: RV_LINE }, // Pushed
  { at: 56, c0: 552, c1: 594, view: RV_LINE }, // Opened pull request #214
];
const RV_HITS = [RV[1].at, RV[2].at, RV[3].at];
// The browser caret after "idempotent" (CSS 366.9-368 x 99.9-115.1) toggles every 2 clip frames, and shot 0 plays the
// take at 2.4x, so it flashed (Leon: no flashing caret). A patch from clip 229 (caret off) covers it; the patched
// place is identical in every caret-off frame of 224-263, so nothing else changes.
const RV_CARET = { x: 360, y: 95, w: 14, h: 25, from: 229 };

// The window settles up into place on the cut (48 px on the house glide: 28 px and 4.5 px/f left on the cut, under
// 2 px by the first result line) and then hangs still: no drift, and no exit move, so the cut into update lands on a
// resting window. Only each shot's own slow creep about its result line runs to its cut.
const rvRise = (f: number) => glide(f, -3, 48, 0, 0.84);
const rvShotAt = (f: number) => {
  const n = fd(f);
  let i = 0;
  while (i < RV.length - 1 && RV[i + 1].at <= n) i++;
  return i;
};
/** Shot i's camera at frame f: each shot settles from a touch close and keeps creeping about what it looks at. */
const rvCam = (f: number, i: number) => {
  const v = RV[i].view;
  const t = f - RV[i].at;
  const z = lmix(1.032, 1, decay(t, -1, 0.8)) * (1 + 0.0009 * t);
  return { s: v.s * z, tx: v.fx + (v.tx - v.fx) * z, ty: v.fy + (v.ty - v.fy) * z };
};

export const Review: React.FC = () => {
  const f = useCurrentFrame();
  const n = fd(f);
  const i = rvShotAt(f);
  const st = RV[i];
  const end = i < RV.length - 1 ? RV[i + 1].at : DUR.review;
  const cf = mix(st.c0, st.c1, (f - st.at) / (end - st.at));
  const cfd = mix(st.c0, st.c1, (n - st.at) / (end - st.at));
  const { s, tx, ty } = rvCam(f, i);
  const rise = rvRise(f);
  const cur = st.cur;

  return (
    <Stage bg={C.void} plate={{ f, y: 150 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: RV_WIN.h + 60, transform: `translate(${RV_WIN.x}px, ${rise - 60}px)`, borderRadius: RV_WIN.r, overflow: 'hidden', background: C.ink, boxShadow: '0 30px 80px rgba(0,0,0,.42), 0 8px 22px rgba(0,0,0,.24)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `translate(${-RV_WIN.x}px, 60px)` }}>
          <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
            <Clip id="review" frame={cfd} />
            {i === 0 && <Patch id="review" {...RV_CARET} />}
          </div>
          {cur && <BigCursor x={tx + tw(cf, cur.c0, cur.c1, cur.x0, cur.x1, E.pan) * s} y={ty + tw(cf, cur.c0, cur.c1, cur.y0, cur.y1, E.pan) * s} size={64} press={pressAt(cf, cur.press)} white />}
        </div>
      </div>
    </Stage>
  );
};

// ---------------------------------------------------------------------- update
// No caption: the app says it itself. The sidebar's footer, large on the paper. On the cut the pointer is already on
// the hourglass badge with its "2" (clip 138); it presses on local 3 (clip 141) and the real menu opens above it by
// local 14 (clip 152, see UP_DIP): "Installs when 2 chats finish". The take then holds (clip 175, the last frame before its
// pointer leaves the badge) and only the camera moves: one slow axial push, nothing slides.
// The panel is the sidebar alone (its border at 256.3 and the chat beyond it stay out), cut in the gap under "Nightly
// invoice export" so the status dots of the rows above stay out of frame, and it hangs from above the frame's top edge.
// crit7 #15a: the profile row's avatar, name, meter and "48% left" are under the card's own ground (the clean column
// between "48% left" and the gear, stretched over them, so even the menu's shadow on the card carries on), so the card
// reads as an empty profile row with its gear; the update badge stays.
const UP = {
  c0: 138,
  press: 141, // meta press2
  hold: 175, // the clip's pointer leaves the badge on 176
  w: 256, // CSS: the sidebar, without its border (256.3) and the chat beyond it
  y0: 68, // CSS: the gap between "Nightly invoice export" (to y 60) and the next row (from y 77)
  y1: 228, // the window's bottom edge
  s: 5.6,
  bottom: 880, // px: the panel's lower edge on the cut; its top edge (y0) is then 16 px above the frame
  push: 1.04,
  badge: { x: 228, y: 197 }, // CSS: the badge's centre
  pivot: { x: 228, y: 140 }, // CSS: the push's fixed point, on the badge's line in the middle of the menu, so the menu's top stays clear of the frame's edge
  pointer: { x: 224, y: 203, size: 20 }, // on the badge, its tip by the hourglass so the "2" stays clear
};
const UP_LEFT = W / 2 - (UP.w / 2) * UP.s;
const UP_TOP = UP.bottom - (UP.y1 - UP.y0) * UP.s;
const UP_PIVOT = { x: UP_LEFT + UP.pivot.x * UP.s, y: UP_TOP + (UP.pivot.y - UP.y0) * UP.s };
// The cover: inside the card's border (the card is CSS 7.9-203.9 x 174-219.4, corner radius about 14), from its left
// end to x 168, short of the gear (175); the ground is the clip's own column 166-170 at the same rows.
const UP_COVER = { x: 10, y: 177, w: 158, h: 41.5, r: 11.5, col: 166, colW: 4 };
// The menu fades in over clip 147-150 and settles 2.3 CSS up by 153 ([opacity, its top border's y], measured on the
// PNGs). Above it the next row ("Trace the payout webhook", from y 77) would peek out as a 3 CSS sliver of glyph tops
// at the frame's top edge, which reads as a broken crop. That sliver goes under the sidebar's own ground (its clean band
// at y 74-76, stretched down to the menu's border), faded in with the menu, so the row leaves with the rest of it.
const UP_MENU: Record<number, [number, number]> = { 147: [0.5, 83.6], 148: [0.75, 82.4], 149: [0.875, 81.3], 150: [1, 80.6], 151: [1, 80.4], 152: [1, 80.2] };
const UP_SLIVER = { x: 30, w: 205, y: 76.5, src: 74, srcH: 2, from: 147, settled: [1, 80.05] as [number, number] };
// crit8: the take's menu fades in over the chat rows (clip 147-151: the rows still show through it on 150 and faintly
// on 151, measured on the PNGs), so for several frames two layers of text overlapped. The film skips those frames and
// opens the menu in two clean steps: the rows the menu will cover go under the sidebar's own ground (local 8-11, the
// take held on clip 146), then the menu's first clean frame (clip 152) fades in on that empty ground (local 11-14),
// held through the fade, and from local 14 the take runs on its own clock again (local 14 = clip 152). Outside the menu
// box the two frames are the same pixels (max difference 8 levels, measured), so only the menu fades.
const UP_DIP = { from: 8, ground: 11, menu: 14, rows: 146, first: 152 };
if (UP.c0 + UP_DIP.menu !== UP_DIP.first) throw new Error('Quick: the update menu must rejoin the take on its own clock');
const UP_ROWS = { x: 24, y: 76.5, w: 226, h: 96.5 }; // CSS: the rows the menu covers, x 24-250, y 76.5-173, short of the card's border (174)
const UP_GROUND = 'rgb(18,18,18)'; // lint-ok: the sidebar's own ground under the rows (18-19 in the take's PNGs)

const SliverCover: React.FC<{ frame: number }> = ({ frame }) => {
  const c = fd(frame);
  if (c < UP_SLIVER.from) return null;
  const [o, edge] = UP_MENU[c] ?? UP_SLIVER.settled;
  const h = edge - UP_SLIVER.y;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: UP_SLIVER.w, height: h, transform: `translate(${UP_SLIVER.x}px, ${UP_SLIVER.y}px)`, overflow: 'hidden', opacity: o }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: UP_SLIVER.w, height: UP_SLIVER.srcH, overflow: 'hidden', transformOrigin: '0 0', transform: `scaleY(${h / UP_SLIVER.srcH})` }}>
        <Clip id="update" frame={frame} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${-UP_SLIVER.x}px, ${-UP_SLIVER.src}px)` }} />
      </div>
    </div>
  );
};

const ProfileCover: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: UP_COVER.w, height: UP_COVER.h, transform: `translate(${UP_COVER.x}px, ${UP_COVER.y}px)`, overflow: 'hidden', borderTopLeftRadius: UP_COVER.r, borderBottomLeftRadius: UP_COVER.r }}>
    <div style={{ position: 'absolute', left: 0, top: 0, width: UP_COVER.colW, height: UP_COVER.h, overflow: 'hidden', transformOrigin: '0 0', transform: `scaleX(${UP_COVER.w / UP_COVER.colW})` }}>
      <Clip id="update" frame={frame} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${-UP_COVER.col}px, ${-UP_COVER.y}px)` }} />
    </div>
  </div>
);

/** One frame of the take with its covers: the profile row always, the sliver over the next row once the menu is in. */
const UpFrame: React.FC<{ frame: number; opacity?: number; children?: React.ReactNode }> = ({ frame, opacity = 1, children }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: CLIPS.update.w, height: CLIPS.update.h, opacity }}>
    <Clip id="update" frame={frame} />
    <ProfileCover frame={frame} />
    <SliverCover frame={frame} />
    {children}
  </div>
);

export const Update: React.FC = () => {
  const f = useCurrentFrame();
  const n = fd(f);
  const local = UP.c0 + f; // the take's own clock: the press
  const rows = Math.min(local, UP_DIP.rows); // up to the dip: the take at 1x, then held on its last frame without the menu
  const menu = Math.min(UP_DIP.first + Math.max(0, f - UP_DIP.menu), UP.hold); // the menu's first clean frame through its fade, then the take's own clock
  const ground = prog(f, UP_DIP.from, UP_DIP.ground, E.ui);
  const menuIn = prog(f, UP_DIP.ground, UP_DIP.menu, E.ui);
  const k = lmix(1, UP.push, f / DUR.update);
  return (
    <Stage bg={C.paper}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${UP_PIVOT.x}px ${UP_PIVOT.y}px`, transform: `scale(${k})` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: UP.w, height: UP.y1 - UP.y0, transformOrigin: '0 0', transform: `translate(${UP_LEFT}px, ${UP_TOP}px) scale(${UP.s})`, borderRadius: 5, background: C.ink, boxShadow: '0 6px 18px rgba(0,0,0,.26), 0 2px 5px rgba(0,0,0,.14)' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: CLIPS.update.w, height: CLIPS.update.h, transform: `translateY(${-UP.y0}px)` }}>
              {n < UP_DIP.menu && (
                <UpFrame frame={rows}>
                  {n > UP_DIP.from && <div style={{ position: 'absolute', left: 0, top: 0, width: UP_ROWS.w, height: UP_ROWS.h, transform: `translate(${UP_ROWS.x}px, ${UP_ROWS.y}px)`, background: UP_GROUND, opacity: ground }} />}
                </UpFrame>
              )}
              {n > UP_DIP.ground && <UpFrame frame={menu} opacity={menuIn} />}
              <BigCursor x={UP.pointer.x} y={UP.pointer.y} size={UP.pointer.size} press={pressAt(local, UP.press)} white />
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
};

export const QUICK_SOUND: Record<'split' | 'limits' | 'review' | 'update', Sound[]> = {
  // The pointer presses "Open beside" (left, on the sidebar), then the second chat opens on the right, on b(30,1).
  split: [
    { f: SP_PRESS - SP_C0, kind: 'click-low', weight: 0.5, pan: -0.5 },
    { f: SP_OPEN - SP_C0, kind: 'swish', weight: 0.6, pan: 0.3 },
  ],
  limits: [], // the music carries the cut from its card
  // One very soft, short, low click per result line (Committed, Pushed, Opened pull request), on its first frame: the
  // lines still cut in on RV_HITS with the caption gone, so the clicks stay. No toggles, no tonal confirm (Leon, Nov 2).
  // At 0.25 the click peaks about 1 dB under the music's RMS here.
  review: RV_HITS.map((f, i) => ({ f, kind: 'click-low', weight: 0.25, pan: [-0.4, -0.15, 0.1][i] })),
  // The pointer presses the hourglass badge (right of centre).
  update: [{ f: UP.press - UP.c0, kind: 'press', weight: 0.8, pan: 0.45 }],
};
