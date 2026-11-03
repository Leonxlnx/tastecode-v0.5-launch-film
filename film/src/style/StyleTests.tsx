import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C } from '../brand/tokens';
import { Mark3D } from '../fx/Mark3D';

// Style frames only; not part of the film.
export const StyleMarkGlass: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.void }}>
      <Mark3D pose={{ yaw: -0.55 + f * 0.01, pitch: 0.16, roll: -0.05, scale: 7.2, dispersion: 8, light: 0.1 }} />
    </AbsoluteFill>
  );
};

export const StyleMarkMetal: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.void }}>
      <Mark3D material="metal" pose={{ yaw: -0.5 + f * 0.01, pitch: 0.12, roll: 0.03, scale: 7.2, light: 0.3 }} />
    </AbsoluteFill>
  );
};
