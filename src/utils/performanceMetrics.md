# Performance Metrics Utility - Usage Guide

## Overview

The `performanceMetrics.ts` utility tracks key performance metrics to validate CSS optimization improvements.

## Quick Start

### 1. Initialize Monitoring

```typescript
import { initPerformanceMonitoring } from './utils/performanceMetrics';

// In your App.tsx or main entry point
const monitor = initPerformanceMonitoring();
```

### 2. Take Baseline Measurement (Before Optimization)

```typescript
import { getPerformanceMonitor } from './utils/performanceMetrics';

// Before applying CSS optimizations
const monitor = getPerformanceMonitor();
await monitor.setBaseline();
```

### 3. Take Current Measurement (After Optimization)

```typescript
// After applying CSS optimizations
await monitor.takeCurrent();
```

### 4. View Results

```typescript
import { logPerformanceComparison } from './utils/performanceMetrics';

await logPerformanceComparison();
```

Or access directly:

```typescript
const monitor = getPerformanceMonitor();
const metrics = monitor.getMetrics();
console.log(metrics);
```

## Metrics Tracked

### FPS (Frames Per Second)
- **Target:** 60fps
- **Measurement:** Average FPS over 1-minute window
- **Impact:** Smooth animations and scrolling

### TTI (Time to Interactive)
- **Target:** < 2s
- **Measurement:** Time until page is interactive
- **Impact:** User can interact with the app quickly

### CLS (Cumulative Layout Shift)
- **Target:** < 0.1
- **Measurement:** Visual stability during load
- **Impact:** No unexpected layout shifts

### FCP (First Contentful Paint)
- **Target:** < 1s
- **Measurement:** First pixel painted
- **Impact:** Perceived load speed

### LCP (Largest Contentful Paint)
- **Target:** < 2.5s
- **Measurement:** Largest element rendered
- **Impact:** Main content visible quickly

## Example Integration

```typescript
// In App.tsx
import { useEffect } from 'react';
import { initPerformanceMonitoring, getPerformanceMonitor } from './utils/performanceMetrics';

function App() {
  useEffect(() => {
    // Initialize monitoring
    const monitor = initPerformanceMonitoring();
    
    // Set baseline after initial render
    setTimeout(async () => {
      await monitor.setBaseline();
    }, 3000);
    
    // Take current measurement after optimizations
    // (Call this after CSS changes are applied)
    const measureAfterOptimization = async () => {
      await monitor.takeCurrent();
      const metrics = monitor.getMetrics();
      console.log('Performance improvement:', metrics.improvement);
    };
    
    // Expose to window for manual testing
    (window as any).__measurePerformance = measureAfterOptimization;
  }, []);
  
  // ... rest of app
}
```

## Manual Testing

After integrating, you can test in the browser console:

```javascript
// Set baseline
await window.__measurePerformance();

// ... make changes ...

// Measure again
await window.__measurePerformance();
```

## Expected Improvements (Phase 1)

After Phase 1 optimizations, expect:
- **FPS:** +5-10% improvement (smoother animations)
- **FCP:** -10-20% improvement (faster font loading)
- **CLS:** -20-30% improvement (better font loading strategy)
- **TTI:** -5-10% improvement (reduced blocking resources)

## Notes

- FPS monitoring runs continuously once started
- Web Vitals measurements are taken on-demand
- Baseline should be measured before any optimizations
- Current measurement should be taken after optimizations are applied
- All timings are in milliseconds

