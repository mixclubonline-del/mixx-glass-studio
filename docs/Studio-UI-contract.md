# Studio UI Contract

This contract documents the non-negotiable expectations for the Mixx Club Studio runtime. Any change that violates these guarantees must be reconsidered or explicitly approved before merging.

---

## 1. Core Presentation Pipeline
- `src/index.tsx` **must** render `App` and import `./index.css`. Removing this import breaks Tailwind and all DAW styling.
- `src/index.css` owns Tailwind directives, global gradients, animation keyframes, and scrollbar styling. Do not inline these elsewhere or delete them.
- The Studio layout expects the full component stack under `src/components/` (timeline, mixer, Bloom HUD, etc.). Removing or renaming these modules without replacement is a regression.

## 2. Audio Context Lifecycle
- `App.tsx` manages a single `AudioContext`, built inside the guarded `useEffect`. That effect **resets** `trackNodesRef`, `fxNodesRef`, and `engineInstancesRef` before reconnecting nodes. Never short-circuit that reset.
- Cleanup **must** disconnect every node and close the context. Skipping this leads to “connect to a different audio context” errors when React re-mounts in Strict Mode.
- Plugin engines are created through `getPluginRegistry(ctx)` and stored in `engineInstancesRef`. Replacements must keep the same contract: `engineInstance(ctx)` returns nodes wired to the active context.

## 3. Styling and Visual Fidelity
- Tailwind configuration lives in `tailwind.config.ts`. If you add new directories, update the `content` glob; otherwise classes will purge out and the UI will flatten.
- Brand palette, ALS glow, and five-pillar animations are defined in `index.css`. Changes to palette or keyframes must maintain the glass aesthetic (dark background, gradient glow, and dynamic indicators).
- Components rely on Tailwind class names (e.g., `bg-[#03040B]`, `animate-record-arm-pulse`). Do not refactor them away without providing equivalent styling.

## 4. Change Protocol
- Before merging UI-affecting work, run:
  - `npm run type-check`
  - `npm run lint`
  - `npm run dev` and manually open `http://localhost:3001` to confirm timeline, mixer, and ALS HUD all render.
- If you introduce a new CSS entry point or swap the router, document it here and update `BLACK_SCREEN_DEBUG.md`.
- Never delete `src-backup-20251110/` without creating a replacement snapshot. It is our baseline for emergency recovery.

## 5. Regression Checklist (run before merging)
1. Styles render (no flat white page) and ALS HUD animates.
2. Timeline clips visible, mixer meters glow, Bloom HUD present.
3. Audio playback works without console errors.
4. `git status` shows no unintended deletions in `src/components`, `src/audio`, or `src/index.css`.

Adhering to this contract protects Studio flow and keeps us from falling back to a skeletal UI. Treat it as part of the codebase—review it whenever you touch the presentation stack.

