export const YOUTUBE_SELECTORS = {
  cards:
    "ytd-rich-item-renderer,ytd-video-renderer,ytd-grid-video-renderer,ytd-compact-video-renderer,ytd-reel-item-renderer,yt-lockup-view-model",
  shortsShelves:
    "ytd-reel-shelf-renderer,ytd-rich-shelf-renderer,grid-shelf-view-model",
  nativeShortsShelves: "ytd-reel-shelf-renderer",
  shortsSection: "ytd-rich-section-renderer",
  relevantSections:
    "ytd-rich-section-renderer,ytd-rich-shelf-renderer,ytd-shelf-renderer,grid-shelf-view-model",
  channelShortsLinks:
    "yt-tab-shape a,tp-yt-paper-tab a,ytd-browse[page-subtype='channels'] a",
  menus: "ytd-guide-entry-renderer,ytd-mini-guide-entry-renderer",
  relevantTitles: "#title,h2,yt-formatted-string",
  markedShorts: "[data-yte-shorts]",
  markedRelevant: "[data-yte-relevant]",
} as const;

export const YOUTUBE_DATASET_KEYS = {
  hideShorts: "yteHideShorts",
  hideRelevant: "yteHideRelevant",
  page: "ytePage",
  relevant: "yteRelevant",
  shorts: "yteShorts",
} as const;

export const RELEVANT_TITLES: ReadonlySet<string> = new Set([
  "mais relevantes",
  "most relevant",
]);

export const SHORTS_MENU_LABELS: ReadonlySet<string> = new Set([
  "shorts",
  "youtube shorts",
]);

export const SUBSCRIPTIONS_PATH = "/feed/subscriptions";
export const HOME_PATH = "/";

export const CHANNEL_SHORTS_PATH =
  /^\/(?:@[^/]+|channel\/[^/]+|c\/[^/]+|user\/[^/]+)\/shorts\/?$/;
