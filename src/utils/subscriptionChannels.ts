import type { SubscriptionChannel, SubscriptionChannelPage } from "@/types/subscriptionChannels";

export function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}

export function objects(value: unknown): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  const pending: unknown[] = [value];
  while (pending.length) {
    const item = pending.pop();
    if (Array.isArray(item)) pending.push(...item.slice().reverse());
    else if (item && typeof item === "object") {
      const entry = record(item);
      result.push(entry);
      pending.push(...Object.values(entry).reverse());
    }
  }
  return result;
}

/** Read a JSON object, never execute the script surrounding it. */
export function embeddedJson(source: string, marker: string): Record<string, unknown> {
  const at = source.indexOf(marker);
  if (at < 0) throw new Error("Dados do YouTube indisponíveis.");
  const start = source.indexOf("{", at + marker.length);
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let i = start; i >= 0 && i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === "{") depth++;
    else if (char === "}" && --depth === 0) {
      return record(JSON.parse(source.slice(start, i + 1)));
    }
  }
  throw new Error("Dados do YouTube incompletos.");
}

export function channelPath(value: string): string | null {
  try {
    const url = new URL(value, "https://www.youtube.com");
    if (url.origin !== "https://www.youtube.com") return null;
    const match = decodeURIComponent(url.pathname).match(/^\/(channel\/[^/]+|@[^/]+|c\/[^/]+|user\/[^/]+)/);
    if (!match) return null;
    const path = `/${match[1]}`;
    return path.startsWith("/@") ? path.toLowerCase() : path;
  } catch { return null; }
}

function text(value: unknown): string {
  const item = record(value);
  if (typeof item.simpleText === "string") return item.simpleText;
  return Array.isArray(item.runs)
    ? item.runs.map(run => record(run).text ?? "").join("") : "";
}

export function parseChannelPage(value: unknown): SubscriptionChannelPage {
  const channels = new Map<string, SubscriptionChannel>();
  const continuations = new Set<string>();
  for (const node of objects(value)) {
    if (node.channelRenderer) {
      const item = record(node.channelRenderer);
      const id = item.channelId;
      const name = text(item.title);
      if (typeof id !== "string" || !/^UC[\w-]+$/.test(id) || !name) {
        throw new Error("Canal em formato não reconhecido.");
      }
      const paths = new Set<string>([`/channel/${id}`]);
      for (const endpoint of objects(item.navigationEndpoint)) {
        for (const key of ["canonicalBaseUrl", "url"]) {
          if (typeof endpoint[key] === "string") {
            const path = channelPath(endpoint[key]);
            if (path) paths.add(path);
          }
        }
      }
      let avatar: string | null = null;
      for (const image of objects(item.thumbnail)) {
        if (typeof image.url !== "string") continue;
        try {
          const url = new URL(image.url, "https://www.youtube.com");
          if (url.protocol === "https:") avatar = url.href;
        } catch { /* Missing avatar uses the channel initial. */ }
      }
      channels.set(id, { id, name, paths: [...paths], avatar });
    }
    const continuation = record(record(node.continuationItemRenderer).continuationEndpoint);
    const token = record(continuation.continuationCommand).token;
    if (typeof token === "string") continuations.add(token);
  }
  if (continuations.size > 1) throw new Error("Paginação de canais não reconhecida.");
  return { channels: [...channels.values()], continuation: [...continuations][0] ?? null };
}

export function orderChannels(channels: SubscriptionChannel[], guideIds: string[]): SubscriptionChannel[] {
  const rank = new Map([...new Set(guideIds)].map((id, index) => [id, index]));
  return [...channels].sort((a, b) =>
    (rank.get(a.id) ?? channels.length) - (rank.get(b.id) ?? channels.length));
}

export function parseGuideIds(value: unknown, channels: SubscriptionChannel[]): string[] {
  const known = new Set(channels.map(channel => channel.id));
  const ids: string[] = [];
  for (const node of objects(value)) {
    if (!node.guideEntryRenderer) continue;
    const entry = record(node.guideEntryRenderer);
    const id = record(record(entry.navigationEndpoint).browseEndpoint).browseId;
    if (typeof id === "string" && known.has(id)) ids.push(id);
  }
  return [...new Set(ids)];
}
