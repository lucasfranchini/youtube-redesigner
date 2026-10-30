import { YOUTUBE_DATASET_KEYS } from "@/constants/youtube";
import type { Preferences } from "@/types/preferences";
import { normalizePreferences } from "@/utils/preferences";

import { updatePageMarker } from "./updatePageMarker";

export function applyPreferencesToPage(
  root: HTMLElement,
  pathname: string,
  preferences: Partial<Preferences>,
): void {
  const normalized = normalizePreferences(preferences);

  root.dataset[YOUTUBE_DATASET_KEYS.hideShorts] = String(
    normalized.hideShorts,
  );
  root.dataset[YOUTUBE_DATASET_KEYS.hideRelevant] = String(
    normalized.hideRelevant,
  );
  root.style.setProperty("--yte-home-cols", String(normalized.homeColumns));
  root.style.setProperty("--yte-cols", String(normalized.subscriptionColumns));
  updatePageMarker(root, pathname);
}
