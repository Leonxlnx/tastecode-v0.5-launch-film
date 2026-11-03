# TasteCode v0.5 film: the text motion system

This round changes how the on-screen words move. It does not change what they say. Every line in `src/timeline.ts` COPY stays exactly as Leon approved it.

**Round 8 (Nov 3, Leon's notes on preview 6):** the second half of the film is now told as centred cards: the sentence alone on black, then the footage full screen with no text. The cards' grammar is the section "Cards" below. In section 4, the sections for Redrawn, Calm, Dash, Switch, Quick (q-commands, q-split, q-limits, q-review) and Lockup carry preview 6's frames and lines and are superseded by it. So are sections 6 and 7 and Appendix A. Compose has a round-8 block, with preview 6's one-look text kept below it. The round-8 frames are in `src/timeline.ts`; where a frame here differs from `timeline.ts`, `timeline.ts` is right.

This is the director's synthesis of three designer proposals (A: typographic craft, B: text in the world, C: rhythm and variety) and the frame audit of the current film. It replaces the film's one gesture, `fx/Sentence.tsx`. Today every line uses it: words rise out of a clip box, blurred, warming from grey, and lift out the same way.

All frames are absolute at 60 fps unless marked "local". `b(bar, beat, sub)` is the grid in `timeline.ts`. Every number marked "measured" comes from the act's own maths. Those numbers were run in a scratch script (Inter Tight metrics from the real variable WOFF2, the house beziers, and each act's camera and curve functions). The full table is in Appendix A.

---

## 0. Why this synthesis wins

