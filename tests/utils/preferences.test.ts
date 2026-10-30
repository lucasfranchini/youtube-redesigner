import { describe, expect, it } from "vitest";

import { DEFAULT_PREFERENCES } from "@/constants/preferences";
import {
  normalizePreferences,
  normalizeVideoColumns,
} from "@/utils/preferences";

describe("normalização de preferências", () => {
  it("normaliza valores ausentes e inválidos", () => {
    expect(normalizePreferences({ showSubscriptionChannels: false }).showSubscriptionChannels).toBe(false);
    expect(normalizePreferences(JSON.parse('{"showSubscriptionChannels":"false"}')).showSubscriptionChannels).toBe(true);
    expect(normalizePreferences(undefined)).toEqual(DEFAULT_PREFERENCES);
    expect(normalizeVideoColumns(2)).toBe(4);
    expect(normalizeVideoColumns(7)).toBe(4);
    expect(normalizeVideoColumns("6")).toBe(6);
    expect(
      normalizePreferences({ homeColumns: 3, subscriptionColumns: 6 }),
    ).toMatchObject({ homeColumns: 3, subscriptionColumns: 6 });
  });
});
