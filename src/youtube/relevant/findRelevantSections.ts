import {
  RELEVANT_TITLES,
  SUBSCRIPTIONS_PATH,
  YOUTUBE_SELECTORS,
} from "@/constants/youtube";
import { closestElement, elementsMatching } from "@/utils/dom";
import { normalizeTitle } from "@/utils/text";

export function findRelevantSections(
  root: ParentNode,
  pathname: string,
): HTMLElement[] {
  if (pathname !== SUBSCRIPTIONS_PATH) return [];

  const sections = new Set(
    elementsMatching(root, YOUTUBE_SELECTORS.relevantSections),
  );
  const ancestor = closestElement(root, YOUTUBE_SELECTORS.relevantSections);
  if (ancestor) sections.add(ancestor);

  return [...sections].filter((section): section is HTMLElement =>
    section instanceof HTMLElement &&
    [...section.querySelectorAll(YOUTUBE_SELECTORS.relevantTitles)].some(
      (title) => RELEVANT_TITLES.has(normalizeTitle(title.textContent ?? "")),
    ),
  );
}
