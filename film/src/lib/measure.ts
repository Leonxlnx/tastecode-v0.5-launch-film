// Text measurement against the real, loaded font. Only call it under <FontGate> (every act is),
// because a measurement taken with the fallback face would be cached and silently wrong.
import { FONT } from '../brand/tokens';

const widths = new Map<string, number>();

/** Advance width in px of one line, exactly as the DOM lays it out (variable weight, em tracking). */
export const measureTracked = (text: string, size: number, weight: number, trackEm: number, family = FONT.text) => {
  const key = `${text}|${size}|${weight}|${trackEm}|${family}`;
  const hit = widths.get(key);
  if (hit !== undefined) return hit;
  const span = document.createElement('span');
  span.textContent = text;
  Object.assign(span.style, {
    position: 'absolute',
    visibility: 'hidden',
    whiteSpace: 'pre',
    fontFamily: family,
    fontSize: `${size}px`,
    fontWeight: String(weight),
    letterSpacing: `${trackEm}em`,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: '1',
  });
  document.body.appendChild(span);
  const w = span.getBoundingClientRect().width;
  document.body.removeChild(span);
  widths.set(key, w);
  return w;
};

/** Largest size (px, at most `max`) at which `text` fits in `maxWidth`. Widths scale linearly with size. */
export const fitSize = (text: string, maxWidth: number, max: number, weight: number, trackEm: number, family = FONT.text) =>
  Math.min(max, (maxWidth / measureTracked(text, 100, weight, trackEm, family)) * 100);

/**
 * Ink metrics of `text` from the font itself (canvas measureText): how far glyphs rise above and
 * fall below the baseline, and where the ink starts and ends. Use it to sit a mark on the cap
 * height or a dot on the baseline instead of guessing from the font size.
 */
type Ink = { ascent: number; descent: number; left: number; right: number; fontAscent: number; fontDescent: number };
const inks = new Map<string, Ink>();

export const inkBox = (text: string, size: number, weight: number, family = FONT.text): Ink => {
  const key = `${text}|${size}|${weight}|${family}`;
  const hit = inks.get(key);
  if (hit) return hit;
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) throw new Error('inkBox: no 2D canvas context');
  ctx.font = `${weight} ${size}px ${family}`;
  const m = ctx.measureText(text);
  const ink = {
    ascent: m.actualBoundingBoxAscent, // ink above the baseline
    descent: m.actualBoundingBoxDescent, // ink below it
    left: -m.actualBoundingBoxLeft,
    right: m.actualBoundingBoxRight,
    fontAscent: m.fontBoundingBoxAscent, // the font's line metrics, which CSS line boxes use
    fontDescent: m.fontBoundingBoxDescent,
  };
  inks.set(key, ink);
  return ink;
};

/** Distance from the top of a CSS line box (font-size `size`, line-height `lead`) down to its baseline. */
export const baselineOf = (size: number, weight: number, lead: number, family = FONT.text) => {
  const { fontAscent, fontDescent } = inkBox('Hg', size, weight, family);
  return (size * lead - (fontAscent + fontDescent)) / 2 + fontAscent;
};

/**
 * The typographic settings every copy line is measured and drawn with (fx/Line.tsx spreads them on
 * its wrapper). Kerning on; ligatures, contextual alternates off; tabular figures, so "v0.5" sets the
 * same in measure and render and a single glyph drawn alone matches its place in the run.
 */
export const GLYPH_FEATURES = {
  fontKerning: 'normal',
  fontVariantLigatures: 'none',
  fontFeatureSettings: '"calt" 0',
  fontVariantNumeric: 'tabular-nums',
} as const;

/** One drawn (non-space) glyph of a line, in px from the line's left edge at the measured size. */
export type Glyph = {
  ch: string; // the character (one code point)
  i: number; // UTF-16 index in the text
  g: number; // index among the drawn glyphs of the line (spaces skipped)
  x: number; // kerned, tracked pen position at the rest weight
  adv: number; // advance at the rest weight: the next glyph's x minus this one (tracking and kerning included)
  advHeavy: number; // the same at rest + 150 (the weight a hit word strikes at)
  inkL: number; // ink left and right edges, px from x (canvas measureText of the glyph alone)
  inkR: number;
  word: number; // word index (words split on single spaces)
  j: number; // glyph index inside its word
  c: number; // the word's centre glyph index, (glyphs in word - 1) / 2
};
/** One word of a line: its glyph range and its advance and ink boxes, px from the line's left. */
export type WordBox = { text: string; first: number; last: number; x0: number; x1: number; cx: number; inkL: number; inkR: number };
export type GlyphLayout = {
  text: string;
  size: number;
  weight: number;
  track: number;
  width: number; // the run's advance at the rest weight (what a plain span measures)
  glyphs: Glyph[];
  words: WordBox[];
};

const layouts = new Map<string, GlyphLayout>();

