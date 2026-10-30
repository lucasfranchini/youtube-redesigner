import {
  SHORTS_MENU_LABELS,
  YOUTUBE_SELECTORS,
} from "@/constants/youtube";
import type { ShortsTarget } from "@/types/youtube";
import { closestElement, elementsMatching } from "@/utils/dom";
import { normalizeTitle } from "@/utils/text";
import {
  getPathname,
  isChannelShortsPath,
  isShortsPath,
} from "@/utils/youtubeUrls";

function markable(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  return element !== element.ownerDocument.body &&
    element !== element.ownerDocument.documentElement;
}

function shelfTarget(shelf: Element): HTMLElement | null {
  const section = shelf.closest(YOUTUBE_SELECTORS.shortsSection) ?? shelf;
  return markable(section) ? section : null;
}

function menuContainsShorts(menu: HTMLElement, origin: string): boolean {
  const label = normalizeTitle(
    menu.getAttribute("aria-label") ?? menu.getAttribute("title") ?? "",
  );
  if (SHORTS_MENU_LABELS.has(label)) return true;

  return [...menu.querySelectorAll<HTMLAnchorElement>("a")].some((anchor) => {
    const anchorLabel = normalizeTitle(
      anchor.getAttribute("aria-label") ??
        anchor.getAttribute("title") ??
        "",
    );
    return isShortsPath(getPathname(anchor.href, origin)) ||
      SHORTS_MENU_LABELS.has(anchorLabel);
  });
}

function targetForAnchor(
  anchor: HTMLAnchorElement,
  origin: string,
): ShortsTarget | null {
  const pathname = getPathname(anchor.href, origin);
  if (
    anchor.matches(YOUTUBE_SELECTORS.channelShortsLinks) &&
    isChannelShortsPath(pathname)
  ) {
    const tab = anchor.closest("yt-tab-shape,tp-yt-paper-tab") ?? anchor;
    return markable(tab) ? { element: tab, reason: "channel-tab" } : null;
  }
  if (!isShortsPath(pathname)) return null;

  const menu = anchor.closest(YOUTUBE_SELECTORS.menus);
  if (markable(menu)) return { element: menu, reason: "menu" };

  const shelf = anchor.closest(YOUTUBE_SELECTORS.shortsShelves);
  if (shelf) {
    const element = shelfTarget(shelf);
    return element ? { element, reason: "shelf" } : null;
  }

  const card = anchor.closest(YOUTUBE_SELECTORS.cards);
  return markable(card) ? { element: card, reason: "card" } : null;
}

export function findShortsTargets(
  root: ParentNode,
  origin: string,
): ShortsTarget[] {
  const targets = new Map<HTMLElement, ShortsTarget["reason"]>();

  const anchors = new Set(
    elementsMatching<HTMLAnchorElement>(root, "a[href]"),
  );
  const ancestorAnchor = closestElement(root, "a[href]");
  if (ancestorAnchor instanceof HTMLAnchorElement) anchors.add(ancestorAnchor);
  anchors.forEach((anchor) => {
    const target = targetForAnchor(anchor, origin);
    if (target) targets.set(target.element, target.reason);
  });

  const menus = new Set(elementsMatching<HTMLElement>(root, YOUTUBE_SELECTORS.menus));
  const ancestorMenu = closestElement(root, YOUTUBE_SELECTORS.menus);
  if (ancestorMenu instanceof HTMLElement) menus.add(ancestorMenu);
  menus.forEach((menu) => {
    if (menuContainsShorts(menu, origin)) targets.set(menu, "menu");
  });

  elementsMatching<HTMLElement>(root, YOUTUBE_SELECTORS.nativeShortsShelves)
    .forEach((shelf) => {
      const element = shelfTarget(shelf);
      if (element) targets.set(element, "shelf");
    });

  return [...targets].map(([element, reason]) => ({ element, reason }));
}
