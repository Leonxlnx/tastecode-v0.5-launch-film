import React from 'react';
import { C } from '../brand/tokens';

/** Stands in for an act that isn't built yet: a clean void, so the timeline plays. */
export const Pending: React.FC = () => <div style={{ position: 'absolute', inset: 0, background: C.void }} />;
