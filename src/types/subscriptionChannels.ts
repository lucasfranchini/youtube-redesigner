export interface SubscriptionChannel {
  id: string;
  name: string;
  paths: string[];
  avatar: string | null;
}

export interface SubscriptionChannelPage {
  channels: SubscriptionChannel[];
  continuation: string | null;
}

export interface SubscriptionCatalog {
  channels: SubscriptionChannel[];
  account: string;
  guideIds?: string[];
}

export interface SubscriptionCarousel {
  element: HTMLElement;
  footer: HTMLElement;
  setChannels: (channels: SubscriptionChannel[]) => void;
  select: (id: string | null) => void;
  newness: (ids: Set<string>) => void;
  status: (message: string, action?: string, loading?: boolean, placement?: "header" | "footer") => void;
  destroy: () => void;
}

export interface NativeSubscriptionGrid extends HTMLElement {
  data: Record<string, unknown>;
}
