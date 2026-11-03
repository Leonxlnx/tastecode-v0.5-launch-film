import React from 'react';
import { Img, interpolateColors, staticFile, useCurrentFrame } from 'remotion';
import { C } from '../brand/tokens';
import { Clip, ProxyClip } from '../fx/kit';
import { SiteClip } from '../fx/SiteClip';
import { COVERS, fitView, GUT, isClip, isPage, isSite, NEEDS_DOT, pageFile, PLANE, PLANE_LEFT, Row, V, View, ViewName, windowHeight } from '../fx/WallTiles';
import { E, Ease, fd, hitPulse, lmix, prog } from '../lib/anim';
import { ACT, BEAT, CUE, H, W } from '../timeline';
import type { Sound } from './Sound';

// The biggest moment of the film. One window fills the frame; the camera ticks across one plane of
// everything the film has shown, pulling back a step on each beat, into the last whip, whose huge frame
// sits on the peak. On the peak the dot opens: a paper disc runs out from it behind the wall, its edge
// cutting every tile it crosses, and the frame goes from void to light. That jump is the film's flash.
// Then the disc closes again, faster and faster in log space, carrying the wall with it, and what it
// closes to is the dot, r 22, on void: where the lockup opens. Every tile stays on the plane to the end.
const DUR = ACT.wall.dur;
const PEAK = CUE.peak - ACT.wall.from; // 112: widest
const FALL_AT = PEAK + BEAT * 2; // 168: the wall lets go
const CX = W / 2;
const CY = H / 2;

/** The white dot the lockup opens on (Lockup.tsx: same place, r 22 on its frame 0): the disc, closed. */
export const WALL_END = { x: W / 2, y: H / 2 + 120, r: 22 };

// ---- the plane ------------------------------------------------------------------------------------
type Tile = Row & { key: string; col: number; row: number; back: boolean; x: number; y: number; w: number; h: number; slip: number; phase: number; cut1: number };
const TILES: Tile[] = (() => {
  const out: Tile[] = [];
  let x = PLANE_LEFT;
  PLANE.forEach((col, ci) => {
    let y = col.top;
    col.rows.forEach((t, ti) => {
      const h = t.h ?? windowHeight(col.w);
      out.push({ ...t, key: `${ci}.${ti}`, col: ci, row: ti, back: (ci + ti) % 2 === 0, x: x + col.w / 2, y: y + h / 2, w: col.w, h, slip: col.slip, phase: (ci * 3 + ti) % 2, cut1: 56 + ((ci * 5 + ti * 3) % 3) * 7 });
      y += h + GUT;
    });
    x += col.w + GUT;
  });
  return out;
})();
const HERO = TILES.find((t) => t.key === '3.2')!;

// ---- the camera ------------------------------------------------------------------------------------
// Ticks with asymmetric ramps, as per-frame velocities (w_I3's measured moves): the peak sits a quarter
// to 45% in and the tail creeps. Each axis wakes while the last one is dying, 4 f of overlap.
const ramp = (steps: number[]): Ease => {
  const sum = steps.reduce((a, s) => a + s, 0);
  const cum = [0];
  steps.forEach((s, i) => cum.push(cum[i] + s / sum));
  return (t) => {
    const p = Math.min(steps.length - 1e-6, Math.max(0, t) * steps.length);
    const i = Math.floor(p);
    return cum[i] + (cum[i + 1] - cum[i]) * (p - i);
  };
};
const TICK_A = ramp([48, 44, 64, 100, 116, 96, 72, 56, 44, 36, 28, 24, 20, 16, 12, 12, 12]);
const TICK_B = ramp([20, 32, 52, 80, 108, 120, 112, 92, 72, 60, 48, 40, 32, 28, 24, 20, 16, 16, 12, 8, 8]);
const PAN = ramp([4, 4, 8, 12, 16, 24, 32, 44, 60, 88, 148, 308, 320, 168, 108, 76, 60, 48, 36, 32, 24, 20, 16, 16, 12, 12, 8]);

