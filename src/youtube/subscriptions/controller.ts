import { CHANNEL_SELECTORS } from "@/constants/subscriptionChannels";
import { SUBSCRIPTIONS_PATH } from "@/constants/youtube";
import type { Preferences } from "@/types/preferences";
import type {
  SubscriptionCarousel,
  SubscriptionCatalog,
  SubscriptionChannel,
} from "@/types/subscriptionChannels";
import { orderChannels } from "@/utils/subscriptionChannels";

import { loadSubscriptionCatalog } from "./data/loadCatalog";
import { createFeedUpdater } from "./feed/createFeedUpdater";
import { refreshSubscriptionFeed } from "./feed/refreshFeed";
import { createChannelFilter } from "./filter/createChannelFilter";
import { createPaginationController } from "./pagination/createPaginationController";
import { loadNextPage } from "./pagination/loadNextPage";
import { readSidebarOrder } from "./sidebar/readOrder";
import { trackNewness } from "./sidebar/trackNewness";
import { createSubscriptionCarousel } from "./view/createCarousel";

type CatalogLoader = typeof loadSubscriptionCatalog;
type PageLoader = typeof loadNextPage;
type FeedRefresh = typeof refreshSubscriptionFeed;
type ChannelFilter = ReturnType<typeof createChannelFilter>;
type PaginationController = ReturnType<typeof createPaginationController>;
type FeedUpdater = ReturnType<typeof createFeedUpdater>;
type NewnessTracker = ReturnType<typeof trackNewness>;

function touchesGuide(root: ParentNode, doc: Document): boolean {
  if (root === doc) return true;
  return root instanceof Element && Boolean(
    root.matches(CHANNEL_SELECTORS.guide) ||
    root.closest(CHANNEL_SELECTORS.guide) ||
    root.querySelector(CHANNEL_SELECTORS.guide),
  );
}

