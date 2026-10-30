import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PREFERENCES } from "@/constants/preferences";
import { createSubscriptionController as createController } from "@/youtube/subscriptions/controller";
import type { SubscriptionCatalog } from "@/types/subscriptionChannels";
import { parseChannelPage } from "@/utils/subscriptionChannels";
import { channelRenderer } from "../../fixtures/subscriptionChannels";

const createSubscriptionController: typeof createController = (
  doc,
  load,
  next,
  refresh = vi.fn().mockResolvedValue(undefined),
) => createController(doc, load, next, refresh);

const catalog: SubscriptionCatalog = { account: "account-A", channels: parseChannelPage([
  channelRenderer(), channelRenderer("UCfixtureB", "Beta", "Canal B"),
]).channels };
let controller: ReturnType<typeof createSubscriptionController>;
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const channel = () => document.querySelector<HTMLButtonElement>('[aria-label="Canal A"]')!;
beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  window.history.replaceState({}, "", "/feed/subscriptions");
  document.body.innerHTML = '<ytd-browse page-subtype="subscriptions"><div id="primary"><ytd-rich-grid-renderer><ytd-rich-item-renderer><ytd-channel-name><a href="/@Beta">B</a></ytd-channel-name></ytd-rich-item-renderer><ytd-continuation-item-renderer></ytd-continuation-item-renderer></ytd-rich-grid-renderer></div></ytd-browse>';
});
afterEach(() => { controller?.destroy(); document.body.replaceChildren(); vi.restoreAllMocks(); });

