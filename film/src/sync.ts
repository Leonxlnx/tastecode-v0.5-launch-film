// The sound events of the film, computed from the picture code. The acts export their frames; this
// file turns them into cues for the mix (tools/mix/mix.py maps `kind` to a licensed SFX file).
// Every sound has a visible cause. Discrete state changes get a sound; continuous motion and most
// cuts don't: the music carries those. Kinds: tick pop click click-low (very soft, short and low) press switch
// confirm key enter swish sweep-soft (a low air sweep that starts at speed) whoosh whoosh-big (short lead-in)
// whoosh-long (a 50 f build, for moves that accelerate into their peak) air sub bass impact impact-big land riser
// riser-long swell suck suck-short implode (a suck whose peak lands on its frame and stops there: the wall's fall into
// the dot) slide paper shutter ping glass.
// Leon (Nov 2): no 'toggle' anywhere, no UI sounds in the breakdown (calm), no bell or ping at the end.
// Polarity flips: only the dashboards' flip is sounded (DASH.flip), with bass plus a land for body on
// laptop speakers. The cards cut hard on the beat with no sound (r8); the music carries them.
// `variant: 'rate:x'` repitches one event (tools/mix/mix.py), on top of the kit's own rate.
import { DASH } from './acts/Dash';
import { ECLIPSE_SOUND } from './acts/Eclipse';
import { HOOK_SOUND } from './acts/Hook';
import { LOCKUP } from './acts/Lockup';
import { REBUILT } from './acts/Rebuilt';
import { COMPOSE } from './acts/Compose';
import { CALM_SOUND } from './acts/Calm';
import { NEEDS_SOUND } from './acts/Needs';
import { QUICK_SOUND } from './acts/Quick';
import { REDRAWN_SOUND } from './acts/Redrawn';
import { SITES_SOUND } from './acts/Sites';
import { SKILLS_SOUND } from './acts/Skills';
import type { Sound } from './acts/Sound';
import { SWITCH_SOUND } from './acts/Switch';
import { WALL_SOUND } from './acts/Wall';
import { ACT, CUE, TOTAL, W } from './timeline';

export type SoundEvent = { f: number; kind: string; weight?: number; pan?: number; id?: string; len?: number; variant?: string };

export const panX = (x: number) => Math.max(-0.8, Math.min(0.8, ((x - W / 2) / (W / 2)) * 0.8));

