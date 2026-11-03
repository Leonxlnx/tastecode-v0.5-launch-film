/** A sound event an act asks for: `f` local to the act. Kinds are listed at the top of src/sync.ts. */
export type Sound = { f: number; kind: string; weight?: number; pan?: number };
