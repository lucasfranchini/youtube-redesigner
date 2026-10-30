import {
  CHANNEL_OWNERS_ATTRIBUTE,
  CHANNEL_OWNERS_EVENT,
  CHANNEL_SELECTORS,
} from "@/constants/subscriptionChannels";
import {
  subscriptionAuthorIds,
  subscriptionOwners,
} from "@/utils/subscriptionOwners";

export function installCardOwnerBridge(doc: Document): () => void {
  const readOwners = (event: Event) => {
    const card = event.target;
    if (
      doc.location.pathname !== "/feed/subscriptions" ||
      !(card instanceof HTMLElement) ||
      !card.matches(CHANNEL_SELECTORS.cards) ||
      !card.closest(CHANNEL_SELECTORS.browse)
    ) return;

    try {
      const link = card.querySelector<HTMLAnchorElement>(CHANNEL_SELECTORS.videoLink);
      const videoId = link
        ? new URL(link.href, doc.location.href).searchParams.get("v")
        : null;
      if (!videoId) return;

      const ids = new Set<string>();
      for (const renderer of [card, ...card.querySelectorAll(CHANNEL_SELECTORS.media)]) {
        if ("data" in renderer) {
          subscriptionOwners(renderer.data, videoId).forEach((id) => ids.add(id));
        }
      }
      for (const owner of card.querySelectorAll(CHANNEL_SELECTORS.ownerModels)) {
        if ("data" in owner) {
          subscriptionAuthorIds(owner.data).forEach((id) => ids.add(id));
        }
      }
      if (ids.size) {
        card.setAttribute(CHANNEL_OWNERS_ATTRIBUTE, JSON.stringify([...ids]));
      }
    } catch {
      // Unknown native models leave the conservative byline fallback available.
    }
  };

  doc.addEventListener(CHANNEL_OWNERS_EVENT, readOwners);
  return () => doc.removeEventListener(CHANNEL_OWNERS_EVENT, readOwners);
}
