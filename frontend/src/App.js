import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import DocumentEditor from "./pages/DocumentEditor";
import StageViewer from "./pages/StageViewer";
import ExecutionMonitor from "./pages/ExecutionMonitor";
import DemoPage from "./pages/DemoPage";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <Routes>
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/editor" element={<DocumentEditor />} />
                <Route path="/stages" element={<StageViewer />} />
                <Route path="/execution" element={<ExecutionMonitor />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
