import { CHANNEL_DATA, CHANNEL_NEWNESS_ATTRIBUTES } from "@/constants/subscriptionChannels";
import type { SubscriptionCarousel, SubscriptionChannel } from "@/types/subscriptionChannels";

export function createSubscriptionCarousel(
  doc: Document,
  onSelect: (id: string | null) => void,
  onAction: () => void,
): SubscriptionCarousel {
  const element = doc.createElement("nav");
  element.dataset[CHANNEL_DATA.header] = "";
  element.setAttribute("aria-label", "Filtrar inscrições por canal");
  const row = doc.createElement("div");
  row.className = "yte-channel-row";
  const button = (label: string, className: string, action: () => void) => {
    const result = doc.createElement("button");
    result.type = "button";
    result.className = className;
    result.textContent = label;
    result.addEventListener("click", action);
    return result;
  };
  const all = button("Todos", "yte-channel-all", () => onSelect(null));
  all.setAttribute("aria-pressed", "true");
  const rail = doc.createElement("div");
  rail.className = "yte-channel-rail";
  const viewport = doc.createElement("div");
  viewport.className = "yte-channel-viewport";
  const reduced = () => doc.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const scroll = (left: number) => viewport.scrollBy({ left, behavior: reduced() ? "instant" : "smooth" });
  const step = () => Math.max(88, viewport.clientWidth - 88);
  const previous = button("‹", "yte-channel-arrow yte-channel-previous", () => scroll(-step()));
  const next = button("›", "yte-channel-arrow yte-channel-next", () => scroll(step()));
  previous.setAttribute("aria-label", "Canais anteriores");
  next.setAttribute("aria-label", "Próximos canais");
  const updateArrows = () => {
    const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    previous.hidden = viewport.scrollLeft <= 1;
    next.hidden = viewport.scrollLeft >= max - 1;
  };
  previous.hidden = true;
  next.hidden = true;
  viewport.addEventListener("scroll", updateArrows, { passive: true });
  viewport.addEventListener("focusin", event => {
    if (!(event.target instanceof HTMLElement)) return;
    const target = event.target.getBoundingClientRect();
    const bounds = viewport.getBoundingClientRect();
    if (target.left < bounds.left + 36) scroll(target.left - bounds.left - 36);
    else if (target.right > bounds.right - 36) scroll(target.right - bounds.right + 36);
  });
  const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateArrows);
  resize?.observe(viewport);
  doc.defaultView?.addEventListener("resize", updateArrows);
  rail.append(viewport, previous, next);
  row.append(all, rail);
  const statusRow = doc.createElement("div");
  statusRow.dataset[CHANNEL_DATA.footer] = "";
  statusRow.className = "yte-channel-status";
  statusRow.hidden = true;
  const spinner = doc.createElement("span");
  spinner.className = "yte-channel-spinner";
  spinner.setAttribute("aria-hidden", "true");
  spinner.hidden = true;
  const message = doc.createElement("span");
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");
  const action = button("", "yte-channel-action", onAction);
  action.hidden = true;
  statusRow.append(spinner, message, action);
  element.append(row);
  const buttons = new Map<string, HTMLButtonElement>();
  return {
    element,
    footer: statusRow,
    setChannels(channels: SubscriptionChannel[]) {
      buttons.clear();
      const fragment = doc.createDocumentFragment();
      channels.forEach(channel => {
        const item = button("", "yte-channel-item", () => onSelect(channel.id));
        item.setAttribute("aria-label", channel.name);
        item.setAttribute("aria-pressed", "false");
        item.title = channel.name;
        const avatar = doc.createElement("span");
        avatar.className = "yte-channel-avatar";
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = channel.name.slice(0, 1).toUpperCase();
        if (channel.avatar) {
          const img = doc.createElement("img");
          img.alt = "";
          img.width = img.height = 56;
          img.loading = "lazy";
          img.src = channel.avatar;
          img.addEventListener("error", () => img.remove(), { once: true });
          avatar.append(img);
        }
        const label = doc.createElement("span");
        label.className = "yte-channel-name";
        label.textContent = channel.name;
        item.append(avatar, label);
        buttons.set(channel.id, item);
        fragment.append(item);
      });
      viewport.replaceChildren(fragment);
      updateArrows();
    },
    select(id) {
      all.setAttribute("aria-pressed", String(id === null));
      buttons.forEach((item, key) => item.setAttribute("aria-pressed", String(key === id)));
    },
    newness(ids) {
      buttons.forEach((item, id) => {
        const fresh = ids.has(id);
        if (item.hasAttribute(CHANNEL_NEWNESS_ATTRIBUTES.fresh) !== fresh) item.toggleAttribute(CHANNEL_NEWNESS_ATTRIBUTES.fresh, fresh);
        const description = fresh ? "Novo conteúdo disponível" : "";
        if (item.getAttribute("aria-description") !== description) item.setAttribute("aria-description", description);
      });
    },
    status(text, label, loading = false, placement = "footer") {
      if (placement === "header") {
        if (statusRow.parentElement !== element) element.append(statusRow);
      } else if (statusRow.parentElement === element) {
        element.nextElementSibling?.after(statusRow);
      }
      if (message.textContent !== text) message.textContent = text;
      if (action.textContent !== (label ?? "")) action.textContent = label ?? "";
      action.hidden = !label;
      statusRow.hidden = !text && !label;
      spinner.hidden = !loading;
    },
    destroy() {
      resize?.disconnect();
      doc.defaultView?.removeEventListener("resize", updateArrows);
      element.remove();
      statusRow.remove();
    },
  };
}