const Z = { open: 3.72, one: 3.02, two: 1.7, three: 1.12, four: 0.86, peak: 0.68 };
const camera = (f: number) => {
  const open = Math.pow(0.9, Math.max(0, f));
  const t1 = prog(f, 18, 52, TICK_A);
  const t2 = prog(f, 48, 82, TICK_B);
  const t3 = prog(f, 78, 108, TICK_A);
  const t4 = prog(f, 94, 134, PAN);
  // The peak throws the plane on, then it swings back across itself before it lets go. The axes turn at
  // different moments, x while y runs and y while x runs, so the reversal never passes through a held frame.
  const t6 = prog(f, 114, 140, TICK_A);
  const t5 = prog(f, 122, 182, TICK_B);
  const x = HERO.x - 64 * open + 0.9 * f + 290 * t1 - 120 * prog(f, 50, 84, TICK_B) - 800 * t3 + 600 * t4 + 520 * t6 - 640 * t5;
  const y = HERO.y - 40 * open - 0.3 * f - 60 * prog(f, 21, 52, TICK_A) + 420 * t2 - 130 * prog(f, 81, 108, TICK_A) - 310 * prog(f, 97, 134, PAN) - 180 * prog(f, 118, 150, TICK_A) + 300 * prog(f, 152, 200, TICK_B);
  const logZ =
    Math.log(lmix(Z.one, Z.open, open)) +
    Math.log(Z.two / Z.one) * prog(f, 19, 52, TICK_A) +
    Math.log(Z.three / Z.two) * prog(f, 49, 82, TICK_B) +
    Math.log(Z.four / Z.three) * prog(f, 79, 108, TICK_A) +
    Math.log(Z.peak / Z.four) * prog(f, 92, PEAK, E.contact);
  // Widest exactly on the peak: the wave throws the plane back at the camera, and it keeps leaning in
  // until it falls.
  const z = Math.exp(logZ) * (1 + 0.085 * hitPulse(f - PEAK, 3, 15)) * lmix(1, 1.05, prog(f, PEAK, FALL_AT, E.linear));
  const rot = -0.9 * open + 1.4 * prog(f, 20, 52, TICK_A) - 2.4 * prog(f, 50, 82, TICK_B) + 1.1 * prog(f, 80, 108, TICK_A) - 1.6 * prog(f, 95, 134, PAN) + 1.6 * prog(f, 130, 190, TICK_B) - 0.012 * Math.max(0, f - PEAK);
  return { x, y, z, rot };
};

const rad = (deg: number) => (deg * Math.PI) / 180;
/** A tile's centre on screen under the camera, before the fall. */
const onScreen = (t: Tile, f: number, cam: ReturnType<typeof camera>) => {
  const dx = (t.x - cam.x) * cam.z;
  const dy = (t.y + t.slip * f - cam.y) * cam.z;
  const r = rad(cam.rot);
  return { x: CX + dx * Math.cos(r) - dy * Math.sin(r), y: CY + dx * Math.sin(r) + dy * Math.cos(r) };
};

// ---- the wave out and the fall in --------------------------------------------------------------------
const DISC = 1650; // just beyond the plane's corners, so it closes hugging the wall
const WAVE = 0.82;
/** The paper disc on its way out. Its first frame of size is the hit frame: it starts a frame before. */
const waveR = (f: number) => (f < PEAK - 1 ? 0 : DISC * (1 - Math.pow(WAVE, f - (PEAK - 1))));
const waveHit = (d: number) => PEAK - 1 + Math.log(Math.max(1e-3, 1 - d / DISC)) / Math.log(WAVE);

const PEAK_CAM = camera(PEAK);
const FROM_DOT: Record<string, number> = Object.fromEntries(
  TILES.map((t) => {
    const q = onScreen(t, PEAK, PEAK_CAM);
    return [t.key, Math.hypot(q.x - WALL_END.x, q.y - WALL_END.y)];
  }),
);
const REACH = 1500;

