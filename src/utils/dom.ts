export function elementsMatching<T extends Element>(
  root: ParentNode,
  selector: string,
): T[] {
  const elements = Array.from(root.querySelectorAll<T>(selector));

  if (root instanceof Element && root.matches(selector)) {
    elements.unshift(root as T);
  }

  return elements;
}

export function closestElement(
  root: ParentNode,
  selector: string,
): Element | null {
  return root instanceof Element ? root.closest(selector) : null;
}
