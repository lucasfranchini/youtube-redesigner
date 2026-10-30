import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

import { DEFAULT_PREFERENCES } from "@/constants/preferences";
import {
  getPreferences,
} from "@/storage/getPreferences";
import { setPreferences } from "@/storage/setPreferences";
import { watchPreferences } from "@/storage/watchPreferences";

describe("armazenamento de preferências", () => {
  it("persiste e observa o toggle de canais", async () => {
    fakeBrowser.reset();
    const listener = vi.fn();
    const stop = watchPreferences(listener);
    await setPreferences({ showSubscriptionChannels: false });
    expect((await getPreferences()).showSubscriptionChannels).toBe(false);
    await vi.waitFor(() => expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ showSubscriptionChannels: false })));
    stop();
  });
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("mantém as preferências em chaves separadas no storage local", async () => {
    await setPreferences({
      hideShorts: false,
      hideRelevant: true,
      homeColumns: 3,
      subscriptionColumns: 6,
    });

    expect(await fakeBrowser.storage.local.get()).toMatchObject({
      hideShorts: false,
      hideRelevant: true,
      homeColumns: 3,
      subscriptionColumns: 6,
    });
    expect(await getPreferences()).toEqual({
      showSubscriptionChannels: true,
      hideShorts: false,
      hideRelevant: true,
      homeColumns: 3,
      subscriptionColumns: 6,
    });
  });

  it("corrige uma quantidade de colunas inválida antes de salvar", async () => {
    await setPreferences({ homeColumns: 2, subscriptionColumns: 99 });

    expect(await getPreferences()).toEqual({
      ...DEFAULT_PREFERENCES,
      homeColumns: 4,
      subscriptionColumns: 4,
    });
  });

  it("observa alterações independentes nas duas grades", async () => {
    const listener = vi.fn();
    const unwatch = watchPreferences(listener);

    await setPreferences({ homeColumns: 5 });

    await vi.waitFor(() => {
      expect(listener).toHaveBeenLastCalledWith({
        ...DEFAULT_PREFERENCES,
        homeColumns: 5,
      });
    });

    await setPreferences({ subscriptionColumns: 6 });

    await vi.waitFor(() => {
      expect(listener).toHaveBeenLastCalledWith({
        ...DEFAULT_PREFERENCES,
        homeColumns: 5,
        subscriptionColumns: 6,
      });
    });

    unwatch();
  });
});
