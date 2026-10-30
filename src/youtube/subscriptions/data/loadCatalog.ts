import { BROWSE_URL, CHANNELS_URL, CHANNEL_REQUEST_TIMEOUT, GUIDE_URL } from "@/constants/subscriptionChannels";
import type { SubscriptionCatalog } from "@/types/subscriptionChannels";
import { embeddedJson, objects, parseChannelPage, parseGuideIds, record } from "@/utils/subscriptionChannels";

export async function loadSubscriptionCatalog(
  signal: AbortSignal,
  request: typeof fetch = fetch,
): Promise<SubscriptionCatalog> {
  const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(CHANNEL_REQUEST_TIMEOUT)]);
  const response = await request(CHANNELS_URL, {
    credentials: "include", cache: "no-store", signal: requestSignal,
  });
  if (!response.ok) throw new Error("Não foi possível carregar os canais.");
  const html = await response.text();
  const initial = embeddedJson(html, "var ytInitialData =");
  // Earlier scripts also call set(key, value) with JavaScript literals.
  // Only the object bootstrap is JSON; never evaluate arbitrary script text.
  const config = embeddedJson(html.slice(html.indexOf("ytcfg.set({")), "ytcfg.set(");
  if (config.LOGGED_IN !== true) throw new Error("Entre no YouTube para ver suas inscrições.");
  const account = config.DATASYNC_ID ?? config.DELEGATED_SESSION_ID;
  if (typeof account !== "string" || !account) throw new Error("Não foi possível identificar a conta do YouTube.");
  let page = parseChannelPage(initial.contents);
  // A recognized browse tree is required even for an empty account.
  if (!objects(initial.contents).some(node => node.sectionListRenderer || node.richGridRenderer)) {
    throw new Error("Lista de inscrições em formato não reconhecido.");
  }
  const channels = new Map(page.channels.map(channel => [channel.id, channel]));
  const seen = new Set<string>();
  while (page.continuation) {
    signal.throwIfAborted();
    if (seen.has(page.continuation)) throw new Error("A paginação dos canais não avançou.");
    seen.add(page.continuation);
    const next = await request(BROWSE_URL, {
      method: "POST", credentials: "include", signal: requestSignal,
      headers: { "Content-Type": "application/json", "X-Goog-AuthUser": String(config.SESSION_INDEX ?? 0) },
      body: JSON.stringify({ context: record(config.INNERTUBE_CONTEXT), continuation: page.continuation }),
    });
    if (!next.ok) throw new Error("Não foi possível obter todas as inscrições.");
    const data: unknown = await next.json();
    const actions = record(data).onResponseReceivedActions ?? record(data).onResponseReceivedEndpoints;
    if (!Array.isArray(actions)) throw new Error("Continuação de inscrições não reconhecida.");
    const recognized = objects(actions).some((node) =>
      node.channelRenderer !== undefined ||
      node.continuationItemRenderer !== undefined ||
      Array.isArray(record(node.appendContinuationItemsAction).continuationItems),
    );
    if (!recognized) throw new Error("Continuação de inscrições não reconhecida.");
    page = parseChannelPage(actions);
    page.channels.forEach(channel => channels.set(channel.id, channel));
  }
  signal.throwIfAborted();
  const list = [...channels.values()];
  let guideIds: string[] = [];
  try {
    const guide = await request(GUIDE_URL, {
    method: "POST", credentials: "include", cache: "no-store", signal: requestSignal,
    headers: { "Content-Type": "application/json", "X-Goog-AuthUser": String(config.SESSION_INDEX ?? 0) },
    body: JSON.stringify({ context: record(config.INNERTUBE_CONTEXT) }),
  });
    if (guide.ok) guideIds = parseGuideIds(await guide.json(), list);
  } catch {
    // Ordering is optional enrichment, never a reason to discard a complete
    // catalog. The controller also reads the actual rendered sidebar order.
    signal.throwIfAborted();
  }
  signal.throwIfAborted();
  return { channels: list, account, guideIds };
}
