# ENTRAN - English as Programming Language

Transform troubleshooting documentation into executable programs with a familiar debugger interface.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start frontend (in another terminal)
npm run dev:frontend
```

## Project Structure

```
entran/
├── src/
│   ├── server/          # Express.js backend
│   ├── services/        # Business logic services
│   │   ├── lexer/       # Stage 1: Markdown parsing
│   │   ├── transpiler/  # Stage 2: LLM optimization
│   │   ├── analyzer/    # Stage 3: Semantic analysis
│   │   └── interpreter/ # Stage 4: Execution engine
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   └── utils/           # Utility functions
├── src/frontend/        # React frontend (created separately)
├── docs/                # Functional specifications
├── examples/            # Sample troubleshooting guides
└── tests/               # Test suites
```

## Features

- **4-Stage Compilation**: Lexical Analysis → Transpilation → Semantic Analysis → Execution
- **Debugger Interface**: Step over/into/out controls with stack, heap, and memory visualization
- **Real-time Editing**: Monaco Editor with syntax highlighting and error detection
- **Tool Registry**: Support for common Unix tools and commands
- **Variable Scoping**: H2 headers as method boundaries with proper variable lifetime management

## API Endpoints

- `POST /api/parse` - Stage 1: Parse markdown and generate AST
- `POST /api/transpile` - Stage 2: Convert AST to executable format
- `POST /api/analyze` - Stage 3: Perform semantic analysis
- `POST /api/execute/start` - Stage 4: Start program execution
- `POST /api/execute/step` - Execute debugging commands

## Development

See `docs/07-implementation-roadmap.md` for detailed implementation plan.

## License

MIT
