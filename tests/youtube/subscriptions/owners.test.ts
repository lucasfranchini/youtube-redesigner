import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CHANNEL_OWNERS_ATTRIBUTE } from "@/constants/subscriptionChannels";
import { installBridges } from "@/youtube/bridge/installBridges";
import { createCardOwnerResolver } from "@/youtube/subscriptions/filter/createCardOwnerResolver";
import { createChannelFilter } from "@/youtube/subscriptions/filter/createChannelFilter";
import { subscriptionAuthorIds, subscriptionOwners } from "@/utils/subscriptionOwners";
import { parseChannelPage } from "@/utils/subscriptionChannels";

import { channelRenderer } from "../../fixtures/subscriptionChannels";

const endpoint = (id: string) => ({ browseEndpoint: { browseId: id } });
const collab = () => ({
  videoId: "fixtureVideo",
  ownerText: { runs: [{
    text: "Mesmo nome e mais 1",
    navigationEndpoint: { showDialogCommand: { panelLoadingStrategy: {
      inlineContent: { dialogViewModel: { customContent: { listViewModel: {
        listItems: ["UCfixtureA", "UCfixtureB", "UCfixtureA"].map((id) => ({
          listItemViewModel: { rendererContext: { commandContext: { onTap: {
            innertubeCommand: endpoint(id),
          } } } },
        })),
      } } } },
    } } },
  }] },
  menu: endpoint("UCunrelated"),
  descriptionSnippet: endpoint("UCunrelated"),
});
const channels = parseChannelPage([
  channelRenderer(),
  channelRenderer("UCfixtureB", "Beta"),
  channelRenderer("UCunrelated", "Other"),
]).channels.map((channel) => ({
  ...channel,
  avatar: `https://yt3.ggpht.com/avatar-${channel.id}-0123456789=s176-c-k-c0x00ffffff-no-rj`,
}));
const resolver = () => {
  const instance = createCardOwnerResolver();
  instance.updateChannels(channels);
  return instance;
};
let dispose: () => void;
let grid: HTMLElement;
let card: HTMLElement;

beforeEach(() => {
  window.history.replaceState({}, "", "/feed/subscriptions");
  document.body.innerHTML = '<ytd-browse page-subtype="subscriptions"><ytd-rich-grid-renderer><ytd-rich-item-renderer><ytd-rich-grid-media><a href="/watch?v=fixtureVideo">Vídeo</a><button>Canais de collab</button></ytd-rich-grid-media></ytd-rich-item-renderer></ytd-rich-grid-renderer></ytd-browse>';
  grid = document.querySelector("ytd-rich-grid-renderer")!;
  card = document.querySelector("ytd-rich-item-renderer")!;
  Object.defineProperty(card.querySelector("ytd-rich-grid-media"), "data", {
    value: collab(),
    writable: true,
  });
  dispose = installBridges(document);
});

afterEach(() => {
  dispose();
  document.body.replaceChildren();
});

