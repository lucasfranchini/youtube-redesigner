import { CHANNEL_DATA, CHANNEL_SELECTORS } from "@/constants/subscriptionChannels";
import { YOUTUBE_DATASET_KEYS, YOUTUBE_SELECTORS } from "@/constants/youtube";
import type { SubscriptionChannel } from "@/types/subscriptionChannels";
import { elementsMatching } from "@/utils/dom";

import { createCardOwnerResolver } from "./createCardOwnerResolver";

function topLevelCards(root: ParentNode): HTMLElement[] {
  const found = new Set(elementsMatching<HTMLElement>(root, CHANNEL_SELECTORS.cards));
  if (root instanceof Element) {
    const ancestor = root.closest<HTMLElement>(CHANNEL_SELECTORS.cards);
    if (ancestor) found.add(ancestor);
  }
  return [...found]
    .filter((card) => !card.parentElement?.closest(CHANNEL_SELECTORS.cards));
}

export function createChannelFilter(
  grid: HTMLElement,
  initialChannels: SubscriptionChannel[] = [],
) {
  const ownerResolver = createCardOwnerResolver();
  const allCards = new Set<HTMLElement>();
  const visibleCards = new Set<HTMLElement>();
  const cardsByChannel = new Map<string, Set<HTMLElement>>();
  let channelsByCard = new WeakMap<HTMLElement, Set<string>>();
  let selected: string | null = null;
  let fullyIndexed = false;

  const mark = (element: HTMLElement, hidden: boolean) => {
    if (hidden) element.dataset[CHANNEL_DATA.hidden] = "";
    else delete element.dataset[CHANNEL_DATA.hidden];
  };

  const prune = () => {
    allCards.forEach((card) => {
      if (card.isConnected && grid.contains(card)) return;
      allCards.delete(card);
      visibleCards.delete(card);
      channelsByCard.get(card)?.forEach((id) => cardsByChannel.get(id)?.delete(card));
    });
  };

  const updateGroups = (groups: Iterable<HTMLElement>) => {
    [...groups].reverse().forEach((group) => {
      const hasVisibleCard = [...visibleCards].some(
        (card) => card.isConnected && group.contains(card),
      );
      mark(group, !hasVisibleCard);
    });
  };

  const index = (root: ParentNode, full = false) => {
    if (full) prune();
    const cards = full ? topLevelCards(grid) : topLevelCards(root);
    const affectedGroups = new Set<HTMLElement>();

    cards.forEach((card) => {
      allCards.add(card);
      channelsByCard.get(card)?.forEach((id) => cardsByChannel.get(id)?.delete(card));
      const ownerIds = new Set(ownerResolver.resolve(card));
      channelsByCard.set(card, ownerIds);
      ownerIds.forEach((id) => {
        const indexed = cardsByChannel.get(id) ?? new Set<HTMLElement>();
        indexed.add(card);
        cardsByChannel.set(id, indexed);
      });

      const visible = selected === null || ownerIds.has(selected);
      mark(card, !visible);
      if (visible) visibleCards.add(card);
      else visibleCards.delete(card);
      const group = card.closest<HTMLElement>(CHANNEL_SELECTORS.groups);
      if (group) affectedGroups.add(group);
    });

    if (full) {
      grid.querySelectorAll<HTMLElement>(CHANNEL_SELECTORS.groups)
        .forEach((group) => affectedGroups.add(group));
      fullyIndexed = true;
    }
    updateGroups(affectedGroups);
  };

  const result = () => {
    prune();
    const page = grid.ownerDocument.documentElement;
    return [...visibleCards].filter((card) => {
      if (card.closest(CHANNEL_SELECTORS.marked)) return false;
      if (
        page.dataset[YOUTUBE_DATASET_KEYS.hideShorts] === "true" &&
        card.closest(YOUTUBE_SELECTORS.markedShorts)
      ) return false;
      if (
        page.dataset[YOUTUBE_DATASET_KEYS.hideRelevant] === "true" &&
        card.closest(YOUTUBE_SELECTORS.markedRelevant)
      ) return false;
      return true;
    });
  };

  const showAll = () => {
    prune();
    allCards.forEach((card) => {
      mark(card, false);
      visibleCards.add(card);
    });
    grid.querySelectorAll<HTMLElement>(CHANNEL_SELECTORS.groups)
      .forEach((group) => mark(group, false));
  };

  const select = (id: string | null, apply = true) => {
    if (!fullyIndexed && apply) index(grid, true);
    if (!apply) {
      showAll();
      selected = id;
      if (id) grid.dataset[CHANNEL_DATA.filter] = "";
      else delete grid.dataset[CHANNEL_DATA.filter];
      return [];
    }

    const nextVisible = id === null
      ? new Set(allCards)
      : new Set(cardsByChannel.get(id) ?? []);
    const changed = new Set<HTMLElement>();
    visibleCards.forEach((card) => {
      if (!nextVisible.has(card)) changed.add(card);
    });
    nextVisible.forEach((card) => {
      if (!visibleCards.has(card)) changed.add(card);
    });

    changed.forEach((card) => mark(card, !nextVisible.has(card)));
    visibleCards.clear();
    nextVisible.forEach((card) => visibleCards.add(card));
    selected = id;
    if (id) grid.dataset[CHANNEL_DATA.filter] = "";
    else delete grid.dataset[CHANNEL_DATA.filter];

    const groups = new Set<HTMLElement>();
    changed.forEach((card) => {
      const group = card.closest<HTMLElement>(CHANNEL_SELECTORS.groups);
      if (group) groups.add(group);
    });
    updateGroups(groups);
    return result();
  };

  const updateChannels = (channels: SubscriptionChannel[]) => {
    ownerResolver.updateChannels(channels);
    cardsByChannel.clear();
    channelsByCard = new WeakMap();
    fullyIndexed = false;
  };
  updateChannels(initialChannels);

  return {
    clear() {
      selected = null;
      showAll();
      delete grid.dataset[CHANNEL_DATA.filter];
      delete grid.dataset[CHANNEL_DATA.loading];
    },
    matches: result,
    select,
    update(root: ParentNode = grid) {
      if (root instanceof Element && root !== grid && !grid.contains(root)) {
        return result();
      }
      index(root, root === grid || root === grid.ownerDocument);
      return result();
    },
    updateChannels,
  };
}
