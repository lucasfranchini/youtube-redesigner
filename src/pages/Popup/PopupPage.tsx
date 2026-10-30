import { ColumnSetting } from "@/components/ColumnSetting/ColumnSetting";
import { Header } from "@/components/Header/Header";
import { SettingToggle } from "@/components/SettingToggle/SettingToggle";
import { StatusMessage } from "@/components/StatusMessage/StatusMessage";
import { usePreferences } from "@/hooks/usePreferences";

import styles from "./PopupPage.module.css";

export function PopupPage() {
  const { preferences, isLoading, status, updatePreferences } = usePreferences();

  return (
    <main className={styles.main}>
      <Header />

      <SettingToggle
        id="hide"
        label="Ocultar Shorts"
        description="Início, menu, busca, inscrições e canais."
        checked={preferences.hideShorts}
        disabled={isLoading}
        onChange={(hideShorts) => void updatePreferences({ hideShorts })}
      />

      <SettingToggle
        id="hide-relevant"
        label="Ocultar “Mais relevantes”"
        description="Remove essa seção das inscrições."
        checked={preferences.hideRelevant}
        disabled={isLoading}
        secondary
        onChange={(hideRelevant) => void updatePreferences({ hideRelevant })}
      />

      <ColumnSetting
        id="home-cols"
        label="Grade da página inicial"
        value={preferences.homeColumns}
        disabled={isLoading}
        onChange={(homeColumns) => void updatePreferences({ homeColumns })}
      />

      <ColumnSetting
        id="subscription-cols"
        label="Grade de inscrições"
        value={preferences.subscriptionColumns}
        disabled={isLoading}
        onChange={(subscriptionColumns) =>
          void updatePreferences({ subscriptionColumns })
        }
      />

      <SettingToggle
        id="subscription-channels"
        label="Mostrar canais nas inscrições"
        description="Filtre os vídeos por canal na barra de inscrições."
        checked={preferences.showSubscriptionChannels}
        disabled={isLoading}
        onChange={(showSubscriptionChannels) =>
          void updatePreferences({ showSubscriptionChannels })
        }
      />

      <StatusMessage message={status} />
    </main>
  );
}
