import { afterEach, describe, expect, it, vi } from "vitest";
import { readSidebarOrder } from "@/youtube/subscriptions/sidebar/readOrder";
import { parseChannelPage } from "@/utils/subscriptionChannels";
import { channelRenderer } from "../../fixtures/subscriptionChannels";

afterEach(() => { document.body.replaceChildren(); vi.useRealTimers(); });

describe("integração com menu nativo", () => {
  it("usa somente canais inscritos da seção correta, por identidade, em ordem", () => {
    document.body.innerHTML = `<ytd-guide-section-renderer>
      <ytd-guide-entry-renderer><a href="/feed/subscriptions"></a></ytd-guide-entry-renderer>
      <a href="/@Beta">Mesmo nome</a><a href="/@Alpha">Mesmo nome</a><a href="/@Beta"></a>
      </ytd-guide-section-renderer><a href="/@Outro"></a>`;
    const channels = parseChannelPage([channelRenderer(), channelRenderer("UCfixtureB", "Beta")]).channels;
    expect(readSidebarOrder(document, channels)).toEqual(["UCfixtureB", "UCfixtureA"]);
    document.body.replaceChildren();
    expect(readSidebarOrder(document, channels)).toEqual([]);
  });

});
