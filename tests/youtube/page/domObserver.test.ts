import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { observeDom } from "@/youtube/page/observeDom";

describe("observador incremental", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("faz uma varredura completa ao iniciar", () => {
    const scan = vi.fn();
    const scanner = observeDom({ document, scan });

    scanner.start();
    vi.advanceTimersByTime(80);

    expect(scan).toHaveBeenCalledOnce();
    expect(scan).toHaveBeenCalledWith(document);
    scanner.disconnect();
  });

  it("processa somente a subárvore adicionada depois da inicialização", async () => {
    const scan = vi.fn();
    const scanner = observeDom({ document, scan });
    scanner.start();
    vi.advanceTimersByTime(80);
    scan.mockClear();

    const addedSection = document.createElement("section");
    document.body.append(addedSection);
    await Promise.resolve();
    vi.advanceTimersByTime(80);

    expect(scan).toHaveBeenCalledOnce();
    expect(scan).toHaveBeenCalledWith(addedSection);
    scanner.disconnect();
  });

  it("elimina raízes descendentes redundantes da mesma fila", () => {
    const scan = vi.fn();
    const scanner = observeDom({ document, scan });
    const parent = document.createElement("section");
    const child = document.createElement("div");
    parent.append(child);

    scanner.schedule(child);
    scanner.schedule(parent);
    vi.advanceTimersByTime(80);

    expect(scan).toHaveBeenCalledOnce();
    expect(scan).toHaveBeenCalledWith(parent);
    scanner.disconnect();
  });
});
