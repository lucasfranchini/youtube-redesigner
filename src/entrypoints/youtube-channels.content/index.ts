import { getPreferences } from "@/storage/getPreferences";
import { watchPreferences } from "@/storage/watchPreferences";
import { observeDom } from "@/youtube/page/observeDom";
import { createSubscriptionController } from "@/youtube/subscriptions/controller";
import { CHANNEL_BRIDGE_DISPOSE } from "@/constants/subscriptionChannels";

import "./styles/channels.css";

// Keep this independent from Shorts/relevant sections/grids. A carousel startup
// or runtime failure must never prevent those features from initializing.
export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  runAt: "document_idle",

  main(ctx) {
    const channels = createSubscriptionController(document);
    let scannerStarted = false;
    const scanner = observeDom({
      document,
      scan: root => channels.scan(root),
      attributeFilter: ["href", "src"],
      scheduler: {
        setTimeout: (handler, delay) => ctx.setTimeout(handler, delay),
        clearTimeout: timer => window.clearTimeout(timer),
      },
    });
    const applyPreferences = (preferences: Awaited<ReturnType<typeof getPreferences>>) => {
      channels.preferences(preferences);
      if (preferences.showSubscriptionChannels && !scannerStarted) {
        scannerStarted = true;
        scanner.start();
      } else if (!preferences.showSubscriptionChannels && scannerStarted) {
        scannerStarted = false;
        scanner.disconnect();
      }
    };
    void getPreferences().then(preferences => {
      if (ctx.isValid) applyPreferences(preferences);
    }).catch(() => {
      console.warn("[YouTube Redesigner] Não foi possível carregar a preferência da barra de canais.");
    });
    const unwatch = watchPreferences(preferences => {
      if (ctx.isValid) applyPreferences(preferences);
    });
    ctx.addEventListener(document, "yt-navigate-start", () => channels.navigateStart());
    const refresh = () => {
      channels.navigateFinish();
      if (scannerStarted) scanner.schedule(document);
    };
    ctx.addEventListener(document, "yt-navigate-finish", refresh);
    ctx.addEventListener(window, "wxt:locationchange", refresh);
    ctx.onInvalidated(() => {
      document.dispatchEvent(new Event(CHANNEL_BRIDGE_DISPOSE));
      scanner.disconnect();
      scannerStarted = false;
      channels.destroy();
      unwatch();
    });
  },
});