describe("ciclo da barra de inscrições", () => {
  it("volta ao topo apenas na seleção explícita, sem saltos na atualização ou no retorno", async () => {
    let finish!: () => void;
    const refresh = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    controller = createSubscriptionController(document, vi.fn().mockResolvedValue(catalog), vi.fn().mockResolvedValue(null), refresh);
    controller.preferences(DEFAULT_PREFERENCES); await flush();
    expect(window.scrollTo).not.toHaveBeenCalled();
    channel().click();
    expect(window.scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0, behavior: "instant" });
    finish(); await flush(); controller.scan();
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    controller.navigateStart(); controller.navigateFinish(); await flush();
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    document.querySelector<HTMLButtonElement>(".yte-channel-all")!.click();
    expect(window.scrollTo).toHaveBeenCalledTimes(2);
  });
  it("usa ordem do guide mesmo sem menu montado e acompanha ordem visível depois", async () => {
    controller = createSubscriptionController(document, vi.fn().mockResolvedValue({ ...catalog, guideIds: ["UCfixtureB", "UCfixtureA"] }));
    controller.preferences(DEFAULT_PREFERENCES); await flush();
    const names = () => Array.from(document.querySelectorAll('.yte-channel-item')).map(item => item.getAttribute('aria-label'));
    expect(names()).toEqual(["Canal B", "Canal A"]);
    controller.scan(); expect(names()).toEqual(["Canal B", "Canal A"]);
    const menu = document.createElement("ytd-guide-section-renderer");
    menu.innerHTML = '<ytd-guide-entry-renderer><a href="/feed/subscriptions"></a></ytd-guide-entry-renderer><a href="/@Alpha"></a><a href="/@Beta"></a>';
    document.body.append(menu); controller.scan();
    expect(names()).toEqual(["Canal A", "Canal B"]);
  });
  it("atualiza antes de paginar, cancela atualizações anteriores e exibe spinner no rodapé", async () => {
    let finish!: () => void;
    const refresh = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const next = vi.fn().mockResolvedValue(null);
    controller = createSubscriptionController(document, vi.fn().mockResolvedValue(catalog), next, refresh);
    controller.preferences(DEFAULT_PREFERENCES); await flush();
    channel().click(); channel().click();
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(next).not.toHaveBeenCalled();
    const footer = document.querySelector<HTMLElement>('[data-yte-channel-footer]')!;
    expect(footer.previousElementSibling?.tagName).toBe("YTD-RICH-GRID-RENDERER");
    expect(footer.querySelector<HTMLElement>(".yte-channel-spinner")!.hidden).toBe(false);
    finish(); await flush();
    expect(next).toHaveBeenCalledOnce();
    expect(footer.querySelector<HTMLElement>(".yte-channel-spinner")!.hidden).toBe(true);
  });
  it("reutiliza o índice ao trocar de canal depois da primeira atualização", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    controller = createSubscriptionController(
      document,
      vi.fn().mockResolvedValue(catalog),
      vi.fn().mockResolvedValue(null),
      refresh,
    );
    controller.preferences(DEFAULT_PREFERENCES);
    await flush();

    channel().click();
    await flush();
    expect(refresh).toHaveBeenCalledOnce();
    document.querySelector<HTMLButtonElement>('[aria-label="Canal B"]')!.click();
    await flush();

    expect(refresh).toHaveBeenCalledOnce();
    expect(document.querySelector("ytd-rich-item-renderer"))
      .not.toHaveAttribute("data-yte-channel-hidden");
  });
  it("preserva cards em falha de atualização, oferece retry e cancela ao desligar", async () => {
    const refresh = vi.fn().mockRejectedValueOnce(new Error("offline")).mockImplementation((_doc, signal: AbortSignal) => {
      expect(signal.aborted).toBe(false);
      return new Promise(() => {});
    });
    controller = createSubscriptionController(document, vi.fn().mockResolvedValue(catalog), vi.fn(), refresh);
    controller.preferences(DEFAULT_PREFERENCES); await flush();
    const card = document.querySelector("ytd-rich-item-renderer");
    channel().click(); await flush();
    expect(document.body.textContent).toContain("lista anterior foi mantida");
    expect(document.querySelector("ytd-rich-item-renderer")).toBe(card);
    document.querySelector<HTMLButtonElement>(".yte-channel-action")!.click();
    const signal = refresh.mock.calls[1]![1] as AbortSignal;
    controller.preferences({ ...DEFAULT_PREFERENCES, showSubscriptionChannels: false });
    expect(signal.aborted).toBe(true);
    expect(document.querySelector('[data-yte-channel-footer]')).toBeNull();
  });
  it("começa desativado até ler preferências e limita busca a cinco páginas", async () => {
    const load = vi.fn().mockResolvedValue(catalog);
    const next = vi.fn().mockResolvedValue([]);
    controller = createSubscriptionController(document, load, next);
    controller.scan(); expect(load).not.toHaveBeenCalled();
    controller.preferences(DEFAULT_PREFERENCES); await flush();
    expect(document.querySelectorAll("nav")).toHaveLength(1);
    channel().click(); await flush();
    expect(next).toHaveBeenCalledTimes(5);
    controller.scan(); await flush(); expect(next).toHaveBeenCalledTimes(5);
    expect(document.body.textContent).toContain("Nenhum vídeo deste canal encontrado até aqui");
    document.querySelector<HTMLButtonElement>(".yte-channel-action")!.click(); await flush();
    expect(next).toHaveBeenCalledTimes(10);
  });
  it("cancela a busca ao desligar e restaura os cards", async () => {
    let signal: AbortSignal | undefined;
    controller = createSubscriptionController(document, vi.fn().mockResolvedValue(catalog), (_grid, abort) => {
      signal = abort; return new Promise<HTMLElement[] | null>(() => {});
    });
    controller.preferences(DEFAULT_PREFERENCES); await flush(); channel().click(); await flush();
    controller.preferences({ ...DEFAULT_PREFERENCES, showSubscriptionChannels: false });
    expect(signal?.aborted).toBe(true);
    expect(document.querySelector("nav")).toBeNull();
    expect(document.querySelector("[data-yte-channel-hidden]")).toBeNull();
    controller.preferences(DEFAULT_PREFERENCES); await flush();
    expect(document.querySelector(".yte-channel-all")?.getAttribute("aria-pressed")).toBe("true");
  });
  it("lembra seleção no retorno, limpa ao mudar conta e não duplica a barra", async () => {
    const load = vi.fn().mockResolvedValue(catalog);
    controller = createSubscriptionController(document, load, vi.fn().mockResolvedValue(null));
    controller.preferences(DEFAULT_PREFERENCES); await flush(); channel().click(); await flush();
    controller.navigateStart(); window.history.replaceState({}, "", "/watch?v=fixture"); controller.navigateFinish();
    expect(document.querySelector("nav")).toBeNull();
    window.history.replaceState({}, "", "/feed/subscriptions"); controller.navigateFinish(); await flush();
    expect(channel().getAttribute("aria-pressed")).toBe("true");
    controller.scan(); controller.scan(); expect(document.querySelectorAll("nav")).toHaveLength(1);
    controller.navigateStart(); load.mockResolvedValue({ ...catalog, account: "account-B" });
    controller.navigateFinish(); await flush();
    expect(document.querySelector(".yte-channel-all")?.getAttribute("aria-pressed")).toBe("true");
  });
  it("não aplica resposta atrasada após saída e permite recuperar falhas", async () => {
    let resolve!: (value: SubscriptionCatalog) => void;
    const load = vi.fn().mockImplementationOnce(() => new Promise<SubscriptionCatalog>(r => { resolve = r; })).mockRejectedValueOnce(new Error("offline")).mockResolvedValue(catalog);
    controller = createSubscriptionController(document, load);
    controller.preferences(DEFAULT_PREFERENCES); controller.navigateStart();
    resolve(catalog); await flush(); expect(document.querySelector("nav")).toBeNull();
    controller.navigateFinish(); await flush();
    expect(document.body.textContent).toContain("Não foi possível carregar todas");
    expect(document.querySelector("[data-yte-channel-hidden]")).toBeNull();
    document.querySelector<HTMLButtonElement>(".yte-channel-action")!.click(); await flush();
    expect(channel()).not.toBeNull();
  });
  it("remonta quando o YouTube substitui o grid e filtra cards adicionados", async () => {
    controller = createSubscriptionController(document, vi.fn().mockResolvedValue(catalog), vi.fn().mockResolvedValue(null));
    controller.preferences(DEFAULT_PREFERENCES); await flush(); channel().click(); await flush();
    const grid = document.querySelector("ytd-rich-grid-renderer")!;
    const copy = grid.cloneNode(true); grid.replaceWith(copy); controller.scan(); await flush();
    expect(document.querySelectorAll("nav")).toHaveLength(1);
    expect(channel().getAttribute("aria-pressed")).toBe("true");
    const card = document.createElement("ytd-rich-item-renderer"); card.innerHTML = '<ytd-channel-name><a href="/@Beta">B</a></ytd-channel-name>';
    copy.appendChild(card); controller.scan();
    expect(card.hasAttribute("data-yte-channel-hidden")).toBe(true);
  });
});
