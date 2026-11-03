#!/usr/bin/env python3
"""Loudness of each act of the soundtrack (LUFS over the act), to shape the film's level arc."""
import os
import sys

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # the repo root
B = 28
# Round 8: the act table in beats (28 f each); TOTAL 4172 = beat 149.
ACTS = [
    ('hook', 0, 12), ('eclipse', 12, 20), ('rebuilt', 20, 30), ('needs', 30, 38), ('redrawn', 38, 50),
    ('calm-card', 50, 58), ('calm', 58, 64), ('design-card', 64, 68), ('compose-pre', 68, 76), ('compose-deal', 76, 80),
    ('sites', 80, 86), ('dash', 86, 90), ('switch', 90, 101), ('skills', 101, 112), ('split', 112, 120),
    ('limits', 120, 127), ('review-update', 127, 132), ('wall-up', 132, 136), ('wall-peak', 136, 140), ('lockup', 140, 149),
]

path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'film', 'public', 'audio', 'soundtrack.wav')
y, sr = sf.read(path, always_2d=True)
m = pyln.Meter(sr)
vals = []
for name, a, b in ACTS:
    seg = y[int(a * B / 60 * sr) : int(b * B / 60 * sr)]
    pad = seg if len(seg) >= sr else np.pad(seg, ((0, sr - len(seg)), (0, 0)))
    v = m.integrated_loudness(pad)
    vals.append(v)
    print(f'{name:14s} {a * B / 60:6.2f}s {v:7.1f} LUFS  peak {20 * np.log10(np.abs(seg).max() + 1e-9):6.1f} dB')
print('whole', round(m.integrated_loudness(y), 2), 'median act', round(float(np.median(vals)), 1))