/** Kerned x of every UTF-16 index of `text` in one DOM run, plus the run's width. */
const runPositions = (text: string, size: number, weight: number, trackEm: number, family: string) => {
  const span = document.createElement('span');
  const node = document.createTextNode(text);
  span.appendChild(node);
  Object.assign(span.style, {
    position: 'absolute',
    left: '0px',
    top: '0px',
    visibility: 'hidden',
    whiteSpace: 'pre',
    fontFamily: family,
    fontSize: `${size}px`,
    fontWeight: String(weight),
    letterSpacing: `${trackEm}em`,
    lineHeight: '1',
    ...GLYPH_FEATURES,
  });
  document.body.appendChild(span);
  const box = span.getBoundingClientRect();
  const range = document.createRange();
  const xs: number[] = [];
  const ws: number[] = [];
  for (let i = 0; i < text.length; i++) {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const r = range.getBoundingClientRect();
    xs.push(r.left - box.left);
    ws.push(r.width);
  }
  document.body.removeChild(span);
  return { xs, ws, width: box.width };
};

const glyphInk = new Map<string, { l: number; r: number }>();
const inkOf = (ch: string, size: number, weight: number, family: string) => {
  const key = `${ch}|${size}|${weight}|${family}`;
  const hit = glyphInk.get(key);
  if (hit) return hit;
  const b = inkBox(ch, size, weight, family);
  const v = { l: b.left, r: b.right };
  glyphInk.set(key, v);
  return v;
};

/**
 * Per-glyph layout of one line, exactly as the DOM sets it: one hidden span holding one text node
 * (kerning on, ligatures and calt off, tabular figures, the role's tracking), and a Range over each
 * character for its kerned x. Measured at the rest weight and at rest + 150 (advHeavy), so a glyph
 * drawn heavier can be centred on its rest advance and the line never reflows. Cached by
 * text|size|weight|track(|kern); call it only under <FontGate>.
 * `kern` (optional) opens single pairs: { [text index]: em } adds em·size to that glyph's x and to
 * every glyph after it, at both weights, so the run's width grows by the sum (fx/Line takes the same map).
 */
export const glyphLayout = (text: string, size: number, weight: number, trackEm: number, family = FONT.text, kern?: Record<number, number>): GlyphLayout => {
  const key = `${text}|${size}|${weight}|${trackEm}|${family}${kern ? `|${JSON.stringify(kern)}` : ''}`;
  const hit = layouts.get(key);
  if (hit) return hit;
  const kerned = (p: { xs: number[]; ws: number[]; width: number }) => {
    if (!kern) return p;
    let dx = 0;
    const xs: number[] = [];
    for (let i = 0; i < p.xs.length; i++) {
      dx += (kern[i] ?? 0) * size;
      xs.push(p.xs[i] + dx);
    }
    return { xs, ws: p.ws, width: p.width + dx };
  };
  const rest = kerned(runPositions(text, size, weight, trackEm, family));
  const heavy = kerned(runPositions(text, size, weight + 150, trackEm, family));
  const advAt = (p: { xs: number[]; ws: number[] }, i: number, n: number) => (i + n < text.length ? p.xs[i + n] - p.xs[i] : p.ws[i]);
  const glyphs: Glyph[] = [];
  const words: WordBox[] = [];
  let word = -1;
  let j = 0;
  let inWord = false;
  for (let i = 0; i < text.length; ) {
    const cp = text.codePointAt(i) ?? 0;
    const n = cp > 0xffff ? 2 : 1;
    const ch = text.slice(i, i + n);
    if (ch === ' ') {
      inWord = false;
    } else {
      if (!inWord) {
        word++;
        j = 0;
        inWord = true;
        words.push({ text: '', first: glyphs.length, last: glyphs.length, x0: 0, x1: 0, cx: 0, inkL: 0, inkR: 0 });
      }
      const ink = inkOf(ch, size, weight, family);
      glyphs.push({ ch, i, g: glyphs.length, x: rest.xs[i], adv: advAt(rest, i, n), advHeavy: advAt(heavy, i, n), inkL: ink.l, inkR: ink.r, word, j: j++, c: 0 });
      words[word].last = glyphs.length - 1;
      words[word].text += ch;
    }
    i += n;
  }
  for (const w of words) {
    const a = glyphs[w.first];
    const z = glyphs[w.last];
    const c = (w.last - w.first) / 2;
    for (let k = w.first; k <= w.last; k++) glyphs[k].c = c;
    w.x0 = a.x;
    w.x1 = z.x + z.adv;
    w.cx = (w.x0 + w.x1) / 2;
    w.inkL = a.x + a.inkL;
    w.inkR = z.x + z.inkR;
  }
  const out: GlyphLayout = { text, size, weight, track: trackEm, width: rest.width, glyphs, words };
  layouts.set(key, out);
  return out;
};
