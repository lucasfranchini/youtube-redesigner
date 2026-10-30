import { useCallback, useEffect, useRef, useState } from "react";

import { DEFAULT_PREFERENCES } from "@/constants/preferences";
import {
  getPreferences,
} from "@/storage/getPreferences";
import { setPreferences } from "@/storage/setPreferences";
import { watchPreferences } from "@/storage/watchPreferences";
import type { Preferences } from "@/types/preferences";
import { normalizePreferences } from "@/utils/preferences";

const STATUS_DURATION_MS = 1_200;

interface UsePreferencesResult {
  preferences: Preferences;
  isLoading: boolean;
  status: string;
  updatePreferences: (patch: Partial<Preferences>) => Promise<void>;
}

export function usePreferences(): UsePreferencesResult {
  const [preferences, setLocalPreferences] = useState<Preferences>({
    ...DEFAULT_PREFERENCES,
  });
  const preferencesRef = useRef<Preferences>({ ...DEFAULT_PREFERENCES });
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("");
  const statusTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let active = true;

    void getPreferences().then((storedPreferences) => {
      if (active) {
        preferencesRef.current = storedPreferences;
        setLocalPreferences(storedPreferences);
        setIsLoading(false);
      }
    }).catch(() => {
      if (active) {
        setIsLoading(false);
        setStatus("Não foi possível carregar as preferências");
      }
    });

    const unwatch = watchPreferences((storedPreferences) => {
      if (active) {
        preferencesRef.current = storedPreferences;
        setLocalPreferences(storedPreferences);
      }
    });

    return () => {
      active = false;
      unwatch();
      window.clearTimeout(statusTimer.current);
    };
  }, []);

  const updatePreferences = useCallback(
    async (patch: Partial<Preferences>) => {
      const previous = preferencesRef.current;
      const next = normalizePreferences({ ...previous, ...patch });
      preferencesRef.current = next;
      setLocalPreferences(next);
      try {
        await setPreferences(patch);
        setStatus("Preferência salva");
      } catch {
        preferencesRef.current = previous;
        setLocalPreferences(previous);
        setStatus("Não foi possível salvar a preferência");
      }
      window.clearTimeout(statusTimer.current);
      statusTimer.current = window.setTimeout(
        () => setStatus(""),
        STATUS_DURATION_MS,
      );
    },
    [],
  );

  return { preferences, isLoading, status, updatePreferences };
}
