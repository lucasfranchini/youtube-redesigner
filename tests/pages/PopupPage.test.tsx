import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

import { PopupPage } from "@/pages/Popup/PopupPage";
import { PREFERENCE_ITEMS } from "@/storage/preferenceItems";

describe("popup", () => {
  it("inicia a barra ligada e permite desligar pelo popup", async () => {
    const user = userEvent.setup();
    render(<PopupPage />);
    const toggle = screen.getByLabelText("Mostrar canais nas inscrições");
    await waitFor(() => expect(toggle).toBeEnabled());
    expect(toggle).toBeChecked();
    await user.click(toggle);
    await waitFor(async () => expect(await fakeBrowser.storage.local.get("showSubscriptionChannels")).toMatchObject({ showSubscriptionChannels: false }));
  });
  beforeEach(() => {
    fakeBrowser.reset();
  });
  afterEach(() => vi.restoreAllMocks());

  it("carrega as preferências existentes", async () => {
    await fakeBrowser.storage.local.set({
      hideShorts: false,
      hideRelevant: true,
      homeColumns: 3,
      subscriptionColumns: 5,
    });

    render(<PopupPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Ocultar Shorts")).not.toBeChecked();
      expect(screen.getByLabelText("Ocultar “Mais relevantes”")).toBeChecked();
      expect(screen.getByLabelText("Grade da página inicial")).toHaveValue(
        "3",
      );
      expect(screen.getByLabelText("Grade de inscrições")).toHaveValue("5");
      expect(screen.getByLabelText("Ocultar Shorts")).toBeEnabled();
    });
  });

  it("salva um toggle e exibe a confirmação", async () => {
    const user = userEvent.setup();
    render(<PopupPage />);
    const toggle = await screen.findByLabelText("Ocultar Shorts");
    await waitFor(() => expect(toggle).toBeEnabled());

    await user.click(toggle);

    await waitFor(async () => {
      expect(await fakeBrowser.storage.local.get("hideShorts")).toMatchObject({
        hideShorts: false,
      });
    });
    expect(screen.getByText("Preferência salva")).toBeInTheDocument();
  });

  it("restaura o valor anterior quando a gravação falha", async () => {
    vi.spyOn(PREFERENCE_ITEMS.hideShorts, "setValue")
      .mockRejectedValueOnce(new Error("storage indisponível"));
    const user = userEvent.setup();
    render(<PopupPage />);
    const toggle = screen.getByLabelText("Ocultar Shorts");
    await waitFor(() => expect(toggle).toBeEnabled());

    await user.click(toggle);
    await screen.findByText("Não foi possível salvar a preferência");
    expect(toggle).toBeChecked();
  });

  it("atualiza e salva as duas grades de forma independente", async () => {
    render(<PopupPage />);
    const homeRange = await screen.findByLabelText("Grade da página inicial");
    const subscriptionRange = screen.getByLabelText("Grade de inscrições");
    await waitFor(() => expect(homeRange).toBeEnabled());

    fireEvent.input(homeRange, { target: { value: "5" } });
    expect(homeRange).toHaveValue("5");
    expect(subscriptionRange).toHaveValue("4");
    fireEvent.pointerUp(homeRange);

    await waitFor(async () => {
      expect(await fakeBrowser.storage.local.get("homeColumns")).toMatchObject({
        homeColumns: 5,
      });
    });

    fireEvent.input(subscriptionRange, { target: { value: "6" } });
    expect(subscriptionRange).toHaveValue("6");
    fireEvent.pointerUp(subscriptionRange);

    await waitFor(async () => {
      expect(
        await fakeBrowser.storage.local.get("subscriptionColumns"),
      ).toMatchObject({ subscriptionColumns: 6 });
    });
  });
});
