import { HOME_PATH, SUBSCRIPTIONS_PATH } from "@/constants/youtube";
import type { YouTubePage } from "@/types/youtube";

export function getYouTubePage(pathname: string): YouTubePage {
  if (pathname === HOME_PATH) return "home";

  return pathname === SUBSCRIPTIONS_PATH ? "subscriptions" : "other";
}
