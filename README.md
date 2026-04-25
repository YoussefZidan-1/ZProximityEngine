Markdown
# 🚀 ZProximity Engine

**The definitive high-performance React engine for proximity-aware motion design.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/YoussefZidan-1/ZProximityEngine/blob/main/LICENSE)
[![Status](https://img.shields.io/badge/status-Alpha-red.svg)](https://github.com/YoussefZidan-1/ZProximityEngine)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![GSAP](https://img.shields.io/badge/Powered%20by-GSAP-ff0000.svg)](https://greensock.com/gsap/)

`ZProximity` is not just an animation library; it's a specialized **Physics-over-UI** engine. It bridges the gap between raw pointer data and aesthetic motion, enabling developers to create interfaces that "feel" the user's presence.

[**✨ Experience the Playground**](https://z-proximity-engine.vercel.app/) | [**📄 Documentation (Coming Soon)**](#)

---

## 🔥 Why ZProximity?

Most interactive animations today are binary: Hover or No-Hover. `ZProximity` introduces **Radial Influence**. Elements react based on their precise distance from the pointer, creating a dynamic, organic field of interaction.

### ⚡ Performance Core
- **Zero Layout Thrashing:** Built on GSAP's `quickSetter`, bypassing the React reconciliation loop for 60fps+ performance.
- **Exponential Decay Logic:** Uses mathematical falloff algorithms ($e^{-d^x / s}$) for smoother, more natural transitions than linear math.
- **Smart Mutation Tracking:** Automatically detects DOM changes and re-calculates centers without manual refreshes.

---

## ✨ Key Features

- **🎭 Infinite Preset Chaining:** Combine effects like `scale-blur-weight-rotate-y` in any order. The engine parses and applies them dynamically.
- **🔡 Typography Intelligence:** Built-in text splitting (Characters, Words, Lines) with a dedicated `ProximityText` component.
- **🎨 Variable Font Support:** Seamlessly animate `font-weight` and `font-stretch` axes in real-time.
- **🔓 The "Escape Hatch":** Use `onCalculate` to map proximity to *anything*—CSS variables, Canvas properties, or even Web Audio frequencies.
- **🕹️ Gaming-Grade Cursors:** Create Valorant-style expandable crosshairs or magnetic buttons with zero boilerplate.

---

## 🛠 Feature Presets (Included & Upcoming)

| Category | Presets |
| :--- | :--- |
| **Transform** | `scale`, `rotate`, `y`, `x`, `3D Tilt` |
| **Filters** | `blur`, `opacity`, `grayscale`, `chroma-split` |
| **Typography** | `weight`, `width`, `cipher-text`, `text-shadow` |
| **Gaming UI** | `valorant-cursor`, `lazer-sight`, `flashlight` |
| **Aesthetics** | `glassmorphism`, `magnetic`, `jello`, `glitch` |

*AND A LOT MORE*

---

## 🚀 Quick Start (Preview)

```jsx
import { ProximityText } from "z-proximity-engine";

function CreativeHero() {
  return (
    <ProximityText 
      text="BEYOND THE VOID"
      preset="scale-blur-weight" // Type the preset you want with the order you like
      splitBy="word" // You can split by word, letter and line
      reach={2.5} 
      falloff={3}
      config={{
        ease: "bouncy", // Built-in ease mapping
        resetEase: "elastic",
        duration: 0.4,
        resetDuration: 1,
      }}
    />
  );
}

```
---

🗺️ The Roadmap (2026)
- [ ] TypeScript Core Rewrite: Full type-safety for all presets and config objects.

- [ ] Z-Mobile Tilt: Proximity effects driven by Device Orientation (Gyroscope).

- [ ] Scroll-Proximity Mode: Triggering proximity logic based on Viewport distance (Scroll-bound).

- [ ] Auto-Arabic Support: Intelligent word-based grouping for cursive scripts to maintain typography integrity.

- [ ] Z-SVG Engine: Directly manipulating SVG paths and points via proximity.

- [ ] NPM Official Release: A lightweight, tree-shakable package.
      
---
## 🤝 Contributing
This is a Public Build. If you are a GSAP wizard or a Math enthusiast, your PRs are welcome!

Star the repo to show support! ⭐

Open an Issue for feature requests.

Check the Playground to see the engine in action.

## 👨‍💻 Behind the Engine
Yousef Zedan Creative Developer | Software Engineer

A 17-year-old polymath building the future of the web. I believe that code should be as expressive as art.

## LICENSE: MIT © 2026 Yousef Zedan
