import { afterEach, describe, expect, it, vi } from "vitest";
import { trackNewness } from "@/youtube/subscriptions/sidebar/trackNewness";
import { parseChannelPage } from "@/utils/subscriptionChannels";
import { channelRenderer } from "../../fixtures/subscriptionChannels";

afterEach(() => { document.body.replaceChildren(); vi.useRealTimers(); });
describe("novidades locais", () => {
  it("espelha a bolinha, oculta ao clicar, restaura em nova transição e limpa ao desligar", async () => {
    document.body.innerHTML = '<ytd-guide-renderer><ytd-guide-section-renderer><ytd-guide-entry-renderer><a href="/feed/subscriptions"></a></ytd-guide-entry-renderer><ytd-guide-entry-renderer id="channel" line-end-style="dot"><a href="/@Alpha">Canal</a><div id="newness-dot"></div></ytd-guide-entry-renderer></ytd-guide-section-renderer></ytd-guide-renderer>';
    const update = vi.fn();
    const service = trackNewness(document, update);
    service.channels(parseChannelPage([channelRenderer()]).channels);
    expect(update).toHaveBeenLastCalledWith(new Set(["UCfixtureA"]));
    service.mark("UCfixtureA");
    expect(update).toHaveBeenLastCalledWith(new Set());
    const entry = document.querySelector("#channel")!;
    expect(entry.hasAttribute("data-yte-newness-seen")).toBe(true);
    entry.setAttribute("line-end-style", "none"); await Promise.resolve();
    entry.setAttribute("line-end-style", "dot"); await Promise.resolve();
    expect(update).toHaveBeenLastCalledWith(new Set(["UCfixtureA"]));
    service.mark("UCfixtureA"); service.destroy();
    expect(entry.hasAttribute("data-yte-newness-seen")).toBe(false);
  });
  it("reconhece clique no próprio menu e expira reconhecimento local", () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<ytd-guide-section-renderer><ytd-guide-entry-renderer><a href="/feed/subscriptions"></a></ytd-guide-entry-renderer><ytd-guide-entry-renderer line-end-style="dot"><a id="channel" href="/@Alpha">A</a></ytd-guide-entry-renderer></ytd-guide-section-renderer>';
    const update = vi.fn(); const service = trackNewness(document, update);
    service.channels(parseChannelPage([channelRenderer()]).channels);
    const anchor = document.querySelector<HTMLAnchorElement>("#channel")!;
    anchor.addEventListener("click", e => e.preventDefault()); anchor.click();
    expect(update).toHaveBeenLastCalledWith(new Set());
    vi.advanceTimersByTime(30 * 60 * 1000 + 1); service.scan();
    expect(update).toHaveBeenLastCalledWith(new Set(["UCfixtureA"]));
    service.destroy();
  });
});
