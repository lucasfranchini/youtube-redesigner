import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { refreshSubscriptionFeed } from "@/youtube/subscriptions/feed/refreshFeed";
import { installBridges } from "@/youtube/bridge/installBridges";
import { channelHtml } from "../../fixtures/subscriptionChannels";

let dispose: () => void;
beforeEach(() => {
  window.history.replaceState({}, "", "/feed/subscriptions");
  document.body.innerHTML = '<header>Preservar</header><ytd-browse page-subtype="subscriptions"><ytd-rich-grid-renderer></ytd-rich-grid-renderer></ytd-browse>';
  dispose = installBridges(document);
});
afterEach(() => { dispose(); document.body.replaceChildren(); });
const html = () => channelHtml().replace(/var ytInitialData = .*;<\/script>/, 'var ytInitialData = {"contents":{"richGridRenderer":{"contents":[{"richItemRenderer":{"content":{"videoRenderer":{"videoId":"fresh"}}}}]}}};</script>');

describe("atualização da grade sem navegar", () => {
  it("faz requisição nova e atualiza só dados do renderer, mantendo documento e header", async () => {
    const grid = document.querySelector("ytd-rich-grid-renderer")!;
    const header = document.querySelector("header");
    const setter = vi.fn();
    Object.defineProperty(grid, "data", { set: setter });
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(html()));
    await refreshSubscriptionFeed(document, new AbortController().signal, "UCfixtureA", "fixture-account", request);
    expect(setter).toHaveBeenCalledWith({ contents: [{ richItemRenderer: { content: { videoRenderer: { videoId: "fresh" } } } }] });
    expect(document.querySelector("header")).toBe(header);
    expect(document.querySelector("ytd-rich-grid-renderer")).toBe(grid);
    expect(window.location.pathname).toBe("/feed/subscriptions");
    expect(request.mock.calls[0]?.[1]).toMatchObject({ cache: "no-store", credentials: "include" });
  });
  it("rejeita conta diferente, estrutura desconhecida e renderer incompatível", async () => {
    await expect(refreshSubscriptionFeed(document, new AbortController().signal, "UCfixtureA", "other", vi.fn().mockResolvedValue(new Response(html())))).rejects.toThrow("conta");
    await expect(refreshSubscriptionFeed(document, new AbortController().signal, "UCfixtureA", "fixture-account", vi.fn().mockResolvedValue(new Response(channelHtml())))).rejects.toThrow("Grade");
    await expect(refreshSubscriptionFeed(document, new AbortController().signal, "UCfixtureA", "fixture-account", vi.fn().mockResolvedValue(new Response(html())))).rejects.toThrow("não aceitou");
  });
  it("ignora resposta atrasada depois de cancelar", async () => {
    const abort = new AbortController();
    const setter = vi.fn();
    Object.defineProperty(document.querySelector("ytd-rich-grid-renderer"), "data", { set: setter });
    let resolve!: (response: Response) => void;
    const request = vi.fn<typeof fetch>(() => new Promise(r => { resolve = r; }));
    const pending = refreshSubscriptionFeed(document, abort.signal, "UCfixtureA", "fixture-account", request);
    abort.abort(); resolve(new Response(html()));
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(setter).not.toHaveBeenCalled();
  });
});
