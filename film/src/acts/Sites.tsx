import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C } from '../brand/tokens';
import { Full, LIFT, PLUNGE, SHOTS, shotAt } from '../fx/SiteRun';
import { fd } from '../lib/anim';
import type { Sound } from './Sound';

// Through the orb's hole: Leon's own sites (made with his TasteSkill), shown as design work, filmed frame by frame.
// Hvit finishes focusing itself, then starts to scroll on its own: the scroll is the camera. One beat later the run
// widens to his other sites, every cut on the grid and carried by the picture: Hvit's ink loft card rises into Kaffee
// Klee's black cup at the same height, the camera sinks into the cup's black, "stet" lands out of it and finishes
// printing itself, and a
// polarity flip lands on a manuscript where a green mark sweeps over a name. The page lifts into the dashboards.
// The film never pans across a page: every move inside one is the page's own filmed scroll, time-mapped (SHOTS in
// fx/SiteRun.tsx); the film adds only the door's zoom, the plunge and the lift. No horizontal move anywhere.
// Shots and their take frames are chosen on fd(l) so every motion-blur sub-sample of a frame agrees: a page scrolled
// faster than one take frame per film frame would otherwise print its type twice (neighbouring take frames) in the
// master. The film's own camera (zoom, lift) still runs on the continuous time and blurs as a camera move.

/**
 * For the checks: the cuts on the grid, local frames (abs 2268 b(21,1), 2296 b(21,2), 2352 b(22), 2380 b(22,1)), the
 * plunge and the lift. r8: the act moved from 2072 to 2240 and keeps its internal timing; the bar's accent now falls on
 * local 0 (the door) and 112 (the stet cut, where the plunge's suck ends).
 */
export const SITES = { cuts: [28, 56, 112, 140], plunge: [PLUNGE.from, PLUNGE.to], lift: LIFT.at };

// Only what has a cause is sounded; the music carries the gather cut and the flip. The manuscript shot ends on the
// green mark before the flag's note is born (SHOTS manuscript), so the note's slide is gone with it.
export const SITES_SOUND: Sound[] = [
  { f: 28, kind: 'sweep-soft', weight: 0.6 }, // the rooms shot enters at its top speed and decays
  { f: 112, kind: 'suck-short', weight: 0.7 }, // end-aligned (mix.py): the plunge into the cup's black ends on this frame
];

export const Sites: React.FC = () => {
  const l = useCurrentFrame();
  const s = shotAt(fd(l));
  const cam = s.cam(l);
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.ink, overflow: 'hidden', isolation: 'isolate' }}>
      <Full id={s.take} frame={s.time(fd(l))} oy={s.oy} zoom={cam.zoom} origin={cam.origin} lift={cam.lift} blend={s.ground === 'ink' ? 'lighten' : undefined} />
    </div>
  );
};

/** Local frame ranges of the shots, for sheets and checks. */
export const SITES_SHOTS = SHOTS.map((s) => ({ key: s.key, from: s.from, to: s.to, take: s.take }));
