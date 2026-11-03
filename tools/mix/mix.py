#!/usr/bin/env python3
"""
mix.py: the film's soundtrack. Cuts the licensed track onto the film's bar grid, places licensed
SFX on the cues the picture code exports (film/out/cues.json, which also gives the film's length and the
lockup's roof, where the ring-out starts), ducks, sums, and masters with
cinetic's chain (film/scripts/audio/master.py) to -14 LUFS, true peak under -1.2 dBTP (limiter ceiling -1.6 dBFS,
-1.3 on the wall's beat), with the wall's beat the loudest of the film by WALL_MARGIN dB (level_to_wall).

    python -I tools/mix/mix.py [--no-sfx] [--track next-horizon]

Writes film/public/audio/soundtrack.wav, film/out/stems/{music,sfx}.wav and film/out/qa/mix.json.
"""
import argparse
import json
import os
import subprocess
import sys
from fractions import Fraction

import numpy as np
import soundfile as sf
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # the repo root
sys.path.insert(0, os.path.join(ROOT, 'film', 'scripts', 'audio'))
import master as M  # noqa: E402

SR = 48000
FPS = 60
BEAT_F = 28
BAR_F = 112
PRE_MASTER = 10 ** (-5 / 20)
SFX = os.path.join(ROOT, 'audio-src', 'sfx')
CACHE = os.path.join(ROOT, 'tools', 'mix', 'cache')
CUES = os.path.join(ROOT, 'film', 'out', 'cues.json')


def _cue_doc():
    try:
        d = json.load(open(CUES, encoding='utf-8'))
        return d if isinstance(d, dict) else {}
    except (OSError, ValueError):
        return {}


# The film's length and the lockup's roof come from the exported cues (src/timeline.ts TOTAL and CUE.roof), so the
# ring-out follows the picture. Fallbacks: round 8 (Leon's notes on preview 6, Nov 3; the lockup starts on b(36) = 3920).
_DOC = _cue_doc()
TOTAL = int(_DOC.get('total', 4172))
ROOF = int(_DOC.get('cue', {}).get('roof', 3920 + 44))
RING_FADE = 90  # f: the ring-out's raised-cosine fade onto the last frame, under the still end card

TRACKS = {
    # period and t0 are the source's own beat grid, measured on the downloaded track (the notes are not in this repo).
    'next-horizon': {
        'file': os.path.join(ROOT, 'audio-src', 'music-pixabay', 'next-horizon.mp3'),
        'period': 0.46154,
        't0': 0.009,
        # (film bar, track beat in, track beat out); length in beats always equals the film length.
        # Round 8: every seam is a whole bar of the film, on a hard cut or a pre-drop hole.
        'edit': [
            (1, 12, 32),  # intro, filter opening
            (6, 32, 64),  # drop 1: rebuilt, needs, redrawn
            (14, 128, 144),  # the sparse breakdown from the calm card's "work,"; the 140 lift lands on b(17), the design card (64 -> 128: 16 bars, phrase-aligned)
            (18, 152, 216),  # the build's last 2 bars under Compose's typing, drop 2 at 160 = b(20) on the deal, then drop 2 through the cards; hats at 192 = b(28) on the skills cut
            (34, 248, 256),  # the brightest bars: the wall, peak b(35) (216 -> 248: 8 bars, on the cut into the wall)
        ],
        'ring': 256,  # ring-out starts at this beat, on the lockup's roof
    },
}


def fb(bar, beat=0.0):
    return ((bar - 1) * 4 + beat) * BEAT_F


def s(frame):
    return int(round(frame / FPS * SR))


def stretched(track):
    """Decode at 48 kHz and stretch so one beat is exactly 28 frames. Cached."""
    os.makedirs(CACHE, exist_ok=True)
    t = TRACKS[track]
    out = os.path.join(CACHE, f'{track}-28f.wav')
    ratio = (BEAT_F / FPS) / t['period']  # output seconds per input second
    if not os.path.exists(out):
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-threads', '2', '-i', t['file'], '-af', f'rubberband=tempo={1 / ratio:.6f}:transients=crisp:detector=compound:phase=laminar:window=short:smoothing=off:formant=preserved:pitchq=quality,aresample=48000', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_f32le', out], check=True)
    x, sr = sf.read(out, always_2d=True, dtype='float64')
    assert sr == SR
    return x, t['t0'] * ratio


