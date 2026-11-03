# TasteCode v0.5 launch film

The source of the TasteCode v0.5 launch film: 69.5 seconds, 1920×1080, built in [Remotion](https://www.remotion.dev) with the [cinetic](https://github.com/Leonxlnx/cinetic) skill. One timeline file drives the picture, the text and the sound.

## How it is built

- **One timeline.** `film/src/timeline.ts` holds every act, cue and line of text in frames. The film runs at 60 fps on a 128.57 BPM grid, so a beat is exactly 28 frames and a bar is 112.
- **Acts.** Each act in `film/src/acts` is a pure function of the current frame. `film/src/Film.tsx` mounts them in order. Each act is also registered as its own composition, so you can open one in the Studio by itself.
- **Real product UI.** The app shots are recordings of the TasteCode app played back frame by frame (`film/src/fx/kit.tsx`), with the camera, crops and covers done in code.
- **Sound from the picture.** `film/src/sync.ts` turns the acts' own frames into sound cues. `tools/mix/mix.py` re-edits the music to the cut, places the effects and masters to -14 LUFS.
- **Motion blur.** `film/scripts/render.sh --blur` renders a sharp pass, measures on-screen speed per frame, renders that many sub-frames (`FilmSub`), and averages them in float (`film/scripts/accumulate.py`). The 30 fps release file was made from the 60 fps master with ffmpeg by blending frame pairs; that step is not one of the scripts here.
- **Scripts.** Most of `film/scripts` comes from the cinetic skill. Their comments point to the skill's own docs (`SKILL.md`, `references/`), which live in the cinetic repo, not here. `film/TREATMENT.md` and `film/TEXT-SYSTEM.md` are the film's own notes.

## What is not in this repo

- **The footage.** The app and website recordings are PNG sequences, far too large for git. The film reads them from a local server on port 5699, started from the repo root: `node tools/footage/serve.mjs <footage folder> 5699`. The folder holds `clips/<id>/f_00000.png…`, `proxy/<id>/`, `stills/<id>.png` and `sites/<id>/` (paths in `film/src/fx/kit.tsx` and `film/src/fx/SiteClip.tsx`, ids in `film/src/data/clips.ts` and `film/src/data/sites.ts`). Without it the app shots render empty, and everything else still works.
- **Music and sound effects.** The Pixabay and Mixkit licences allow use in a film but not redistributing the files, so no audio file is in the repo (the CC0 Freesound effects are left out as well). `audio-src/CREDITS.md` lists every file with its source page. Download them into `audio-src/` under the paths in its table to rebuild the soundtrack. Some effects are trimmed cuts of the downloads (the title column says which part), so a rebuild comes close but is not bit-identical.
- **Renders.** `film/out/` is ignored.

## Run it

```bash
cd film
npm ci
npm run studio
```

Checks (types and the house lint):

```bash
npm run check
```

The timing grid check (`npm run grid`) reports long stretches without a sound event as errors. This film keeps them on purpose: the text cards hold in silence and the music carries them.

Rebuild the soundtrack into `film/public/audio/soundtrack.wav` (needs Python as `python` with numpy, scipy, soundfile and pyloudnorm, ffmpeg built with the rubberband filter, and the files from `audio-src/CREDITS.md`):

```bash
npm run cues && npm run audio
```

Render the motion-blurred master to `film/out/film.mp4` (bash, ffmpeg 6 or newer, Python as `python3` with numpy, scipy, soundfile and opencv, the soundtrack from the step above, and the footage server for the app shots):

```bash
npm run render
```

## Credits

- Music: Next Horizon by Databend via Pixabay. Sound effects: Mixkit, and Freesound (CC0). Details in `audio-src/CREDITS.md`.
- The pages in `film/public/mock` are screenshots of fictional mock websites made for the film. Their photographs come from museum open-access collections and Wikimedia Commons (CC0, public domain, CC BY 2.0, CC BY-SA 3.0 and 4.0) and from Unsplash; each folder's `CREDITS.md` lists them with their licences. The `fathom` and `volta` images contain CC BY-SA photographs, so those image files are shared under CC BY-SA with those credits. Paths such as `site/img/` in these files refer to the mock sites' own sources, which are not in this repo.
- The landscape plates in `film/public/plates` are photographs from Unsplash, used under the Unsplash License; `film/public/plates/CREDITS.md` lists them.
- Fonts from Fontsource (SIL Open Font License), installed by npm; no font file is in the repo.

## License

The code is MIT licensed, see `LICENSE`. The images keep their own licences listed above. The TasteCode name and logo are not covered by the MIT licence. Nor are the provider names and marks shown in the film (Claude Code, Codex, Grok, Cursor, Antigravity, in `film/src/brand/providers.tsx`): they belong to their owners and appear only to show which tools TasteCode works with. Remotion is used under its own licence: https://www.remotion.dev/license
