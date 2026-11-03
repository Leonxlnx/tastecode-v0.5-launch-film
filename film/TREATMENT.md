# TasteCode v0.5: treatment

The final cut. 4172 f at 60 fps = 69.53 s, 1920x1080. Every frame below comes from `src/timeline.ts` (ACT, CUE, COPY, TOTAL), the acts in `src/acts`, `src/sync.ts` and `tools/mix/mix.py`.

**Logline:** Every agent you use, together in one window that shows which chat needs you, designs websites, and lets a chat switch agents and keep its conversation.

## Arc

Six movements, laid on the music's form.

1. **Promise** (bars 1-5, 0-9.33 s, intro). A dot throws out five agents. "Every agent you use, together in one window." The dot eclipses into the name.
2. **The rebuilt app** (bars 6-13, 9.33-23.33 s, drop 1). The interface rises out of white. The sidebar shows which chat needs you, and its dot floods the frame yellow. Settings and Appearance, your way.
3. **Breath** (bars 13-17, 23.33-29.87 s, breakdown). The first card, then the agent's thread arriving message by message, with no text.
4. **Design** (bars 17-23, 29.87-42.00 s, the build and drop 2). The design card. The Design chip, the prompt, the phases. Drop 2 deals the site out of the orb, the orb opens into Leon's sites, then two dashboards (mockups).
5. **The rest, card then footage** (bars 23-34, 42.00-61.60 s, drop 2). Switch agents, built-in skills, two chats, plan limits: each sentence alone on black, then the footage full screen. Review and update have no line: the app's own words say it.
6. **Payoff** (bars 34-38, 61.60-69.53 s). A wall of every shot on the biggest beat, the fall into the dot, silence, the mark and the last line.

## The device: one dot

The film's one image is a single dot. It is the white dot of the opening, the eclipse's disc, the period of "We rebuilt the interface.", the app's own needs-you dot that floods the frame, the send orb that deals the site and opens into it, and the disc the wall falls into. At the end the mark builds around it.

Since Leon's notes on preview 6 ("NO DOTS"), the film draws no other dot. No cursor dot, no status dots on the chips, nothing on the cards. The second half is carried by the card and the cut, and the dot comes back for the ending.

**Device path:**
- **hook:** the white dot breathes and throws five nodes, which open into the provider chips. The ring swings to face the camera and closes around the dot at the eclipse's radius.
- **eclipse:** the ring tips into one hairline. The band reopens with the dot in it, then opens to white with the dot.
- **rebuilt:** the dot is thrown in an arc over "We rebuilt the" and drops into the line as the period.
- **needs:** the cursor lands on the needs-you row's own dot. The press floods the frame yellow out of it.
- **redrawn:** the flood shuts like a shutter into a gutter of the plane. The dot rests from here.
- **cards, calm, switch, skills, split, limits, review, update:** no dot. The text is alone on black, and the footage is the app as it is.
- **compose:** the send orb rhymes with the dot. Pressed, it lifts out of its socket, deals the site on drop 2 and opens into Hvit's entrance.
- **wall:** on the peak a disc runs out from the dot behind the wall. Then it closes, carrying the wall, back into the dot on void.
- **lockup:** the dot thickens into glass and the mark builds around it.

**Accent:** the app's own needs-you yellow `#F2C94C`. It means "this needs you". The film sets it only in the needs act: "needs you." is born yellow on b(9,3), and the film's one flood fills the frame on b(10,2). Elsewhere it appears only where the app itself shows it. The cards have no yellow.

**Worlds (the luminance story):** void (hook) -> black with a white band (eclipse) -> white with the dot and a fog peak (rebuilt) -> the real rail, going soft and dark (needs) -> yellow flood -> a dark plane of screens turning light under the theme wipe, then the Appearance page in its neutral colours, falling away to black (redrawn) -> black card -> the real thread (calm) -> black card -> dawn clouds (compose) -> Leon's sites: Hvit's white town, Kaffee Klee's black cup, "stet", a polarity flip onto Proofloom's manuscript -> a dark dashboard, then a light one -> black cards between full-frame app footage (switch, skills, split, limits) -> review on a cold dark plate, update on paper -> the wall: void, light on the peak, void again -> the glass mark on void.

