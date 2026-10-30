import { describe, expect, it } from "vitest";
import { channelPath, embeddedJson, orderChannels, parseChannelPage } from "@/utils/subscriptionChannels";
import { channelRenderer, continuation } from "../fixtures/subscriptionChannels";

describe("dados de inscrições", () => {
  it("extrai JSON com chaves dentro de strings sem executar código", () => {
    const value = { text: '}"{' };
    expect(embeddedJson(`prefix=${JSON.stringify(value)};throw Error()`, "prefix=")).toEqual(value);
    expect(() => embeddedJson("var data = {x: function(){}}", "var data =")).toThrow();
    expect(() => embeddedJson("{}", "missing")).toThrow();
  });
  it("normaliza handles, preserva IDs e rejeita outras origens", () => {
    expect(channelPath("/@MWinform%C3%A1tica/videos")).toBe("/@mwinformática");
    expect(channelPath("/channel/UCaA/videos")).toBe("/channel/UCaA");
    expect(channelPath("https://evil.example/@alpha")).toBeNull();
    expect(channelPath("/%xx")).toBeNull();
  });
  it("deduplica por ID e mantém canais de mesmo nome separados", () => {
    const page = parseChannelPage([channelRenderer(), channelRenderer(), channelRenderer("UCfixtureB", "Beta"), continuation()]);
    expect(page.channels).toHaveLength(2);
    expect(page.channels[0]).toMatchObject({ id: "UCfixtureA", avatar: "https://yt3.googleusercontent.com/fixture", paths: ["/channel/UCfixtureA", "/@alpha"] });
    expect(page.continuation).toBe("fixture-next");
  });
  it("aceita avatar ausente e rejeita canais malformados", () => {
    const item = channelRenderer();
    item.channelRenderer.thumbnail.thumbnails = [];
    expect(parseChannelPage([item]).channels[0]?.avatar).toBeNull();
    expect(() => parseChannelPage([{ channelRenderer: { title: { simpleText: "X" } } }])).toThrow();
  });
  it("segue menu e preserva ordem nativa dos demais sem alterar a entrada", () => {
    const channels = parseChannelPage([channelRenderer("UCc", "c", "C"), channelRenderer("UCb", "b", "B"), channelRenderer("UCa", "a", "A")]).channels;
    expect(orderChannels(channels, ["UCb", "UCb"]).map(c => c.name)).toEqual(["B", "C", "A"]);
    expect(channels.map(c => c.name)).toEqual(["C", "B", "A"]);
  });
});