export default function cues(): SoundEvent[] {
  const ev: SoundEvent[] = [];
  const at = (act: keyof typeof ACT, f: number, kind: string, extra: Partial<SoundEvent> = {}) => ev.push({ f: ACT[act].from + f, kind, id: `${act}:${kind}`, ...extra });

  // hook: the dot's first pulse, each agent opening (the five pops climb about 3 semitones), the
  // retreat. The act declares its frames.
  let pop = 0;
  for (const s of HOOK_SOUND) {
    const extra: Partial<SoundEvent> = { weight: s.weight, pan: s.pan };
    if (s.kind === 'pop') extra.variant = `rate:${(1 + 0.0475 * pop++).toFixed(4)}`;
    at('hook', s.f, s.kind, extra);
  }

  // eclipse: the ring turns, the line, the shutter, the dot (the act declares these), then the open to white:
  // the suck ends 7 f early so the drop lands out of a hole.
  for (const s of ECLIPSE_SOUND) at('eclipse', s.f, s.kind, { weight: s.weight, pan: s.pan });
  ev.push({ f: CUE.drop1 - 7, kind: 'suck', weight: 0.9, id: 'eclipse:suck' });
  ev.push({ f: CUE.drop1, kind: 'impact-big', weight: 1, id: 'drop1' });

  // rebuilt: the dot seats as the period (contact on f40, squash widest on f41), the window comes up (it
  // enters at 50 px/f on winAt+1 and decays: a short lead-in, a long tail), the camera falls (it accelerates
  // into the cut: the long whoosh builds with it and peaks 8 f before the cut, abs 832).
  at('rebuilt', 40, 'land', { weight: 1.0, pan: 0.4 });
  at('rebuilt', REBUILT.winAt + 4, 'whoosh-big', { weight: 0.8 });
  at('rebuilt', REBUILT.cam + 62, 'whoosh-long', { weight: 0.9, pan: -0.3 });

  // compose: the press, drop 2, the deal, the phases, the exit through the orb.
  // The keys vary by index so four samples never read as one loop; the music ducks under them (mix.py).
  const KEY_VAR = [0, 0.15, -0.1, 0.05, -0.15, 0.1, -0.05];
  at('compose', COMPOSE.chip, 'press', { weight: 0.6, pan: -0.3 }); // the cursor presses the chip; it lights on the next frame
  COMPOSE.keys.forEach((f, i) => at('compose', f, 'key', { weight: 0.5 * (1 + KEY_VAR[i % KEY_VAR.length]) }));
  at('compose', COMPOSE.jump + 12, 'key', { weight: 0.55 }); // the 35th character, clip 213 (STOPS in Compose.tsx)
  at('compose', COMPOSE.press, 'press', { weight: 1 });
  at('compose', COMPOSE.press + 2, 'enter', { weight: 0.5 });
  // Each new phase label in the riser, on its first visible frame (the labels strike whole on their phase
  // frame, r8). The run climbs a semitone and about 0.6 dB a label, so it rides up the riser instead of sinking.
  COMPOSE.phases.forEach((f, i) => at('compose', f, 'tick', { weight: 0.6 + 0.08 * i, variant: `rate:${Math.pow(2, i / 12).toFixed(4)}` }));
  at('compose', COMPOSE.drop - 7, 'riser', { weight: 0.9 }); // ends 7 f early: the drop lands out of a hole
  at('compose', COMPOSE.drop, 'impact', { weight: 1 });
  at('compose', COMPOSE.drop + 2, 'paper', { weight: 0.7 }); // the deal; starts on its frame
  at('compose', COMPOSE.exit + 14, 'whoosh-long', { weight: 1 }); // peaks as the iris reaches the corners (abs 2226)

  // sites: each whip (the act declares them). dash: the flips, bass for weight, land for body.
  for (const s of SITES_SOUND) at('sites', s.f, s.kind, { weight: s.weight, pan: s.pan });
  ev.push({ f: ACT.dash1.from, kind: 'bass', weight: 0.8, id: 'dash:flip1' });
  ev.push({ f: ACT.dash1.from, kind: 'land', weight: 1, id: 'dash:flip1-body' });
  ev.push({ f: ACT.dash1.from + DASH.flip, kind: 'bass', weight: 0.8, id: 'dash:flip2' });
  ev.push({ f: ACT.dash1.from + DASH.flip, kind: 'land', weight: 1, id: 'dash:flip2-body' });

  // lockup: one soft, low land as the roof seats and the mark is whole (contact shows 2-4 f before ROOF); the
  // ring-out starts on the same frame (mix.py). Nothing else: no air, no bell, no ping (Leon, Nov 2).
  at('lockup', LOCKUP.roof - 2, 'land', { weight: 0.6, variant: 'rate:0.84' });

  // The acts that declare their own sounds. The six cards (Card.tsx) make none: the music carries them.
  const own: [keyof typeof ACT, Sound[]][] = [['needs', NEEDS_SOUND], ['redrawn', REDRAWN_SOUND], ['calm', CALM_SOUND], ['switch', SWITCH_SOUND], ['skills', SKILLS_SOUND], ['split', QUICK_SOUND.split], ['limits', QUICK_SOUND.limits], ['review', QUICK_SOUND.review], ['update', QUICK_SOUND.update], ['wall', WALL_SOUND]];
  for (const [act, list] of own) for (const s of list) at(act, s.f, s.kind, { weight: s.weight, pan: s.pan });

  for (const e of ev) if (!(e.f >= 0 && e.f < TOTAL)) throw new Error(`sync: ${e.id} at f=${e.f} is outside the film`);
  return ev;
}
