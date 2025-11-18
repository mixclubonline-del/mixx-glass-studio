# 🔱 FLOW — DESIGN SPECIFICATIONS

**Complete design system for Flow promotional materials**

---

## 🎨 **COLOR PALETTE**

### Primary Colors
```css
/* Background */
--bg-primary: #060914;
--bg-secondary: #0F172A;
--bg-tertiary: #1E293B;

/* Glass Effect */
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-border: rgba(255, 255, 255, 0.1);

/* Text */
--text-primary: #E2E8F0;
--text-secondary: #CBD5E1;
--text-muted: #94A3B8;
```

### Accent Colors
```css
/* Purple (Primary Brand) */
--purple-light: #E9D5FF;
--purple-base: #C4B5FD;
--purple-dark: #8B5CF6;

/* Cyan (Secondary Accent) */
--cyan-light: #67E8F9;
--cyan-base: #06B6D4;
--cyan-dark: #0891B2;
```

### Gradients
```css
/* Logo Gradient */
background: linear-gradient(135deg, #E9D5FF 0%, #C4B5FD 50%, #67E8F9 100%);

/* Background Gradient */
background: linear-gradient(135deg, #060914 0%, #0F172A 50%, #1E293B 100%);

/* CTA Button Gradient */
background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
```

---

## 📐 **DIMENSIONS**

### Social Media
- **Instagram Post**: 1080px × 1080px
- **Instagram Story**: 1080px × 1920px
- **Twitter Header**: 1500px × 500px
- **Twitter Post**: 1200px × 675px
- **Facebook Post**: 1200px × 630px
- **LinkedIn Post**: 1200px × 627px

### Email
- **Max Width**: 600px
- **Padding**: 30-40px
- **Mobile Breakpoint**: 480px

---

## 🔤 **TYPOGRAPHY**

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;
```

### Headings
```css
/* H1 - Logo/Title */
font-size: 48-120px;
font-weight: 700;
letter-spacing: 0.1-0.15em;
text-transform: uppercase;

/* H2 - Tagline */
font-size: 18-36px;
font-weight: 400;
letter-spacing: 0.05-0.1em;
text-transform: uppercase;
color: #C4B5FD;

/* H3 - Feature Titles */
font-size: 18-24px;
font-weight: 600;
letter-spacing: 0.05em;
text-transform: uppercase;
color: #E9D5FF;
```

### Body Text
```css
/* Large Body */
font-size: 16-18px;
line-height: 1.8;
color: #CBD5E1;

/* Regular Body */
font-size: 14-16px;
line-height: 1.6;
color: #CBD5E1;

/* Small Body */
font-size: 12-14px;
line-height: 1.5;
color: #94A3B8;
```

---

## 🎨 **GLASS MORPHISM**

### Glass Effect
```css
.glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12-16px;
}
```

### Glass Card
```css
.glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 20-30px;
}
```

---

## ✨ **EFFECTS**

### Glow Effects
```css
/* Purple Glow */
box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
text-shadow: 0 0 60px rgba(139, 92, 246, 0.5);

/* Cyan Glow */
box-shadow: 0 8px 32px rgba(6, 182, 212, 0.3);
text-shadow: 0 0 60px rgba(6, 182, 212, 0.5);
```

### Radial Glows (Background)
```css
.glow-purple {
    background: radial-gradient(
        circle, 
        rgba(139, 92, 246, 0.3) 0%, 
        transparent 70%
    );
}

.glow-cyan {
    background: radial-gradient(
        circle, 
        rgba(6, 182, 212, 0.3) 0%, 
        transparent 70%
    );
}
```

---

## 🎯 **BUTTONS**

### Primary CTA
```css
.cta-primary {
    display: inline-block;
    padding: 16px 40px;
    background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
    color: #FFFFFF;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
    transition: transform 0.2s, box-shadow 0.2s;
}

.cta-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(139, 92, 246, 0.4);
}
```

### Secondary CTA
```css
.cta-secondary {
    display: inline-block;
    padding: 12px 30px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #67E8F9;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 14px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}
```

---

## 📱 **RESPONSIVE BREAKPOINTS**

```css
/* Mobile */
@media (max-width: 480px) {
    /* Adjust padding, font sizes */
}

/* Tablet */
@media (max-width: 768px) {
    /* Adjust layouts */
}

/* Desktop */
@media (min-width: 769px) {
    /* Full layout */
}
```

---

## 🎨 **VISUAL ELEMENTS**

### Icons
- Use emoji for feature icons (🔱 🧠 📊 🎨)
- Size: 32-64px for posts, 24-48px for email
- Add glow effect: `filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.5));`

### Dividers
```css
.divider {
    height: 1px;
    background: linear-gradient(
        90deg, 
        transparent, 
        rgba(255, 255, 255, 0.2), 
        transparent
    );
    margin: 30px 0;
}
```

### Borders
```css
.border-glow {
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
}
```

---

## 📐 **LAYOUT GUIDELINES**

### Spacing
- **Section Padding**: 40-60px
- **Element Margin**: 20-30px
- **Card Padding**: 20-30px
- **Text Line Height**: 1.6-1.8

### Grid Systems
- **2-Column**: For feature comparisons
- **3-Column**: For benefit lists
- **4-Column**: For feature grids (desktop)

---

## 🎯 **EXPORT INSTRUCTIONS**

### For Social Graphics
1. Open HTML file in browser
2. Use browser dev tools to set exact dimensions
3. Take screenshot or use browser's print-to-PDF
4. Export as PNG at 2x resolution for retina displays

### For Email Templates
1. Test in email clients (Gmail, Outlook, Apple Mail)
2. Use inline CSS for maximum compatibility
3. Test on mobile devices
4. Use email testing service (Litmus, Email on Acid)

### For Print
1. Export at 300 DPI
2. Use CMYK color space
3. Add bleed area (3mm)
4. Save as PDF/X-1a

---

## 🎨 **BRAND ASSETS CHECKLIST**

### Required Assets
- [ ] Logo (multiple sizes)
- [ ] Feature icons
- [ ] Social media templates
- [ ] Email templates
- [ ] Website graphics
- [ ] Video thumbnails
- [ ] Presentation templates

### Optional Assets
- [ ] Animated GIFs
- [ ] Video backgrounds
- [ ] 3D renders
- [ ] Motion graphics
- [ ] Interactive demos

---

**END OF DESIGN SPECS**

*Created for Mixx Club Flow DAW*
*Version 1.0*
*© 2025 Mixx Club*

