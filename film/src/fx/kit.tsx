import React from 'react';
import { Img, staticFile } from 'remotion';
import { C, FONT, typeStyle, TYPE } from '../brand/tokens';
import { arrive, blurIn, clamp, depart, E, fd, hitPulse, mix, prog } from '../lib/anim';
import { CLIPS } from '../data/clips';

/**
 * The film's shared parts. Acts compose these; they keep the seams, the surfaces and the cursor one
 * family. Everything is a pure function of the frame numbers passed in.
 */

/** Footage server (tools/footage/serve.mjs). The PNG sequences are too large for the bundle's public folder. */
export const FOOTAGE = 'http://127.0.0.1:5699';

export const clipUrl = (id: string, frame: number) => {
  const m = CLIPS[id];
  if (!m) throw new Error(`no clip "${id}"`);
  const i = Math.max(0, Math.min(m.frames - 1, fd(frame)));
  return `${FOOTAGE}/clips/${id}/f_${String(i).padStart(5, '0')}.${m.ext ?? 'png'}`;
};

export const stillUrl = (id: string) => `${FOOTAGE}/stills/${id}.png`;

/**
 * One frame of a captured clip, at the clip's own CSS size `width` x `height` (defaults from the
 * meta), so positions inside it are the app's CSS pixels. Scale it with a parent transform.
 */
export const Clip: React.FC<{ id: string; frame: number; style?: React.CSSProperties; width?: number; height?: number }> = ({ id, frame, style, width, height }) => {
  const m = CLIPS[id];
  return <Img src={clipUrl(id, frame)} style={{ display: 'block', width: width ?? m.w, height: height ?? m.h, ...style }} />;
};

/**
 * The same frame from the long-side-1280 JPEG proxy (footage/proxy, tools/proxies.ps1), for tiles shown
 * under about 1000 px on screen. Decodes ten times faster; the frame numbers and CSS size are the clip's.
 */
export const ProxyClip: React.FC<{ id: string; frame: number; style?: React.CSSProperties; width?: number; height?: number }> = ({ id, frame, style, width, height }) => {
  const m = CLIPS[id];
  const i = Math.max(0, Math.min(m.frames - 1, fd(frame)));
  return <Img src={`${FOOTAGE}/proxy/${id}/f_${String(i).padStart(5, '0')}.jpg`} style={{ display: 'block', width: width ?? m.w, height: height ?? m.h, ...style }} />;
};

/** A window: real rounded surface, a light hairline, the key shadow. No glass. */
export const Win: React.FC<{ w: number; h: number; r?: number; children: React.ReactNode; style?: React.CSSProperties; light?: boolean; shadow?: number }> = ({ w, h, r = 18, children, style, light = false, shadow = 1 }) => (
  <div
    style={{
      position: 'relative',
      width: w,
      height: h,
      borderRadius: r,
      overflow: 'hidden',
      background: light ? C.paper : C.ink,
      boxShadow: `0 ${40 * shadow}px ${120 * shadow}px rgba(0,0,0,${0.34 * shadow}), 0 ${8 * shadow}px ${24 * shadow}px rgba(0,0,0,${0.16 * shadow})`,
      ...style,
    }}
  >
    {children}
    <div style={{ position: 'absolute', inset: 0, borderRadius: r, boxShadow: light ? 'inset 0 0 0 1px rgba(0,0,0,.08)' : 'inset 0 0 0 1px rgba(255,255,255,.09), inset 0 1px 0 rgba(255,255,255,.1)', pointerEvents: 'none' }} />
  </div>
);

/** A photographic plate, full-bleed with overscan: a slow push + drift, plus `tone` to pull it into the film's cool key. */
export const Plate: React.FC<{ name: string; x?: number; y?: number; k?: number; tone?: string; toneOpacity?: number; filter?: string; origin?: string }> = ({ name, x = 0, y = 0, k = 1, tone, toneOpacity = 0, filter, origin = '50% 50%' }) => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: C.void }}>
    <Img
      src={staticFile(`plates/${name}.jpg`)}
      style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1280, objectFit: 'cover', transformOrigin: origin, transform: `translate(${x}px, ${y - 100}px) scale(${k})`, filter }}
    />
    {tone && <div style={{ position: 'absolute', inset: 0, background: tone, opacity: toneOpacity }} />}
  </div>
);

/** Mock page slots: placeholder pages for the design shots. Swap the files to change them; nothing else needs to change. */
export const MOCKS = ['volta', 'nocturne', 'fathom', 'halden', 'meridian', 'orchard'] as const;
export type MockId = (typeof MOCKS)[number];
export const mockUrl = (id: string, part: 'hero' | 'full' = 'hero') => staticFile(`mock/${id}/${part}.jpg`);

/**
 * The film's cursor: solid, heavy, no outline, a character rather than an OS pointer. Tip at (x, y).
 * `bank` tilts it along its travel (deg, 0 = rest), `press` 0..1 squeezes it toward the tip. Placed
 * only by transform. On a dark surface `white` draws it light with a dark edge so it stays a shape.
 */
