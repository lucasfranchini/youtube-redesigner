import { record } from "./subscriptionChannels";

const AUTHOR_FIELDS = new Set([
  "ownerText",
  "shortBylineText",
  "longBylineText",
  "bylineText",
  "contentMetadataViewModel",
]);

function channelIds(value: unknown): string[] {
  const pending = [value];
  const seen = new Set<object>();
  const ids = new Set<string>();
  for (let count = 0; pending.length && count < 2000; count++) {
    const item = pending.pop();
    if (!item || typeof item !== "object" || seen.has(item)) continue;
    seen.add(item);
    if (Array.isArray(item)) {
      pending.push(...item);
      continue;
    }
    const node = record(item);
    const id = record(node.browseEndpoint).browseId;
    if (typeof id === "string" && /^UC[\w-]+$/.test(id)) ids.add(id);
    pending.push(...Object.values(node));
  }
  return [...ids];
}

/** The caller must scope this to a native author/byline metadata element. */
export function subscriptionAuthorIds(data: unknown): string[] {
  return channelIds(data);
}

/** Only author fields can supply identities. Menus, descriptions and suggested
 * videos may reference unrelated channels and must never become owners. */
export function subscriptionOwners(data: unknown, videoId: string): string[] {
  if (!videoId) return [];
  const pending = [data];
  const seen = new Set<object>();
  const ids = new Set<string>();
  // Find the renderer for the current watch URL before inspecting named author
  // branches. This supports both videoRenderer.videoId and modern lockups using
  // contentId without admitting menu or description endpoints.
  for (let count = 0; pending.length && count < 2000; count++) {
    const value: unknown = pending.pop();
    if (!value || typeof value !== "object" || seen.has(value)) continue;
    seen.add(value);
    if (Array.isArray(value)) {
      pending.push(...value);
      continue;
    }
    const node = record(value);
    if (node.videoId === videoId || node.contentId === videoId) {
      const authorBranches: unknown[] = [node];
      const authorSeen = new Set<object>();
      for (let branchCount = 0; authorBranches.length && branchCount < 2000; branchCount++) {
        const branch = authorBranches.pop();
        if (!branch || typeof branch !== "object" || authorSeen.has(branch)) continue;
        authorSeen.add(branch);
        if (Array.isArray(branch)) {
          authorBranches.push(...branch);
          continue;
        }
        Object.entries(record(branch)).forEach(([key, child]) => {
          if (AUTHOR_FIELDS.has(key)) {
            channelIds(child).forEach((id) => ids.add(id));
          } else if (child && typeof child === "object") {
            authorBranches.push(child);
          }
        });
      }
    }
    pending.push(...Object.values(node));
  }
  return [...ids];
}