def cut_music(track):
    x, t0 = stretched(track)
    t = TRACKS[track]
    n = s(TOTAL)
    out = np.zeros((n, 2))
    xf = int(0.012 * SR)
    fade_i = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, xf))
    for bar, b0, b1 in t['edit']:
        at = s(fb(bar))
        i0 = int(round((t0 + b0 * BEAT_F / FPS) * SR))
        i1 = int(round((t0 + b1 * BEAT_F / FPS) * SR))
        seg = x[i0 - xf // 2:i1 + xf // 2].copy()
        seg[:xf] *= fade_i[:, None]
        seg[-xf:] *= fade_i[::-1, None]
        j = at - xf // 2
        if j < 0:
            seg = seg[-j:]
            j = 0
        k = min(n, j + len(seg))
        out[j:k] += seg[: k - j]
    return out, x, t0, t


# ------------------------------------------------------------------------------------------
# SFX
# ------------------------------------------------------------------------------------------
# kind -> list of (file, level dB relative to a -6 dBFS peak, align[, opts]). Alternates rotate by event
# order. opts: trim (a, b) seconds kept of the source (b None = to the end), cut before resampling;
# rate, tape-style resample (0.63 = 8 semitones down and 1.59x longer); pre, seconds kept before the
# peak (a 10 ms fade in), so a hit's own build-up cannot fill the hole the music leaves for it.
# post, seconds kept after the peak, faded out over that span (raised cosine from the peak), so a riser stops on its frame.
# lp: a low-pass corner in Hz, after the rate. Peak, start and end are measured after trim, rate and lp.
# Leon (Nov 2): no 'toggle' (quick-switch-click) and no 'bell' anywhere; they were the film's worst sounds.
KIT = {
    'tick': [('ui/interface-click-hover.wav', -6, 'peak', {'trim': (0.090, None)})],  # the file's first click leads the real one by 108 ms
    'pop': [('ui/plastic-bubble-click.wav', -4, 'peak')],
    'click': [('ui/mouse-click-close.wav', -6, 'peak', {'trim': (0.0, 0.060)})],  # two clicks 124 ms apart: the first only
    'press': [('ui/mouse-click-c.wav', -3, 'peak')],
    # the press, 4 semitones down and dark (centroid about 1.5 kHz, was 3.6): a very soft, short, low click
    'click-low': [('ui/mouse-click-c.wav', -3, 'peak', {'rate': 0.8, 'lp': 2500})],
    'switch': [('ui/light-switch-tap.wav', -8, 'peak')],
    'confirm': [('ui/ui-menu-soft-confirm.wav', -10, 'peak', {'rate': 0.944})],  # A#6 -> A6, in the track's A
    'key': [('keys/mech-keyboard-01.wav', -12, 'peak'), ('keys/mech-keyboard-02.wav', -12, 'peak'), ('keys/mech-key-hard.wav', -14, 'peak'), ('keys/hard-single-key-laptop.wav', -13, 'peak')],
    'enter': [('keys/enter-key-mech.wav', -7, 'peak', {'trim': (0.095, None)})],  # 100 ms of rattle before the stroke
    'swish': [('whoosh/fast-transitions-swoosh.wav', -8, 'peak')],
    # a low air sweep (0.3-0.6 kHz) cut 3 f before its peak: it starts at speed and decays over about 20 f, for a
    # move that is fastest on its first frame (the eclipse's shutter). The bright swish is 7 kHz.
    'sweep-soft': [('whoosh/fast-air-sweep.wav', -9, 'peak', {'pre': 0.05})],
    'whoosh': [('whoosh/fast-sweep.wav', -7, 'peak'), ('whoosh/fast-sweep.wav', -7, 'peak', {'rate': 0.89})],  # one sound, two sizes
    # whoosh-big: 13 f in, 25 f out, for a move that starts at speed and decays; whoosh-long: 52 f of build,
    # 9 f out, for a camera that accelerates into its peak. Picked by kind, not by event order.
    'whoosh-big': [('whoosh/cinematic-wind-swoosh.wav', -6, 'peak')],
    'whoosh-long': [('whoosh/cinematic-whoosh-fast.wav', -5, 'peak')],
    'air': [('whoosh/air-woosh.wav', -10, 'peak')],
    'sub': [('impact/kick-sub-hit.wav', -3, 'peak')],
    'bass': [('impact/short-bass-hit.wav', -3, 'peak')],
    'impact': [('impact/cinematic-whoosh-deep-impact.wav', -3, 'peak', {'pre': 0.060})],
    'impact-big': [('impact/big-cinematic-impact.wav', -2, 'peak', {'pre': 0.060})],
    'land': [('impact/light-impact-ground.wav', -6, 'peak')],
    'riser': [('riser/reverse-cymbal-shiny.wav', -9, 'end')],
    'riser-long': [('riser/noise-uplift-3s.wav', -10, 'end')],
    'swell': [('riser/movie-swell-3s.wav', -7, 'end', {'rate': 0.977})],  # 40 cents sharp in the source
    'suck': [('riser/vacuum-swoosh.wav', -7, 'end')],
    # the wall's fall into the dot (crit8, Leon on preview 7: "sound a bit weird just before the boards turn into the
    # logo"). As 'suck' it was set by its 3 % end, so its peak sat 20 f before LAND: it was 6 dB down by 3905 and 20 dB
    # down by 3916, fading through the whole visible collapse (disc r 1100 at 3896 to r 22 at 3919) before the music's
    # stop. Here its peak is on the frame (the dot's landing) and it is cut there over that one frame, with the music.
    'implode': [('riser/vacuum-swoosh.wav', -7, 'peak', {'post': 1 / 60})],
    'suck-short': [('riser/air-zoom-vacuum.wav', -8, 'end')],
    'slide': [('slide/slide-card-05.wav', -9, 'peak'), ('slide/card-slide.wav', -9, 'peak')],
    'paper': [('slide/paper-swipe-long.wav', -10, 'start')],  # starts on its frame, never before the drop
    'shutter': [('slide/camera-shutter-click-b.wav', -9, 'peak')],
    'ping': [('shimmer/glass-ping.wav', -12, 'peak', {'rate': 1.0234})],  # a single partial at G#7 -40 c: +40 c puts it on G#7, in B major
    'glass': [('shimmer/cinematic-glass-hit.wav', -8, 'start')],  # the strike is 24 ms in; the smoothed peak is 400 ms late
}
# Impacts duck the music; depth by kind. The bass is sub only: ducking with it only took the flips down.
DUCK = {'sub': 0.3, 'bass': 0.0, 'impact': 0.5, 'impact-big': 0.6, 'land': 0.15}

_cache = {}


def load(rel, opts=None):
    opts = opts or {}
    key = (rel, opts.get('trim'), opts.get('rate', 1.0), opts.get('lp'))
    if key in _cache:
        return _cache[key]
    x, sr = sf.read(os.path.join(SFX, rel), always_2d=True, dtype='float64')
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    x = x[:, :2]
    if sr != SR:
        x = signal.resample_poly(x, SR, sr, axis=0)
    if opts.get('trim'):
        a, b = opts['trim']
        x = x[int(a * SR): (int(b * SR) if b else None)].copy()
        k = min(len(x), int(0.002 * SR))
        x[:k] *= np.linspace(0, 1, k)[:, None]
        x[-k:] *= np.linspace(1, 0, k)[:, None]
    r = opts.get('rate', 1.0)
    if abs(r - 1) > 1e-4:
        q = Fraction(1 / r).limit_denominator(400)  # play at rate r: the result is 1/r as long
        x = signal.resample_poly(x, q.numerator, q.denominator, axis=0)
    if opts.get('lp'):
        x = signal.sosfilt(signal.butter(4, opts['lp'], 'low', fs=SR, output='sos'), x, axis=0)
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.5  # -6 dBFS peak
    env = signal.sosfilt(signal.butter(2, 60, 'low', fs=SR, output='sos'), np.abs(x).max(axis=1))
    peak = int(np.argmax(env))
    above = np.where(env > env.max() * 0.03)[0]
    end = int(above[-1]) if len(above) else len(x) - 1
    start = int(above[0]) if len(above) else 0
    # a very short attack before the peak is kept; long lead-ins (a file's silence) are trimmed
    _cache[key] = (x, peak, end, start)
    return _cache[key]


def place(bus, rel, f, level_db, align, pan, length=None, opts=None):
    opts = opts or {}
    x, peak, end, start = load(rel, opts)
    g = 10 ** (level_db / 20)
    anchor = {'peak': peak, 'end': end, 'start': start}[align]
    if opts.get('post') is not None:
        # keep `post` seconds after the peak, faded from the peak to silence (raised cosine)
        k = max(1, int(round(opts['post'] * SR)))
        x = x[: peak + k].copy()
        k = min(k, len(x) - peak)
        x[peak: peak + k] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, k)))[:, None]
    if opts.get('pre') is not None:
        # keep only `pre` seconds before the peak, faded in over 10 ms
        cut = max(0, peak - int(opts['pre'] * SR))
        x = x[cut:].copy()
        k = min(len(x), int(0.010 * SR))
        x[:k] *= (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, k)))[:, None]
        anchor -= cut
    i = s(f) - anchor
    a = max(0, -i)
    y = x[a:].copy()
    if length:
        y = y[: int(length * SR)]
        k = min(len(y), int(0.05 * SR))
        y[-k:] *= np.linspace(1, 0, k)[:, None]
    i = max(0, i)
    k = min(len(bus), i + len(y))
    if k <= i:
        return
    # constant-power pan
    th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    bus[i:k, 0] += y[: k - i, 0] * g * np.cos(th) * np.sqrt(2)
    bus[i:k, 1] += y[: k - i, 1] * g * np.sin(th) * np.sqrt(2)


