import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createChannelFilter } from "@/youtube/subscriptions/filter/createChannelFilter";
import { loadNextPage } from "@/youtube/subscriptions/pagination/loadNextPage";
import { parseChannelPage } from "@/utils/subscriptionChannels";

import { channelRenderer } from "../../fixtures/subscriptionChannels";

const channels = parseChannelPage([
  channelRenderer(),
  channelRenderer("UCfixtureB", "Beta"),
]).channels;
let grid: HTMLElement;

beforeEach(() => {
  document.documentElement.dataset.yteHideShorts = "true";
  document.documentElement.dataset.yteHideRelevant = "true";
  document.body.innerHTML = `
    <ytd-rich-grid-renderer>
      <ytd-rich-item-renderer id="a"><ytd-channel-name><a href="/@ALPHA">A</a></ytd-channel-name><button>Mais ações</button></ytd-rich-item-renderer>
      <ytd-rich-item-renderer id="b"><ytd-channel-name><a href="/@Beta">B</a></ytd-channel-name></ytd-rich-item-renderer>
      <ytd-rich-section-renderer id="group"><ytd-rich-item-renderer id="group-b"><ytd-channel-name><a href="/@Beta">B</a></ytd-channel-name></ytd-rich-item-renderer></ytd-rich-section-renderer>
      <ytd-rich-item-renderer id="short" data-yte-shorts><ytd-channel-name><a href="/@Alpha">Short</a></ytd-channel-name></ytd-rich-item-renderer>
      <ytd-rich-section-renderer data-yte-relevant><ytd-rich-item-renderer><ytd-channel-name><a href="/@Alpha">A</a></ytd-channel-name></ytd-rich-item-renderer></ytd-rich-section-renderer>
      <ytd-continuation-item-renderer></ytd-continuation-item-renderer>
    </ytd-rich-grid-renderer>`;
  grid = document.querySelector("ytd-rich-grid-renderer")!;
});

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
  delete document.documentElement.dataset.yteHideShorts;
  delete document.documentElement.dataset.yteHideRelevant;
});

describe("índice e paginação das inscrições", () => {
  it("filtra sem recriar cards e restaura todas as marcas", () => {
    const filter = createChannelFilter(grid, channels);
    const card = document.querySelector<HTMLElement>("#a")!;
    const click = vi.fn();
    card.querySelector("button")!.addEventListener("click", click);

    expect(filter.select("UCfixtureA")).toEqual([card]);
    expect(document.querySelector("#b")).toHaveAttribute("data-yte-channel-hidden");
    expect(document.querySelector("#group")).toHaveAttribute("data-yte-channel-hidden");
    card.querySelector("button")!.click();
    expect(click).toHaveBeenCalledOnce();

    filter.clear();
    expect(grid.querySelector("[data-yte-channel-hidden]")).toBeNull();
    expect(document.querySelector("#a")).toBe(card);
    expect(document.querySelector("#short")).toHaveAttribute("data-yte-shorts");
  });

  it("reutiliza o índice ao trocar de canal e reavalia somente card reciclado", () => {
    let ownerReads = 0;
    grid.addEventListener("yte-read-subscription-owners", () => ownerReads++);
    const filter = createChannelFilter(grid, channels);

    filter.select("UCfixtureA");
    const initialReads = ownerReads;
    expect(initialReads).toBeGreaterThan(0);
    expect(filter.select("UCfixtureB").map((card) => card.id))
      .toEqual(["b", "group-b"]);
    expect(ownerReads).toBe(initialReads);

    const anchor = document.querySelector<HTMLAnchorElement>("#b a")!;
    anchor.setAttribute("href", "/channel/UCfixtureA");
    filter.update(anchor);
    expect(filter.select("UCfixtureA").map((card) => card.id).sort())
      .toEqual(["a", "b"]);
    expect(ownerReads).toBe(initialReads + 1);
  });

  it("aguarda novos cards e devolve somente as raízes acrescentadas", async () => {
    const pending = loadNextPage(grid, new AbortController().signal);
    await vi.waitFor(() =>
      expect(grid).toHaveAttribute("data-yte-channel-loading"),
    );
    const card = document.createElement("ytd-rich-item-renderer");
    grid.append(card);
    await expect(pending).resolves.toContain(card);
    expect(grid).not.toHaveAttribute("data-yte-channel-loading");
  });

  it("distingue fim do feed, timeout e cancelamento", async () => {
    const controller = new AbortController();
    const pending = loadNextPage(grid, controller.signal);
    const cancelled = expect(pending).rejects.toMatchObject({ name: "AbortError" });
    controller.abort();
    await cancelled;
    expect(grid).not.toHaveAttribute("data-yte-channel-loading");

    vi.useFakeTimers();
    const timeout = loadNextPage(grid, new AbortController().signal);
    const failed = expect(timeout).rejects.toThrow("não carregou");
    await vi.advanceTimersByTimeAsync(15_000);
    await failed;
    grid.querySelector("ytd-continuation-item-renderer")!.remove();
    await expect(loadNextPage(grid, new AbortController().signal)).resolves.toBeNull();
  });
});
