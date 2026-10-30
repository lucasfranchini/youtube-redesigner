import type { Preferences } from "@/types/preferences";

import { getPreferences } from "./getPreferences";
import { PREFERENCE_ITEMS } from "./preferenceItems";

export function watchPreferences(
  listener: (preferences: Preferences) => void,
): () => void {
  let updateQueued = false;

  const emitLatestPreferences = () => {
    if (updateQueued) return;
    updateQueued = true;
    queueMicrotask(() => {
      updateQueued = false;
      void getPreferences().then(listener).catch(() => {
        console.warn(
          "[YouTube Redesigner] Não foi possível atualizar as preferências; mantendo os valores atuais.",
        );
      });
    });
  };

  const unwatchers = Object.values(PREFERENCE_ITEMS).map((item) =>
    item.watch(emitLatestPreferences),
  );

  return () => unwatchers.forEach((unwatch) => unwatch());
}