def bed(bus, rel, f0, f1, level_db, fade_in=0.4, fade_out=0.6, opts=None):
    x, *_ = load(rel, opts)
    n = s(f1) - s(f0)
    y = np.resize(x, (n, 2)).copy()
    w = np.ones(n)
    a, c = min(n, int(fade_in * SR)), min(n, int(fade_out * SR))
    w[:a] = np.linspace(0, 1, a)
    w[-c:] = np.linspace(1, 0, c)
    bus[s(f0): s(f0) + n] += y * w[:, None] * 10 ** (level_db / 20)


def automate(points, n):
    """Gain curve in dB from (frame, dB) points, smoothed linear."""
    fr = np.array([p[0] for p in points], dtype=float)
    db = np.array([p[1] for p in points], dtype=float)
    t = np.arange(n) / SR * FPS
    return 10 ** (np.interp(t, fr, db) / 20)


# The wall's beat (CUE.peak) is the film's loudest by at least WALL_MARGIN dB: RMS of the master's mono sum over
# each 28 f beat of the grid, the measure the reviews use.
WALL_BEAT = fb(35)
# 3.2 dB cost both drops their landing (drop 1's first beat was trimmed 4.9 dB), so the lead is 1.5 dB over
# ordinary beats and only 0.6 dB over the two drops' downbeats, which must still hit.
WALL_MARGIN = 1.5
MARGIN_AT = {fb(6): 0.6, fb(20): 0.6}
CEIL = 0.83  # -1.6 dBFS
WALL_CEIL = 10 ** (-1.3 / 20)


