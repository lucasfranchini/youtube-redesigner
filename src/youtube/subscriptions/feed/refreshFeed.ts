import { CHANNEL_REFRESH_EVENT, CHANNEL_REFRESH_RESULT, CHANNEL_REQUEST_TIMEOUT, CHANNEL_SELECTORS } from "@/constants/subscriptionChannels";
import { embeddedJson, objects, record } from "@/utils/subscriptionChannels";

export async function refreshSubscriptionFeed(
  doc: Document, signal: AbortSignal, id: string, account: string, request: typeof fetch = fetch,
): Promise<void> {
  if (!/^UC[\w-]+$/.test(id)) throw new Error("Canal inválido.");
  const target = doc.querySelector(`${CHANNEL_SELECTORS.browse} ${CHANNEL_SELECTORS.grid}`);
  const response = await request("https://www.youtube.com/feed/subscriptions", {
    credentials: "include", cache: "no-store",
    signal: AbortSignal.any([signal, AbortSignal.timeout(CHANNEL_REQUEST_TIMEOUT)]),
  });
  if (!response.ok) throw new Error("Não foi possível atualizar os vídeos.");
  const html = await response.text();
  const config = embeddedJson(html.slice(html.indexOf("ytcfg.set({")), "ytcfg.set(");
  if (config.LOGGED_IN !== true || (config.DATASYNC_ID ?? config.DELEGATED_SESSION_ID) !== account) {
    throw new Error("A conta do YouTube mudou. Abra novamente suas inscrições.");
  }
  const initial = embeddedJson(html, "var ytInitialData =");
  const grids = objects(initial.contents).filter(node => node.richGridRenderer);
  const data = record(grids[0]?.richGridRenderer);
  if (grids.length !== 1 || !Array.isArray(data.contents)) throw new Error("Grade do YouTube não reconhecida.");
  signal.throwIfAborted();
  if (!target?.isConnected || doc.location.pathname !== "/feed/subscriptions") throw new Error("Navegação interrompida.");
  await new Promise<void>((resolve, reject) => {
    const token = crypto.randomUUID();
    const clean = () => {
      clearTimeout(timer);
      doc.removeEventListener(CHANNEL_REFRESH_RESULT, result);
      signal.removeEventListener("abort", abort);
    };
    const abort = () => { clean(); reject(new DOMException("Aborted", "AbortError")); };
    const result = (event: Event) => {
      if (!(event instanceof CustomEvent) || typeof event.detail !== "string") return;
      let value: Record<string, unknown>;
      try { value = record(JSON.parse(event.detail)); } catch { return; }
      if (value.token !== token) return;
      clean();
      if (value.ok) resolve(); else reject(new Error("O YouTube não aceitou a atualização da lista."));
    };
    const timer = setTimeout(() => { clean(); reject(new Error("Atualização da lista indisponível.")); }, CHANNEL_REQUEST_TIMEOUT);
    signal.addEventListener("abort", abort, { once: true });
    doc.addEventListener(CHANNEL_REFRESH_RESULT, result);
    doc.dispatchEvent(new CustomEvent(CHANNEL_REFRESH_EVENT, { detail: JSON.stringify({ token, data }) }));
  });
}
