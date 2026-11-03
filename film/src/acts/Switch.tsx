import React from 'react';
import { Img, useCurrentFrame } from 'remotion';
import { Clip, stillUrl } from '../fx/kit';
import { clamp, E, fd, lmix, mix, prog } from '../lib/anim';
import { ACT, W } from '../timeline';
import type { Sound } from './Sound';

// The switch, told in the chat itself, after the card has said it (Leon, Nov 3: "show it full screen, not like
// panned to the right ... keep the conversation ... show that in the chat"). The frame is the chat column at full
// width: `switch-banner` is the column at 848 CSS px and DPR 2.264, so it is 1920 px wide, and the frame is a band
// of it with the conversation above and the composer at the bottom. No film text, no film cursor, no dot. Four
// states, each one entered on a beat; the app's own frames carry everything in between:
//   0-56    the model picker, open above the composer's trigger where the app puts it: the list scrolls up from
//           Cursor and Antigravity to Codex, GPT-6-Astra is hovered, and the press on 48 checks it;
//   56      the shelf: "Your next message switches this chat to Codex. The conversation so far goes with it.";
//   84      the prompt typed; Enter on 91 (a 16th) lands it in the chat, then "Switched to Codex · gpt-6-astra";
//   112     Codex's reply streams, "Picking up from Claude Code: ...", under the same conversation, to the cut.
// The camera is one axial push about the column's centre line (x1.04 over the act), never a pan.
// Units: "banner px" are the banner clip's CSS px. Both takes were filmed from one viewport, so the picker clip
// (DPR 4.672) shares them: its origin sits at OX, OY.

const DPR = 1920 / 848; // the banner clip's device px per CSS px
const APP_BG = 'rgb(15,15,15)'; // lint-ok: the app's own chat surface, sampled at the clip's edges, so the band has no edge on the stage
const BANNER = 'switch-banner';
// The history comes from a second take, the same layout to the pixel, where the answer took a believable time
// ("Worked for 1m 46s", not "for 2s").
const BANNER_HISTORY = 'switch-banner2';
const PICKER = 'switch-picker';

// The camera: banner point PIVOT sits on screen point SCREEN, and the frame pushes about it. At K0 the column is
// 1882 px wide (the composer 63 px in from each side); the push ends at DPR x 1.02, so the take is never
// enlarged more than 2% past its own pixels.
const PIVOT = { x: 424, y: 600 };
const SCREEN = { x: W / 2, y: 640 };
const K0 = DPR / 1.02;
const PUSH = 1.04;

// The beat map (local frames; a beat is 28 f).
const DUR = ACT.switch.dur; // 140
const PRESS = 48; // GPT-6-Astra takes the check
const SHELF_AT = 56; // beat: the picker has closed, the shelf is up
const TYPED_AT = 84; // beat: the prompt is typed
const ENTER = 91; // the 16th after: sent
const REPLY_AT = 112; // beat: Codex answers

