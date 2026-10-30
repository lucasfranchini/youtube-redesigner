import { CHANNEL_SHORTS_PATH } from "@/constants/youtube";

export function getPathname(href: string, origin: string): string {
  try {
    return new URL(href, origin).pathname;
  } catch {
    return "";
  }
}

export function isShortsPath(pathname: string): boolean {
  return pathname.startsWith("/shorts/");
}

export function isChannelShortsPath(pathname: string): boolean {
  return CHANNEL_SHORTS_PATH.test(pathname);
}
