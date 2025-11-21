# Suite Studio Local Development Guide

## 🚀 Quick Start

### Start Development Server
```bash
npm run dev
```
This starts the Vite dev server on `http://localhost:3001` with hot reload enabled.

### Suite Studio Integration

**Suite Studio will automatically:**
- Detect the `suite-studio.json` configuration
- Monitor file changes for hot reload
- Track development progress
- Provide debugging tools

## 📋 Development Workflow

### 1. **Start Suite Studio**
- Open Suite Studio application
- File → Open Project → Select this directory
- Suite Studio will read `suite-studio.json` and configure the workspace

### 2. **Run Development Server**
```bash
# In your terminal
npm run dev
```

Or use Suite Studio's built-in terminal:
- Suite Studio will recognize the `dev` script
- Click "Run" or use the Run menu
- Server starts on port 3001

### 3. **Development Features**
- ✅ **Hot Module Replacement (HMR)** - Changes reflect instantly
- ✅ **Type Checking** - Run `npm run type-check` to verify types
- ✅ **Live Reload** - Browser refreshes on file changes
- ✅ **Source Maps** - Full debugging support in Suite Studio

## 🔧 Available Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3001)

# Building
npm run build            # Production build to ./dist
npm run preview          # Preview production build (localhost:4173)

# Quality Checks
npm run type-check       # TypeScript type checking
npm run lint             # ESLint code quality

# Desktop App (Tauri)
npm run tauri:dev        # Native desktop dev mode
npm run tauri:build      # Build native desktop app
```

## 🌐 Access Points

- **Development**: http://localhost:3001
- **Production Preview**: http://localhost:4173
- **Suite Studio Dashboard**: (check Suite Studio UI)

## 📁 Project Structure

```
mixx-glass-studio/
├── src/                    # Source code
│   ├── plugins/suite/      # F.L.O.W. Plugin Suite (transferred)
│   ├── components/         # React components
│   ├── audio/             # Audio processing engines
│   └── core/              # Core DAW logic
├── dist/                   # Production build output
├── suite-studio.json      # Suite Studio configuration
└── .suite-studio.yml      # Alternative Suite Studio config
```

## 🎯 Suite Studio Features

### File Watching
Suite Studio monitors:
- `src/**/*` - All source files
- Configuration changes
- Dependency updates

### Hot Reload
- React components update instantly
- State preserved during HMR
- No page refresh needed for most changes

### Debugging
- Full TypeScript support
- Source maps enabled in dev
- Breakpoints work in Suite Studio debugger

## 🔄 Development Cycle

1. **Make Changes** → Edit files in `src/`
2. **Auto Reload** → Vite HMR updates browser
3. **Suite Studio Tracks** → Changes logged in Suite Studio
4. **Test** → Verify in browser at localhost:3001
5. **Type Check** → Run `npm run type-check` before committing

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Suite Studio Not Detecting Changes
- Restart Suite Studio
- Verify `suite-studio.json` is in project root
- Check Suite Studio workspace settings

### Type Errors
```bash
# Check for type errors
npm run type-check

# Fix errors before building
```

## 📝 Notes

- Suite Studio configuration is in `suite-studio.json`
- Development server runs independently of Suite Studio
- Suite Studio provides monitoring and debugging tools
- All development happens locally in this directory

