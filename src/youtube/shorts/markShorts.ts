import { YOUTUBE_DATASET_KEYS, YOUTUBE_SELECTORS } from "@/constants/youtube";
import { elementsMatching } from "@/utils/dom";

import { findShortsTargets } from "./findShortsTargets";

function scanRoot(root: ParentNode): ParentNode {
  if (!(root instanceof Element)) return root;
  return root.closest(YOUTUBE_SELECTORS.markedShorts) ??
    root.closest(
      `${YOUTUBE_SELECTORS.cards},${YOUTUBE_SELECTORS.menus},${YOUTUBE_SELECTORS.shortsShelves},yt-tab-shape,tp-yt-paper-tab`,
    ) ?? root;
}

export function markShorts(root: ParentNode, origin: string): void {
  const scope = scanRoot(root);
  elementsMatching<HTMLElement>(scope, YOUTUBE_SELECTORS.markedShorts)
    .forEach((element) => delete element.dataset[YOUTUBE_DATASET_KEYS.shorts]);
  findShortsTargets(scope, origin).forEach(({ element, reason }) => {
    element.dataset[YOUTUBE_DATASET_KEYS.shorts] = reason;
  });
}
