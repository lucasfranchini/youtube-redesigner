import { CHANNEL_SELECTORS } from "@/constants/subscriptionChannels";
import type { SubscriptionChannel } from "@/types/subscriptionChannels";
import { channelPath } from "@/utils/subscriptionChannels";

export function readSidebarOrder(doc: Document, channels: SubscriptionChannel[]): string[] {
  const section = doc.querySelector(CHANNEL_SELECTORS.guideSubscriptions)?.closest(CHANNEL_SELECTORS.guideSection);
  if (!section) return [];
  const ids = new Map(channels.flatMap(channel => channel.paths.map(path => [path, channel.id] as const)));
  return [...new Set(Array.from(section.querySelectorAll<HTMLAnchorElement>("a[href]"))
    .map(anchor => ids.get(channelPath(anchor.getAttribute("href") ?? "") ?? ""))
    .filter((id): id is string => !!id))];
}
