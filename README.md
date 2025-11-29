# Mixx Club Studio

**Professional Digital Audio Workstation — Hip-Hop Native, AI-Assisted, Vision-Forward**

Mixx Club Studio is a next-generation DAW built for hip-hop producers and engineers. Featuring the proprietary **Five Pillars** audio processing chain, AI-driven mix analysis, and a glass-morphism interface optimized for creative flow.

---

## 🌟 Core Philosophy

### The Three Doctrines

- **Flow**: Preserve creator momentum — no friction, no clutter, pure creative energy
- **Reductionist Engineering**: Strip the noise, keep only what matters
- **Mixx Recall**: The system remembers, so users don't have to

### Design Aesthetic

- **Glass Morphism**: Translucent layers with backdrop blur
- **Temperature-Based Feedback**: Color and motion replace raw numbers
- **Adaptive Layout**: Context-aware interface that adapts to platform and screen size
- **Vision-Forward**: Optimized for Google Glass / Apple Vision aesthetic

---

## 🎵 Core Features

### Five Pillars Audio Processing Chain

The proprietary mastering system that shapes tone through five interconnected stages:

1. **Velvet Curve Engine**: Dynamic tonal shaping with temperature-based feedback
2. **Harmonic Lattice**: Upper harmonic processing for presence and airiness
3. **Phase Weave**: Stereo field manipulation and width control
4. **Velvet Floor**: Sub-harmonic foundation with warmth and depth
5. **Master Chain**: Professional limiting, dithering, and compliance monitoring

### Professional Timeline

- Multi-region editing with collision detection
- Time-aware region manipulation
- Crossfade management
- Group-based alignment
- Zero-crossing snap assist
- Glass Rail Grid for beat/bar alignment
- Professional playhead with pulse visualization

### Advanced Mixer Console

- Flow Console with multiple view modes (Compact, Matrix, Analyzer)
- Professional channel strips with inserts and sends
- ALS (Advanced Leveling System) metering
- Real-time LUFS and True Peak monitoring
- Bus routing and sidechain support
- Temperature-based visual feedback

### AI Integration

- **Prime Brain**: Context-aware AI assistant for mixing guidance
- **Quantum Neural Network**: Genre detection, pattern recognition, mix recommendations
- **Musical Context Engine**: Real-time key/chord detection and harmonic analysis
- **Stem Separation**: AI-powered source separation (Demucs integration)

### Adaptive Layout System

- Platform detection (Desktop, Mobile, Tablet, VisionOS)
- Responsive breakpoints with four layout modes (Compact, Standard, Expanded, Immersive)
- Touch-optimized controls for mobile devices
- Context-aware component visibility

---

## 🛠️ Technology Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** / **Rsbuild** (parallel build support)
- **Tailwind CSS** + **PostCSS**
- **Framer Motion** for animations
- **Radix UI** for accessible components

### Audio Processing
- **Web Audio API** for real-time processing
- **Audio Worklets** for low-latency DSP
- **WASM** modules for stem separation
- **Custom DSP algorithms** for Five Pillars

### State Management
- **Zustand** for global state
- **Custom hooks** for audio context and timeline
- **Flow Context Service** for real-time context mesh

### Desktop App
- **Tauri 2.x** for cross-platform desktop builds
- **Rust** backend for performance-critical operations
- Native window controls

### AI & Machine Learning
- **TensorFlow.js** for Quantum Neural Network
- **Google Generative AI** for Prime Brain
- **Custom WASM models** for audio analysis

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **Rust** (for Tauri desktop builds)
- **npm** or **bun**

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd mixx-glass-studio

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Add your API keys if needed

# Start development server (Vite)
npm run dev

# Or use Rsbuild
npm run dev:rsbuild

# For desktop app development
npm run tauri:dev
```

### Build Commands

```bash
# Web build
npm run build

# Desktop app build
npm run tauri:build

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 📁 Project Structure

