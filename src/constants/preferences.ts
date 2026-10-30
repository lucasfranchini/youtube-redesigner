import type { Preferences } from "@/types/preferences";

export const VIDEO_GRID_COLUMNS = {
  min: 3,
  max: 6,
  default: 4,
} as const;

export const DEFAULT_PREFERENCES: Readonly<Preferences> = {
  showSubscriptionChannels: true,
  hideShorts: true,
  hideRelevant: true,
  homeColumns: VIDEO_GRID_COLUMNS.default,
  subscriptionColumns: VIDEO_GRID_COLUMNS.default,
};
