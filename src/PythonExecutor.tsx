import { invoke } from "@tauri-apps/api";
import { useState, useRef } from "react";

export default function PythonExecutor() {
  const [codeOutput, setCodeOutput] = useState("");
  const codeRef = useRef<HTMLTextAreaElement | null>(null);
  async function greet() {
    setCodeOutput(
      await invoke("execute_python_code", {
        code: codeRef.current?.value,
      }),
    );
  }

  return (
    <div className="container">
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <textarea
          ref={codeRef}
          defaultValue={`print("Hello world")`}
        ></textarea>
        <button type="submit">Greet</button>
      </form>

      <p>{codeOutput}</p>
    </div>
  );
}
