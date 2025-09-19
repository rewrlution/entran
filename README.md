# ENTRAN - English as Programming Language

Transform troubleshooting documentation into executable programs with a familiar debugger interface.

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation & Startup

1. **Clone and Setup**

   ```bash
   git clone https://github.com/rewrlution/entran.git
   cd entran
   npm install
   ```

2. **Start Backend Server** (Terminal 1)

   ```bash
   node src/server/app.js
   ```

   Backend runs on: http://localhost:3001

3. **Start Frontend** (Terminal 2)

   ```bash
   cd frontend
   npm install
   npm start
   ```

   Frontend runs on: http://localhost:3000

4. **Access Application**
   Open browser to: http://localhost:3000

## Project Structure

```
entran/
├── src/
│   ├── server/           # Express backend server
│   │   ├── routes/       # API endpoints (/api/*)
│   │   └── middleware/   # Validation & error handling
│   └── services/         # 4-stage compilation pipeline
│       ├── LexerService.js      # Stage 1: Markdown → AST
│       ├── TranspilerService.js # Stage 2: AST → Program
│       ├── AnalyzerService.js   # Stage 3: Semantic Analysis
│       └── ExecutionService.js  # Stage 4: Program Execution
├── frontend/             # React web application
│   ├── src/
│   │   ├── components/   # UI components (Layout, etc.)
│   │   └── pages/        # Main pages (Dashboard, Editor, etc.)
└── package.json          # Backend dependencies
```

## 4-Stage Compilation Pipeline

1. **🔍 Lexical Analysis** - Parse markdown → AST using marked.js
2. **🔄 Transpilation** - AST → Executable program with tool registry
3. **🧠 Semantic Analysis** - Extract intent, entities & relationships
4. **⚡ Execution** - Step-by-step debugging & execution

## API Endpoints

### Stage 1: Lexical Analysis

```bash
POST /api/lexer/parse
Content-Type: application/json
{
  "markdown": "# Troubleshooting Guide\n\n## Steps\n1. Check connectivity"
}
```

### Stage 2: Transpilation

```bash
POST /api/transpiler/transpile
Content-Type: application/json
{
  "ast": { /* AST from stage 1 */ }
}
```

### Stage 3: Semantic Analysis

```bash
POST /api/analyzer/analyze
Content-Type: application/json
{
  "program": { /* Program from stage 2 */ }
}
```

### Stage 4: Execution

```bash
POST /api/execution/start
Content-Type: application/json
{
  "program": { /* Program object */ },
  "analysis": { /* Analysis from stage 3 */ }
}
```

## Web Interface

- **📊 Dashboard** - System stats, recent documents, pipeline health
- **📝 Document Editor** - Upload/edit markdown, real-time processing
- **🔬 Stage Viewer** - Interactive pipeline visualization & metrics
- **🎯 Execution Monitor** - Step-by-step debugger with terminal

## Troubleshooting

### Common Issues

1. **Port 3001 already in use**

   ```bash
   lsof -ti:3001
   kill $(lsof -ti:3001)
   ```

2. **React compilation warnings**

   - These are non-blocking ESLint warnings
   - Application will still function normally

3. **Backend connection errors**
   - Ensure both servers are running
   - Check console logs for detailed errors

---

**ENTRAN** - English as Programming Language! 🚀

- `POST /api/execute/start` - Stage 4: Start program execution
- `POST /api/execute/step` - Execute debugging commands

## Development

See `docs/07-implementation-roadmap.md` for detailed implementation plan.

## License

MIT