- **It keeps the craft of A and the logic of B and C.** A brought the arrival: a word sets whole and then settles in weight, spacing and ink, with no vertical travel, no blur and no clip. Nothing can ever show half a glyph. B made the picture own every exit it can. C made sure no two neighbouring lines move the same way, and gave the film a row that closes. That row is the iz1 R1 elastic word row, the best text move in Leon's references, and it makes the two "Every..." sentences rhyme.
- **It is one house system.** There are five named techniques and one component, `fx/Line.tsx`, which every copy line uses. The decaying curve is the one the whole film already moves on (mt1's "one easing family"), so the text and the picture read as one hand.
- **It fixes every issue in the audit.** That includes four HIGH issues: the name spilling under the band, the olive accent, the cramped hero kerning, and the brand name misspelling itself as the wordmark reveals. The scrim letterbox (HIGH) and "a title slide on an empty card" (HIGH) are also fixed.
- **It is light to render.** It is transforms, opacity, colour and font-weight on about 40 spans per line. The only filters are constant-radius blur on picture copies, through the existing RackFocus. No animated filter touches type.

---

## 1. How the three proposals scored

Each line was scored against six questions: does it look like the best of Leon's reference films; is it clean with no gimmick; is it readable; does it fit the picture and the beat; does it belong to one house system; and does it obey Leon's taste and the bans.

| Line | Winner | Grafted from the others | Rejected, and why |
|---|---|---|---|
| hook-a | C: the camera snap pulls the row together | A: weight and ink settle; B: no creep in the hold | A's screen-fixed type is clean but static on the film's first showpiece. B's exhale is too small to read. |
| hook-b | C: a one-frame type step on the punch, re-centred inside the jump | A: comma-relay handover and ink-only exit on the release; B: x-height midline locked | C's velocity relay reads as a slot machine at the comma, which is the audit's own complaint. |
| name | C: the band clears the name, which then exists whole | A: the hit-weight settle, and the version struck on b(4,2); B and C: the band blinks shut on the name | A's two-frame shutter strip shows a T without its crossbar ("l"), which breaks the half-glyph rule. |
| rebuilt | B: struck on the drop, then "interface" in the dot's wake, then the period | A: hero settle amounts and the lift into the frame edge; B: the falling dot plunges on E.in | C's 1.08 lens settle on the hero reads as a camera zoom. A's word cadence ignores the drop. |
| needs | A and C (they agree): a cadence, then "needs you." born yellow on b(9,3) | B: optional pulse on the row's own dot | A ramp from grey into yellow, which is the olive bug. |
| redrawn | C: the halves lock on the seal's strike | A and B: Appearance takes the line by occlusion; A: settle on arrival | A's EXPOSE (a blurred ghost plus a light sweep) reads as the AI "shimmer text" trope and puts blur on type. |
| calm-a | A: the last word struck on the stream's first token (measured 1478) | B and C: the token-tail feel, which SET already gives | C's 1470 start leaves the opening 14 f of the breakdown with no text, and its exit relay is the slot machine again. |
| calm-b | A: comma relay; words step on the fold and the second streamed line | | C's lens-blur exit is blur on type. B's empty-frame breath does nothing. |
| one-look | C: the row closes with a ritardando, rhyming with hook-a | A and C: rack focus replaces the scrim; B: "one look." as one phrase unit; B: exit carried before the orb opens | A and C's orb-hole exit leaves "Every … look." visible at the frame ends for 4-5 frames (measured), a different phrase. |
| dash | A and C: "too." as a pickup into the flip | Polarity carry kept | B's carried exit breaks the hold rule unless "too." loses its beat. |
| switch-a | C: a caret opens into the slot; A: hard glyph swaps; A: the tail closes on a glide | The detents are cut to the three existing ticks (2366, 2382, 2394) | B's relay that rises in from Dash. The reel's spring roll, which shows two half icons. |
| switch-b | A: relay; "conversation." struck on the send | Layer lift into the cut kept | |
| q-commands | B: two chunks, on the typed "/" and on the highlight reaching /skills | All: whole and still into the cut | A's 7-word burst in 7 f reads as one pop. |
| q-split | C: the line splits around the divider and parts with the panes | A: SET ink on arrival | A's phrase seam is clean but the least visual. |
| q-limits | All agree: whole on the cut | A: a short weight settle | |
| q-review | All agree: present in mute, each phrase lit by its git result | C: the colour step has exactly one mid frame | |
| wordmark | B: rides the mark's edge at the lockup gap | A and mk1 E7: ink resolves before position, plus a weight settle | Any wipe or mask on the brand name. |
| platforms | A: one unit on b(31,1), with no vertical move | Clamped to STILL | B and C's 10-22 px rise ticks in whole pixels at 44 px. |

Techniques rejected outright:

- **EXPOSE** (a ghost line plus a light sweep). It is blur on type, it can show the lit prefix as a phrase on its own, and it reads as a shimmer.
- **Velocity-matched word relay.** It changes words in flight with no comma beat, which is a slot machine.
- **"Pass the lens"** (scale up and fade). It is a generic fade.
- **Empty-frame breath.** The comma pause is better shown on the comma word itself.
- **Exits by the orb hole or by Appearance where the edge is slow.** These leave partial phrases on screen.

---

## 2. House rules (binding for every copy line)

1. **Whole glyphs, whole words.** No copy sits in a clip box. A word exists in full from its first drawn frame. An edge may cross readable ink only in two cases: (a) the picture's own aperture (the Eclipse band), and only on frames where it already clears the whole ink box, or (b) an opaque picture element whose edge crosses the line's ink band in 2 frames or fewer at 40 px/f or more (relative). Any other exit must clear the ink before contact.
2. **Settle the type, not its position.** An arrival is heavier, looser and dimmer, and it condenses to rest. Read text never travels vertically: headless Chromium snaps vertical text to whole pixels. The only vertical text moves are a whole-block lift that starts at 2 px/f or more (rebuilt) and moves carried by the picture.
3. **3 px/f.** A glyph at ink 0.75 or more moves 3 px/f or less on screen, or that frame's offset is decided on `fd(f)`. The master's 240-degree sub-frame pass smears moving type, and smeared type is blur on type. Its samples sit within ±1/3 f of the frame, so an offset computed on `fd(f)` puts every sample in one place and the glyph stays sharp (it steps instead of smearing). This is the only way read type may move faster than 3 px/f; no line is exempt (crit6).
   - **Line does it for you.** For every glyph at ink `SET.inkFast` (0.75) or more, `fx/Line` measures the frame's speed `|x(F + 0.5) − x(F − 0.5)|·zoom` over everything Line moves (SET close-up and spread, the ROW driver, DRAIN) and, above `SET.vmax` (3), draws the glyph's `fd(f)` state on that frame. Pass `zoom` when a parent scales the line (Redrawn's plane, Compose's lean).
   - **A `wrap` is not stepped.** A wrap is the camera or the picture carrying the whole line, and it smears with the picture (the windows in Section 7). An act offset outside Line that carries read type fast uses `stepFast(o)` from `lib/anim.ts`.
4. **No CSS blur on type. No blur ramps anywhere.** Motion smear comes only from the master's 240-degree sub-frame pass (`blur.ts`). Defocus is used only on the picture (Compose), as a constant-radius copy that is cross-faded in.
5. **Discrete state on `fd(f)`.** Onsets, layout switches, glyph swaps and colour steps are decided on `fd(f)`, so every motion-blur sub-sample of a frame agrees. Settles run on continuous `f`, except the frames rule 3 decides on `fd(f)`.
6. **The accent is born, never mixed.** "needs you." is #F2C94C at opacity 1 on its strike frame. `mixColor` never has `C.accent` as an endpoint (add this as a lint rule). Other colour changes are OKLab steps between neutrals (mute to white, white to ink).
7. **Timing is a ritardando, not a stagger.** Base gaps are 2 to 4 f. The payoff word or phrase lands 2.5 to 4 times later, on a named picture event or a beat, and **never more than 16 f after the last setup word** (crit7: a longer hang reads as a keyword waiting for its partner). After that it is dead still.
8. **Holds are still.** All 0.05-0.12 px/f creeps are removed (Calm, Quick, Switch). The picture moves around still type. A line alone in the frame breathes only with its own camera (the Eclipse push, the Redrawn plane, the Compose lean).
9. **One exit per line**, owned by the picture wherever possible. No two neighbouring lines leave the same way, except inside the quick run, where the hard cut is the meter.
10. **One size ladder.** Title 190 (the name). Hero 151-157 (rebuilt), with track from `heroTrack(size)`. Display 112, fitted down only when space forces it: redrawn about 100 (the cell), switch about 70 (the popover, flagged). Display promoted by a punch: 122 (hook-b). Caption 84 at x 96, top 928, including hook-a and hook-b before the punch, which are centred. Wordmark 96. Secondary 44.

---

## 3. The five techniques

### SET: strike and settle (the house entrance)

**From the references:** mt1 O (letter settle with a curved leading edge), iz1 R1 (hard appear, then the gap closes), eep E10's type that arrives decided, mk1 E8's ink tail, and wi3 E11's tight collision. It is done on the variable weight axis and on spacing instead of on y.

**Unit.** The onset is per word, or per phrase unit such as "needs you." or "We rebuilt the". The settle is per glyph. Every glyph of a word is drawn from the word's onset frame (`fd(f) >= onset`). Glyph `j` starts its settle `0.6·j` f later, which gives a curved leading edge across the word, but nothing is ever missing.

**Per glyph**, with `t = f − onset − 0.6·j` clamped at 0 or more:

| Property | Curve | Notes |
|---|---|---|
| ink (opacity of the final colour) | `1 − (1 − o0)·0.72^t` | `o0` is **0.85 on dark stages and 0.8 on light ones** (crit6 #5; it was 0.42 / 0.55, which read as word-by-word grey fades). A setup word strikes decided, white-ish, and condenses through the weight settle and the glyph spread. Ink is 0.85, 0.89, 0.92, 0.94 and 0.96 at t = 4 on dark (0.96 at t = 5 on light). Hit, born and cut-in words use `o0` of 0.7 to 1. Grey is kept only where it means something: q-review's lit phrases. |
| weight | `rest + H·0.80^t` | Rest is 500 (secondary 450). H = 100 for setup words, 150 for hit words, 60-80 for quiet cut-ins. Each glyph is drawn centred on its **rest** advance, so the line never reflows. |
| word close-up | `dx_word = C·0.80^t` (t of the word's first glyph) | **C is about 15 px on screen** at every size: caption 0.18 em, display 0.13 em, hero 0.10 em, title 0.08 em. That is 3.0 px/f on the first frame. C = 0 when a ROW driver or a type step owns the x motion. |
| glyph spread | `dx = (j − c)·S·size·0.80^t` about the word's centre index `c` | S = 0.03 em (caption), 0.025 (display), 0.02 (hero and title). Gaps only close, so words never touch on arrival. |

All curves are the house geometric decay: `1 − decay(f, s, 0.80)` and `1 − decay(f, s, 0.72)`. There is no bezier, no overshoot, no vertical move, no blur and no clip.

**Speed check (measured on `lineFrame`, crit6 round):** every glyph is at ink 0.75 or more from its onset now, so rule 3 applies from the first frame. A 15 px close-up moves 3.06 px/f on its first whole frame; a catch-up close-up (up to 27 px on a 2-4 f cadence) moves up to 5.5 px/f; the hook snap carries "Every" at 11 px/f. Line's guard decides every such frame on `fd(f)` (typically a setup word's first 1-3 frames, up to 6 on a catch-up), so the glyph steps sharp, then settles on continuous `f` under 3 px/f. With the guard, no read glyph smears more than 1.8 px inside a master frame on any line checked (hook, calm, switch, one-look, needs, dash, q-commands, q-split, rebuilt); without it the worst would be 6.5 px (hook-a) and 2.3-2.9 px on the catch-up close-ups.

**Onset tables** come from `ritard(at, [g, g, …, G])`, with base gaps g of 2-4 f and a payoff gap G of 2.5-4 × g, or from explicit picture-event frames imported from the act.

**Resolved** = the last setup onset + 5 f (`SET.read.setup`, ink 0.96 on both stages; it was + 8 at `o0` 0.42), or the hit frame if the last unit is a hit, whichever is later.

**Modes** (one component, chosen per unit):
- **setup**: `o0` from the stage (0.85 dark, 0.8 light), H = 100.
- **hit**: `o0` = 1, H = 150. The unit lands on a picture event at full ink.
- **born**: a hit in `C.accent`, used only for "needs you.".
- **cut-in**: every word onsets on the cut frame (or 2 f after it), with a 0.5 f ripple, `o0` 0.7-1, H 60-100.
- **lit**: the whole line is present at `C.mute` from its onset with `o0` = 1. On its own event frame each phrase steps mute → white in OKLab over 3 f (0.5, 0.85, 1.0, decided on `fd`) and settles in weight 600 → 500 at k 0.80. This is the same signature as a hit word landing.

**Implementation**
- `lib/measure.ts` gets `glyphLayout(text, size, weight, trackEm)`. Use one hidden span holding one text node, with `whiteSpace: pre`, `fontKerning: normal`, `fontVariantLigatures: none`, `fontFeatureSettings: '"calt" 0'`, `fontVariantNumeric: tabular-nums` and the role's letterSpacing.
  - For each UTF-16 index, set a `Range` and take `getBoundingClientRect().left − span.left`. That is the kerned x of every glyph. The advance is the next x minus this x (for the last glyph, its rect width).
  - Measure at the rest weight and at rest + 150 (`advHeavy`). Return a word index, `j` and the word's centre index per glyph.
  - Cache in a Map keyed `text|size|weight|track`, like `measureTracked`. Call it only under FontGate.
- `fx/Line.tsx` exports `<Line id text f size role color align plan anchor />`.
  - It renders a wrapper `div` with `data-text={id}`, sized to the measured width × `size·lead`, so `scripts/layout-audit.sh` still reads true bounds.
  - Inside it, one absolutely positioned span per non-space glyph: `left 0, top 0, letterSpacing 0` (positions already include tracking), `transform: translateX(x)` only, numeric `fontWeight`, `opacity` and `color`.
  - Centring a glyph on its rest advance: `x + (adv − mix(adv, advHeavy, (w − rest)/150))/2`.
  - Every span shares the wrapper's line box, so there is never a vertical transform.
- `lib/anim.ts` gets the tokens `SET = { k: 0.80, kInk: 0.72, o0: { dark: 0.85, light: 0.8 }, H: { setup: 100, hit: 150 }, lag: 0.6, closeUpPx: 15, spread: { caption: 0.03, display: 0.025, hero: 0.02 }, vmax: 3, inkFast: 0.75, read: { setup: 5, cut: 2, lit: 2 } }`, plus `ritard(at, gaps)`, `stepFast(o)` and `lineTimes(plan)`, which returns `{in, resolved, out, clears}`. `fx/Line.tsx` exports `lineFrame(props, layoutOf)`, the same maths without React (every drawn glyph's x, ink, weight, colour and whether rule 3 stepped it), for Node checks.
- Pitfalls:
  - Never put `will-change` on glyph spans.
  - Keep tabular-nums and `calt` off in both measure and render, or "v0.5" shifts.
  - With negative track a glyph overhangs its advance. That is harmless, because nothing clips.
  - About 40 spans a line is negligible.
  - Inter Tight Variable covers 100-900, so 587.3 is a real instance. FACES needs no new entries, because it is one variable file.

### ROW: the row closes (centred showpieces)

**From the references:** iz1 R1 (word shove with collapsing gaps: "the row reads as one elastic object"), onx R15 (words flanking an object), and wi3 E10/E11.

**Unit:** whole words, or two halves of the line, at their final kerned positions. **Glyph size is never scaled**; only the spacing moves. Word centre `x_i` (relative to anchor `A`, normally the line centre at 960) is drawn at `A + (x_i − A)·s(f)`. SET runs per word on top, with C = 0.

**Drivers:**
- **camera (hook-a)**: `s(f) = exp(0.35·tight(f))`, where `tight(f) = ln 2.2·(1 − prog(f, 49, 61, E.dolly))` is only the snap component of Hook's camera. `s` is exactly 1 from f61, so there is no creep in the hold.
- **close (one-look)**: `s(f) = 1 + 0.10·0.91^(f − first onset)`. The edges move 5.8 px/f on the first frame, 3 px/f or less from t = 7, and are within 0.7% by the payoff.
- **lock (redrawn)**: two halves split at the phrase seam, each offset `±d·(1 − E.glide(prog(f, arrive, lock)))` outward, with d = 0.18 em. They land exactly on the lock frame, with one word space. Peak 2.9 px/f (measured: 18 px over 21 f).
- **shove (first built for one-look, crit7 #3a; the cards used it in crit7 and dropped it in crit8, see "Cards": no act uses it now)**: `rowShove(onsets, k 0.78, gap 1.2 em, edge?)`, iz1 R1's elastic row. The **visible** row stays centred on the anchor (align 'center'; its left or right edge for those aligns). Each new step (one onset: a word or a phrase unit) strikes whole, 1.2 em past its rest gap, and shoves the earlier words left.
  - Per drawn frame Fd, with steps i = 0..m struck by Fd and rem_i = settleRem(f, at_i, 0.78): every visible word sits at `T_m + Σ_i (T_(i−1) − T_i)·rem_i`, plus `gap·size·rem_i` for each step at or before its own.
  - `T_i = h·(inkR of the line's last word − inkR of step i's last word)`, h = 0.5 centred. So the visible ink is centred on the anchor whenever the row is at rest, and the last step leaves the row at the line's own rest layout.
  - Every term only falls: no word ever moves right after its strike, and nothing overshoots. All of it rests exactly 16 f after the last step.
  - `edge` (default the right safe margin, W − SAFE.x, read through the parent's `zoom` about the frame centre) caps a strike that would leave the frame: the gap shrinks to the room left.
  - Which steps are visible is decided on Fd, so a strike never leaks into the frame before it.
  - A strike moves 40-60 px/f on its first frame (at 112 px), falling about 22% a frame. Line's rule-3 guard draws every such frame on fd(f), so the steps are sharp. Pair it with units at the stage's setup ink or more: the strike is the shove, no grey precedes it.
  - Proof (crit7): TextLab S3 as it was then (`out/qa/fix7/lab-s3-in-sheet.png`), and the six card windows in `out/qa/r8/cards-*`.
- **part (q-split)**: the inverse. The two halves move outward from one word space to 1.2 em, each half by `42·(1 − 0.92^t)` px. That is 3.2 px/f on frame 1 (measured), then falling.

**Implementation:** a `row` field in the Line plan: `{ anchor: number, s: (f) => number }` for close and camera, `{ split: wordIndex, offset: (f) => number }` for lock and part, or `{ shove: { onsets, k, gap, edge? } }` for the shove (Line resolves it against the layout and throws if `onsets` disagree with the units' distinct onsets). It applies one `translateX` per word group. There are no new curves; all use `glide`, `decay`, `prog` and `E.glide` from `lib/anim.ts`.

### RELAY: the comma relay (a two-part sentence at one anchor)

**From the references:** iz1 R1's exit and re-entry of a phrase, mt1 P (exit by tracking), and the conveyor idea from A. It replaces today's up-out, up-in reel at the comma (audit LOW: "slot machine").

**Recipe** (hook, and the two-part cards: calm, switch, skills):
- **The wave (crit7 #13).** With a comma, the whole of part A waits the **breath** (4 f for captions, 6 f for centred and display lines). Then it DRAINs as one left-to-right wave, 1 f apart in reading order, each word over 9 f: word w starts on `A.out + w·gap + breath − gap` (`drainStart` in lib/anim.ts).
- The comma word is the last of the wave, so it never stands alone at full ink ("use,", "work,", "agent," read as keywords when only they waited).
- The wave ends on the same frame as before, so `relayAt` and every B onset are unchanged. COPY's `out` is the wave's first frame, `A.out + breath − 1`: hook-a 133, calm-a 1549, switch-a 2602, skills-a 2945.
- B's first word strikes (SET) **on the first frame the comma word is gone**: `DRAIN.lead = DRAIN.dur` = 9 f after the comma word starts draining, at the far left of the anchor. The two parts never share a frame, so no frame mixes them into a phrase.
  - Changed in the crit6 round. The first build struck B 4 f into the comma's drain, at comma ink 0.6, and the frame read as one mixed phrase: "step  work," (Calm 1548-1551), "and  agent," and "and keep  agent," (Switch 2484-2488). Hook had already worked around it locally (B_WAIT); with the token fixed, Hook drops B_WAIT and lands on the same 145.
  - The comma word's drain is the breath the eye reads as the comma; B arrives on its clear, so the handover is continuous (no empty frame) and one part at a time.
- B then sets on its own ritardando and strikes its payoff on the act's event.
- A and B share one size and one anchor. Everything moves left: A drifts left as it drains, and B closes up leftward. One belt, with a visible comma.

**Helper:** `relayAt(aOut, nA, breath) = aOut + (nA − 2)·DRAIN.gap + breath + DRAIN.lead`, with `DRAIN.lead = DRAIN.dur = 9`. That is B's first onset. Results (preview 6; the round-8 cards are in the section "Cards"):

| relay | aOut | words in A | breath | comma drains | relayAt (B's first onset) | was |
|---|---|---|---|---|---|---|
| hook | 128 | 4 | 6 | 136-144 | **145** | 140 (+ B_WAIT 5 = 145) |
| calm | 1538 | 4 | 4 | 1544-1552 | **1553** | 1548 |
| switch | 2470 | 6 | 6 | 2480-2488 | **2489** | 2484 |

**Guard (asserted in code):** B's word 0 right ink edge + 0.3 em must be left of the comma word's left ink edge. Measured: 180 px clear on Hook, about 470 on Calm, about 640 on Switch. Since B now strikes only once the comma is gone the guard can no longer bite at `relayAt`; it stays as a check for any act that strikes B earlier, which no act may do.

### DRAIN: the house exit

**From the references:** mt1 P (letter-spacing opens as it goes) and eep E7's expo release. This is the inverse of SET.

**Per word**, 1 f apart in reading order, with `t` from its start, over 9 f:
- ink 1 → 0 on `E.smooth(t/9)` (zero slope at both ends, so no pop; never E.in, which is the trap documented in `Words.tsx`)
- weight rest → 400 on `E.in`
- glyph spread opens by `(j − c)·0.04 em·(1.25^t − 1)/(1.25^9 − 1)`
- the word drifts left: `−4.5·(size/84)·(1.25^t − 1)` px. That is 1.1 px/f at t = 0, 2.7 px/f at ink 0.5, and 6 px/f on the last frame at ink 0.03.

Total length = 9 + (n − 1) f (with a comma, breath − 1 more before the wave starts). There is no vertical move, no mask and no blur, so no fragments like "IVIOVE" can appear.

**Carried variant:** when the picture carries the line (a camera release, the hand flying apart), use ink and weight only, with no drift and no spread, so there is only one motion.

**Implementation:** `plan.out = { at, kind: 'drain' | 'carried', comma?: { breath } }`. It is applied on top of the settled SET state. The line stops rendering on the first `fd(f)` where every word's ink is 0.

### HANDOFF: the picture takes or gives the line

Seven recipes. Each is the only motion on its line at that moment.

- **(a) Aperture.** The Eclipse band is the name's only mask: a screen-space `clipPath: inset(cy − bh, 0, H − cy − bh, 0)` from the act's own `bh(f)`.
  - A glyph is drawn only from the first frame where `bh(f) >= inkHalf·s(f) + 4`. Measured: local 44, abs 380. Frames 378-379 show an empty white strip, so a T without its crossbar never shows.
  - Closing: the band shuts on `E.in` over 7 f. The ink is whole on every frame until the shut frame (measured half-heights 155 → 113 → 1 px against an ink half of 71).
- **(b) Type step on a punch** (eep E10: type ×1.48 while the card is ×1.06). On the punch frame, decided on `fd`, the line switches to its full layout at ×1.452 (84 → 122 px), re-centred about `(960, baseline − 0.273 em)`, so the x-height midline is locked. The world steps only ×1.187 on that frame (measured) and keeps settling. The type is dead still from that frame on.
- **(c) Lift.** The whole line, punctuation included, lifts as one block on `accel(f, out, 0, 1.13, 2)`: 2 px/f on the first frame (past single-pixel steps), about 50 px/f as it leaves the frame top about 27 f later. No mask and no CSS blur; the master smears the last frames.
- **(d) Occlusion.** An opaque picture element passes in front of a held line. It is allowed only if its edge crosses the line's ink band in 2 frames or fewer at 40 px/f or more relative to the line. Verify this with the act's maths and a sheet. Otherwise DRAIN so the line is gone 2 f before contact.
- **(e) Edge ride** (mk1 E7: the object makes room, then the name moves in on the follow-through). The unit is attached to a moving object's edge at a fixed gap: `x(f) = rest + max(0, edge(f) + gap − restLeft)`. It is drawn only once the edge moves 3 px/f or less, with ink `1 − 0.65·0.80^t`, so ink resolves before position.
- **(f) Hard cut.** The cut is the exit. The line is whole, settled and still for at least 6 f before it. The next line appears on the cut, or 2 f after it.
- **(g) Inline slot** (wi3 E10). A gap reserved in the layout holds a 0.06 em white caret that opens into the `C.ink3` tile over 10 f on `E.out`, so no word moves to make room. The content hard-swaps on detents (`fd`), one glyph at a time, each entering at scale 0.88 → 1 (k 0.7). On the press the tile empties and the tail word closes the gap on `glide(k 0.84)`: 90% in 13 f, and 3 px/f or less from frame 8.

---

## Cards (round 8: `src/acts/Card.tsx`)

Leon (Nov 3): "show it in the middle, only in the middle", "two times" (a two-part sentence), then the footage, so nobody reads while watching. After Settings, every sentence up to the wall is a centred card on black, cut hard into full-screen footage with no text (review and update have no line since r8; the lockup keeps its own grammar). One component, configured six times: `CalmCard`, `DesignCard`, `SwitchCard`, `SkillsCard`, `SplitCard`, `LimitsCard`.

- **Stage:** flat `C.void`. Nothing else in frame: no plate, gradient, grain, glow or dot, and no yellow (the accent means "needs you" only). The footage before and after meets the card with hard cuts on beats.
- **Type:** `fx/Line`, role display (Inter Tight, rest weight 500, display track), `C.white`, `stage="dark"`.
- **Size:** one `CARD_SIZE` for all nine card lines: the minimum over them of `fitLine(text, 'display', 1, 112, 1600)`. Measured: **106.7 px** (the audit's 107.4 px on frame 1830 under the push's 1.0068). "Make motion graphics and websites," is the widest line and sets it.
- **Anchor:** the whole line's **ink** centre on x 960 (the advance box is moved by the difference between its ink and box centres, `anchorOf` in Card.tsx), and the x-height midline on y 540 (`v: 'xmid'`: the baseline 0.273 em below). Each line (each relay part) is laid out **once, at its final place**, so every rest is ink-centred on 960. Measured (crit8): 959.7-960.9 on the half-res renders at every rest, and on full-res stills (`out/qa/r8/crit8-cards/still-*.png`).
- **Camera:** one slow axial push of the whole card about (960, 540), scale `1 + 0.00018·f` (f local to the card act; about +4% over 224 f, under 0.2 px/f at the line's ends). It rides Line's `wrap` (`scaleAbout`) and is passed as `zoom` for rule 3. It is the card's only life in the hold (rule 8).
- **Entrance (crit8): every word strikes in its own final slot.** No ROW driver: the row never moves as a whole. (The crit7 row shove, `rowShove(onsets, 0.78, 1.2, undefined, 16)`, re-centred the visible row on every strike and made the line whip: on the design card "It designs websites" travelled ~640 px left in 11 f at up to 118 px/f, parked ~363 px left of centre, and the payoffs used two grammars, some shoving the row 100-140 px, some landing into a parked row. `rowShove` stays in fx/Line for reference; no act uses it.)
  - **The strike** is `CARD_STRIKE` in Card.tsx, built with `cardUnits(on, hit, n)`: SET with `close: SET.close.display` (0.13 em, 14 px at 106.7), `spread: 0`, `lag: 0`. A word is drawn whole from its onset 14 px right of its slot and closes leftward on the house settle (k 0.80): 2.8, 2.3, 1.8, 1.5 px/f…, at rest 18 f later. One short travel, one direction for every word, monotone deceleration; with no glyph spread and no glyph lag every glyph of a word moves as one, so its ink edges only decelerate. On a 2-4 f cadence Line's catch-up close-up grows the travel (at most 1.8 x, 0.23 em; asserted under 0.25 em) so a word never lands on its still-settling neighbour.
  - **Setup words** (`mode 'setup'`): the dark stage's setup ink (o0 0.85, ink 0.96 by t 4) and H 100, 2-4 f apart. **The payoff** (the rest of the line, one unit, `mode 'hit'`): full ink and the hit's weight pulse (o0 1, H 150), on a beat or a 16th, 5-12 f after the last setup word (rule 7). It lands in its own slot, like every other word: one payoff grammar for all nine parts.
  - **Title safe:** the payoff's ink stays inside x 1824 (5%) on every frame. The widest rest edge is about 1757 (design, skills-a); the strike adds 14 px and the push about 0.5%. Measured max: 1772 (design), 1776 (skills-a).
  - Measured (half-res renders, per-word ink bbox and centroid, push removed): every word travels 13-16 px; the fastest frame of any word is 3.9 px/f at 1080 (its first frame after the strike); no 3-frame-mean speed rises after a strike (one 0.4 px/f raster blip on "built-in"). Remaining per-frame wobble (up to 0.9 px, both signs, also on words at rest) is Chromium's glyph raster under the push.
- **Two-part sentences: RELAY at one anchor.** Part A's out is `{ at, kind: 'drain', comma: { breath: DRAIN.breath.display } }` (6 f): the whole part waits the breath and leaves as one 1 f wave, the comma word last (crit7 #13). Part B's first word strikes on `relayAt(aOut, nA, 6)`, the first frame A is gone, in its own slot of its own final layout (ink-centred on 960). A and B never share a frame (asserted: A clears on B's first onset). Both parts share size and anchor.
- **Exit: HANDOFF (f).** The hard cut into the footage is the last part's exit (`out: { kind: 'picture', clears: cut }`). The part is whole and still at least 6 f before it (asserted: the payoff 24 f or more before the cut; all are 56 f or more).
- **Sound:** none (`CARD_SOUND = []`). The music carries the cards; in drop 2 their music gain sits 1 to 1.5 dB under their footage's (tools/mix/mix.py: switch and split 1.5 dB, skills and limits 1 dB).
- **Checks at load (Card.tsx throws):** the strike's close-up cannot grow past 0.25 em; every plan's `lineTimes` equals its COPY entry (in, resolved, out); onsets increase; the payoff is no more than 16 f after the last setup word; B's first onset is `relayAt` and A's clears on it; the last part settles (18 f) 6 f before the cut. `CARD_LINES` exports the frames. The crit8 change moved no frame: every onset, out and COPY entry is as before.

| card | act | part A: setup -> payoff | A out.at (wave) | part B: setup -> payoff | cut |
|---|---|---|---|---|---|
| calmCard | 1400 (36 f of empty stage first) | Watch 1436, your 1440, agent 1444 -> "work," 1456 = b(14) | 1544 (1549-1560) | step 1561, by 1563 -> "step." 1568 = b(15) | 1624 |
| designCard | 1792 | It 1800, designs 1804, websites 1808 -> "and dashboards." 1820 = b(17,1) | | | 1904 |
| switchCard | 2520 | Switch 2528, agents 2531 -> "mid-chat," 2541 = b(23,2,3) | 2597 (2602-2612) | and 2613, keep 2615, the 2617 -> "conversation." 2625 = b(24,1,3) | 2688 |
| skillsCard | 2828 | Make 2836, motion 2839, graphics 2842, and 2845 -> "websites," 2856 = b(26,2) | 2940 (2945-2957) | with 2958, built-in 2960 -> "skills." 2968 = b(27,2) | 3024 |
| splitCard | 3136 | Run 3144, two 3148, chats 3152 -> "side by side." 3164 = b(29,1) | | | 3248 |
| limitsCard | 3360 | See 3370, every 3373, plan 3376, limit 3379 -> "at a glance." 3388 = b(31,1) | | | 3472 |

Proof (crit8): `out/qa/r8/crit8-cards/cards-<card>.mp4` (half-res windows), `<card>-<part>-in.png`, `<card>-relay.png`, `<card>-cut.png` (the text band of every frame, the title-safe line in red), `<card>-words.json` (per-frame ink bbox and centroid of every word), `<card>-gates.json`, full-res `still-<frame>.png`; TextLab S3 (the design card) and S5 (the skills relay) use the same `cardUnits`. The crit7 proof (row shove) is `out/qa/r8/cards-*`.
Re-measure (crit8, second pass, `out/qa/r8/crit8-cards/verify/`: fresh half-res renders of all six windows, `<card>-gate.json`, every-frame strips, and full-res stills 1819-1828, 1830, 1840, 1890 of the design payoff with `stills/design-stills-measure.txt`): fastest word 3.85 px/f at 1080 (the frame after its strike), every word's settle fits the house curve `a + b·settleRem(t, 0.80)` with residuals of 0.10-0.27 px RMS (0.57 max), no ink moves right during a settle beyond the 0.6 px raster noise, rest ink centres 959.6-960.9 (half res) and 960.4 (full res, 1840 and 1890), widest ink 1778 (skills-a) and 1772 at full res (design, on the strike), in every relay A's last, faint drain frame is the frame before B's first word, so A and B never share a frame. Full res, the payoff "and dashboards." closes 3.3, 2.2, 2.0, 1.6, 1.1, 0.9, 0.9, 0.6 px/f (centroid; words at rest wobble 0.2-0.4 px from the raster).

---

## 4. Per act

### Hook.tsx (0-336): hook-a "Every agent you use," then hook-b "together in one window."

**Layout.** Both halves leave the world camera divs and move into a screen-space wrapper.
- The line box is centred at screen y 538 (the ring's middle row at hold scale).
- Hook-a is at 84 px (the caption token, centred), white. Delete `A_PX/B_PX/bScale/B_TAKE`, and both `OnLine` uses inside the camera.

**hook-a: ROW (camera) + SET, then the RELAY out**
- Pops, decided on `fd`: **Every 55, agent 56, you 57, use, 59**. They come in on the snap's fastest frames (the swish at 55); the last one lands as the snap lands (61).
- SET caption amounts with C = 0: `o0` 0.85 (the dark stage), H 100, S 0.03.
- ROW camera driver: `s(f) = exp(0.35·tight(f))`.
  - Measured for "Every" (centre 266 px left of 960): 39 px out at 55, then 10.7, 9.4, 8.0, 6.1, 3.9, 1.3 px/f, and still from 61. The other words move 5 px/f or less.
  - The five chips rush in from out of frame and the row closes with them: one gesture.
  - Every glyph keeps its 84 px size, so the line is never seen shrinking (the audit's MED issue).
- Resolved 67. Hold 67-128 dead still on screen, while the ring opens and turns and the dot breathes above it.
- **RELAY out:**
  - "Every agent you" drain 128-138.
  - "use," breathes 6 f and drains **136-144**.
  - B's first onset = 136 + 9 = **145**, the first frame "use," is gone (`relayAt`; Hook's local B_WAIT goes).

**hook-b: SET, then HANDOFF (b) on the punch, then DRAIN carried**
- Before the punch the partial "together in one" is laid out centred alone at 84 px. Onsets **together 145, in 147, one 149**, in caption amounts, closing up leftward. All settled (ink 0.96 or more) by 154, 7 f before the punch.
- Relay guard: "together" ends at x 997 and "use," starts at x 1177, 180 px clear (measured).
- **161 = PUNCH**, the first frame `punchAt` moves. Note that `decay(f, PUNCH − 1)` is 0 on 160; A's "160" is one frame early.
  - In a single `fd` frame, the wrapper switches to the full "together in one window." layout at ×1.452 (122 px), re-centred.
  - The scale is about `(960, baseline − 0.273 em)`.
  - "window." exists only from 161, struck as a hit (`o0` 1, H 150, S 0.025, C 0). The three settled words carry their state across the layout switch, keyed by word.
- Hold 161-224 dead still in screen space (no 1.85 → 1.93 creep) while the world finishes its punch settle.
- **Exit:** from LET_GO 224 the wrapper rides the release, scale `camAt(f)/camAt(224)` about CAM_O (960, 580). Measured ratios: 0.937, 0.883, 0.838… DRAIN carried runs over 224-235, ink and weight only. Gone well before ASK at 252.

| | in | resolved | out | clears | hold (needed) |
|---|---|---|---|---|---|
| hook-a | 55 (was 46) | 64 (65) | 128 (125) | 145 | 64 (60) |
| hook-b | 145 (145) | 161 (164) | 224 | 233 | 63 (60) |

**Keep:** the ring, the chips, the camera, and HOOK_SOUND. Keep the dot's raise on its current frames: it keys off `A_IN` and `B_OUT` today, so replace them inside `raise` with the constants 46 and 224, and the picture does not move.

**Fixes:**
- hook-a MED: the grey staircase shrinking through the snap is gone (no y, no size change).
- MED: the "aqent"/"vou" clipping (no clip box).
- LOW: the "Lvery"/"agenT" exit fragments (DRAIN).
- LOW: the parked hold (it is now still type over a moving ring).
- hook-b MED: the punch fighting the landing ("window." is born on the hit, and the rest is settled 9 f before it).
- MED: the handover sag and the two-size read (one 84 px anchor, then one ×1.45 promotion).
- LOW: the two-motion exit (one motion, the release).

### Eclipse.tsx (336-560): name "TasteCode v0.5"

**Layout.** As now: one centred line, about 190 px (fit to MEASURE 1260), ink on white, ink centre on the frame centre. Each word is placed at its final kerned position. The name wrapper sits inside the push `scale(s)`. A screen-space parent applies the band clip, HANDOFF (a). Delete Sentence's padding and margin clip hack.

**Arrival:**
- **"TasteCode"** is drawn from `NAME_ON` = the first local f at or after SHUTTER where `bh(f) >= inkHalf·s(f) + 4`, found in `useMemo`. Measured: local 44 = **abs 380**. It is struck in SET hit mode (`o0` 1, weight 600 → 500, spread 0.02 em, C = 0), so it is ink from its first frame and still condensing in weight while the band opens around it.
- **"v0.5"** strikes on **b(4,2) = 392** (local 56): hit, H 150, close-up 0.08 em (15 px, 3 px/f). "TasteCode" sits alone left of centre for 12 f, which is the version's own beat.

**Hold** 392-483: raise `PUSH` from 0.00035 to **0.0005/f**, so the band and name visibly breathe (about 0.35 px/f at the ends). `layout()` already refits through `pushAt`.

**Exit: the band blinks shut on the name**
- Close: from **OUT = local 147 (abs 483 = b(5,1,1))**, `hold` closes on `E.in` over 7 f to the hairline at local 154 (abs 490). Measured: the ink is whole at 488 (half 155) and 489 (half 113) and gone on 490. The name is not drawn from `fd(f) >= 154`.
- Hairline 490-496.
- **Reopen on b(5,1,3) = abs 497 (local 161)** on `E.out` to 0.6 of the band half by local 171. The ink dot (r 16) sits at the centre from local 161, clipped by the band, so it re-forms out of the hairline the same way it flattened into it at the act's start. This replaces the dot's rise; delete `DOT`, `DOT_DUR` and `travel`.
- Open: from `OPEN = 168` (b(5,2)) the open to white runs as now. Recompute `v0` from the new `hold(DUR − 1)`, so the edges still hit the frame on the last frame.
- **Sound:** move the `click-low` from `DOT + 2` (168) to **161**, the reopen. Add nothing on the shut.

| | in | resolved | out | clears | hold (needed) |
|---|---|---|---|---|---|
| name | 380 (383) | 392 (401) | 483 | 490 | 91 (48) |

**Keep:** the ring's turn, the hairline, the shutter's open curve, the push, the open to white, and `sync.ts`'s suck into drop 1 (OPEN is unchanged). Export the new local frames in `ECLIPSE_LINE`.

**Fixes:**
- HIGH: the grey spill under the band (clipped by the band and drawn only once it is cleared).
- MED: the washed 1.6:1 grey start (ink from the first frame).
- MED: the name told as a caption stagger (the shutter, then a beat for the version).
- MED: the parked hold (a real push).
- LOW: the generic lift exit (the band takes it).

**Fallback,** if the blink reads as a stutter on the sheet: drop the hairline hold and reopen on 491. If the blink is rejected outright: keep the dot's rise as now and give the name DRAIN's title variant over 483-499. In the title variant the whole line goes at once: glyph spread from the line centre to +0.10 em (accelerating), scale 1 → 0.96, weight 500 → 380, ink to 0 on `E.exit`.

### Rebuilt.tsx (560-840): rebuilt "We rebuilt the interface."

**Setting first.** The hero track becomes size-aware: add `heroTrack(size) = mix(−0.03, −0.055, clamp((size − 112)/188))` to `brand/tokens.ts`, which gives −0.035 at about 151-157 px. `lineLayout()` uses it, refits to MEASURE 1475, and recomputes `seat`. Check the W-e, l-t and r-f pairs for an ink gap of at least 0.02 em on one still.

**Choreography: SET in three units, on the drop, the dot and the land** (B's cue table)
- **"We rebuilt the"** is one unit struck on the drop, **b(6) = 560 (local 0)**: hit, `o0` 1, weight 650 → 500, hero spread 0.02 em, close-up 15 px. It is ink on a pure white frame on the music's drop.
- **"interface"** strikes at **b(6,0,2) = 574 (local 14)**, the first frame the thrown dot's bottom is above the line's ascenders (measured: dot bottom 231 against ascender top 250, the dot at x 1398 over the middle of "interface"). It is a setup unit (`o0` 0.8 on the light stage, H 100), so the word strikes in the dot's wake and condenses.
- **The period lands at LAND = 600 (local 40)**, unchanged. Picture tweak: the fall from the apex runs on **E.in instead of E.exit** (APEX_F 23 unchanged). Measured: the dot centre is in the x-height band only on local 39-40, at 44-62 px/f, so it never reads as an apostrophe or a middle dot. It hangs a beat at the top of the arc and then drops into the seat. The squash and the land sound are unchanged.
- The ritardando is 560 / 574 / 600 (gaps 14, 26).

**Hold** 600-678: the layer's push only (under 1 px/f).

**Exit HANDOFF (c):** at OUT = local 118 (abs 678) one wrapper around the Line and the period's SVG lifts on `accel(f, 118, 0, 1.13, 2)`. It clears the frame top by about 705 at about 50 px/f, while the window decelerates up beneath it (about 20 → 4 px/f), so the window takes over from the title. Delete the period's `blurOut`, `depart` and `clipPath`.

| | in | resolved | out | clears | hold (needed) |
|---|---|---|---|---|---|
| rebuilt | 560 (567) | 600 | 678 | ~705 | 78 (60) |

**Keep:** the plate, the fog, the white burn-off, the dot's throw and squash, the window glide, and the camera fall. Update `REBUILT_LINE`.

**Fixes:**
- HIGH: the kerning collisions.
- MED: the 11 px blur smudges (no blur).
- MED: the pale 33 f reveal (ink on the drop frame).
- LOW: the dot reading as an apostrophe (the E.in fall).
- LOW: the "vve"/"reouiit" exit fragments (whole-block lift).
- It also makes the dot write the line, the audit's own opportunity.

### Needs.tsx (840-1064): needs "See which chat needs you."

Caption at 84 px, x 96, top 928, white, screen-fixed.
- Onsets: **See 952 = b(9,2)** (local 112), **which 955**, **chat 958**, in caption setup amounts.
- **"needs you." is one phrase unit born on b(9,3) = 980** (local 140), two frames after the rail's TICK_B starts (978). It is `C.accent` at opacity 1 from its first frame, weight 650 → 500, spread 0.03 em, close-up 15 px. It never passes through grey or olive.
- Optional, only if the strike reads unmotivated on the sheet: the held row's own yellow dot pulses on 980, `1 + 0.25·hitPulse(f − 140, 2, 6)`. Keep it under 1.3× so it never reads as a press before the real one at 1026.
- **Hold** 980 → about 1052, dead still while the rail slides beneath it.
- **Exit (kept):** the yellow flood from the dot under the cursor covers the line (about 1052-1060, edge at about 97 px/f). The caption stays out of the flood's push.

| | in | resolved | out | hold (needed) |
|---|---|---|---|---|
| needs | 952 (951) | 980 (978) | 1052 (first flood contact; measure it) | 72 (66) |

**Fixes:**
- HIGH: the olive accent (verify RGB 242,201,76 within ±3 on the 980 frame).
- MED: the payoff in the setup's rhythm (a 22 f ritardando onto the beat).
- LOW: the parked hold (still on purpose now).

### Redrawn.tsx (1064-1456): redrawn "Make it look and work your way."

Centred in the open cell at the cell-fitted display size (about 100 px on screen), ink on paper, on the plane (`TYPE_CY` as now).

**ROW lock + SET:**
- The halves "Make it look" | "and work your way." are drawn whole on **b(11,2,1) = 1183 (local 119)**, each offset 0.18 em outward from the seam, in SET setup on light (`o0` 0.8, H 100, S 0.02, C 0).
- They glide together on `E.glide` and **lock on b(11,3) = 1204 (local 140 = STRIKE.b)**, the seal coin's second strike and its `land` sound, with exactly one word space at the seam. Peak 2.9 px/f.
- Look and work come together, sealed by the profile coin above the cell.
- No word cascade.

**Hold** 1204 → about 1306, riding the plane's push (z 1.3 → 1.44) and the seal's breathing, with no motion of its own. **Delete `TYPE_OUT` and `TYPE_EXIT`.**

**Exit HANDOFF (d):** Appearance, the hero cell, is painted above the plane and rises from TAKE 1300 on `E.push`. Its top edge crosses the line's ink band at about 75 px/f relative (C measured: the top is at 498 against the line centre at 379 on 1308, and at 302 against 318 on 1310). The proof covers the claim. Before relying on it:
- check one half-res every-frame sheet of 1302-1312 for at most 2 partial frames;
- check that no sliver of the line shows beside the cell's rounded corner, since R·z·(1 − take) is still large early in the take.

If either fails, DRAIN over 1292-1301.

| | in | resolved | out | hold (needed) |
|---|---|---|---|---|
| redrawn | 1183 (1179/1187) | 1204 (~1203) | ~1308 (first covered frame; measure it) | ~104 (78) |

**Fixes:**
- HIGH, partly: the title slide on an empty card. The line now holds until the window that proves it physically covers it; the cell content itself is picture work.
- MED: the template cascade staircase.
- MED: the "wav"/"vour" clipping.
- LOW: the COPY in/landing off the beat.
- LOW: the "yuu"/"and" exit fragments.

### Calm.tsx (1456-1680): calm-a "Watch your agent work," then calm-b "step by step."

Caption at 84 px, x 96, top 928, white on near black. **Delete CREEP, RISE and LEAVE.** Import the take's events (measured through `streamAt`, local → abs):
- clip 46, the first streamed line: local 22, abs 1478
- clip 115, the fold: 1545
- clip 128, the second note line: 1558
- clip 162, the agents open: 1588

**calm-a: SET on the stream's cadence, then the RELAY out**
- Onsets: **Watch 1458** (cut + 2), **your 1462**, **agent 1466**.
- **"work," is struck (hit, H 150) on 1478**, the frame the agent's first streamed line appears. The last word of the caption is the stream's first token (11 f ritardando).
- With 4 f gaps and the 0.72 ink curve, the newest word is always a shade dimmer (0.85 against 0.96): a faint mk1 E8 ink tail; the weight settle carries the strike.
- Hold 1478-1538 dead still.
- RELAY:
  - "Watch your agent" drains 1538-1548.
  - "work," breathes 4 f and drains **1544-1552**.

**calm-b: RELAY in, SET stepped on the take**
- **step 1553**, at the anchor's left end, the first frame "work," is gone (`relayAt`), 8 f after the reads fold.
- **by 1555** (`ritard(relayAt(...), [2])`).
- **"step." struck (hit) on 1558**, as the second note line streams in.
- The payoff still lands on the stream's event (gaps 2, 3).
- Hold 1558-1612 still.
- **DRAIN 1612-1622**, clear before PULL 1624, when the lens pulls out over this corner.

| | in | resolved | out | clears | hold (needed) |
|---|---|---|---|---|---|
| calm-a | 1458 (1457) | 1478 (1471) | 1538 (1531) | 1553 | 60 (60) |
| calm-b | 1553 (1545) | 1558 (1558) | 1612 | 1623 | 54 (54) |

**Fixes:**
- calm-a MED: arriving over an empty thread (it completes on the first streamed line).
- calm-a LOW: the slanted stagger-1 block, and the "yuui"/"WUIK," exit fragments.
- calm-b MED: the slot-machine row change (a comma breath).
- calm-b LOW: the payoff with the setup's rise, and the "Uy" fragment.

### Compose.tsx (1904-2240, round 8): no copy line; the prompt, the caret, the phase names

**Round 8.** The act has no film copy. The design card says it first ("It designs websites and dashboards.", section "Cards"), and the dealt hand plays fully lit with no text over it (Leon, Nov 3). OneLook, the rack-focus dim and the band are deleted. The only words in the act are the app's own: the typed prompt (the take's own type, not in COPY) and the phase labels (COPY `kind: 'ui'`, not budgeted). The act opens on a hard cut from the design card's black: the composer is already framed and still rising (one decay of 120 px, at rest by about local 20).

- **The prompt** is the take `design-compose`, clip 104-213: "A site for a guesthouse in Flateyri", 35 characters, the take's own type. While it is typed the camera only pushes in, axially, about one fixed source point (FX 560): no caret follow and no sideways move, so the sentence grows into the empty field, whole on every frame. The jump on local 112 (abs 2016, one beat before the press) is a hard cut inside the act: the prompt row, its own crop of the same frame, grows x1.4 from its left end while the card grows x1.06. From local 120 the camera zooms out about one pivot to the whole composer at the press (local 140, abs 2044 = b(19,1)).
- **The caret** (crit8). The take's own caret runs on the capture's clock: it drops out for a frame between keys and blinks 3 on / 3 off from the last key, which the time-map turns into a flash. It is covered with the field's own ground (rgb(26,26,26)), and the house caret is drawn in its place, before and after the jump:
  - 2 px wide on screen, white at 0.9.
  - 1.5x the cap height (36 clip px on a 24 px cap; rows 564-600), centred on the cap-height centre (582): above every ascender and down to the descenders, so it never reads as a letter. (At 1.15x the cap height, "Flateyri|" read "Flateyril" at preview size.)
  - 0.14 em past the last glyph: 3 clip px right of the take caret's centre (`CARET_GAP`). After the final "i" (ink to 579.6) the caret's left edge is at 584.2-584.4, a 4.6-4.8 px gap. The focus caret, before the placeholder's "D" (clip 97), stays where the app has it.
  - Solid while typing and for 30 f after the last key, then 32 f off / 32 f on, decided on fd. The last key lands on local 124 (clip 213) and the press comes 16 f later, so it never blinks.
  - It rides up and out with the sentence (the row's text leaves upward on `prog(f, PRESS + 1, PRESS + 11, E.exit)`), and it is gone from PRESS + 10 (local 150, abs 2054): its stub below the baseline outlived the glyphs by a frame as a speck.
- **The phase names** (`PhaseTick` in fx/Deal.tsx; COPY phase1-phase6, `kind: 'ui'`): six of the app's own labels, "Understanding the request" to "Refining the website", in the emptied prompt row from PHASE_AT (local 152, abs 2056), one every 12 f up to the drop. Each strikes whole in its own place on its onset, decided on fd: SET at the dark stage's o0, a weight settle 60 over rest, a 0.13 em close-up from the right. The one before drains over the last 5 f of its step. No masked roll and no vertical move, and no frame holds two labels. The last label holds. (COPY lists each onset 1 f later than the code draws it: 2057, 2069 … 2117.) The card leans back from the press and flips away from local 184 (abs 2088) into the drop.
- **Drop 2 (b(20) = 2128):** the orb deals nine real screens of Hvit into an open hand, fully lit, with no text. The hand flies apart from local 308 (abs 2212), and the orb opens onto Hvit's entrance from local 311 (abs 2215).

**Preview 6 (superseded by round 8, kept for the record): one-look "Every page keeps one look."** The frames below are preview 6's; the act ran 1680-2072.

**Delete the scrim** (`SCRIM_X`, `SCRIM_Y` and its div).

**Focus instead of a band:**
- Wrap both Deal layers (back and front) in `fx/RackFocus`: blur 12 px, the 0.35× mid copy, and a new constant `tone` of `brightness(.66)` on the blurred copies only.
- `t = prog(f, 1916, 1932, E.smooth)·(1 − prog(f, 2040, 2054, E.smooth))`.
- The cards' big type ("Halden", "1,28") becomes soft dark shapes behind sharp words. That is depth, not a letterbox. The radius is never animated.

**Size:** `fitLine(LOOK, 'display', LOOK_PUSH, 112)`, down from 140, onto the display step. It stays centred at LOOK_Y and leans in with LOOK_PUSH as now.

**ROW close + SET:**
- Onsets: **Every 1932 = b(18,1)**, **page 1935**, **keeps 1938**, in display setup amounts with C = 0.
- **"one look." is one phrase unit struck on b(18,2) = 1960** (hit, H 150): the dealt hand is at rest and every page lands in one look.
- Row: `s(f) = 1 + 0.10·0.91^(f − 1932)` about x 960. The edges move 5.8 px/f on the first frame, 3 px/f or less from 1939, and "one look." lands into a row that has closed to within about 3 px.
- This is the same move as hook-a: the film's two "Every..." sentences rhyme.

**Hold** 1960-2044: still apart from the lean, while the hand turns (0.42 deg/f).

**Exit DRAIN carried:**
- From **EXIT = 2044** (b(19,1)), as the hand flies apart, the line's wrapper takes the hand's own exit scale `lmix(1, 2.1, exitT)` about (CX, CY).
- It drains, ink and weight only, over 2044-2056.
- It is gone before the orb's hole reaches the line's ink (measured: the hole radius reaches about 309 px, the line's bottom, on about 2061).
- The hand racks back to sharp over 2040-2054.
- Remove `textOut` and the `clearsAt` logic.

| | in | resolved | out | clears | hold (needed) |
|---|---|---|---|---|---|
| one-look | 1932 (1931) | 1960 (1964) | 2044 (2034) | 2056 | 84 (66) |

**Check:** the yellow leader card in the front layer must stay at least 0.3 em clear of the ink box through 1932-2044. If it does not, paint the front layer behind the Line during the hold.

**Fixes:**
- HIGH: the scrim letterbox, and the scrim leaving while "look." is still up.
- MED: the slowest, muddiest rise (an 8 f ink settle per word, with no grey band behind it).
- MED: the 140 px ladder break.
- LOW: the "Lvciy"/"UIIE" exit fragments.

### Dash.tsx (2240-2352): dash "It designs dashboards, too."

Caption at 84 px, x 96, top 928.
- Onsets: **It 2244** (dash1 local 4), **designs 2247**, **dashboards, 2251**, in caption setup amounts.
- **"too." is struck (hit) on b(21,1,3) = 2289**, the 16th before the flip, as a pickup note.
- At the **flip 2296** the stage and the line's ink invert in place on one frame (kept). "too." is still settling in weight as the polarity changes, so the type carries straight through it (wi3 E13). Its SET state is a function of the absolute frame (Dash2 passes `f + ACT.dash1.dur`).
- Hold 2289-2352 dead still. **HANDOFF (f):** the hard cut at 2352 is its exit.

| | in | resolved | out | hold (needed) |
|---|---|---|---|---|
| dash | 2244 (2245) | 2289 (2269) | 2352 | 63 (60) |

**Fixes:**
- LOW: the payoff with no beat.
- LOW: 85 f of dead hold (the hold now has its event).
- MED, partly: the anchor jump on the cut. Switch's line now appears 2 f after the cut, so the eye gets a reset; the anchor still moves.

### Switch.tsx (2352-2576): switch-a "Move any chat to another agent," then switch-b "and keep the conversation."

Top-left anchor (96, 102) at the fitted size (about 70 px; see the risks). **Delete CREEP, the reel spring (`reel`, the provider stack) and the 1/3-2/3 `E.dolly` close.**

**switch-a: SET cut-in + HANDOFF (g) inline slot**
- **2354** (cut + 2, so the top band is empty on the cut frame): the whole line appears at its final layout, slot reserved between "another" and "agent,". SET cut-in: 0.5 f ripple, `o0` 0.7, H 100, S 0.025, close-up 0.13 em.
- A 0.06 em white caret stands in the slot and opens into the `C.ink3` tile (1.0 × 0.9 em) on `E.out` over **2354-2364**.
- **Hard glyph swaps on the list's own detents**, one glyph at a time, each entering at scale 0.88 → 1 (k 0.7):
  - **2366 Cursor** (local 14)
  - **2382 Antigravity** (local 30)
  - **2394 Codex** (local 42, the list's cut back, BACK)

  These are exactly the three existing `tick` sounds (local 14, 30 and BACK). The early detents (local 3 and 8) and the fast run back (local 41, 44, 48) are folded away, so swaps are 12-16 f apart, inside wi3 E10's range, and never two half icons.
- **Press 2422:** the glyph drops out (flight kept); the tile's grey goes. "agent," alone closes the gap on `glide(k 0.84)` from 2423: 90% in 13 f, 3 px/f or less from frame 8, while the eye follows the falling glyph. The head words stay on the anchor.
- Hold until 2470.
- **RELAY:**
  - "Move any chat to another" drains 2470-2482.
  - "agent," breathes 6 f and drains **2480-2488**.

**switch-b: RELAY in + SET, payoff on the send**
- **and 2489** (far left of the anchor, the first frame "agent," is gone), **keep 2492**, **the 2495** (`ritard(B_IN, [3, 3])`).
- **"conversation." struck (hit) on ENTER = 2499**, the send.
- Hold 2499-2562 still, while the history rises beneath it to meet it.
- **Exit kept:** the whole text layer accelerates up into the cut (`accel(f, 210, 0, 1.2, 5)`).

| | in | resolved | out | clears | hold (needed) |
|---|---|---|---|---|---|
| switch-a | 2354 (2344, rising on the cut) | 2358 (2375) | 2470 (2448) | 2489 | 112 (72) |
| switch-b | 2489 (2475) | 2499 | 2562 | cut | 63 (60) |

**Fixes:**
- switch-a MED: the two half icons mid-roll.
- MED: the 20 f hole after the drop.
- LOW: the "IVIOVE"/"Cliat"/"allUlIEl" fragments.
- The half-formed staircase on the cut.
- switch-b LOW: the handover with no breath.

### Quick.tsx (2576-3024): q-commands, q-split, q-limits, q-review

Caption at 84 px (`capSize()` unchanged), x 96, top 928. **Delete CREEP.** Every exit in the run is HANDOFF (f), the hard cut, with the line whole and still. This is the run's meter.

**q-commands** "Slash commands and skills for every agent.": SET in two chunks, keyed to the dot's typing.
- **"Slash commands" on SL_HIT = 2579** (slash local 3), the frame the dot types the "/".
- **"and skills for every agent." on 2589** (slash local 13 = `SL_ROWS[1]`), the frame the real highlight steps onto /skills. Verified in the code: the clip's /skills row is clip 134, and `SL_CF` maps it to local 12.8.
- Caption setup amounts.
- It is held whole across the cut into skills at 2632, where its ink inverts in place (kept), up to the cut at 2688. The line is rendered by both acts from one absolute-frame plan.

Picture flags (layout, optional):
- keep at least 0.4 em (34 px) between the skills composer's lower edge and the caption's cap line;
- clip the skills stage at `BAND − 8` instead of `BAND + 20`, so "Do anything" is never sliced on top of the caption.

**q-split** "Run two chats side by side.": ROW (part) around the divider. This is the run's one centred line.
- On **2704** (split local 16, SP_V, the hairline passing vertical) both halves are drawn on the caption baseline: "Run two chats" right-aligned to `960 − g/2`, and "side by side." left-aligned from `960 + g/2`. They use SET setup ink (`o0` 0.85, C 0).
- From **SP_TOP 2706**, as the panes zip open, `g` grows from one word space (16 px) to 1.2 em (100 px). Each half moves 42 px outward on glide k 0.92 (3.2 px/f, then falling). The divider stands in the gap.
- Held to the cut at 2800.

**q-limits** "See every plan limit at a glance.": SET cut-in, decided on the cut.
- On **2800**, the cut frame, the whole line is present: `o0` 1, 0.5 f ripple, H 80, S 0.03, C 0. It is fully resolved by 2802. The tilted card and the hopping dot carry all the motion.
- Held to the cut at 2884.

**q-review** "Commit, push and open a pull request.": SET lit.
- On **2884**, the cut, the whole line is present at `C.mute` (about 5.1:1 on void, legible), with a quiet weight settle (H 60).
- Each phrase lights to white on its own result: **"Commit," on 2898**, **"push" on 2919**, **"and open a pull request." on 2940**. These are `RV_HITS` (review local 14, 35, 56), the frames the dot lands as each result's full stop. The step is three frames: 0.5, 0.85 and 1.0 in OKLab, plus weight 600 → 500 at k 0.80.
- Held to the cut at 2968.

| | in | resolved | out | hold (needed) |
|---|---|---|---|---|
| q-commands | 2579 (2576 rising) | 2597 (2594) | 2688 (2672, chopped) | 91 (78) |
| q-split | 2704 (2705) | 2712 (2726) | 2800 | 88 (72) |
| q-limits | 2800 | 2802 (2806) | 2884 | 82 (78) |
| q-review | 2884 | 2886 legible (2890) | 2968 | 82 (78); grid-check reads resolved as legible at the mute floor |

**Fixes:**
- q-commands MED: the exit that never finished.
- MED: crowding (flagged numerically).
- LOW: the barcode fragment.
- q-split LOW: busy UI above the caption, and the half-risen next caption.
- q-limits MED: the cut onto an unfinished staircase.
- q-review MED: the text naming three actions at once while the UI does them one by one.
- LOW: the half-formed line on the cut.

### Lockup.tsx (3248-3500): wordmark "TasteCode", then platforms "v0.5 is out now for Windows and macOS."

**wordmark: HANDOFF (e) edge ride. No wipe, no mask.**
- Delete `nameMask`, `open` and `behind`.
- "TasteCode" (96 px, white, display track) is a `<Line>` whose single word is drawn from **b(31) = 3360** (local 112).
  - Measured: the mark's right edge is moving 2.8 px/f there and is 8 px short of its lockup gap from the name's rest.
- It rides the mark at the lockup gap: `inkLeft(f) = restInkLeft + max(0, markRight(f) + gap − restInkLeft)`, with `markRight = W/2 + x·PX + 0.5·INK_W·scale·PX` from the act's own pose maths.
  - Measured: it starts 27 px right of rest and moves 2.8 px/f, falling to 0.7 px/f by 3374 and 0.04 by 3384. The gap to the mark is exactly the lockup gap on every frame, so the two never touch.
- Ink `1 − 0.65·0.80^t` (0.35 → 0.9 by t = 6; ink resolves before position). Weight 560 → 500 at k 0.85.
- Every value is read through the act's clock `g = min(f, STILL)`, so the card is frozen from 3400.

**platforms: SET cut-in on a beat, clamped to STILL**
- All seven words onset together on **b(31,1) = 3388** (local 140), with a 0.5 f ripple. Secondary, 44 px, `C.mist`, centred under the lockup (layout unchanged). Ink 0.42 → 1 (of mist), weight 560 → 450, spread 0.03 em, no close-up and **no vertical move**.
- Every settle uses the envelope `prog(f, 3388, 3400, E.out)` in place of the open decay, so it reaches rest exactly on STILL (3400). The card is pixel-still to 3500.

| | in | resolved | out | hold (needed) |
|---|---|---|---|---|
| wordmark | 3360 (3353) | 3368 (3370) | 3500 | 132 (42) |
| platforms | 3388 (3357) | 3398 (3393) | 3500 | 102 (78) |

**Fixes:**
- HIGH: the brand name spelling "Ia…", "lasteC" and "TasteCoc" (it is whole on every frame).
- MED: two text moves competing (now 28 f apart, name first).
- MED: the ending's 36 f staircase (one unit).
- LOW: the soft gradient edge.

---

## 5. Shared work to build first (in this order)

1. **`lib/measure.ts`:** add `glyphLayout()` (Section 3, SET), under FontGate, cached. Keep `measureTracked`, `fitSize`, `inkBox` and `baselineOf`.
2. **`lib/anim.ts`:** add the `SET` and `DRAIN` tokens, `ritard(at, gaps)`, `relayAt(aOut, nA, breath)`, `lineTimes(plan)` and the drain curves. They use only existing primitives (`decay`, `glide`, `accel`, `prog`, `E.*`), so `lint-film` stays green.
3. **`fx/Line.tsx`:** the one copy component. Its props are `id text f size role color align plan`.
   - `plan.units`: `[{ words: [i..j], at, mode: 'setup' | 'hit' | 'born' | 'cut' | 'lit', litAt?, color? }]`
   - `plan.row`: optional ROW driver
   - `plan.layouts`: optional `{ at, text, scale, origin }`, for the hook-b type step
   - `plan.out`: `{ at, kind: 'drain' | 'carried', comma?: { breath } }`

   It renders the `data-text` wrapper, the glyph spans and the `fd` gating. Re-export `fitLine` from here; the old `fitLine` and `fitSize` maths is unchanged. **Retire `Sentence.tsx` for copy.** `Words`, `MaskRise` and `PhaseTick` stay for UI strings only.
4. **`brand/tokens.ts`:** add `heroTrack(size)`.
5. **`fx/RackFocus.tsx`:** add an optional constant `tone` filter (for example `brightness(.66)`) on the blurred copies only. Never animate it.
6. **Lint (`scripts/lint-film.mjs`):** fail any `mixColor(…, C.accent…)` or `mixColor(C.accent, …)`, and any `filter: blur` inside `fx/Line.tsx`.
7. **`timeline.ts` COPY:** set the new frames in Section 6.
8. **`scripts/text-check.ts`** (Node, React-free, run inside `npm run check`). It asserts from the plan maths:
   - every hold ≥ 36 + 6·words (grid-check already does this from COPY);
   - every RELAY's B first onset = `relayAt(...)`, and the guard holds (word widths from a JSON cache written once by a tiny `TextQA` still);
   - no glyph at ink 0.75 or more moves faster than 3 px/f, except in the windows listed in Section 7;
   - "needs you." has `mode: 'born'` and colour `C.accent`.
9. **Then the acts, in film order.** Each act exports its local frames, the way `ECLIPSE_LINE` and `REBUILT_LINE` already do.

---

## 6. New COPY frames (`timeline.ts`)

| id | in | resolved | out | words | hold | needed |
|---|---|---|---|---|---|---|
| hook-a | 55 | 64 | 128 | 4 | 64 | 60 |
| hook-b | 145 | 161 | 224 | 4 | 63 | 60 |
| name | 380 | 392 | 483 | 2 | 91 | 48 |
| rebuilt | 560 | 600 | 678 | 4 | 78 | 60 |
| needs | 952 | 980 | 1052 | 5 | 72 | 66 |
| redrawn | 1183 | 1204 | 1308 | 7 | 104 | 78 |
| calm-a | 1458 | 1478 | 1538 | 4 | 60 | 60 |
| calm-b | 1553 | 1558 | 1612 | 3 | 54 | 54 |
| one-look | 1932 | 1960 | 2044 | 5 | 84 | 66 |
| dash | 2244 | 2289 | 2352 | 4 | 63 | 60 |
| switch-a | 2354 | 2358 | 2470 | 6 | 112 | 72 |
| switch-b | 2489 | 2499 | 2562 | 4 | 63 | 60 |
| q-commands | 2579 | 2594 | 2688 | 7 | 94 | 78 |
| q-split | 2704 | 2709 | 2800 | 6 | 91 | 72 |
| q-limits | 2800 | 2802 | 2884 | 7 | 82 | 78 |
| q-review | 2884 | 2886 | 2968 | 7 | 82 | 78 |
| wordmark | 3360 | 3368 | 3500 | 1 | 132 | 42 |
| platforms | 3388 | 3398 | 3500 | 7 | 102 | 78 |

For needs and redrawn, set `out` to the first measured contact frame. Phase1-6 (`kind: 'ui'`) are unchanged.

crit6 round (Shared): `relayAt` now waits for the comma's clear (calm-b and switch-b `in` +5) and `SET.read.setup` is 5 (resolved = last setup onset + 5: hook-a 64, q-commands 2594, q-split 2709, if those acts keep their onsets). The wordmark's plan is a setup unit with its own slow ink (`o0` 0.35, kInk 0.8): lineTimes now says 3365, so Lockup gives it `read: 8` to keep 3368. Every other `resolved` is a hit, a born phrase, a cut-in, a lit step or an act override and does not move.

---

## 7. Verification (Leon's low-res-first rule)

1. **Plan maths first** (`text-check.ts`, `grid-check`, `tsc`, lint). These read no pixels.
2. **Half-res every-frame sheets** of each in and out window, with `--diff` to catch single-frame pops. Use `python scripts/sheet.py --comp <Act> --frames a-b --diff --width 480`, one render at a time, concurrency 2. Windows (abs):

   | Line | Windows |
   |---|---|
   | hook | 52-70, 126-165, 222-238 |
   | name | 376-396, 481-500 |
   | rebuilt | 558-604, 676-708 |
   | needs | 950-984, 1048-1062 |
   | redrawn | 1180-1208, 1300-1314 |
   | calm | 1456-1482, 1536-1562, 1610-1626 |
   | one-look | 1914-1964, 2040-2064 |
   | dash | 2242-2300, 2348-2356 |
   | switch | 2350-2400, 2420-2440, 2468-2502 |
   | quick | 2576-2600, 2700-2730, 2798-2806, 2882-2944 |
   | lockup | 3356-3402 |

3. **On those sheets, check:**
   - no frame shows a partial glyph or a different word;
   - the accent is (242, 201, 76) ±3 on 980;
   - the hook-b step frame (161) is crisp with no double exposure;
   - the band frames 378-380 and 488-490;
   - the redrawn and one-look exit frames;
   - the wordmark gap.
4. **Fast-text windows** (rule 3, crit6 round). Read type (ink 0.75 or more) moves faster than 3 px/f only in these two kinds of window. `scripts/text-check.ts` accepts exactly these and fails anything else; `lineFrame()` reports per glyph whether a frame was `stepped`.
   - **(a) Decided on `fd(f)`: sharp steps, no smear.** Line's guard does this for every Line-internal offset, so these need no act code. They are listed so text-check and the sheets know where type steps faster than 3 px/f.
     - Every setup or catch-up close-up onset: the word's first 1-3 frames (up to 6 for a catch-up close-up on a 3-4 f cadence). Measured: calm 1463-1469 and 1556-1561, needs 956-961, dash 2248-2258, q-commands 2580-2585, rebuilt "interface" 575-581, hook-b 148-152.
     - hook-a 55-60, the snap's ROW: "Every" steps about 11, 9, 8, 6 and 4 px a frame at ink 0.85 or more (it smeared up to 6.5 px inside a frame before the guard).
     - one-look 1932-1938 on today's `rowClose(1932)` (5.5 px/f on the first frame); **1932-1944 with crit6 #6's `rowClose(LOOK_IN, 0.25, 0.86)`** (17 px/f on the first frame, under 3 px/f from 1945). The act crew also reported 1960-1966 ("one look." into the closed row): stepped wherever its close-up or the row exceeds 3 px/f.
     - redrawn about 1193-1204, the lock, if crit6 #4 (A) is taken: both halves at ink 0.9 or more closing on an expo curve into 1204. The lock is a ROW `dx` inside Line, so the guard steps it; Redrawn passes `zoom` (the plane's z, 1.3-1.44), or the guard reads the plane-local speed.
     - switch-a 2423-2430: "agent," closing the slot (21 px/f on its first frame). Its `dx` row is inside Line, so it now steps sharp instead of smearing.
   - **(b) Carried by the camera or the picture through `wrap`** (the whole line moves with the picture and smears with it; Line does not step a wrap):
     - hook-b 224-233 (the release; the wrapper's ink is under 0.75 from about 227)
     - rebuilt 678-698 (the lift: 2 px/f, then x1.2 a frame; the frame top crosses the ink at 40 px/f or more on 2 frames at most)
     - one-look from 2038 (the hand's exit scale; every word is under ink 0.75 by 2048, when the scale passes 3 px/f), or whatever crit6 #10's whole-line exit sets
     - switch-b 2562-2576 (the layer into the cut)
   - **The cards (crit8):** no fast window any more. Every word strikes in its own slot with a 14 px close-up (catch-up up to 25 px on a 2 f cadence), so it moves at most about 3-5 px/f on its first one or two frames after the strike, which the guard decides on fd(f) like any setup close-up, and under 3 px/f after that. The relay waves (A drains) stay under 3 px/f at ink 0.75 or more. (The crit7 row shove moved read type at 30-120 px/f; it is gone from the cards.)
   - Any other offset that carries read type fast (a dot riding a glyph, a ROW an act drives outside Line) uses `stepFast(o)` and is added to (a).
5. **Only after the sheets pass:** a half-res preview of the whole film (`npm run render:preview`). Full render last.

---

## 8. Risks and fallbacks

1. **Per-glyph layout fidelity.** Range-rect positions must match a plain DOM run. Gate: one still per role, comparing a static `<Line>` at rest against a plain span. The difference must be within 0.5 px. Keep `calt`, ligatures and tabular-nums identical in measure and render. Fallback: per-word spans positioned from `measureTracked` prefixes (C's method). That drops the glyph spread; the word close-up and the weight settle about the word centre remain.
2. **The weight settle could read as pulsing.** H is at most 150 and gone in about 10 f. If Leon dislikes it, set H to 0 globally; the ink settle and the close-up remain.
3. **The hook-a snap moves read text fast.** "Every" moves up to 11 px/f, now at ink 0.85 or more from its strike, so rule 3's guard steps it sharp on 55-60 (no master smear). If the steps read as a stutter on the sheet, fallbacks in order: exponent 0.25, then A's screen-fixed type with no row driver.
4. **The hook-b re-centre on the punch frame could read as a glitch.** Fallback: lay "together in one" at its final left-shifted x with "window." hidden, then scale only.
5. **The Eclipse blink changes the dot's entrance and moves one sound cue.** Fallback: as in the Eclipse section (reopen on 491, or keep the rise and use the title DRAIN).
6. **RackFocus renders the Deal three times for about 140 f.** Check the render time on a 40 f slice. Fallback: drop the mid copy, or use the constant `tone` alone with no blur. That is an exposure dip on the hand, never a band.
7. **The Redrawn occlusion.** It needs 2 partial frames or fewer at 40 px/f or more, and no sliver beside the cell's rounded corner. Fallback: DRAIN 1292-1301.
8. **Calm holds sit exactly on the minimum** (60 and 54). Import `CALM_EVENTS` so any retime of the take moves the cue table with it.
9. **Switch stays at about 70 px top-left, and the anchor jumps from Dash** (bottom-left to top-left). That is a picture constraint: the popover's left edge is at 1067. Flagged for Leon, not solved by type.
10. **q-split breaks the bottom-left anchor once,** by intent. If it reads as two labels, keep the gap at 1.1 em or less.
11. **The wordmark ride.** Measure `markRight` on the real layout before committing. The name must be exactly at the lockup gap on its first frame (3360), and still from STILL.
12. **Out of scope, flagged:** the phase ticks' doubled labels mid-swap (UI texture, LOW). The chip fragments at the hook's frame edges (picture). The skills composer clearance (picture, optional).

---

## Appendix A: measured numbers (scratch check over each act's own maths)

- **Inter Tight 500:** cap height 0.728 em, x-height 0.546 em, word space 0.193 em. Weight 650 widens a line by 3.3-4.6%, which is why each glyph is centred on its rest advance.
- **Hook snap,** with the row on `exp(0.35·tight)` and "Every" centred 266 px left of 960:
  - offset from rest: 55: 39 px; 56: 29; 57: 19; 58: 11; 59: 5; 60: 1.3; 61: 0
  - camera scale: 49: 2.27; 55: 1.53; 61: 1.037
- **Hook punch:** `camAt` 160: 1.128, 161: 1.339 (×1.187), 162: 1.485, 163: 1.587. The release ratio from 224: 1, 0.937, 0.883, 0.838, 0.799…
- **Eclipse:** name about 190 px, band half 171, ink half about 71.
  - Band half on open, from local 41: 1, 41.6, 74.2, 99.1, 117.5. The first whole-clear frame (ink half + 4) is local 44, abs 380.
  - Close on `E.in` 7 f from local 147: …170.7, 155.2, 113.0, 1.0. The shut frame is local 154, abs 490.
- **Rebuilt** (hero about 151 px at the current MEASURE): base 364, ascender top 250, x-height top 281, seat 354, apex 162.
  - The dot's bottom clears the ascenders on local 13-14 (abs 573-574), at x of about 1373-1398.
  - Fall into the seat, E.exit (now): the dot is in the x-height band on 4 frames (37-40), landing at 28 px/f.
  - Fall on E.in: 2 frames (39-40), at 44-62 px/f.
- **Calm, `streamAt`, clip → abs:**

  | clip | event | abs |
  |---|---|---|
  | 46 | first streamed line | 1478 |
  | 78 | Searching | 1509 |
  | 93 | Reading files | 1524 |
  | 115 | fold | 1545 |
  | 128 | second note line | 1558 |
  | 144 | Running Explore | 1573 |
  | 162 | agents open | 1588 |

- **Compose hole radius, abs (px, px/f):** 2058: 190 (30); 2060: 255 (42); 2061: 297 (50); 2062: 347 (59); 2063: 407 (71); 2065: 561 (100); 2067: 780 (142). The line's ends at y of about 530 are not covered until about 2067, so the orb-hole exit was rejected.
- **Lockup mark right edge, abs (px, px/f):** 3356: 804 (4.0); 3358: 796 (3.35); 3360: 790 (2.8); 3364: 780 (2.0); 3370: 770 (1.1); 3376: 765 (0.55); 3384: 763 (0.04). The name's rest ink left is 798 and the lockup gap is 35.
- **ROW lock** (18 px on `E.glide` over 21 f): peak about 2.9 px/f. **q-split part** (42 px on glide k 0.92): 3.2, 2.9, 2.7… px/f.
- **SET caption close-up** (15 px, k 0.80): 3.0, 2.4, 1.9, 1.6 px/f. **Ink** (`o0` 0.85, k 0.72): 0.85, 0.89, 0.92, 0.94, 0.96 at t = 4 (it was `o0` 0.42: 0.96 at t = 8). Rule 3's guard steps the first frames of every close-up over 3 px/f.
