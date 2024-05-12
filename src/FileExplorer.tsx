import { useContext, useEffect, useState } from "react";
import { FileEntry, readDir } from "@tauri-apps/api/fs";
import { AppContext } from "./context/AppContextProvider";
import "./css/FileExplorer.css";

function filterFileEntries(entries: FileEntry[], textFilter: string) {
  if (textFilter.length === 0) {
    return entries;
  }
  return entries.filter((entry) =>
    entry.name?.toLowerCase().includes(textFilter.toLowerCase()),
  );
}

const FileExplorer = () => {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [textFilter, setTextFilter] = useState<string>("");
  const [openingDialog, setOpeningDialog] = useState(false);
  const [isRefreshed, setRefresh] = useState(false);

  const appContext = useContext(AppContext);

  useEffect(() => {
    async function setFiles() {
      if (!appContext.openedDir) {
        return;
      }
      try {
        const dirEntries = await readDir(appContext.openedDir, {
          recursive: true,
        });
        const newEntries: FileEntry[] = dirEntries
          .filter((f: FileEntry | undefined): f is FileEntry => !!f)
          .filter(
            (f) =>
              /\.(c|t)sv$/g.test(f.name ?? "") || (f.children?.length ?? 0) > 0,
          );
        newEntries.sort((a, b) => {
          if (a.children?.length && !b.children?.length) {
            return -1;
          }
          if (!a.children?.length && b.children?.length) {
            return 1;
          }

          return (a.name ?? "").localeCompare(b.name ?? "");
        });
        setEntries(newEntries);
      } catch (error) {
        console.error("Failed to read directory:", error);
      }
    }

    setFiles();
  }, [appContext.openedDir, isRefreshed]);

  const handleFileClick = (path: string) => {
    appContext.openFile(path);
  };

  const handleDirectoryClick = (
    name: string | undefined,
    dirEntries: FileEntry[],
  ) => {
    const backEntries =
      name !== ".." ? [{ name: "..", path: "...", children: entries }] : [];
    setEntries([...backEntries, ...dirEntries]);
  };

  return (
    <div className="file-explorer">
      <div className="file-explorer__controls column">
        <div className="row">
          <button
            disabled={openingDialog}
            onClick={() => {
              setRefresh((prev) => !prev);
            }}
          >
            Refresh
          </button>

          <button
            disabled={openingDialog}
            onClick={() => {
              setOpeningDialog(true);
              setTimeout(() => {
                appContext.openDialog().finally(() => {
                  setOpeningDialog(false);
                });
              });
            }}
          >
            {openingDialog ? "Opening..." : "Open new directory"}
          </button>
        </div>

        <label>
          Filter:
          <input
            onChange={(ev) => setTextFilter(ev.target.value)}
            name="filter"
          />
        </label>
      </div>
      <ul className="file-explorer__list">
        {filterFileEntries(entries, textFilter).map((entry, index) => (
          <li key={index}>
            {entry.children?.length ? (
              <button
                onClick={() =>
                  handleDirectoryClick(entry.name, entry.children!)
                }
                className="dir-link"
              >
                {entry.name}
                {entry.children ? "/" : ""}
              </button>
            ) : (
              <button onClick={() => handleFileClick(entry.path)}>
                {entry.name}
              </button>
            )}{" "}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileExplorer;
