import { YOUTUBE_DATASET_KEYS } from "@/constants/youtube";
import { getYouTubePage } from "@/utils/youtubeRoutes";

export function updatePageMarker(root: HTMLElement, pathname: string): void {
  root.dataset[YOUTUBE_DATASET_KEYS.page] = getYouTubePage(pathname);
}
