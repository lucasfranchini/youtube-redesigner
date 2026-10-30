import { describe, expect, it } from "vitest";

import { normalizeTitle } from "@/utils/text";
import { getYouTubePage } from "@/utils/youtubeRoutes";
import {
  getPathname,
  isChannelShortsPath,
  isShortsPath,
} from "@/utils/youtubeUrls";

describe("utilitários do YouTube", () => {
  it("reconhece URLs e rotas suportadas", () => {
    expect(getPathname("/shorts/abc", "https://www.youtube.com")).toBe(
      "/shorts/abc",
    );
    expect(isShortsPath("/shorts/abc")).toBe(true);
    expect(isChannelShortsPath("/@canal/shorts")).toBe(true);
    expect(getYouTubePage("/")).toBe("home");
    expect(getYouTubePage("/feed/subscriptions")).toBe("subscriptions");
    expect(getYouTubePage("/results")).toBe("other");
  });

  it("normaliza títulos localizados", () => {
    expect(normalizeTitle("  MAIS   RELEVANTES ")).toBe("mais relevantes");
    expect(normalizeTitle(" Most Relevant ")).toBe("most relevant");
  });
});
