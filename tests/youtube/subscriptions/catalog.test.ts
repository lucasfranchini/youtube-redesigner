import { describe, expect, it, vi } from "vitest";
import { loadSubscriptionCatalog } from "@/youtube/subscriptions/data/loadCatalog";
import { channelHtml, channelRenderer, continuation } from "../../fixtures/subscriptionChannels";

describe("catálogo de inscrições", () => {
  it.each(["http", "network", "json", "shape"])("preserva catálogo completo quando somente a ordem falha: %s", async failure => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(channelHtml()));
    if (failure === "network") request.mockRejectedValueOnce(new Error("offline"));
    else if (failure === "http") request.mockResolvedValueOnce(new Response("", { status: 403 }));
    else if (failure === "json") request.mockResolvedValueOnce(new Response("invalid json"));
    else request.mockResolvedValueOnce(Response.json({ unexpected: [] }));
    const result = await loadSubscriptionCatalog(new AbortController().signal, request);
    expect(result.channels.map(channel => channel.id)).toEqual(["UCfixtureA"]);
    expect(result.guideIds).toEqual([]);
  });
  it("não transforma cancelamento durante ordenação em sucesso", async () => {
    const abort = new AbortController();
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(channelHtml()))
      .mockImplementationOnce(async () => { abort.abort(); throw new Error("cancelled"); });
    await expect(loadSubscriptionCatalog(abort.signal, request)).rejects.toMatchObject({ name: "AbortError" });
  });
  it("lê bootstrap JSON e devolve todos os canais apenas após a continuação", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(channelHtml([channelRenderer(), continuation()])))
      .mockResolvedValueOnce(Response.json({ onResponseReceivedActions: [{ appendContinuationItemsAction: {
        continuationItems: [channelRenderer(), channelRenderer("UCfixtureB", "Beta")],
      } }] }))
      .mockResolvedValueOnce(Response.json({ items: [{ guideEntryRenderer: { navigationEndpoint: { browseEndpoint: { browseId: "UCfixtureB" } } } }] }));
    const result = await loadSubscriptionCatalog(new AbortController().signal, request);
    expect(result.channels).toHaveLength(2);
    expect(result.account).toBe("fixture-account");
    expect(request).toHaveBeenCalledTimes(3);
    expect(result.guideIds).toEqual(["UCfixtureB"]);
    expect(request.mock.calls[0]?.[1]).toMatchObject({ credentials: "include", cache: "no-store" });
    expect(JSON.parse(String(request.mock.calls[1]?.[1]?.body))).toMatchObject({ continuation: "fixture-next" });
  });
  it("não devolve lista parcial se a continuação falhar", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(channelHtml([channelRenderer(), continuation()])))
      .mockResolvedValueOnce(new Response("", { status: 403 }));
    await expect(loadSubscriptionCatalog(new AbortController().signal, request)).rejects.toThrow();
  });
  it("não aceita uma continuação desconhecida como catálogo completo", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(channelHtml([channelRenderer(), continuation()])))
      .mockResolvedValueOnce(Response.json({
        onResponseReceivedActions: [{ unknownAction: {} }],
      }));
    await expect(
      loadSubscriptionCatalog(new AbortController().signal, request),
    ).rejects.toThrow("não reconhecida");
  });
  it("detecta loop de continuação e respostas desconhecidas", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(channelHtml([channelRenderer(), continuation()])))
      .mockResolvedValueOnce(Response.json({ onResponseReceivedActions: [continuation()] }));
    await expect(loadSubscriptionCatalog(new AbortController().signal, request)).rejects.toThrow("não avançou");
    await expect(loadSubscriptionCatalog(new AbortController().signal, vi.fn().mockResolvedValue(new Response("login")))).rejects.toThrow();
  });
  it("rejeita sessão desconectada e cancelamento", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(channelHtml().replace('"LOGGED_IN":true', '"LOGGED_IN":false')));
    await expect(loadSubscriptionCatalog(new AbortController().signal, request)).rejects.toThrow("Entre no YouTube");
    const controller = new AbortController();
    controller.abort();
    await expect(loadSubscriptionCatalog(controller.signal, vi.fn().mockResolvedValue(new Response(channelHtml())))).rejects.toThrow();
  });
});