export const BigCursor: React.FC<{ x: number; y: number; size?: number; bank?: number; press?: number; white?: boolean; opacity?: number }> = ({ x, y, size = 96, bank = 0, press = 0, white = false, opacity = 1 }) => {
  const s = (size / 100) * (1 - 0.14 * press);
  return (
    <svg
      width={100}
      height={100}
      viewBox="0 0 100 100"
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity, transformOrigin: '0 0', transform: `translate(${x}px, ${y}px) rotate(${bank}deg) scale(${s})` }}
    >
      <path d="M0 0 L0 78 C0 81 3.4 82.6 5.8 80.6 L23 65.6 L35.6 94.6 C36.4 96.6 38.6 97.4 40.6 96.6 L53 91.2 C55 90.4 55.8 88.2 55 86.2 L42.4 57.6 L66 57.6 C69 57.6 70.4 54 68.2 51.8 L6 -1.6 C3.6 -3.6 0 -2.6 0 0 Z" fill={white ? C.white : '#000000'} stroke={white ? '#000000' : 'none'} strokeWidth={white ? 3 : 0} strokeLinejoin="round" />
    </svg>
  );
};

/** Path + bank helper: a bowed move between two points on an ease, banked into its travel and lagging. */
export const cursorMove = (f: number, a: { x: number; y: number }, b: { x: number; y: number }, from: number, to: number, ease = E.fly, bow = 0.16) => {
  const t = prog(f, from, to, ease);
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const cx = mx - dy * bow;
  const cy = my + dx * bow;
  const u = 1 - t;
  const x = u * u * a.x + 2 * u * t * cx + t * t * b.x;
  const y = u * u * a.y + 2 * u * t * cy + t * t * b.y;
  const moving = Math.sin(Math.PI * clamp(t));
  const bank = (Math.atan2(dy, dx) * 180) / Math.PI;
  return { x, y, bank: clamp((bank - 45) / 3, -28, 28) * moving };
};

/** Press envelope for a click at frame c: in over 5 f, recovers slowly, no overshoot. */
export const pressAt = (f: number, c: number) => hitPulse(f - c + 3, 4, 7);

/**
 * One line of big type where each word rises from its own mask, irregularly staggered, then exits
 * lifting in reading order. Use `gaps` to open a slot in the line (see Slot).
 */
export const Rise: React.FC<{
  text: string;
  f: number;
  at: number;
  out?: number;
  stagger?: number[];
  role?: keyof typeof TYPE;
  size?: number;
  color?: string;
  id?: string;
  align?: 'left' | 'center';
  style?: React.CSSProperties;
  accentWord?: number;
}> = ({ text, f, at, out, stagger = [0, 5, 7, 12, 15, 21], role = 'display', size, color = C.white, id = 'line', align = 'left', style, accentWord }) => {
  const words = text.split(' ');
  const ts = typeStyle(role, size);
  return (
    <div data-text={id} style={{ display: 'flex', justifyContent: align === 'center' ? 'center' : 'flex-start', gap: '0.24em', ...ts, color, ...style }}>
      {words.map((w, i) => {
        const s = at + (stagger[i] ?? i * 6);
        const p = prog(f, s, s + 34, E.out);
        const o = out === undefined ? 0 : out + i * 4;
        const q = out === undefined ? 0 : prog(f, o, o + 12, E.in);
        const fade = out === undefined ? 0 : prog(f, o, o + 12, E.smooth);
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: '0.14em', marginBottom: '-0.14em', paddingRight: '0.02em' }}>
            <span
              style={{
                display: 'inline-block',
                color: i === accentWord ? C.accent : undefined,
                transform: `translateY(${((1 - arrive(p)) * 1.02 - depart(q) * 0.2).toFixed(4)}em)`,
                opacity: 1 - fade,
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Text that arrives grey and darkens/lightens to its colour behind a moving head: new words are never at full ink. */
export const Ink: React.FC<{ text: string; f: number; at: number; rate?: number; from: string; to: string; style?: React.CSSProperties; id?: string }> = ({ text, f, at, rate = 1.4, from, to, style, id = 'ink' }) => {
  const n = fd((f - at) / rate);
  return (
    <span data-text={id} style={{ whiteSpace: 'pre', ...style }}>
      {[...text].map((ch, i) => {
        const age = n - i;
        if (age < 0) return null;
        return (
          <span key={i} style={{ color: age > 5 ? to : from, opacity: age > 5 ? 1 : mix(0.65, 1, age / 5) }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
};

/** A caption in the lower left over a full-frame product shot, on a soft scrim so it reads over anything. */
export const Caption: React.FC<{ text: string; f: number; at: number; out?: number; id?: string; color?: string; x?: number; y?: number; size?: number }> = ({ text, f, at, out, id = 'caption', color = C.white, x = 96, y = 900, size = 88 }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${x}px, ${y}px)` }}>
    <Rise text={text} f={f} at={at} out={out} id={id} color={color} size={size} />
  </div>
);

export const TEXT_SHADOW_DARK = '0 2px 40px rgba(0,0,0,.45)';
export const _blur = blurIn;
export const _font = FONT;