**Specificity test:** a simpler product would show one agent in one window. This film shows five named providers, the sidebar telling you which chat needs you, a chat moving to another agent with its conversation, skills that ship inside the app used in a chat, two chats side by side, the plan limits of Claude Code, Codex, Grok and Antigravity in one popup, real review results and an update that waits for running chats. It passes as long as each is shown doing the thing, in the real app.

## Music and sound

- **Track:** "Next Horizon" (130 BPM), stretched 1.1% so a beat is a whole 28 f (128.57 BPM) and a bar 112 f (1.867 s).
- **Edit** (`tools/mix/mix.py`, TRACKS edit): every seam is a whole bar, on a hard cut or a pre-drop hole.
  - Intro, filter opening: bars 1-5.
  - Drop 1: bars 6-13 (rebuilt, needs, redrawn).
  - The sparse breakdown: from the calm card's "work," on b(14). Its lift lands on b(17), the design card.
  - The build's last two bars under Compose's typing, drop 2 on b(20) on the deal, then drop 2 on through the cards. The hats come back on b(28), the cut into skills.
  - The brightest bars for the wall: bars 34-35, peak b(35).
  - The music stops on the implosion (b(36)). A B-major ring-out starts on the roof's contact (3962, 2 f before CUE.roof 3964) and fades to silence over the last 90 f.
- **Master:** -14 LUFS, true peak -1.3 dBTP.
- **SFX:** licensed files mapped in `tools/mix/mix.py`. The events come from `src/sync.ts` and each act's `*_SOUND`. Every sound has a visible cause. The cards make none: the music carries them, 1 to 1.5 dB under their footage in drop 2.
- **Ending:** the wall's fall into the dot carries an `implode`, a vacuum that builds through the fall and peaks on the landing frame 3919, where it cuts with the music. The hole's drone is retuned to B1, so the B-major ring-out resolves over it.

## Beat sheet

Bars are `b(bar, beat)` from `timeline.ts`: bar 1-based, beat 0-3, so "8.2" is bar 8, beat 2. Each act runs [from, to). Every act boundary is a hard cut on a beat. Copy frames are the first drawn frame (COPY `in`).

