import { useEffect, useState } from "react";
import { Store } from "tauri-plugin-store-api";

export const store = new Store(".settings.dat");
export async function getOpenedPathFromConfig(): Promise<string | undefined> {
  const value = await store.get("openedDir").catch((err) => {
    console.error(err);
    return undefined;
  });
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

export async function saveOpenedPathToConfig(selectedPath: string) {
  try {
    await store.set("openedDir", selectedPath);
  } catch (err) {
    console.error("Could not store preferences", err);
  }
}

export function withStorage<T>(
  storeName: string,
  propName: string,
): [T | undefined, (data: T) => void] {
  const [state, setState] = useState<T | undefined>();

  const store = new Store(storeName);

  useEffect(() => {
    store.get(propName).then((data) => setState(data as T));
  }, [storeName, propName]);

  return [
    state,
    (value: T) => {
      store.set(propName, value).then(() => setState(value));
    },
  ];
}
