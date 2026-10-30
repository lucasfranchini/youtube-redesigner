import type { Preferences } from "@/types/preferences";
import { normalizeVideoColumns } from "@/utils/preferences";

import { PREFERENCE_ITEMS } from "./preferenceItems";

export async function setPreferences(
  patch: Partial<Preferences>,
): Promise<void> {
  const writes: Promise<void>[] = [];

  if (patch.showSubscriptionChannels !== undefined) {
    writes.push(
      PREFERENCE_ITEMS.showSubscriptionChannels.setValue(
        Boolean(patch.showSubscriptionChannels),
      ),
    );
  }
  if (patch.hideShorts !== undefined) {
    writes.push(PREFERENCE_ITEMS.hideShorts.setValue(Boolean(patch.hideShorts)));
  }
  if (patch.hideRelevant !== undefined) {
    writes.push(
      PREFERENCE_ITEMS.hideRelevant.setValue(Boolean(patch.hideRelevant)),
    );
  }
  if (patch.homeColumns !== undefined) {
    writes.push(
      PREFERENCE_ITEMS.homeColumns.setValue(
        normalizeVideoColumns(patch.homeColumns),
      ),
    );
  }
  if (patch.subscriptionColumns !== undefined) {
    writes.push(
      PREFERENCE_ITEMS.subscriptionColumns.setValue(
        normalizeVideoColumns(patch.subscriptionColumns),
      ),
    );
  }

  await Promise.all(writes);
}
