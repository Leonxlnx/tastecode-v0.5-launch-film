import React from 'react';
import { C } from './tokens';
import { MARK, MARK_VIEW } from './markPaths';

/**
 * The real TasteCode mark as vector, with each piece drawable alone so it can assemble. `pieces`
 * gives per-piece opacity and offset in icon units. Anchored by its own box: place it by transform.
 */
export type Piece = { o?: number; x?: number; y?: number; s?: number };

export const Mark: React.FC<{
  size: number;
  color?: string;
  dotColor?: string;
  roof?: Piece;
  left?: Piece;
  right?: Piece;
  dot?: Piece;
  style?: React.CSSProperties;
}> = ({ size, color = C.mark, dotColor, roof, left, right, dot, style }) => {
  const g = (name: keyof typeof MARK, p: Piece | undefined, fill: string) => (
    <path
      d={MARK[name]}
      fill={fill}
      opacity={p?.o ?? 1}
      transform={`translate(${p?.x ?? 0} ${p?.y ?? 0})`}
    />
  );
  return (
    <svg width={size} height={(size * MARK_VIEW.h) / MARK_VIEW.w} viewBox={`0 0 ${MARK_VIEW.w} ${MARK_VIEW.h}`} style={{ display: 'block', overflow: 'visible', ...style }}>
      {g('roof', roof, color)}
      {g('left', left, color)}
      {g('right', right, color)}
      {g('dot', dot, dotColor ?? color)}
    </svg>
  );
};
