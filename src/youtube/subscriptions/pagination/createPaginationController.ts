import { CHANNEL_PAGE_LIMIT, CHANNEL_SELECTORS } from "@/constants/subscriptionChannels";
import type { SubscriptionCarousel } from "@/types/subscriptionChannels";

import type { createChannelFilter } from "../filter/createChannelFilter";
import { loadNextPage } from "./loadNextPage";

type ChannelFilter = ReturnType<typeof createChannelFilter>;
type PageLoader = typeof loadNextPage;

export function createPaginationController(
  doc: Document,
  grid: HTMLElement,
  carousel: SubscriptionCarousel,
  filter: ChannelFilter,
  onComplete: (matches: HTMLElement[]) => void,
  loadPage: PageLoader = loadNextPage,
) {
  let request: AbortController | null = null;
  let failed = false;

  const enough = (matches: HTMLElement[]) => {
    const height = doc.defaultView?.innerHeight ?? 800;
    return matches.some((card) => card.getBoundingClientRect().bottom >= height);
  };

  const search = async (manual = false) => {
    if (request) return;
    failed = false;
    const controller = new AbortController();
    request = controller;
    try {
      for (let count = 0; count < CHANNEL_PAGE_LIMIT; count++) {
        const matches = filter.matches();
        if (!manual && enough(matches)) break;
        if (!grid.querySelector(CHANNEL_SELECTORS.continuation)) break;
        carousel.status("Buscando vídeos deste canal…", undefined, true);
        const roots = await loadPage(grid, controller.signal);
        controller.signal.throwIfAborted();
        if (!roots) break;
        roots.forEach((root) => filter.update(root));
        manual = false;
      }
      if (request === controller) {
        request = null;
        onComplete(filter.matches());
      }
    } catch {
      if (!controller.signal.aborted && request === controller) {
        request = null;
        failed = true;
        carousel.status(
          "Não foi possível continuar a busca.",
          "Buscar mais vídeos",
        );
      }
    }
  };

  return {
    cancel() {
      request?.abort();
      request = null;
    },
    get failed() { return failed; },
    get loading() { return request !== null; },
    resetError() { failed = false; },
    search,
  };
}
