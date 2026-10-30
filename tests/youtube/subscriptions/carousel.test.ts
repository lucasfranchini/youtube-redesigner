import { afterEach, describe, expect, it, vi } from "vitest";
import { createSubscriptionCarousel } from "@/youtube/subscriptions/view/createCarousel";
import { parseChannelPage } from "@/utils/subscriptionChannels";
import { channelRenderer } from "../../fixtures/subscriptionChannels";

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

describe("carrossel de canais", () => {
  it("mostra carga e erro do catálogo na barra e paginação depois da grade", () => {
    const ui = createSubscriptionCarousel(document, vi.fn(), vi.fn());
    const grid = document.createElement("ytd-rich-grid-renderer");
    document.body.append(ui.element, grid, ui.footer);
    ui.status("Carregando inscrições", undefined, true, "header");
    expect(ui.element.contains(ui.footer)).toBe(true);
    ui.status("Falha", "Tentar novamente", false, "header");
    expect(ui.element.textContent).toContain("Tentar novamente");
    ui.status("Buscando vídeos", undefined, true);
    expect(grid.nextElementSibling).toBe(ui.footer);
    ui.destroy();
    expect(document.querySelector('[data-yte-channel-footer]')).toBeNull();
  });
  it("controla setas nos limites e avança mantendo sobreposição", () => {
    const ui = createSubscriptionCarousel(document, vi.fn(), vi.fn());
    document.body.append(ui.element, ui.footer);
    const rail = ui.element.querySelector<HTMLElement>(".yte-channel-viewport")!;
    const previous = ui.element.querySelector<HTMLButtonElement>(".yte-channel-previous")!;
    const next = ui.element.querySelector<HTMLButtonElement>(".yte-channel-next")!;
    let width = 1000;
    Object.defineProperties(rail, { clientWidth: { value: 400 }, scrollWidth: { get: () => width } });
    rail.scrollBy = vi.fn();
    ui.setChannels(parseChannelPage([channelRenderer()]).channels);
    expect(previous.hidden).toBe(true); expect(next.hidden).toBe(false);
    next.click(); expect(rail.scrollBy).toHaveBeenCalledWith({ left: 312, behavior: "smooth" });
    rail.scrollLeft = 300; rail.dispatchEvent(new Event("scroll"));
    expect(previous.hidden).toBe(false); expect(next.hidden).toBe(false);
    rail.scrollLeft = 600; rail.dispatchEvent(new Event("scroll"));
    expect(next.hidden).toBe(true);
    rail.scrollLeft = 0; width = 350; window.dispatchEvent(new Event("resize"));
    expect(previous.hidden).toBe(true); expect(next.hidden).toBe(true);
    ui.destroy();
  });
  it("seleciona por ID, oferece Todos e usa fallback de avatar", () => {
    const select = vi.fn(); const action = vi.fn();
    const ui = createSubscriptionCarousel(document, select, action);
    document.body.append(ui.element, ui.footer);
    ui.setChannels(parseChannelPage([channelRenderer()]).channels);
    ui.element.querySelector<HTMLButtonElement>(".yte-channel-item")!.click();
    expect(select).toHaveBeenCalledWith("UCfixtureA");
    ui.select("UCfixtureA");
    expect(ui.element.querySelector(".yte-channel-item")?.getAttribute("aria-pressed")).toBe("true");
    const img = ui.element.querySelector("img")!; img.dispatchEvent(new Event("error"));
    expect(ui.element.querySelector("img")).toBeNull();
    expect(ui.element.querySelector(".yte-channel-avatar")?.textContent).toBe("C");
    ui.element.querySelector<HTMLButtonElement>(".yte-channel-all")!.click();
    expect(select).toHaveBeenLastCalledWith(null);
    ui.status("Falha", "Tentar novamente");
    ui.footer.querySelector<HTMLButtonElement>(".yte-channel-action")!.click();
    expect(action).toHaveBeenCalledOnce();
    ui.destroy(); expect(document.querySelector("nav")).toBeNull();
  });
  it("traz o foco para a faixa e respeita movimento reduzido", () => {
    Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => ({ matches: true })) });
    const ui = createSubscriptionCarousel(document, vi.fn(), vi.fn());
    document.body.append(ui.element, ui.footer); ui.setChannels(parseChannelPage([channelRenderer()]).channels);
    const rail = ui.element.querySelector<HTMLElement>(".yte-channel-viewport")!;
    const item = ui.element.querySelector<HTMLButtonElement>(".yte-channel-item")!;
    rail.scrollBy = vi.fn();
    vi.spyOn(rail, "getBoundingClientRect").mockReturnValue({ left: 100, right: 500 } as DOMRect);
    vi.spyOn(item, "getBoundingClientRect").mockReturnValue({ left: 550, right: 630 } as DOMRect);
    item.focus();
    expect(rail.scrollBy).toHaveBeenCalledWith({ left: 166, behavior: "instant" });
    ui.destroy();
    Reflect.deleteProperty(window, "matchMedia");
  });
});