describe("identidade de vídeos em colaboração", () => {
  it("indexa ambos os participantes e ignora IDs fora do autor", () => {
    const resolve = resolver();
    expect(resolve.resolve(card)).toEqual(["UCfixtureA", "UCfixtureB"]);
    const filter = createChannelFilter(grid, channels);
    expect(filter.select("UCfixtureA")).toEqual([card]);
    expect(filter.select("UCfixtureB")).toEqual([card]);
    expect(filter.select("UCunrelated")).toEqual([]);
    filter.clear();
    expect(card).not.toHaveAttribute("data-yte-channel-hidden");
    expect(card).not.toHaveAttribute(CHANNEL_OWNERS_ATTRIBUTE);
  });

  it("invalida o cache quando o card recebe outro vídeo", () => {
    const resolve = resolver();
    expect(resolve.resolve(card)).toEqual(["UCfixtureA", "UCfixtureB"]);
    card.querySelector("a")!.setAttribute("href", "/watch?v=nextVideo");
    expect(resolve.resolve(card)).toEqual([]);
    Object.assign(card.querySelector("ytd-rich-grid-media")!, { data: {
      videoId: "nextVideo",
      ownerText: { runs: [{ navigationEndpoint: endpoint("UCfixtureB") }] },
    } });
    expect(resolve.resolve(card)).toEqual(["UCfixtureB"]);
  });

  it("resolve o DOM moderno real por avatares do stack de colaboração", () => {
    Object.assign(card.querySelector("ytd-rich-grid-media")!, { data: undefined });
    card.querySelector("ytd-rich-grid-media")!.insertAdjacentHTML("beforeend", `
      <div id="byline-container">Canal A e Beta</div>
      <yt-avatar-stack-view-model role="button" aria-label="Canais de collab">
        <img src="https://yt3.ggpht.com/avatar-UCfixtureB-0123456789=s68-c-k-c0x00ffffff-no-rj">
        <img src="https://yt3.ggpht.com/avatar-UCfixtureA-0123456789=s88-c-k-c0x00ffffff-no-rj">
      </yt-avatar-stack-view-model>`);

    expect(resolver().resolve(card).sort())
      .toEqual(["UCfixtureA", "UCfixtureB"]);
    const filter = createChannelFilter(grid, channels);
    expect(filter.select("UCfixtureA")).toEqual([card]);
    expect(filter.select("UCfixtureB")).toEqual([card]);
  });

  it("incorpora colaboradores quando o modelo moderno de autoria chega depois", () => {
    const media = card.querySelector<HTMLElement>("ytd-rich-grid-media")!;
    Object.assign(media, { data: {
      videoId: "fixtureVideo",
      ownerText: { runs: [{ navigationEndpoint: endpoint("UCfixtureA") }] },
    } });
    const filter = createChannelFilter(grid, channels);
    expect(filter.select("UCfixtureB")).toEqual([]);

    const metadata = document.createElement("yt-content-metadata-view-model");
    metadata.textContent = "Mesmo nome e Beta";
    Object.assign(metadata, { data: { metadataRows: [{ metadataParts: [{
      text: { commandRuns: [{ onTap: { innertubeCommand: {
        showDialogCommand: { inlineContent: { listItems: [endpoint("UCfixtureB")] } },
      } } }] },
    }] }] } });
    media.append(metadata);

    filter.update(metadata);
    expect(filter.select("UCfixtureB")).toEqual([card]);
  });

  it("processa cards acrescentados e remove listeners na invalidação", () => {
    const added = document.createElement("ytd-rich-item-renderer");
    added.innerHTML = '<a href="/watch?v=fixtureVideo">Novo</a>';
    Object.assign(added, { data: { content: { videoRenderer: collab() } } });
    grid.append(added);
    const active = resolver();
    expect(active.resolve(added))
      .toEqual(["UCfixtureA", "UCfixtureB"]);
    dispose();
    expect(resolver().resolve(added)).toEqual([]);
    expect(document.querySelector(`[${CHANNEL_OWNERS_ATTRIBUTE}]`)).toBeNull();
  });

  it("usa somente links conservadores de autoria como fallback", () => {
    Object.defineProperty(card, "data", {
      get() { throw new Error("unsupported"); },
    });
    card.insertAdjacentHTML(
      "beforeend",
      '<ytd-channel-name><a href="/@Alpha">Autor</a></ytd-channel-name><div class="menu"><a href="/@Other">Outro</a></div>',
    );
    const resolve = resolver();
    expect(resolve.resolve(card)).toEqual(["UCfixtureA"]);
  });

  it("aceita wrappers e bylines, rejeita desconhecidos e suporta ciclos", () => {
    expect(subscriptionOwners(
      { richItemRenderer: { content: { videoRenderer: collab() } } },
      "fixtureVideo",
    ).sort()).toEqual(["UCfixtureA", "UCfixtureB"]);
    const owner: Record<string, unknown> = endpoint("UCfixtureA");
    owner.cycle = owner;
    expect(subscriptionOwners(
      { videoId: "v", shortBylineText: owner },
      "v",
    )).toEqual(["UCfixtureA"]);
    expect(subscriptionOwners(
      { lockupViewModel: { contentId: "v", metadata: {
        lockupMetadataViewModel: { metadata: { contentMetadataViewModel: endpoint("UCfixtureB") } },
      } } },
      "v",
    )).toEqual(["UCfixtureB"]);
    expect(subscriptionAuthorIds({ metadataRows: [collab().ownerText] }).sort())
      .toEqual(["UCfixtureA", "UCfixtureB"]);
    expect(subscriptionOwners(
      { videoId: "v", ownerText: { simpleText: "Mesmo nome" } },
      "v",
    )).toEqual([]);
  });
});
