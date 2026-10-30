export const CHANNELS_URL = "https://www.youtube.com/feed/channels";
export const BROWSE_URL = "https://www.youtube.com/youtubei/v1/browse";
export const GUIDE_URL = "https://www.youtube.com/youtubei/v1/guide";
export const CHANNEL_BRIDGE_DISPOSE = "yte-subscription-bridge-dispose";
export const CHANNEL_SELECTORS = {
  browse: 'ytd-browse[page-subtype="subscriptions"]',
  grid: "ytd-rich-grid-renderer",
  cards: "ytd-rich-item-renderer,ytd-grid-video-renderer,ytd-video-renderer",
  media: "ytd-rich-grid-media,ytd-video-renderer,ytd-grid-video-renderer",
  videoLink: 'a[href*="/watch?"]',
  ownerLinks: [
    "ytd-channel-name a[href]",
    "#channel-name a[href]",
    "#byline-container a[href]",
    "yt-content-metadata-view-model a[href]",
  ].join(","),
  ownerModels: [
    "ytd-channel-name",
    "#channel-name",
    "#byline-container",
    "yt-content-metadata-view-model",
  ].join(","),
  collaborationAvatars: 'yt-avatar-stack-view-model[role="button"] img[src]',
  groups: "ytd-rich-section-renderer,ytd-item-section-renderer",
  continuation: "ytd-continuation-item-renderer",
  header: '[data-yte-channel-header]',
  owned: '[data-yte-channel-header], [data-yte-channel-footer]',
  guide: "ytd-guide-renderer",
  guideSection: "ytd-guide-section-renderer, ytd-guide-subscriptions-section-renderer",
  guideEntry: "ytd-guide-entry-renderer",
  guideLink: "ytd-guide-entry-renderer a[href]",
  guideSubscriptions: 'ytd-guide-entry-renderer a[href="/feed/subscriptions"]',
  marked: '[data-yte-channel-hidden]',
  avatar: 'ytd-masthead #avatar-btn img',
} as const;
export const CHANNEL_DATA = {
  header: "yteChannelHeader",
  footer: "yteChannelFooter",
  hidden: "yteChannelHidden",
  filter: "yteChannelFilter",
  loading: "yteChannelLoading",
} as const;
export const CHANNEL_PAGE_LIMIT = 5;
export const CHANNEL_REQUEST_TIMEOUT = 15000;
export const CHANNEL_REFRESH_EVENT = "yte-refresh-subscription-grid";
export const CHANNEL_REFRESH_RESULT = "yte-refresh-subscription-grid-result";
export const CHANNEL_OWNERS_EVENT = "yte-read-subscription-owners";
export const CHANNEL_OWNERS_ATTRIBUTE = "data-yte-video-owners";
export const CHANNEL_NEWNESS_TTL = 30 * 60 * 1000;

export const CHANNEL_NEWNESS_ATTRIBUTES = { fresh: "data-yte-channel-new", seen: "data-yte-newness-seen" } as const;
