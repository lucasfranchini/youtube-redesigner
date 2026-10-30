import {
  CHANNEL_DATA,
  CHANNEL_REQUEST_TIMEOUT,
  CHANNEL_SELECTORS,
} from "@/constants/subscriptionChannels";
import { elementsMatching } from "@/utils/dom";

function cards(grid: Element): HTMLElement[] {
  return [...grid.querySelectorAll<HTMLElement>(CHANNEL_SELECTORS.cards)]
    .filter((card) => !card.parentElement?.closest(CHANNEL_SELECTORS.cards));
}

export function loadNextPage(
  grid: HTMLElement,
  signal: AbortSignal,
): Promise<HTMLElement[] | null> {
  const sentinel = grid.querySelector<HTMLElement>(CHANNEL_SELECTORS.continuation);
  if (!sentinel) return Promise.resolve(null);
  signal.throwIfAborted();

  return new Promise((resolve, reject) => {
    const before = new Set(cards(grid));
    const addedRoots = new Set<HTMLElement>();
    const view = grid.ownerDocument.defaultView;
    let frame: number | undefined;
    const clean = () => {
      observer.disconnect();
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      if (frame !== undefined) view?.cancelAnimationFrame(frame);
      delete grid.dataset[CHANNEL_DATA.loading];
    };
    const abort = () => {
      clean();
      reject(new DOMException("Aborted", "AbortError"));
    };
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) addedRoots.add(node);
      }));
      if (cards(grid).some((card) => !before.has(card))) {
        clean();
        const roots = [...addedRoots].filter((root) =>
          elementsMatching(root, CHANNEL_SELECTORS.cards).length > 0,
        );
        resolve(roots.length ? roots : [grid]);
      } else if (!grid.querySelector(CHANNEL_SELECTORS.continuation)) {
        clean();
        resolve(null);
      }
    });
    observer.observe(grid, { childList: true, subtree: true });
    signal.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(() => {
      clean();
      reject(new Error("O YouTube não carregou a próxima página."));
    }, CHANNEL_REQUEST_TIMEOUT);
    const reveal = () => { grid.dataset[CHANNEL_DATA.loading] = ""; };
    if (view?.requestAnimationFrame) {
      frame = view.requestAnimationFrame(() => {
        frame = view.requestAnimationFrame(reveal);
      });
    } else reveal();
  });
}
