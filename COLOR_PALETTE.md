# 🎨 Mixx Club Pro Studio - Extended Color Palette

## Overview
Expanded neon/glass aesthetic color system with full shade scales, semantic colors, and advanced gradient/glow effects. All colors are in HSL format for maximum flexibility.

---

## 🌈 Color Scales

### Prime Purple (Main Brand)
```
prime-50   → prime-900  (10 shades)
Usage: bg-prime-500, text-prime-300, border-prime-700
```
- **50-300**: Light tints for highlights and subtle backgrounds
- **400-500**: Core brand colors (500 is the signature deep purple glow)
- **600-900**: Dark shades for depth and shadows

### Neon Blue (Accent - Ice/Cold)
```
neon.blue-50 → neon.blue-900
Usage: bg-neon-blue-500, text-neon-blue-400, shadow-[var(--glow-blue)]
```
- Bright cyan accent (#00c2ff base)
- Perfect for: active states, links, info messages

### Neon Pink (Accent - Warm)
```
neon.pink-50 → neon.pink-900
Usage: bg-neon-pink-500, text-neon-pink-300
```
- Hot pink counterbalance (#ff4fd8 base)
- Perfect for: highlights, creative elements, gradients

### Neon Green (Success/Active)
```
neon.green-50 → neon.green-900
Usage: bg-neon-green-500, text-success
```
- Bright green for success states
- Perfect for: confirmations, success messages, active indicators

### Neon Orange (Warning)
```
neon.orange-50 → neon.orange-900
Usage: bg-neon-orange-500, text-warning
```
- Vibrant orange for warnings and heat
- Perfect for: warnings, hot states, fire gradient

### Neon Teal (Info/Cool)
```
neon.teal-50 → neon.teal-900
Usage: bg-neon-teal-500, text-info
```
- Cool teal for information
- Perfect for: info states, ice gradient, tooltips

### Gray Scale
```
gray-50 → gray-950 (11 shades)
Usage: bg-gray-800, text-gray-400, border-gray-700
```
- Neutral grays with subtle blue tint
- Use for: backgrounds, borders, disabled states

---

## 🎯 Semantic Colors

### Success (Green)
```css
bg-success text-success-foreground
```

### Warning (Yellow)
```css
bg-warning text-warning-foreground
```

### Info (Cyan)
```css
bg-info text-info-foreground
```

### Error (Red)
```css
bg-error text-error-foreground
```

---

## 🌡️ Temperature Gradient (Ice → Fire)

Perfect for visual feedback on meters, faders, and temperature-sensitive controls:

```
--ice-deep    → Deep freeze (darkest cyan)
--ice-cold    → Cold (bright cyan)
--ice-warm    → Warming (lighter cyan)
--neutral-cool → Cool neutral
--neutral-warm → Warm neutral
--fire-warm   → Warming (orange)
--fire-hot    → Hot (orange-red)
--fire-red    → Danger (bright red)
```

**Usage Example:**
```tsx
<IceFireFader /> // Automatically uses temperature gradient
```

---

## 🪟 Glass Effects

### Standard Glass
```css
glass-ultra  → Barely visible (5% opacity)
glass-light  → Light glass (10% opacity)
glass-medium → Medium glass (15% opacity)
glass-heavy  → Heavy glass (25% opacity)
```

### Tinted Glass
```css
bg-[hsl(var(--glass-prime))]  → Purple tint
bg-[hsl(var(--glass-blue))]   → Blue tint
bg-[hsl(var(--glass-pink))]   → Pink tint
bg-[hsl(var(--glass-green))]  → Green tint
bg-[hsl(var(--glass-orange))] → Orange tint
```

---

## ✨ Glow Effects

### Prime Glows (Purple)
```css
shadow-[var(--glow-soft)]     → 15% opacity
shadow-[var(--glow-subtle)]   → 20% opacity
shadow-[var(--glow-medium)]   → 25% opacity
shadow-[var(--glow-intense)]  → 40% opacity
shadow-[var(--glow-extreme)]  → 50% opacity
```

### Color-Specific Glows
```css
shadow-[var(--glow-blue)]
shadow-[var(--glow-pink)]
shadow-[var(--glow-green)]
shadow-[var(--glow-orange)]
shadow-[var(--glow-teal)]
```

**Usage Example:**
```tsx
<Button className="shadow-[var(--glow-blue)] hover:shadow-[var(--glow-intense)]">
  Click Me
</Button>
```

---

## 🎨 Gradients

### Pre-defined Gradients
```css
bg-[var(--gradient-prime)]      → Purple to Pink
bg-[var(--gradient-prime-blue)] → Purple to Cyan
bg-[var(--gradient-fire)]       → Red to Orange
bg-[var(--gradient-ice)]        → Cyan to Teal
bg-[var(--gradient-cyber)]      → Purple → Blue → Pink
bg-[var(--gradient-sunset)]     → Pink → Orange → Red
bg-[var(--gradient-matrix)]     → Green to Teal
```

### Border Gradients
```css
border-gradient-prime  → Purple/Blue/Pink
border-gradient-cyber  → Animated prime/blue
border-gradient-fire   → Orange to Red
border-gradient-ice    → Blue to Teal
```

**Usage Example:**
```tsx
<div className="relative p-4 bg-background">
  <div className="absolute inset-0 bg-[var(--gradient-prime)] opacity-10 rounded-lg" />
  <p>Content with gradient overlay</p>
</div>
```

---

## 🌌 Gradient Mesh Backgrounds

Ethereal multi-layer radial gradients for depth:

```css
bg-[var(--gradient-mesh)]         → Standard 3-color mesh
bg-[var(--gradient-mesh-vibrant)] → Vibrant 4-color mesh
```

**Usage Example:**
```tsx
<div className="relative h-screen bg-background overflow-hidden">
  <div className="absolute inset-0 bg-[var(--gradient-mesh-vibrant)] opacity-30" />
  <div className="relative z-10">
    {/* Your content */}
  </div>
</div>
```

---

## 📋 Usage Patterns

### Active Button States
```tsx
<Button 
  variant={isActive ? "glass-active" : "glass"}
  className={isActive ? "shadow-[var(--glow-medium)]" : ""}
>
  {label}
</Button>
```

### Status Indicators
```tsx
{/* Success */}
<Badge className="bg-success text-success-foreground shadow-[var(--glow-green)]">
  Active
</Badge>

{/* Warning */}
<Badge className="bg-warning text-warning-foreground shadow-[var(--glow-orange)]">
  Warning
</Badge>

{/* Error */}
<Badge className="bg-error text-error-foreground shadow-[var(--glow-blue)]">
  Error
</Badge>
```

### Colorful Panels
```tsx
{/* Teal glass panel */}
<div className="bg-[hsl(var(--glass-teal))] backdrop-blur-xl border border-neon-teal-500/30 rounded-lg p-4">
  <h3 className="text-neon-teal-300">Cool Feature</h3>
</div>

{/* Orange glass panel */}
<div className="bg-[hsl(var(--glass-orange))] backdrop-blur-xl border border-neon-orange-500/30 rounded-lg p-4">
  <h3 className="text-neon-orange-300">Hot Feature</h3>
</div>
```

### Neon Text with Glow
```tsx
<h1 className="text-5xl font-bold text-neon-blue-400 drop-shadow-[var(--glow-blue)]">
  Neon Title
</h1>
```

---

## 🎯 Best Practices

1. **Always use HSL format** - All colors are HSL for consistency
2. **Use semantic colors** - Prefer `bg-success` over `bg-neon-green-500` for status
3. **Layer glows** - Combine multiple glow effects for depth
4. **Glass + Color** - Tinted glass adds subtle color while maintaining transparency
5. **Gradient overlays** - Use low opacity gradients over solid backgrounds
6. **Temperature mapping** - Use ice→fire gradient for audio meters and controls

---

## 🚀 Quick Reference

| Use Case | Color Choice |
|----------|-------------|
| Primary action | `prime-500` with `glow-medium` |
| Active state | `neon-blue-500` with `glow-blue` |
| Success | `neon-green-500` / `success` |
| Warning | `neon-orange-500` / `warning` |
| Error | `fire-red` / `error` |
| Info | `neon-teal-500` / `info` |
| Subtle accent | `prime-300` or `neon-pink-300` |
| Dark backgrounds | `gray-900`, `gray-950` |
| Borders | `gray-700`, `prime-600/30` |
| Glass panels | `glass-light` to `glass-heavy` |

