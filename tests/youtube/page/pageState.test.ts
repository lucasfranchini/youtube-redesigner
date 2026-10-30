import { describe, expect, it } from "vitest";

import { applyPreferencesToPage } from "@/youtube/page/applyPreferences";

describe("estado da página do YouTube", () => {
  it("aplica as duas grades e identifica a página inicial", () => {
    const root = document.createElement("html");

    applyPreferencesToPage(root, "/", {
      homeColumns: 3,
      subscriptionColumns: 6,
    });

    expect(root.dataset.ytePage).toBe("home");
    expect(root.style.getPropertyValue("--yte-home-cols")).toBe("3");
    expect(root.style.getPropertyValue("--yte-cols")).toBe("6");
  });

  it("mantém as variáveis e identifica a página de inscrições", () => {
    const root = document.createElement("html");

    applyPreferencesToPage(root, "/feed/subscriptions", {
      homeColumns: 5,
      subscriptionColumns: 4,
    });

    expect(root.dataset.ytePage).toBe("subscriptions");
    expect(root.style.getPropertyValue("--yte-home-cols")).toBe("5");
    expect(root.style.getPropertyValue("--yte-cols")).toBe("4");
  });
});
