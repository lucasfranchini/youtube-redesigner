import { createRoot } from "react-dom/client";

import { PopupPage } from "@/pages/Popup/PopupPage";
import "@/styles/global.css";

const root = document.querySelector<HTMLDivElement>("#root");

if (!root) {
  throw new Error("Não foi possível inicializar o popup da extensão.");
}

createRoot(root).render(<PopupPage />);
