import { CHANNEL_NEWNESS_ATTRIBUTES, CHANNEL_NEWNESS_TTL, CHANNEL_SELECTORS } from "@/constants/subscriptionChannels";
import type { SubscriptionChannel } from "@/types/subscriptionChannels";
import { channelPath } from "@/utils/subscriptionChannels";

export function trackNewness(doc: Document, changed: (ids: Set<string>) => void) {
  let channels: SubscriptionChannel[] = [];
  const seen = new Map<string, number>();
  const marked = new Set<Element>();
  const scan = () => {
    if (!channels.length) return;
    const section = doc.querySelector(CHANNEL_SELECTORS.guideSubscriptions)?.closest(CHANNEL_SELECTORS.guideSection);
    const paths = new Map(channels.flatMap(channel => channel.paths.map(path => [path, channel.id] as const)));
    const fresh = new Set<string>();
    const active = new Set<Element>();
    section?.querySelectorAll(CHANNEL_SELECTORS.guideEntry).forEach(entry => {
      const path = channelPath(entry.querySelector('a[href]')?.getAttribute('href') ?? "");
      const id = paths.get(path ?? "");
      if (!id) return;
      active.add(entry);
      const dot = entry.getAttribute("line-end-style") === "dot";
      if (!dot || Date.now() - (seen.get(id) ?? 0) > CHANNEL_NEWNESS_TTL) seen.delete(id);
      const dismissed = dot && seen.has(id);
      if (dismissed) {
        if (!entry.hasAttribute(CHANNEL_NEWNESS_ATTRIBUTES.seen)) entry.setAttribute(CHANNEL_NEWNESS_ATTRIBUTES.seen, "");
        marked.add(entry);
      } else {
        entry.removeAttribute(CHANNEL_NEWNESS_ATTRIBUTES.seen);
        marked.delete(entry);
        if (dot) fresh.add(id);
      }
    });
    marked.forEach(entry => { if (!active.has(entry)) { entry.removeAttribute(CHANNEL_NEWNESS_ATTRIBUTES.seen); marked.delete(entry); } });
    changed(fresh);
  };
  const mark = (id: string) => { seen.set(id, Date.now()); scan(); };
  const click = (event: Event) => {
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest(CHANNEL_SELECTORS.guideLink);
    if (!anchor) return;
    const path = channelPath(anchor.getAttribute("href") ?? "");
    const channel = channels.find(item => item.paths.includes(path ?? ""));
    if (channel) mark(channel.id);
  };
  const observer = new MutationObserver(changes => {
    if (changes.some(change => change.target instanceof Element &&
      (change.target.closest(CHANNEL_SELECTORS.guide) || Array.from(change.addedNodes).some(node => node instanceof Element &&
        (node.matches(CHANNEL_SELECTORS.guide) || node.querySelector(CHANNEL_SELECTORS.guide)))))) scan();
  });
  observer.observe(doc, { childList: true, subtree: true, attributes: true, attributeFilter: ["line-end-style", "href"] });
  doc.addEventListener("click", click, true);
  const reset = () => { seen.clear(); marked.forEach(entry => entry.removeAttribute(CHANNEL_NEWNESS_ATTRIBUTES.seen)); marked.clear(); channels = []; changed(new Set()); };
  return {
    mark,
    scan,
    channels(value: SubscriptionChannel[]) { channels = value; scan(); },
    reset,
    destroy() { observer.disconnect(); doc.removeEventListener("click", click, true); reset(); },
  };
}
