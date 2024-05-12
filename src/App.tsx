import "./App.css";
import FileExplorer from "./FileExplorer";
import { setupShortcutsHook } from "./context/shortcuts";
import "./css/Dashboard.css";
import { Dashboard } from "./Dashboard";

function App() {
  setupShortcutsHook();

  return (
    <div className="container">
      <h1 className="hidden">CSV Explorer</h1>
      <div className="content">
        <FileExplorer />
        <Dashboard />
      </div>
    </div>
  );
}

export default App;
