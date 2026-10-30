import { CHANNEL_BRIDGE_DISPOSE } from "@/constants/subscriptionChannels";

import { installCardOwnerBridge } from "./installCardOwnerBridge";
import { installGridRefreshBridge } from "./installGridRefreshBridge";

export function installBridges(doc: Document): () => void {
  doc.dispatchEvent(new Event(CHANNEL_BRIDGE_DISPOSE));
  const cleanups = [
    installGridRefreshBridge(doc),
    installCardOwnerBridge(doc),
  ];
  let disposed = false;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cleanups.forEach((cleanup) => cleanup());
    doc.removeEventListener(CHANNEL_BRIDGE_DISPOSE, dispose);
  };
  doc.addEventListener(CHANNEL_BRIDGE_DISPOSE, dispose);
  return dispose;
}
