import { ReactNode, useContext, useEffect, useState } from "react";
import { AppContext } from "./context/AppContextProvider";
import { invoke } from "@tauri-apps/api";
import { withStorage } from "./config/utils";

interface CSVData {
  file_size: number;
  lines: Array<string[]>;
  fields: Array<string>;
}

function formatFileSize(fileSize: number) {
  if (fileSize < 1000) {
    return `${fileSize}b`;
  }
  if (fileSize < 1e6) {
    return `${(fileSize / 1000).toFixed(2)} KB`;
  }
  if (fileSize < 1e9) {
    return `${(fileSize / 1e6).toFixed(2)} MB`;
  }

  return `${(fileSize / 1e9).toFixed(2)} GB`;
}

import { createContext } from "react";
interface FloatingContextData {
  isVisible: boolean;
  setVisibility: (prev: boolean) => boolean;
}
const FloatContext = createContext<FloatingContextData>({
  isVisible: true,
  setVisibility: function (_prev: boolean): boolean {
    throw new Error("Function not implemented.");
  },
});

function FloatingAction({ children }: { children: ReactNode }) {
  const [floatVisible, setFloatVisible] = useState(false);

  return (
    <FloatContext.Provider
      value={{
        isVisible: floatVisible,
        setVisibility: (prev) => {
          setFloatVisible(prev);
          return prev;
        },
      }}
    >
      <div
        style={{
          display: floatVisible ? "initial" : "none",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          position: "fixed",
          width: "100vw",
          height: "100vh",
          top: 0,
          left: 0,
          padding: "2em",
        }}
      >
        <div
          style={{
            backgroundColor: "#181818",
            border: "1px solid black",
            borderRadius: "0.5em",
            margin: "2em",
            padding: "2em",
            height: "80%",
            width: "90%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          {children}
        </div>
      </div>
      <div style={{ position: "fixed", bottom: 0, right: 0 }}>
        <button
          onClick={() => {
            setFloatVisible((prev) => !prev);
          }}
        >
          {floatVisible ? "Close" : "Open"} note
        </button>
      </div>
    </FloatContext.Provider>
  );
}

function DashboardNote({ noteUrl }: { noteUrl: string }) {
  const [notes, setNotes] = withStorage<string>("notes.dat", noteUrl);

  console.log({ notes, noteUrl });
  const floatState = useContext(FloatContext);
  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();

        // @ts-ignore
        setNotes(ev.target["details"].value);
        // @ts-ignore
        ev.target["details"].value = "";

        floatState.setVisibility(false);
      }}
    >
      <label>
        Note:{" "}
        <textarea
          name="details"
          rows={4}
          cols={50}
          defaultValue={notes ?? ""}
        />
      </label>

      <button>Save</button>
    </form>
  );
}

export function Dashboard() {
  const appContext = useContext(AppContext);
  const filePath = appContext.openedFile;
  const [csvData, setCSVData] = useState<CSVData>({
    file_size: -1,
    lines: [],
    fields: [],
  });
  const [customDelim, setCustomDelim] = useState(",");

  useEffect(() => {
    if (!filePath || !/\.(c|t)sv$/.test(filePath)) {
      return;
    }
    invoke("open_csv", { csvPath: filePath, customDelim }).then((csv) => {
      console.log(csv);
      setCSVData(csv as CSVData);
    });
  }, [filePath, customDelim]);

  if (!filePath) {
    return <></>;
  }

  return (
    <div className="dashboard flex-column">
      <h2 className="file-name-title">{filePath}</h2>
      <label className="m1">
        Set custom separator:{" "}
        <input
          maxLength={2}
          className="w1"
          defaultValue={customDelim}
          onKeyUp={(ev) => {
            if (ev.key === "Enter") {
              // @ts-ignore
              setCustomDelim(ev.target.value);
            }
          }}
        />
      </label>
      <table className="file-data">
        <thead>
          <tr>
            <td>Fields</td>
            <td>Size</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <ol className={"file-data__field-list "}>
                {csvData.fields.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ol>
            </td>
            <td>{formatFileSize(csvData.file_size)}</td>
          </tr>
        </tbody>
      </table>
      <h3>First 10 rows</h3>

      <div className="flex-column">
        <div className="file-data__parsed-table">
          <h4>Parsed:</h4>

          <table>
            <tbody>
              {csvData.lines.map((line, i) => (
                <tr key={i}>
                  {line.map((field, i) => (
                    <td key={i}>
                      <div className="file-data__field">{field}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid">
          <h4>Raw:</h4>
          <pre className="csv-contents">{csvData.lines.join("\n")}</pre>
        </div>
      </div>
      <FloatingAction>
        <DashboardNote noteUrl={filePath} />
      </FloatingAction>
    </div>
  );
}
