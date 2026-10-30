import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

import content from "@/entrypoints/youtube.content";
import { setPreferences } from "@/storage/setPreferences";

const cleanups: (() => void)[] = [];
function context() {
  const abort = new AbortController();
  cleanups.push(() => abort.abort());
  return {
    isValid: true,
    setTimeout(handler: () => void, delay: number) {
      const timer = window.setTimeout(handler, delay);
      cleanups.push(() => window.clearTimeout(timer));
      return timer;
    },
    addEventListener(target: EventTarget, name: string, handler: EventListener) {
      target.addEventListener(name, handler, { signal: abort.signal });
    },
    onInvalidated(handler: () => void) { cleanups.push(handler); },
  } as unknown as NonNullable<Parameters<typeof content.main>[0]>;
}

beforeEach(() => {
  fakeBrowser.reset();
  window.history.replaceState({}, "", "/feed/subscriptions");
  document.documentElement.removeAttribute("data-yte-hide-shorts");
  document.body.innerHTML = '<ytd-rich-item-renderer id="short"><a href="/shorts/fixture">Short</a></ytd-rich-item-renderer><ytd-rich-section-renderer><h2>Mais relevantes</h2></ytd-rich-section-renderer>';
});
afterEach(() => { cleanups.splice(0).reverse().forEach(clean => clean()); });

describe("inicialização real das funções anteriores", () => {
  it("aguarda a criação do elemento raiz sem perder preferências", async () => {
    await setPreferences({ hideShorts: false, homeColumns: 3 });
    const root = document.documentElement;
    root.remove();
    try {
      expect(() => content.main(context())).not.toThrow();
      await Promise.resolve();
    } finally {
      document.append(root);
    }
    await vi.waitFor(() => {
      expect(root.dataset.yteHideShorts).toBe("false");
      expect(root.style.getPropertyValue("--yte-home-cols")).toBe("3");
      expect(document.querySelector("#short")?.hasAttribute("data-yte-shorts")).toBe(true);
    });
  });
  it("mantém Shorts, Mais relevantes e grades mesmo se a barra falhar ao iniciar", async () => {
    await setPreferences({ homeColumns: 5, subscriptionColumns: 6 });
    expect(() => content.main(context())).not.toThrow();
    await vi.waitFor(() => {
      expect(document.documentElement.dataset.yteHideShorts).toBe("true");
      expect(document.documentElement.style.getPropertyValue("--yte-cols")).toBe("6");
      expect(document.querySelector("#short")?.hasAttribute("data-yte-shorts")).toBe(true);
      expect(document.querySelector("[data-yte-relevant]")).not.toBeNull();
    });
  });
  it("continua observando preferências e novos Shorts após navegação SPA", async () => {
    content.main(context());
    await setPreferences({ hideShorts: false });
    await vi.waitFor(() => expect(document.documentElement.dataset.yteHideShorts).toBe("false"));
    window.history.replaceState({}, "", "/");
    document.dispatchEvent(new Event("yt-navigate-finish"));
    const card = document.createElement("ytd-rich-item-renderer");
    card.innerHTML = '<a href="/shorts/new">Short novo</a>';
    document.body.append(card);
    await setPreferences({ hideShorts: true });
    await vi.waitFor(() => {
      expect(document.documentElement.dataset.ytePage).toBe("home");
      expect(document.documentElement.dataset.yteHideShorts).toBe("true");
      expect(card.hasAttribute("data-yte-shorts")).toBe(true);
    });
  });
});
