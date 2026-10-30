import type { SubscriptionCarousel } from "@/types/subscriptionChannels";

import { refreshSubscriptionFeed } from "./refreshFeed";

type FeedRefresh = typeof refreshSubscriptionFeed;

export function createFeedUpdater(
  doc: Document,
  carousel: SubscriptionCarousel,
  onSuccess: () => void,
  onFailure: () => void,
  refreshFeed: FeedRefresh = refreshSubscriptionFeed,
) {
  let request: AbortController | null = null;
  let failed = false;

  const refresh = async (channelId: string, account: string) => {
    request?.abort();
    const controller = new AbortController();
    request = controller;
    failed = false;
    carousel.status("Atualizando vídeos…", undefined, true);
    try {
      await refreshFeed(doc, controller.signal, channelId, account);
      if (controller.signal.aborted || request !== controller) return;
      request = null;
      onSuccess();
    } catch {
      if (controller.signal.aborted || request !== controller) return;
      request = null;
      failed = true;
      onFailure();
    }
  };

  return {
    cancel() {
      request?.abort();
      request = null;
    },
    get failed() { return failed; },
    get loading() { return request !== null; },
    refresh,
    resetError() { failed = false; },
  };
}