// ---- The picker (switch-picker, its own coordinates) ----
const OX = 421; // the picker clip's origin in banner px (viewport crops 780.5,425 and 359.5,36)
const OY = 389;
const PANEL = { x: 57, y: 10, w: 298, h: 321, r: 12 }; // the popover inside the picker clip
const PICKER_COMPOSER = 285; // the composer's top inside the picker clip
// The list through the wheel is one tall still (footage/stills/switch-list.png, the real list at full height) on a
// continuous transform: the clip's own wheel moved in whole rows. In the picker clip's coordinates; S is the app's
// own scrollTop.
const LIST = { x: 57, y: 11, w: 298, h: 745, top: 39.5, bottom: 257, fade: 24 };
const LIST_BG = 'rgb(26,26,26)'; // lint-ok: the popover's own surface, sampled from the still
const LIST_ROWS = [57, 85, 113, 141, 200, 228, 256, 284, 343, 371, 430, 458, 486, 514, 542, 601, 629, 657, 685, 713]; // tops, switch-list.json
const ROW_H = 28;
const S_CURSOR = 384; // the Cursor group at the top of the list, Antigravity's heading at its foot
const S_ASTRA = 161.85; // where the real clip's list rests from frame 222 (GPT-6-Astra's row about 40 below the list's top)
const ASTRA_ROW = 4; // LIST_ROWS index of GPT-6-Astra
const S_FROM = S_CURSOR - 6; // a breath of room above the Cursor heading on the first frame
const WHEEL = { from: 2, to: 34 }; // up past Grok to Codex, on the pan curve: a soft start, the long settle
const HOVER_AT = 35; // the list is still: the row under the (unseen) pointer takes the hover
const LIST_END = 38; // the real frames take over, identical: the list at S_ASTRA, GPT-6-Astra hovered
const PICK_HOLD = 252; // picker clip: GPT-6-Astra hovered, the search field's caret off (246-256 differ only in that caret)
const PICK_CHECK = 257; // picker clip: the check mark lands on GPT-6-Astra (the take's press is 252; 253-256 are its latency)
const PICK_COMPOSER_MAX = 256; // the picker clip's composer stops here: from 257 its shelf rises on its part of the bar only
const scrollAt = (f: number) => mix(S_FROM, S_ASTRA, prog(f, WHEEL.from, WHEEL.to, E.pan));
/** Picker clip frame at local frame f (decided on fd): held on the hover, then the check from the press on. */
const pickerFrame = (f: number) => (fd(f) < PRESS ? PICK_HOLD : PICK_CHECK + (fd(f) - PRESS));

// ---- The chat (switch-banner) ----
const BANNER_IDLE = 300; // the composer idle with no shelf and its caret off (the picker phase's bar)
const BANNER_SHELF = 20; // the shelf up, the field not focused (frames 11-60 are one image)
const BANNER_TYPED = 234; // "Fix it and add a regression test", its caret on: held solid, not blinking
const BANNER_ENTER = 236;
const BANNER_SWITCHED = 247; // "Switched to Codex · gpt-6-astra" is in; the shelf has gone
const BANNER_REPLY = { from: 356, to: 398 }; // "Picking up from" -> the first line whole with its period (x1.5)
/** The banner frame at local frame f, decided on fd. Before 236 only the composer strip uses it. */
const bannerFrame = (f: number) => {
  const g = fd(f);
  if (g < SHELF_AT) return BANNER_IDLE;
  if (g < TYPED_AT) return BANNER_SHELF;
  if (g < ENTER) return BANNER_TYPED;
  if (g < REPLY_AT) return BANNER_ENTER + (g - ENTER);
  return fd(mix(BANNER_REPLY.from, BANNER_REPLY.to, (f - REPLY_AT) / (DUR - REPLY_AT)));
};

// The take's caret blinks on irregular frames (the capture's virtual clock), which reads as a flashing line. After
// the send it is covered with the same pixels from 240, where it is off: the field rests with no caret.
const CARET = { frame: 240, x: 35.6, y: 685, w: 4, h: 26 };

