import type React from 'react';
import type { ActKey } from '../timeline';
import { CalmCard, DesignCard, LimitsCard, SkillsCard, SplitCard, SwitchCard } from './Card';
import { Compose } from './Compose';
import { Dash1, Dash2 } from './Dash';
import { Eclipse } from './Eclipse';
import { Hook } from './Hook';
import { Lockup } from './Lockup';
import { Calm } from './Calm';
import { Needs } from './Needs';
import { Limits, Review, Split, Update } from './Quick';
import { Rebuilt } from './Rebuilt';
import { Redrawn } from './Redrawn';
import { Sites } from './Sites';
import { Skills } from './Skills';
import { Switch } from './Switch';
import { Wall } from './Wall';

// One component per act. Film.tsx mounts them in timeline order; Root.tsx registers each on its own
// as Act-<key> so it can be iterated without scrubbing the film. The six cards share one grammar (Card.tsx).
export const ACTS: Record<ActKey, React.FC> = {
  hook: Hook,
  eclipse: Eclipse,
  rebuilt: Rebuilt,
  needs: Needs,
  redrawn: Redrawn,
  calmCard: CalmCard,
  calm: Calm,
  designCard: DesignCard,
  compose: Compose,
  sites: Sites,
  dash1: Dash1,
  dash2: Dash2,
  switchCard: SwitchCard,
  switch: Switch,
  skillsCard: SkillsCard,
  skills: Skills,
  splitCard: SplitCard,
  split: Split,
  limitsCard: LimitsCard,
  limits: Limits,
  review: Review,
  update: Update,
  wall: Wall,
  lockup: Lockup,
};
