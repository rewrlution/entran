import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Play,
  Save,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import AceEditor from "react-ace";
import axios from "axios";

// Import ace modes and themes
import "ace-builds/src-noconflict/mode-markdown";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

function DocumentEditor() {
  const [document, setDocument] = useState("");
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const sampleDocument = `# Network Connectivity Troubleshooting

## Problem Description
User reports inability to access company website from office network.

## Diagnostic Steps

1. Check basic connectivity
   - Ping the target server
   - Verify DNS resolution
   - Test different protocols

2. Network configuration verification
   - Check IP configuration
   - Verify routing table
   - Test firewall rules

## Implementation

### Step 1: Basic Connectivity Test
\`\`\`bash
ping google.com
nslookup company.com
curl -I https://company.com
\`\`\`

### Step 2: Network Configuration Check
\`\`\`bash
ip addr show
ip route
sudo netstat -tulpn
\`\`\`

### Step 3: Firewall Verification
\`\`\`bash
sudo ufw status
sudo iptables -L
\`\`\`

## Expected Results
- Ping should return response times under 100ms
- DNS should resolve to correct IP address
- HTTP response should return 200 status code`;

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/markdown") {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setDocument(e.target.result);
      };
      reader.readAsText(file);
    } else {
      setError("Please select a valid markdown file (.md)");
    }
  };

  const handleLoadSample = () => {
    setDocument(sampleDocument);
    setFileName("network-troubleshooting.md");
    setError(null);
    setResults(null);
  };

  const handleProcess = async () => {
    if (!document.trim()) {
      setError("Please enter or upload a document first");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults(null);

    try {
      // Stage 1: Lexical Analysis
      setProcessingStage("Lexical Analysis");
      const lexerResponse = await axios.post("/api/lexer/parse", {
        markdown: document,
      });

      // Stage 2: Transpilation
      setProcessingStage("Transpilation");
      const transpilerResponse = await axios.post("/api/transpiler/transpile", {
        ast: lexerResponse.data.ast,
      });

      // Stage 3: Semantic Analysis
      setProcessingStage("Semantic Analysis");
      const analyzerResponse = await axios.post("/api/analyzer/analyze", {
        program: transpilerResponse.data.program,
      });

      setResults({
        lexer: lexerResponse.data,
        transpiler: transpilerResponse.data,
        analyzer: analyzerResponse.data,
      });

      setProcessingStage("");
    } catch (err) {
      setError(err.response?.data?.error || "Processing failed");
      setProcessingStage("");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    const blob = new Blob([document], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "document.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Document Editor
            </h1>
            <p className="text-gray-600">
              Create and edit troubleshooting documents
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </button>
            <button
              onClick={handleLoadSample}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              Load Sample
            </button>
            <button
              onClick={handleSave}
              disabled={!document.trim()}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
            <button
              onClick={handleProcess}
              disabled={isProcessing || !document.trim()}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Process Document
            </button>
          </div>
        </div>

        {/* File info */}
        {fileName && (
          <div className="mt-2 flex items-center text-sm text-gray-600">
            <FileText className="h-4 w-4 mr-1" />
            {fileName}
          </div>
        )}

        {/* Processing status */}
        {isProcessing && (
          <div className="mt-2 flex items-center text-sm text-blue-600">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing: {processingStage}
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6">
            <div className="h-full">
              <AceEditor
                mode="markdown"
                theme="github"
                value={document}
                onChange={setDocument}
                name="document-editor"
                editorProps={{ $blockScrolling: true }}
                width="100%"
                height="100%"
                fontSize={14}
                showPrintMargin={false}
                showGutter={true}
                highlightActiveLine={true}
                setOptions={{
                  enableBasicAutocompletion: true,
                  enableLiveAutocompletion: true,
                  enableSnippets: true,
                  showLineNumbers: true,
                  tabSize: 2,
                  wrap: true,
                }}
                placeholder="Enter your troubleshooting document here...

Use markdown format with the following structure:
# Title
## Problem Description
## Diagnostic Steps
## Implementation
### Step sections with code blocks"
              />
            </div>
          </div>
        </div>

        {/* Results Panel */}
        {(results || error) && (
          <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Processing Results
              </h2>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">
                        Error
                      </h3>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {results && (
                <div className="space-y-4">
                  {/* Lexer Results */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <h3 className="font-medium text-gray-900">
                        Lexical Analysis
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Nodes: {results.lexer.ast?.children?.length || 0}
                    </p>
                    <div className="text-xs bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
                      <pre>
                        {JSON.stringify(results.lexer.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Transpiler Results */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <h3 className="font-medium text-gray-900">
                        Transpilation
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Procedures:{" "}
                      {results.transpiler.program?.procedures?.length || 0}
                    </p>
                    <div className="text-xs bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
                      <pre>
                        {JSON.stringify(results.transpiler.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Analyzer Results */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <h3 className="font-medium text-gray-900">
                        Semantic Analysis
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Intent: {results.analyzer.analysis?.intent || "Unknown"}
                    </p>
                    <div className="text-xs bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
                      <pre>
                        {JSON.stringify(
                          results.analyzer.analysis?.entities,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}

export default DocumentEditor;