| Act | Bar | Time s (frames) | Picture | Copy | Sound |
|---|---|---|---|---|---|
| hook | 1 - 4 | 0.00-5.60 (0-336) | Void. The white dot throws five nodes onto a ring on a tilted plane. They open into the provider chips: Claude Code, Codex, Grok, Cursor and Antigravity, the last two with a white "New". The chips are born large and fly out of frame. The camera snaps out; on the punch the line steps up to its full size; on the bar the camera lets go. The ring swings to face the camera and closes around the dot. | "Every agent you use," (55) / "together in one window." (145; "window." on the punch, 161) | Intro, filter opening. A tick on the dot's first pulse, five pops that climb about 3 semitones, a swish on the snap-out, land and sub on the punch, swishes on the release and the retreat, a short suck as the last chip shuts. |
| eclipse | 4 - 6 | 5.60-9.33 (336-560) | The ring tips back to its edge like a coin, and its halves close to one hairline across the frame. The line opens like a shutter into a white band, and the name is in it, whole. The band blinks shut on the name, reopens with the dot in it, then opens to the frame: white, with the dot. | "TasteCode v0.5" (380; "v0.5" struck on b(4,2), 392) | Air as the ring tips, a low click as the halves meet, a soft sweep and sub on the shutter, a low click on the reopen. A suck ends 7 f before the drop. |
| rebuilt | 6 - 8.2 | 9.33-14.00 (560-840) | DROP 1. White with the dot. "We rebuilt the" strikes on the drop while the dot is thrown in an arc over it. "interface" strikes in its wake, and the dot drops in as the period. A fog peak condenses under the title. The real window rises from below, and the line lifts out of the frame top as one block. The camera falls toward the sidebar into the cut: one zoom, no pan. | "We rebuilt the interface." (560; the period lands on 600) | Big impact on the drop. A land as the dot seats as the period, a big whoosh as the window rises, a long whoosh that builds into the cut. |
| needs | 8.2 - 10.2 | 14.00-17.73 (840-1064) | The same zoom lands on the real rail. The real "Needs you" band pops on b(9). The heavy cursor lands on the row's dot, and the row lifts where it is while the rail goes soft and dark behind it. The press floods the frame yellow out of the dot. | "See which chat needs you." (952; "needs you." born yellow on b(9,3), 980) | A ping on the band, a slide as the row lifts, a press, a swell into the flood, an impact on the flood. |
| redrawn | 10.2 - 13.2 | 17.73-23.33 (1064-1400) | The flood shuts like a shutter into a gutter of a plane of dark screens. In the first-run setup tile the real theme wipe starts from the real pointer and turns every tile it crosses light. The camera sinks past the profile seal onto the one open cell, where the line's halves lock on the seal's second strike. Appearance rises from below, carries the line out and takes the frame. The real page, in its default neutral colours, scrolls from the theme previews through Light mode to Dark mode, rests, and falls out through the frame's bottom to black. | "Make it look and work your way." (1183; the halves lock on b(11,3), 1204) | A shutter, a press and a land on the seal's two strikes, a whoosh as Appearance rises. Drop 1's groove. |
| calmCard | 13.2 - 15.2 | 23.33-27.07 (1400-1624) | Card. 36 f of empty black, then the sentence alone in the middle, told in two parts at one place. Hard cut into the footage. | "Watch your agent work," (1436; "work," on b(14)) / "step by step." (1561; "step." on b(15)) | No SFX. The music breathes under the empty stage; the breakdown lands with "work,". |
| calm | 15.2 - 17 | 27.07-29.87 (1624-1792) | The real thread, full frame and sharp, arriving message by message: the agent's first lines, the reads folding, its finding, the provider's own subagent rows. One slow axial push and one vertical follow. No text from the film. | none | The breakdown. No UI sounds. |
| designCard | 17 - 18 | 29.87-31.73 (1792-1904) | Card. | "It designs websites and dashboards." (1800; "and dashboards." on b(17,1)) | No SFX. The breakdown's lift lands on the cut into the card. |
| compose | 18 - 21 | 31.73-37.33 (1904-2240) | Hard cut to dawn clouds. The real composer rises into the sky. The Design chip is pressed, and the prompt is typed under one axial push, with the film's calm caret. One beat before the press a jump cut throws the sentence up large, and the camera eases back to the whole composer. The orb is pressed on b(19,1): the sentence leaves its row, the orb lifts out and drifts to the middle of the sky, the app's phase names tick through the emptied row, and the card leans back and flips away. DROP 2 on b(20): the orb deals nine real screens of Hvit into an open hand over the clouds, fully lit. The hand flies apart, and the orb opens wide onto Hvit's entrance. | UI only: the prompt "A site for a guesthouse in Flateyri"; six phase labels, "Understanding the request" to "Refining the website" | The build's last two bars. A press on the chip, soft keys (the music ducks under them), a press and an enter on the orb, six ticks that climb a semitone each through the riser, the riser ending 7 f early, an impact on drop 2, paper on the deal, a long whoosh that peaks as the hole reaches the corners. |
| sites | 21 - 22.2 | 37.33-40.13 (2240-2408) | Through the hole: Leon's own sites, filmed frame by frame, full frame. Hvit finishes focusing and scrolls on its own, then its rooms (b(21,1)). Its dark loft card rises into Kaffee Klee's black cup (b(21,2)), and the camera sinks into the cup. "stet" from the editing tool lands out of the black (b(22)). A polarity flip onto Proofloom's manuscript, where a green mark sweeps over a name (b(22,1)). The page lifts into the dashboards. No horizontal move. | none | Drop 2. A soft sweep on the rooms shot, a short suck that ends as the camera plunges into the cup. |
| dash1 | 22.2 - 23 | 40.13-41.07 (2408-2464) | Polarity flip: a dark dashboard, full screen, rising on its own scroll. It is a mockup made for the film. | none | Bass and a land on the flip. |
| dash2 | 23 - 23.2 | 41.07-42.00 (2464-2520) | Flip: a light dashboard, also a mockup. Hard cut to the black card. | none | Bass and a land on the flip. |
| switchCard | 23.2 - 25 | 42.00-44.80 (2520-2688) | Card. | "Switch agents mid-chat," (2528; "mid-chat," on b(23,2,3)) / "and keep the conversation." (2613; "conversation." on b(24,1,3)) | No SFX. |
| switch | 25 - 26.1 | 44.80-47.13 (2688-2828) | The chat column at full width. The real model picker opens above the composer, the list scrolls from Cursor and Antigravity to Codex, and a Codex model is checked. The real shelf: "Your next message switches this chat to Codex. The conversation so far goes with it." The prompt is sent, "Switched to Codex" lands in the chat, and Codex's reply picks up the same conversation. One axial push, never a pan. | UI only | A low click on the check, a soft enter on the send. |
| skillsCard | 26.1 - 28 | 47.13-50.40 (2828-3024) | Card. | "Make motion graphics and websites," (2836; "websites," on b(26,2)) / "with built-in skills." (2958; "skills." on b(27,2)) | No SFX. |
| skills | 28 - 29 | 50.40-52.27 (3024-3136) | Settings › Skills, "Included with TasteCode": cinetic, design-taste-frontend and cook. Cut on b(28,1) to a chat: the "$" menu lists the same three, cinetic is taken as a chip and sent, and the agent's row reads "Using Skill · cinetic" as the camera pushes in about it. | UI only | The hats come back on the cut. Soft enters on the chip and the send, a tick on "Using Skill". |
| splitCard | 29 - 30 | 52.27-54.13 (3136-3248) | Card. | "Run two chats side by side." (3144; "side by side." on b(29,1)) | No SFX. |
| split | 30 - 31 | 54.13-56.00 (3248-3360) | The whole window, full frame. The pointer presses "Open beside" in the sidebar's menu, and the second chat opens beside the first on b(30,1). Both stream to the cut. One slow axial push. | UI only | A low click on the press, a swish as the second chat opens. |
| limitsCard | 31 - 32 | 56.00-57.87 (3360-3472) | Card. | "See every plan limit at a glance." (3370; "at a glance." on b(31,1)) | No SFX. |
| limits | 32 - 32.3 | 57.87-59.27 (3472-3556) | The real limits popup, large and centred, its bars still filling. Claude Code, Codex and Grok read on the cut; two beat-long ticks bring Antigravity up. Cursor's rows are spliced out. | UI only | The music carries it. |
| review | 32.3 - 33.2 | 59.27-60.67 (3556-3640) | Review in hard cuts. The commit message goes in as the pointer presses "Commit 4 files". Then the result lines, Committed, Pushed and Opened pull request, each large in the window. No caption. | UI only | One very soft, low click per result line. |
| update | 33.2 - 34 | 60.67-61.60 (3640-3696) | The sidebar's footer, large. The pointer presses the update badge, and the real menu opens: "Installs when 2 chats finish". No caption. | UI only | A press on the badge. |
| wall | 34 - 36 | 61.60-65.33 (3696-3920) | One window fills the frame. The camera ticks across one plane of every shot in the film, pulling back a step on each beat, into the last whip on the peak (b(35)). On the peak a disc opens from the dot behind the wall, and the frame goes from void to light: the film's one flash. Then the disc closes faster and faster, carrying the wall, into the dot on void (3919). | none | The brightest bars. A swish in, a hole, a big impact and an impact on the peak. The implode builds through the fall and peaks on the landing frame 3919, where it cuts with the music. |
| lockup | 36 - 38.1 | 65.33-69.53 (3920-4172) | The dot lets its momentum die and thickens into glass. The stem halves grow out of it and the roof drops on (3964). A band of spectral light passes through the glass. The mark shrinks and steps left. The name rides in on its follow-through (b(37)); the line cuts in under the pair on the next beat (b(37,1)). From 4072 the card is still for the last 100 f. | "TasteCode" (4032) / "v0.5 is out now for Windows and macOS." (4060) | Silence, with a low B1 drone in the hole. A soft, low land as the roof seats. The B-major ring-out starts on the roof, resolves over the drone and fades to silence over the last 90 f. |

