export type YouTubePage = "home" | "subscriptions" | "other";

export interface ShortsTarget {
  element: HTMLElement;
  reason: "card" | "channel-tab" | "menu" | "shelf";
}
