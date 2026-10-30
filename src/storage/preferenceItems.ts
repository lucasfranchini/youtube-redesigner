import { storage } from "wxt/utils/storage";

import { DEFAULT_PREFERENCES } from "@/constants/preferences";

export const PREFERENCE_ITEMS = {
  showSubscriptionChannels: storage.defineItem<boolean>(
    "local:showSubscriptionChannels",
    { fallback: DEFAULT_PREFERENCES.showSubscriptionChannels },
  ),
  hideShorts: storage.defineItem<boolean>("local:hideShorts", {
    fallback: DEFAULT_PREFERENCES.hideShorts,
  }),
  hideRelevant: storage.defineItem<boolean>("local:hideRelevant", {
    fallback: DEFAULT_PREFERENCES.hideRelevant,
  }),
  homeColumns: storage.defineItem<number>("local:homeColumns", {
    fallback: DEFAULT_PREFERENCES.homeColumns,
  }),
  subscriptionColumns: storage.defineItem<number>(
    "local:subscriptionColumns",
    { fallback: DEFAULT_PREFERENCES.subscriptionColumns },
  ),
} as const;
