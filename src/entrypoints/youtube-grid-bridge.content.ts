import { installBridges } from "@/youtube/bridge/installBridges";

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  runAt: "document_idle",
  world: "MAIN",
  main() {
    installBridges(document);
  },
});