```
mixx-glass-studio/
├── src/
│   ├── audio/              # Audio processing engines
│   │   ├── fivePillars.ts  # Five Pillars implementation
│   │   ├── masterChain.ts  # Master chain processing
│   │   └── plugins.ts      # Plugin system
│   ├── components/         # React components
│   │   ├── ArrangeWindow.tsx
│   │   ├── mixer/          # Mixer console components
│   │   ├── timeline/       # Timeline components
│   │   └── ALS/            # Advanced Leveling System
│   ├── core/               # Core DAW logic
│   │   ├── responsive/     # Adaptive layout system
│   │   └── loop/           # Flow loop learning
│   ├── ai/                 # AI integration
│   │   ├── QuantumNeuralNetwork.ts
│   │   └── PrimeBrainSnapshot.ts
│   ├── hooks/              # Custom React hooks
│   ├── state/              # State management
│   ├── types/              # TypeScript definitions
│   └── utils/              # Utility functions
├── src-tauri/              # Tauri desktop app
├── docs/                   # Documentation
│   ├── briefs/           # Feature briefs
│   ├── prototypes/          # Prototype docs
│   └── terms/               # Proprietary glossary
├── prime-fabric/           # Prime Fabric (internal)
└── supabase/               # Database schema
```

---

## 🎨 Design System

### Color Palette

- **Mixx Blue**: `#56C8FF` - Calm, focused energy
- **Prime Violet**: `#A57CFF` - Creative, energetic  
- **Magenta**: `#FF67C7` - Bold, expressive
- **Hot Pink**: `#FF4D8D` - Intense, passionate
- **Ice Blue**: `#EAF2FF` - Clean, professional

### Typography

- **Headings**: System fonts (Inter fallback)
- **Body**: System fonts for optimal performance
- **Code**: Monospace for technical content

### Components

- **Glass Morphism**: Translucent cards with backdrop blur
- **ALS Feedback**: Temperature-based color and motion
- **Bloom Menu**: Voice-aware, on-demand action surface
- **Flow Dock**: Contextual tool dock

---

## 🔧 Development Guidelines

### Code Standards

- **TypeScript** strict mode enabled
- **ESLint** + **Prettier** for formatting
- Component-driven development
- Custom hooks for business logic
- Zustand for state management

### Flow Doctrine Compliance

All code must align with the three doctrines:

1. **Flow**: No friction, preserve momentum
2. **Reduction**: Only what matters, strip noise
3. **Mixx Recall**: System remembers context

### Component Structure

```typescript
// Example component structure
interface ComponentProps {
  // Props interface
}

export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Custom hooks
  const { data, loading } = useCustomHook();
  
  // Event handlers
  const handleAction = () => {
    // Implementation
  };
  
  // Render
  return (
    <div className="component-container">
      {/* JSX */}
    </div>
  );
};
```

---

## 📚 Documentation

- **[Flow Contract](./docs/briefs/flow-contract.md)**: System architecture and signal flow
- **[Proprietary Glossary](./docs/terms/proprietary-glossary.md)**: Domain-specific terminology
- **[Adaptive Layout System](./src/core/responsive/ADAPTIVE_LAYOUT.md)**: Responsive design docs
- **[Placeholder Audit](./PLACEHOLDER_AUDIT_PLAN.md)**: Known placeholders and TODOs

---

## 🎯 Current Status

### ✅ Implemented

- Five Pillars audio processing chain
- Professional timeline with multi-region editing
- Flow Console mixer with multiple view modes
- ALS (Advanced Leveling System) metering
- Adaptive layout system
- Prime Brain AI integration
- Quantum Neural Network
- Tauri desktop app framework
- Stem separation infrastructure

### 🚧 In Progress

- Rsbuild migration (parallel to Vite)
- Professional track headers
- Enhanced waveform visualization
- Plugin parameter automation
- Flow Loop learning system

### 📋 Planned

- Real Demucs model integration
- TimeWarp engine implementation
- Advanced HPSS algorithm
- Prime Brain backend connection
- Pattern learning system

---

## 🤝 Contributing

This is a proprietary system built by Ravenis Prime. For collaboration inquiries, please reach out directly.

### Development Workflow

1. Create a feature branch
2. Follow Flow Doctrine principles
3. Ensure TypeScript strict compliance
4. Test audio processing thoroughly
5. Maintain ALS feedback integration

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details.

---

## 👤 Author

**Ravenis Prime** - Founder of Mixx Club

---

**Built with Flow, Reduction, and Mixx Recall**

*Professional DAW for the Hip-Hop Generation*
