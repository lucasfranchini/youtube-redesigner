import { beforeEach, describe, expect, it } from "vitest";

import { findRelevantSections } from "@/youtube/relevant/findRelevantSections";
import { markRelevantSections } from "@/youtube/relevant/markRelevantSections";
import { findShortsTargets } from "@/youtube/shorts/findShortsTargets";
import { markShorts } from "@/youtube/shorts/markShorts";

describe("detecção do DOM do YouTube", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("marca cards, menu, prateleiras e aba de Shorts", () => {
    document.body.innerHTML = `
      <ytd-rich-item-renderer id="card"><a href="/shorts/card"></a></ytd-rich-item-renderer>
      <ytd-guide-entry-renderer id="menu"><a href="/shorts/menu"></a></ytd-guide-entry-renderer>
      <ytd-rich-section-renderer id="shorts-section">
        <ytd-reel-shelf-renderer id="shelf"></ytd-reel-shelf-renderer>
      </ytd-rich-section-renderer>
      <yt-tab-shape id="tab"><a href="/@canal/shorts"></a></yt-tab-shape>
    `;

    const targets = findShortsTargets(document, "https://www.youtube.com");
    expect(targets.map(({ reason }) => reason).sort()).toEqual([
      "card",
      "channel-tab",
      "menu",
      "shelf",
    ]);

    markShorts(document, "https://www.youtube.com");

    expect(document.querySelector("#card")).toHaveAttribute(
      "data-yte-shorts",
      "card",
    );
    expect(document.querySelector("#menu")).toHaveAttribute(
      "data-yte-shorts",
      "menu",
    );
    expect(document.querySelector("#shorts-section")).toHaveAttribute(
      "data-yte-shorts",
      "shelf",
    );
    expect(document.querySelector("#shelf")).not.toHaveAttribute(
      "data-yte-shorts",
    );
    expect(document.querySelector("#tab")).toHaveAttribute(
      "data-yte-shorts",
      "channel-tab",
    );
  });

  it("marca as versões expandida e compacta do menu Shorts", () => {
    document.body.innerHTML = `
      <ytd-guide-entry-renderer id="expanded-menu">
        <a href="https://www.youtube.com/shorts/"></a>
      </ytd-guide-entry-renderer>
      <ytd-mini-guide-entry-renderer
        id="compact-menu"
        aria-label="Shorts"
      ></ytd-mini-guide-entry-renderer>
    `;

    markShorts(document, "https://www.youtube.com");

    expect(document.querySelector("#expanded-menu")).toHaveAttribute(
      "data-yte-shorts",
      "menu",
    );
    expect(document.querySelector("#compact-menu")).toHaveAttribute(
      "data-yte-shorts",
      "menu",
    );
  });

  it("reconhece o menu ancestral quando apenas uma subárvore é processada", () => {
    document.body.innerHTML = `
      <ytd-guide-entry-renderer id="menu">
        <a href="/shorts/"><span id="added-label">Shorts</span></a>
      </ytd-guide-entry-renderer>
    `;
    const addedLabel = document.querySelector("#added-label");

    if (!addedLabel) throw new Error("Fixture inválida");
    markShorts(addedLabel, "https://www.youtube.com");

    expect(document.querySelector("#menu")).toHaveAttribute(
      "data-yte-shorts",
      "menu",
    );
  });

  it("marca uma seção relevante a partir de uma subárvore adicionada", () => {
    document.body.innerHTML = `
      <ytd-rich-section-renderer id="section">
        <h2 id="new-title">Mais relevantes</h2>
      </ytd-rich-section-renderer>
    `;
    const addedTitle = document.querySelector("#new-title");

    if (!addedTitle) throw new Error("Fixture inválida");
    expect(findRelevantSections(addedTitle, "/feed/subscriptions")).toEqual([
      document.querySelector("#section"),
    ]);
    markRelevantSections(addedTitle, "/feed/subscriptions");

    expect(document.querySelector("#section")).toHaveAttribute(
      "data-yte-relevant",
      "true",
    );
  });

  it("não marca a seção relevante fora das inscrições", () => {
    document.body.innerHTML = `
      <ytd-rich-section-renderer id="section">
        <h2>Mais relevantes</h2>
      </ytd-rich-section-renderer>
    `;

    markRelevantSections(document, "/");

    expect(document.querySelector("#section")).not.toHaveAttribute(
      "data-yte-relevant",
    );
  });

  it("não trata uma prateleira comum como Shorts", () => {
    document.body.innerHTML = `
      <ytd-rich-section-renderer id="section">
        <ytd-rich-shelf-renderer>
          <h2>Vídeos recentes</h2>
          <a href="/watch?v=normal">Vídeo normal</a>
        </ytd-rich-shelf-renderer>
      </ytd-rich-section-renderer>
    `;

    markShorts(document, "https://www.youtube.com");
    expect(document.querySelector("[data-yte-shorts]")).toBeNull();
  });

  it("remove a marca quando o YouTube recicla um card de Shorts", () => {
    document.body.innerHTML = `
      <ytd-rich-item-renderer id="card">
        <a id="video" href="/shorts/old">Vídeo</a>
      </ytd-rich-item-renderer>
    `;
    markShorts(document, "https://www.youtube.com");
    expect(document.querySelector("#card")).toHaveAttribute("data-yte-shorts");

    const link = document.querySelector<HTMLAnchorElement>("#video")!;
    link.setAttribute("href", "/watch?v=new");
    markShorts(link, "https://www.youtube.com");
    expect(document.querySelector("#card")).not.toHaveAttribute("data-yte-shorts");
  });
});
