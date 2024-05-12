import { useContext, useEffect } from "react";
import {
  register,
  unregisterAll,
  isRegistered,
} from "@tauri-apps/api/globalShortcut";
import { AppContext } from "./AppContextProvider";

const Shortcuts = {
  OPEN: "CmdOrControl+O",
};

export function setupShortcutsHook() {
  const appContext = useContext(AppContext);

  useEffect(() => {
    async function setup() {
      const exists = await isRegistered(Shortcuts.OPEN);
      if (!exists) {
        await register(Shortcuts.OPEN, () => {
          appContext.openDialog();
        });
      }
    }

    async function tearDown() {
      await unregisterAll();
    }

    setup();
    return () => {
      tearDown();
    };
  }, []);
}