Film copy: 17 lines, 75 words in 69.5 s. The rest is the app's own text (the prompt, the phase labels, the picker, the shelf, the skills, the results, the update menu).

## What the film claims, plainly

- **Dashboards:** dash1 and dash2 are mockups made for the film.
- **Leon's sites:** Hvit, Kaffee Klee, "stet" and Proofloom are Leon's own sites, made with his TasteSkill design skill. The film shows them as examples of design work after the compose shot; they were not made from the prompt typed there. The design agent and its phase labels are real.
- **Subagents:** the calm act shows only the provider's own subagent rows.

## Seams

- Every hard cut is an act boundary and sits on a beat. Motion-blur samples never cross one.
- **Cards:** a hard cut in from the footage and a hard cut out into it, both on beats, with no sound. The cut into the footage is the card's exit.
- **The first half runs on pose and speed matches.** Hook's ring closes into the eclipse's disc. The eclipse ends on white with the dot, where rebuilt opens. Rebuilt's zoom runs on across the cut into needs at the same speed. The needs flood shuts into redrawn's gutter. Redrawn's page falls out to black, and the calm card's black takes it.
- **Compose to sites:** through the orb's hole; the door's zoom is matched across the cut.
- **Polarity flips:** three, on the beat: Proofloom's manuscript (sites), then the dark and the light dashboard. Only the dashboard flips are sounded.
- **Wall to lockup:** the dot on void, in the same place and at the same size.
- One flash only: the wall's disc on the peak. No crossfades.

