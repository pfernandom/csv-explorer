import { ReactNode, useEffect, useState } from "react";
import setupFileDrop from "../context/fileDrop";

import { createContext } from "react";
import { open } from "@tauri-apps/api/dialog";
import {
  getOpenedPathFromConfig,
  saveOpenedPathToConfig,
} from "../config/utils";

export interface AppDataContext {
  openedDir?: string;
  openedFile?: string;
  openDialog: () => Promise<void>;
  openFile: (fileName: string) => void;
}

const defaultContext: AppDataContext = {
  openDialog: function (): Promise<void> {
    throw new Error("Function not implemented.");
  },
  openFile: function (_fileName: string): void {
    throw new Error("Function not implemented.");
  },
};

export const AppContext = createContext<AppDataContext>(defaultContext);

async function openDirectory() {
  const selected = await open({
    multiple: false,
    recursive: true,
    directory: true,
  });

  if (!selected) {
    return undefined;
  }

  let selectedPath = Array.isArray(selected) ? selected[0] : selected;
  saveOpenedPathToConfig(selectedPath);
  return selectedPath;
}

export default function AppContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [openedDir, setOpenedDir] = useState<string | undefined>();
  const [openedFile, setOpenedFile] = useState<string | undefined>();
  const initialContext: AppDataContext = {
    openedDir,
    openedFile,
    openDialog: async function () {
      const maybePath = await openDirectory();
      setOpenedDir(maybePath);
    },
    openFile: function (fileName: string): void {
      setOpenedFile(fileName);
    },
  };

  setupFileDrop((event) => {
    if (event.payload.type === "hover") {
      console.log("User hovering", event.payload.paths);
    } else if (event.payload.type === "drop") {
      console.log("User dropped", event.payload.paths);
      const maybeFirstPath = event.payload.paths[0];
      if (maybeFirstPath) {
        setOpenedFile(maybeFirstPath);
      }
    } else {
      console.log("File drop cancelled");
    }
  });

  useEffect(() => {
    getOpenedPathFromConfig().then((maybePath) => {
      setOpenedDir(maybePath);
    });
  }, []);
  return (
    <AppContext.Provider value={initialContext}>{children}</AppContext.Provider>
  );
}