const K = 1.1; // growth of the fall per frame, in log space
const LAG = 4; // f: the outermost tile starts this much behind the innermost, and the disc with it
const LAND = DUR - 1; // 223, the act's last frame: the disc closes into the dot on the music's stop. Void and dot.
const FALL = Math.log(DISC / WALL_END.r) / (Math.pow(K, LAND - FALL_AT - LAG) - 1); // lands exactly on LAND
/** -ln(scale) of the plane toward the dot, n frames after it lets go. */
const fall = (n: number) => (n <= 0 ? 0 : FALL * (Math.pow(K, n) - 1));

const discR = (f: number) => (f >= LAND ? WALL_END.r : f < FALL_AT ? waveR(f) : DISC * Math.exp(-fall(f - FALL_AT - LAG)));
const TURN = -5; // deg per unit of log scale

// One hard cut inward on the beat after the peak, so no tile holds and the eye starts for the dot.
const cut2At = (d: number) => PEAK + BEAT + Math.round((1 - Math.min(1, d / 1200)) * 8);

// The film's idea, paid back: on the second cut the tile whose Needs you row will fall closest to the dot turns
// to the rail (the real rail, its real yellow row), the one yellow left in the middle of the wall. It stays a
// tile of the plane: its slot, its turn, its scale and its fall are every tile's (r8: no pin, no slide on top,
// no dot grown out of its row; Leon: no dots). The disc closes over it into the white dot.
/** Where the Needs you dot sits in a tile, from the tile's centre, in the tile's own px. */
const needsOffset = (t: Tile) => {
  const fit = fitView(V.needs, t.w, t.h, 0);
  return { x: (NEEDS_DOT.x - fit.x) * fit.ks - t.w / 2, y: (NEEDS_DOT.y - fit.y) * fit.ks - t.h / 2 };
};
const NEEDS_KEY = (() => {
  const cam = camera(FALL_AT);
  const a = rad(cam.rot);
  const dist = (t: Tile) => {
    const q = onScreen(t, FALL_AT, cam);
    const o = needsOffset(t);
    return Math.hypot(q.x + (o.x * Math.cos(a) - o.y * Math.sin(a)) * cam.z - WALL_END.x, q.y + (o.x * Math.sin(a) + o.y * Math.cos(a)) * cam.z - WALL_END.y);
  };
  return TILES.reduce((best, t) => (dist(t) < dist(best) ? t : best)).key;
})();

// ---- one tile on frame f ----------------------------------------------------------------------------
/** A tile's place on screen: the plane's transform, the wave's shove and the fall. Every tile, the Needs one too. */
const poseOf = (t: Tile, f: number, cam: ReturnType<typeof camera>) => {
  const q = onScreen(t, f, cam);
  const d = FROM_DOT[t.key];
  const hit = waveHit(d);
  const shove = hitPulse(f - hit, 2, 10);
  const ln = fall(f - FALL_AT - LAG * Math.min(1, d / REACH));
  const s = Math.exp(-ln);
  const turn = rad(TURN * ln);
  const out = (shove * 84) / Math.max(1, Math.hypot(q.x - WALL_END.x, q.y - WALL_END.y));
  const vx = (q.x - WALL_END.x) * (s + out);
  const vy = (q.y - WALL_END.y) * (s + out);
  const sx = WALL_END.x + vx * Math.cos(turn) - vy * Math.sin(turn);
  const sy = WALL_END.y + vx * Math.sin(turn) + vy * Math.cos(turn);
  // Tiles shrink faster than the plane, so the paper opens up between them as it closes. The wave
  // leaves them a little smaller too: the light gutters are wider than the dark ones.
  const S = cam.z * Math.exp(-ln * 1.15) * (1 + 0.03 * shove) * (1 - 0.03 * prog(f, hit, hit + 12, E.out));
  const rot = cam.rot + TURN * ln;
  const wS = t.w * S;
  const hS = t.h * S;
  const hd = Math.hypot(wS, hS) / 2;
  const on = !(Math.abs(sx - CX) > CX + hd || Math.abs(sy - CY) > CY + hd || wS < 2.5);
  return { sx, sy, S, rot, wS, hS, hd, d, hit, cut2: cut2At(d), isNeeds: t.key === NEEDS_KEY, on };
};
type Pose = ReturnType<typeof poseOf>;

