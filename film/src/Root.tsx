import React from 'react';
import { Composition, Folder, Still } from 'remotion';
import { ACTS } from './acts';
import { C } from './brand/tokens';
import { Film, FilmProps } from './Film';
import { FilmSub, subMetadata } from './FilmSub';
import { TEXT_LAB_DUR, TextLab, TextLabFidelity } from './lab/TextLab';
import { Audit } from './lib/Audit';
import { FontGate } from './lib/FontGate';
import { StyleMarkGlass, StyleMarkMetal } from './style/StyleTests';
import { ACT, ActKey, FPS, H, TOTAL, W } from './timeline';

const gated = (Inner: React.FC) => {
  const G: React.FC<FilmProps> = ({ audit = false, safe }) => (
    <FontGate>
      <div style={{ position: 'absolute', inset: 0, background: C.void }}>
        <Inner />
        {audit && <Audit safe={safe} />}
      </div>
    </FontGate>
  );
  return G;
};

const KEYS = Object.keys(ACT) as ActKey[];

export const RemotionRoot: React.FC = () => (
  <>
    {/* The film. Render with scripts/render.sh (muted picture + ffmpeg mux + sync check). */}
    <Composition id="Film" component={Film} durationInFrames={TOTAL} fps={FPS} width={W} height={H} defaultProps={{ audit: false } as FilmProps} />
    {/* The film as sub-frames for the motion-blurred master (render.sh --blur passes out/samples.json). */}
    <Composition id="FilmSub" component={FilmSub} durationInFrames={TOTAL} fps={FPS} width={W} height={H} defaultProps={{ groups: [] as number[] }} calculateMetadata={subMetadata} />

    {/* Every act alone: composition Act<N> is the Nth entry of ACT (scripts/layout-audit.sh relies on that), Act-<key> names it. */}
    <Folder name="Acts">
      {KEYS.map((k, i) => (
        <Composition key={k} id={`Act${i + 1}`} component={gated(ACTS[k])} durationInFrames={ACT[k].dur} fps={FPS} width={W} height={H} defaultProps={{ audit: false } as FilmProps} />
      ))}
      {KEYS.map((k) => (
        <Composition key={k} id={`Act-${k}`} component={gated(ACTS[k])} durationInFrames={ACT[k].dur} fps={FPS} width={W} height={H} defaultProps={{ audit: false } as FilmProps} />
      ))}
    </Folder>

    {/* Test benches outside the Film: the copy system (fx/Line.tsx) on both stages, and its fidelity still. */}
    <Folder name="Lab">
      <Composition id="TextLab" component={gated(TextLab)} durationInFrames={TEXT_LAB_DUR} fps={FPS} width={W} height={H} defaultProps={{ audit: false } as FilmProps} />
      <Still id="TextLabFidelity" component={gated(TextLabFidelity)} width={W} height={H} />
    </Folder>

    <Folder name="Style">
      <Still id="StyleMarkGlass" component={gated(StyleMarkGlass)} width={W} height={H} />
      <Still id="StyleMarkMetal" component={gated(StyleMarkMetal)} width={W} height={H} />
    </Folder>
  </>
);
