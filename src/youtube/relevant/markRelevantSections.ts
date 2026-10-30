import { YOUTUBE_DATASET_KEYS, YOUTUBE_SELECTORS } from "@/constants/youtube";
import { elementsMatching } from "@/utils/dom";

import { findRelevantSections } from "./findRelevantSections";

function scanRoot(root: ParentNode): ParentNode {
  if (!(root instanceof Element)) return root;
  return root.closest(YOUTUBE_SELECTORS.markedRelevant) ??
    root.closest(YOUTUBE_SELECTORS.relevantSections) ?? root;
}

export function markRelevantSections(
  root: ParentNode,
  pathname: string,
): void {
  const scope = scanRoot(root);
  elementsMatching<HTMLElement>(scope, YOUTUBE_SELECTORS.markedRelevant)
    .forEach((element) => delete element.dataset[YOUTUBE_DATASET_KEYS.relevant]);
  findRelevantSections(scope, pathname).forEach((section) => {
    section.dataset[YOUTUBE_DATASET_KEYS.relevant] = "true";
  });
}