/** What a tile shows on frame f: the view before the wave's edge (old) and behind it (fresh), and which is whole. */
const viewsOf = (t: Tile, f: number, p: Pose, wave: number) => {
  const g = fd(f);
  const dNow = Math.hypot(p.sx - WALL_END.x, p.sy - WALL_END.y);
  const settled = f >= PEAK + 16;
  const before = !settled && wave <= dNow - p.hd;
  const after = settled || wave >= dNow + p.hd;
  const pre = t.pre && g < t.cut1;
  const oldName: ViewName = pre ? t.pre! : t.a;
  const old = V[oldName];
  // A site take starts on the tile's first frame (its `from` is its first clean frame); a clip reaches `from` on 56.
  const oldZero = t.pre ? (pre ? 0 : t.cut1) : isSite(old) ? 0 : 56;
  const cut3 = t.back && !p.isNeeds ? 150 + ((t.col * 5 + t.row * 7) % 3) * 7 : Infinity;
  const freshName: ViewName = g >= cut3 ? t.a : g >= p.cut2 ? (p.isNeeds ? 'needs' : t.d) : t.c;
  const freshZero = g >= cut3 ? cut3 : g >= p.cut2 ? p.cut2 : PEAK;
  return { g, before, after, old, oldName, oldZero, fresh: V[freshName], freshName, freshZero, shownName: after ? freshName : oldName };
};