// The chat plane: plane px are the banner clip's CSS px before the send, so the history sits at its own y. The
// take's own scrolls are undone (its rows are rigid on the plane) and the plane scrolls by dP instead, for this
// shorter frame: the history rests above the shelf, and after the send the plane rises until the reply sits above
// the composer with Claude Code's code and its last line still in view.
const HIST = { frame: 214, y: 46, h: 304 }; // switch-banner2: the first question to the timestamp row
const SEAM = 350; // plane px: the history ends here; below it everything comes from the live take
const SPLIT = 472; // plane px: between "Switched to Codex" (bottom 449.6) and the Working row (top 481.4)
const LIVE_BOTTOM = 636; // clip px: the live crops stop above the shelf's top (638.7)
const SENT_FRAME = 300; // the sent rows at rest: the bubble and "Switched to Codex"
// The take's scroll to the new turn, device px from Enter (banner 236) on: measured on the history's rows and
// then the bubble (to 674 = 297.7 CSS px at 264). Its curve also times the plane's own, shorter scroll.
const SEND_SCROLL = [22, 81, 151, 226, 299, 362, 421, 468, 507, 541, 568, 591, 609, 622, 634, 643, 649, 656, 661, 663, 665, 668, 670, 670, 672, 672, 672, 672, 674];
const sendScroll = (lf: number) => (lf < BANNER_ENTER ? 0 : SEND_SCROLL[Math.min(lf - BANNER_ENTER, SEND_SCROLL.length - 1)]);
const SENT_OFF = SEND_SCROLL[SEND_SCROLL.length - 1] / DPR; // 297.7
// The take's second scroll as the reply starts: the Working row's top in device px, 339 on (410 at rest from 264).
const WORKING_REST = 410;
const REPLY_TOPS = [410, 401, 380, 353, 326, 299, 274, 253, 235, 219, 208, 197, 190, 183, 176, 174, 170, 167, 165, 163, 163, 161, 161, 161, 158];
const workingTop = (lf: number) => (lf < 339 ? WORKING_REST : REPLY_TOPS[Math.min(lf - 339, REPLY_TOPS.length - 1)]);
// "for 1s" after "Working" (device x 248-317): a running timer reads as a speed number, so it is covered with the
// chat's own surface and only "Working" shows. Plane px; the row stands 50 px higher until "Switched to Codex" is in.
const TIMER = { x: 106, w: 46, pre: { y: 428.4, h: 24 }, post: { y: SENT_OFF + 416 / DPR - 3, h: 22 } };
// The plane's offset (banner px = plane px + dP).
const DP_PRE = 280; // the history from 337 to 623: under the band's top, 16 px clear of the shelf
const DP_POST = 114; // the band's top falls between the answer and its "ts" label; the reply ends 27 px over the composer
const SETTLE = 21; // f after Enter: the take's curve, normalised so the plane is at rest on the reply's beat
const dPAt = (f: number) => {
  const t = f - ENTER + 1; // index into [0, ...SEND_SCROLL]: 0 on the frame before Enter
  if (t <= 0) return DP_PRE;
  const at = (i: number) => (i <= 0 ? 0 : SEND_SCROLL[Math.min(i - 1, SETTLE)] / SEND_SCROLL[SETTLE]);
  const i = Math.floor(t);
  return mix(DP_PRE, DP_POST, Math.min(1, mix(at(i), at(i + 1), t - i)));
};
// The strip at the bottom (shelf and composer) is the take's own; the plane fades out over 14 px above it.
const SHELF_TOP = 632; // the strip with the shelf (its top at 638.7)
const BARE_TOP = 668; // the composer alone (its top at 674.9)
const FADE = 14;

export const SWITCH_SOUND: Sound[] = [
  { f: PRESS, kind: 'click-low', weight: 0.5, pan: 0.3 }, // the check lands on GPT-6-Astra (the picker is right of centre)
  { f: ENTER, kind: 'enter', weight: 0.4 }, // sent: the prompt lands in the chat
];

