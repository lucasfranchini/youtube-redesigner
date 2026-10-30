import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  manifestVersion: 3,
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "YouTube Redesigner",
    description:
      "Personaliza o YouTube ocultando Shorts e seções irrelevantes e ajustando a grade de vídeos.",
    permissions: ["storage"],
    action: {
      default_title: "YouTube Redesigner",
    },
  },
});
