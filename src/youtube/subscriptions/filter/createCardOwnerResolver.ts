import {
  CHANNEL_OWNERS_ATTRIBUTE,
  CHANNEL_OWNERS_EVENT,
  CHANNEL_SELECTORS,
} from "@/constants/subscriptionChannels";
import type { SubscriptionChannel } from "@/types/subscriptionChannels";
import { channelPath } from "@/utils/subscriptionChannels";

interface CachedOwners {
  signature: string;
  ids: string[];
  paths: string[];
  avatarKeys: string[];
}

function avatarKey(value: string): string | null {
  try {
    const url = new URL(value, "https://www.youtube.com");
    if (url.protocol !== "https:") return null;
    const key = url.pathname.split("/").pop()?.split("=")[0] ?? "";
    return key.length >= 16 ? key : null;
  } catch {
    return null;
  }
}

export function createCardOwnerResolver() {
  let cache = new WeakMap<Element, CachedOwners>();
  let aliases = new Map<string, string>();
  let avatarIds = new Map<string, string>();

  const resolve = (card: Element): string[] => {
    const videoHref = card
      .querySelector<HTMLAnchorElement>(CHANNEL_SELECTORS.videoLink)
      ?.getAttribute("href") ?? "";
    const ownerLinks = [
      ...card.querySelectorAll<HTMLAnchorElement>(CHANNEL_SELECTORS.ownerLinks),
    ];
    const ownerModels = [
      ...card.querySelectorAll<HTMLElement>(CHANNEL_SELECTORS.ownerModels),
    ];
    const paths = ownerLinks
      .map((anchor) => channelPath(anchor.getAttribute("href") ?? ""))
      .filter((path): path is string => Boolean(path));
    const authorText = ownerModels
      .map((model) => model.textContent?.replace(/\s+/g, " ").trim() ?? "")
      .filter(Boolean);
    const avatarKeys = [
      ...card.querySelectorAll<HTMLImageElement>(CHANNEL_SELECTORS.collaborationAvatars),
    ].map((image) => avatarKey(image.currentSrc || image.src))
      .filter((key): key is string => Boolean(key));
    const signature = JSON.stringify([videoHref, paths, authorText, avatarKeys]);
    let cached = cache.get(card);

    if (
      !cached ||
      cached.signature !== signature ||
      !cached.ids.length
    ) {
      let owners: unknown;
      card.removeAttribute(CHANNEL_OWNERS_ATTRIBUTE);
      try {
        card.dispatchEvent(new Event(CHANNEL_OWNERS_EVENT, { bubbles: true }));
        owners = JSON.parse(card.getAttribute(CHANNEL_OWNERS_ATTRIBUTE) ?? "[]");
      } catch {
        owners = [];
      } finally {
        card.removeAttribute(CHANNEL_OWNERS_ATTRIBUTE);
      }
      cached = {
        signature,
        ids: Array.isArray(owners)
          ? owners.filter((id): id is string => typeof id === "string")
          : [],
        paths,
        avatarKeys,
      };
      cache.set(card, cached);
    }

    const ids = new Set(cached.ids);
    cached.paths.forEach((path) => {
      const id = aliases.get(path);
      if (id) ids.add(id);
    });
    cached.avatarKeys.forEach((key) => {
      const id = avatarIds.get(key);
      if (id) ids.add(id);
    });
    return [...ids];
  };

  return {
    resolve,
    updateChannels(channels: SubscriptionChannel[]) {
      aliases = new Map(
        channels.flatMap((channel) =>
          channel.paths.map((path) => [path, channel.id] as const),
        ),
      );
      const candidates = new Map<string, Set<string>>();
      channels.forEach((channel) => {
        const key = channel.avatar ? avatarKey(channel.avatar) : null;
        if (!key) return;
        const ids = candidates.get(key) ?? new Set<string>();
        ids.add(channel.id);
        candidates.set(key, ids);
      });
      avatarIds = new Map(
        [...candidates]
          .filter(([, ids]) => ids.size === 1)
          .map(([key, ids]) => [key, [...ids][0]!] as const),
      );
      cache = new WeakMap();
    },
  };
}
