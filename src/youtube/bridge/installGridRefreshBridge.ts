import {
  CHANNEL_REFRESH_EVENT,
  CHANNEL_REFRESH_RESULT,
  CHANNEL_SELECTORS,
} from "@/constants/subscriptionChannels";
import type { NativeSubscriptionGrid } from "@/types/subscriptionChannels";
import { record } from "@/utils/subscriptionChannels";

export function installGridRefreshBridge(doc: Document): () => void {
  const frames = new Set<number>();
  let disposed = false;

  const nextFrame = (action: () => void) => {
    const view = doc.defaultView;
    if (!view?.requestAnimationFrame) {
      action();
      return;
    }
    const id = view.requestAnimationFrame(() => {
      frames.delete(id);
      if (!disposed) action();
    });
    frames.add(id);
  };

  const receive = (event: Event) => {
    if (
      doc.location.pathname !== "/feed/subscriptions" ||
      !(event instanceof CustomEvent) ||
      typeof event.detail !== "string"
    ) return;

    let request: Record<string, unknown>;
    try {
      request = record(JSON.parse(event.detail));
    } catch {
      return;
    }
    if (
      typeof request.token !== "string" ||
      !Array.isArray(record(request.data).contents)
    ) return;

    const grid = doc.querySelector<NativeSubscriptionGrid>(
      `${CHANNEL_SELECTORS.browse} ${CHANNEL_SELECTORS.grid}`,
    );
    let ok = false;
    try {
      if (grid && "data" in grid) {
        grid.data = record(request.data);
        ok = true;
      }
    } catch {
      ok = false;
    }

    const reply = () => doc.dispatchEvent(
      new CustomEvent(CHANNEL_REFRESH_RESULT, {
        detail: JSON.stringify({
          token: request.token,
          ok: ok && grid?.isConnected &&
            doc.location.pathname === "/feed/subscriptions",
        }),
      }),
    );
    if (ok) nextFrame(() => nextFrame(reply));
    else reply();
  };

  doc.addEventListener(CHANNEL_REFRESH_EVENT, receive);
  return () => {
    disposed = true;
    frames.forEach((id) => doc.defaultView?.cancelAnimationFrame(id));
    frames.clear();
    doc.removeEventListener(CHANNEL_REFRESH_EVENT, receive);
  };
}