## Drawn techniques (seed 2400731922)

Used: quiet intro and a drop on the cut from eclipse to rebuilt, velocity handoff cut (rebuilt to needs), polarity flip (sites, dashboards), centre-out unmask (the Eclipse band opening on the name), reading-order word exit (the relay's drain waves), chip bloom (the provider chips opening out of the dot's nodes), punch-in insert (the zoom into the rail), peek-hover-launch (the needs row), bento cell takeover (redrawn), agent status then answer (calm), anchor spawn (the app's own picker, "$" menu and update menu), stage clears to brand (wall to lockup), specular sweep (the glass mark), hard stop into a silent sign-off (the music stops on the implosion; only the ring-out plays under the still card).

Dropped: anchored overlay (no caption over footage), push-aside and the line-to-split seam (split is the app's own "Open beside"), and tucked unit (no hero number on screen; a fake metric would break the no-filler rule).

## Final frame

The glass mark, "TasteCode" and "v0.5 is out now for Windows and macOS." on void, still for the last 100 f. The poster is taken from it (`deliver\master\tastecode-v0.5-poster.png`).

## Delivery

The film is built at 60 fps. The 60 fps motion-blurred master is `deliver\master\tastecode-v0.5-film-1080p60.mp4`. The main file, `deliver\master\tastecode-v0.5-film-1080p30.mp4`, is derived from it at 1080p and 30 fps by blending frame pairs.