def beat_rms(y):
    m = y.mean(axis=1)
    return {f: float(20 * np.log10(np.sqrt(np.mean(m[s(f): s(f + BEAT_F)] ** 2)) + 1e-12)) for f in range(0, TOTAL - BEAT_F + 1, BEAT_F)}


def trim_curve(trim, n):
    """Gain from per-beat trims in dB, shaped like a slow compressor's: in over 4 f centred on the beat line, held
    to the beat's end, then released over 24 f into the next beat, so the music never steps back up under a tail.
    Overlaps take the deeper trim."""
    db = np.zeros(n)
    a, r = s(2), s(24)
    for f, d in trim.items():
        i0, i1 = s(f), s(f + BEAT_F)
        lo, hi = max(0, i0 - a), min(n, i1 + r)
        k = np.arange(lo, hi)
        g = np.where(k < i0 + a, 0.5 - 0.5 * np.cos(np.pi * np.clip((k - (i0 - a)) / (2 * a), 0, 1)), 1.0)
        g = np.where(k >= i1, 0.5 + 0.5 * np.cos(np.pi * np.clip((k - i1) / r, 0, 1)), g)
        db[lo:hi] = np.minimum(db[lo:hi], -d * g)
    return 10 ** (db / 20)


def level_to_wall(mix):
    """Master, measure every beat, trim (before the master) each beat within WALL_MARGIN of the wall's, repeat."""
    n = len(mix)
    t = np.arange(n) / SR * FPS
    w = np.clip(np.minimum(t - (WALL_BEAT - 2), (WALL_BEAT + BEAT_F + 2) - t) / 2, 0, 1)
    ceiling = CEIL + (WALL_CEIL - CEIL) * w
    trim = {}
    for it in range(8):
        y, info = M.finish(mix * trim_curve(trim, n)[:, None], lufs=-14.0, ceiling=ceiling, drive=0, air=0, end_fade=0.3)
        r = beat_rms(y)
        top = {f: r[WALL_BEAT] - MARGIN_AT.get(f, WALL_MARGIN) for f in r}
        over = {f: v - top[f] for f, v in r.items() if f != WALL_BEAT and v > top[f]}
        print(f'level pass {it + 1}: wall {r[WALL_BEAT]:.2f} dB, {len(over)} beats within {WALL_MARGIN} dB of it', file=sys.stderr)
        if not over:
            break
        for f, e in over.items():
            trim[f] = min(5.0, trim.get(f, 0.0) + 1.3 * e + 0.05)
    return y, info, trim


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--no-sfx', action='store_true')
    ap.add_argument('--track', default='next-horizon')
    a = ap.parse_args()

    music, stretched_x, t0, t = cut_music(a.track)
    n = len(music)

    cues = []
    if os.path.exists(CUES) and not a.no_sfx:
        cues = _DOC.get('events', [])
        assert _DOC.get('fps', FPS) == FPS, 'cues.json is not at 60 fps'

    roof = ROOF - 2  # CUE.roof - 2: the contact shows 2-4 f before ROOF; the lockup's one soft land sits here too
    assert fb(36) < roof < TOTAL - RING_FADE, f'roof {roof} leaves no ring-out before {TOTAL}'
    # the ring-out starts on the roof's contact, under the mark. The source decays from -16 to about -48 dBFS over
    # the 210 f it now has (it had 170 f with the teaser); the automation holds it up under the name and the line,
    # and RING_FADE takes it to silence on the last frame, so nothing is cut off.
    ring = t['ring']
    i0 = int(round((t0 + ring * BEAT_F / FPS) * SR))
    seg = stretched_x[i0 : i0 + (n - s(roof))].copy()
    k = min(len(seg), int(0.012 * SR))
    seg[:k] *= np.linspace(0, 1, k)[:, None]
    music[s(roof) : s(roof) + len(seg)] += seg

    # Music gain: lift the intro so frame 0 has intent; pull down a little under the quietest UI; dip
    # 15-20 dB just before each bloom so it lands harder; hard stop at the implosion. The body (bars 7-13,
    # 21-33) sits 2.5 dB or more under the drops so the loudness pass gives the wall the headroom. Round 8: the cards
    # in drop 2 sit 1.5 dB under their footage (the sentence alone on black wants a quieter room than the UI).
    press = fb(19, 1)  # CUE.press
    gain = automate(
        [
            (0, -1.5), (fb(5), -0.5), (fb(5, 2), -1.5),  # the intro and the eclipse sit under drop 1
            (fb(5, 3), -6), (fb(6) - 8, -14), (fb(6) - 1, -14), (fb(6), -4.5),  # the suck before drop 1; the drop hits out of the hole, 3 dB under the wall's beat
            (fb(7), -6.5), (fb(13, 2) - 4, -6.5),
            # the breath under the calm card's empty stage (36 f of black); the breakdown lands with "work,"
            (fb(13, 2) + 8, -15), (fb(14) - 3, -15), (fb(14), -7.5), (fb(17) - 1, -7.5),
            (fb(17), -6.5), (fb(18) - 1, -6.5),  # the 140 lift under the design card
            (fb(18) + 44, -6.5), (fb(18) + 50, -9), (press - 4, -9), (press + 6, -3),  # compose typing: keys in front, back up on the press
            (fb(20) - 30, 0), (fb(20) - 10, -14), (fb(20) - 1, -14), (fb(20), 0), (fb(20) + 20, 0), (fb(20) + 32, -1.5),  # the hole before drop 2; the deal
            (fb(21), -4), (fb(22, 2) - 1, -4), (fb(22, 2), -2.5), (fb(23, 2) - 1, -3),  # sites; the flips sit up a little
            (fb(23, 2), -5), (fb(25) - 1, -5), (fb(25), -3.5), (fb(26, 1) - 1, -3.5),  # switch card 1.5 dB under its footage
            (fb(26, 1), -5), (fb(28) - 1, -5), (fb(28), -4), (fb(29) - 1, -4),  # skills card; the hats on the skills cut
            (fb(29), -6), (fb(30) - 1, -6), (fb(30), -4.5), (fb(31) - 1, -4.5),  # split card, split
            (fb(31), -6), (fb(32) - 1, -6), (fb(32), -5), (fb(34) - 1, -5),  # limits card, limits, review, update
            # the wall: it enters under the peak and builds, a breath and a hole as deep as drop 1's, then the film's
            # loudest beat; the hit's beat holds, the cut inward eases off, the fall holds the bar to its last beat
            # (fb(35, 3) = 3892, just before the disc shows at 3896), then recedes under the vacuum ('implode', peak on
            # the landing) into the stop on the disc's landing. crit8: fading from fb(35) + 56 left a 5 dB sag at 3904
            # once the vacuum's peak moved onto the landing.
            (fb(34), -5.5), (fb(35) - 28, -4), (fb(35) - 20, 1), (fb(35) - 12, -16), (fb(35) - 1, -16), (fb(35), 5.5), (fb(35) + 24, 5.5),
            (fb(35) + 28, 2), (fb(35) + 56, 1), (fb(35, 3), 0), (fb(36) - 4, -10), (fb(36) - 2, -10),
            (fb(36), -80), (roof - 1, -80), (roof, -3), (roof + 8, -3),
            # the ring-out decays about 30 dB by the end; hold it up under the name (roof + 61) and the line, then
            # level while RING_FADE takes it out under the still card
            (roof + 50, 1), (roof + 90, 4), (roof + 130, 6), (TOTAL, 6),
        ],
        n,
    )
    music = music * gain[:, None]
    # the ring-out's fade: raised cosine from TOTAL - RING_FADE to zero on the last frame
    tf = np.arange(n) / SR * FPS
    u = np.clip((tf - (TOTAL - RING_FADE)) / RING_FADE, 0, 1)
    music = music * (0.5 + 0.5 * np.cos(np.pi * u))[:, None]

    sfx = np.zeros((n, 2))
    # A room under the opening and under the hole between the implosion and the roof, very low, so silence is never
    # digital until the end.
    bed(sfx, 'texture/low-freq-drone.wav', 0, fb(5), -30, 0.02, 1.0)
    # near silence: the loudness pass lifts it. The drone is a C power chord (C2 65.2 Hz, G2 97.9, C1 32.6), a semitone
    # over the ending's key: the wall's last bar sits on B1 (61.1 Hz in the stretched track) and the ring-out is B major
    # (crit8). Played at 15/16 it is B1 61.1 Hz with F#2: the hole hums the tonic the music stopped on and the ring
    # resolves over it, where the C drone rubbed a semitone (4 Hz beat) against both.
    bed(sfx, 'texture/low-freq-drone.wav', fb(36) + 10, roof + 30, -29, 0.5, 0.5, {'rate': 15 / 16})

    counts = {}
    hits = []
    for e in cues:
        kit = KIT.get(e['kind'])
        if not kit:
            print('no sfx for kind', e['kind'], file=sys.stderr)
            continue
        c = counts.get(e['kind'], 0)
        counts[e['kind']] = c + 1
        rel, lvl, align, *rest = kit[c % len(kit)]
        opts = dict(rest[0]) if rest else {}
        v = str(e.get('variant', ''))
        if v.startswith('rate:'):  # an event's own pitch, on top of the kit's (src/sync.ts)
            opts['rate'] = round(opts.get('rate', 1.0) * float(v[5:]), 4)
        w = e.get('weight', 1)
        place(sfx, rel, e['f'], lvl + 20 * np.log10(max(w, 1e-3)), align, e.get('pan', 0) * 0.6, e.get('len'), opts)
        if e['kind'] in DUCK:
            hits.append((e['f'] / FPS, DUCK[e['kind']] * w))

    if hits:
        music = music * M.sidechain_times(hits, n, depth=1.0, tau=0.16)

    music = music * 0.62  # the master is hot; leave room for the effects and the wall
    # Into the master 5 dB lower: the glue compressor (-14 dBFS, 2:1, 5 ms RMS) flattened the wall's lift
    # into the ordinary downbeats; the loudness pass restores the level.
    mix = (music + sfx) * PRE_MASTER
    # Ceiling -1.6 dBFS (true peak target: under -1 dB); the wall's beat gets -1.3. The wall is limiter-bound
    # (about 6 dB on its beat), so more level into it only squashes it: the master pins every loud beat at the
    # ceiling with 8-10 dB of crest. Its lead is made by trimming the beats that come within WALL_MARGIN of it.
    y, info, trim = level_to_wall(mix)
    g = trim_curve(trim, n)
    music, sfx = music * g[:, None], sfx * g[:, None]  # the stems carry the same trims as the master

    os.makedirs(os.path.join(ROOT, 'film', 'public', 'audio'), exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'film', 'out', 'stems'), exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'film', 'out', 'qa'), exist_ok=True)
    sf.write(os.path.join(ROOT, 'film', 'public', 'audio', 'soundtrack.wav'), y.astype(np.float32), SR, subtype='PCM_24')
    sf.write(os.path.join(ROOT, 'film', 'out', 'stems', 'music.wav'), music.astype(np.float32), SR, subtype='PCM_24')
    sf.write(os.path.join(ROOT, 'film', 'out', 'stems', 'sfx.wav'), sfx.astype(np.float32), SR, subtype='PCM_24')
    rep = M.measure(y)
    rep['limiter_max_gr_db'] = round(float(info['limiter_gr_db'].max()), 2)
    r = beat_rms(y)
    rep['wall_beat_rms'] = round(r[WALL_BEAT], 2)
    rep['wall_margin_db'] = round(r[WALL_BEAT] - max(v for f, v in r.items() if f != WALL_BEAT), 2)
    rep['beat_trims_db'] = {str(f): round(-d, 2) for f, d in sorted(trim.items())}
    rep['cues'] = len(cues)
    rep['sfx_counts'] = counts
    json.dump(rep, open(os.path.join(ROOT, 'film', 'out', 'qa', 'mix.json'), 'w'), indent=1)
    print(json.dumps(rep))


if __name__ == '__main__':
    main()
