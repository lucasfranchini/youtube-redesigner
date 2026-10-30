import { getPreferences } from "@/storage/getPreferences";
import { watchPreferences } from "@/storage/watchPreferences";
import { DEFAULT_PREFERENCES } from "@/constants/preferences";
import type { Preferences } from "@/types/preferences";
import { applyPreferencesToPage } from "@/youtube/page/applyPreferences";
import { observeDom } from "@/youtube/page/observeDom";
import { updatePageMarker } from "@/youtube/page/updatePageMarker";
import { markRelevantSections } from "@/youtube/relevant/markRelevantSections";
import { markShorts } from "@/youtube/shorts/markShorts";

import "./styles/shorts.css";
import "./styles/grids.css";
import "./styles/subscriptions.css";

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  runAt: "document_start",

  main(ctx) {
    let preferences: Preferences = { ...DEFAULT_PREFERENCES };
    const applyCurrentState = () => {
      // At document_start the root may not exist yet, or may be replaced.
      const root = document.documentElement;
      if (root) applyPreferencesToPage(root, location.pathname, preferences);
    };
    const scanCurrentDom = (scanRoot: ParentNode) => {
      applyCurrentState();
      markShorts(scanRoot, location.origin);
      markRelevantSections(scanRoot, location.pathname);
    };

    const scanner = observeDom({
      document,
      scan: scanCurrentDom,
      attributeFilter: ["href", "aria-label", "title"],
      observeText: true,
      scheduler: {
        setTimeout: (handler, delay) => ctx.setTimeout(handler, delay),
        clearTimeout: (timer) => window.clearTimeout(timer),
      },
    });

    const refreshPage = () => {
      applyCurrentState();
      scanner.schedule(document);
    };

    scanner.start();
    applyCurrentState();

    void getPreferences().then((stored) => {
      if (ctx.isValid) {
        preferences = stored;
        applyCurrentState();
      }
    }).catch(() => {
      console.warn("[YouTube Redesigner] Não foi possível ler as preferências; mantendo os valores atuais.");
    });

    const unwatchPreferences = watchPreferences((stored) => {
      if (ctx.isValid) {
        preferences = stored;
        applyCurrentState();
      }
    });

    ctx.addEventListener(document, "yt-navigate-start", () => {
      const root = document.documentElement;
      if (root) updatePageMarker(root, location.pathname);
    });
    ctx.addEventListener(document, "yt-navigate-finish", refreshPage);
    ctx.addEventListener(window, "wxt:locationchange", refreshPage);

    ctx.onInvalidated(() => {
      scanner.disconnect();
      unwatchPreferences();
    });
  },
});
