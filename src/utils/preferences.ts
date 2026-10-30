import {
  DEFAULT_PREFERENCES,
  VIDEO_GRID_COLUMNS,
} from "@/constants/preferences";
import type { Preferences } from "@/types/preferences";

export function normalizeVideoColumns(value: unknown): number {
  const columns = Number(value);

  return Number.isInteger(columns) &&
    columns >= VIDEO_GRID_COLUMNS.min &&
    columns <= VIDEO_GRID_COLUMNS.max
    ? columns
    : VIDEO_GRID_COLUMNS.default;
}

export function normalizePreferences(
  value: Partial<Preferences> | null | undefined,
): Preferences {
  return {
    showSubscriptionChannels:
      typeof value?.showSubscriptionChannels === "boolean"
        ? value.showSubscriptionChannels
        : DEFAULT_PREFERENCES.showSubscriptionChannels,
    hideShorts:
      typeof value?.hideShorts === "boolean"
        ? value.hideShorts
        : DEFAULT_PREFERENCES.hideShorts,
    hideRelevant:
      typeof value?.hideRelevant === "boolean"
        ? value.hideRelevant
        : DEFAULT_PREFERENCES.hideRelevant,
    homeColumns: normalizeVideoColumns(value?.homeColumns),
    subscriptionColumns: normalizeVideoColumns(value?.subscriptionColumns),
  };
}
