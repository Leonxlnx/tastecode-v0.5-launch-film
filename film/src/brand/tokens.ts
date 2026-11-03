// Brand tokens: the only place a colour, face or type size is written down. Acts import these;
// scripts/lint-film.mjs fails any hex colour that is not declared here.
import type React from 'react';
import { safeInsets } from '../lib/safe';
import { H, W } from '../timeline';

export const C = {
  void: '#050706', // the black stage: pine-black, never pure #000
  ink: '#0B0E0D', // dark surfaces and type on light
  ink2: '#161A18', // raised surfaces on ink
  ink3: '#232826', // hairlines and quiet fills on ink
  paper: '#F0F3F1', // the fog stage
  mist: '#DDE2DF', // soft panels on fog
  line: '#C7CDC9', // hairlines on fog
  mute: '#7A817D', // secondary text on both stages
  white: '#FFFFFF',
  mark: '#E7E8DE', // cinetic:brand-supplied the mark's own off-white
  // The one accent, and what it means: "needs you", whatever is asking for attention right now.
  // It is the app's own --warning token. It arrives on new things and relaxes to ink or paper.
  accent: '#F2C94C', // cinetic:brand-supplied the app's needs-you yellow
  ok: '#6FBF8E', // cinetic:brand-supplied the app's finished dot, only where the sidebar's dots are retold
  bad: '#E5636A', // cinetic:brand-supplied the app's failed dot, only where the sidebar's dots are retold
};

export const FONT = {
  text: '"Inter Tight Variable", "Inter Tight", system-ui, sans-serif', // the film's one sans, for every role; typeStyle and measure.ts read it
  mono: '"Geist Mono Variable", "Geist Mono", ui-monospace, monospace',
};

/** Faces the FontGate waits for before anything renders or measures (one entry per weight in use). */
export const FACES = ['400 16px "Inter Tight Variable"', '500 16px "Inter Tight Variable"', '600 16px "Inter Tight Variable"', '400 16px "Geist Mono Variable"'];

/** Layout unit: 1 at 1080p, scales every size with the short side of the frame (16:9, 9:16, 1:1). */
export const U = Math.min(W, H) / 1080;

// One token per role, reused everywhere, so nothing is "almost matched" (size in px at 1080p).
export const TYPE = {
  hero: { size: 300, weight: 500, track: -0.055, lead: 0.92 }, // the giant words
  display: { size: 112, weight: 500, track: -0.03, lead: 1.0 }, // statements and the wordmark
  caption: { size: 84, weight: 500, track: -0.03, lead: 1.0 }, // the one caption setting, at x=96, top y=928
  secondary: { size: 44, weight: 450, track: -0.02, lead: 1.15 }, // descriptor lines
  ui: { size: 24, weight: 500, track: -0.01, lead: 1.3 }, // smallest readable size on screen
};

/**
 * Hero tracking by size (em): -0.03 at the display step (112 px) to -0.055 at the full hero (300 px),
 * so a hero set near 151-157 px tracks about -0.035 and its W-e, l-t and r-f pairs keep an ink gap.
 * fx/Line.tsx uses it for every hero line; pass it to measure.ts when you size one by hand.
 */
export const heroTrack = (size: number) => -0.03 + (-0.055 + 0.03) * Math.min(1, Math.max(0, (size - 112) / 188));

/** CSS for a type role at a size (px). Tabular figures always, so numbers never jitter in width. */
export const typeStyle = (role: keyof typeof TYPE, size = TYPE[role].size * U): React.CSSProperties => ({
  fontFamily: FONT.text,
  fontSize: size,
  fontWeight: TYPE[role].weight,
  letterSpacing: `${TYPE[role].track}em`,
  lineHeight: TYPE[role].lead,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'pre',
});

/**
 * Safe margins for a w x h frame as a symmetric envelope: the larger inset of each pair from the
 * frame's safe-zone preset (src/lib/safe.ts), so a centred layout that fits inside clears every
 * side. 96 x 64 px at 1920x1080; 120 x 420 at 1080x1920, where the feed zones are asymmetric
 * (use safeBox() from lib/safe.ts there to centre on the clear band instead of the frame).
 */
export const safeArea = (w: number, h: number) => {
  const i = safeInsets(undefined, w, h);
  return { x: Math.max(i.left, i.right), y: Math.max(i.top, i.bottom) };
};
/** The film's safe margins; text stays inside them (scripts/layout-audit.sh checks). */
export const SAFE = safeArea(W, H);
