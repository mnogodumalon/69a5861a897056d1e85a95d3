import type { Schichtzuweisung } from './app';

export type EnrichedSchichtzuweisung = Schichtzuweisung & {
  schichtvorlageName: string;
  mitarbeiterName: string;
};