export const Wall: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camera(f);
  const wave = waveR(f);
  const disc = discR(f);
  const discFill = interpolateColors(disc, [60, 1300], [C.white, C.mist]);

  return (
    <div style={{ position: 'absolute', inset: 0, background: C.void, overflow: 'hidden' }}>
      {disc > 0 && (
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
          <circle cx={WALL_END.x} cy={WALL_END.y} r={disc} fill={discFill} />
        </svg>
      )}
      {f < LAND && (
        // From the fall on, nothing shows past the closing disc.
        <div style={{ position: 'absolute', inset: 0, clipPath: f >= FALL_AT ? `circle(${disc}px at ${WALL_END.x}px ${WALL_END.y}px)` : undefined }}>
        {TILES.map((t) => {
          const p = poseOf(t, f, cam);
          if (!p.on) return null;
          const { sx, sy, S, rot, wS } = p;
          const { g, before, after, old, oldZero, fresh, freshZero } = viewsOf(t, f, p, wave);
          const step = wS > 800 ? 1 : wS > 110 ? 2 : 4;
          const at = g - ((g + t.phase) % step);
          // The dot in the tile's own px, for the wave's edge inside it.
          const r0 = rad(-rot);
          const lx = ((WALL_END.x - sx) * Math.cos(r0) - (WALL_END.y - sy) * Math.sin(r0)) / S + t.w / 2;
          const ly = ((WALL_END.x - sx) * Math.sin(r0) + (WALL_END.y - sy) * Math.cos(r0)) / S + t.h / 2;
          const shown = after ? fresh : old;
          const radius = Math.min(16, wS * 0.05) / S;
          return (
            <div
              key={t.key}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: t.w,
                height: t.h,
                overflow: 'hidden',
                borderRadius: radius,
                background: shown.light ? C.paper : C.ink,
                transformOrigin: '0 0',
                transform: `translate(${sx}px, ${sy}px) rotate(${rot}deg) scale(${S}) translate(${-t.w / 2}px, ${-t.h / 2}px)`,
              }}
            >
              {wS >= 28 && <TileBody v={shown} live={at - (after ? freshZero : oldZero)} drift={f - (after ? freshZero : oldZero)} S={S} t={t} />}
              {!before && !after && (
                <div style={{ position: 'absolute', inset: 0, background: fresh.light ? C.paper : C.ink, clipPath: `circle(${wave / S}px at ${lx}px ${ly}px)` }}>
                  <TileBody v={fresh} live={at - freshZero} drift={f - freshZero} S={S} t={t} />
                </div>
              )}
              <div style={{ position: 'absolute', inset: 0, borderRadius: radius, boxShadow: `inset 0 0 0 ${1 / S}px ${shown.light ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.1)'}` }} />
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

const TileBody: React.FC<{ v: View; live: number; drift: number; S: number; t: Tile }> = ({ v, live, drift, S, t }) => {
  const fit = fitView(v, t.w, t.h, drift);
  const box: React.CSSProperties = { position: 'absolute', left: 0, top: 0, width: fit.w, height: fit.h, transformOrigin: '0 0', transform: `scale(${fit.ks}) translate(${-fit.x}px, ${-fit.y}px)` };
  const big = t.w * S > 1000 || fit.w * fit.ks * S > 1500;
  if (isClip(v)) {
    const frame = v.from + (v.rate ?? 1) * live;
    const Src = big ? Clip : ProxyClip;
    const n = fd(frame);
    // The covers sit in the clip's own px, inside the same scaled box as the frame: they move and scale with it.
    return (
      <div style={box}>
        <Src id={v.clip} frame={frame} />
        {(COVERS[v.clip] ?? []).map((cv, i) => {
          if (cv.at && (n < cv.at[0] || n > cv.at[1])) return null;
          const place: React.CSSProperties = { position: 'absolute', left: 0, top: 0, width: cv.w, height: cv.h, transform: `translate(${cv.x}px, ${cv.y}px)` };
          return 'fill' in cv ? (
            <div key={i} style={{ ...place, background: cv.fill }} />
          ) : (
            <div key={i} style={{ ...place, overflow: 'hidden' }}>
              <Src id={v.clip} frame={cv.from} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${-cv.x}px, ${-cv.y}px)` }} />
            </div>
          );
        })}
      </div>
    );
  }
  // Never before `from`: the frames before it carry a wordmark or a cursor (the first stepped frame can be live -1).
  if (isSite(v)) return <div style={box}><SiteClip id={v.site} frame={v.from + (v.rate ?? 1) * Math.max(0, live)} proxy={!big} /></div>;
  const url = staticFile(isPage(v) ? pageFile(v.page) : `plates/${(v as { plate: string }).plate}.jpg`);
  return <Img src={url} style={{ ...box, objectFit: 'cover' }} />;
};

/** Sound: the entry, the peak, and the fall landing on the dot. The three beat pushes are the music's. */
export const WALL_SOUND: Sound[] = [
  { f: 0, kind: 'swish', weight: 0.7 },
  { f: PEAK, kind: 'impact-big', weight: 1 }, // out of an empty hole: nothing sounds in the 12 f before it
  { f: PEAK, kind: 'impact', weight: 0.8 }, // the mid-rich body the big one lacks
  // the vacuum builds through the fall and peaks on the landing, where the mix cuts it with the music (tools/mix 'implode').
  // As a 'suck' it was set by its tail and peaked 20 f early, fading while the disc visibly closed (crit8).
  { f: LAND, kind: 'implode', weight: 1.4 },
];

export const WALL = { peak: PEAK, end: WALL_END };

/** QA: how many tiles are mounted on frame f. */
export const wallMounted = (f: number) => {
  const cam = camera(f);
  return TILES.filter((t) => poseOf(t, f, cam).on).length;
};

/** QA: every mounted tile on frame f: its key, the plane slot, its pose on screen and the view it shows. */
export const wallQA = (f: number) => {
  const cam = camera(f);
  const wave = waveR(f);
  return TILES.flatMap((t) => {
    const p = poseOf(t, f, cam);
    if (!p.on) return [];
    const v = viewsOf(t, f, p, wave);
    return [{ key: t.key, col: t.col, row: t.row, x: p.sx, y: p.sy, w: p.wS, h: p.hS, rot: p.rot, needs: p.isNeeds, shown: v.shownName, old: v.oldName, fresh: v.freshName, edge: !v.before && !v.after }];
  });
};
export const WALL_QA = { peak: PEAK, fallAt: FALL_AT, land: LAND, disc: discR, needsKey: NEEDS_KEY };