/** A rectangle of a clip, drawn at its place in the clip's own coordinates (moved down by `top`). */
const Crop: React.FC<{ id: string; frame: number; x: number; y: number; w: number; h: number; r?: number; top?: number; style?: React.CSSProperties }> = ({ id, frame, x, y, w, h, r = 0, top = 0, style }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, borderRadius: r, overflow: 'hidden', transform: `translate(${x}px, ${y + top}px)`, ...style }}>
    <Clip id={id} frame={frame} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${-x}px, ${-y}px)` }} />
  </div>
);

export const Switch: React.FC = () => {
  const f = useCurrentFrame();
  const g = fd(f);

  const k = lmix(K0, K0 * PUSH, clamp(f / DUR));
  const lf = bannerFrame(f);
  const live = g >= ENTER;
  const shelfUp = g >= SHELF_AT && (!live || lf < BANNER_SWITCHED);
  const stripTop = shelfUp ? SHELF_TOP : BARE_TOP;
  const dP = dPAt(f);
  const planeMask = `linear-gradient(rgb(0,0,0) ${stripTop - FADE}px, rgba(0,0,0,0) ${stripTop}px)`;

  // The live rows: until the reply, one crop below the seam with the take's first scroll undone; from the reply on,
  // the sent rows at rest (frame 300) and the Working row and the reply from the live frame, its second scroll undone.
  const s1 = sendScroll(lf) / DPR;
  const s2 = (SEND_SCROLL[SEND_SCROLL.length - 1] + WORKING_REST - workingTop(lf)) / DPR;
  const timer = lf < BANNER_SWITCHED ? TIMER.pre : TIMER.post;

  const picker = g < SHELF_AT;
  const pf = pickerFrame(f);
  const scroll = scrollAt(f);
  const pickerMask = 'linear-gradient(90deg, rgba(0,0,0,0), rgba(0,0,0,1) 44px)'; // the picker clip's left edge melts into the bar under it

  return (
    <div style={{ position: 'absolute', inset: 0, background: APP_BG, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${SCREEN.x}px, ${SCREEN.y}px) scale(${k}) translate(${-PIVOT.x}px, ${-PIVOT.y}px)` }}>
        {/* The conversation. It fades out just above the strip, so rows scroll in from behind the composer. */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: 848, height: 782, overflow: 'hidden', WebkitMaskImage: planeMask, maskImage: planeMask }}>
          <div style={{ position: 'absolute', left: 0, top: 0, transform: `translateY(${dP}px)` }}>
            <Crop id={BANNER_HISTORY} frame={HIST.frame} x={0} y={HIST.y} w={848} h={HIST.h} />
            {live && lf < 339 && <Crop id={BANNER} frame={lf} x={0} y={SEAM - s1} w={848} h={LIVE_BOTTOM - (SEAM - s1)} top={s1} />}
            {live && lf >= 339 && (
              <>
                <Crop id={BANNER} frame={SENT_FRAME} x={0} y={SEAM - SENT_OFF} w={848} h={SPLIT - SEAM} top={SENT_OFF} />
                <Crop id={BANNER} frame={lf} x={0} y={SPLIT - s2} w={848} h={LIVE_BOTTOM - (SPLIT - s2)} top={s2} />
              </>
            )}
            {live && <div style={{ position: 'absolute', left: 0, top: 0, width: TIMER.w, height: timer.h, background: APP_BG, transform: `translate(${TIMER.x}px, ${timer.y}px)` }} />}
          </div>
        </div>

        {/* The strip: the take's own shelf and composer, in place. */}
        <Crop id={BANNER} frame={lf} x={0} y={stripTop} w={848} h={782 - stripTop} />
        {live && <Crop id={BANNER} frame={CARET.frame} x={CARET.x} y={CARET.y} w={CARET.w} h={CARET.h} />}

        {/* The picker: the right part of the bar from its own take (the trigger reads Opus 5.5), and the popover above it. */}
        {picker && (
          <>
            <Crop id={PICKER} frame={Math.min(pf, PICK_COMPOSER_MAX)} x={0} y={PICKER_COMPOSER} w={411} h={393 - PICKER_COMPOSER} style={{ transform: `translate(${OX}px, ${OY + PICKER_COMPOSER}px)`, WebkitMaskImage: pickerMask, maskImage: pickerMask }} />
            <div style={{ position: 'absolute', left: 0, top: 0, width: 411, height: 393, transform: `translate(${OX}px, ${OY}px)` }}>
              <Crop id={PICKER} frame={pf} x={PANEL.x} y={PANEL.y} w={PANEL.w} h={PANEL.h} r={PANEL.r} />
              {g < LIST_END && (
                <div style={{ position: 'absolute', left: 0, top: 0, width: LIST.w, height: LIST.bottom - LIST.top, overflow: 'hidden', background: LIST_BG, transform: `translate(${LIST.x}px, ${LIST.top}px)` }}>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      WebkitMaskImage: `linear-gradient(rgb(0,0,0) calc(100% - ${LIST.fade}px), rgba(0,0,0,0))`,
                      maskImage: `linear-gradient(rgb(0,0,0) calc(100% - ${LIST.fade}px), rgba(0,0,0,0))`,
                    }}
                  >
                    <div style={{ position: 'absolute', left: 0, top: 0, width: LIST.w, height: LIST.h, transform: `translateY(${LIST.y - LIST.top - scroll}px)` }}>
                      <Img src={stillUrl('switch-list')} style={{ display: 'block', width: LIST.w, height: LIST.h }} />
                      {g >= HOVER_AT && <Img src={stillUrl(`switch-list-hover-${ASTRA_ROW}`)} style={{ position: 'absolute', left: 0, top: 0, width: 294, height: ROW_H + 4, transform: `translate(2px, ${LIST_ROWS[ASTRA_ROW] - 2}px)` }} />}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