export function createSubscriptionController(
  doc: Document,
  loadCatalog: CatalogLoader = loadSubscriptionCatalog,
  loadPage: PageLoader = loadNextPage,
  refreshFeed: FeedRefresh = refreshSubscriptionFeed,
) {
  let enabled = false;
  let navigating = false;
  let destroyed = false;
  let grid: HTMLElement | null = null;
  let carousel: SubscriptionCarousel | null = null;
  let filter: ChannelFilter | null = null;
  let pagination: PaginationController | null = null;
  let updater: FeedUpdater | null = null;
  let newness: NewnessTracker | null = null;
  let channels: SubscriptionChannel[] = [];
  let catalogOrder: SubscriptionChannel[] = [];
  let guideOrder: string[] = [];
  let selected: string | null = null;
  let account: string | null = null;
  let avatar = "";
  let catalogRequest: AbortController | null = null;
  let catalogError = false;
  let feedFresh = false;

  const renderStatus = (matches: HTMLElement[]) => {
    if (
      !carousel || !grid || catalogRequest || catalogError ||
      pagination?.loading || pagination?.failed || updater?.loading || updater?.failed
    ) return;
    if (!selected) {
      carousel.status(channels.length ? "" : "Você ainda não tem inscrições.");
      return;
    }
    const hasMore = Boolean(grid.querySelector(CHANNEL_SELECTORS.continuation));
    carousel.status(
      matches.length
        ? ""
        : hasMore
          ? "Nenhum vídeo deste canal encontrado até aqui."
          : "Nenhum vídeo deste canal no feed disponível.",
      hasMore ? "Buscar mais vídeos" : undefined,
    );
  };

  const unmount = () => {
    updater?.cancel();
    pagination?.cancel();
    catalogRequest?.abort();
    catalogRequest = null;
    filter?.clear();
    carousel?.destroy();
    carousel = null;
    grid = null;
    filter = null;
    pagination = null;
    updater = null;
    channels = [];
    catalogError = false;
    feedFresh = false;
  };

  const select = (id: string | null, explicit = true) => {
    updater?.cancel();
    updater?.resetError();
    pagination?.cancel();
    pagination?.resetError();
    selected = id;
    carousel?.select(id);
    if (explicit) doc.defaultView?.scrollTo({ top: 0, behavior: "instant" });

    if (!id) {
      filter?.clear();
      renderStatus([]);
      return;
    }
    if (explicit) newness?.mark(id);

    if (explicit && account && updater && !feedFresh) {
      filter?.select(id, false);
      void updater.refresh(id, account);
      return;
    }
    const matches = filter?.select(id, true) ?? [];
    renderStatus(matches);
    void pagination?.search();
  };

  const reorder = () => {
    if (!carousel || !catalogOrder.length) return;
    const next = orderChannels(catalogOrder, [
      ...readSidebarOrder(doc, catalogOrder),
      ...guideOrder,
    ]);
    if (!next.some((channel, index) => channel.id !== channels[index]?.id)) return;
    channels = next;
    carousel.setChannels(channels);
    carousel.select(selected);
    newness?.channels(channels);
  };

  const readCatalog = async () => {
    if (!grid || catalogRequest) return;
    catalogError = false;
    const controller = new AbortController();
    catalogRequest = controller;
    carousel?.status("Carregando suas inscrições…", undefined, true, "header");
    try {
      const result: SubscriptionCatalog = await loadCatalog(controller.signal);
      if (controller.signal.aborted || catalogRequest !== controller || !grid) return;
      if (account !== result.account) {
        selected = null;
        newness?.reset();
      }
      account = result.account;
      catalogOrder = result.channels;
      guideOrder = result.guideIds ?? [];
      channels = orderChannels(catalogOrder, [
        ...readSidebarOrder(doc, catalogOrder),
        ...guideOrder,
      ]);
      if (selected && !channels.some((channel) => channel.id === selected)) {
        selected = null;
      }
      carousel?.setChannels(channels);
      filter?.updateChannels(channels);
      newness?.channels(channels);
      catalogRequest = null;
      select(selected, false);
    } catch {
      if (controller.signal.aborted || catalogRequest !== controller) return;
      catalogRequest = null;
      catalogError = true;
      filter?.clear();
      carousel?.status(
        "Não foi possível carregar todas as inscrições.",
        "Tentar novamente",
        false,
        "header",
      );
    }
  };

  const mount = (nextGrid: HTMLElement) => {
    unmount();
    grid = nextGrid;
    carousel = createSubscriptionCarousel(doc, select, () => {
      if (catalogError) void readCatalog();
      else if (updater?.failed && selected && account) {
        void updater.refresh(selected, account);
      } else void pagination?.search(true);
    });
    filter = createChannelFilter(grid);
    pagination = createPaginationController(
      doc,
      grid,
      carousel,
      filter,
      renderStatus,
      loadPage,
    );
    updater = createFeedUpdater(
      doc,
      carousel,
      () => {
        if (!selected) return;
        feedFresh = true;
        const matches = filter?.select(selected, true) ?? [];
        renderStatus(matches);
        void pagination?.search();
      },
      () => {
        const matches = selected ? filter?.select(selected, true) ?? [] : [];
        carousel?.status(
          "Não foi possível atualizar os vídeos. A lista anterior foi mantida.",
          "Tentar novamente",
        );
        if (!matches.length) return;
      },
      refreshFeed,
    );
    grid.before(carousel.element);
    grid.after(carousel.footer);
    void readCatalog();
  };

  const scan = (root: ParentNode = doc) => {
    if (destroyed) return;
    if (root instanceof Element && root.closest(CHANNEL_SELECTORS.owned)) return;
    if (!enabled || navigating || doc.location.pathname !== SUBSCRIPTIONS_PATH) {
      unmount();
      return;
    }
    const browse = doc.querySelector<HTMLElement>(CHANNEL_SELECTORS.browse);
    const nextGrid = browse?.querySelector<HTMLElement>(CHANNEL_SELECTORS.grid);
    if (!nextGrid) {
      unmount();
      return;
    }

    const nextAvatar = doc
      .querySelector<HTMLImageElement>(CHANNEL_SELECTORS.avatar)
      ?.getAttribute("src") ?? "";
    if (avatar && nextAvatar && nextAvatar !== avatar) {
      selected = null;
      account = null;
      newness?.reset();
      unmount();
    }
    if (nextAvatar) avatar = nextAvatar;

    if (nextGrid !== grid || !carousel?.element.isConnected) {
      mount(nextGrid);
      return;
    }
    if (catalogRequest || catalogError) return;
    if (touchesGuide(root, doc)) reorder();
    if (selected && !updater?.loading) {
      renderStatus(filter?.update(root) ?? []);
    }
  };

  return {
    scan,
    preferences(preferences: Preferences) {
      const nextEnabled = preferences.showSubscriptionChannels;
      if (nextEnabled && !newness) {
        newness = trackNewness(doc, (ids) => carousel?.newness(ids));
      }
      enabled = nextEnabled;
      if (!enabled) {
        selected = null;
        account = null;
        newness?.destroy();
        newness = null;
      }
      scan();
    },
    navigateStart() {
      navigating = true;
      unmount();
    },
    navigateFinish() {
      navigating = false;
      scan();
    },
    destroy() {
      destroyed = true;
      newness?.destroy();
      newness = null;
      unmount();
      selected = null;
      account = null;
    },
  };
}
