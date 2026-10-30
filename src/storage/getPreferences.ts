import { DEFAULT_PREFERENCES } from "@/constants/preferences";
import type { Preferences } from "@/types/preferences";
import { normalizePreferences } from "@/utils/preferences";

import { PREFERENCE_ITEMS } from "./preferenceItems";

export async function getPreferences(): Promise<Preferences> {
  const [hideShorts, hideRelevant, homeColumns, subscriptionColumns] =
    await Promise.all([
      PREFERENCE_ITEMS.hideShorts.getValue(),
      PREFERENCE_ITEMS.hideRelevant.getValue(),
      PREFERENCE_ITEMS.homeColumns.getValue(),
      PREFERENCE_ITEMS.subscriptionColumns.getValue(),
    ]);

  return normalizePreferences({
    showSubscriptionChannels: await PREFERENCE_ITEMS.showSubscriptionChannels
      .getValue()
      .catch(() => DEFAULT_PREFERENCES.showSubscriptionChannels),
    hideShorts,
    hideRelevant,
    homeColumns,
    subscriptionColumns,
  });
}
