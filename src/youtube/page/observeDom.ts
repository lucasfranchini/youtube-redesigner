interface ScanScheduler {
  setTimeout: (handler: () => void, delay: number) => number;
  clearTimeout: (timer: number) => void;
}

interface DomObserver {
  start: () => void;
  schedule: (root: ParentNode) => void;
  scanNow: (root?: ParentNode) => void;
  disconnect: () => void;
}

interface DomObserverOptions {
  document: Document;
  scan: (root: ParentNode) => void;
  scheduler?: ScanScheduler;
  delay?: number;
  attributeFilter?: string[];
  observeText?: boolean;
}

const DEFAULT_SCAN_DELAY_MS = 80;

function containsRoot(parent: ParentNode, child: ParentNode): boolean {
  return parent === child || (parent instanceof Node && parent.contains(child));
}

export function observeDom({
  document,
  scan,
  scheduler = {
    setTimeout: (handler, delay) => window.setTimeout(handler, delay),
    clearTimeout: (timer) => window.clearTimeout(timer),
  },
  delay = DEFAULT_SCAN_DELAY_MS,
  attributeFilter,
  observeText = false,
}: DomObserverOptions): DomObserver {
  const pendingRoots = new Set<ParentNode>();
  let timer: number | undefined;
  let started = false;

  const flush = () => {
    timer = undefined;
    const roots = [...pendingRoots];
    pendingRoots.clear();
    roots.forEach((root) => scan(root));
  };

  const schedule = (root: ParentNode) => {
    if ([...pendingRoots].some((pending) => containsRoot(pending, root))) return;
    [...pendingRoots]
      .filter((pending) => containsRoot(root, pending))
      .forEach((pending) => pendingRoots.delete(pending));
    pendingRoots.add(root);

    if (timer !== undefined) scheduler.clearTimeout(timer);
    timer = scheduler.setTimeout(flush, delay);
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "attributes") {
        if (mutation.target instanceof Element) schedule(mutation.target);
        return;
      }
      if (mutation.type === "characterData") {
        if (mutation.target.parentElement) schedule(mutation.target.parentElement);
        return;
      }
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) schedule(node);
        else if (node.parentElement) schedule(node.parentElement);
      });
    });
  });

  return {
    start() {
      if (started) return;
      started = true;
      const options: MutationObserverInit = {
        childList: true,
        subtree: true,
        attributes: Boolean(attributeFilter?.length),
        characterData: observeText,
      };
      if (attributeFilter?.length) options.attributeFilter = attributeFilter;
      observer.observe(document, options);
      schedule(document);
    },
    schedule,
    scanNow(root = document) {
      if (timer !== undefined) scheduler.clearTimeout(timer);
      timer = undefined;
      pendingRoots.clear();
      scan(root);
    },
    disconnect() {
      started = false;
      observer.disconnect();
      if (timer !== undefined) scheduler.clearTimeout(timer);
      timer = undefined;
      pendingRoots.clear();
    },
  };
}
